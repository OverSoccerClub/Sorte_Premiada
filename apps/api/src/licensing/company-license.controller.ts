import {
    Controller,
    Get,
    Post,
    UseGuards,
    HttpCode,
    HttpStatus,
    Body,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { User } from '../auth/user.decorator';
import { Role } from '@prisma/client';
import { LicenseService } from './license.service';
import { UsageService } from './usage.service';
import { BillingService } from './billing.service';

/**
 * Controller para empresas visualizarem sua própria licença (ADMIN)
 * Permite ver status, uso e histórico da própria empresa
 */
@Controller('company/license')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, 'MASTER')
export class CompanyLicenseController {
    constructor(
        private licenseService: LicenseService,
        private usageService: UsageService,
        private billingService: BillingService,
    ) { }

    /**
     * Ver status da própria licença
     * GET /company/license
     */
    @Get()
    async getOwnLicense(@User() user: any) {
        if (!user.companyId) {
            throw new Error('Usuário não está associado a nenhuma empresa');
        }

        const status = await this.licenseService.checkLicenseStatus(user.companyId);

        return status;
    }

    /**
     * Ver uso atual e limites
     * GET /company/license/usage
     */
    @Get('usage')
    async getOwnUsage(@User() user: any) {
        if (!user.companyId) {
            throw new Error('Usuário não está associado a nenhuma empresa');
        }

        const limits = await this.licenseService.checkUsageLimits(user.companyId);
        const stats = await this.usageService.getCurrentMonthStats(user.companyId);

        return {
            limits,
            currentMonth: stats,
        };
    }

    /**
     * Ver histórico de mudanças da licença
     * GET /company/license/history
     */
    @Get('history')
    async getOwnHistory(@User() user: any) {
        if (!user.companyId) {
            throw new Error('Usuário não está associado a nenhuma empresa');
        }

        const history = await this.licenseService.getLicenseHistory(user.companyId, 20);

        return {
            total: history.length,
            history,
        };
    }

    /**
     * Ver histórico de pagamentos
     * GET /company/license/payments
     */
    @Get('payments')
    async getOwnPayments(@User() user: any) {
        if (!user.companyId) {
            throw new Error('Usuário não está associado a nenhuma empresa');
        }

        const payments = await this.billingService.getPaymentHistory(user.companyId, 12);

        return {
            total: payments.length,
            payments,
        };
    }

    /**
     * Ver estatísticas mensais
     * GET /company/license/stats
     */
    @Get('stats')
    async getOwnStats(@User() user: any) {
        if (!user.companyId) {
            throw new Error('Usuário não está associado a nenhuma empresa');
        }

        const stats = await this.usageService.getMonthlyStats(user.companyId, 12);

        return {
            total: stats.length,
            stats,
        };
    }

    /**
     * Solicitar upgrade de plano (placeholder)
     * POST /company/license/upgrade
     * Body: { plan: string, message?: string }
     */
    @Post('upgrade')
    @HttpCode(HttpStatus.OK)
    async requestUpgrade(
        @User() user: any,
        @Body() body: { planId: string }
    ) {
        if (!user.companyId) {
            throw new Error('Usuário não está associado a nenhuma empresa');
        }

        if (!body.planId) {
            throw new Error('ID do plano é obrigatório');
        }

        return this.billingService.upgradePlan(user.companyId, body.planId);
    }
}
