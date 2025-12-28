import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnnouncementsService {
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        return this.prisma.announcement.create({
            data,
        });
    }

    async findAll() {
        return this.prisma.announcement.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async findAllActive() {
        const now = new Date();
        return this.prisma.announcement.findMany({
            where: {
                isActive: true,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gte: now } },
                ],
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.announcement.findUnique({
            where: { id },
        });
    }

    async update(id: string, data: any) {
        return this.prisma.announcement.update({
            where: { id },
            data,
        });
    }

    async remove(id: string) {
        return this.prisma.announcement.delete({
            where: { id },
        });
    }
}
