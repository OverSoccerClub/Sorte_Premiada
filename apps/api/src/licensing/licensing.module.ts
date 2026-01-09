import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LicenseService } from './license.service';
import { BillingService } from './billing.service';
import { UsageService } from './usage.service';
import { LicenseGuard } from './license.guard';
import { UsageLimitGuard } from './usage-limit.guard';
import { LicenseController } from './license.controller';
import { BillingController } from './billing.controller';
import { CompanyLicenseController } from './company-license.controller';
import { CheckExpiredLicensesJob } from './check-expired-licenses.job';
import { SendExpirationAlertsJob } from './send-expiration-alerts.job';
import { GenerateMonthlyBillingJob } from './generate-monthly-billing.job';
import { PlansModule } from '../plans/plans.module';

/**
 * Módulo de Licenciamento
 * Agrupa todos os services, guards, controllers, cron jobs e decorators relacionados a licenças, billing e uso
 * 
 * Exports:
 * - Services: LicenseService, BillingService, UsageService
 * - Guards: LicenseGuard, UsageLimitGuard
 * - Decorators: @SkipLicenseCheck(), @CheckUsageLimit()
 * 
 * Controllers:
 * - LicenseController (MASTER): /license/*
 * - BillingController (MASTER): /billing/*
 * - CompanyLicenseController (ADMIN): /company/license/*
 * 
 * Cron Jobs:
 * - CheckExpiredLicensesJob: Verifica licenças expiradas (02:00 AM) e pagamentos atrasados (03:00 AM)
 * - SendExpirationAlertsJob: Envia alertas de vencimento (08:00 AM)
 * - GenerateMonthlyBillingJob: Gera cobranças (dia 1, 00:00 AM) e atualiza stats (último dia, 23:00 PM)
 */
@Module({
    imports: [PrismaModule, PlansModule],
    controllers: [
        LicenseController,
        BillingController,
        CompanyLicenseController,
    ],
    providers: [
        // Services
        LicenseService,
        BillingService,
        UsageService,
        // Guards
        LicenseGuard,
        UsageLimitGuard,
        // Cron Jobs
        CheckExpiredLicensesJob,
        SendExpirationAlertsJob,
        GenerateMonthlyBillingJob,
    ],
    exports: [
        LicenseService,
        BillingService,
        UsageService,
        LicenseGuard,
        UsageLimitGuard,
    ],
})
export class LicensingModule { }
