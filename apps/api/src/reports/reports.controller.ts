import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@repo/database';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('sales-by-cambista')
    async getSalesByCambista() {
        return this.reportsService.getSalesByCambista();
    }

    @Get('sales-by-date')
    async getSalesByDate(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('cambistaId') cambistaId?: string,
    ) {
        return this.reportsService.getSalesByDate(new Date(startDate), new Date(endDate), cambistaId);
    }

    @Get('sales-by-area')
    async getSalesByArea(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        // Ensure full day coverage if only date string is passed
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        return this.reportsService.getSalesByArea(start, end);
    }
    @Get('dashboard')
    async getDashboardStats() {
        return this.reportsService.getDashboardStats();
    }

    @Get('finance-summary')
    async getFinanceSummary(
        @Query('cambistaId') cambistaId: string,
        @Query('date') date: string,
    ) {
        return this.reportsService.getFinanceSummary(cambistaId, date ? new Date(date) : new Date());
    }
}
