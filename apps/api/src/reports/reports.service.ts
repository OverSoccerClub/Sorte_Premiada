import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '@prisma/client';
import { objectsToCsv } from './csv.util';

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) { }

    private async getAreaFilter(requestingUserId?: string) {
        if (!requestingUserId) return {};
        const user = await this.prisma.user.findUnique({ where: { id: requestingUserId } });
        if (user && user.role === 'COBRADOR' && user.areaId) {
            return { areaId: user.areaId };
        }
        return {};
    }

    async getFinanceSummary(userId: string, date: Date, requestingUserId?: string) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // 1. Get Tickets Sales (Exclude Cancelled)
        const tickets = await this.prisma.ticket.findMany({
            where: {
                userId,
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

        // Tickets Sales count as Credits
        const totalCredits = manualCredits + totalSales;

        const finalBalance = totalCredits - totalDebits;

        // Combine Transactions and Tickets
        const ticketTransactions = tickets.map(t => ({
            id: t.id,
            description: `Venda ${t.gameType} - ${t.numbers.join(', ')}`,
            amount: t.amount,
            type: TransactionType.CREDIT,
            createdAt: t.createdAt,
            userId: t.userId,
            isTicket: true,
        }));

        const allTransactions = [...transactions.map(t => ({ ...t, isTicket: false })), ...ticketTransactions].sort((a, b) =>
            b.createdAt.getTime() - a.createdAt.getTime()
        );

        // Get DailyClose status
        const dailyClose = await this.prisma.dailyClose.findFirst({
            where: {
                closedByUserId: userId,
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
        });

        return {
            date,
            totalSales,
            totalCredits,
            totalDebits,
            finalBalance,
            transactions: allTransactions,
            status: dailyClose ? dailyClose.status : 'OPEN',
            dailyCloseId: dailyClose?.id,
        };
    }

    async getSalesByCambista(requestingUserId?: string) {
        const areaFilter = await this.getAreaFilter(requestingUserId);
        const where: any = {
            status: {
                not: 'CANCELLED'
            }
        };

        if (areaFilter.areaId) {
            where.user = { areaId: areaFilter.areaId };
        }

        const sales = await this.prisma.ticket.groupBy({
            by: ['userId'],
            where,
            _sum: {
                amount: true,
            },
            _count: {
                id: true,
            },
        });

        // Enrich with user details
        const enrichedSales = await Promise.all(
            sales.map(async (sale) => {
                const user = await this.prisma.user.findUnique({
                    where: {
                        id: sale.userId
                    },
                    select: {
                        username: true,
                        name: true,
                        role: true
                    }
                });
                return {
                    ...sale,
                    username: user?.username,
                    name: user?.name,
                    role: user?.role
                };
            })
        );

        return enrichedSales;
    }

    async getSalesByDate(
        startDate: Date,
        endDate: Date,
        cambistaId?: string,
        gameId?: string,
        page: number = 1,
        limit: number = 20,
        requestingUserId?: string
    ) {
        const areaFilter = await this.getAreaFilter(requestingUserId);
        const where: any = {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
            status: {
                not: 'CANCELLED'
            }
        };

        if (areaFilter.areaId) {
            where.user = { areaId: areaFilter.areaId };
        }

        if (cambistaId && cambistaId !== 'all') {
            where.userId = cambistaId;
        }

        if (gameId && gameId !== 'all') {
            where.gameId = gameId;
        }

        const skip = (page - 1) * limit;

        const [tickets, total, rawSummary, cambistasForStatus, dailyCloses] = await Promise.all([
            this.prisma.ticket.findMany({
                where,
                include: {
                    user: { select: { id: true, username: true, name: true } },
                    game: { select: { name: true } },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),
            this.prisma.ticket.count({ where }),
            this.prisma.ticket.groupBy({
                by: ['gameId', 'gameType'],
                where,
                _sum: { amount: true },
                _count: { id: true },
            }),
            // Fetch users in this report to check isActive
            this.prisma.user.findMany({
                where: {
                    ...(cambistaId && cambistaId !== 'all' ? { id: cambistaId } : { role: 'CAMBISTA' }),
                    ...(areaFilter.areaId ? { areaId: areaFilter.areaId } : {})
                },
                select: { id: true, name: true, username: true, isActive: true }
            }),
            // Fetch daily closes in this period
            this.prisma.dailyClose.findMany({
                where: {
                    createdAt: { gte: startDate, lte: endDate },
                    ...(cambistaId && cambistaId !== 'all' ? { closedByUserId: cambistaId } : {})
                }
            })
        ]);

        // Map summary to be more friendly
        const summary = rawSummary.map(s => ({
            gameId: s.gameId,
            gameName: s.gameType, // fallback to gameType
            count: s._count.id,
            totalAmount: Number(s._sum.amount || 0)
        }));

        // Granular Summary: Group by Date (Day), User, Game
        // We'll perform this in-memory for better flexibility with Cashier Status
        const ticketsForGranular = await this.prisma.ticket.findMany({
            where,
            include: {
                user: { select: { id: true, username: true, name: true, isActive: true } },
                game: { select: { id: true, name: true } }
            }
        });

        const granularMap = new Map<string, any>();
        ticketsForGranular.forEach(t => {
            const dateStr = t.createdAt.toISOString().split('T')[0];
            const userId = t.userId;
            const gameId = t.gameId || 'manual';
            const key = `${dateStr}_${userId}_${gameId}`;

            if (!granularMap.has(key)) {
                // Find DailyClose for this user and date
                const close = dailyCloses.find(c =>
                    c.closedByUserId === userId &&
                    c.createdAt.toISOString().split('T')[0] === dateStr
                );

                let status = 'ABERTO';
                if (!t.user?.isActive) status = 'BLOQUEADO';
                else if (close) {
                    status = close.status === 'VERIFIED' ? 'CONFERIDO' : 'FECHADO';
                }

                granularMap.set(key, {
                    date: dateStr,
                    userId,
                    user: t.user,
                    gameId,
                    gameName: t.game?.name || t.gameType,
                    amount: 0,
                    count: 0,
                    status
                });
            }

            const item = granularMap.get(key);
            item.amount += Number(t.amount);
            item.count += 1;
        });

        const granularSummary = Array.from(granularMap.values()).sort((a, b) => b.date.localeCompare(a.date));

        return {
            tickets,
            total,
            summary,
            granularSummary,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async getDashboardStats(requestingUserId?: string, companyId?: string) {
        const areaFilter = await this.getAreaFilter(requestingUserId);
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0));
        startOfMonth.setHours(0, 0, 0, 0); // Extra precaution for local queries if needed

        // Filtro de empresa para MASTER users
        const companyFilter = companyId ? { companyId } : {};

        // Total Sales (All time)
        const totalSalesAggregate = await this.prisma.ticket.aggregate({
            _sum: { amount: true },
            _count: { id: true },
            where: {
                status: { not: 'CANCELLED' },
                ...(areaFilter.areaId ? { user: { areaId: areaFilter.areaId } } : {}),
                ...companyFilter
            }
        });

        // Active Cambistas (Sold a ticket in the last 30 minutes)
        const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);

        const activeCambistasCount = await this.prisma.ticket.groupBy({
            by: ['userId'],
            where: {
                createdAt: { gte: thirtyMinsAgo },
                status: { not: 'CANCELLED' },
                ...(areaFilter.areaId ? { user: { areaId: areaFilter.areaId } } : {}),
                ...companyFilter
            }
        });


        // Chart Data (Last 7 days)
        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const nextDate = new Date(date);
            nextDate.setDate(date.getDate() + 1);

            const dailySales = await this.prisma.ticket.aggregate({
                _sum: { amount: true },
                where: {
                    createdAt: {
                        gte: date,
                        lt: nextDate
                    },
                    status: { not: 'CANCELLED' },
                    ...(areaFilter.areaId ? { user: { areaId: areaFilter.areaId } } : {}),
                    ...companyFilter
                }
            });

            chartData.push({
                date: date.toISOString(),
                amount: Number(dailySales._sum.amount || 0)
            });
        }

        // --- NEW METRICS ---

        // 1. Status Breakdown (This Month)
        const statusGroups = await this.prisma.ticket.groupBy({
            by: ['status'],
            where: {
                createdAt: { gte: startOfMonth },
                status: { not: 'CANCELLED' },
                ...(areaFilter.areaId ? { user: { areaId: areaFilter.areaId } } : {}),
                ...companyFilter
            },
            _count: { id: true }
        });

        const statusBreakdown = statusGroups.map(sg => ({
            status: sg.status,
            count: sg._count.id
        }));

        // 2. Revenue By Game (This Month)
        const revenueByGameRaw = await this.prisma.ticket.groupBy({
            by: ['gameType'],
            where: {
                createdAt: { gte: startOfMonth },
                status: { not: 'CANCELLED' },
                ...(areaFilter.areaId ? { user: { areaId: areaFilter.areaId } } : {}),
                ...companyFilter
            },
            _sum: { amount: true }
        });

        const revenueByGame = revenueByGameRaw.map(rg => ({
            game: rg.gameType,
            amount: Number(rg._sum.amount || 0)
        })).sort((a, b) => b.amount - a.amount);

        // 3. Hourly Sales (Today)
        const todaysTickets = await this.prisma.ticket.findMany({
            where: {
                createdAt: { gte: startOfDay },
                status: { not: 'CANCELLED' },
                ...(areaFilter.areaId ? { user: { areaId: areaFilter.areaId } } : {}),
                ...companyFilter
            },
            select: { createdAt: true, amount: true }
        });

        const hourlyMap = new Map<number, number>();
        for (let i = 0; i < 24; i++) hourlyMap.set(i, 0);

        todaysTickets.forEach(t => {
            const hour = new Date(t.createdAt).getHours();
            hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + Number(t.amount));
        });

        const hourlySales = Array.from(hourlyMap.entries()).map(([hour, amount]) => ({
            hour: `${hour.toString().padStart(2, '0')}:00`,
            amount
        }));

        // 4. Profit Metrics (This Month)
        const monthlySalesAgg = await this.prisma.ticket.aggregate({
            where: {
                createdAt: { gte: startOfMonth },
                status: { not: 'CANCELLED' },
                ...(areaFilter.areaId ? { user: { areaId: areaFilter.areaId } } : {}),
                ...companyFilter
            },
            _sum: { amount: true }
        });

        const monthlyDebitsAgg = await this.prisma.transaction.aggregate({
            where: {
                createdAt: { gte: startOfMonth },
                type: 'DEBIT',
                ...(areaFilter.areaId ? { user: { areaId: areaFilter.areaId } } : {}),
                ...companyFilter
            },
            _sum: { amount: true }
        });

        const monthlyRevenue = Number(monthlySalesAgg._sum.amount || 0);
        const monthlyPayout = Number(monthlyDebitsAgg._sum.amount || 0);
        const netProfit = monthlyRevenue - monthlyPayout;

        // --- END NEW METRICS ---

        // Monthly Ranking (Top Cambistas This Month)
        // Aggregating and then sorting in memory to be safer across different DB/Prisma versions
        const monthRankingRaw = await this.prisma.ticket.groupBy({
            by: ['userId'],
            where: {
                createdAt: { gte: startOfMonth },
                status: { not: 'CANCELLED' },
                ...(areaFilter.areaId ? { user: { areaId: areaFilter.areaId } } : {}),
                ...companyFilter
            },
            _sum: { amount: true },
            _count: { id: true }
        });

        // Filter out groups with zero amount and sort in memory
        const sortedRanking = monthRankingRaw
            .map(r => ({
                userId: r.userId,
                amount: Number(r._sum.amount || 0),
                count: r._count.id
            }))
            .filter(r => r.amount > 0)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 10);

        const rankingEntries = await Promise.all(
            sortedRanking.map(async (entry) => {
                const user = await this.prisma.user.findUnique({
                    where: { id: entry.userId },
                    select: { name: true, username: true }
                });
                return {
                    userId: entry.userId,
                    name: user?.name || user?.username || "Usuário desconhecido",
                    amount: entry.amount,
                    count: entry.count
                };
            })
        );

        // Recent Sales Enriched (Today's Sales)
        const recentSalesRaw = await this.prisma.ticket.findMany({
            take: 500, // Today's limit
            orderBy: { createdAt: 'desc' },
            where: {
                status: { not: 'CANCELLED' },
                createdAt: { gte: startOfDay },
                ...(areaFilter.areaId ? { user: { areaId: areaFilter.areaId } } : {}),
                ...companyFilter
            },
            include: {
                user: { select: { id: true, username: true, name: true, email: true } },
                game: { select: { name: true } }
            }
        });

        // For each recent sale, get the daily total of that cambista
        const recentSales = await Promise.all(
            recentSalesRaw.map(async (sale) => {
                const cambistaDailyTotal = await this.prisma.ticket.aggregate({
                    where: {
                        userId: sale.userId,
                        createdAt: { gte: startOfDay },
                        status: { not: 'CANCELLED' }
                    },
                    _sum: { amount: true }
                });

                return {
                    ...sale,
                    gameName: sale.game?.name || sale.gameType,
                    cambistaDailyTotal: Number(cambistaDailyTotal._sum.amount || 0)
                };
            })
        );

        return {
            totalSales: Number(totalSalesAggregate._sum.amount || 0),
            ticketsSold: totalSalesAggregate._count.id,
            averageTicket: totalSalesAggregate._count.id > 0
                ? Number(totalSalesAggregate._sum.amount) / totalSalesAggregate._count.id
                : 0,
            activeCambistas: activeCambistasCount.length,
            recentSales,
            chartData,
            ranking: rankingEntries,
            // New fields
            statusBreakdown,
            revenueByGame,
            hourlySales,
            profitMetrics: {
                monthlyRevenue,
                monthlyPayout,
                netProfit
            }
        };
    }
    async getSalesByArea(startDate: Date, endDate: Date, requestingUserId?: string) {
        const areaFilter = await this.getAreaFilter(requestingUserId);
        // Fetch tickets with user and area relations
        const tickets = await this.prisma.ticket.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
                status: {
                    not: 'CANCELLED'
                },
                ...(areaFilter.areaId ? { user: { areaId: areaFilter.areaId } } : {})
            },
            include: {
                user: {
                    include: { area: true }
                }
            }
        });

        // Group by Area
        const areaMap = new Map<string, any>();

        for (const ticket of tickets) {
            const area = ticket.user?.area;
            const areaId = area?.id || 'sem-area';
            const areaName = area?.name || 'Sem Área';
            const city = area?.city || '-';
            const state = area?.state || '-';

            if (!areaMap.has(areaId)) {
                areaMap.set(areaId, {
                    areaId,
                    areaName,
                    city,
                    state,
                    totalSales: 0,
                    ticketsCount: 0,
                    cambistasMap: new Map<string, any>()
                });
            }

            const areaEntry = areaMap.get(areaId);
            areaEntry.totalSales += Number(ticket.amount);
            areaEntry.ticketsCount += 1;

            const userId = ticket.userId;
            if (!areaEntry.cambistasMap.has(userId)) {
                areaEntry.cambistasMap.set(userId, {
                    id: userId,
                    name: ticket.user?.name || ticket.user?.username,
                    sales: 0,
                    tickets: 0
                });
            }

            const cambistaEntry = areaEntry.cambistasMap.get(userId);
            cambistaEntry.sales += Number(ticket.amount);
            cambistaEntry.tickets += 1;
        }

        // Format output
        return Array.from(areaMap.values()).map(area => ({
            areaId: area.areaId,
            areaName: area.areaName,
            city: area.city,
            state: area.state,
            totalSales: area.totalSales,
            ticketsCount: area.ticketsCount,
            cambistasCount: area.cambistasMap.size,
            cambistas: Array.from(area.cambistasMap.values()).sort((a: any, b: any) => b.sales - a.sales)
        })).sort((a, b) => b.totalSales - a.totalSales);
    }

    // New report methods
    async getDailyCloses(startDate?: Date, endDate?: Date, userId?: string, status?: string, requestingUserId?: string) {
        const areaFilter = await this.getAreaFilter(requestingUserId);
        const where: any = {};
        if (startDate || endDate) {
            const start = startDate ? new Date(startDate) : new Date(0);
            start.setHours(0, 0, 0, 0);

            const end = endDate ? new Date(endDate) : new Date();
            end.setHours(23, 59, 59, 999);

            where.createdAt = { gte: start, lte: end };
        }
        if (userId) where.closedByUserId = userId;
        if (status) where.status = status;

        if (areaFilter.areaId) {
            where.closedByUser = { areaId: areaFilter.areaId };
        }

        const results = await this.prisma.dailyClose.findMany({
            where,
            include: {
                closedByUser: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Resolve verifiedByUser details and return full model
        return Promise.all(results.map(async r => {
            const verifiedBy = r.verifiedByUserId ? await this.prisma.user.findUnique({ where: { id: r.verifiedByUserId }, select: { id: true, username: true, name: true } }) : null;
            return {
                ...r,
                totalSales: Number(r.totalSales),
                totalCredits: Number(r.totalCredits),
                totalDebits: Number(r.totalDebits),
                finalBalance: Number(r.finalBalance),
                netBalance: Number(r.netBalance),
                totalCommission: Number(r.totalCommission),
                verifiedBy
            };
        }));
    }

    async getPendingCloses(requestingUserId?: string) {
        const areaFilter = await this.getAreaFilter(requestingUserId);
        const where: any = { status: 'PENDING' };
        if (areaFilter.areaId) {
            where.closedByUser = { areaId: areaFilter.areaId };
        }
        return this.prisma.dailyClose.findMany({ where, include: { closedByUser: true }, orderBy: { createdAt: 'desc' } });
    }

    async exportTransactionsCsv(startDate?: Date, endDate?: Date, userId?: string, requestingUserId?: string) {
        const where: any = {};
        if (startDate || endDate) {
            const gte = startDate ? startDate : new Date(0);
            const lte = endDate ? endDate : new Date();
            where.createdAt = { gte, lte };
        }
        if (userId) where.userId = userId;

        const transactions = await this.prisma.transaction.findMany({ where, orderBy: { createdAt: 'desc' }, include: { user: { select: { username: true, name: true } } } });

        const rows = transactions.map(t => ({
            id: t.id,
            createdAt: t.createdAt?.toISOString(),
            userId: t.userId,
            username: t.user?.username || '',
            description: t.description || '',
            amount: t.amount,
            type: t.type
        }));

        return objectsToCsv(rows);
    }

    async getTicketsByDraw(drawId?: string, startDate?: Date, endDate?: Date) {
        const where: any = {};
        if (drawId) where.drawId = drawId;
        if (startDate || endDate) {
            const gte = startDate ? startDate : new Date(0);
            const lte = endDate ? endDate : new Date();
            where.createdAt = { gte, lte };
        }

        return this.prisma.ticket.findMany({ where, include: { user: { select: { username: true, name: true } }, game: true }, orderBy: { createdAt: 'desc' } });
    }

    async getTopSellers(limit: number = 10, startDate?: Date, endDate?: Date, requestingUserId?: string) {
        const areaFilter = await this.getAreaFilter(requestingUserId);
        const where: any = {
            status: { not: 'CANCELLED' },
            ...(areaFilter.areaId ? { user: { areaId: areaFilter.areaId } } : {})
        };
        if (startDate || endDate) {
            const gte = startDate ? startDate : new Date(0);
            const lte = endDate ? endDate : new Date();
            where.createdAt = { gte, lte };
        }

        const sellers = await this.prisma.ticket.groupBy({
            by: ['userId'],
            where,
            _sum: { amount: true },
            _count: { id: true },
            orderBy: { _sum: { amount: 'desc' } },
            take: limit
        });

        return Promise.all(sellers.map(async s => {
            const user = await this.prisma.user.findUnique({ where: { id: s.userId }, select: { username: true, name: true } });
            return { ...s, username: user?.username, name: user?.name };
        }));
    }

    async getActiveUsers(days: number = 30) {
        const since = new Date();
        since.setDate(since.getDate() - days);

        const groups = await this.prisma.ticket.groupBy({ by: ['userId'], where: { createdAt: { gte: since }, status: { not: 'CANCELLED' } } });
        const userIds = groups.map(g => g.userId);

        return this.prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, username: true, name: true, email: true } });
    }

    async getNotificationLogs(startDate?: Date, endDate?: Date, status?: string, userId?: string) {
        const where: any = {};
        if (startDate || endDate) {
            const gte = startDate ? startDate : new Date(0);
            const lte = endDate ? endDate : new Date();
            where.createdAt = { gte, lte };
        }
        if (status) where.status = status;
        if (userId) where.userId = userId;

        return this.prisma.notificationLog.findMany({ where, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, username: true, name: true } } } });
    }

    async exportNotificationLogsCsv(startDate?: Date, endDate?: Date, status?: string, userId?: string) {
        const logs = await this.getNotificationLogs(startDate, endDate, status, userId);
        const rows = logs.map(l => ({
            id: l.id,
            createdAt: l.createdAt?.toISOString(),
            pushToken: l.pushToken,
            title: l.title,
            body: l.body,
            status: l.status,
            userId: l.userId || '',
            username: l.user?.username || '',
            response: JSON.stringify(l.response || {}),
        }));

        return objectsToCsv(rows);
    }
}
