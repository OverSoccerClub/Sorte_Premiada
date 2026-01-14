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

        const { extractionSeries, ...gameData } = data;

        // ✅ Usar transação para garantir que todas as mudanças (jogo + horários) ocorram ou falhem juntas
        const result = await this.prisma.client.$transaction(async (tx) => {
            // 1. Atualizar dados básicos do jogo
            const updated = await tx.game.update({
                where: { id },
                data: gameData
            });

            // 2. Se houver novas séries de extração, sincronizá-las
            if (extractionSeries && Array.isArray(extractionSeries)) {
                const gameCompanyId = updated.companyId;
                const incomingTimes = extractionSeries.map(s => s.time);

                console.log(`[GamesService] Syncing extraction series for game ${id}. Times:`, incomingTimes);

                // A. Remover séries que não estão mais na lista (Limpeza de Órfãos)
                await tx.extractionSeries.deleteMany({
                    where: {
                        gameId: id,
                        time: { notIn: incomingTimes }
                    }
                });

                // B. Sincronizar cada série (Upsert manual para evitar problemas com campos nulos em chaves compostas)
                for (const series of extractionSeries) {
                    if (!series.time) continue;

                    const areaId = series.areaId || null;
                    const seriesValue = Number(series.lastSeries || 0);

                    // Verificar se já existe (combinação game + time + area)
                    const existing = await tx.extractionSeries.findFirst({
                        where: {
                            gameId: id,
                            time: series.time,
                            areaId: areaId
                        }
                    });

                    if (existing) {
                        // Update
                        await tx.extractionSeries.update({
                            where: { id: existing.id },
                            data: {
                                lastSeries: seriesValue,
                                ...(gameCompanyId ? { companyId: gameCompanyId } : {})
                            }
                        });
                    } else {
                        // Create
                        await tx.extractionSeries.create({
                            data: {
                                gameId: id,
                                time: series.time,
                                areaId: areaId,
                                lastSeries: seriesValue,
                                ...(gameCompanyId ? { companyId: gameCompanyId } : {})
                            }
                        });
                    }
                }
            }

            return updated;
        });

        if (adminId) {
            await this.auditLog.log({
                userId: adminId,
                action: 'UPDATE_GAME',
                entity: 'Game',
                entityId: id,
                oldValue: oldGame,
                newValue: result
            });
        }

        return result;
    }
}
