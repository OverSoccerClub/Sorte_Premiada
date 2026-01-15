import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getBrazilTime } from '../utils/date.util';

@Injectable()
export class AnalyticsService {
    constructor(private prisma: PrismaService) { }

    async getGlobalOverview(companyId: string) {
        const now = getBrazilTime();
        const startOfMonth = now.startOf('month').toDate();
        const startOfLastMonth = now.subtract(1, 'month').startOf('month').toDate();
        const endOfLastMonth = now.subtract(1, 'month').endOf('month').toDate();

        const [currentMonth, lastMonth] = await Promise.all([
            this.prisma.ticket.aggregate({
                where: {
                    companyId,
                    createdAt: { gte: startOfMonth },
                    status: { not: 'CANCELLED' }
                },
                _sum: { amount: true },
                _count: { id: true }
            }),
            this.prisma.ticket.aggregate({
                where: {
                    companyId,
                    createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
                    status: { not: 'CANCELLED' }
                },
                _sum: { amount: true }
            })
        ]);

        const currentAmt = Number(currentMonth._sum.amount || 0);
        const lastAmt = Number(lastMonth._sum.amount || 0);
        const growth = lastAmt === 0 ? 100 : ((currentAmt - lastAmt) / lastAmt) * 100;

        return {
            monthlyRevenue: currentAmt,
            monthlyTickets: currentMonth._count.id,
            growth: parseFloat(growth.toFixed(2)),
            activeCambistas: await this.prisma.user.count({ where: { companyId, role: 'CAMBISTA', isActive: true } }),
            totalAreas: await this.prisma.area.count({ where: { companyId } })
        };
    }

    async getRegionalHeatmap(companyId: string) {
        const areas = await this.prisma.area.findMany({
            where: { companyId },
            include: {
                users: {
                    select: {
                        tickets: {
                            where: {
                                companyId,
                                status: { not: 'CANCELLED' }
                            },
                            select: { amount: true }
                        }
                    }
                }
            }
        });

        return areas.map(area => {
            const totalSales = area.users.reduce((acc, user) => {
                return acc + user.tickets.reduce((sum, t) => sum + Number(t.amount), 0);
            }, 0);

            return {
                id: area.id,
                name: area.name,
                city: area.city,
                sales: totalSales,
                cambistasCount: area.users.length
            };
        }).sort((a, b) => b.sales - a.sales);
    }

    async getTemporalGrowth(companyId: string) {
        const now = getBrazilTime();
        const days = [];

        for (let i = 29; i >= 0; i--) {
            const date = now.subtract(i, 'day');
            const start = date.startOf('day').toDate();
            const end = date.endOf('day').toDate();

            const sales = await this.prisma.ticket.aggregate({
                where: {
                    companyId,
                    createdAt: { gte: start, lte: end },
                    status: { not: 'CANCELLED' }
                },
                _sum: { amount: true }
            });

            days.push({
                date: date.format('DD/MM'),
                sales: Number(sales._sum.amount || 0)
            });
        }

        return days;
    }

    async getCambistaEfficiency(companyId: string) {
        const cambistas = await this.prisma.user.findMany({
            where: { companyId, role: 'CAMBISTA' },
            select: {
                id: true,
                username: true,
                name: true,
                area: { select: { name: true } },
                tickets: {
                    where: {
                        companyId,
                        status: { not: 'CANCELLED' }
                    },
                    select: { amount: true, createdAt: true }
                }
            }
        });

        return cambistas.map(c => {
            const totalSales = c.tickets.reduce((sum, t) => sum + Number(t.amount), 0);
            const activeDays = new Set(c.tickets.map(t => t.createdAt.toISOString().split('T')[0])).size;

            return {
                id: c.id,
                name: c.name || c.username,
                area: c.area?.name || 'N/A',
                totalSales,
                activeDays,
                dailyAverage: activeDays > 0 ? totalSales / activeDays : 0
            };
        }).sort((a, b) => b.totalSales - a.totalSales).slice(0, 15);
    }
}
