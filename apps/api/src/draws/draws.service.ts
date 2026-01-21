
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@repo/database';
import { toBrazilTime } from '../utils/date.util';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class DrawsService {
    constructor(
        private prisma: PrismaService,
        private redis: RedisService
    ) { }

    async create(data: any, companyId?: string) {
        return this.prisma.$transaction(async (tx) => {
            // Verificar se temos gameId (direto ou via connect)
            const gameId = data.gameId || (data.game && data.game.connect && data.game.connect.id);

            if (gameId) {
                // Determine time slot from drawDate (Enforce Brazil Time interpretation)
                // If input is "2023-10-20T10:00:00" (ISO), we treat it as 10:00 Brazil Time.
                const drawDateBrazil = toBrazilTime(data.drawDate);

                // Override the data.drawDate with the correct UTC timestamp corresponding to that Brazil time
                data.drawDate = drawDateBrazil.toDate();

                // Extract HH:mm for timeSlot based on Brazil Time
                const timeSlot = drawDateBrazil.format('HH:mm');

                const areaId = data.areaId || null; // Support area linking

                // Busca ou cria o contador para este horário E PRAÇA
                let extractionSeries = await tx.extractionSeries.findFirst({
                    where: {
                        gameId,
                        areaId: areaId,
                        time: timeSlot
                    }
                });

                if (!extractionSeries) {
                    extractionSeries = await tx.extractionSeries.create({
                        data: {
                            gameId,
                            areaId: areaId,
                            time: timeSlot,
                            lastSeries: 0
                        }
                    });
                }

                // Incrementa o contador da serie especifica DA PRAÇA
                const updatedSeries = await tx.extractionSeries.update({
                    where: { id: extractionSeries.id },
                    data: { lastSeries: { increment: 1 } }
                });

                // Mantemos o lastSeries global do Game atualizado também (opcional, mas bom p/ compatibilidade)
                // However, global series implies TOTAL draws.
                await tx.game.update({
                    where: { id: gameId },
                    data: { lastSeries: { increment: 1 } }
                });

                const createdDraw = await tx.draw.create({
                    data: {
                        ...data,
                        series: updatedSeries.lastSeries,
                        ...(companyId ? { companyId } : {}),
                        matches: (data.matches && Array.isArray(data.matches)) ? {
                            create: data.matches.map((m: any) => ({
                                homeTeam: m.homeTeam,
                                awayTeam: m.awayTeam,
                                matchDate: new Date(m.matchDate), // Ensure Date object
                                matchOrder: Number(m.matchOrder),
                                result: null // Init result as null
                            }))
                        } : undefined
                    }
                });

                // IMPORTANT: We cannot await this INSIDE the transaction if it modifies rows that might be locked or if we want it to run after commit.
                // But generally safe if it updates Tickets. 
                // However, Prisma doesn't support "after commit" hooks easily inside $transaction callback unless we manually handle it.
                // Let's return the draw and process results OUTSIDE the transaction or just await it here if performance allows.
                // Updating tickets is related data, safe to do inside transaction to ensure consistency? 
                // If the draw fails, tickets shouldn't be updated.
                // YES, inside transaction is better for consistency.
                await this.processDrawResults(tx, createdDraw);

                return createdDraw;
            }

            const createdDraw = await tx.draw.create({
                data: {
                    ...data,
                    matches: (data.matches && Array.isArray(data.matches)) ? {
                        create: data.matches.map((m: any) => ({
                            homeTeam: m.homeTeam,
                            awayTeam: m.awayTeam,
                            matchDate: new Date(m.matchDate),
                            matchOrder: Number(m.matchOrder),
                            result: null
                        }))
                    } : undefined
                }
            });
            await this.processDrawResults(tx, createdDraw);
            return createdDraw;
        });
    }

    private async processDrawResults(tx: Prisma.TransactionClient, draw: any) {
        // Fetch full context (Game Type and Matches) to decide logic
        const fullDraw = await tx.draw.findUnique({
            where: { id: draw.id },
            include: {
                game: true,
                matches: { orderBy: { matchOrder: 'asc' } }
            }
        });

        if (!fullDraw || !fullDraw.game) return;

        const tickets = await tx.ticket.findMany({
            where: {
                gameId: draw.gameId,
                drawDate: draw.drawDate,
                status: { not: 'CANCELLED' }
            }
        });

        const gameType = fullDraw.game.type;
        let wonCount = 0;
        let lostCount = 0;

        // PAIPITA AI Logic (Ordered Match Results)
        if (gameType === 'PAIPITA_AI') {
            if (!fullDraw.matches || fullDraw.matches.length !== 14) return;

            // Check if all matches have results
            const results = fullDraw.matches.map(m => m.result);
            if (results.some(r => !r)) return; // Not ready

            for (const ticket of tickets) {
                const guesses = ticket.numbers as string[];
                if (!guesses || guesses.length !== 14) continue;

                let hits = 0;
                guesses.forEach((g, i) => {
                    if (g === results[i]) hits++;
                });

                // Win Condition: 13 or 14 hits
                const hasMatch = hits >= 13;

                /* 
                   TODO: Prize Calculation for Loteca is usually Parimutuel (Rateio).
                   Currently relying on ticket.possiblePrize which might be 0 if not set.
                   If Fixed Odds info is added later, it works automatically.
                */

                await this.updateTicketStatus(tx, ticket, hasMatch ? 'WON' : 'LOST', () => {
                    if (hasMatch) wonCount++; else lostCount++;
                });
            }
        }
        // Existing Logic (2x1000 / JB - Match Any)
        else {
            if (!draw.numbers || draw.numbers.length === 0) return;
            const drawNumbers = new Set(draw.numbers as string[]);

            for (const ticket of tickets) {
                const ticketNumbers = (ticket.numbers as unknown as string[]);
                const hasMatch = ticketNumbers.some(n => drawNumbers.has(n));

                await this.updateTicketStatus(tx, ticket, hasMatch ? 'WON' : 'LOST', () => {
                    if (hasMatch) wonCount++; else lostCount++;
                });
            }
        }

        console.log(`[ProcessResults] Draw ${draw.id} (${gameType}) Processed: ${wonCount} Won, ${lostCount} Lost.`);
    }

    private async updateTicketStatus(tx: Prisma.TransactionClient, ticket: any, newStatus: string, callback?: () => void) {
        if (ticket.status !== newStatus) {
            // Credit Logic
            if (newStatus === 'WON' && ticket.status !== 'WON') {
                const prizeValue = Number(ticket.possiblePrize || 0);
                if (prizeValue > 0) {
                    await tx.transaction.create({
                        data: {
                            userId: ticket.userId,
                            amount: prizeValue,
                            type: 'CREDIT',
                            description: `Prêmio Bilhete ${ticket.hash?.substring(0, 8) ?? 'ID'}`
                        }
                    });
                }
            }

            // Debit Logic (Reversal)
            if (ticket.status === 'WON' && newStatus === 'LOST') {
                const prizeValue = Number(ticket.possiblePrize || 0);
                if (prizeValue > 0) {
                    await tx.transaction.create({
                        data: {
                            userId: ticket.userId,
                            amount: prizeValue,
                            type: 'DEBIT',
                            description: `Estorno Prêmio Bilhete ${ticket.hash?.substring(0, 8) ?? 'ID'}`
                        }
                    });
                }
            }

            if (callback) callback();

            await tx.ticket.update({
                where: { id: ticket.id },
                data: { status: newStatus }
            });
        }
    }

    async findAll(companyId?: string) {
        // ✅ CRÍTICO: companyId é OBRIGATÓRIO para isolamento de dados
        if (!companyId) {
            throw new Error('companyId é obrigatório para listar sorteios');
        }

        return this.prisma.draw.findMany({
            where: { companyId },
            include: { game: true },
            orderBy: { drawDate: 'desc' }
        });
    }

    async findByGame(gameId: string, companyId?: string) {
        const where: any = { gameId };
        if (companyId) {
            where.companyId = companyId;
        }
        return this.prisma.draw.findMany({
            where,
            orderBy: { drawDate: 'desc' }
        });
    }

    async findOne(id: string) {
        return this.prisma.draw.findUnique({ where: { id } });
    }

    async update(id: string, data: Prisma.DrawUpdateInput, companyId?: string) {
        // Security Check
        const exists = await this.prisma.draw.findFirst({
            where: { id, ...(companyId ? { companyId } : {}) }
        });
        if (!exists) throw new Error("Sorteio não encontrado ou acesso negado.");

        const updatedDraw = await this.prisma.draw.update({
            where: { id },
            data,
        });

        // Trigger result processing if numbers are present
        if (updatedDraw.numbers && (updatedDraw.numbers as unknown as string[]).length > 0) {
            // Re-use main prisma as tx client
            await this.processDrawResults(this.prisma, updatedDraw);
        }

        return updatedDraw;
    }

    async remove(id: string, companyId?: string) {
        const exists = await this.prisma.draw.findFirst({
            where: { id, ...(companyId ? { companyId } : {}) }
        });
        if (!exists) throw new Error("Sorteio não encontrado ou acesso negado.");

        return this.prisma.draw.delete({ where: { id } });
    }

    async getDrawDetails(id: string, companyId?: string) {
        const draw = await this.prisma.draw.findFirst({
            where: {
                id,
                ...(companyId ? { companyId } : {})
            },
            include: { game: true }
        });

        if (!draw) return null;

        // Find tickets for this draw
        // Calculate timezone offsets to handle legacy data mismatch
        const exactDate = draw.drawDate;
        const minus3h = new Date(exactDate.getTime() - 3 * 60 * 60 * 1000);
        const plus3h = new Date(exactDate.getTime() + 3 * 60 * 60 * 1000);

        const tickets = await this.prisma.ticket.findMany({
            where: {
                gameId: draw.gameId,
                OR: [
                    { drawDate: exactDate },
                    // LEGACY FIX: Handle potential timezone differences in older records (UTC-3 vs UTC)
                    { drawDate: minus3h },
                    { drawDate: plus3h }
                ]
            },
            include: {
                user: {
                    include: {
                        area: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Calculate stats
        const totalSales = tickets.reduce((sum, t) => sum + Number(t.amount), 0);
        const totalPrizes = tickets
            .filter(t => t.status === 'WON')
            .reduce((sum, t) => sum + Number(t.possiblePrize || 0), 0);

        return {
            draw,
            tickets,
            stats: {
                totalSales,
                totalPrizes,
                ticketCount: tickets.length,
                winningCount: tickets.filter(t => t.status === 'WON').length
            }
        };
    }

    /**
     * Calculates the total potential payout (liability) for each number in a specific draw.
     * Essential for the Admin Risk Dashboard.
     */
    async getLiabilityReport(gameId: string, drawDate: string, companyId?: string) {
        // Validation of Game Ownership
        if (companyId) {
            const game = await this.prisma.game.findFirst({
                where: { id: gameId, companyId }
            });
            if (!game) throw new Error("Jogo não encontrado ou acesso negado.");
        }

        const cacheKey = `liability:${gameId}:${drawDate}`;
        const cached = await this.redis.get(cacheKey);

        if (cached) {
            return JSON.parse(cached);
        }

        const date = new Date(drawDate);
        const tickets = await this.prisma.ticket.findMany({
            where: {
                gameId,
                drawDate: date,
                status: { in: ['PENDING', 'WON', 'PAID'] } // include active bets
            }
        });

        const liabilityMap: Record<string, number> = {};

        tickets.forEach(ticket => {
            (ticket.numbers as unknown as string[]).forEach(num => {
                const numStr = num.toString().padStart(4, '0');
                liabilityMap[numStr] = (liabilityMap[numStr] || 0) + Number(ticket.possiblePrize || 0);
            });
        });

        // Convert to array and sort by risk (liability)
        const report = Object.entries(liabilityMap)
            .map(([number, liability]) => ({ number, liability }))
            .sort((a, b) => b.liability - a.liability);

        // Cache for 60 seconds
        await this.redis.set(cacheKey, JSON.stringify(report), 60);

        return report;
    }
}
