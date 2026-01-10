import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Criar um novo pagamento
     */
    async createPayment(data: {
        companyId: string;
        amount: number;
        referenceMonth: Date;
        dueDate: Date;
        notes?: string;
        createdBy?: string;
        createdByName?: string;
        planId?: string;
        planName?: string;
        planDetails?: any;
    }) {
        this.logger.log(`Creating payment for company ${data.companyId}: R$ ${data.amount}`);

        return this.prisma.payment.create({
            data: {
                companyId: data.companyId,
                amount: data.amount,
                status: PaymentStatus.PENDING,
                referenceMonth: data.referenceMonth,
                dueDate: data.dueDate,
                notes: data.notes,
                // Auditoria
                createdBy: data.createdBy,
                createdByName: data.createdByName,
                planId: data.planId,
                planName: data.planName,
                planDetails: data.planDetails,
            },
            include: {
                company: {
                    select: {
                        id: true,
                        companyName: true,
                    }
                }
            }
        });
    }

    /**
     * Marcar pagamento como pago
     */
    async markAsPaid(paymentId: string, data: {
        method?: string;
        transactionId?: string;
        receiptUrl?: string;
    }) {
        this.logger.log(`Marking payment ${paymentId} as PAID`);

        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: { company: true }
        });

        if (!payment) {
            throw new NotFoundException('Pagamento não encontrado');
        }

        const updated = await this.prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: PaymentStatus.PAID,
                paidAt: new Date(),
                method: data.method,
                transactionId: data.transactionId,
                receiptUrl: data.receiptUrl,
            },
            include: {
                company: true
            }
        });

        // Se a empresa estava suspensa por falta de pagamento, reativar
        if (payment.company.licenseStatus === 'SUSPENDED') {
            await this.prisma.company.update({
                where: { id: payment.companyId },
                data: {
                    licenseStatus: 'ACTIVE',
                    suspendedAt: null,
                    suspensionReason: null,
                }
            });
            this.logger.log(`Company ${payment.company.companyName} reactivated after payment`);
        }

        return updated;
    }

    /**
     * Marcar pagamento como atrasado
     */
    async markAsOverdue(paymentId: string) {
        this.logger.log(`Marking payment ${paymentId} as OVERDUE`);

        return this.prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: PaymentStatus.OVERDUE,
            }
        });
    }

    /**
     * Atualizar detalhes do pagamento
     */
    async updatePayment(paymentId: string, data: {
        amount?: number;
        dueDate?: Date;
        notes?: string;
        method?: string;
        status?: PaymentStatus;
    }) {
        this.logger.log(`Updating payment ${paymentId}`);

        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId }
        });

        if (!payment) {
            throw new NotFoundException('Pagamento não encontrado');
        }

        // Se estiver alterando o status para PAID, atualizar data de pagamento se não existir
        let paidAt = payment.paidAt;
        if (data.status === PaymentStatus.PAID && !payment.paidAt) {
            paidAt = new Date();
        } else if (data.status && data.status !== PaymentStatus.PAID) {
            paidAt = null;
        }

        return this.prisma.payment.update({
            where: { id: paymentId },
            data: {
                amount: data.amount,
                dueDate: data.dueDate,
                notes: data.notes,
                method: data.method,
                status: data.status,
                paidAt: paidAt,
            }
        });
    }

    /**
     * Listar todos os pagamentos
     */
    async findAll(filters?: {
        status?: PaymentStatus;
        companyId?: string;
    }) {
        return this.prisma.payment.findMany({
            where: {
                status: filters?.status,
                companyId: filters?.companyId,
            },
            include: {
                company: {
                    select: {
                        id: true,
                        companyName: true,
                        licenseStatus: true,
                    }
                }
            },
            orderBy: {
                dueDate: 'desc'
            }
        });
    }

    /**
     * Buscar pagamentos de uma empresa
     */
    async findByCompany(companyId: string) {
        return this.prisma.payment.findMany({
            where: { companyId },
            orderBy: {
                referenceMonth: 'desc'
            }
        });
    }

    /**
     * Buscar pagamentos pendentes
     */
    async findPending() {
        return this.findAll({ status: PaymentStatus.PENDING });
    }

    /**
     * Buscar pagamentos atrasados
     */
    async findOverdue() {
        return this.findAll({ status: PaymentStatus.OVERDUE });
    }

    /**
     * Verificar e atualizar pagamentos vencidos
     * (Chamado pelo cron job)
     */
    async checkAndUpdateOverduePayments() {
        const now = new Date();

        // Buscar pagamentos PENDING com dueDate vencida
        const overduePayments = await this.prisma.payment.findMany({
            where: {
                status: PaymentStatus.PENDING,
                dueDate: {
                    lt: now
                }
            },
            include: {
                company: true
            }
        });

        this.logger.log(`Found ${overduePayments.length} overdue payments`);

        for (const payment of overduePayments) {
            // Marcar como OVERDUE
            await this.markAsOverdue(payment.id);

            // Suspender empresa
            if (payment.company.licenseStatus !== 'SUSPENDED') {
                await this.prisma.company.update({
                    where: { id: payment.companyId },
                    data: {
                        licenseStatus: 'SUSPENDED',
                        suspendedAt: now,
                        suspensionReason: `Pagamento em atraso (Vencimento: ${payment.dueDate.toLocaleDateString()})`,
                    }
                });
                this.logger.warn(`Company ${payment.company.companyName} suspended due to overdue payment`);
            }
        }

        return {
            processed: overduePayments.length,
            payments: overduePayments.map(p => ({
                id: p.id,
                companyName: p.company.companyName,
                amount: p.amount,
                dueDate: p.dueDate,
            }))
        };
    }

    /**
     * Excluir pagamento
     */
    async deletePayment(paymentId: string) {
        this.logger.log(`Deleting payment ${paymentId}`);

        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId }
        });

        if (!payment) {
            throw new NotFoundException('Pagamento não encontrado');
        }

        await this.prisma.payment.delete({
            where: { id: paymentId }
        });

        this.logger.log(`Payment ${paymentId} deleted successfully`);
        return { message: 'Pagamento excluído com sucesso' };
    }
}
