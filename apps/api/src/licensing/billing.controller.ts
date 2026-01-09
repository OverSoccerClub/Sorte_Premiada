import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { BillingService } from './billing.service';
import { SkipLicenseCheck } from './skip-license-check.decorator';

/**
 * Controller para gerenciamento de billing/pagamentos (MASTER only)
 * Permite registrar pagamentos, ver histórico e gerar relatórios
 */
@Controller('billing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MASTER')
@SkipLicenseCheck() // MASTER não precisa verificar própria licença
export class BillingController {
    constructor(private billingService: BillingService) { }

    /**
     * Listar todos os pagamentos
     * GET /billing/payments?status=PENDING&limit=50
     */
    @Get('payments')
    async getAllPayments(
        @Query('status') status?: string,
        @Query('limit') limit?: string,
    ) {
        const limitNum = limit ? parseInt(limit, 10) : 100;

        let payments;
        if (status) {
            payments = await this.billingService['prisma'].payment.findMany({
                where: { status: status as any },
                include: { company: true },
                orderBy: { createdAt: 'desc' },
                take: limitNum,
            });
        } else {
            payments = await this.billingService['prisma'].payment.findMany({
                include: { company: true },
                orderBy: { createdAt: 'desc' },
                take: limitNum,
            });
        }

        return {
            total: payments.length,
            payments,
        };
    }

    /**
     * Listar pagamentos de uma empresa específica
     * GET /billing/payments/:companyId?limit=50
     */
    @Get('payments/:companyId')
    async getCompanyPayments(
        @Param('companyId') companyId: string,
        @Query('limit') limit?: string,
    ) {
        const limitNum = limit ? parseInt(limit, 10) : 50;
        const payments = await this.billingService.getPaymentHistory(companyId, limitNum);

        return {
            total: payments.length,
            payments,
        };
    }

    /**
     * Registrar um pagamento
     * POST /billing/payments/:paymentId
     * Body: { transactionId?: string, receiptUrl?: string, notes?: string, paidAt?: string }
     */
    @Post('payments/:paymentId')
    @HttpCode(HttpStatus.OK)
    async registerPayment(
        @Param('paymentId') paymentId: string,
        @Body() data: {
            transactionId?: string;
            receiptUrl?: string;
            notes?: string;
            paidAt?: string;
        },
    ) {
        const payment = await this.billingService.registerPayment(paymentId, {
            ...data,
            paidAt: data.paidAt ? new Date(data.paidAt) : undefined,
        });

        return {
            message: 'Pagamento registrado com sucesso',
            payment,
        };
    }

    /**
     * Gerar cobrança mensal para uma empresa
     * POST /billing/generate/:companyId
     * Body: { referenceMonth: string } // formato: "2024-01-01"
     */
    @Post('generate/:companyId')
    @HttpCode(HttpStatus.CREATED)
    async generateBilling(
        @Param('companyId') companyId: string,
        @Body('referenceMonth') referenceMonth: string,
    ) {
        if (!referenceMonth) {
            throw new Error('Mês de referência é obrigatório');
        }

        const payment = await this.billingService.generateMonthlyBilling(
            companyId,
            new Date(referenceMonth),
        );

        if (!payment) {
            return {
                message: 'Cobrança não gerada (empresa em trial ou já existe cobrança para este mês)',
            };
        }

        return {
            message: 'Cobrança gerada com sucesso',
            payment,
        };
    }

    /**
     * Listar pagamentos pendentes
     * GET /billing/pending
     */
    @Get('pending')
    async getPendingPayments() {
        const payments = await this.billingService.getPendingPayments();

        return {
            total: payments.length,
            payments,
        };
    }

    /**
     * Listar pagamentos atrasados
     * GET /billing/overdue
     */
    @Get('overdue')
    async getOverduePayments() {
        const payments = await this.billingService.getOverduePayments();

        return {
            total: payments.length,
            payments,
        };
    }

    /**
     * Gerar relatório financeiro
     * GET /billing/reports?startDate=2024-01-01&endDate=2024-12-31
     */
    @Get('reports')
    async getFinancialReport(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        if (!startDate || !endDate) {
            throw new Error('Datas de início e fim são obrigatórias');
        }

        const report = await this.billingService.generateFinancialReport(
            new Date(startDate),
            new Date(endDate),
        );

        return report;
    }

    /**
     * Cancelar um pagamento
     * POST /billing/payments/:paymentId/cancel
     * Body: { reason?: string }
     */
    @Post('payments/:paymentId/cancel')
    @HttpCode(HttpStatus.OK)
    async cancelPayment(
        @Param('paymentId') paymentId: string,
        @Body('reason') reason?: string,
    ) {
        const payment = await this.billingService.cancelPayment(paymentId, reason);

        return {
            message: 'Pagamento cancelado com sucesso',
            payment,
        };
    }
}
