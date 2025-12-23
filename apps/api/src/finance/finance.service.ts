import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionType } from '@prisma/client';

enum DailyCloseStatus {
    PENDING = 'PENDING',
    VERIFIED = 'VERIFIED',
    REJECTED = 'REJECTED'
}

@Injectable()
export class FinanceService {
    constructor(private prisma: PrismaService) { }

    async createTransaction(userId: string, data: CreateTransactionDto) {
        await this.validateSalesEligibility(userId); // Validate limit and box status

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

        const isClosed = await this.validateSalesEligibility(userId).then(() => false).catch(() => true);

        // Fetch User Limit
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { salesLimit: true, limitOverrideExpiresAt: true } });

        return {
            date: new Date(),
            isClosed,
            salesLimit: user?.salesLimit ? Number(user.salesLimit) : null,
            limitOverrideExpiresAt: user?.limitOverrideExpiresAt,
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

        // Check if already closed today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const existingClose = await this.prisma.dailyClose.findFirst({
            where: {
                closedByUserId: userId,
                createdAt: { gte: startOfDay, lte: endOfDay }
            }
        });

        if (existingClose) {
            throw new BadRequestException("O caixa de hoje já foi fechado.");
        }

        // Create DailyClose Record
        const dailyClose = await this.prisma.dailyClose.create({
            data: {
                totalSales: summary.totalSales,
                totalCredits: summary.totalCredits,
                totalDebits: summary.totalDebits,
                finalBalance: summary.finalBalance,
                closedByUserId: userId,
                netBalance: summary.finalBalance,
                status: 'PENDING', // Default to PENDING
            },
        });

        return dailyClose;
    }

    async findAllPendingCloses() {
        return this.prisma.dailyClose.findMany({
            where: { status: 'PENDING' },
            include: { closedByUser: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async verifyDailyClose(closeId: string, adminId: string, status: 'VERIFIED' | 'REJECTED') {
        const dailyClose = await this.prisma.dailyClose.update({
            where: { id: closeId },
            data: {
                status: status,
                verifiedByUserId: adminId,
                verifiedAt: new Date()
            }
        });
        return dailyClose;
    }

    // New Validation Logic replacing isDayClosed
    async validateSalesEligibility(userId: string, amountToAdd: number = 0): Promise<void> {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // 1. Check if TODAY is closed
        const todayClose = await this.prisma.dailyClose.findFirst({
            where: {
                closedByUserId: userId,
                createdAt: { gte: startOfDay, lte: endOfDay },
            },
        });

        if (todayClose) {
            throw new BadRequestException("O caixa do dia de hoje já está fechado.");
        }

        // 2. Check if YESTERDAY (or last closed session) is PENDING verification
        // Logic: Find the *latest* DailyClose. If it exists and is PENDING, block.
        // Unless we only block if it's strictly "Yesterday"? 
        // Requirement: "no dia seguinte ele tenha como vender normalmente com o caixa dele conferido"
        // So if specific previous day is not verified, block.
        // Let's implement strict "Latest Close must be Verified" policy for safety.

        const lastClose = await this.prisma.dailyClose.findFirst({
            where: { closedByUserId: userId },
            orderBy: { createdAt: 'desc' }
        });

        if (lastClose && lastClose.status === 'PENDING') {
            // Check if it's from a previous day (not just closed moments ago today, though today is already handled above)
            // Actually, if today is closed, we already threw. So lastClose must be from past.
            // If it is PENDING, we block.
            throw new BadRequestException("O caixa anterior ainda não foi conferido pelo supervisor.");
        }

        // 3. Check Sales Limit
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { salesLimit: true, limitOverrideExpiresAt: true }
        });

        if (user && user.salesLimit) {
            // Check override
            if (user.limitOverrideExpiresAt && user.limitOverrideExpiresAt > new Date()) {
                // Limit is overridden/unlocked, skip check
                return;
            }

            const summary = await this.getSummary(userId);
            const currentTotal = Number(summary.totalSales); // Assuming totalSales is what we track against limit

            if (currentTotal + amountToAdd > Number(user.salesLimit)) {
                throw new BadRequestException(`Limite de vendas diário atingido (R$ ${user.salesLimit}). Contate o supervisor.`);
            }
        }
    }

    // Deprecated or alias to new logic if needed by other services (e.g. TicketsService)
    async isDayClosed(userId: string): Promise<boolean> {
        try {
            await this.validateSalesEligibility(userId);
            return false;
        } catch (e) {
            return true;
        }
    }
}
