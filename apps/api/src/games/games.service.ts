import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { AuditLogService } from '../audit/audit-log.service';

@Injectable()
export class GamesService {
    constructor(
        private prisma: PrismaService,
        private auditLog: AuditLogService
    ) { }

    async create(data: any) {
        const { extractionSeries, companyId, targetCompanyId, ...gameData } = data;

        // Prepare proper Prisma connection/creation syntax
        const createData: Prisma.GameCreateInput = {
            ...gameData,
            rules: gameData.rules || {},
            extractionSeries: (extractionSeries && Array.isArray(extractionSeries) && extractionSeries.length > 0)
                ? {
                    create: extractionSeries.map((series: any) => ({
                        time: series.time,
                        lastSeries: Number(series.lastSeries || 0),
                        areaId: series.areaId || null,
                        companyId: companyId || null // Inherit company if extraction series needs it? 
                        // Actually extraction series has companyId now too. 
                        // If we are creating nested, Prisma might not propagate it automatically unless mapped.
                        // Let's rely on parent game relation if possible, or explicit.
                        // Ideally: extractionSeries should link to company.
                    }))
                }
                : undefined
        };

        if (companyId) {
            createData.company = { connect: { id: companyId } };
            // Also need to push companyId to extractionSeries? 
            // In Prisma, nested creates don't automatically inherit foreign keys of the parent for *other* relations.
            // But ExtractionSeries has companyId.
            if (createData.extractionSeries?.create) {
                (createData.extractionSeries.create as any[]).forEach(s => s.company = { connect: { id: companyId } });
            }
        }

        return this.prisma.client.game.create({ data: createData });
    }

    async findAll(options?: { activeOnly?: boolean, companyId?: string, slug?: string }) {
        // ✅ CRÍTICO: companyId é OBRIGATÓRIO para isolamento de dados
        if (!options?.companyId && !options?.slug) {
            throw new Error('companyId ou slug é obrigatório para listar jogos');
        }

        const where: Prisma.GameWhereInput = {};
        if (options?.activeOnly) where.isActive = true;

        // ✅ SEMPRE filtrar por companyId ou slug
        if (options?.companyId) {
            where.companyId = options.companyId;
        } else if (options?.slug) {
            where.company = { slug: options.slug };
        }

        return this.prisma.client.game.findMany({
            where,
            include: { extractionSeries: true }
        });
    }

    async findOne(id: string) {
        return this.prisma.client.game.findUnique({
            where: { id },
            include: { extractionSeries: true }
        });
    }

    async update(id: string, data: any, adminId?: string) {
        const oldGame = await this.prisma.client.game.findUnique({
            where: { id },
            include: { extractionSeries: true }
        });
        // Separe extractionSeries data if present in data
        const { extractionSeries, ...gameData } = data;

        // Update the game basic info
        const updatedGame = await this.prisma.client.game.update({
            where: { id },
            data: gameData
        });

        // If updated extractionSeries are provided, upsert them
        if (extractionSeries && Array.isArray(extractionSeries)) {
            // Buscar o companyId do jogo para injetar nas séries
            const gameCompanyId = updatedGame.companyId;

            console.log('[GamesService] Updating extraction series:', extractionSeries);
            console.log('[GamesService] Game companyId:', gameCompanyId);

            for (const series of extractionSeries) {
                // Ensure we have time and lastSeries
                if (series.time && series.lastSeries !== undefined) {
                    console.log(`[GamesService] Upserting series: time=${series.time}, lastSeries=${series.lastSeries}`);

                    const result = await this.prisma.client.extractionSeries.upsert({
                        where: {
                            gameId_areaId_time: {
                                gameId: id,
                                areaId: series.areaId || null,
                                time: series.time
                            }
                        },
                        update: {
                            lastSeries: Number(series.lastSeries),
                            ...(gameCompanyId ? { companyId: gameCompanyId } : {})
                        },
                        create: {
                            gameId: id,
                            areaId: series.areaId || null,
                            time: series.time,
                            lastSeries: Number(series.lastSeries),
                            ...(gameCompanyId ? { companyId: gameCompanyId } : {})
                        }
                    });

                    console.log(`[GamesService] Upsert result:`, result);
                }
            }
        }

        if (adminId) {
            await this.auditLog.log({
                userId: adminId,
                action: 'UPDATE_GAME',
                entity: 'Game',
                entityId: id,
                oldValue: oldGame,
                newValue: updatedGame
            });
        }

        return updatedGame;
    }
}
