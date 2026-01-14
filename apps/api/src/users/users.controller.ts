import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, ForbiddenException, ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { Prisma } from '@repo/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import * as bcrypt from 'bcrypt';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

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
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'MASTER')
    async create(@Body() createUserDto: any, @Request() req: any, @Query('targetCompanyId') targetCompanyId?: string) {
        // Determinar o companyId correto
        let companyId = req.user.companyId;
        if (req.user.role === 'MASTER' && targetCompanyId) {
            companyId = targetCompanyId;
        }

        // Extrair areaId e username se vier no body
        // Extrair campos que não devem ir no restDto (serão tratados manualmente ou filtrados pelo Prisma)
        const { areaId, username, companyId: _cid, company: _c, ...restDto } = createUserDto;

        // Limpeza extra para garantir que não haja conflito com a extensão de Tenant ou Tipos do Prisma
        delete (restDto as any).companyId;
        delete (restDto as any).company;
        delete (restDto as any).areaId;

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
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'COBRADOR', 'MASTER')
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
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'MASTER')
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
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'MASTER')
    async update(@Param('id') id: string, @Body() updateUserDto: Prisma.UserUpdateInput, @Request() req: any) {
        // Buscar usuário para validar companyId
        const user = await this.usersService.findById(id);

        if (!user) {
            throw new ForbiddenException('Usuário não encontrado');
        }

        // Validar que o usuário pertence à empresa do admin
        if (user.companyId !== req.user.companyId && req.user.role !== 'MASTER') {
            throw new ForbiddenException('Acesso negado a este usuário');
        }

        if (updateUserDto.password && typeof updateUserDto.password === 'string') {
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
        }
        return this.usersService.update(id, updateUserDto, req.user.userId);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'MASTER')
    async remove(@Param('id') id: string, @Request() req: any) {
        // Buscar usuário para validar companyId
        const user = await this.usersService.findById(id);

        if (!user) {
            throw new ForbiddenException('Usuário não encontrado');
        }

        // Validar que o usuário pertence à empresa do admin
        if (user.companyId !== req.user.companyId && req.user.role !== 'MASTER') {
            throw new ForbiddenException('Acesso negado a este usuário');
        }

        return this.usersService.remove(id);
    }

    @Patch(':id/limit')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'MASTER')
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
