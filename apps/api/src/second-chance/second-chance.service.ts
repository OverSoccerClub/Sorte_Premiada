import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, TicketStatus } from '@repo/database';
import { toBrazilTime, dayjs } from '../utils/date.util';

@Injectable()
export class SecondChanceService {
    constructor(private prisma: PrismaService) { }

    async create(data: { gameId: string; winningNumber: number; prizeAmount: number; drawDate: string }) {
        return this.prisma.$transaction(async (tx) => {
            const drawDate = toBrazilTime(data.drawDate).startOf('day').toDate();

            // 1. Create the Draw record
            const createdDraw = await tx.secondChanceDraw.create({
                data: {
                    gameId: data.gameId,
                    winningNumber: data.winningNumber,
                    prizeAmount: new Prisma.Decimal(data.prizeAmount),
                    drawDate: drawDate,
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
        const tickets = await tx.ticket.findMany({
            where: {
                gameId: draw.gameId,
                secondChanceDrawDate: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                secondChanceNumber: draw.winningNumber,
                status: { not: 'CANCELLED' }
            }
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

    async findAll() {
        return this.prisma.secondChanceDraw.findMany({
            include: { game: true },
            orderBy: { drawDate: 'desc' }
        });
    }

    async findWinners(drawId: string) {
        const draw = await this.prisma.secondChanceDraw.findUnique({
            where: { id: drawId }
        });

        if (!draw) throw new BadRequestException("Sorteio não encontrado");

        const startOfDay = toBrazilTime(draw.drawDate).startOf('day').toDate();
        const endOfDay = toBrazilTime(draw.drawDate).endOf('day').toDate();

        return this.prisma.ticket.findMany({
            where: {
                gameId: draw.gameId,
                secondChanceDrawDate: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                secondChanceNumber: draw.winningNumber,
                status: { not: 'CANCELLED' }
            },
            include: {
                user: {
                    include: { area: true }
                }
            }
        });
    }

    async findParticipants(drawId: string) {
        const draw = await this.prisma.secondChanceDraw.findUnique({
            where: { id: drawId }
        });

        if (!draw) throw new BadRequestException("Sorteio não encontrado");

        const startOfDay = toBrazilTime(draw.drawDate).startOf('day').toDate();
        const endOfDay = toBrazilTime(draw.drawDate).endOf('day').toDate();

        return this.prisma.ticket.findMany({
            where: {
                gameId: draw.gameId,
                secondChanceDrawDate: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                status: { not: 'CANCELLED' }
            },
            include: {
                user: {
                    select: { name: true, username: true, area: { select: { name: true } } }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async remove(id: string) {
        // Reversal logic could be added here if needed, but usually draws once processed are final.
        return this.prisma.secondChanceDraw.delete({ where: { id } });
    }
}
