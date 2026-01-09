import { Prisma } from '@prisma/client';
import { TenantContextService } from '../common/tenant-context.service';

/**
 * Prisma Client Extension for Multi-Tenant Data Isolation
 * 
 * This extension automatically adds companyId filtering to all queries
 * based on the current tenant context.
 * 
 * Models with companyId field:
 * - User, Area, Game, Draw, Ticket, Transaction, DailyClose
 * - PosTerminal, NotificationLog, Announcement, AuditLog
 * - SecurityLog, ExtractionSeries, SecondChanceDraw
 * 
 * Models without companyId (global):
 * - Company, AreaConfig
 * 
 * Special handling:
 * - MASTER users: No automatic filtering (companyId = undefined in context)
 * - Explicit companyId in where clause: Merged with context companyId
 * - Create operations: Automatically inject companyId
 */

// Models that have companyId field
const TENANT_MODELS = [
    'user',
    'area',
    'game',
    'draw',
    'ticket',
    'transaction',
    'dailyClose',
    'posTerminal',
    'notificationLog',
    'announcement',
    'auditLog',
    'securityLog',
    'extractionSeries',
    'secondChanceDraw',
];

/**
 * Check if a model should be scoped by tenant
 */
function isTenantModel(model: string): boolean {
    return TENANT_MODELS.includes(model.toLowerCase());
}

/**
 * Create the Prisma Client Extension for tenant scoping
 */
export function createTenantExtension(tenantContext: TenantContextService) {
    return Prisma.defineExtension({
        name: 'tenantExtension',
        query: {
            $allModels: {
                // Scope findUnique queries
                async findUnique({ model, operation, args, query }) {
                    const companyId = tenantContext.getCompanyId();

                    if (companyId && isTenantModel(model)) {
                        args.where = {
                            ...args.where,
                            companyId,
                        };
                    }

                    return query(args);
                },

                // Scope findFirst queries
                async findFirst({ model, operation, args, query }) {
                    const companyId = tenantContext.getCompanyId();

                    if (companyId && isTenantModel(model)) {
                        args.where = {
                            ...args.where,
                            companyId,
                        };
                    }

                    return query(args);
                },

                // Scope findMany queries
                async findMany({ model, operation, args, query }) {
                    const companyId = tenantContext.getCompanyId();

                    if (companyId && isTenantModel(model)) {
                        args.where = {
                            ...args.where,
                            companyId,
                        };
                    }

                    return query(args);
                },

                // Inject companyId into create operations
                async create({ model, operation, args, query }) {
                    const companyId = tenantContext.getCompanyId();

                    if (companyId && isTenantModel(model)) {
                        // Only inject if not already provided and data is an object
                        if (args.data && typeof args.data === 'object' && !('companyId' in args.data)) {
                            args.data = {
                                ...args.data,
                                companyId,
                            } as any;
                        }
                    }

                    return query(args);
                },

                // Inject companyId into createMany operations
                async createMany({ model, operation, args, query }) {
                    const companyId = tenantContext.getCompanyId();

                    if (companyId && isTenantModel(model)) {
                        // Inject companyId into each record
                        if (Array.isArray(args.data)) {
                            args.data = args.data.map((record: any) => ({
                                ...record,
                                companyId: ('companyId' in record) ? record.companyId : companyId,
                            }));
                        } else if (args.data && typeof args.data === 'object') {
                            args.data = {
                                ...args.data,
                                companyId: ('companyId' in args.data) ? (args.data as any).companyId : companyId,
                            } as any;
                        }
                    }

                    return query(args);
                },

                // Scope update operations
                async update({ model, operation, args, query }) {
                    const companyId = tenantContext.getCompanyId();

                    if (companyId && isTenantModel(model)) {
                        args.where = {
                            ...args.where,
                            companyId,
                        };
                    }

                    return query(args);
                },

                // Scope updateMany operations
                async updateMany({ model, operation, args, query }) {
                    const companyId = tenantContext.getCompanyId();

                    if (companyId && isTenantModel(model)) {
                        args.where = {
                            ...args.where,
                            companyId,
                        };
                    }

                    return query(args);
                },

                // Scope delete operations
                async delete({ model, operation, args, query }) {
                    const companyId = tenantContext.getCompanyId();

                    if (companyId && isTenantModel(model)) {
                        args.where = {
                            ...args.where,
                            companyId,
                        };
                    }

                    return query(args);
                },

                // Scope deleteMany operations
                async deleteMany({ model, operation, args, query }) {
                    const companyId = tenantContext.getCompanyId();

                    if (companyId && isTenantModel(model)) {
                        args.where = {
                            ...args.where,
                            companyId,
                        };
                    }

                    return query(args);
                },

                // Scope count operations
                async count({ model, operation, args, query }) {
                    const companyId = tenantContext.getCompanyId();

                    if (companyId && isTenantModel(model)) {
                        args.where = {
                            ...args.where,
                            companyId,
                        };
                    }

                    return query(args);
                },

                // Scope aggregate operations
                async aggregate({ model, operation, args, query }) {
                    const companyId = tenantContext.getCompanyId();

                    if (companyId && isTenantModel(model)) {
                        args.where = {
                            ...args.where,
                            companyId,
                        };
                    }

                    return query(args);
                },

                // Scope groupBy operations
                async groupBy({ model, operation, args, query }) {
                    const companyId = tenantContext.getCompanyId();

                    if (companyId && isTenantModel(model)) {
                        args.where = {
                            ...args.where,
                            companyId,
                        };
                    }

                    return query(args);
                },
            },
        },
    });
}
