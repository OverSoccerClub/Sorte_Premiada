import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
    constructor(private readonly auditLogService: AuditLogService) { }

    @Get('logs')
    @Roles('ADMIN')
    findAll(
        @Query('entity') entity?: string,
        @Query('userId') userId?: string
    ) {
        return this.auditLogService.findAll({ entity, userId });
    }

    @Get('logs/entity')
    @Roles('ADMIN')
    findByEntity(
        @Query('entity') entity: string,
        @Query('entityId') entityId: string
    ) {
        return this.auditLogService.findByEntity(entity, entityId);
    }
}
