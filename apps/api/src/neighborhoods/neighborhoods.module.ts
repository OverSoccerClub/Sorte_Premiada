import { Module } from '@nestjs/common';
import { NeighborhoodsService } from './neighborhoods.service';
import { NeighborhoodsController } from './neighborhoods.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [NeighborhoodsController],
    providers: [NeighborhoodsService],
    exports: [NeighborhoodsService]
})
export class NeighborhoodsModule { }
