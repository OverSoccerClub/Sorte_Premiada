import { Module } from '@nestjs/common';
import { AreasService } from './areas.service';
import { AreasController } from './areas.controller';
import { AreasConfigService } from './areas-config.service';
import { AreasConfigController } from './areas-config.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AreasController, AreasConfigController],
    providers: [AreasService, AreasConfigService],
    exports: [AreasService, AreasConfigService]
})
export class AreasModule { }
