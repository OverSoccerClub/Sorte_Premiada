import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus, SubscriptionPlan } from '@prisma/client';
import { PlansService } from '../plans/plans.service';

/**
 * Service responsável por toda a lógica de cobrança e pagamentos
 * Gera cobranças mensais, registra pagamentos e calcula valores
 */
@Injectable()
export class BillingService {
    private readonly logger = new Logger(BillingService.name);

    constructor(
        private prisma: PrismaService,
        private plansService: PlansService
    ) { }

    /**
     * Tabela de preços dos planos
     */
    private readonly PLAN_PRICES = {
        [SubscriptionPlan.BASIC]: 99.00,
        [SubscriptionPlan.PRO]: 299.00,
        [SubscriptionPlan.ENTERPRISE]: 999.00,
        [SubscriptionPlan.CUSTOM]: 0, // Preço customizado
    };

    /**
     * Gera cobrança mensal para uma empresa
     * @param companyId ID da empresa
     * @param referenceMonth Mês de referência
     * @returns Cobrança criada
     */
    async generateMonthlyBilling(companyId: string, referenceMonth: Date) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
        });

        if (!company) {
            throw new Error('Empresa não encontrada');
        }

        // Não gerar cobrança para empresas em trial
        if (company.licenseStatus === 'TRIAL') {
            this.logger.log(`Empresa ${company.companyName} em trial - cobrança não gerada`);
            return null;
        }

        // Calcular valor baseado no plano
        const amount = this.calculateAmount(company.subscriptionPlan, company.monthlyPrice);

        // Data de vencimento: dia 10 do mês de referência
        const dueDate = new Date(referenceMonth);
        dueDate.setDate(10);

        // Verificar se já existe cobrança para este mês
        const existingPayment = await this.prisma.payment.findFirst({
            where: {
                companyId,
                referenceMonth: {
                    gte: new Date(referenceMonth.getFullYear(), referenceMonth.getMonth(), 1),
                    lt: new Date(referenceMonth.getFullYear(), referenceMonth.getMonth() + 1, 1),
                },
            },
        });

        if (existingPayment) {
            this.logger.warn(`Cobrança já existe para ${company.companyName} - ${referenceMonth.toISOString()}`);
            return existingPayment;
        }

        // Criar cobrança
        const payment = await this.prisma.payment.create({
            data: {
                companyId,
                amount,
                currency: company.currency,
                status: PaymentStatus.PENDING,
                method: company.paymentMethod,
                referenceMonth,
                dueDate,
            },
        });

        // Atualizar nextBillingDate da empresa
        const nextBilling = new Date(referenceMonth);
        nextBilling.setMonth(nextBilling.getMonth() + 1);

        await this.prisma.company.update({
            where: { id: companyId },
            data: { nextBillingDate: nextBilling },
        });

        this.logger.log(`Cobrança gerada: ${company.companyName} - R$ ${amount} - Venc: ${dueDate.toLocaleDateString()}`);

        return payment;
    }

    /**
     * Calcula o valor da cobrança baseado no plano
     * @param plan Plano da empresa
     * @param customPrice Preço customizado (se aplicável)
     * @returns Valor em decimal
     */
    calculateAmount(plan: SubscriptionPlan, customPrice?: any): number {
        if (plan === SubscriptionPlan.CUSTOM && customPrice) {
            return parseFloat(customPrice.toString());
        }

        return this.PLAN_PRICES[plan] || 0;
    }

    /**
     * Registra um pagamento (MASTER only)
     * @param paymentId ID do pagamento
     * @param data Dados do pagamento
     * @returns Pagamento atualizado
     */
    async registerPayment(
        paymentId: string,
        data: {
            transactionId?: string;
            receiptUrl?: string;
            notes?: string;
            paidAt?: Date;
        },
    ) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: { company: true },
        });

        if (!payment) {
            throw new Error('Pagamento não encontrado');
        }

        const paidAt = data.paidAt || new Date();

        // Atualizar pagamento
        const updated = await this.prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: PaymentStatus.PAID,
                paidAt,
                transactionId: data.transactionId,
                receiptUrl: data.receiptUrl,
                notes: data.notes,
            },
        });

        // Atualizar lastPaymentDate da empresa
        await this.prisma.company.update({
            where: { id: payment.companyId },
            data: { lastPaymentDate: paidAt },
        });

        this.logger.log(`Pagamento registrado: ${payment.company.companyName} - R$ ${payment.amount}`);

        return updated;
    }

    /**
     * Marca um pagamento como atrasado
     * @param paymentId ID do pagamento
     * @returns Pagamento atualizado
     */
    async markAsOverdue(paymentId: string) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: { company: true },
        });

        if (!payment) {
            throw new Error('Pagamento não encontrado');
        }

        const updated = await this.prisma.payment.update({
            where: { id: paymentId },
            data: { status: PaymentStatus.OVERDUE },
        });

        this.logger.warn(`Pagamento atrasado: ${payment.company.companyName} - Venc: ${payment.dueDate.toLocaleDateString()}`);

        return updated;
    }

    /**
     * Busca histórico de pagamentos de uma empresa
     * @param companyId ID da empresa
     * @param limit Número máximo de registros
     * @returns Lista de pagamentos
     */
    async getPaymentHistory(companyId: string, limit: number = 50) {
        return this.prisma.payment.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    /**
     * Busca todos os pagamentos pendentes
     * @returns Lista de pagamentos pendentes
     */
    async getPendingPayments() {
        return this.prisma.payment.findMany({
            where: { status: PaymentStatus.PENDING },
            include: { company: true },
            orderBy: { dueDate: 'asc' },
        });
    }

    /**
     * Busca pagamentos atrasados
     * @returns Lista de pagamentos atrasados
     */
    async getOverduePayments() {
        const now = new Date();

        return this.prisma.payment.findMany({
            where: {
                OR: [
                    { status: PaymentStatus.OVERDUE },
                    {
                        status: PaymentStatus.PENDING,
                        dueDate: { lt: now },
                    },
                ],
            },
            include: { company: true },
            orderBy: { dueDate: 'asc' },
        });
    }

    /**
     * Gera relatório financeiro
     * @param startDate Data inicial
     * @param endDate Data final
     * @returns Relatório com estatísticas
     */
    async generateFinancialReport(startDate: Date, endDate: Date) {
        const payments = await this.prisma.payment.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: { company: true },
        });

        const totalPaid = payments
            .filter(p => p.status === PaymentStatus.PAID)
            .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

        const totalPending = payments
            .filter(p => p.status === PaymentStatus.PENDING)
            .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

        const totalOverdue = payments
            .filter(p => p.status === PaymentStatus.OVERDUE)
            .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

        const byPlan = payments.reduce((acc, p) => {
            const plan = p.company.subscriptionPlan;
            if (!acc[plan]) {
                acc[plan] = { count: 0, total: 0 };
            }
            acc[plan].count++;
            acc[plan].total += parseFloat(p.amount.toString());
            return acc;
        }, {} as Record<string, { count: number; total: number }>);

        return {
            period: {
                start: startDate,
                end: endDate,
            },
            summary: {
                totalPayments: payments.length,
                totalPaid,
                totalPending,
                totalOverdue,
                totalRevenue: totalPaid,
            },
            byStatus: {
                paid: payments.filter(p => p.status === PaymentStatus.PAID).length,
                pending: payments.filter(p => p.status === PaymentStatus.PENDING).length,
                overdue: payments.filter(p => p.status === PaymentStatus.OVERDUE).length,
                cancelled: payments.filter(p => p.status === PaymentStatus.CANCELLED).length,
                refunded: payments.filter(p => p.status === PaymentStatus.REFUNDED).length,
            },
            byPlan,
        };
    }

    /**
     * Cancela um pagamento (MASTER only)
     * @param paymentId ID do pagamento
     * @param reason Motivo do cancelamento
     * @returns Pagamento atualizado
     */
    async cancelPayment(paymentId: string, reason?: string) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: { company: true },
        });

        if (!payment) {
            throw new Error('Pagamento não encontrado');
        }

        const updated = await this.prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: PaymentStatus.CANCELLED,
                notes: reason,
            },
        });

        this.logger.log(`Pagamento cancelado: ${payment.company.companyName} - Motivo: ${reason}`);

        return updated;
    }



    /**
     * Realiza o upgrade de plano de uma empresa
     * Gera uma cobrança proporcional ou integral para o novo plano
     */
    async upgradePlan(companyId: string, planId: string) {
        this.logger.log(`Iniciando upgrade de plano para empresa ${companyId} -> Plano ${planId}`);

        // 1. Buscar o novo plano
        const newPlan = await this.plansService.findOne(planId);
        if (!newPlan) {
            throw new Error('Plano não encontrado');
        }

        // 2. Buscar empresa atual
        const company = await this.prisma.company.findUnique({ where: { id: companyId } });
        if (!company) {
            throw new Error('Empresa não encontrada');
        }

        // 3. Gerar Cobrança (Financeiro)
        // Regra simples: Cobra o valor integral do novo plano para iniciar o novo ciclo
        // TODO: Implementar pró-rata se necessário no futuro
        const amount = newPlan.price;
        const now = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 3); // Vencimento em 3 dias para o upgrade

        const payment = await this.prisma.payment.create({
            data: {
                companyId,
                amount,
                currency: 'BRL',
                status: PaymentStatus.PENDING,
                method: company.paymentMethod || 'PIX',
                referenceMonth: now, // Mês atual
                dueDate,
                notes: `Upgrade para plano ${newPlan.name}`,
            }
        });

        // 4. Aplicar o novo plano à empresa
        await this.plansService.applyPlanToCompany(companyId, planId);

        // 5. Atualizar licença se estiver expirada (Opcional - talvez esperar pagamento?)
        // Por enquanto, vamos manter status atual mas atualizar os limites (feito pelo applyPlanToCompany)
        // Se a empresa estava TRIAL, ela vira ACTIVE mas PENDING payment?
        // Vamos forçar update de status se for TRIAL para ACTIVE
        if (company.licenseStatus === 'TRIAL') {
            await this.prisma.company.update({
                where: { id: companyId },
                data: {
                    licenseStatus: 'ACTIVE',
                    licenseStartDate: now,
                    // Define validade de 30 dias a partir de agora, ou esperar pagamento para estender?
                    // Vamos dar 5 dias de 'Active' esperando pagamento
                    licenseExpiresAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
                }
            });
        }

        this.logger.log(`Upgrade realizado com sucesso. Pagamento gerado: ${payment.id}`);
        return {
            success: true,
            message: `Plano atualizado para ${newPlan.name}. Fatura gerada.`,
            paymentId: payment.id,
            boletoUrl: payment.receiptUrl // Futuro
        };
    }
}
