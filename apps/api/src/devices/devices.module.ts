import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-secret-key',
            signOptions: { expiresIn: '365d' },
        }),
    ],
    controllers: [DevicesController],
    providers: [DevicesService, PrismaService],
    exports: [DevicesService], // Exportar para uso no PosDeviceGuard
})
export class DevicesModule { }
