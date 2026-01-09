import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BillingService } from './billing.service';
import { LicenseStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Cron Job para gerar cobranças mensais
 * Roda no dia 1 de cada mês às 00:00 AM
 * Gera cobranças para todas as empresas ativas
 */
@Injectable()
export class GenerateMonthlyBillingJob {
    private readonly logger = new Logger(GenerateMonthlyBillingJob.name);

    constructor(
        private billingService: BillingService,
        private prisma: PrismaService,
    ) { }

    /**
     * Gerar cobranças mensais
     * Roda no dia 1 de cada mês às 00:00 AM
     */
    @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
    async generateMonthlyBilling() {
        this.logger.log('Iniciando geração de cobranças mensais...');

        try {
            const now = new Date();
            const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            // Buscar empresas ativas que não estão em trial
            const companies = await this.prisma.company.findMany({
                where: {
                    isActive: true,
                    licenseStatus: {
                        in: [LicenseStatus.ACTIVE],
                    },
                },
            });

            this.logger.log(`Encontradas ${companies.length} empresas para gerar cobranças`);

            let generated = 0;
            let skipped = 0;
            let errors = 0;

            for (const company of companies) {
                try {
                    // Gerar cobrança para o mês atual
                    const payment = await this.billingService.generateMonthlyBilling(
                        company.id,
                        currentMonth,
                    );

                    if (payment) {
                        generated++;
                        this.logger.log(
                            `Cobrança gerada: ${company.companyName} - R$ ${payment.amount} - Venc: ${payment.dueDate.toLocaleDateString()}`,
                        );
                    } else {
                        skipped++;
                        this.logger.log(`Cobrança pulada: ${company.companyName} (trial ou já existe)`);
                    }
                } catch (error) {
                    errors++;
                    this.logger.error(
                        `Erro ao gerar cobrança para ${company.companyName}: ${error.message}`,
                    );
                }
            }

            this.logger.log(
                `Geração concluída: ${generated} geradas, ${skipped} puladas, ${errors} erros`,
            );

            return {
                total: companies.length,
                generated,
                skipped,
                errors,
                timestamp: new Date(),
            };
        } catch (error) {
            this.logger.error(`Erro na geração de cobranças mensais: ${error.message}`);
            throw error;
        }
    }

    /**
     * Atualizar estatísticas mensais de todas as empresas
     * Roda diariamente às 23:00, mas executa lógica apenas no último dia do mês
     */
    @Cron('0 23 * * *')
    async updateMonthlyStats() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Se amanhã não for dia 1, então hoje não é o último dia do mês
        if (tomorrow.getDate() !== 1) {
            return;
        }

        this.logger.log('Iniciando atualização de estatísticas mensais (Último dia do mês)...');

        try {
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

            let updated = 0;
            let errors = 0;

            for (const company of companies) {
                try {
                    // Registrar uso do mês
                    const now = new Date();
                    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

                    // Contar usuários ativos
                    const totalUsers = await this.prisma.user.count({
                        where: {
                            companyId: company.id,
                            isActive: true,
                        },
                    });

                    // Contar bilhetes do mês
                    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
                    const totalTickets = await this.prisma.ticket.count({
                        where: {
                            companyId: company.id,
                            createdAt: {
                                gte: monthStart,
                                lte: monthEnd,
                            },
                        },
                    });

                    // Contar jogos ativos
                    const totalGames = await this.prisma.game.count({
                        where: {
                            companyId: company.id,
                            isActive: true,
                        },
                    });

                    // Calcular receita do mês
                    const ticketsRevenue = await this.prisma.ticket.aggregate({
                        where: {
                            companyId: company.id,
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

                    // Criar ou atualizar estatísticas
                    await this.prisma.usageStats.upsert({
                        where: {
                            companyId_month: {
                                companyId: company.id,
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
                            companyId: company.id,
                            month: monthStart,
                            totalUsers,
                            totalTickets,
                            totalGames,
                            totalRevenue,
                        },
                    });

                    updated++;
                    this.logger.log(
                        `Stats atualizadas: ${company.companyName} - ${totalUsers} users, ${totalTickets} tickets`,
                    );
                } catch (error) {
                    errors++;
                    this.logger.error(
                        `Erro ao atualizar stats de ${company.companyName}: ${error.message}`,
                    );
                }
            }

            this.logger.log(
                `Atualização concluída: ${updated}/${companies.length} empresas atualizadas, ${errors} erros`,
            );

            return {
                total: companies.length,
                updated,
                errors,
                timestamp: new Date(),
            };
        } catch (error) {
            this.logger.error(`Erro na atualização de estatísticas: ${error.message}`);
            throw error;
        }
    }
}
