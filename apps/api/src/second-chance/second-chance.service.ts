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
}
