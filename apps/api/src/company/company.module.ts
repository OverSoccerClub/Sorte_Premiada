import { Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { PrismaModule } from '../prisma/prisma.module';

import { DevicesModule } from '../devices/devices.module';

@Module({
    imports: [PrismaModule, DevicesModule],
    controllers: [CompanyController],
    providers: [CompanyService],
    exports: [CompanyService],
})
export class CompanyModule { }
