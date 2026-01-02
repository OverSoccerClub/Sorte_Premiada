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
    async create(@Body() createGameDto: any, @Request() req: any) {
        return this.gamesService.create({
            ...createGameDto,
            companyId: req.user.companyId
        });
    }

    @Get()
    async findAll(@Query('activeOnly') activeOnly?: string, @Query('slug') slug?: string, @Request() req?: any) {
        try {
            // How to get user info if endpoint is public but maybe has auth header?
            // NestJS @Request() might be empty if guard not applied.
            // But we can check if we want to support token if present.
            // For now, let's rely on slug for public, and maybe we can add a Guard that is optional?
            // Or just rely on slug from the App.

            const games = await this.gamesService.findAll({
                activeOnly: activeOnly === 'true',
                slug: slug
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
