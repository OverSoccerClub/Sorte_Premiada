import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CompanySettings } from '@prisma/client';
import type { UpdateCompanySettingsDto } from './company.dto';

@Injectable()
export class CompanyService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get company settings - creates default if doesn't exist (singleton pattern)
     */
    async getSettings(): Promise<CompanySettings> {
        // Try to find existing settings
        let settings = await this.prisma.companySettings.findFirst();

        // Create default settings if not exists
        if (!settings) {
            settings = await this.prisma.companySettings.create({
                data: {
                    companyName: 'Fezinha de Hoje',
                    slogan: 'Cambista Edition',
                    primaryColor: '#50C878',
                },
            });
        }

        return settings;
    }

    /**
     * Update company settings
     */
    async updateSettings(data: UpdateCompanySettingsDto): Promise<CompanySettings> {
        // Ensure settings exist first
        const currentSettings = await this.getSettings();

        // Update the settings
        return this.prisma.companySettings.update({
            where: { id: currentSettings.id },
            data: {
                ...data,
                updatedAt: new Date(),
            },
        });
    }

    /**
     * Get only public settings (for mobile/unauthenticated requests)
     */
    async getPublicSettings(): Promise<Partial<CompanySettings>> {
        const settings = await this.getSettings();

        return {
            companyName: settings.companyName,
            slogan: settings.slogan,
            logoUrl: settings.logoUrl,
            phone: settings.phone,
            whatsapp: settings.whatsapp,
            email: settings.email,
            primaryColor: settings.primaryColor,
            updateUrl: settings.updateUrl,
        };
    }
}
