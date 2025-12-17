import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@repo/database';
import { FinanceService } from '../finance/finance.service';

@Injectable()
export class TicketsService {
    constructor(
        private prisma: PrismaService,
        private financeService: FinanceService
    ) { }
    // Force rebuild 1


    async create(data: any) {
        // Check if day is closed
        const userId = data.user?.connect?.id;
        if (userId) {
            const isClosed = await this.financeService.isDayClosed(userId);
            if (isClosed) {
                throw new BadRequestException("O caixa do dia já foi fechado. Não é possível realizar novas vendas.");
            }
        }

        console.log("DEBUG CREATE TICKET:", JSON.stringify(data, null, 2));

        let drawDate: Date | undefined;

        // 2x500 Special Logic
        if (data.gameType === '2x500') {
            const gameId = data.game?.connect?.id;
            if (!gameId) {
                throw new Error("Game ID is required for 2x500 game type");
            }

            // Determine Draw Date
            drawDate = this.getNextDrawDate();

            // Enforce 4 numbers per ticket
            const NUMBERS_PER_TICKET = 4;

            // Auto-pick if numbers are empty or explicit flag (assuming empty means auto for now)
            const isAutoPick = !data.numbers || data.numbers.length === 0;

            if (isAutoPick) {
                data.numbers = await this.generateRandomAvailableNumbers(gameId, NUMBERS_PER_TICKET, drawDate);
            } else {
                // Manual selection validation
                if (data.numbers.length !== NUMBERS_PER_TICKET) {
                    throw new Error(`Ticket must have exactly ${NUMBERS_PER_TICKET} thousands.`);
                }
                await this.validateNumbersAvailability(gameId, data.numbers, drawDate);
            }
        }
        // Jogo do Bicho Logic
        else if (data.gameType.startsWith('JB-')) {
            const gameId = data.game?.connect?.id;
            if (!gameId) {
                // If gameId is not provided, try to find it? Or force it.
                // Depending on frontend implementation.
            }

            // Determine Draw Date (Same logic as 2x500 or standard daily draws?)
            // Assuming same schedule for now: 12:00 and 19:00
            drawDate = this.getNextDrawDate();

            const modality = data.gameType.split('-')[1]; // GRUPO, DEZENA, CENTENA, MILHAR

            if (!data.numbers || data.numbers.length === 0) {
                throw new BadRequestException("Nenhum número selecionado.");
            }

            const numbers = data.numbers as number[];

            switch (modality) {
                case 'GRUPO': // 1-25
                    numbers.forEach(n => {
                        if (n < 1 || n > 25) throw new BadRequestException(`Grupo inválido: ${n}. Deve ser entre 1 e 25.`);
                    });
                    break;
                case 'DEZENA': // 00-99
                    numbers.forEach(n => {
                        if (n < 0 || n > 99) throw new BadRequestException(`Dezena inválida: ${n}. Deve ser entre 00 e 99.`);
                    });
                    break;
                case 'CENTENA': // 000-999
                    numbers.forEach(n => {
                        if (n < 0 || n > 999) throw new BadRequestException(`Centena inválida: ${n}. Deve ser entre 000 e 999.`);
                    });
                    break;
                case 'MILHAR': // 0000-9999
                    numbers.forEach(n => {
                        if (n < 0 || n > 9999) throw new BadRequestException(`Milhar inválida: ${n}. Deve ser entre 0000 e 9999.`);
                    });
                    break;
                default:
                    throw new BadRequestException(`Modalidade inválida: ${modality}`);
            }

            // JB usually doesn't have "Sold Out" logic per number like 2x500 (Raffle).
            // It allows multiple winners. So NO validateNumbersAvailability check here.
        }
        // Fallback validation for other games (existing logic)
        else if (data.numbers && (data.numbers as number[]).length < 6) {
            // Basic validation, can be improved
        }

        try {
            const createData = {
                userId: data.user.connect.id,
                gameType: data.gameType,
                numbers: data.numbers,
                amount: data.amount,
                status: data.status || 'PENDING',
                drawDate: drawDate, // Save the scheduled draw date
                // gameId is optional now
                ...(data.game?.connect?.id ? { gameId: data.game.connect.id } : {}),
            };
            console.log("DEBUG PRISMA DATA:", JSON.stringify(createData, null, 2));

            return await this.prisma.ticket.create({
                data: createData
            });
        } catch (error) {
            console.error("Error creating ticket in Prisma:", error);
            if (error instanceof Error) {
                console.error("Error Message:", error.message);
                console.error("Error Stack:", error.stack);
            }
            throw error;
        }
    }

    private getNextDrawDate(): Date {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const day = now.getDate();

        // 12:00
        const morningDraw = new Date(year, month, day, 12, 0, 0);
        // 19:00
        const afternoonDraw = new Date(year, month, day, 19, 0, 0);

        if (now < morningDraw) {
            return morningDraw;
        } else if (now < afternoonDraw) {
            return afternoonDraw;
        } else {
            // Tomorrow 12:00
            const tomorrow = new Date(year, month, day + 1, 12, 0, 0);
            return tomorrow;
        }
    }

    private async validateNumbersAvailability(gameId: string, numbers: number[], drawDate: Date) {
        const soldNumbers = await this.getSoldNumbers(gameId, drawDate);
        const alreadySold = numbers.filter(n => soldNumbers.has(n));
        if (alreadySold.length > 0) {
            throw new Error(`Numbers already sold for draw ${drawDate.toLocaleString()}: ${alreadySold.join(', ')}`);
        }
    }

    private async generateRandomAvailableNumbers(gameId: string, quantity: number, drawDate: Date): Promise<number[]> {
        const soldNumbers = await this.getSoldNumbers(gameId, drawDate);
        const available: number[] = [];
        // Pool 0000 to 9999
        for (let i = 0; i < 10000; i++) {
            if (!soldNumbers.has(i)) {
                available.push(i);
            }
        }

        if (available.length < quantity) {
            throw new Error(`Not enough available numbers. Only ${available.length} left.`);
        }

        const selected: number[] = [];
        for (let i = 0; i < quantity; i++) {
            const randomIndex = Math.floor(Math.random() * available.length);
            selected.push(available[randomIndex]);
            // Remove selected to avoid duplicates in same ticket
            available.splice(randomIndex, 1);
        }
        return selected;
    }

    private async getSoldNumbers(gameId: string, drawDate: Date): Promise<Set<number>> {
        const tickets = await this.prisma.ticket.findMany({
            where: {
                gameId: gameId,
                status: { not: 'CANCELLED' },
                drawDate: drawDate // Scope by specific draw date
            },
            select: { numbers: true }
        });

        const sold = new Set<number>();
        tickets.forEach(t => {
            if (Array.isArray(t.numbers)) {
                (t.numbers as number[]).forEach(n => sold.add(n));
            }
        });
        return sold;
    }

    async getAvailability(gameId: string): Promise<number[]> {
        // Default availability: Next Draw?
        // Or we should pass drawDate?
        // Ideally we assume next draw logic implies "Current Selling Cycle".
        const nextDraw = this.getNextDrawDate();
        const soldSet = await this.getSoldNumbers(gameId, nextDraw);
        return Array.from(soldSet);
    }

    private async updateExpiredTickets() {
        // Update tickets that are PENDING and have a drawDate in the past
        await this.prisma.ticket.updateMany({
            where: {
                status: 'PENDING',
                drawDate: {
                    lt: new Date()
                }
            },
            data: {
                status: 'EXPIRED'
            }
        });
    }

    async findAll(filters?: { status?: string; startDate?: string; endDate?: string; gameType?: string; gameId?: string }) {
        await this.updateExpiredTickets();

        const where: Prisma.TicketWhereInput = {};
        if (filters) {
            if (filters.status) where.status = filters.status as any;
            if (filters.gameType) where.gameType = filters.gameType;
            if (filters.gameId) where.gameId = filters.gameId;
            if (filters.startDate || filters.endDate) {
                where.createdAt = {};
                if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
                if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
            }
        }
        return this.prisma.ticket.findMany({
            where,
            include: { user: true, game: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findByUser(userId: string, filters?: { status?: string; startDate?: string; endDate?: string; gameType?: string }) {
        await this.updateExpiredTickets();

        const where: Prisma.TicketWhereInput = { userId };

        if (filters) {
            if (filters.status) where.status = filters.status as any;
            if (filters.gameType) where.gameType = filters.gameType;
            if (filters.startDate || filters.endDate) {
                where.createdAt = {};
                if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
                if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
            }
        }

        return this.prisma.ticket.findMany({
            where,
            include: { game: true },
            orderBy: { createdAt: 'desc' }
        });
    }
}
