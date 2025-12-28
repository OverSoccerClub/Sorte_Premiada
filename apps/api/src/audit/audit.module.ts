import { Module, Global } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditController } from './audit-log.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
    imports: [PrismaModule],
    controllers: [AuditController],
    providers: [AuditLogService],
    exports: [AuditLogService]
})
export class AuditModule { }
