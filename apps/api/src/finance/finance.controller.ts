import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('finance')
export class FinanceController {
    constructor(private readonly financeService: FinanceService) { }

    @UseGuards(JwtAuthGuard)
    @Post('transaction')
    create(@Request() req: any, @Body() createTransactionDto: CreateTransactionDto) {
        return this.financeService.createTransaction(req.user.userId, createTransactionDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('summary')
    getSummary(@Request() req: any) {
        return this.financeService.getSummary(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('transactions')
    getTransactions(@Request() req: any) {
        return this.financeService.getTransactions(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('close')
    closeDay(@Request() req: any) {
        return this.financeService.closeDay(req.user.userId);
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
