import { Controller, Get, Post, Body, Param, UseGuards, Request, Query, ForbiddenException, Delete } from '@nestjs/common';
import { GamesService } from './games.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, Prisma } from '@repo/database';

@Controller('games')
export class GamesController {
    constructor(private readonly gamesService: GamesService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.MASTER)
    async create(@Body() createGameDto: any, @Request() req: any) {
        let companyId = req.user.companyId;

        // Permitir que MASTER crie jogos para outras empresas
        if ((createGameDto.companyId || createGameDto.targetCompanyId) && req.user.role === 'MASTER') {
            companyId = createGameDto.companyId || createGameDto.targetCompanyId;
        }

        return this.gamesService.create({
            ...createGameDto,
            companyId: companyId
        });
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(
        @Query('activeOnly') activeOnly?: string,
        @Query('slug') slug?: string,
        @Query('targetCompanyId') targetCompanyId?: string,
        @Request() req?: any
    ) {
        try {
            // Determinar companyId correto
            let companyId = req.user.companyId;

            // Apenas MASTER pode acessar outra empresa
            if (targetCompanyId) {
                if (req.user.role !== 'MASTER') {
                    // Ignorar targetCompanyId se não for MASTER
                    companyId = req.user.companyId;
                } else {
                    companyId = targetCompanyId;
                }
            }

            const games = await this.gamesService.findAll({
                activeOnly: activeOnly === 'true',
                slug: slug,
                companyId: companyId // SEMPRE filtrado por empresa
            });

            return games.map((game: any) => ({
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
    @UseGuards(JwtAuthGuard)
    async findOne(@Param('id') id: string, @Request() req: any) {
        const game = await this.gamesService.findOne(id);

        if (!game) {
            throw new ForbiddenException('Jogo não encontrado');
        }

        // Validar que o jogo pertence à empresa do usuário
        if (game.companyId !== req.user.companyId && req.user.role !== 'MASTER') {
            throw new ForbiddenException('Acesso negado a este jogo');
        }

        return game;
    }

    @Post(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.MASTER)
    async update(@Param('id') id: string, @Body() updateGameDto: any, @Request() req: any) {
        try {
            // Buscar jogo para validar companyId
            const game = await this.gamesService.findOne(id);

            if (!game) {
                throw new ForbiddenException('Jogo não encontrado');
            }

            // Validar que o jogo pertence à empresa do usuário
            if (game.companyId !== req.user.companyId && req.user.role !== 'MASTER') {
                throw new ForbiddenException('Acesso negado a este jogo');
            }

            console.log("Updating game", id, updateGameDto);
            return await this.gamesService.update(id, updateGameDto, req.user.userId);
        } catch (e) {
            console.error("Error updating game", e);
            throw e;
        }
    }
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.MASTER) // Apenas MASTER pode deletar
    async remove(@Param('id') id: string, @Request() req: any) {
        const game = await this.gamesService.findOne(id);
        if (!game) {
            throw new ForbiddenException('Jogo não encontrado');
        }

        // Validação extra: Apenas MASTER pode deletar jogos
        if (req.user.role !== 'MASTER') {
            throw new ForbiddenException('Apenas usuários MASTER podem excluir jogos');
        }

        try {
            return await this.gamesService.remove(id, req.user.userId);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
                throw new ForbiddenException('Não é possível excluir este jogo pois existem registros vinculados (bilhetes, etc). Tente desativá-lo.');
            }
            throw error;
        }
    }
}

