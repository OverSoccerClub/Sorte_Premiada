import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
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
    closeDay(@Request() req: any, @Body('physicalCashReported') physicalCashReported?: number) {
        return this.financeService.closeDay(req.user.userId, physicalCashReported);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Post('close/:userId/admin')
    closeDayForUser(@Param('userId') userId: string, @Body() body: { autoVerify?: boolean, physicalCashReported?: number }, @Request() req: any) {
        const autoVerify = body?.autoVerify ?? true;
        return this.financeService.closeDayForUser(userId, req.user.userId, autoVerify, body.physicalCashReported);
    }

    @UseGuards(JwtAuthGuard) // Add Roles('ADMIN') if possible, but minimal for now
    @Get('pending-closes')
    getPendingCloses() {
        return this.financeService.findAllPendingCloses();
    }

    @UseGuards(JwtAuthGuard)
    @Post('close/:id/verify')
    verifyClose(@Param('id') id: string, @Body() body: { status: 'VERIFIED' | 'REJECTED' }, @Request() req: any) {
        return this.financeService.verifyDailyClose(id, req.user.userId, body.status);
    }
    @UseGuards(JwtAuthGuard)
    @Get('debug-info')
    getDebugInfo(@Request() req: any) {
        return this.financeService.getDebugInfo(req.user.userId);
    }
}
