import { Module, forwardRef } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { CashCollectionController } from './cash-collection.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CashCollectionService } from './cash-collection.service';

@Module({
    imports: [PrismaModule, NotificationsModule, forwardRef(() => UsersModule)],
    controllers: [FinanceController, CashCollectionController],
    providers: [FinanceService, CashCollectionService],
    exports: [FinanceService, CashCollectionService], // Export for TicketsModule
})
export class FinanceModule { }
