import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
    constructor(private readonly auditLogService: AuditLogService) { }

    @Get('logs')
    @Roles('ADMIN')
    findAll(
        @Request() req: any,
        @Query('entity') entity?: string,
        @Query('userId') userId?: string
    ) {
        return this.auditLogService.findAll({
            entity,
            userId,
            companyId: req.user?.companyId
        });
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
