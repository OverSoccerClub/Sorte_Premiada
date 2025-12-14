import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { FinanceModule } from '../finance/finance.module';

@Module({
    imports: [PrismaModule, FinanceModule],
    controllers: [TicketsController],
    providers: [TicketsService],
})
export class TicketsModule { }
