import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';

@Injectable()
export class AreasService {
    constructor(private prisma: PrismaService) { }

    async create(createAreaDto: CreateAreaDto, companyId?: string) {
        return this.prisma.area.create({
            data: {
                ...createAreaDto,
                currentSeries: createAreaDto.seriesNumber, // Inicializar série atual
                ...(companyId ? { companyId } : {})
            },
        });
    }

    async findAll(companyId?: string) {
        // ✅ Filtrar por companyId se fornecido (para isolamento de dados)
        // Se companyId não for fornecido, retorna todas as áreas (para ADMIN/MASTER sem empresa)
        const where = companyId ? { companyId } : {};

        return this.prisma.area.findMany({
            where,
            include: {
                _count: {
                    select: { users: true },
                },
                company: true,
            },
        });
    }

    async findOne(id: string) {
        return this.prisma.area.findUnique({
            where: { id },
            include: {
                users: true,
            },
        });
    }

    async update(id: string, updateAreaDto: UpdateAreaDto) {
        const data: any = { ...updateAreaDto };

        // If seriesNumber is updated, Sync currentSeries and reset counter
        // This allows the admin to "Force" a series change/reset
        if (updateAreaDto.seriesNumber) {
            data.currentSeries = updateAreaDto.seriesNumber;
            // Optionally reset tickets count for the new series, assuming it's a fresh start
            // If we want to keep the count, we wouldn't satisfy the "Jump to 0002" requirement properly without issues.
            // Let's assume a series change implies a fresh start for that series.
            data.ticketsInSeries = 0;
        }

        return this.prisma.area.update({
            where: { id },
            data,
        });
    }

    async remove(id: string) {
        // Optional: Check if area has users before deleting?
        return this.prisma.area.delete({
            where: { id },
        });
    }

    async cycleSeries(areaId: string) {
        const area = await this.prisma.area.findUnique({ where: { id: areaId } });
        if (!area) throw new Error("Praça não encontrada");

        const currentSeriesNum = parseInt(area.currentSeries);
        const newSeries = (currentSeriesNum + 1).toString().padStart(4, '0');

        return this.prisma.area.update({
            where: { id: areaId },
            data: {
                currentSeries: newSeries,
                ticketsInSeries: 0
            }
        });
    }
}
