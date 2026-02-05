import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';

@Injectable()
export class AreasConfigService {
    constructor(
        private prisma: PrismaService,
        private auditLog: AuditLogService
    ) { }

    async findByArea(areaId: string) {
        return this.prisma.areaConfig.findMany({
            where: { areaId },
            include: { game: true }
        });
    }

    async findByGame(gameId: string) {
        return this.prisma.areaConfig.findMany({
            where: { gameId },
            include: {
                area: {
                    select: {
                        id: true,
                        name: true,
                        state: true,
                        city: true,
                        currentSeries: true
                    }
                }
            }
        });
    }

    async upsert(data: {
        areaId: string;
        gameId: string;
        commissionRate?: number;
        prizeMultiplier?: number;
        maxLiability?: number;
        extractionTimes?: string[];
    }, adminId?: string) {
        const { areaId, gameId, ...overrides } = data;

        const oldConfig = await this.prisma.areaConfig.findUnique({
            where: { areaId_gameId: { areaId, gameId } }
        });

        const updatedConfig = await this.prisma.areaConfig.upsert({
            where: {
                areaId_gameId: { areaId, gameId }
            },
            update: overrides,
            create: {
                areaId,
                gameId,
                ...overrides
            }
        });

        if (adminId) {
            await this.auditLog.log({
                userId: adminId,
                action: oldConfig ? 'UPDATE_AREA_CONFIG' : 'CREATE_AREA_CONFIG',
                entity: 'AreaConfig',
                entityId: `${areaId}:${gameId}`,
                oldValue: oldConfig,
                newValue: updatedConfig
            });
        }

        return updatedConfig;
    }

    async remove(areaId: string, gameId: string) {
        return this.prisma.areaConfig.delete({
            where: {
                areaId_gameId: { areaId, gameId }
            }
        });
    }
}
