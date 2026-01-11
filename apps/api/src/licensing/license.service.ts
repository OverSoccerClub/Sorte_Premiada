import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LicenseStatus, SubscriptionPlan, Company, LicenseHistory } from '@prisma/client';

/**
 * Service responsável por toda a lógica de licenciamento
 * Controla status de licenças, renovações, suspensões e verificações
 */
@Injectable()
export class LicenseService {
    private readonly logger = new Logger(LicenseService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Verifica o status atual da licença de uma empresa
     * @param companyId ID da empresa
     * @returns Status detalhado da licença
     */
    async checkLicenseStatus(companyId: string) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
            select: {
                id: true,
                companyName: true,
                licenseStatus: true,
                licenseStartDate: true,
                licenseExpiresAt: true,
                trialEndsAt: true,
                subscriptionPlan: true,
                isActive: true,
                suspendedAt: true,
                suspensionReason: true,
                plan: true
            },
        });

        if (!company) {
            throw new Error('Empresa não encontrada');
        }

        const now = new Date();
        const daysRemaining = this.calculateDaysRemaining(company.licenseExpiresAt);
        const trialDaysRemaining = this.calculateDaysRemaining(company.trialEndsAt);

        // Determinar se a licença está válida
        const isValid = this.isLicenseValid(company);

        return {
            companyId: company.id,
            companyName: company.companyName,
            status: company.licenseStatus,
            plan: company.plan?.name || company.subscriptionPlan,
            planDetails: company.plan,
            isActive: company.isActive,
            isValid,
            licenseStartDate: company.licenseStartDate,
            licenseExpiresAt: company.licenseExpiresAt,
            daysRemaining,
            trialEndsAt: company.trialEndsAt,
            trialDaysRemaining,
            suspendedAt: company.suspendedAt,
            suspensionReason: company.suspensionReason,
            warnings: this.generateWarnings(company, daysRemaining, trialDaysRemaining),
        };
    }

    /**
     * Calcula quantos dias faltam até uma data
     * @param date Data de expiração
     * @returns Número de dias restantes (negativo se expirado)
     */
    calculateDaysRemaining(date: Date | null): number | null {
        if (!date) return null;

        const now = new Date();
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    }

    /**
     * Verifica se a licença está válida (não expirada e não suspensa)
     * @param company Dados da empresa
     * @returns true se licença válida
     */
    private isLicenseValid(company: any): boolean {
        const now = new Date();

        // Se não está ativa, não é válida
        if (!company.isActive) return false;

        // Se está suspensa, não é válida
        if (company.licenseStatus === LicenseStatus.SUSPENDED) return false;
        if (company.licenseStatus === LicenseStatus.BLOCKED) return false;
        if (company.licenseStatus === LicenseStatus.CANCELLED) return false;

        // Se está em trial, verificar se não expirou
        if (company.licenseStatus === LicenseStatus.TRIAL) {
            if (company.trialEndsAt && company.trialEndsAt < now) {
                return false;
            }
            return true;
        }

        // Se está ativa, verificar se não expirou
        if (company.licenseStatus === LicenseStatus.ACTIVE) {
            if (company.licenseExpiresAt && company.licenseExpiresAt < now) {
                return false;
            }
            return true;
        }

        // Se está expirada, não é válida
        if (company.licenseStatus === LicenseStatus.EXPIRED) return false;

        return false;
    }

    /**
     * Gera avisos baseados no status da licença
     */
    private generateWarnings(company: any, daysRemaining: number | null, trialDaysRemaining: number | null): string[] {
        const warnings: string[] = [];

        // Avisos de trial
        if (company.licenseStatus === LicenseStatus.TRIAL && trialDaysRemaining !== null) {
            if (trialDaysRemaining <= 0) {
                warnings.push('Período de teste expirado! Ative sua licença.');
            } else if (trialDaysRemaining <= 3) {
                warnings.push(`Período de teste expira em ${trialDaysRemaining} dia(s)!`);
            } else if (trialDaysRemaining <= 7) {
                warnings.push(`Período de teste expira em ${trialDaysRemaining} dias.`);
            }
        }

        // Avisos de licença ativa
        if (company.licenseStatus === LicenseStatus.ACTIVE && daysRemaining !== null) {
            if (daysRemaining <= 0) {
                warnings.push('Licença expirada! Renove para continuar usando.');
            } else if (daysRemaining <= 3) {
                warnings.push(`Licença expira em ${daysRemaining} dia(s)! Renove urgentemente.`);
            } else if (daysRemaining <= 7) {
                warnings.push(`Licença expira em ${daysRemaining} dias. Renove em breve.`);
            }
        }

        // Avisos de suspensão
        if (company.licenseStatus === LicenseStatus.SUSPENDED) {
            warnings.push(`Licença suspensa: ${company.suspensionReason || 'Entre em contato com o suporte'}`);
        }

        if (company.licenseStatus === LicenseStatus.BLOCKED) {
            warnings.push('Licença bloqueada. Entre em contato com o suporte.');
        }

        if (company.licenseStatus === LicenseStatus.EXPIRED) {
            warnings.push('Licença expirada. Renove para continuar usando o sistema.');
        }

        return warnings;
    }

    /**
     * Verifica se a empresa está dentro dos limites de uso
     * @param companyId ID da empresa
     * @returns Informações sobre limites e uso atual
     */
    async checkUsageLimits(companyId: string) {
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
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const ticketsThisMonth = await this.prisma.ticket.count({
            where: {
                companyId,
                createdAt: {
                    gte: firstDayOfMonth,
                    lte: lastDayOfMonth,
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

        // Contar apenas usuários do tipo CAMBISTA
        const usersCount = await this.prisma.user.count({
            where: {
                companyId,
                role: 'CAMBISTA'
            }
        });

        const gamesCount = company._count.games;

        return {
            users: {
                current: usersCount,
                max: company.maxUsers,
                available: company.maxUsers - usersCount,
                exceeded: usersCount > company.maxUsers,
                percentage: Math.round((usersCount / company.maxUsers) * 100),
            },
            tickets: {
                current: ticketsThisMonth,
                max: company.maxTicketsPerMonth,
                available: company.maxTicketsPerMonth - ticketsThisMonth,
                exceeded: ticketsThisMonth > company.maxTicketsPerMonth,
                percentage: Math.round((ticketsThisMonth / company.maxTicketsPerMonth) * 100),
            },
            games: {
                current: gamesCount,
                max: company.maxGames,
                available: company.maxGames - gamesCount,
                exceeded: gamesCount > company.maxGames,
                percentage: Math.round((gamesCount / company.maxGames) * 100),
            },
            devices: {
                current: activeDevices,
                max: company.maxActiveDevices,
                available: company.maxActiveDevices - activeDevices,
                exceeded: activeDevices > company.maxActiveDevices,
                percentage: Math.round((activeDevices / company.maxActiveDevices) * 100),
            },
        };
    }

    /**
     * Renova a licença de uma empresa (MASTER only)
     * @param companyId ID da empresa
     * @param months Número de meses para renovar
     * @param performedBy ID do usuário MASTER que está renovando
     * @returns Empresa atualizada
     */
    async renewLicense(companyId: string, months: number, performedBy: string, performedByName?: string) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
        });

        if (!company) {
            throw new Error('Empresa não encontrada');
        }

        const now = new Date();
        const currentExpiration = company.licenseExpiresAt || now;
        const newExpiration = new Date(currentExpiration);
        newExpiration.setMonth(newExpiration.getMonth() + months);

        const previousStatus = company.licenseStatus;

        // Atualizar empresa
        const updated = await this.prisma.company.update({
            where: { id: companyId },
            data: {
                licenseStatus: LicenseStatus.ACTIVE,
                licenseExpiresAt: newExpiration,
                isActive: true,
                suspendedAt: null,
                suspensionReason: null,
                lastModifiedBy: performedBy,
                lastModifiedAt: now,
            },
        });

        // Registrar no histórico
        await this.recordLicenseHistory({
            companyId,
            action: 'RENEWED',
            previousStatus,
            newStatus: LicenseStatus.ACTIVE,
            reason: `Licença renovada por ${months} mês(es)`,
            performedBy,
            performedByName,
            metadata: { months, newExpiration },
        });

        this.logger.log(`Licença renovada: ${company.companyName} por ${months} mês(es)`);

        return updated;
    }

    /**
     * Suspende uma empresa (MASTER only)
     * @param companyId ID da empresa
     * @param reason Motivo da suspensão
     * @param performedBy ID do usuário MASTER
     * @returns Empresa atualizada
     */
    async suspendCompany(companyId: string, reason: string, performedBy: string, performedByName?: string) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
        });

        if (!company) {
            throw new Error('Empresa não encontrada');
        }

        const previousStatus = company.licenseStatus;
        const now = new Date();

        const updated = await this.prisma.company.update({
            where: { id: companyId },
            data: {
                licenseStatus: LicenseStatus.SUSPENDED,
                isActive: false,
                suspendedAt: now,
                suspensionReason: reason,
                lastModifiedBy: performedBy,
                lastModifiedAt: now,
            },
        });

        // Registrar no histórico
        await this.recordLicenseHistory({
            companyId,
            action: 'SUSPENDED',
            previousStatus,
            newStatus: LicenseStatus.SUSPENDED,
            reason,
            performedBy,
            performedByName,
        });

        this.logger.warn(`Empresa suspensa: ${company.companyName} - Motivo: ${reason}`);

        return updated;
    }

    /**
     * Ativa uma empresa suspensa (MASTER only)
     * @param companyId ID da empresa
     * @param performedBy ID do usuário MASTER
     * @returns Empresa atualizada
     */
    async activateCompany(companyId: string, performedBy: string, performedByName?: string) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
        });

        if (!company) {
            throw new Error('Empresa não encontrada');
        }

        const previousStatus = company.licenseStatus;
        const now = new Date();

        // Determinar novo status baseado na expiração
        let newStatus: LicenseStatus = LicenseStatus.ACTIVE;
        if (company.licenseExpiresAt && company.licenseExpiresAt < now) {
            newStatus = LicenseStatus.EXPIRED;
        }

        const updated = await this.prisma.company.update({
            where: { id: companyId },
            data: {
                licenseStatus: newStatus,
                isActive: true,
                suspendedAt: null,
                suspensionReason: null,
                lastModifiedBy: performedBy,
                lastModifiedAt: now,
            },
        });

        // Registrar no histórico
        await this.recordLicenseHistory({
            companyId,
            action: 'ACTIVATED',
            previousStatus,
            newStatus,
            reason: 'Empresa reativada pelo administrador',
            performedBy,
            performedByName,
        });

        this.logger.log(`Empresa ativada: ${company.companyName}`);

        return updated;
    }

    /**
     * Atualiza os limites de uso de uma empresa (MASTER only)
     * @param companyId ID da empresa
     * @param limits Novos limites
     * @param performedBy ID do usuário MASTER
     * @returns Empresa atualizada
     */
    async updateLimits(
        companyId: string,
        limits: {
            maxUsers?: number;
            maxTicketsPerMonth?: number;
            maxGames?: number;
            maxActiveDevices?: number;
        },
        performedBy: string,
        performedByName?: string,
    ) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
        });

        if (!company) {
            throw new Error('Empresa não encontrada');
        }

        const updated = await this.prisma.company.update({
            where: { id: companyId },
            data: {
                ...limits,
                lastModifiedBy: performedBy,
                lastModifiedAt: new Date(),
            },
        });

        // Registrar no histórico
        await this.recordLicenseHistory({
            companyId,
            action: 'LIMITS_UPDATED',
            previousStatus: company.licenseStatus,
            newStatus: company.licenseStatus,
            reason: 'Limites de uso atualizados',
            performedBy,
            performedByName,
            metadata: limits,
        });

        this.logger.log(`Limites atualizados: ${company.companyName}`);

        return updated;
    }

    /**
     * Configurar período de teste de uma empresa (MASTER only)
     * @param companyId ID da empresa
     * @param trialDays Número de dias de teste
     * @param performedBy ID do usuário MASTER
     * @returns Empresa atualizada
     */
    async setTrialPeriod(
        companyId: string,
        trialDays: number,
        performedBy: string,
        performedByName?: string,
    ) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
        });

        if (!company) {
            throw new Error('Empresa não encontrada');
        }

        const now = new Date();
        const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

        const updated = await this.prisma.company.update({
            where: { id: companyId },
            data: {
                trialEndsAt,
                licenseStatus: LicenseStatus.TRIAL,
                lastModifiedBy: performedBy,
                lastModifiedAt: now,
            },
        });

        // Registrar no histórico
        await this.recordLicenseHistory({
            companyId,
            action: 'TRIAL_CONFIGURED',
            previousStatus: company.licenseStatus,
            newStatus: LicenseStatus.TRIAL,
            reason: `Período de teste configurado para ${trialDays} dia(s)`,
            performedBy,
            performedByName,
            metadata: { trialDays, trialEndsAt },
        });

        this.logger.log(`Período de teste configurado: ${company.companyName} - ${trialDays} dias`);

        return updated;
    }

    /**
     * Registra uma mudança no histórico de licenças
     */
    async recordLicenseHistory(data: {
        companyId: string;
        action: string;
        previousStatus: LicenseStatus;
        newStatus: LicenseStatus;
        reason?: string;
        performedBy: string;
        performedByName?: string;
        previousPlan?: SubscriptionPlan;
        newPlan?: SubscriptionPlan;
        metadata?: any;
    }): Promise<LicenseHistory> {
        // Validação crítica: performedBy é obrigatório
        if (!data.performedBy) {
            this.logger.error(`recordLicenseHistory called without performedBy! Data: ${JSON.stringify(data)}`);
            throw new Error('performedBy is required for license history');
        }

        this.logger.log(`Recording license history: ${data.action} for company ${data.companyId} by ${data.performedBy}`);

        return this.prisma.licenseHistory.create({
            data: {
                companyId: data.companyId,
                action: data.action,
                previousStatus: data.previousStatus,
                newStatus: data.newStatus,
                previousPlan: data.previousPlan,
                newPlan: data.newPlan,
                reason: data.reason,
                performedBy: data.performedBy,
                performedByName: data.performedByName,
                metadata: data.metadata,
            },
        });
    }

    /**
     * Busca o histórico de licenças de uma empresa
     * @param companyId ID da empresa
     * @param limit Número máximo de registros
     * @returns Histórico de licenças
     */
    async getLicenseHistory(companyId: string, limit: number = 50) {
        return this.prisma.licenseHistory.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
}
