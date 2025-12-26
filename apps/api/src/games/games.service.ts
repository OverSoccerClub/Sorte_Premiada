import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@repo/database';

@Injectable()
export class GamesService {
    constructor(private prisma: PrismaService) { }

    async create(data: Prisma.GameCreateInput) {
        return this.prisma.game.create({ data });
    }

    async findAll() {
        return this.prisma.game.findMany({
            include: { extractionSeries: true }
        });
    }

    async findOne(id: string) {
        return this.prisma.game.findUnique({
            where: { id },
            include: { extractionSeries: true }
        });
    }

    async update(id: string, data: any) {
        // Separe extractionSeries data if present in data
        const { extractionSeries, ...gameData } = data;

        // Update the game basic info
        const updatedGame = await this.prisma.game.update({
            where: { id },
            data: gameData
        });

        // If updated extractionSeries are provided, upsert them
        if (extractionSeries && Array.isArray(extractionSeries)) {
            for (const series of extractionSeries) {
                // Ensure we have time and lastSeries
                if (series.time && series.lastSeries !== undefined) {
                    await this.prisma.extractionSeries.upsert({
                        where: {
                            gameId_time: {
                                gameId: id,
                                time: series.time
                            }
                        },
                        update: {
                            lastSeries: Number(series.lastSeries)
                        },
                        create: {
                            gameId: id,
                            time: series.time,
                            lastSeries: Number(series.lastSeries)
                        }
                    });
                }
            }
        }

        return updatedGame;
    }
}
