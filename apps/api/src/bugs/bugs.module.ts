import { Module } from '@nestjs/common';
import { BugsService } from './bugs.service';
import { BugsController } from './bugs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [BugsController],
    providers: [BugsService],
    exports: [BugsService],
})
export class BugsModule { }
