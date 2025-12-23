import { Controller, Get, Post, Body, UseGuards, Request, Query, Param } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tickets')
export class TicketsController {
    constructor(private readonly ticketsService: TicketsService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    async create(@Request() req: any, @Body() createTicketDto: any) {
        return this.ticketsService.create({
            ...createTicketDto,
            user: { connect: { id: req.user.userId } },
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
        @Query('gameId') gameId?: string
    ) {
        const filters = { status, startDate, endDate, gameType, gameId };

        if (req.user.role === 'ADMIN') {
            return this.ticketsService.findAll(filters);
        }
        return this.ticketsService.findByUser(req.user.userId, filters);
    }
    @Get('availability/:gameId')
    @UseGuards(JwtAuthGuard)
    async getAvailability(@Param('gameId') gameId: string) {
        return this.ticketsService.getAvailability(gameId);
    }

    @Get('validate/:id')
    @UseGuards(JwtAuthGuard)
    async validate(@Param('id') id: string) {
        return this.ticketsService.validateTicket(id);
    }
}
