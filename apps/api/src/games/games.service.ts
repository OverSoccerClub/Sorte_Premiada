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
        return this.prisma.game.findMany();
    }

    async findOne(id: string) {
        return this.prisma.game.findUnique({ where: { id } });
    }
}
