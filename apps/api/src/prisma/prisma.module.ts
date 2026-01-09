import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CommonModule } from '../common/common.module';

@Global()
@Module({
    imports: [CommonModule], // Import for TenantContextService
    providers: [PrismaService],
    exports: [PrismaService],
})
export class PrismaModule { }

