
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

                // ✅ NOVO: Se o sorteio é de uma Praça, incrementar a currentSeries da Praça
                // Requisito: "o sistema deve incrementar para a serie 0002 apos cada sorteio"
                if (areaId) {
                    const area = await tx.area.findUnique({ where: { id: areaId } });
                    if (area) {
                        const nextSeries = (parseInt(area.currentSeries) + 1).toString().padStart(4, '0');
                        await tx.area.update({
                            where: { id: areaId },
                            data: {
                                currentSeries: nextSeries,
                                ticketsInSeries: 0 // Reseta o contador de bilhetes vendidos dessa nova série?
                                // Se a série é "Lote de Vendas", faz sentido zerar.
                                // Se o requisito diz "Apos cada sorteio", entende-se que a série velha fechou.
                            }
                        });
                        console.log(`[DrawsService] Area ${areaId} series rotated to ${nextSeries}`);
                    }
                }

                const createdDraw = await tx.draw.create({
                    data: {
                        ...data,
                        description: data.description || null,
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

        // PALPITA AI Logic (Ordered Match Results)
        if (gameType === 'PAIPITA_AI') {
            if (!fullDraw.matches || fullDraw.matches.length !== 14) return;

            // Check if all matches have results
            const results = fullDraw.matches.map(m => m.result);
            if (results.some(r => !r || r === '')) return; // Not ready

            // 1. Calculate Revenue and Prize Pool
            // Filter tickets that are valid users (prevent test/admin tickets from skewing if needed, but usually all tickets count)
            // Assuming 'PENDING' or 'PAID' are valid. 'WON'/'LOST' usually means already processed, but we might be re-processing.
            // Safety: We use all non-cancelled tickets to calculate pool.
            const validTickets = tickets.filter(t => t.status !== 'CANCELLED');

            const totalRevenue = validTickets.reduce((sum, t) => sum + Number(t.amount), 0);
            const prizePool = totalRevenue * 0.70; // 70% of Revenue

            // 2. Identify Winners by Tier
            const winners14: typeof tickets = [];
            const winners13: typeof tickets = [];
            const winners12: typeof tickets = [];
            const losers: typeof tickets = [];

            for (const ticket of validTickets) {
                const guesses = ticket.numbers as string[];
                if (!guesses || guesses.length !== 14) {
                    losers.push(ticket);
                    continue;
                }

                let hits = 0;
                guesses.forEach((g, i) => {
                    if (g === results[i]) hits++;
                });

                // Store hits for debugging/display if we had a field for it (we assumed `hits` in plan but it's not in schema yet)
                // We will just process the win status.

                if (hits === 14) winners14.push(ticket);
                else if (hits === 13) winners13.push(ticket);
                else if (hits === 12) winners12.push(ticket);
                else losers.push(ticket);
            }

            // 3. Calculate Individual Prizes
            // 80% for 14 hits, 15% for 13 hits, 5% for 12 hits
            const pool14 = prizePool * 0.80;
            const pool13 = prizePool * 0.15;
            const pool12 = prizePool * 0.05;

            const prizePer14 = winners14.length > 0 ? pool14 / winners14.length : 0;
            const prizePer13 = winners13.length > 0 ? pool13 / winners13.length : 0;
            const prizePer12 = winners12.length > 0 ? pool12 / winners12.length : 0;

            console.log(`[PalpitaAi] Revenue: ${totalRevenue}, Pool: ${prizePool}`);
            console.log(`[PalpitaAi] Winners: 14pts=${winners14.length} (R$${prizePer14.toFixed(2)}), 13pts=${winners13.length} (R$${prizePer13.toFixed(2)}), 12pts=${winners12.length} (R$${prizePer12.toFixed(2)})`);

            // 4. Update Tickets
            // Helper to batch update status
            const updateBatch = async (list: typeof tickets, status: string, amount: number) => {
                for (const ticket of list) {
                    await this.updateTicketStatus(tx, ticket, status, amount, () => {
                        if (status === 'WON') wonCount++; else lostCount++;
                    });
                }
            };

            await updateBatch(winners14, 'WON', prizePer14);
            await updateBatch(winners13, 'WON', prizePer13);
            await updateBatch(winners12, 'WON', prizePer12);
            await updateBatch(losers, 'LOST', 0);
        }
        // Existing Logic (2x1000 / JB - Suffix Match)
        else {
            if (!draw.numbers || draw.numbers.length === 0) return;
            const drawNumbers = draw.numbers as string[];

            // Pre-fetch prize values (fallback to defaults if not set)
            // Assuming fullDraw.game has these fields based on schema check
            // Fallback values updated to match user config (1000/30/10)
            const prizeMilhar = Number(fullDraw.game.prizeMilhar || 1000);
            const prizeCentena = Number(fullDraw.game.prizeCentena || 30);
            const prizeDezena = Number(fullDraw.game.prizeDezena || 10);

            for (const ticket of tickets) {
                const ticketNumbers = (ticket.numbers as unknown as string[]);
                let bestMatch = 0; // 0=None, 2=Dezena, 3=Centena, 4=Milhar

                check_loop:
                for (const myNum of ticketNumbers) {
                    for (const winNum of drawNumbers) {
                        if (myNum === winNum) {
                            bestMatch = 4;
                            break check_loop; // Stop at highest prize
                        } else if (myNum.endsWith(winNum.slice(-3)) && winNum.length >= 3) {
                            bestMatch = Math.max(bestMatch, 3);
                        } else if (myNum.endsWith(winNum.slice(-2)) && winNum.length >= 2) {
                            bestMatch = Math.max(bestMatch, 2);
                        }
                    }
                }

                // Determine Prize Value
                let wonAmount = 0;
                if (bestMatch === 4) wonAmount = prizeMilhar;
                else if (bestMatch === 3) wonAmount = prizeCentena;
                else if (bestMatch === 2) wonAmount = prizeDezena;

                const isWin = bestMatch > 0;

                await this.updateTicketStatus(tx, ticket, isWin ? 'WON' : 'LOST', wonAmount, () => {
                    if (isWin) wonCount++; else lostCount++;
                });
            }
        }

        console.log(`[ProcessResults] Draw ${draw.id} (${gameType}) Processed: ${wonCount} Won, ${lostCount} Lost.`);
    }

    private async updateTicketStatus(tx: Prisma.TransactionClient, ticket: any, newStatus: string, prizeAmount: number = 0, callback?: () => void) {
        if (ticket.status !== newStatus) {
            // Credit Logic
            if (newStatus === 'WON' && ticket.status !== 'WON') {
                // Use calculated prizeAmount instead of ticket.possiblePrize
                const finalPrize = prizeAmount > 0 ? prizeAmount : Number(ticket.possiblePrize || 0);

                if (finalPrize > 0) {
                    await tx.transaction.create({
                        data: {
                            userId: ticket.userId,
                            amount: finalPrize,
                            type: 'CREDIT',
                            description: `Prêmio Bilhete ${ticket.hash?.substring(0, 8) ?? 'ID'}`
                        }
                    });
                }
            }

            // Debit Logic (Reversal) - If status changes back from WON to LOST (re-calc)
            if (ticket.status === 'WON' && newStatus === 'LOST') {
                // Reversal should match what was paid. This is tricky without tracking exact payout id.
                // Assuming reversal of currently stored prize value.
                const reversalAmount = Number(ticket.possiblePrize || 0);
                if (reversalAmount > 0) {
                    await tx.transaction.create({
                        data: {
                            userId: ticket.userId,
                            amount: reversalAmount,
                            type: 'DEBIT',
                            description: `Estorno Prêmio Bilhete ${ticket.hash?.substring(0, 8) ?? 'ID'}`
                        }
                    });
                }
            }

            if (callback) callback();

            // Update Ticket with Status AND final Prize Amount if Won
            await tx.ticket.update({
                where: { id: ticket.id },
                data: {
                    status: newStatus as any,
                    possiblePrize: newStatus === 'WON' ? prizeAmount : ticket.possiblePrize
                    // Update possiblePrize to reflect actual won amount for display/consistency
                    // If LOST, keep original potential? Or zero? 
                    // Usually keep original potential for record of "what could have been" or just keep as is.
                    // But for WON, we overwrite with actual WON amount.
                }
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
            include: {
                game: true,
                area: true,
                matches: { orderBy: { matchOrder: 'asc' } }
            },
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
            orderBy: { drawDate: 'desc' },
            include: {
                area: true,
                matches: { orderBy: { matchOrder: 'asc' } }
            }
        });
    }

    async findOne(id: string) {
        return this.prisma.draw.findUnique({ where: { id } });
    }

    async update(id: string, data: any, companyId?: string) {
        // Security Check
        const exists = await this.prisma.draw.findFirst({
            where: { id, ...(companyId ? { companyId } : {}) }
        });
        if (!exists) throw new Error("Sorteio não encontrado ou acesso negado.");

        const { matches, ...drawData } = data;

        return this.prisma.$transaction(async (tx) => {
            const updatedDraw = await tx.draw.update({
                where: { id },
                data: drawData,
            });

            if (matches && Array.isArray(matches) && matches.length > 0) {
                // Delete existing matches
                await tx.soccerMatch.deleteMany({ where: { drawId: id } });

                // Create new matches
                // Note: using createMany is more efficient
                await tx.soccerMatch.createMany({
                    data: matches.map((m: any) => ({
                        drawId: id,
                        homeTeam: m.homeTeam,
                        awayTeam: m.awayTeam,
                        matchDate: new Date(m.matchDate),
                        matchOrder: Number(m.matchOrder),
                        result: m.result || null
                    }))
                });
            }

            // Trigger result processing if numbers are present
            if (updatedDraw.numbers && (updatedDraw.numbers as unknown as string[]).length > 0) {
                // Re-use transaction client
                await this.processDrawResults(tx as any, updatedDraw);
            }

            return updatedDraw;
        });
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
            include: { game: true, matches: { orderBy: { matchOrder: 'asc' } } }
        });

        if (!draw) return null;

        // Find tickets for this draw
        // Calculate timezone offsets to handle legacy data mismatch
        const exactDate = draw.drawDate;
        const minus3h = new Date(exactDate.getTime() - 3 * 60 * 60 * 1000);
        const plus3h = new Date(exactDate.getTime() + 3 * 60 * 60 * 1000);

        // Build where clause for tickets
        const ticketWhere: any = {
            gameId: draw.gameId,
            OR: [
                { drawDate: exactDate },
                // LEGACY FIX: Handle potential timezone differences in older records (UTC-3 vs UTC)
                { drawDate: minus3h },
                { drawDate: plus3h }
            ]
        };

        // CRITICAL: Filter by area if draw is linked to a specific location
        // This ensures proper series/location isolation
        if (draw.areaId) {
            ticketWhere.user = {
                areaId: draw.areaId
            };
        }

        const tickets = await this.prisma.ticket.findMany({
            where: ticketWhere,
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
