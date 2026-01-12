import { Module } from '@nestjs/common';
import { PublicSiteController } from './public-site.controller';
import { PublicSiteService } from './public-site.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [PublicSiteController],
    providers: [PublicSiteService]
})
export class PublicSiteModule { }
