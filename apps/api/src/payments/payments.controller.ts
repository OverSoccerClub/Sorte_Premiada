import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Logger } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PaymentStatus } from '@prisma/client';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
    private readonly logger = new Logger(PaymentsController.name);

    constructor(private readonly paymentsService: PaymentsService) { }

    /**
     * Listar todos os pagamentos (MASTER only)
     * GET /payments?status=PENDING&companyId=xxx
     */
    @Get()
    @Roles('MASTER')
    async findAll(
        @Query('status') status?: PaymentStatus,
        @Query('companyId') companyId?: string,
    ) {
        this.logger.log(`GET /payments - Status: ${status}, CompanyId: ${companyId}`);
        return this.paymentsService.findAll({ status, companyId });
    }

    /**
     * Listar pagamentos de uma empresa
     * GET /payments/company/:companyId
     */
    @Get('company/:companyId')
    @Roles('MASTER')
    async findByCompany(@Param('companyId') companyId: string) {
        this.logger.log(`GET /payments/company/${companyId}`);
        return this.paymentsService.findByCompany(companyId);
    }

    /**
     * Listar pagamentos pendentes
     * GET /payments/pending
     */
    @Get('pending')
    @Roles('MASTER')
    async findPending() {
        this.logger.log('GET /payments/pending');
        return this.paymentsService.findPending();
    }

    /**
     * Listar pagamentos atrasados
     * GET /payments/overdue
     */
    @Get('overdue')
    @Roles('MASTER')
    async findOverdue() {
        this.logger.log('GET /payments/overdue');
        return this.paymentsService.findOverdue();
    }

    /**
     * Marcar pagamento como pago
     * PUT /payments/:id/mark-paid
     */
    @Put(':id/mark-paid')
    @Roles('MASTER')
    async markAsPaid(
        @Param('id') id: string,
        @Body() data: {
            method?: string;
            transactionId?: string;
            receiptUrl?: string;
        }
    ) {
        this.logger.log(`PUT /payments/${id}/mark-paid`);
        return this.paymentsService.markAsPaid(id, data);
    }

    /**
     * Marcar pagamento como atrasado (manual)
     * PUT /payments/:id/mark-overdue
     */
    @Put(':id/mark-overdue')
    @Roles('MASTER')
    async markAsOverdue(@Param('id') id: string) {
        this.logger.log(`PUT /payments/${id}/mark-overdue`);
        return this.paymentsService.markAsOverdue(id);
    }

    /**
     * Verificar e processar pagamentos vencidos (manual trigger)
     * POST /payments/check-overdue
     */
    @Post('check-overdue')
    @Roles('MASTER')
    async checkOverdue() {
        this.logger.log('POST /payments/check-overdue - Manual trigger');
        return this.paymentsService.checkAndUpdateOverduePayments();
    }
}
