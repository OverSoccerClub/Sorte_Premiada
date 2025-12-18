import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GamesModule } from './games/games.module';
import { TicketsModule } from './tickets/tickets.module';
import { ReportsModule } from './reports/reports.module';
import { FinanceModule } from './finance/finance.module';
import { AreasModule } from './areas/areas.module';
import { DevicesModule } from './devices/devices.module';
import { DrawsModule } from './draws/draws.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.dev',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    GamesModule,
    TicketsModule,
    ReportsModule,
    ReportsModule,
    FinanceModule,
    AreasModule,
    DevicesModule,
    DrawsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
