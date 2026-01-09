import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
    private readonly logger = new Logger(AuditLogService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Records an administrative action in the audit log.
     */
    async log(params: {
        userId: string;
        companyId?: string;
        action: string;
        entity: string;
        entityId?: string;
        oldValue?: any;
        newValue?: any;
        ipAddress?: string;
    }) {
        try {
            return await this.prisma.auditLog.create({
                data: {
                    userId: params.userId,
                    companyId: params.companyId,
                    action: params.action,
                    entity: params.entity,
                    entityId: params.entityId,
                    oldValue: params.oldValue,
                    newValue: params.newValue,
                    ipAddress: params.ipAddress
                }
            });
        } catch (error) {
            this.logger.error(`Failed to record audit log: ${params.action}`, error.stack);
            // We don't throw here to avoid breaking the main operation if logging fails
        }
    }

    async findAll(query?: { entity?: string; userId?: string; companyId?: string }) {
        return this.prisma.auditLog.findMany({
            where: {
                entity: query?.entity,
                userId: query?.userId,
                companyId: query?.companyId
            },
            include: {
                user: {
                    select: {
                        name: true,
                        username: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 200
        });
    }

    async findByEntity(entity: string, entityId: string) {
        return this.prisma.auditLog.findMany({
            where: { entity, entityId },
            include: {
                user: {
                    select: { name: true, username: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
}
