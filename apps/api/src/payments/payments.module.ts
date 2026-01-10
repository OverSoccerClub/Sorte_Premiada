import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentCheckJob } from './payment-check.job';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [PrismaModule, NotificationsModule],
    controllers: [PaymentsController],
    providers: [PaymentsService, PaymentCheckJob],
    exports: [PaymentsService],
})
export class PaymentsModule { }
