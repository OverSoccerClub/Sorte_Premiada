import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class FinancialReportsService {
    private readonly logger = new Logger(FinancialReportsService.name);

    constructor(private prisma: PrismaService) { }

    async getDashboardMetrics() {
        // Fixed: Use local timezone (Brazil) instead of setDate which can cause timezone issues
        // This prevents the bug where 21:08 BRT (Jan 31) becomes Feb 1
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

        const [
            totalRevenue,
            monthlyRevenue,
            pendingAmount,
            overdueAmount,
            totalOverdueCount
        ] = await Promise.all([
            // Total Revenue (All time)
            this.prisma.payment.aggregate({
                where: { status: PaymentStatus.PAID },
                _sum: { amount: true }
            }),
            // Monthly Revenue
            this.prisma.payment.aggregate({
                where: {
                    status: PaymentStatus.PAID,
                    paidAt: { gte: startOfMonth }
                },
                _sum: { amount: true }
            }),
            // Pending Amount (Future revenue)
            this.prisma.payment.aggregate({
                where: { status: PaymentStatus.PENDING },
                _sum: { amount: true }
            }),
            // Overdue Amount (Lost/Delayed revenue)
            this.prisma.payment.aggregate({
                where: { status: PaymentStatus.OVERDUE },
                _sum: { amount: true }
            }),
            // Count of overdue payments
            this.prisma.payment.count({
                where: { status: PaymentStatus.OVERDUE }
            })
        ]);

        return {
            totalRevenue: totalRevenue._sum.amount || 0,
            monthlyRevenue: monthlyRevenue._sum.amount || 0,
            pendingAmount: pendingAmount._sum.amount || 0,
            overdueAmount: overdueAmount._sum.amount || 0,
            overdueCount: totalOverdueCount
        };
    }

    async getMonthlyRevenueChart(year: number) {
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59);

        const payments = await this.prisma.payment.findMany({
            where: {
                status: PaymentStatus.PAID,
                paidAt: {
                    gte: startOfYear,
                    lte: endOfYear
                }
            },
            select: {
                amount: true,
                paidAt: true
            }
        });

        // Group by month
        const monthlyData = new Array(12).fill(0);
        payments.forEach(p => {
            if (p.paidAt) {
                const month = p.paidAt.getMonth();
                monthlyData[month] += Number(p.amount);
            }
        });

        return monthlyData.map((amount, index) => ({
            name: new Date(year, index).toLocaleString('pt-BR', { month: 'short' }),
            total: amount
        }));
    }

    async getInadimplenciaReport() {
        return this.prisma.payment.findMany({
            where: {
                status: PaymentStatus.OVERDUE
            },
            include: {
                company: {
                    select: {
                        id: true,
                        companyName: true,
                        phone: true,
                        email: true
                    }
                }
            },
            orderBy: {
                dueDate: 'asc' // Mais antigos primeiro
            }
        });
    }
}
