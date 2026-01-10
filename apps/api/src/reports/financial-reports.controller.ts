import { Controller, Get, Query, UseGuards, Logger } from '@nestjs/common';
import { FinancialReportsService } from './financial-reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('reports/financial')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinancialReportsController {
    private readonly logger = new Logger(FinancialReportsController.name);

    constructor(private readonly service: FinancialReportsService) { }

    @Get('metrics')
    @Roles('MASTER')
    async getMetrics() {
        return this.service.getDashboardMetrics();
    }

    @Get('revenue-chart')
    @Roles('MASTER')
    async getRevenueChart(@Query('year') year?: string) {
        const yearNum = year ? parseInt(year) : new Date().getFullYear();
        return this.service.getMonthlyRevenueChart(yearNum);
    }

    @Get('inadimplencia')
    @Roles('MASTER')
    async getInadimplencia() {
        return this.service.getInadimplenciaReport();
    }
}
