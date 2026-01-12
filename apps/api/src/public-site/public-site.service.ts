import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicSiteService {
    constructor(private prisma: PrismaService) { }

    /**
     * Busca os últimos resultados de sorteios realizados
     * @param companyId ID da empresa (multi-tenancy)
     * @param limit Quantidade de resultados a retornar (padrão: 10)
     */
    async getLatestResults(companyId: string, limit = 10) {
        // Busca sorteios que já aconteceram (drawDate <= now) e têm números sorteados
        const draws = await this.prisma.draw.findMany({
            where: {
                companyId,
                drawDate: {
                    lte: new Date() // Apenas sorteios passados
                },
                numbers: {
                    isEmpty: false // Apenas sorteios com números sorteados
                }
            },
            include: {
                game: {
                    select: {
                        id: true,
                        name: true,
                        displayName: true,
                        prizeMilhar: true,
                        prizeCentena: true,
                        prizeDezena: true
                    }
                }
            },
            orderBy: {
                drawDate: 'desc'
            },
            take: limit
        });

        // Formata os dados para o frontend
        return draws.map(draw => ({
            id: draw.id,
            game: draw.game.displayName || draw.game.name,
            date: this.formatDate(draw.drawDate),
            numbers: draw.numbers,
            prize: draw.game.prizeMilhar?.toString() || '5000.00',
            series: draw.series
        }));
    }

    /**
     * Busca os próximos sorteios agendados
     * @param companyId ID da empresa (multi-tenancy)
     * @param limit Quantidade de sorteios a retornar (padrão: 5)
     */
    async getUpcomingDraws(companyId: string, limit = 5) {
        // Busca sorteios futuros (drawDate > now)
        const draws = await this.prisma.draw.findMany({
            where: {
                companyId,
                drawDate: {
                    gt: new Date() // Apenas sorteios futuros
                }
            },
            include: {
                game: {
                    select: {
                        id: true,
                        name: true,
                        displayName: true,
                        prizeMilhar: true
                    }
                }
            },
            orderBy: {
                drawDate: 'asc'
            },
            take: limit
        });

        // Formata os dados para o frontend
        return draws.map(draw => ({
            id: draw.id,
            game: draw.game.displayName || draw.game.name,
            drawDate: draw.drawDate.toISOString(),
            prize: draw.game.prizeMilhar?.toString() || '5000.00'
        }));
    }

    /**
     * Formata a data para exibição (DD/MM/YYYY)
     */
    private formatDate(date: Date): string {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
}
