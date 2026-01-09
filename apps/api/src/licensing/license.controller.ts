import {
    Controller,
    Get,
    Put,
    Param,
    Body,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    Logger,
    BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { User } from '../auth/user.decorator';
import { LicenseService } from './license.service';
import { SkipLicenseCheck } from './skip-license-check.decorator';

/**
 * Controller para gerenciamento de licenças (MASTER only)
 * Permite ativar, suspender, renovar e atualizar limites de empresas
 */
@Controller('license')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MASTER')
@SkipLicenseCheck() // MASTER não precisa verificar própria licença
export class LicenseController {
    private readonly logger = new Logger(LicenseController.name);

    constructor(private licenseService: LicenseService) { }

    /**
     * Listar todas as licenças
     * GET /license/all
     */
    @Get('all')
    async getAllLicenses() {
        // Calcular datas do mês atual
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // Buscar todas as empresas
        const companies = await this.licenseService['prisma'].company.findMany({
            select: {
                id: true,
                companyName: true,
                slug: true,
                licenseStatus: true,
                licenseStartDate: true,
                licenseExpiresAt: true,
                trialEndsAt: true,
                subscriptionPlan: true,
                monthlyPrice: true,
                isActive: true,
                suspendedAt: true,
                suspensionReason: true,
                maxUsers: true,
                maxTicketsPerMonth: true,
                maxGames: true,
                maxActiveDevices: true,
                _count: {
                    select: {
                        users: true,
                        games: true,
                    },
                },
            },
            orderBy: {
                companyName: 'asc',
            },
        });

        // Contar bilhetes do mês para cada empresa (Agregado)
        const ticketsCounts = await this.licenseService['prisma'].ticket.groupBy({
            by: ['companyId'],
            where: {
                createdAt: {
                    gte: firstDayOfMonth,
                    lte: lastDayOfMonth,
                },
            },
            _count: {
                _all: true,
            },
        });

        // Map para acesso rápido aos bilhetes
        const ticketsMap = new Map();
        ticketsCounts.forEach(t => {
            ticketsMap.set(t.companyId, t._count._all);
        });

        // Contar dispositivos ativos para cada empresa (Agregado)
        const devicesCounts = await this.licenseService['prisma'].posTerminal.groupBy({
            by: ['companyId'],
            where: {
                status: 'ONLINE', // Contar apenas dispositivos online como "ativos"
            },
            _count: {
                _all: true,
            },
        });

        // Map para acesso rápido aos dispositivos
        const devicesMap = new Map();
        devicesCounts.forEach(d => {
            devicesMap.set(d.companyId, d._count._all);
        });

        // Montar resposta
        const licensesWithDetails = companies.map(company => {
            const daysRemaining = this.licenseService.calculateDaysRemaining(company.licenseExpiresAt);
            const trialDaysRemaining = this.licenseService.calculateDaysRemaining(company.trialEndsAt);
            const monthlyTickets = ticketsMap.get(company.id) || 0;
            const activeDevices = devicesMap.get(company.id) || 0;

            return {
                ...company,
                daysRemaining,
                trialDaysRemaining,
                usage: {
                    users: company._count.users,
                    games: company._count.games,
                    tickets: monthlyTickets,
                    devices: activeDevices,
                },
            };
        });

        return {
            total: licensesWithDetails.length,
            licenses: licensesWithDetails,
        };
    }

    /**
     * Ver detalhes de uma licença específica
     * GET /license/:companyId
     */
    @Get(':companyId')
    async getLicense(@Param('companyId') companyId: string) {
        const status = await this.licenseService.checkLicenseStatus(companyId);
        const limits = await this.licenseService.checkUsageLimits(companyId);
        const history = await this.licenseService.getLicenseHistory(companyId, 20);

        return {
            status,
            limits,
            history,
        };
    }

    /**
     * Ativar uma empresa suspensa
     * PUT /license/:companyId/activate
     */
    @Put(':companyId/activate')
    @HttpCode(HttpStatus.OK)
    async activateCompany(
        @Param('companyId') companyId: string,
        @User() user: any,
    ) {
        this.logger.log(`PUT /license/${companyId}/activate - User: ${JSON.stringify(user)}`);

        if (!user || !user.id) {
            this.logger.error('User or user.id is missing from @User() decorator');
            throw new BadRequestException('Usuário não autenticado corretamente');
        }

        const company = await this.licenseService.activateCompany(
            companyId,
            user.id,
            user.name || user.username,
        );

        return {
            message: 'Empresa ativada com sucesso',
            company: {
                id: company.id,
                companyName: company.companyName,
                licenseStatus: company.licenseStatus,
                isActive: company.isActive,
            },
        };
    }

    /**
     * Suspender uma empresa
     * PUT /license/:companyId/suspend
     * Body: { reason: string }
     */
    @Put(':companyId/suspend')
    @HttpCode(HttpStatus.OK)
    async suspendCompany(
        @Param('companyId') companyId: string,
        @Body('reason') reason: string,
        @User() user: any,
    ) {
        this.logger.log(`PUT /license/${companyId}/suspend - User: ${user?.id}`);

        if (!reason) {
            throw new BadRequestException('Motivo da suspensão é obrigatório');
        }

        if (!user || !user.id) {
            throw new BadRequestException('Usuário não autenticado corretamente');
        }

        const company = await this.licenseService.suspendCompany(
            companyId,
            reason,
            user.id,
            user.name || user.username,
        );

        return {
            message: 'Empresa suspensa com sucesso',
            company: {
                id: company.id,
                companyName: company.companyName,
                licenseStatus: company.licenseStatus,
                isActive: company.isActive,
                suspendedAt: company.suspendedAt,
                suspensionReason: company.suspensionReason,
            },
        };
    }

    /**
     * Renovar licença de uma empresa
     * PUT /license/:companyId/renew
     * Body: { months: number }
     */
    @Put(':companyId/renew')
    @HttpCode(HttpStatus.OK)
    async renewLicense(
        @Param('companyId') companyId: string,
        @Body('months') months: number,
        @User() user: any,
    ) {
        this.logger.log(`PUT /license/${companyId}/renew - User: ${user?.id}, Months: ${months}`);

        if (!months || months < 1) {
            throw new BadRequestException('Número de meses inválido (mínimo 1)');
        }

        if (!user || !user.id) {
            throw new BadRequestException('Usuário não autenticado corretamente');
        }

        const company = await this.licenseService.renewLicense(
            companyId,
            months,
            user.id,
            user.name || user.username,
        );

        return {
            message: `Licença renovada por ${months} mês(es)`,
            company: {
                id: company.id,
                companyName: company.companyName,
                licenseStatus: company.licenseStatus,
                licenseExpiresAt: company.licenseExpiresAt,
            },
        };
    }

    /**
     * Atualizar limites de uso de uma empresa
     * PUT /license/:companyId/limits
     * Body: { maxUsers?: number, maxTicketsPerMonth?: number, maxGames?: number }
     */
    @Put(':companyId/limits')
    @HttpCode(HttpStatus.OK)
    async updateLimits(
        @Param('companyId') companyId: string,
        @Body() limits: {
            maxUsers?: number;
            maxTicketsPerMonth?: number;
            maxGames?: number;
            maxActiveDevices?: number;
        },
        @User() user: any,
    ) {
        this.logger.log(`PUT /license/${companyId}/limits - User: ${user?.id}`);

        if (!limits.maxUsers && !limits.maxTicketsPerMonth && !limits.maxGames && !limits.maxActiveDevices) {
            throw new BadRequestException('Pelo menos um limite deve ser fornecido');
        }

        if (!user || !user.id) {
            throw new BadRequestException('Usuário não autenticado corretamente');
        }

        const company = await this.licenseService.updateLimits(
            companyId,
            limits,
            user.id,
            user.name || user.username,
        );

        return {
            message: 'Limites atualizados com sucesso',
            company: {
                id: company.id,
                companyName: company.companyName,
                maxUsers: company.maxUsers,
                maxTicketsPerMonth: company.maxTicketsPerMonth,
                maxGames: company.maxGames,
                maxActiveDevices: company.maxActiveDevices,
            },
        };
    }

    /**
     * Ver histórico de mudanças de uma licença
     * GET /license/:companyId/history?limit=50
     */
    @Get(':companyId/history')
    async getLicenseHistory(
        @Param('companyId') companyId: string,
        @Query('limit') limit?: string,
    ) {
        const limitNum = limit ? parseInt(limit, 10) : 50;
        const history = await this.licenseService.getLicenseHistory(companyId, limitNum);

        return {
            total: history.length,
            history,
        };
    }
}
