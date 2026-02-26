import { Controller, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { DrawsService } from '../draws/draws.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin/minuto-sorte')
export class MinutoSorteAdminController {
    constructor(
        private readonly drawsService: DrawsService,
        private readonly prisma: PrismaService
    ) { }

    @Post('draw')
    @UseGuards(JwtAuthGuard)
    async processDraw(@Request() req: any, @Body() body: any) {
        if (req.user.role !== 'MASTER' && req.user.role !== 'ADMIN') {
            throw new BadRequestException("Apenas administradores podem processar sorteios.");
        }

        const game = await this.prisma.client.game.findFirst({
            where: { companyId: req.user.companyId, type: 'MINUTO_SORTE' }
        });

        if (!game) {
            throw new BadRequestException("Jogo 'Minuto da Sorte' não configurado.");
        }

        if (!body.lotteryNumber || body.lotteryNumber.length !== 5) {
            throw new BadRequestException("O número da loteria deve ter 5 dígitos (ex: 12345)");
        }

        return this.drawsService.create({
            gameId: game.id,
            drawDate: new Date(body.drawDate),
            numbers: [body.lotteryNumber],
            description: "Sorteio Minuto da Sorte (Loteria Federal)"
        }, req.user.companyId);
    }
}
