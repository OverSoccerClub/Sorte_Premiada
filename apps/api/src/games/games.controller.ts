import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { GamesService } from './games.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@repo/database';

@Controller('games')
export class GamesController {
    constructor(private readonly gamesService: GamesService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async create(@Body() createGameDto: any) {
        return this.gamesService.create(createGameDto);
    }

    @Get()
    async findAll(@Query('activeOnly') activeOnly?: string) {
        try {
            const games = await this.gamesService.findAll({
                activeOnly: activeOnly === 'true'
            });
            return games.map(game => ({
                ...game,
                price: Number(game.price),
                prizeMilhar: game.prizeMilhar ? Number(game.prizeMilhar) : null,
                prizeCentena: game.prizeCentena ? Number(game.prizeCentena) : null,
                prizeDezena: game.prizeDezena ? Number(game.prizeDezena) : null,
                maxLiability: Number(game.maxLiability),
                prizeMultiplier: Number(game.prizeMultiplier),
                commissionRate: Number(game.commissionRate)
            }));
        } catch (error) {
            console.error("Error fetching games:", error);
            throw error;
        }
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.gamesService.findOne(id);
    }

    @Post(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async update(@Param('id') id: string, @Body() updateGameDto: any, @Request() req: any) {
        try {
            console.log("Updating game", id, updateGameDto);
            return await this.gamesService.update(id, updateGameDto, req.user.userId);
        } catch (e) {
            console.error("Error updating game", e);
            throw e;
        }
    }
}
