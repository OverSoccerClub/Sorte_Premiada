import { Controller, Get, Put, Post, Body, UseGuards, Query, Param, ForbiddenException, BadRequestException, Request } from '@nestjs/common';
import { CompanyService } from './company.service';
import type { UpdateCompanySettingsDto } from './company.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { User } from '../auth/user.decorator';
import { SkipLicenseCheck } from '../licensing/skip-license-check.decorator';

@Controller('company')
export class CompanyController {
    constructor(private readonly companyService: CompanyService) { }

    /**
     * POST /company
     * MASTER only - Create a new company
     * 
     * SEGURANÇA: Apenas MASTER pode criar empresas
     */
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('MASTER')
    async create(@Body() data: any) {
        // Validar dados obrigatórios
        if (!data.slug || !data.companyName || !data.adminName || !data.adminUsername) {
            throw new BadRequestException('Dados obrigatórios faltando: slug, companyName, adminName, adminUsername');
        }

        return this.companyService.createCompany(data);
    }

    /**
     * GET /company/all
     * MASTER only - List all companies
     * 
     * SEGURANÇA: Apenas MASTER pode listar todas as empresas
     */
    @Get('all')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('MASTER')
    async findAll() {
        return this.companyService.findAll();
    }

    /**
     * GET /company/settings
     * Public endpoint - returns company settings for branding
     * Optional ?slug=... to get specific company
     * Optional ?targetCompanyId=... for MASTER to get specific company
     * 
     * SEGURANÇA: 
     * - Público pode acessar via slug (para white-label)
     * - MASTER pode acessar qualquer empresa via targetCompanyId (Requer Token Válido)
     * - Usuários autenticados recebem settings da própria empresa
     */
    @Get('settings')
    @UseGuards(OptionalJwtAuthGuard)
    @SkipLicenseCheck()
    async getSettings(
        @Query('slug') slug?: string,
        @Query('targetCompanyId') targetCompanyId?: string,
        @User() user?: any,
        @Request() req?: any
    ) {
        // PRIORITY 1: Check for device token (x-device-token header)
        const deviceToken = req?.headers?.['x-device-token'];
        if (deviceToken) {
            try {
                // Validate device token and get companyId
                const device = await this.companyService.validateDeviceToken(deviceToken);
                if (device?.companyId) {
                    return this.companyService.getPublicSettings(undefined, device.companyId);
                }
            } catch (error) {
                // Device token invalid - if it was provided, we MUST return error
                // so the app can clear activation state.
                console.warn(`[CompanyController] Invalid device token: ${error.message}`);
                throw error; // Rethrow to return 401/403
            }
        }

        // PRIORITY 2: Se MASTER e targetCompanyId fornecido, retornar essa empresa
        // Agora o user será populado se o token for válido, graças ao OptionalJwtAuthGuard
        if (user?.role === 'MASTER' && targetCompanyId) {
            return this.companyService.getPublicSettings(undefined, targetCompanyId);
        }

        // PRIORITY 3: Se slug fornecido (white-label), retornar essa empresa
        if (slug) {
            return this.companyService.getPublicSettings(slug);
        }

        // PRIORITY 4: Se usuário autenticado, retornar empresa dele
        if (user?.companyId) {
            return this.companyService.getPublicSettings(undefined, user.companyId);
        }

        // Fallback: retornar empresa default ou vazio
        try {
            return await this.companyService.getPublicSettings();
        } catch (error) {
            // Se falhar (ex: nenhuma empresa criada), retornar objeto vazio seguro para não quebrar o front
            return {
                companyName: 'Sorte Premiada',
                primaryColor: '#50C878',
            };
        }
    }

    /**
     * PUT /company/settings
     * Admin/Master updates company settings
     * 
     * SEGURANÇA CRÍTICA:
     * - ADMIN só pode atualizar sua própria empresa
     * - MASTER pode atualizar qualquer empresa via targetCompanyId
     * - Validação rigorosa de ownership
     */
    @Put('settings')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'MASTER')
    async updateSettings(
        @Body() data: UpdateCompanySettingsDto,
        @User() user: any,
        @Query('targetCompanyId') targetCompanyId?: string
    ) {
        let companyId: string;

        // MASTER pode atualizar qualquer empresa
        if (user.role === 'MASTER' && targetCompanyId) {
            companyId = targetCompanyId;
        }
        // ADMIN só pode atualizar sua própria empresa
        else if (user.role === 'ADMIN') {
            if (!user.companyId) {
                throw new ForbiddenException('Usuário ADMIN sem empresa associada');
            }

            // SEGURANÇA: Prevenir que ADMIN tente atualizar outra empresa
            if (targetCompanyId && targetCompanyId !== user.companyId) {
                throw new ForbiddenException('ADMIN não pode atualizar configurações de outra empresa');
            }

            companyId = user.companyId;
        }
        // MASTER sem targetCompanyId - usar sua própria empresa se tiver
        else if (user.role === 'MASTER') {
            if (!user.companyId) {
                // Fallback para empresa default
                const defaultCompany = await this.companyService.getCompany();
                companyId = defaultCompany.id;
            } else {
                companyId = user.companyId;
            }
        }
        else {
            throw new ForbiddenException('Permissão negada para atualizar configurações da empresa');
        }

        return this.companyService.updateSettings(companyId, data);
    }
}
