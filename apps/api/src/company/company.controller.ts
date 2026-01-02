import { Controller, Get, Put, Post, Body, UseGuards, Query, Param } from '@nestjs/common';
import { CompanyService } from './company.service';
import type { UpdateCompanySettingsDto } from './company.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { User } from '../auth/user.decorator';

@Controller('company')
export class CompanyController {
    constructor(private readonly companyService: CompanyService) { }

    /**
     * POST /company
     * Master only - Create a new company
     */
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('MASTER')
    async create(@Body() data: any) { // Using any to bypass strict DTO check for now, or import CreateCompanyDto
        return this.companyService.createCompany(data);
    }

    /**
     * GET /company/all
     * Master only - List all companies
     */
    @Get('all')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('MASTER')
    async findAll() {
        return this.companyService.findAll();
    }

    /**
     * GET /company/settings
     * Public endpoint - returns company settings for branding
     * Optional ?slug=... to get specific company
     */
    @Get('settings')
    async getSettings(@Query('slug') slug?: string) {
        return this.companyService.getPublicSettings(slug);
    }

    /**
     * PUT /company/settings
     * Admin/Master updates company settings
     */
    @Put('settings')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, 'MASTER')
    async updateSettings(@Body() data: UpdateCompanySettingsDto, @User() user: any, @Query('targetCompanyId') targetCompanyId?: string) {
        // If MASTER and targetCompanyId provided, update that one.
        // If ADMIN, update own.

        let companyId = user.companyId;

        if (user.role === 'MASTER' && targetCompanyId) {
            companyId = targetCompanyId;
        } else if (!companyId) {
            // Fallback for Admin without company set (migration issue or default)
            const defaultCompany = await this.companyService.getCompany();
            companyId = defaultCompany.id;
        }

        return this.companyService.updateSettings(companyId, data);
    }
}
