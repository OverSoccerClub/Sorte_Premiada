import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
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
}
