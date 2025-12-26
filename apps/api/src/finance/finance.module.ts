import { Module, forwardRef } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [PrismaModule],
    controllers: [FinanceController],
    providers: [FinanceService],
    exports: [FinanceService], // Export for TicketsModule
})
export class FinanceModule { }
