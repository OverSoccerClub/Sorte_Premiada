import { Controller, Get, UseGuards, Query, Res, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { toBrazilTime, getBrazilNow } from '../utils/date.util';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@repo/database';
import type { Response } from 'express';
import { getBrazilStartOfDay, getBrazilEndOfDay } from '../utils/date.util';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.COBRADOR, 'MASTER')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('sales-by-cambista')
    async getSalesByCambista(@Request() req: any, @Query('targetCompanyId') targetCompanyId?: string) {
        const companyId = (req.user.role === 'MASTER' && targetCompanyId) ? targetCompanyId : req.user.companyId;
        return this.reportsService.getSalesByCambista(companyId, req.user.userId);
    }

    @Get('sales-by-date')
    async getSalesByDate(
        @Request() req: any,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('cambistaId') cambistaId?: string,
        @Query('gameId') gameId?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('targetCompanyId') targetCompanyId?: string,
    ) {
        const companyId = (req.user.role === 'MASTER' && targetCompanyId) ? targetCompanyId : req.user.companyId;
        return this.reportsService.getSalesByDate(
            toBrazilTime(startDate).toDate(),
            toBrazilTime(endDate).toDate(),
            companyId,
            cambistaId,
            gameId,
            page ? Number(page) : 1,
            limit ? Number(limit) : 20,
            req.user.userId
        );
    }

    @Get('sales-by-area')
    async getSalesByArea(
        @Request() req: any,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('targetCompanyId') targetCompanyId?: string,
    ) {
        const companyId = (req.user.role === 'MASTER' && targetCompanyId) ? targetCompanyId : req.user.companyId;

        // Fix: Use Brazil Time utils to prevent Invalid Date and timezone bugs
        // Check if dates are valid, otherwise fallback to undefined (which defaults to "Today" in utils)
        const isValidDate = (d: string) => d && !isNaN(Date.parse(d));

        const safeStart = isValidDate(startDate) ? startDate : undefined;
        const safeEnd = isValidDate(endDate) ? endDate : undefined;

        const start = getBrazilStartOfDay(safeStart);
        const end = getBrazilEndOfDay(safeEnd);

        return this.reportsService.getSalesByArea(start, end, companyId, req.user.userId);
    }

    @Get('dashboard')
    async getDashboardStats(@Request() req: any, @Query('targetCompanyId') targetCompanyId?: string) {
        const companyId = (req.user.role === 'MASTER' && targetCompanyId) ? targetCompanyId : req.user.companyId;
        return this.reportsService.getDashboardStats(req.user.userId, companyId);
    }

    @Get('finance-summary')
    async getFinanceSummary(
        @Request() req: any,
        @Query('cambistaId') cambistaId: string,
        @Query('date') date: string,
        @Query('targetCompanyId') targetCompanyId?: string,
    ) {
        const companyId = (req.user.role === 'MASTER' && targetCompanyId) ? targetCompanyId : req.user.companyId;
        // Finance summary is specific to a user, so we check that user's validity or assume current context
        return this.reportsService.getFinanceSummary(cambistaId, date ? toBrazilTime(date).toDate() : getBrazilNow(), companyId, req.user.userId);
    }

    @Get('daily-closes')
    async getDailyCloses(
        @Request() req: any,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('userId') userId: string,
        @Query('status') status: string,
        @Query('targetCompanyId') targetCompanyId?: string,
    ) {
        const companyId = (req.user.role === 'MASTER' && targetCompanyId) ? targetCompanyId : req.user.companyId;
        return this.reportsService.getDailyCloses(startDate ? toBrazilTime(startDate).toDate() : undefined, endDate ? toBrazilTime(endDate).toDate() : undefined, userId, status, req.user.userId, companyId);
    }

    @Get('pending-closes')
    async getPendingCloses(@Request() req: any, @Query('targetCompanyId') targetCompanyId?: string) {
        const companyId = (req.user.role === 'MASTER' && targetCompanyId) ? targetCompanyId : req.user.companyId;
        return this.reportsService.getPendingCloses(req.user.userId, companyId);
    }

    @Get('transactions/export')
    async exportTransactions(
        @Request() req: any,
        @Res() res: Response,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('userId') userId: string,
        @Query('targetCompanyId') targetCompanyId?: string,
    ) {
        const companyId = (req.user.role === 'MASTER' && targetCompanyId) ? targetCompanyId : req.user.companyId;
        const csv = await this.reportsService.exportTransactionsCsv(startDate ? toBrazilTime(startDate).toDate() : undefined, endDate ? toBrazilTime(endDate).toDate() : undefined, userId, req.user.userId, companyId);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="transactions_${Date.now()}.csv"`);
        res.send(csv);
    }

    @Get('tickets-by-draw')
    async getTicketsByDraw(
        @Request() req: any,
        @Query('drawId') drawId: string,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('targetCompanyId') targetCompanyId?: string,
    ) {
        const companyId = (req.user.role === 'MASTER' && targetCompanyId) ? targetCompanyId : req.user.companyId;
        return this.reportsService.getTicketsByDraw(drawId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined, companyId);
    }

    @Get('top-sellers')
    async getTopSellers(
        @Request() req: any,
        @Query('limit') limit?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('targetCompanyId') targetCompanyId?: string,
    ) {
        const companyId = (req.user.role === 'MASTER' && targetCompanyId) ? targetCompanyId : req.user.companyId;
        const l = limit ? Number(limit) : 10;
        return this.reportsService.getTopSellers(l, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined, companyId);
    }

    @Get('active-users')
    async getActiveUsers(@Request() req: any, @Query('days') days?: string, @Query('targetCompanyId') targetCompanyId?: string) {
        const companyId = (req.user.role === 'MASTER' && targetCompanyId) ? targetCompanyId : req.user.companyId;
        const d = days ? Number(days) : 30;
        return this.reportsService.getActiveUsers(d, companyId);
    }

    @Get('notifications')
    async getNotificationLogs(
        @Request() req: any,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('status') status?: string,
        @Query('userId') userId?: string,
        @Query('targetCompanyId') targetCompanyId?: string,
    ) {
        const companyId = (req.user.role === 'MASTER' && targetCompanyId) ? targetCompanyId : req.user.companyId;
        return this.reportsService.getNotificationLogs(startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined, status, userId, companyId);
    }

    @Get('notifications/export')
    async exportNotificationLogs(
        @Request() req: any,
        @Res() res: Response,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('status') status: string,
        @Query('userId') userId: string,
        @Query('targetCompanyId') targetCompanyId?: string,
    ) {
        const companyId = (req.user.role === 'MASTER' && targetCompanyId) ? targetCompanyId : req.user.companyId;
        const csv = await this.reportsService.exportNotificationLogsCsv(startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined, status, userId, companyId);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="notification_logs_${Date.now()}.csv"`);
        res.send(csv);
    }
}
