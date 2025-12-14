import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAreaDto } from './dto/create-area.dto';

@Injectable()
export class AreasService {
    constructor(private prisma: PrismaService) { }

    async create(createAreaDto: CreateAreaDto) {
        return this.prisma.area.create({
            data: createAreaDto,
        });
    }

    async findAll() {
        return this.prisma.area.findMany({
            include: {
                _count: {
                    select: { users: true },
                },
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

    async remove(id: string) {
        // Optional: Check if area has users before deleting?
        return this.prisma.area.delete({
            where: { id },
        });
    }
}
