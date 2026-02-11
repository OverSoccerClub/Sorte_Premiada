import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role } from '@repo/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import * as bcrypt from 'bcrypt';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly prisma: PrismaService
    ) { }

    // ... (rest of methods)

    @Post('sync-permissions')
    @UseGuards(JwtAuthGuard)
    async syncPermissions(@Request() req: any) {
        if (req.user.role !== 'MASTER') {
            throw new ForbiddenException('Apenas MASTER pode sincronizar permissões.');
        }

        const PERMISSIONS = {
            MANAGE_USERS: 'MANAGE_USERS',
            CREATE_CAMBISTA: 'CREATE_CAMBISTA', EDIT_CAMBISTA: 'EDIT_CAMBISTA', DELETE_CAMBISTA: 'DELETE_CAMBISTA',
            CREATE_COBRADOR: 'CREATE_COBRADOR', EDIT_COBRADOR: 'EDIT_COBRADOR', DELETE_COBRADOR: 'DELETE_COBRADOR',
            CREATE_ADMIN: 'CREATE_ADMIN', EDIT_ADMIN: 'EDIT_ADMIN', DELETE_ADMIN: 'DELETE_ADMIN',
            EDIT_USER_LIMITS: 'EDIT_USER_LIMITS',
            VIEW_GAMES: 'VIEW_GAMES', CREATE_GAME: 'CREATE_GAME', EDIT_GAME: 'EDIT_GAME', DELETE_GAME: 'DELETE_GAME',
            VIEW_DRAWS: 'VIEW_DRAWS', CREATE_DRAW: 'CREATE_DRAW', EDIT_DRAW: 'EDIT_DRAW', DELETE_DRAW: 'DELETE_DRAW',
            VIEW_AREAS: 'VIEW_AREAS', CREATE_AREA: 'CREATE_AREA', EDIT_AREA: 'EDIT_AREA', DELETE_AREA: 'DELETE_AREA',
            VIEW_SALES_REPORT: 'VIEW_SALES_REPORT', VIEW_FINANCIAL_REPORT: 'VIEW_FINANCIAL_REPORT',
            VIEW_ANALYTICS: 'VIEW_ANALYTICS', EXPORT_REPORTS: 'EXPORT_REPORTS', VIEW_AUDIT_LOGS: 'VIEW_AUDIT_LOGS',
            VIEW_FINANCIALS: 'VIEW_FINANCIALS', MANAGE_PAYMENTS: 'MANAGE_PAYMENTS', VIEW_COMMISSIONS: 'VIEW_COMMISSIONS',
            EDIT_COMMISSIONS: 'EDIT_COMMISSIONS', MANAGE_DAILY_CLOSE: 'MANAGE_DAILY_CLOSE',
            VIEW_TICKETS: 'VIEW_TICKETS', CANCEL_TICKET: 'CANCEL_TICKET', VALIDATE_TICKET: 'VALIDATE_TICKET', EDIT_TICKET: 'EDIT_TICKET',
            MANAGE_SETTINGS: 'MANAGE_SETTINGS', MANAGE_COMPANY: 'MANAGE_COMPANY', MANAGE_DEVICES: 'MANAGE_DEVICES',
            VIEW_LOGS: 'VIEW_LOGS', MANAGE_ANNOUNCEMENTS: 'MANAGE_ANNOUNCEMENTS'
        };

        const DEFAULT_PERMISSIONS = {
            ADMIN: {
                [PERMISSIONS.MANAGE_USERS]: true,
                [PERMISSIONS.CREATE_CAMBISTA]: true, [PERMISSIONS.EDIT_CAMBISTA]: true, [PERMISSIONS.DELETE_CAMBISTA]: true,
                [PERMISSIONS.CREATE_COBRADOR]: true, [PERMISSIONS.EDIT_COBRADOR]: true, [PERMISSIONS.DELETE_COBRADOR]: true,
                [PERMISSIONS.EDIT_USER_LIMITS]: true, [PERMISSIONS.VIEW_GAMES]: true, [PERMISSIONS.VIEW_DRAWS]: true,
                [PERMISSIONS.VIEW_AREAS]: true, [PERMISSIONS.CREATE_AREA]: true, [PERMISSIONS.EDIT_AREA]: true, [PERMISSIONS.DELETE_AREA]: true,
                [PERMISSIONS.VIEW_SALES_REPORT]: true, [PERMISSIONS.VIEW_ANALYTICS]: true, [PERMISSIONS.EXPORT_REPORTS]: true,
                [PERMISSIONS.VIEW_FINANCIALS]: true, [PERMISSIONS.MANAGE_PAYMENTS]: true, [PERMISSIONS.VIEW_COMMISSIONS]: true,
                [PERMISSIONS.MANAGE_DAILY_CLOSE]: true, [PERMISSIONS.VIEW_TICKETS]: true, [PERMISSIONS.CANCEL_TICKET]: true,
                [PERMISSIONS.VALIDATE_TICKET]: true, [PERMISSIONS.MANAGE_DEVICES]: true,
            },
            GERENTE: {
                [PERMISSIONS.MANAGE_USERS]: true, [PERMISSIONS.CREATE_CAMBISTA]: true, [PERMISSIONS.EDIT_CAMBISTA]: true,
                [PERMISSIONS.EDIT_USER_LIMITS]: true, [PERMISSIONS.VIEW_GAMES]: true, [PERMISSIONS.VIEW_DRAWS]: true,
                [PERMISSIONS.VIEW_AREAS]: true, [PERMISSIONS.VIEW_SALES_REPORT]: true, [PERMISSIONS.VIEW_ANALYTICS]: true,
                [PERMISSIONS.VIEW_FINANCIALS]: true, [PERMISSIONS.MANAGE_PAYMENTS]: true, [PERMISSIONS.MANAGE_DAILY_CLOSE]: true,
                [PERMISSIONS.VIEW_TICKETS]: true, [PERMISSIONS.CANCEL_TICKET]: true, [PERMISSIONS.VALIDATE_TICKET]: true,
            },
            SUPERVISOR: {
                [PERMISSIONS.MANAGE_USERS]: true, [PERMISSIONS.VIEW_SALES_REPORT]: true,
                [PERMISSIONS.VIEW_TICKETS]: true, [PERMISSIONS.VALIDATE_TICKET]: true,
            },
            COBRADOR: {
                [PERMISSIONS.MANAGE_USERS]: true, [PERMISSIONS.CREATE_CAMBISTA]: true, [PERMISSIONS.EDIT_CAMBISTA]: true,
                [PERMISSIONS.VIEW_FINANCIALS]: true, [PERMISSIONS.MANAGE_PAYMENTS]: true, [PERMISSIONS.MANAGE_DAILY_CLOSE]: true,
                [PERMISSIONS.VIEW_SALES_REPORT]: true,
            },
            CAMBISTA: {
                [PERMISSIONS.VIEW_GAMES]: true, [PERMISSIONS.VIEW_DRAWS]: true,
                [PERMISSIONS.VIEW_TICKETS]: true, [PERMISSIONS.VALIDATE_TICKET]: true,
            }
        };

        const rolesToSync = [
            { role: Role.ADMIN, permissions: DEFAULT_PERMISSIONS.ADMIN },
            { role: Role.COBRADOR, permissions: DEFAULT_PERMISSIONS.COBRADOR },
            { role: Role.CAMBISTA, permissions: DEFAULT_PERMISSIONS.CAMBISTA }
        ];

        let updatedCount = 0;

        try {
            console.log('[UsersController] Starting permissions sync (Direct Prisma Mode)...');

            for (const roleDef of rolesToSync) {
                console.log(`[UsersController] Syncing role: ${roleDef.role}`);
                const result = await this.prisma.client.user.updateMany({
                    where: { role: roleDef.role },
                    data: { permissions: roleDef.permissions }
                });
                updatedCount += result.count;
            }
        } catch (error) {
            console.error('[UsersController] Error syncing permissions:', error);
            throw new BadRequestException(`Erro ao sincronizar permissões: ${error.message}`);
        }

        return { message: 'Permissões sincronizadas com sucesso (Modo Direto)', updated: updatedCount };
    }

    /**
     * Helper: Verifica se usuário tem permissão específica
     */
    private hasPermission(user: any, permission: string): boolean {
        if (user.role === 'MASTER') return true;
        return user.permissions?.[permission] === true;
    }

    @Patch('push-token')
    @UseGuards(JwtAuthGuard)
    async updatePushToken(@Request() req: any, @Body('pushToken') pushToken: string) {
        return this.usersService.updatePushToken(req.user.userId, pushToken); // userId vem do JWT strategy
    }

    @Get('profile')
    getProfile(@Request() req: any) {
        console.log('UsersController: getProfile called', req.user);
        return this.usersService.findById(req.user.userId);
    }

    @Patch('profile')
    async updateProfile(@Request() req: any, @Body() updateUserDto: Prisma.UserUpdateInput) {
        if (updateUserDto.password && typeof updateUserDto.password === 'string') {
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
        }
        return this.usersService.update(req.user.userId, updateUserDto, req.user.userId);
    }

    @Post()
    async create(@Body() createUserDto: any, @Request() req: any, @Query('targetCompanyId') targetCompanyId?: string) {
        const role = createUserDto.role;

        // Validar permissão baseada no tipo de usuário
        if (role === 'CAMBISTA' && !this.hasPermission(req.user, 'CREATE_CAMBISTA')) {
            throw new ForbiddenException('Você não tem permissão para criar cambistas');
        }
        if (role === 'COBRADOR' && !this.hasPermission(req.user, 'CREATE_COBRADOR')) {
            throw new ForbiddenException('Você não tem permissão para criar cobradores');
        }
        if (role === 'ADMIN' && !this.hasPermission(req.user, 'CREATE_ADMIN')) {
            throw new ForbiddenException('Você não tem permissão para criar administradores');
        }
        // Determinar o companyId correto
        let companyId = req.user.companyId;
        if (req.user.role === 'MASTER' && targetCompanyId) {
            companyId = targetCompanyId;
        }

        // Extrair areaId e username se vier no body
        // Extrair campos que não devem ir no restDto (serão tratados manualmente ou filtrados pelo Prisma)
        const { areaId, neighborhoodId, username, companyId: _cid, company: _c, ...restDto } = createUserDto;

        // Limpeza extra para garantir que não haja conflito com a extensão de Tenant ou Tipos do Prisma
        delete (restDto as any).companyId;
        delete (restDto as any).company;
        delete (restDto as any).areaId;
        delete (restDto as any).neighborhoodId;

        // Validar e inferir Company ID a partir da Área se necessário
        if (areaId) {
            const area = await this.usersService.getArea(areaId);
            if (area) {
                if (companyId && companyId !== area.companyId) {
                    // Conflito: Tentando criar usuário numa empresa com área de outra
                    throw new ConflictException(`A praça selecionada pertence a outra empresa. Verifique a empresa selecionada.`);
                }
                // Se companyId não estava definido (ex: Master em visão global), usa o da área
                if (!companyId) {
                    companyId = area.companyId;
                }
            }
        }

        // Validar criação de MASTER
        if (createUserDto.role === 'MASTER') {
            if (req.user.role !== 'MASTER') {
                throw new ForbiddenException('Apenas usuários MASTER podem criar outros MASTERs.');
            }
            // MASTER pode ser criado sem empresa (global) ou vinculado a uma empresa
            // Se não tiver companyId, é um MASTER global.
        } else {
            // Se não for MASTER, garantir que temos um companyId (para outros roles)
            if (!companyId) {
                // Tentar pegar da área se disponível, já feito acima
                throw new ConflictException('Não foi possível determinar a empresa para este usuário.');
            }
        }

        try {
            const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

            // Gerar username automaticamente para CAMBISTA
            let generatedUsername = username; // Usar username fornecido se não for CAMBISTA

            if (createUserDto.role === 'CAMBISTA') {
                if (!createUserDto.name) {
                    throw new ConflictException('Nome completo é obrigatório para gerar o login do cambista.');
                }
                // Gerar username baseado em nome + empresa
                generatedUsername = await this.usersService.generateUsername(createUserDto.name, companyId);
            } else if (!username) {
                // Para outros roles, username é obrigatório se não for gerado automaticamente
                throw new ConflictException('Nome de usuário é obrigatório.');
            }

            const data: Prisma.UserCreateInput = {
                ...restDto,
                username: generatedUsername,
                password: hashedPassword,
            };

            if (companyId) {
                data.company = { connect: { id: companyId } };
            }

            // Se tiver areaId, conectar à área
            if (areaId) {
                data.area = { connect: { id: areaId } };
            }

            // Se tiver neighborhoodId, conectar ao bairro (apenas se não for string vazia)
            if (neighborhoodId && typeof neighborhoodId === 'string' && neighborhoodId.length > 0) {
                data.neighborhood = { connect: { id: neighborhoodId } };
            }

            return await this.usersService.create(data);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    // Fallback para email ou race conditions
                    const target = error.meta?.target as string[];
                    if (target && target.includes('email')) {
                        throw new ConflictException('Este email já está cadastrado no sistema.');
                    }
                    throw new ConflictException('Usuário ou Email já cadastrado no sistema.');
                }
            }
            throw error;
        }
    }

    @Get()
    @RequirePermissions('MANAGE_USERS')
    async findAll(
        @Request() req: any,
        @Query('username') username?: string,
        @Query('role') role?: string,
        @Query('targetCompanyId') targetCompanyId?: string
    ) {
        let companyId = req.user.companyId;

        // Apenas MASTER pode acessar outra empresa
        if (targetCompanyId) {
            if (req.user.role !== 'MASTER' && targetCompanyId !== req.user.companyId) {
                throw new ForbiddenException('Apenas MASTER pode acessar dados de outras empresas');
            }
            companyId = targetCompanyId;
        }

        const users = await this.usersService.findAll(username, role, req.user.userId, companyId);
        return users;
    }

    @Get(':id')
    @RequirePermissions('MANAGE_USERS')
    async findOne(@Param('id') id: string, @Request() req: any) {
        const user = await this.usersService.findById(id);

        if (!user) {
            throw new ForbiddenException('Usuário não encontrado');
        }

        // Validar que o usuário pertence à empresa do admin
        if (user.companyId !== req.user.companyId && req.user.role !== 'MASTER') {
            throw new ForbiddenException('Acesso negado a este usuário');
        }

        return user;
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateUserDto: any, @Request() req: any) {
        // Buscar usuário para validar companyId e permissões (Direto Prisma)
        const user = await this.prisma.client.user.findUnique({ where: { id } });

        if (!user) {
            throw new ForbiddenException('Usuário não encontrado');
        }

        // Validar permissão baseada no tipo de usuário
        if (user.role === Role.CAMBISTA && !this.hasPermission(req.user, 'EDIT_CAMBISTA')) {
            throw new ForbiddenException('Você não tem permissão para editar cambistas');
        }
        if (user.role === Role.COBRADOR && !this.hasPermission(req.user, 'EDIT_COBRADOR')) {
            throw new ForbiddenException('Você não tem permissão para editar cobradores');
        }
        if (user.role === Role.ADMIN && !this.hasPermission(req.user, 'EDIT_ADMIN')) {
            throw new ForbiddenException('Você não tem permissão para editar administradores');
        }

        // Validar que o usuário pertence à empresa do admin
        if (user.companyId !== req.user.companyId && req.user.role !== 'MASTER') {
            throw new ForbiddenException('Acesso negado a este usuário');
        }

        // Extrair areaId, neighborhoodId e campos que não devem ir no restDto
        const { areaId, neighborhoodId, companyId: _cid, company: _c, ...restDto } = updateUserDto;

        // Limpeza extra
        delete (restDto as any).companyId;
        delete (restDto as any).company;
        delete (restDto as any).areaId;
        delete (restDto as any).neighborhoodId;
        delete (restDto as any).neighborhood; // FIX: Prevent Prisma relation error if sent as string

        // Impedir alteração de username se não for MASTER (opcional, mas seguro)
        if (req.user.role !== 'MASTER') {
            delete (restDto as any).username;
        }

        const data: Prisma.UserUpdateInput = { ...restDto };

        if (updateUserDto.password && typeof updateUserDto.password === 'string') {
            data.password = await bcrypt.hash(updateUserDto.password, 10);
        }

        // Se tiver areaId, conectar à área (ou trocar)
        if (areaId) {
            data.area = { connect: { id: areaId } };
        }

        // Tratamento de Neighborhood (Bairro)
        if (neighborhoodId && typeof neighborhoodId === 'string' && neighborhoodId.length > 0) {
            data.neighborhood = { connect: { id: neighborhoodId } };
        } else if (neighborhoodId === '' || neighborhoodId === null) {
            data.neighborhood = { disconnect: true };
        }

        // Atualizar lastModifiedBy (removido para correção de build)
        // data.lastModifiedBy = req.user.userId;

        console.log(`[UsersController] Direct Update for ID: ${id}`);
        return this.prisma.client.user.update({
            where: { id },
            data
        });
    }

    @Delete(':id')
    async remove(
        @Param('id') id: string,
        @Request() req: any,
        @Query('force') force?: string
    ) {
        console.log(`[UsersController] Remove called for ID: ${id}, Force: ${force}, Role: ${req.user.role}`);
        // Buscar usuário para validar companyId e permissões
        const user = await this.usersService.findById(id);

        if (!user) {
            throw new ForbiddenException('Usuário não encontrado');
        }

        // Validar permissão baseada no tipo de usuário
        if (user.role === 'CAMBISTA' && !this.hasPermission(req.user, 'DELETE_CAMBISTA')) {
            throw new ForbiddenException('Você não tem permissão para excluir cambistas');
        }
        if (user.role === 'COBRADOR' && !this.hasPermission(req.user, 'DELETE_COBRADOR')) {
            throw new ForbiddenException('Você não tem permissão para excluir cobradores');
        }
        if (user.role === 'ADMIN' && !this.hasPermission(req.user, 'DELETE_ADMIN')) {
            throw new ForbiddenException('Você não tem permissão para excluir administradores');
        }

        // Validar que o usuário pertence à empresa do admin
        if (user.companyId !== req.user.companyId && req.user.role !== 'MASTER') {
            throw new ForbiddenException('Acesso negado a este usuário');
        }

        const isForce = force === 'true';

        // Apenas MASTER pode forçar exclusão (Hard Delete)
        if (isForce && req.user.role !== 'MASTER') {
            throw new ForbiddenException('Apenas usuários MASTER podem forçar a exclusão completa de usuários com histórico financeiro.');
        }

        return this.usersService.remove(id, isForce);
    }

    @Patch(':id/limit')
    @RequirePermissions('EDIT_USER_LIMITS')
    async updateLimit(@Param('id') id: string, @Body() body: { salesLimit?: number, limitOverrideExpiresAt?: Date | string, accountabilityLimitHours?: number }, @Request() req: any) {
        // Buscar usuário para validar companyId
        const user = await this.usersService.findById(id);

        if (!user) {
            throw new ForbiddenException('Usuário não encontrado');
        }

        // Validar que o usuário pertence à empresa do admin
        if (user.companyId !== req.user.companyId && req.user.role !== 'MASTER') {
            throw new ForbiddenException('Acesso negado a este usuário');
        }

        const data: Prisma.UserUpdateInput = {};
        if (body.salesLimit !== undefined) data.salesLimit = body.salesLimit;
        if (body.limitOverrideExpiresAt !== undefined) data.limitOverrideExpiresAt = body.limitOverrideExpiresAt;
        if (body.accountabilityLimitHours !== undefined) data.accountabilityLimitHours = body.accountabilityLimitHours;

        return this.usersService.update(id, data, req.user.userId);
    }

}
