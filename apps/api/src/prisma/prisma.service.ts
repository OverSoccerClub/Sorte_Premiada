import { Injectable, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { PrismaClient } from '@repo/database';
import { TenantContextService } from '../common/tenant-context.service';
import { createTenantExtension } from './prisma-tenant.extension';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private extendedClient: any;

    constructor(
        @Inject(forwardRef(() => TenantContextService))
        private readonly tenantContext: TenantContextService,
    ) {
        super();
    }

    async onModuleInit() {
        await this.$connect();

        // Apply tenant extension for automatic company scoping
        this.extendedClient = this.$extends(createTenantExtension(this.tenantContext));

        console.log('[PrismaService] Tenant extension applied - multi-tenant scoping enabled');
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }

    /**
     * Get the extended client with tenant scoping
     * Use this for all database operations to ensure automatic company filtering
     */
    get client() {
        return this.extendedClient || this;
    }
}

