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
        return this.prisma.area.update({
            where: { id },
            data: updateAreaDto,
        });
    }

    async remove(id: string) {
        // Optional: Check if area has users before deleting?
        return this.prisma.area.delete({
            where: { id },
        });
    }
}
