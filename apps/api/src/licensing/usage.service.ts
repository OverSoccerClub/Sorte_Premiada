import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Service responsável por controlar e registrar o uso do sistema
 * Monitora usuários, bilhetes, jogos e gera estatísticas mensais
 */
@Injectable()
export class UsageService {
    private readonly logger = new Logger(UsageService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Registra o uso mensal de uma empresa
     * Atualiza ou cria estatísticas do mês atual
     * @param companyId ID da empresa
     */
    async recordMonthlyUsage(companyId: string) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Contar usuários ativos
        const totalUsers = await this.prisma.user.count({
            where: {
                companyId,
                isActive: true,
            },
        });

        // Contar bilhetes do mês
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const totalTickets = await this.prisma.ticket.count({
            where: {
                companyId,
                createdAt: {
                    gte: monthStart,
                    lte: monthEnd,
                },
            },
        });

        // Contar jogos ativos
        const totalGames = await this.prisma.game.count({
            where: {
                companyId,
                isActive: true,
            },
        });

        // Calcular receita do mês (soma de bilhetes pagos)
        const ticketsRevenue = await this.prisma.ticket.aggregate({
            where: {
                companyId,
                status: 'PAID',
                createdAt: {
                    gte: monthStart,
                    lte: monthEnd,
                },
            },
            _sum: {
                amount: true,
            },
        });

        const totalRevenue = ticketsRevenue._sum.amount || 0;

        // Atualizar ou criar estatísticas
        const stats = await this.prisma.usageStats.upsert({
            where: {
                companyId_month: {
                    companyId,
                    month: monthStart,
                },
            },
            update: {
                totalUsers,
                totalTickets,
                totalGames,
                totalRevenue,
            },
            create: {
                companyId,
                month: monthStart,
                totalUsers,
                totalTickets,
                totalGames,
                totalRevenue,
            },
        });

        this.logger.log(`Uso registrado para ${companyId}: ${totalUsers} users, ${totalTickets} tickets, ${totalGames} games`);

        return stats;
    }

    /**
     * Busca estatísticas mensais de uma empresa
     * @param companyId ID da empresa
     * @param months Número de meses para buscar
     * @returns Estatísticas dos últimos N meses
     */
    async getMonthlyStats(companyId: string, months: number = 12) {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);

        return this.prisma.usageStats.findMany({
            where: {
                companyId,
                month: {
                    gte: startDate,
                },
            },
            orderBy: {
                month: 'desc',
            },
        });
    }

    /**
     * Busca estatísticas do mês atual
     * @param companyId ID da empresa
     * @returns Estatísticas do mês atual
     */
    async getCurrentMonthStats(companyId: string) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const stats = await this.prisma.usageStats.findUnique({
            where: {
                companyId_month: {
                    companyId,
                    month: monthStart,
                },
            },
        });

        // Se não existe, criar registrando o uso atual
        if (!stats) {
            return this.recordMonthlyUsage(companyId);
        }

        return stats;
    }

    /**
     * Verifica se a empresa excedeu algum limite
     * @param companyId ID da empresa
     * @returns Informações sobre limites excedidos
     */
    async checkLimitsExceeded(companyId: string) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
            select: {
                maxUsers: true,
                maxTicketsPerMonth: true,
                maxGames: true,
                maxActiveDevices: true,
                _count: {
                    select: {
                        users: true,
                        games: true,
                    },
                },
            },
        });

        if (!company) {
            throw new Error('Empresa não encontrada');
        }

        // Contar bilhetes do mês atual
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const ticketsThisMonth = await this.prisma.ticket.count({
            where: {
                companyId,
                createdAt: {
                    gte: monthStart,
                    lte: monthEnd,
                },
            },
        });

        // Contar dispositivos ativos
        const activeDevices = await this.prisma.posTerminal.count({
            where: {
                companyId,
                status: 'ONLINE',
            },
        });

        const usersExceeded = company._count.users > company.maxUsers;
        const ticketsExceeded = ticketsThisMonth > company.maxTicketsPerMonth;
        const gamesExceeded = company._count.games > company.maxGames;
        const devicesExceeded = activeDevices > company.maxActiveDevices;

        const anyExceeded = usersExceeded || ticketsExceeded || gamesExceeded || devicesExceeded;

        return {
            exceeded: anyExceeded,
            users: {
                current: company._count.users,
                max: company.maxUsers,
                exceeded: usersExceeded,
            },
            tickets: {
                current: ticketsThisMonth,
                max: company.maxTicketsPerMonth,
                exceeded: ticketsExceeded,
            },
            games: {
                current: company._count.games,
                max: company.maxGames,
                exceeded: gamesExceeded,
            },
            devices: {
                current: activeDevices,
                max: company.maxActiveDevices,
                exceeded: devicesExceeded,
            },
        };
    }

    /**
     * Gera relatório de uso consolidado de todas as empresas
     * @returns Estatísticas globais
     */
    async getGlobalUsageReport() {
        const companies = await this.prisma.company.findMany({
            select: {
                id: true,
                companyName: true,
                subscriptionPlan: true,
                licenseStatus: true,
                _count: {
                    select: {
                        users: true,
                        games: true,
                        tickets: true,
                    },
                },
            },
        });

        const totalCompanies = companies.length;
        const totalUsers = companies.reduce((sum, c) => sum + c._count.users, 0);
        const totalGames = companies.reduce((sum, c) => sum + c._count.games, 0);
        const totalTickets = companies.reduce((sum, c) => sum + c._count.tickets, 0);

        const byPlan = companies.reduce((acc, c) => {
            const plan = c.subscriptionPlan;
            if (!acc[plan]) {
                acc[plan] = 0;
            }
            acc[plan]++;
            return acc;
        }, {} as Record<string, number>);

        const byStatus = companies.reduce((acc, c) => {
            const status = c.licenseStatus;
            if (!acc[status]) {
                acc[status] = 0;
            }
            acc[status]++;
            return acc;
        }, {} as Record<string, number>);

        return {
            summary: {
                totalCompanies,
                totalUsers,
                totalGames,
                totalTickets,
            },
            byPlan,
            byStatus,
            companies: companies.map(c => ({
                id: c.id,
                name: c.companyName,
                plan: c.subscriptionPlan,
                status: c.licenseStatus,
                users: c._count.users,
                games: c._count.games,
                tickets: c._count.tickets,
            })),
        };
    }

    /**
     * Atualiza estatísticas de todas as empresas ativas
     * Usado pelo cron job mensal
     */
    async updateAllCompaniesStats() {
        const companies = await this.prisma.company.findMany({
            where: {
                isActive: true,
            },
            select: {
                id: true,
                companyName: true,
            },
        });

        this.logger.log(`Atualizando estatísticas de ${companies.length} empresas...`);

        const results = [];
        for (const company of companies) {
            try {
                const stats = await this.recordMonthlyUsage(company.id);
                results.push({ companyId: company.id, success: true, stats });
            } catch (error) {
                this.logger.error(`Erro ao atualizar stats de ${company.companyName}: ${error.message}`);
                results.push({ companyId: company.id, success: false, error: error.message });
            }
        }

        this.logger.log(`Estatísticas atualizadas: ${results.filter(r => r.success).length}/${companies.length} sucesso`);

        return results;
    }
}
