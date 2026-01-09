import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CashCollectionService } from './cash-collection.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('cash-collection')
export class CashCollectionController {
    constructor(private readonly service: CashCollectionService) { }

    @Post('collect')
    @UseGuards(JwtAuthGuard)
    async collect(@Request() req: any, @Body() data: any) {
        // If the logged in user is a COBRADOR, override cobradorId from token
        const cobradorId = req.user.role === 'COBRADOR' ? req.user.userId : data.cobradorId;

        return this.service.collectCash({
            ...data,
            cobradorId
        });
    }

    @Get('balance/:cambistaId')
    @UseGuards(JwtAuthGuard)
    async getBalance(@Param('cambistaId') cambistaId: string) {
        return this.service.getCambistaBalanceSummary(cambistaId);
    }
}
