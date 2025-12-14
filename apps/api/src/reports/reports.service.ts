import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '@prisma/client';

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) { }

    async getFinanceSummary(userId: string, date: Date) {
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

        return {
            date,
            totalSales,
            totalCredits,
            totalDebits,
            finalBalance,
            transactions: allTransactions,
        };
    }

    async getSalesByCambista() {
        const sales = await this.prisma.ticket.groupBy({
            by: ['userId'],
            where: {
                status: {
                    not: 'CANCELLED'
                }
            },
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

    async getSalesByDate(startDate: Date, endDate: Date, cambistaId?: string) {
        const where: any = {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
            status: {
                not: 'CANCELLED'
            }
        };

        if (cambistaId) {
            where.userId = cambistaId;
        }

        return this.prisma.ticket.findMany({
            where,
            include: {
                user: { select: { username: true, name: true } },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async getDashboardStats() {
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        // Total Sales (All time)
        const totalSalesAggregate = await this.prisma.ticket.aggregate({
            _sum: { amount: true },
            _count: { id: true },
            where: { status: { not: 'CANCELLED' } }
        });

        // Active Cambistas (Sold a ticket in the last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const activeCambistasCount = await this.prisma.ticket.groupBy({
            by: ['userId'],
            where: {
                createdAt: { gte: thirtyDaysAgo },
                status: { not: 'CANCELLED' }
            }
        });

        // Recent Sales
        const recentSales = await this.prisma.ticket.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            where: { status: { not: 'CANCELLED' } },
            include: { user: { select: { username: true, name: true, email: true } } }
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
                    status: { not: 'CANCELLED' }
                }
            });

            chartData.push({
                date: date.toISOString(),
                amount: Number(dailySales._sum.amount || 0)
            });
        }

        return {
            totalSales: Number(totalSalesAggregate._sum.amount || 0),
            ticketsSold: totalSalesAggregate._count.id,
            averageTicket: totalSalesAggregate._count.id > 0
                ? Number(totalSalesAggregate._sum.amount) / totalSalesAggregate._count.id
                : 0,
            activeCambistas: activeCambistasCount.length,
            recentSales,
            chartData
        };
    }
    async getSalesByArea(startDate: Date, endDate: Date) {
        // Fetch tickets with user and area relations
        const tickets = await this.prisma.ticket.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
                status: {
                    not: 'CANCELLED'
                }
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
}
