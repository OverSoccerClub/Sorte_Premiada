import { Module, forwardRef } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [PrismaModule, NotificationsModule, forwardRef(() => UsersModule)],
    controllers: [FinanceController],
    providers: [FinanceService],
    exports: [FinanceService], // Export for TicketsModule
})
export class FinanceModule { }
