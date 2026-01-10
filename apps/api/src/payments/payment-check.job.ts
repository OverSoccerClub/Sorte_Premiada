import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class PaymentCheckJob {
    private readonly logger = new Logger(PaymentCheckJob.name);

    constructor(private paymentsService: PaymentsService) { }

    /**
     * Verificar e processar pagamentos vencidos
     * Executa diariamente às 00:00 (meia-noite)
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleOverduePayments() {
        this.logger.log('Starting daily overdue payment check...');

        try {
            const result = await this.paymentsService.checkAndUpdateOverduePayments();

            this.logger.log(`Overdue payment check completed: ${result.processed} payments processed`);

            if (result.processed > 0) {
                this.logger.warn(`Companies suspended due to overdue payments:`);
                result.payments.forEach(p => {
                    this.logger.warn(`  - ${p.companyName}: R$ ${p.amount} (Due: ${p.dueDate})`);
                });
            }
        } catch (error) {
            this.logger.error(`Error checking overdue payments: ${error.message}`, error.stack);
        }
    }

    /**
     * Verificação adicional ao meio-dia (opcional)
     * Descomente se quiser verificar 2x por dia
     */
    // @Cron(CronExpression.EVERY_DAY_AT_NOON)
    // async handleOverduePaymentsNoon() {
    //     this.logger.log('Starting noon overdue payment check...');
    //     await this.handleOverduePayments();
    // }
}
