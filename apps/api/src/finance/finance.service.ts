import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionType } from '@prisma/client';

@Injectable()
export class FinanceService {
    constructor(private prisma: PrismaService) { }

    async createTransaction(userId: string, data: CreateTransactionDto) {
        const isClosed = await this.isDayClosed(userId);
        if (isClosed) {
            throw new BadRequestException("O caixa do dia já foi fechado. Não é possível adicionar novas movimentações.");
        }

        let cobradorId = undefined;
        if (data.cobradorId) {
            if (!data.pin) {
                throw new BadRequestException("PIN do cobrador é obrigatório para sangrias.");
            }

            const cobrador = await this.prisma.user.findUnique({
                where: { id: data.cobradorId },
            });

            if (!cobrador || cobrador.role !== 'COBRADOR') {
                throw new BadRequestException("Cobrador inválido.");
            }

            if (cobrador.securityPin !== data.pin) {
                throw new BadRequestException("PIN incorreto.");
            }
            cobradorId = data.cobradorId;
        }

        return this.prisma.transaction.create({
            data: {
                description: data.description,
                amount: data.amount,
                type: data.type,
                userId: userId,
                cobradorId: cobradorId,
            },
        });
    }

    async getSummary(userId: string) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // 1. Get Tickets Sales (Exclude Cancelled)
        const tickets = await this.prisma.ticket.findMany({
            where: {
                userId, // Filter by User
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                status: {
                    not: 'CANCELLED',
                }
            },
        });

        const totalSales = tickets.reduce((sum, ticket) => sum + Number(ticket.amount), 0);

        // 2. Get Transactions
        const transactions = await this.prisma.transaction.findMany({
            where: {
                userId,
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        const manualCredits = transactions
            .filter((t) => t.type === TransactionType.CREDIT)
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const totalDebits = transactions
            .filter((t) => t.type === TransactionType.DEBIT)
            .reduce((sum, t) => sum + Number(t.amount), 0);

        // Per user request: Tickets Sales count as Credits
        const totalCredits = manualCredits + totalSales;

        const finalBalance = totalCredits - totalDebits;

        // Combine Transactions and Tickets for the list
        const ticketTransactions = tickets.map(t => ({
            id: t.id,
            description: `Venda ${t.gameType}`,
            amount: t.amount,
            type: TransactionType.CREDIT,
            createdAt: t.createdAt,
            userId: t.userId
        }));

        const allTransactions = [...transactions, ...ticketTransactions].sort((a, b) =>
            b.createdAt.getTime() - a.createdAt.getTime()
        );

        const isClosed = await this.isDayClosed(userId);

        return {
            date: new Date(),
            isClosed,
            totalSales,
            totalCredits,
            totalDebits,
            finalBalance,
            transactions: allTransactions,
            tickets: tickets.map(t => ({
                id: t.id,
                gameType: t.gameType,
                numbers: t.numbers,
                amount: t.amount,
                createdAt: t.createdAt
            }))
        };
    }

    async getTransactions(userId: string) {
        // Re-using logic or just getting transactions
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        return this.prisma.transaction.findMany({
            where: {
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async closeDay(userId: string) {
        const summary = await this.getSummary(userId);

        // Create DailyClose Record
        const dailyClose = await this.prisma.dailyClose.create({
            data: {
                totalSales: summary.totalSales,
                totalCredits: summary.totalCredits,
                totalDebits: summary.totalDebits,
                finalBalance: summary.finalBalance,
                closedByUserId: userId,
                netBalance: summary.finalBalance, // Net balance same as final for now unless commission logic added
            },
        });

        return dailyClose;
    }

    async isDayClosed(userId: string): Promise<boolean> {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const closeRecord = await this.prisma.dailyClose.findFirst({
            where: {
                closedByUserId: userId,
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
        });

        return !!closeRecord;
    }
}
