
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { DrawsService } from './draws.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@repo/database';

@Controller('draws')
export class DrawsController {
    constructor(private readonly drawsService: DrawsService) { }

    @Post('seed-palpita')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, 'MASTER')
    async seedPalpita(@Request() req: any) {
        let companyId = req.user.companyId;
        // Se for master, pegar a primeira empresa ou deixar null se não for obrigatório, mas draws.service requer companyId.
        if (req.user.role === 'MASTER') {
            const companies = await this.drawsService['prisma'].company.findMany(); // quick hack to get a company
            if (companies.length > 0) companyId = companies[0].id;
        }

        const game = await this.drawsService['prisma'].game.findFirst({
            where: { type: 'PAIPITA_AI' },
            include: { company: true }
        });

        if (!game) throw new Error("PAIPITA_AI game not found");

        const nextSeries = game.lastSeries + 1;
        const drawDate = new Date();
        drawDate.setDate(drawDate.getDate() + 1);
        drawDate.setHours(16, 0, 0, 0);

        const createDrawDto = {
            gameId: game.id,
            drawDate: drawDate.toISOString(),
            description: `Sorteio Teste via API #${nextSeries}`,
            matches: [
                { homeTeam: 'Flamengo', awayTeam: 'Vasco', matchOrder: 1, matchDate: drawDate.toISOString() },
                { homeTeam: 'Corinthians', awayTeam: 'Palmeiras', matchOrder: 2, matchDate: drawDate.toISOString() },
                { homeTeam: 'São Paulo', awayTeam: 'Santos', matchOrder: 3, matchDate: drawDate.toISOString() },
                { homeTeam: 'Grêmio', awayTeam: 'Internacional', matchOrder: 4, matchDate: drawDate.toISOString() },
                { homeTeam: 'Cruzeiro', awayTeam: 'Atlético-MG', matchOrder: 5, matchDate: drawDate.toISOString() },
                { homeTeam: 'Fluminense', awayTeam: 'Botafogo', matchOrder: 6, matchDate: drawDate.toISOString() },
                { homeTeam: 'Bahia', awayTeam: 'Vitória', matchOrder: 7, matchDate: drawDate.toISOString() },
                { homeTeam: 'Athletico-PR', awayTeam: 'Coritiba', matchOrder: 8, matchDate: drawDate.toISOString() },
                { homeTeam: 'Fortaleza', awayTeam: 'Ceará', matchOrder: 9, matchDate: drawDate.toISOString() },
                { homeTeam: 'Sport', awayTeam: 'Náutico', matchOrder: 10, matchDate: drawDate.toISOString() },
                { homeTeam: 'Goiás', awayTeam: 'Atlético-GO', matchOrder: 11, matchDate: drawDate.toISOString() },
                { homeTeam: 'Paysandu', awayTeam: 'Remo', matchOrder: 12, matchDate: drawDate.toISOString() },
                { homeTeam: 'Avaí', awayTeam: 'Figueirense', matchOrder: 13, matchDate: drawDate.toISOString() },
                { homeTeam: 'Ponte Preta', awayTeam: 'Guarani', matchOrder: 14, matchDate: drawDate.toISOString() },
            ]
        };

        return this.drawsService.create(createDrawDto, game.companyId || companyId);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, 'MASTER')
    create(@Body() createDrawDto: any, @Request() req: any, @Query('targetCompanyId') targetCompanyId?: string) {
        // Sanitizar targetCompanyId
        const sanitizedTargetCompanyId = targetCompanyId === 'null' || targetCompanyId === 'undefined' ? undefined : targetCompanyId;

        // Determinar o companyId correto
        let companyId = req.user.companyId;
        if (req.user.role === 'MASTER' && sanitizedTargetCompanyId) {
            companyId = sanitizedTargetCompanyId;
        }

        return this.drawsService.create(createDrawDto, companyId);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    findAll(@Query('gameId') gameId?: string, @Query('targetCompanyId') targetCompanyId?: string, @Request() req?: any) {
        // Sanitizar targetCompanyId
        const sanitizedTargetCompanyId = targetCompanyId === 'null' || targetCompanyId === 'undefined' ? undefined : targetCompanyId;

        // Determinar o companyId para filtro
        let companyId = req?.user?.companyId;
        if (req?.user?.role === 'MASTER' && sanitizedTargetCompanyId) {
            companyId = sanitizedTargetCompanyId;
        }

        if (gameId) {
            return this.drawsService.findByGame(gameId, companyId);
        }
        return this.drawsService.findAll(companyId);
    }

    @Get('liability-report')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, 'MASTER')
    getLiabilityReport(@Query('gameId') gameId: string, @Query('drawDate') drawDate: string, @Request() req: any) {
        const companyId = req.user.role === 'MASTER' ? undefined : req.user.companyId;
        return this.drawsService.getLiabilityReport(gameId, drawDate, companyId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.drawsService.findOne(id);
    }

    @Get(':id/details')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, 'MASTER')
    getDetails(@Param('id') id: string, @Request() req: any) {
        const companyId = req.user.role === 'MASTER' ? undefined : req.user.companyId;
        return this.drawsService.getDrawDetails(id, companyId);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, 'MASTER')
    update(@Param('id') id: string, @Body() updateDrawDto: any, @Request() req: any) {
        const companyId = req.user.role === 'MASTER' ? undefined : req.user.companyId;
        return this.drawsService.update(id, updateDrawDto, companyId);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, 'MASTER')
    remove(@Param('id') id: string, @Request() req: any) {
        const companyId = req.user.role === 'MASTER' ? undefined : req.user.companyId;
        return this.drawsService.remove(id, companyId);
    }
}
