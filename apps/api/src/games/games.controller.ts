import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
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
    async findAll() {
        try {
            const games = await this.gamesService.findAll();
            return games.map(game => ({
                ...game,
                price: Number(game.price) // Ensure Decimal is converted to Number
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
