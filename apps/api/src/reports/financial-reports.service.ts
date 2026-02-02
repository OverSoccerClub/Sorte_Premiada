import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';
import { getBrazilTime, dayjs, toBrazilTime } from '../utils/date.util';
import 'dayjs/locale/pt-br'; // Import locale if needed, though formatting might handled differently

@Injectable()
export class FinancialReportsService {
    private readonly logger = new Logger(FinancialReportsService.name);

    constructor(private prisma: PrismaService) { }

    async getDashboardMetrics() {
        // Fixed: Use strict Brazil Time
        const now = getBrazilTime();
        // Start of month in Brazil Time converted to UTC Date for Prisma
        const startOfMonth = now.startOf('month').toDate();

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
        // Construct start and end of year in Brazil Time
        // stored as UTC in DB, but we want the range that represents that year in Brazil
        const startOfYear = dayjs.tz(`${year}-01-01`, 'America/Sao_Paulo').startOf('year').toDate();
        const endOfYear = dayjs.tz(`${year}-12-31`, 'America/Sao_Paulo').endOf('year').toDate();

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
                // Convert back to Brazil time to extract the correct month
                // otherwise 21:00 on Jan 31st might count as February in UTC
                const month = toBrazilTime(p.paidAt).month();
                monthlyData[month] += Number(p.amount);
            }
        });

        // Use dayjs to generate month names in PT-BR
        return monthlyData.map((amount, index) => ({
            name: dayjs().month(index).locale('pt-br').format('MMM'), // Requires locale setup or simple array
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
