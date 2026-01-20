import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, TicketStatus } from '@repo/database';
import { toBrazilTime, dayjs } from '../utils/date.util';

@Injectable()
export class SecondChanceService {
    constructor(private prisma: PrismaService) { }

    async create(data: { gameId: string; winningNumber: number; prizeAmount: number; drawDate: string; series?: number; companyId?: string }) {
        // Validate Game Ownership
        if (data.companyId) {
            const game = await this.prisma.game.findFirst({
                where: { id: data.gameId, companyId: data.companyId }
            });
            if (!game) throw new BadRequestException("Jogo não encontrado ou acesso negado.");
        }

        return this.prisma.$transaction(async (tx) => {
            const drawDate = toBrazilTime(data.drawDate).startOf('day').toDate();

            // 1. Create the Draw record
            const createdDraw = await tx.secondChanceDraw.create({
                data: {
                    gameId: data.gameId,
                    winningNumber: data.winningNumber,
                    prizeAmount: new Prisma.Decimal(data.prizeAmount),
                    drawDate: drawDate,
                    series: data.series ? Number(data.series) : null
                }
            });

            // 2. Process Winners
            await this.processWinners(tx, createdDraw);

            return createdDraw;
        });
    }

    private async processWinners(tx: Prisma.TransactionClient, draw: any) {
        const startOfDay = toBrazilTime(draw.drawDate).startOf('day').toDate();
        const endOfDay = toBrazilTime(draw.drawDate).endOf('day').toDate();

        // Find tickets for the same game, same range of day, with matching number
        const where: any = {
            gameId: draw.gameId,
            secondChanceDrawDate: {
                gte: startOfDay,
                lte: endOfDay
            },
            secondChanceNumber: draw.winningNumber,
            status: { not: 'CANCELLED' }
        };

        // NEW: Filter by series if draw is series-specific
        if (draw.series !== null && draw.series !== undefined) {
            where.series = draw.series;
        }

        const tickets = await tx.ticket.findMany({
            where: where
        });

        for (const ticket of tickets) {
            // Update ticket status
            await tx.ticket.update({
                where: { id: ticket.id },
                data: { secondChanceStatus: 'WON' as TicketStatus }
            });

            // Credit the Cambista
            await tx.transaction.create({
                data: {
                    userId: ticket.userId,
                    amount: draw.prizeAmount,
                    type: 'CREDIT',
                    description: `Prêmio Segunda Chance - Bilhete ${ticket.hash?.substring(0, 8) || 'ID'}`
                }
            });
        }

        console.log(`[SecondChance] Processed ${tickets.length} winners for draw ${draw.id}`);
    }

    async findAll(companyId?: string) {
        return this.prisma.secondChanceDraw.findMany({
            where: companyId ? { game: { companyId } } : undefined,
            include: { game: true },
            orderBy: { drawDate: 'desc' }
        });
    }

    async findWinners(drawId: string, companyId?: string) {
        const draw = await this.prisma.secondChanceDraw.findUnique({
            where: { id: drawId },
            include: { game: true }
        });

        if (!draw) throw new BadRequestException("Sorteio não encontrado");
        if (companyId && draw.game.companyId !== companyId) throw new BadRequestException("Acesso negado.");

        const startOfDay = toBrazilTime(draw.drawDate).startOf('day').toDate();
        const endOfDay = toBrazilTime(draw.drawDate).endOf('day').toDate();

        const where: any = {
            gameId: draw.gameId,
            secondChanceDrawDate: {
                gte: startOfDay,
                lte: endOfDay
            },
            secondChanceNumber: draw.winningNumber,
            status: { not: 'CANCELLED' }
        };

        if (draw.series !== null && draw.series !== undefined) {
            where.series = (draw as any).series;
        }

        return this.prisma.ticket.findMany({
            where: where,
            include: {
                user: {
                    include: { area: true }
                }
            }
        });
    }

    async findParticipants(drawId: string, companyId?: string) {
        const draw = await this.prisma.secondChanceDraw.findUnique({
            where: { id: drawId },
            include: { game: true }
        });

        if (!draw) throw new BadRequestException("Sorteio não encontrado");
        if (companyId && draw.game.companyId !== companyId) throw new BadRequestException("Acesso negado.");

        const startOfDay = toBrazilTime(draw.drawDate).startOf('day').toDate();
        const endOfDay = toBrazilTime(draw.drawDate).endOf('day').toDate();

        const where: any = {
            gameId: draw.gameId,
            secondChanceDrawDate: {
                gte: startOfDay,
                lte: endOfDay
            },
            status: { not: 'CANCELLED' }
        };

        if (draw.series !== null && draw.series !== undefined) {
            where.series = (draw as any).series;
        }

        return this.prisma.ticket.findMany({
            where: where,
            include: {
                user: {
                    select: { name: true, username: true, area: { select: { name: true } } }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async remove(id: string, companyId?: string) {
        const draw = await this.prisma.secondChanceDraw.findUnique({
            where: { id },
            include: { game: true }
        });

        if (!draw) throw new BadRequestException("Sorteio não encontrado");
        if (companyId && draw.game.companyId !== companyId) throw new BadRequestException("Acesso negado.");

        return this.prisma.secondChanceDraw.delete({ where: { id } });
    }

    async findUpcomingNumbers(companyId?: string) {
        const now = new Date();
        const startOfToday = new Date(now.setHours(0, 0, 0, 0));

        // 1. Determine the next Date that has any tickets with Second Chance
        const nextDrawTicket = await this.prisma.ticket.findFirst({
            where: {
                companyId: companyId,
                secondChanceDrawDate: { gte: startOfToday },
                status: { not: 'CANCELLED' }
            },
            orderBy: { secondChanceDrawDate: 'asc' },
            select: { secondChanceDrawDate: true }
        });

        if (!nextDrawTicket || !nextDrawTicket.secondChanceDrawDate) {
            return [];
        }

        const targetDate = nextDrawTicket.secondChanceDrawDate;
        const startOfTargetDate = new Date(targetDate);
        startOfTargetDate.setHours(0, 0, 0, 0);
        const endOfTargetDate = new Date(targetDate);
        endOfTargetDate.setHours(23, 59, 59, 999);

        // 2. Fetch Tickets for that date, grouping/selecting relevant info
        // We'll fetch raw tickets to group in JS or use groupBy (distinct) logic.
        // Prisma groupBy doesn't support relations/include easily for game name.
        // So we fetch tickets with Game included.
        const tickets = await this.prisma.ticket.findMany({
            where: {
                companyId: companyId,
                secondChanceDrawDate: {
                    gte: startOfTargetDate,
                    lte: endOfTargetDate
                },
                status: { not: 'CANCELLED' }
            },
            select: {
                id: true,
                secondChanceNumber: true,
                game: {
                    select: { id: true, name: true }
                }
            },
            orderBy: { game: { name: 'asc' } }
        });

        // 3. Group by Game
        const grouped: Record<string, { gameId: string, gameName: string, date: Date, numbers: any[] }> = {};

        for (const t of tickets) {
            if (t.secondChanceNumber === null) continue;
            const gName = t.game?.name || 'Desconhecido';
            const gId = t.game?.id || 'unknown';

            if (!grouped[gId]) {
                grouped[gId] = {
                    gameId: gId,
                    gameName: gName,
                    date: targetDate,
                    numbers: []
                };
            }
            // Store number AND ticketId
            // Deduplication logic: If multiple tickets have same number (rare but possible), we just pick one?
            // SecondChance usually allows multiple winners? Or unique? 
            // If unique per series, then it's fine.
            // Let's store object { number: 1234, ticketId: '...' }
            // To avoid duplicates in visualization, check if number exists?
            const exists = grouped[gId].numbers.find((n: any) => n.number === t.secondChanceNumber);
            if (!exists) {
                grouped[gId].numbers.push({ number: t.secondChanceNumber, ticketId: t.id });
            }
        }

        // 4. Format Result
        return Object.values(grouped).map(g => ({
            ...g,
            numbers: g.numbers.sort((a: any, b: any) => a.number - b.number)
        }));
    }
}
