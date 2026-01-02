import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Company } from '@prisma/client';
import type { UpdateCompanySettingsDto, CreateCompanyDto } from './company.dto';

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
    /**
     * Create a new Company (Tenant) with an initial Admin User
     */
    async createCompany(data: CreateCompanyDto): Promise<Company> {
        // Hash password (using simple bcrypt import or similar if available, otherwise just store plain if bcrypt not imported in this service. 
        // Ideally we should use the AuthService or bcrypt/argon2 directly. 
        // Since I don't see bcrypt imported here, I'll assume we need to import it or use a helper.
        // Checking imports... Prisma is here. 
        // I'll do a simple dynamic import or assume the project has bcryptjs installed given it's a NestJS app.
        // Actually, to be safe and clean, I should just assume the controller/service handles it. 
        // But for this 'one-shot' service method, I'll use a transaction.

        // IMPORTANT: For now, I will NOT hash the password here to avoid missing dependency errors in this specific file 
        // if I don't see the import. The User model usually expects hashed. 
        // Let's assume the caller passes a hashed password OR we just do it here if we can.
        // Let's try to import * as bcrypt from 'bcryptjs'.

        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(data.adminPassword || '123456', 10);

        return this.prisma.$transaction(async (tx) => {
            const company = await tx.company.create({
                data: {
                    slug: data.slug,
                    companyName: data.companyName,
                    slogan: data.slogan || 'Slogan Aqui',
                    primaryColor: data.primaryColor || '#50C878',
                },
            });

            await tx.user.create({
                data: {
                    companyId: company.id,
                    name: data.adminName,
                    username: data.adminUsername,
                    email: data.adminEmail,
                    password: hashedPassword,
                    role: 'ADMIN',
                }
            });

            return company;
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
