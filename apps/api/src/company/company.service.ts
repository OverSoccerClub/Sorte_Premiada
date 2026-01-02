import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Company } from '@prisma/client';
import type { UpdateCompanySettingsDto } from './company.dto';

export interface CreateCompanyDto {
    slug: string;
    companyName: string;
    slogan?: string;
    primaryColor?: string;
}

@Injectable()
export class CompanyService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get company by ID or Slug, or default (first found) if nothing specified
     */
    async getCompany(identifier?: { id?: string, slug?: string }): Promise<Company> {
        if (identifier?.id) {
            const company = await this.prisma.company.findUnique({ where: { id: identifier.id } });
            if (!company) throw new NotFoundException('Company not found');
            return company;
        }

        if (identifier?.slug) {
            const company = await this.prisma.company.findUnique({ where: { slug: identifier.slug } });
            if (!company) throw new NotFoundException('Company not found');
            return company;
        }

        // Fallback: Get the first company (Default behavior for migration/single-tenant legacy)
        let company = await this.prisma.company.findFirst();

        // Create default settings if not exists (Bootstrap)
        if (!company) {
            company = await this.prisma.company.create({
                data: {
                    slug: 'default',
                    companyName: 'A Perseverança',
                    slogan: 'Cambista Edition',
                    primaryColor: '#50C878',
                },
            });
        }

        return company;
    }

    /**
     * Create a new Company (Tenant)
     */
    async createCompany(data: CreateCompanyDto): Promise<Company> {
        return this.prisma.company.create({
            data: {
                ...data,
                // defaults
                slogan: data.slogan || 'Slogan Aqui',
                primaryColor: data.primaryColor || '#50C878',
            },
        });
    }

    /**
     * List all companies (For Master Admin)
     */
    async findAll(): Promise<Company[]> {
        return this.prisma.company.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Update company settings
     */
    async updateSettings(id: string, data: UpdateCompanySettingsDto): Promise<Company> {
        return this.prisma.company.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date(),
            },
        });
    }

    /**
     * Create default company if none exists (Internal use)
     */
    async ensureDefaultCompany(): Promise<Company> {
        return this.getCompany();
    }

    /**
     * Get public settings by slug (for App/Web initialization)
     */
    async getPublicSettings(slug?: string): Promise<Partial<Company>> {
        const company = await this.getCompany({ slug });

        return {
            id: company.id, // Needed for context
            slug: company.slug,
            companyName: company.companyName,
            slogan: company.slogan,
            logoUrl: company.logoUrl,
            phone: company.phone,
            whatsapp: company.whatsapp,
            email: company.email,
            primaryColor: company.primaryColor,
            updateUrl: company.updateUrl,
        };
    }
}
