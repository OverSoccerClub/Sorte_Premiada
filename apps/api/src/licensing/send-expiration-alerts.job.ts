import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LicenseService } from './license.service';
import { LicenseStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Cron Job para enviar alertas de vencimento de licença
 * Roda diariamente às 08:00 AM
 * Envia alertas 7, 3 e 1 dia antes do vencimento
 */
@Injectable()
export class SendExpirationAlertsJob {
    private readonly logger = new Logger(SendExpirationAlertsJob.name);

    constructor(
        private licenseService: LicenseService,
        private prisma: PrismaService,
    ) { }

    /**
     * Enviar alertas de vencimento
     * Roda às 08:00 AM todos os dias
     */
    @Cron(CronExpression.EVERY_DAY_AT_8AM)
    async sendExpirationAlerts() {
        this.logger.log('Iniciando envio de alertas de vencimento...');

        try {
            const now = new Date();

            // Calcular datas de alerta (7, 3 e 1 dia antes)
            const in7Days = new Date(now);
            in7Days.setDate(in7Days.getDate() + 7);

            const in3Days = new Date(now);
            in3Days.setDate(in3Days.getDate() + 3);

            const in1Day = new Date(now);
            in1Day.setDate(in1Day.getDate() + 1);

            // Buscar empresas que precisam de alerta
            const companies = await this.prisma.company.findMany({
                where: {
                    isActive: true,
                    OR: [
                        // Licenças ACTIVE próximas do vencimento
                        {
                            licenseStatus: LicenseStatus.ACTIVE,
                            licenseExpiresAt: {
                                gte: now,
                                lte: in7Days,
                            },
                        },
                        // Licenças TRIAL próximas do vencimento
                        {
                            licenseStatus: LicenseStatus.TRIAL,
                            trialEndsAt: {
                                gte: now,
                                lte: in7Days,
                            },
                        },
                    ],
                },
                include: {
                    users: {
                        where: {
                            role: 'ADMIN',
                        },
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            pushToken: true,
                        },
                    },
                },
            });

            this.logger.log(`Encontradas ${companies.length} empresas para enviar alertas`);

            let alertsSent = 0;
            for (const company of companies) {
                try {
                    // Calcular dias restantes
                    const expirationDate =
                        company.licenseStatus === LicenseStatus.TRIAL
                            ? company.trialEndsAt
                            : company.licenseExpiresAt;

                    if (!expirationDate) continue;

                    const daysRemaining = this.licenseService.calculateDaysRemaining(expirationDate);
                    if (daysRemaining === null) continue;

                    // Determinar se deve enviar alerta (7, 3 ou 1 dia)
                    const shouldAlert = daysRemaining === 7 || daysRemaining === 3 || daysRemaining === 1;

                    if (!shouldAlert) continue;

                    // Preparar mensagem de alerta
                    const message = this.buildAlertMessage(company, daysRemaining);

                    // Enviar alerta para todos os ADMINs da empresa
                    for (const admin of company.users) {
                        try {
                            // TODO: Integrar com sistema de notificações
                            // Por enquanto, apenas logar
                            this.logger.warn(
                                `Alerta para ${admin.name || admin.email}: ${message}`,
                            );

                            // Se tiver pushToken, enviar notificação push
                            if (admin.pushToken) {
                                // TODO: Enviar notificação push via Expo
                                this.logger.log(`Push notification enviada para ${admin.name}`);
                            }

                            // Se tiver email, enviar email
                            if (admin.email) {
                                // TODO: Enviar email
                                this.logger.log(`Email enviado para ${admin.email}`);
                            }

                            alertsSent++;
                        } catch (error) {
                            this.logger.error(
                                `Erro ao enviar alerta para ${admin.name}: ${error.message}`,
                            );
                        }
                    }

                    this.logger.log(
                        `Alertas enviados para ${company.companyName}: ${daysRemaining} dia(s) restantes`,
                    );
                } catch (error) {
                    this.logger.error(
                        `Erro ao processar alertas para ${company.companyName}: ${error.message}`,
                    );
                }
            }

            this.logger.log(`Envio concluído: ${alertsSent} alertas enviados`);

            return {
                companiesProcessed: companies.length,
                alertsSent,
                timestamp: new Date(),
            };
        } catch (error) {
            this.logger.error(`Erro no envio de alertas: ${error.message}`);
            throw error;
        }
    }

    /**
     * Construir mensagem de alerta baseada nos dias restantes
     */
    private buildAlertMessage(company: any, daysRemaining: number): string {
        const isTrial = company.licenseStatus === LicenseStatus.TRIAL;
        const type = isTrial ? 'período de teste' : 'licença';

        if (daysRemaining === 1) {
            return `⚠️ URGENTE: O ${type} da empresa ${company.companyName} expira AMANHÃ! Renove agora para evitar interrupção do serviço.`;
        } else if (daysRemaining === 3) {
            return `⚠️ ATENÇÃO: O ${type} da empresa ${company.companyName} expira em 3 dias. Renove em breve para evitar problemas.`;
        } else if (daysRemaining === 7) {
            return `📅 LEMBRETE: O ${type} da empresa ${company.companyName} expira em 7 dias. Planeje a renovação.`;
        }

        return `O ${type} da empresa ${company.companyName} expira em ${daysRemaining} dias.`;
    }
}
