import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SecurityService } from './security.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('security')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SecurityController {
    constructor(private readonly securityService: SecurityService) { }

    @Get('logs')
    @Roles('ADMIN')
    findAllLogs() {
        return this.securityService.findAllLogs();
    }

    @Post('logs/:id/resolve')
    @Roles('ADMIN')
    resolveLog(@Param('id') id: string, @Request() req: any) {
        return this.securityService.resolveLog(id, req.user.userId);
    }
}
