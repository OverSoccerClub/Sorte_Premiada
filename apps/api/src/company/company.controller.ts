import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service';
import type { UpdateCompanySettingsDto } from './company.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('company')
export class CompanyController {
    constructor(private readonly companyService: CompanyService) { }

    /**
     * GET /company/settings
     * Public endpoint - returns company settings for branding
     */
    @Get('settings')
    async getSettings() {
        return this.companyService.getPublicSettings();
    }

    /**
     * PUT /company/settings
     * Admin only - updates company settings
     */
    @Put('settings')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async updateSettings(@Body() data: UpdateCompanySettingsDto) {
        return this.companyService.updateSettings(data);
    }
}
