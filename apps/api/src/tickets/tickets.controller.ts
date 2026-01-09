import { Controller, Get, Post, Body, UseGuards, Request, Query, Param, ForbiddenException, BadRequestException } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tickets')
export class TicketsController {
    constructor(private readonly ticketsService: TicketsService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    async create(@Request() req: any, @Body() createTicketDto: any) {
        if (!req.user.companyId) {
            throw new BadRequestException("Usuário sem empresa vinculada. Contate o suporte.");
        }

        return this.ticketsService.create({
            ...createTicketDto,
            user: { connect: { id: req.user.userId } },
            company: { connect: { id: req.user.companyId } },
            // gameId is optional, if provided connect it
            ...(createTicketDto.gameId ? { game: { connect: { id: createTicketDto.gameId } } } : {}),
            gameType: createTicketDto.gameType, // Ensure gameType is passed
            status: 'PENDING',
        });
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(
        @Request() req: any,
        @Query('status') status?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('gameType') gameType?: string,
        @Query('gameId') gameId?: string,
        @Query('targetCompanyId') targetCompanyId?: string
    ) {
        // Determinar o companyId correto
        let companyId = req.user.companyId;
        if (req.user.role === 'MASTER' && targetCompanyId) {
            companyId = targetCompanyId;
        }

        const filters = { status, startDate, endDate, gameType, gameId, companyId };

        if (req.user.role === 'ADMIN' || req.user.role === 'MASTER') {
            return this.ticketsService.findAll(filters);
        }
        return this.ticketsService.findByUser(req.user.userId, req.user.companyId, filters);
    }
    @Get('availability/:gameId')
    @UseGuards(JwtAuthGuard)
    async getAvailability(@Param('gameId') gameId: string) {
        return this.ticketsService.getAvailability(gameId);
    }

    @Get('validate/:id')
    @UseGuards(JwtAuthGuard)
    async validate(@Request() req: any, @Param('id') id: string) {
        if (!req.user.companyId) {
            throw new BadRequestException("Usuário sem empresa vinculada. Contate o suporte.");
        }
        return this.ticketsService.validateTicket(id, req.user.companyId);
    }

    @Post(':id/redeem')
    @UseGuards(JwtAuthGuard)
    async redeem(@Request() req: any, @Param('id') id: string) {
        return this.ticketsService.redeemPrize(id, req.user.userId);
    }

    @Post(':id/request-cancel')
    @UseGuards(JwtAuthGuard)
    async requestCancel(@Request() req: any, @Param('id') id: string, @Body('reason') reason: string) {
        return this.ticketsService.requestCancellation(id, req.user.userId, reason);
    }

    @Post(':id/approve-cancel')
    @UseGuards(JwtAuthGuard)
    async approveCancel(@Request() req: any, @Param('id') id: string, @Body('approved') approved: boolean) {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'COBRADOR') {
            throw new ForbiddenException("Apenas administradores podem aprovar cancelamentos.");
        }
        return this.ticketsService.approveCancellation(id, req.user.userId, approved);
    }
}
