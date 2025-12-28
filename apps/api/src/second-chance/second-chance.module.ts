
import { Module } from '@nestjs/common';
import { SecondChanceService } from './second-chance.service';
import { SecondChanceController } from './second-chance.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [SecondChanceController],
    providers: [SecondChanceService],
    exports: [SecondChanceService],
})
export class SecondChanceModule { }
