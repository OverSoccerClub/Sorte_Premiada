import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('overview')
    @Roles('ADMIN')
    getOverview() {
        return this.analyticsService.getGlobalOverview();
    }

    @Get('heatmap')
    @Roles('ADMIN')
    getHeatmap() {
        return this.analyticsService.getRegionalHeatmap();
    }

    @Get('growth')
    @Roles('ADMIN')
    getGrowth() {
        return this.analyticsService.getTemporalGrowth();
    }

    @Get('efficiency')
    @Roles('ADMIN')
    getEfficiency() {
        return this.analyticsService.getCambistaEfficiency();
    }
}
