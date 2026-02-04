import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
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
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from './notifications/notifications.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { SecurityModule } from './security/security.module';
import { AuditModule } from './audit/audit.module';
import { RedisModule } from './redis/redis.module';
import { SecondChanceModule } from './second-chance/second-chance.module';
import { CompanyModule } from './company/company.module';
import { CommonModule } from './common/common.module';
import { TenantInterceptor } from './common/tenant.interceptor';
import { LicensingModule } from './licensing/licensing.module';
import { PlansModule } from './plans/plans.module';
import { PaymentsModule } from './payments/payments.module';
import { PublicSiteModule } from './public-site/public-site.module';


import { BugsModule } from './bugs/bugs.module';
import { NeighborhoodsModule } from './neighborhoods/neighborhoods.module';
import { APP_GUARD } from '@nestjs/core';
import { LicenseGuard } from './licensing/license.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.dev',
    }),
    CommonModule, // Multi-tenant infrastructure
    PrismaModule,
    AuthModule,
    UsersModule,
    CompanyModule,
    PlansModule, // Novo modulo de planos
    PaymentsModule, // Sistema de pagamentos
    LicensingModule, // Sistema de licenciamento
    GamesModule,
    TicketsModule,
    ReportsModule,
    FinanceModule,
    AreasModule,
    DevicesModule,
    DrawsModule,
    ScheduleModule.forRoot(),
    NotificationsModule,
    AnnouncementsModule,
    SecurityModule,
    AuditModule,
    RedisModule,
    SecondChanceModule,
    CompanyModule,
    LicensingModule, // Sistema de licenciamento
    BugsModule, // Sistema de rastreamento de bugs
    PublicSiteModule, // Endpoints públicos para o site de marketing
    NeighborhoodsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global interceptor for automatic tenant scoping
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
    // Global guard for license verification
    {
      provide: APP_GUARD,
      useClass: LicenseGuard,
    },
  ],
})
export class AppModule { }

