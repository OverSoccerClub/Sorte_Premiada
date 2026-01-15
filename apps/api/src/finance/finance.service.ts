import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { getBrazilStartOfDay, getBrazilEndOfDay } from '../utils/date.util';

enum DailyCloseStatus {
    PENDING = 'PENDING',
    VERIFIED = 'VERIFIED',
    REJECTED = 'REJECTED'
}

@Injectable()
export class FinanceService {
    constructor(private prisma: PrismaService, private notificationsService: NotificationsService) { }

    async createTransaction(userId: string, companyId: string, data: CreateTransactionDto) {
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
                category: data.category || 'SALE',
                userId: userId,
                companyId: companyId, // Save companyId
                cobradorId: cobradorId,
            },
        });
    }

    async getSummary(userId: string, companyId?: string) {
        const startOfDay = getBrazilStartOfDay();
        const endOfDay = getBrazilEndOfDay();

        // 1. Get Tickets Sales (Exclude Cancelled)
        const tickets = await this.prisma.ticket.findMany({
            where: {
                userId, // Filter by User
                companyId: companyId, // Validar isolamento
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
        const totalCommission = tickets.reduce((sum, ticket) => sum + Number(ticket.commissionValue || 0), 0);

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

        // Cash in Hand
        const finalBalance = totalCredits - totalDebits;

        // Net Payable (What the user owes the house)
        // = Cash in Hand - Commission
        // (Assuming Prizes Paid are already in totalDebits if paid manually, or if we subtract prizes... 
        //  If prize paid via app validation flow later, we might deduct here strictly. 
        //  For now, standard flow: Balance - Commission)
        const netBalance = finalBalance - totalCommission;

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

        // Fetch User Limit and Sales Goal Threshold
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                salesLimit: true,
                limitOverrideExpiresAt: true,
                minSalesThreshold: true
            }
        });

        return {
            date: new Date(),
            isClosed,
            salesLimit: user?.salesLimit ? Number(user.salesLimit) : null,
            limitOverrideExpiresAt: user?.limitOverrideExpiresAt,
            totalSales,
            totalCommission, // New field in summary
            totalCredits,
            totalDebits,
            finalBalance,
            netBalance, // New field in summary
            minSalesThreshold: user?.minSalesThreshold ? Number(user.minSalesThreshold) : 200,
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
        const startOfDay = getBrazilStartOfDay();
        const endOfDay = getBrazilEndOfDay();

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

    async closeDay(userId: string, physicalCashReported?: number) {
        const summary = await this.getSummary(userId);

        const variance = physicalCashReported !== undefined
            ? Number(physicalCashReported) - summary.finalBalance
            : null;

        // Check if already closed today
        const startOfDay = getBrazilStartOfDay();
        const endOfDay = getBrazilEndOfDay();

        const existingClose = await this.prisma.dailyClose.findFirst({
            where: {
                closedByUserId: userId,
                createdAt: { gte: startOfDay, lte: endOfDay }
            }
        });

        if (existingClose) {
            if (existingClose.status === 'VERIFIED') {
                // If verified, we allow re-closing (updating) to include new sales.
                // Reset status to PENDING so it can be verified again.
                return this.prisma.dailyClose.update({
                    where: { id: existingClose.id },
                    data: {
                        totalSales: summary.totalSales,
                        totalCredits: summary.totalCredits,
                        totalDebits: summary.totalDebits,
                        finalBalance: summary.finalBalance,
                        netBalance: summary.netBalance,
                        totalCommission: summary.totalCommission,
                        physicalCashReported: physicalCashReported,
                        variance: variance,
                        status: 'PENDING',
                        verifiedByUserId: null,
                        verifiedAt: null
                    }
                });
            }
            throw new BadRequestException("O caixa de hoje já foi fechado.");
        }

        // Create DailyClose Record
        const dailyClose = await this.prisma.dailyClose.create({
            data: {
                totalSales: summary.totalSales,
                totalCredits: summary.totalCredits,
                totalDebits: summary.totalDebits,
                finalBalance: summary.finalBalance,
                physicalCashReported: physicalCashReported,
                variance: variance,
                closedByUserId: userId,
                netBalance: summary.netBalance,
                totalCommission: summary.totalCommission,
                status: 'PENDING', // Default to PENDING
            },
        });

        return dailyClose;
    }

    // Admin: close a day for a specific user and optionally auto-verify
    async closeDayForUser(targetUserId: string, adminId: string, autoVerify: boolean = true, physicalCashReported?: number) {
        // Prevent duplicate close for the target user's today
        const startOfDay = getBrazilStartOfDay();
        const endOfDay = getBrazilEndOfDay();

        const existingClose = await this.prisma.dailyClose.findFirst({
            where: { closedByUserId: targetUserId, createdAt: { gte: startOfDay, lte: endOfDay } }
        });

        if (existingClose) {
            // Idempotency: If already closed but pending, and autoVerify is requested, verify it.
            if (existingClose.status === 'PENDING' && autoVerify) {
                return this.verifyDailyClose(existingClose.id, adminId, 'VERIFIED');
            }
            // If already verified or just pending (and autoVerify is false), return it without error.
            return existingClose;
        }

        // Build a summary for the target user
        const summary = await this.getSummary(targetUserId);

        const variance = physicalCashReported !== undefined
            ? Number(physicalCashReported) - summary.finalBalance
            : null;

        const dailyClose = await this.prisma.dailyClose.create({
            data: {
                totalSales: summary.totalSales,
                totalCredits: summary.totalCredits,
                totalDebits: summary.totalDebits,
                finalBalance: summary.finalBalance,
                physicalCashReported: physicalCashReported,
                variance: variance,
                closedByUserId: targetUserId,
                netBalance: summary.netBalance,
                totalCommission: summary.totalCommission,
                status: autoVerify ? 'VERIFIED' : 'PENDING',
                verifiedByUserId: autoVerify ? adminId : null,
                verifiedAt: autoVerify ? new Date() : null,
            }
        });

        if (autoVerify) {
            // Try to send notification and confirm unblocked state
            try {
                await this.verifyDailyClose(dailyClose.id, adminId, 'VERIFIED');
            } catch (e) {
                console.warn('closeDayForUser: verify step failed', e?.message ?? e);
            }
        }

        return dailyClose;
    }

    async findAllPendingCloses(companyId?: string) {
        const where: any = { status: 'PENDING' };
        if (companyId) where.companyId = companyId;

        return this.prisma.dailyClose.findMany({
            where,
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
        // After marking as VERIFIED, verify that sales eligibility is no longer blocked.
        if (status === 'VERIFIED') {
            let unblocked = true;
            try {
                await this.validateSalesEligibility(dailyClose.closedByUserId);
            } catch (e) {
                unblocked = false;
                // keep it non-fatal for the API; just log for operator visibility
                console.warn('verifyDailyClose: user still blocked after verification', { userId: dailyClose.closedByUserId, error: e?.message ?? e });
            }

            // return the DB object plus a transient flag indicating whether sales are now unblocked
            if (unblocked) {
                try {
                    const user = await this.prisma.user.findUnique({ where: { id: dailyClose.closedByUserId }, select: { pushToken: true, username: true } });
                    if (user?.pushToken) {
                        const title = 'Fechamento conferido';
                        const body = 'Seu caixa foi conferido e suas vendas foram liberadas.';
                        await this.notificationsService.sendPushNotification([user.pushToken], title, body, { type: 'close_verified', userId: dailyClose.closedByUserId });
                    }
                } catch (e) {
                    console.warn('verifyDailyClose: failed to send notification', e?.message ?? e);
                }
            }

            return { ...dailyClose, unblocked } as any;
        }

        return dailyClose;
    }

    // New Validation Logic replacing isDayClosed
    async validateSalesEligibility(userId: string, amountToAdd: number = 0): Promise<void> {
        const startOfDay = getBrazilStartOfDay();
        const endOfDay = getBrazilEndOfDay();

        // 1. Check if TODAY is closed
        const todayClose = await this.prisma.dailyClose.findFirst({
            where: {
                closedByUserId: userId,
                createdAt: { gte: startOfDay, lte: endOfDay },
            },
        });

        if (todayClose && todayClose.status !== 'VERIFIED') {
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

        // 3. New Accountability Time Limit Check
        // Logic: Find the FIRST transaction that happened AFTER the last verified close (or after user creation if none).
        // If that transaction is older than user.accountabilityLimitHours, then BLOCK.

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { salesLimit: true, limitOverrideExpiresAt: true, accountabilityLimitHours: true, createdAt: true, isActive: true }
        });

        if (user && user.isActive === false) {
            throw new BadRequestException("Sua conta está bloqueada pelo administrador. Entre em contato com seu supervisor.");
        }

        const limitHours = user?.accountabilityLimitHours ?? 24; // Default 24h

        // Find the specific cutoff time. If the oldest un-closed transaction is OLDER than this, we block.
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - limitHours);

        // We need to find the oldest transaction that is NOT part of a verified daily close.
        // Simplified approach: Look for any transaction created before cutoffTime that is PENDING or NOT in a close?
        // Actually, if we follow the rule: "Closed Pending" is blocked by step 2.
        // So we only care about "Open" transactions.
        // We need to find if there is any transaction OLDER than cutoffTime that hasn't been closed/verified.
        // But since we block "Pending" closes, we just need to check if there are any transactions *regardless of close status* (but wait, verified ones are fine).
        // Correct logic: Find the Latest VERIFIED Close. Any transaction after that is "Open" or "Pending".
        // If the *first* of those transactions is older than Limit, block.

        const lastVerifiedClose = await this.prisma.dailyClose.findFirst({
            where: { closedByUserId: userId, status: 'VERIFIED' },
            orderBy: { createdAt: 'desc' }
        });

        const lastVerifiedDate = lastVerifiedClose ? lastVerifiedClose.createdAt : user?.createdAt;

        // Find the first transaction after the last verified close
        const oldestOpenTransaction = await this.prisma.transaction.findFirst({
            where: {
                userId: userId,
                createdAt: { gt: lastVerifiedDate } // strictly after
            },
            orderBy: { createdAt: 'asc' }
        });

        // Find the first TICKET (Sale) after the last verified close
        const oldestOpenTicket = await this.prisma.ticket.findFirst({
            where: {
                userId: userId,
                createdAt: { gt: lastVerifiedDate },
                status: { not: 'CANCELLED' }
            },
            orderBy: { createdAt: 'asc' }
        });

        let oldestItemDate: Date | null = null;
        let oldestItemType = '';

        if (oldestOpenTransaction && oldestOpenTicket) {
            if (oldestOpenTransaction.createdAt < oldestOpenTicket.createdAt) {
                oldestItemDate = oldestOpenTransaction.createdAt;
                oldestItemType = 'Transação';
            } else {
                oldestItemDate = oldestOpenTicket.createdAt;
                oldestItemType = 'Venda';
            }
        } else if (oldestOpenTransaction) {
            oldestItemDate = oldestOpenTransaction.createdAt;
            oldestItemType = 'Transação';
        } else if (oldestOpenTicket) {
            oldestItemDate = oldestOpenTicket.createdAt;
            oldestItemType = 'Venda';
        }

        if (oldestItemDate) {
            // We have open items. Check if the oldest one is too old.
            if (oldestItemDate < cutoffTime) {
                const limitDate = new Date(oldestItemDate);
                limitDate.setHours(limitDate.getHours() + limitHours);

                throw new BadRequestException(`Bloqueio por falta de prestação de contas. Suas vendas iniciaram em ${oldestItemDate.toLocaleString('pt-BR')} e o limite de ${limitHours}h expirou em ${limitDate.toLocaleString('pt-BR')}. Feche o caixa imediatamente.`);
            }
        }

        // 4. Check Sales Limit
        if (user && user.salesLimit) {
            // Check override
            if (user.limitOverrideExpiresAt && user.limitOverrideExpiresAt > new Date()) {
                // Limit is overridden/unlocked, skip check
                return;
            }


            // Direct query to avoid recursion with getSummary
            const startOfDay = getBrazilStartOfDay();
            const endOfDay = getBrazilEndOfDay();

            const salesAgg = await this.prisma.ticket.aggregate({
                where: {
                    userId,
                    createdAt: { gte: startOfDay, lte: endOfDay },
                    status: { not: 'CANCELLED' }
                },
                _sum: { amount: true }
            });

            const currentTotal = Number(salesAgg._sum.amount || 0);

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
    async getDebugInfo(userId: string) {
        const startOfDay = getBrazilStartOfDay();
        const endOfDay = getBrazilEndOfDay();

        const lastTickets = await this.prisma.ticket.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        const dailyTickets = await this.prisma.ticket.findMany({
            where: {
                userId,
                createdAt: { gte: startOfDay, lte: endOfDay }
            }
        });

        return {
            serverTime: new Date(),
            serverTimeISO: new Date().toISOString(),
            startOfDay,
            endOfDay,
            userId,
            lastTicketsCount: lastTickets.length,
            dailyTicketsCount: dailyTickets.length,
            lastTickets,
            dailyTicketsSample: dailyTickets.slice(0, 3)
        };
    }

    async getAccountabilityInfo(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { accountabilityLimitHours: true, createdAt: true }
        });

        const limitHours = user?.accountabilityLimitHours ?? 24;

        const lastVerifiedClose = await this.prisma.dailyClose.findFirst({
            where: { closedByUserId: userId, status: 'VERIFIED' },
            orderBy: { createdAt: 'desc' }
        });

        const lastVerifiedDate = lastVerifiedClose ? lastVerifiedClose.createdAt : user?.createdAt;

        const oldestOpenTransaction = await this.prisma.transaction.findFirst({
            where: {
                userId: userId,
                createdAt: { gt: lastVerifiedDate }
            },
            orderBy: { createdAt: 'asc' }
        });

        if (!oldestOpenTransaction) {
            return {
                status: 'OK',
                hoursRemaining: null,
                isExpired: false,
                oldestOpenTransactionDate: null,
                limitHours
            };
        }

        const now = new Date();
        const limitDate = new Date(oldestOpenTransaction.createdAt);
        limitDate.setHours(limitDate.getHours() + limitHours);

        const diffMs = limitDate.getTime() - now.getTime();
        const hoursRemaining = diffMs / (1000 * 60 * 60);

        return {
            status: hoursRemaining < 0 ? 'EXPIRED' : (hoursRemaining < 2 ? 'EXPIRING' : 'OK'),
            hoursRemaining,
            isExpired: hoursRemaining < 0,
            oldestOpenTransactionDate: oldestOpenTransaction.createdAt,
            limitHours
        };
    }

    async getDashboardMetrics(companyId: string) {
        const startOfDay = getBrazilStartOfDay();
        const endOfDay = getBrazilEndOfDay();

        // 1. Caixas Pendentes de Conferência (Total a receber que já foi fechado mas não conferido)
        const pendingAccountabilityAgg = await this.prisma.dailyClose.aggregate({
            where: { companyId, status: 'PENDING' },
            _sum: { finalBalance: true },
            _count: { id: true }
        });

        // 2. Prêmios Pagos Hoje (Pela categoria nova)
        const prizesTodayAgg = await this.prisma.transaction.aggregate({
            where: {
                companyId,
                category: 'PRIZE_PAYOUT',
                createdAt: { gte: startOfDay, lte: endOfDay }
            },
            _sum: { amount: true }
        });

        // 3. Vendas Hoje
        const salesTodayAgg = await this.prisma.ticket.aggregate({
            where: {
                companyId,
                status: { not: 'CANCELLED' },
                createdAt: { gte: startOfDay, lte: endOfDay }
            },
            _sum: { amount: true },
            _count: { id: true }
        });

        // 4. Dinheiro na Rua (Estimativa simplificada: Vendas Totais - Prêmios Totais - Caixas Fechados)
        // Uma forma mais precisa seria iterar por usuário, mas para um dashboard executivo global de hoje:
        const totalSalesField = Number(salesTodayAgg._sum?.amount || 0);
        const totalPrizesField = Number(prizesTodayAgg._sum?.amount || 0);

        return {
            pendingAccountability: Number(pendingAccountabilityAgg._sum?.finalBalance || 0),
            pendingCount: pendingAccountabilityAgg._count.id,
            totalPrizesPaidToday: Number(prizesTodayAgg._sum?.amount || 0),
            totalSalesToday: totalSalesField,
            ticketsCountToday: salesTodayAgg._count.id,
            netBalanceToday: totalSalesField - totalPrizesField
        };
    }

    async findAllTransactions(companyId: string, filters: {
        userId?: string;
        category?: string;
        startDate?: string;
        endDate?: string;
        type?: TransactionType;
    }) {
        const where: any = { companyId };

        if (filters.userId && filters.userId !== 'all') where.userId = filters.userId;
        if (filters.category && filters.category !== 'all') where.category = filters.category;
        if (filters.type) where.type = filters.type;

        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
            if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
        }

        return this.prisma.transaction.findMany({
            where,
            include: {
                user: {
                    select: {
                        name: true,
                        username: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 200
        });
    }
}
