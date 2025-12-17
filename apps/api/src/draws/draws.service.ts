
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@repo/database';

@Injectable()
export class DrawsService {
    constructor(private prisma: PrismaService) { }

    async create(data: Prisma.DrawCreateInput) {
        return this.prisma.draw.create({ data });
    }

    async findAll() {
        return this.prisma.draw.findMany({
            include: { game: true },
            orderBy: { drawDate: 'desc' }
        });
    }

    async findByGame(gameId: string) {
        return this.prisma.draw.findMany({
            where: { gameId },
            orderBy: { drawDate: 'desc' }
        });
    }

    async findOne(id: string) {
        return this.prisma.draw.findUnique({ where: { id } });
    }

    async update(id: string, data: Prisma.DrawUpdateInput) {
        return this.prisma.draw.update({
            where: { id },
            data,
        });
    }

    async remove(id: string) {
        return this.prisma.draw.delete({ where: { id } });
    }
}
