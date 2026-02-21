import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
                signOptions: { expiresIn: '365d' },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [DevicesController],
    providers: [DevicesService, PrismaService],
    exports: [DevicesService], // Exportar para uso no PosDeviceGuard
})
export class DevicesModule { }
