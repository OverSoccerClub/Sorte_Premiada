import { Controller, Post, Body, Get, Put, Delete, Param, UseGuards, Request, Logger, Query } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('devices')
export class DevicesController {
    private readonly logger = new Logger(DevicesController.name);

    constructor(private readonly devicesService: DevicesService) { }

    @Post('register')
    async register(@Body() body: { deviceId: string; model?: string; appVersion?: string }) {
        return this.devicesService.register(body);
    }

    @Post('heartbeat')
    async heartbeat(@Body() body: { deviceId: string; latitude?: number; longitude?: number; currentUserId?: string; status?: string }) {
        return this.devicesService.heartbeat(body);
    }

    /**
     * Lista todos os dispositivos com filtro multi-tenant
     * MASTER: pode filtrar por targetCompanyId ou ver todos
     * ADMIN: vê apenas dispositivos da sua empresa
     */
    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('MASTER', 'ADMIN')
    async findAll(@Request() req: any, @Query('targetCompanyId') targetCompanyId?: string, @Query('q') query?: string) {
        const { role, companyId } = req.user;

        this.logger.log(`GET /devices - Role: ${role}, CompanyId: ${companyId}, TargetCompanyId: ${targetCompanyId}, Query: ${query}`);

        // Determinar o companyId para filtro
        let filterCompanyId = companyId;
        if (role === 'MASTER' && targetCompanyId) {
            filterCompanyId = targetCompanyId;
        }

        // MASTER sem targetCompanyId vê todos, senão filtra por empresa
        let where: any = (role === 'MASTER' && !targetCompanyId) ? {} : { companyId: filterCompanyId };

        // Adicionar filtro de busca se fornecido
        if (query) {
            where = {
                ...where,
                OR: [
                    { deviceId: { contains: query, mode: 'insensitive' } },
                    { name: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } }
                ]
            };
        }

        return this.devicesService.findAllFiltered(where);
    }

    /**
     * Lista dispositivos com localização GPS para mapa
     * MASTER: pode filtrar por targetCompanyId ou ver todos
     * ADMIN: vê apenas dispositivos da sua empresa
     */
    @Get('map')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('MASTER', 'ADMIN')
    async getDevicesMap(@Request() req: any, @Query('targetCompanyId') targetCompanyId?: string) {
        const { role, companyId } = req.user;

        this.logger.log(`GET /devices/map - Role: ${role}, CompanyId: ${companyId}, TargetCompanyId: ${targetCompanyId}`);

        // Determinar o companyId para filtro
        let filterCompanyId = companyId;
        if (role === 'MASTER' && targetCompanyId) {
            filterCompanyId = targetCompanyId;
        }

        // MASTER sem targetCompanyId vê todos, senão filtra por empresa
        const where = (role === 'MASTER' && !targetCompanyId) ? {} : { companyId: filterCompanyId };

        return this.devicesService.findAllWithLocation(where);
    }

    // ========================================
    // ENDPOINTS DE ATIVAÇÃO DE DISPOSITIVOS
    // ========================================

    /**
     * Gera um novo código de ativação
     * Apenas ADMIN pode gerar códigos para sua própria empresa
     */
    @Post('generate-code')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'MASTER')
    async generateActivationCode(
        @Request() req: any,
        @Body() body: { name: string; description?: string; targetCompanyId?: string }
    ) {
        let { companyId } = req.user;

        // MASTER override
        if (req.user.role === 'MASTER' && body.targetCompanyId) {
            companyId = body.targetCompanyId;
        }

        this.logger.log(`POST /devices/generate-code - CompanyId: ${companyId}, Name: ${body.name}`);

        return this.devicesService.generateActivationCode(companyId, body);
    }

    /**
     * Ativa um dispositivo usando código de ativação
     * Endpoint PÚBLICO (não requer autenticação)
     */
    @Post('activate')
    async activateDevice(
        @Body() body: { activationCode: string; deviceId: string }
    ) {
        // Mascarar informações sensíveis nos logs
        const maskedCode = body.activationCode ? `${body.activationCode.substring(0, 5)}***` : 'N/A';
        const maskedDeviceId = body.deviceId ? `${body.deviceId.substring(0, 8)}***` : 'N/A';
        this.logger.log(`POST /devices/activate - Code: ${maskedCode}, DeviceId: ${maskedDeviceId}`);

        return this.devicesService.activateDevice(body.activationCode, body.deviceId);
    }

    /**
     * Desativa um dispositivo remotamente
     * Apenas ADMIN pode desativar dispositivos da sua empresa
     */
    @Put(':id/deactivate')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'MASTER')
    async deactivateDevice(
        @Request() req: any,
        @Param('id') deviceId: string
    ) {
        // Se for MASTER, companyId é opcional (null) para permitir acesso global
        const companyId = req.user.role === 'MASTER' ? undefined : req.user.companyId;

        this.logger.log(`PUT /devices/${deviceId}/deactivate - Action by Role: ${req.user.role}`);

        return this.devicesService.deactivateDevice(deviceId, companyId);
    }

    /**
     * Reativa um dispositivo
     * Apenas ADMIN pode reativar dispositivos da sua empresa
     */
    @Put(':id/reactivate')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'MASTER')
    async reactivateDevice(
        @Request() req: any,
        @Param('id') deviceId: string
    ) {
        // Se for MASTER, companyId é opcional (null) para permitir acesso global
        const companyId = req.user.role === 'MASTER' ? undefined : req.user.companyId;

        this.logger.log(`PUT /devices/${deviceId}/reactivate - Action by Role: ${req.user.role}`);

        return this.devicesService.reactivateDevice(deviceId, companyId);
    }

    /**
     * Força a desvinculação de um dispositivo por deviceId físico (MASTER ONLY)
     * Deleta TODOS os registros relacionados ao deviceId, permitindo nova ativação
     */
    @Post('force-unbind')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('MASTER')
    async forceUnbind(
        @Body() body: { deviceId: string }
    ) {
        this.logger.log(`POST /devices/force-unbind - DeviceId: ${body.deviceId} (MASTER ONLY)`);
        return this.devicesService.forceUnbind(body.deviceId);
    }

    /**
     * Remove registros duplicados de dispositivos
     * ADMIN: limpa duplicados da sua empresa
     * MASTER: pode limpar duplicados de qualquer empresa
     */
    @Post('cleanup-duplicates')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'MASTER')
    async cleanupDuplicates(
        @Request() req: any,
        @Body() body: { targetCompanyId?: string }
    ) {
        let { companyId } = req.user;

        // MASTER override
        if (req.user.role === 'MASTER' && body.targetCompanyId) {
            companyId = body.targetCompanyId;
        }

        this.logger.log(`POST /devices/cleanup-duplicates - CompanyId: ${companyId}`);
        return this.devicesService.cleanupDuplicateDevices(companyId);
    }

    /**
     * Remove/Exclui um dispositivo do sistema por ID
     * Apenas MASTER pode fazer isso. Usado para remover códigos de ativação não usados ou limpar registros.
     */
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('MASTER')
    async delete(
        @Param('id') deviceId: string
    ) {
        this.logger.log(`DELETE /devices/${deviceId} - Action: DELETE (MASTER ONLY)`);
        return this.devicesService.delete(deviceId);
    }
}
