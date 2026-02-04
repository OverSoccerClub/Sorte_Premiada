import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NeighborhoodsService {
    constructor(private prisma: PrismaService) { }

    async create(data: { name: string; areaId: string; companyId: string }) {
        // Validate Area
        const area = await this.prisma.client.area.findUnique({
            where: { id: data.areaId }
        });
        if (!area) throw new NotFoundException('Praça (Area) não encontrada.');

        // Check duplication in same area
        const exists = await this.prisma.client.neighborhood.findFirst({
            where: {
                areaId: data.areaId,
                name: { equals: data.name, mode: 'insensitive' }
            }
        });

        if (exists) throw new Error('Já existe um bairro com este nome nesta praça.');

        return this.prisma.client.neighborhood.create({
            data: {
                name: data.name,
                areaId: data.areaId,
                companyId: data.companyId,
            },
        });
    }

    async findAll(companyId: string, areaId?: string) {
        return this.prisma.client.neighborhood.findMany({
            where: {
                companyId,
                ...(areaId ? { areaId } : {})
            },
            include: {
                area: { select: { name: true, city: true } }
            },
            orderBy: { name: 'asc' }
        });
    }

    async findOne(id: string) {
        return this.prisma.client.neighborhood.findUnique({
            where: { id },
            include: { area: true }
        });
    }

    async update(id: string, data: { name?: string; areaId?: string }) {
        return this.prisma.client.neighborhood.update({
            where: { id },
            data,
        });
    }

    async remove(id: string) {
        return this.prisma.client.neighborhood.delete({
            where: { id },
        });
    }
}
