import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LicenseService } from './license.service';
import { LicenseStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Cron Job para verificar licenças expiradas
 * Roda diariamente às 02:00 AM
 * Suspende automaticamente empresas com licenças expiradas
 */
@Injectable()
export class CheckExpiredLicensesJob {
    private readonly logger = new Logger(CheckExpiredLicensesJob.name);

    constructor(
        private licenseService: LicenseService,
        private prisma: PrismaService,
    ) { }

    /**
     * Verificar licenças expiradas diariamente
     * Roda às 02:00 AM todos os dias
     */
    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async checkExpiredLicenses() {
        this.logger.log('Iniciando verificação de licenças expiradas...');

        try {
            const now = new Date();

            // Buscar empresas com licenças que deveriam estar ativas mas estão expiradas
            const expiredCompanies = await this.prisma.company.findMany({
                where: {
                    OR: [
                        // Licenças ACTIVE que expiraram
                        {
                            licenseStatus: LicenseStatus.ACTIVE,
                            licenseExpiresAt: {
                                lt: now,
                            },
                        },
                        // Licenças TRIAL que expiraram
                        {
                            licenseStatus: LicenseStatus.TRIAL,
                            trialEndsAt: {
                                lt: now,
                            },
                        },
                    ],
                },
            });

            this.logger.log(`Encontradas ${expiredCompanies.length} empresas com licenças expiradas`);

            let suspended = 0;
            for (const company of expiredCompanies) {
                try {
                    // Determinar motivo da suspensão
                    const reason =
                        company.licenseStatus === LicenseStatus.TRIAL
                            ? 'Período de teste expirado'
                            : `Licença expirada em ${company.licenseExpiresAt?.toLocaleDateString()}`;

                    // Suspender empresa
                    await this.licenseService.suspendCompany(
                        company.id,
                        reason,
                        'SYSTEM', // Suspensão automática pelo sistema
                        'Sistema Automático',
                    );

                    // Atualizar status para EXPIRED
                    await this.prisma.company.update({
                        where: { id: company.id },
                        data: {
                            licenseStatus: LicenseStatus.EXPIRED,
                        },
                    });

                    suspended++;
                    this.logger.warn(`Empresa suspensa: ${company.companyName} - ${reason}`);
                } catch (error) {
                    this.logger.error(
                        `Erro ao suspender empresa ${company.companyName}: ${error.message}`,
                    );
                }
            }

            this.logger.log(
                `Verificação concluída: ${suspended}/${expiredCompanies.length} empresas suspensas`,
            );

            return {
                total: expiredCompanies.length,
                suspended,
                timestamp: new Date(),
            };
        } catch (error) {
            this.logger.error(`Erro na verificação de licenças expiradas: ${error.message}`);
            throw error;
        }
    }

    /**
     * Verificar e marcar pagamentos atrasados
     * Roda às 03:00 AM todos os dias
     */
    @Cron(CronExpression.EVERY_DAY_AT_3AM)
    async checkOverduePayments() {
        this.logger.log('Iniciando verificação de pagamentos atrasados...');

        try {
            const now = new Date();

            // Buscar pagamentos pendentes com data de vencimento passada
            const overduePayments = await this.prisma.payment.findMany({
                where: {
                    status: 'PENDING',
                    dueDate: {
                        lt: now,
                    },
                },
                include: {
                    company: true,
                },
            });

            this.logger.log(`Encontrados ${overduePayments.length} pagamentos atrasados`);

            let updated = 0;
            for (const payment of overduePayments) {
                try {
                    // Atualizar status para OVERDUE
                    await this.prisma.payment.update({
                        where: { id: payment.id },
                        data: { status: 'OVERDUE' },
                    });

                    updated++;
                    this.logger.warn(
                        `Pagamento atrasado: ${payment.company.companyName} - Venc: ${payment.dueDate.toLocaleDateString()}`,
                    );
                } catch (error) {
                    this.logger.error(
                        `Erro ao atualizar pagamento ${payment.id}: ${error.message}`,
                    );
                }
            }

            this.logger.log(
                `Verificação concluída: ${updated}/${overduePayments.length} pagamentos marcados como atrasados`,
            );

            return {
                total: overduePayments.length,
                updated,
                timestamp: new Date(),
            };
        } catch (error) {
            this.logger.error(`Erro na verificação de pagamentos atrasados: ${error.message}`);
            throw error;
        }
    }
}
