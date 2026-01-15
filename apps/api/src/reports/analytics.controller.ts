import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { User } from '../auth/user.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('overview')
    @Roles('ADMIN')
    getOverview(@User() user: any) {
        return this.analyticsService.getGlobalOverview(user.companyId);
    }

    @Get('heatmap')
    @Roles('ADMIN')
    getHeatmap(@User() user: any) {
        return this.analyticsService.getRegionalHeatmap(user.companyId);
    }

    @Get('growth')
    @Roles('ADMIN')
    getGrowth(@User() user: any) {
        return this.analyticsService.getTemporalGrowth(user.companyId);
    }

    @Get('efficiency')
    @Roles('ADMIN')
    getEfficiency(@User() user: any) {
        return this.analyticsService.getCambistaEfficiency(user.companyId);
    }
}
