import { Controller, Get, Post, Body, UseGuards, Request, Param, Query } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@repo/database';

@Controller('finance')
export class FinanceController {
    constructor(private readonly financeService: FinanceService) { }

    @UseGuards(JwtAuthGuard)
    @Post('transaction')
    create(@Request() req: any, @Body() createTransactionDto: CreateTransactionDto) {
        return this.financeService.createTransaction(req.user.userId, req.user.companyId, createTransactionDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('summary')
    getSummary(@Request() req: any) {
        return this.financeService.getSummary(req.user.userId, req.user.companyId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('transactions')
    getTransactions(@Request() req: any) {
        return this.financeService.getTransactions(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('close')
    closeDay(@Request() req: any, @Body() body: { physicalCashReported?: number, date?: string }) {
        return this.financeService.closeDay(req.user.userId, body.physicalCashReported, body.date ? new Date(body.date) : undefined);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Post('close/:userId/admin')
    closeDayForUser(@Param('userId') userId: string, @Body() body: { autoVerify?: boolean, physicalCashReported?: number, date?: string }, @Request() req: any) {
        const autoVerify = body?.autoVerify ?? true;
        const targetDate = body?.date ? new Date(body.date) : undefined;
        return this.financeService.closeDayForUser(userId, req.user.userId, autoVerify, body.physicalCashReported, targetDate);
    }

    @UseGuards(JwtAuthGuard) // Add Roles('ADMIN') if possible, but minimal for now
    @Get('pending-closes')
    getPendingCloses(@Request() req: any, @Query() query: any) {
        const companyId = (req.user.role === 'MASTER' && query.targetCompanyId) ? query.targetCompanyId : req.user.companyId;
        return this.financeService.findAllPendingCloses(companyId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('close/:id/verify')
    verifyClose(@Param('id') id: string, @Body() body: { status: 'VERIFIED' | 'REJECTED' }, @Request() req: any) {
        return this.financeService.verifyDailyClose(id, req.user.userId, body.status, req.user.companyId);
    }
    @UseGuards(JwtAuthGuard)
    @Get('debug-info')
    getDebugInfo(@Request() req: any) {
        return this.financeService.getDebugInfo(req.user.userId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.MASTER)
    @Get('dashboard-metrics')
    getDashboardMetrics(@Request() req: any, @Query() query: any) {
        const companyId = (req.user.role === 'MASTER' && query.targetCompanyId) ? query.targetCompanyId : req.user.companyId;
        return this.financeService.getDashboardMetrics(companyId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.MASTER)
    @Get('all-transactions')
    findAllTransactions(@Request() req: any, @Query() query: any) {
        const companyId = (req.user.role === 'MASTER' && query.targetCompanyId) ? query.targetCompanyId : req.user.companyId;
        return this.financeService.findAllTransactions(companyId, query);
    }

    @UseGuards(JwtAuthGuard)
    @Get('accountability-matrix')
    getAccountability(@Request() req: any, @Query() query: any) {
        const companyId = (req.user.role === 'MASTER' && query.targetCompanyId) ? query.targetCompanyId : req.user.companyId;
        return this.financeService.getAccountabilityMatrix(companyId);
    }
}
