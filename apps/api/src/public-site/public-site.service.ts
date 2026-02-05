import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toBrazilTime, getBrazilNow } from '../utils/date.util';

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
                    lte: getBrazilNow() // Apenas sorteios passados
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
                },
                company: {
                    select: {
                        companyName: true
                    }
                }
            },
            orderBy: {
                drawDate: 'desc'
            },
            take: limit
        });

        // Formata os dados para o frontend
        // Reverte o array para exibir em ordem cronológica (Antigo -> Novo) da esquerda para a direita
        return draws.reverse().map(draw => ({
            id: draw.id,
            game: draw.game.displayName || draw.game.name,
            date: this.formatDate(draw.drawDate),
            numbers: draw.numbers,
            prize: draw.game.prizeMilhar?.toString() || '5000.00',
            series: draw.series,
            companyInitials: this.getInitials(draw.company?.companyName)
        }));
    }

    private getInitials(name?: string): string {
        if (!name) return '';
        return name
            .split(' ')
            .filter(part => part.length > 2) // Ignora preposições curtas (de, da, etc.)
            .map(part => part[0].toUpperCase())
            .join('')
            .slice(0, 3); // Limita a 3 letras
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
                    gt: getBrazilNow() // Apenas sorteios futuros
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
     * Busca os últimos resultados do sorteio de Segunda Chance
     * @param companyId ID da empresa
     * @param limit Limite de resultados
     */
    async getLatestSecondChanceResults(companyId: string, limit = 5) {
        const draws = await this.prisma.secondChanceDraw.findMany({
            where: {
                game: {
                    companyId
                }
            },
            include: {
                game: {
                    select: {
                        name: true,
                        displayName: true
                    }
                }
            },
            orderBy: {
                drawDate: 'desc'
            },
            take: limit
        });

        return draws.map(draw => ({
            id: draw.id,
            game: draw.game.displayName || draw.game.name,
            date: this.formatDate(draw.drawDate),
            winningNumber: draw.winningNumber,
            prize: draw.prizeAmount.toString(),
            series: draw.series
        }));
    }

    /**
     * Formata a data para exibição (DD/MM/YYYY às HH:mm) - Horário de Brasília
     */
    private formatDate(date: Date): string {
        return toBrazilTime(date).format('DD/MM/YYYY [às] HH:mm');
    }
}
