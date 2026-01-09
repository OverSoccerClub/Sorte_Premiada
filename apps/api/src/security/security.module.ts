import { Module, Global } from '@nestjs/common';
import { SecurityService } from './security.service';
import { SecurityController } from './security.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
    imports: [PrismaModule],
    controllers: [SecurityController],
    providers: [SecurityService],
    exports: [SecurityService]
})
export class SecurityModule { }
