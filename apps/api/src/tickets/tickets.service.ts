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
            // Validate Sales Eligibility (Limit & Previous Box Status)
            await this.financeService.validateSalesEligibility(userId, Number(data.amount || 0));
        }

        console.log("DEBUG CREATE TICKET:", JSON.stringify(data, null, 2));

        const gameId = data.game?.connect?.id;
        if (!gameId) {
            throw new Error("Game ID is required to process rules");
        }

        // Fetch Game & Rules
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
        });

        if (!game) throw new Error("Game not found");
        const rules = (game.rules as any) || {};

        let drawDate: Date | undefined;

        // Determine Draw Date Logic (Shared)
        try {
            // If it's a specific game type like JB, maybe logic differs, but generally we need a declared Draw Date.
            // 2x500 and 2x1000 use extraction times.
            drawDate = await this.getNextDrawDate(gameId);
        } catch (e) {
            console.warn(`[TicketsService] Could not calculate next draw date: ${e} `);
        }

        // --- BUSINESS RULE 2: RESTRICTED MODE (Auto-Sequence) ---
        // If enabled, and user sent exactly 1 number (Milhar), fill the rest.
        // Applies primarily to "2x1000" or maybe "JB-MILHAR" if requested. 
        // User request mentions: "usuario escolhe a 1a milhar... o sistema escolhe as outras 3... padrao de sequencia terminologia 578"

        if (rules.restrictedMode && data.numbers && data.numbers.length === 1 && (data.gameType === '2x1000' || data.gameType.includes('MILHAR'))) {
            const firstNum = data.numbers[0];
            const suffix = firstNum % 1000; // Get last 3 digits (000-999)

            // Generate 3 other numbers with same suffix from 0000-9999
            // Logic: Find all matches, remove used, pick 3 random.
            const possible: number[] = [];
            for (let i = 0; i <= 9; i++) {
                const candidate = i * 1000 + suffix;
                if (candidate !== firstNum) {
                    possible.push(candidate);
                }
            }

            // Shuffle and take 3
            const others = possible.sort(() => 0.5 - Math.random()).slice(0, 3);
            data.numbers = [firstNum, ...others].sort((a, b) => a - b);

            console.log(`[TicketsService] restrictedMode applied.Seed: ${firstNum} -> Result: ${data.numbers.join(', ')} `);
        }

        // --- BUSINESS RULE 1: GLOBAL UNIQUENESS ---
        // If enabled, NO one else can have bought these numbers for this draw.
        // This is stricter than `validateNumbersAvailability` which usually checks availability for specific Raffle games.
        // This applies generally if checks are enabled.

        if (rules.globalCheck && drawDate && data.numbers && data.numbers.length > 0) {
            // Check if ANY of these numbers are already sold for this Game/Draw
            const soldSet = await this.getSoldNumbers(gameId, drawDate);
            const conflicts = data.numbers.filter((n: number) => soldSet.has(n));

            if (conflicts.length > 0) {
                throw new BadRequestException(`Números indisponíveis(Bloqueio Global): ${conflicts.join(', ')} `);
            }
        }

        // Continue with standard Type-specific logic...

        // 2x1000 Special Logic
        if (data.gameType === '2x1000') {
            // Enforce 4 numbers per ticket
            const NUMBERS_PER_TICKET = 4;
            const isAutoPick = !data.numbers || data.numbers.length === 0;

            if (isAutoPick) {
                // Should we respect globalCheck here? generateRandomAvailableNumbers DOES check availability.
                // But availability check inside it uses getSoldNumbers which is the same source.
                data.numbers = await this.generateRandomAvailableNumbers(gameId, NUMBERS_PER_TICKET, drawDate!);
            } else {
                if (data.numbers.length !== NUMBERS_PER_TICKET) {
                    throw new Error(`Ticket must have exactly ${NUMBERS_PER_TICKET} thousands.`);
                }
                // If globalCheck was NOT enabled, 2x1000 inherently checks availability anyway.
                // But avoiding double checking if we just did it above.
                if (!rules.globalCheck) {
                    await this.validateNumbersAvailability(gameId, data.numbers, drawDate!);
                }
            }
        }
        // Jogo do Bicho Logic
        else if (data.gameType.startsWith('JB-')) {
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
                    throw new BadRequestException(`Modalidade inválida: ${modality} `);
            }
        }
        // Fallback validation for other games (existing logic)
        else if (data.numbers && (data.numbers as number[]).length < 6) {
            // Basic validation, can be improved
        }

        // FIX: Ensure drawDate is calculated for ALL game types if not already set
        if (!drawDate) {
            // Redundant with top calc, but safe
            try {
                drawDate = await this.getNextDrawDate(gameId);
            } catch { }
        }

        try {
            const createData = {
                userId: data.user.connect.id,
                gameType: data.gameType,
                numbers: data.numbers,
                amount: data.amount,
                status: data.status || 'PENDING',
                drawDate: drawDate,
                hash: this.generateTicketCode(8),
                gameId: gameId,
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

    private generateTicketCode(length: number = 8): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        const bytes = new Uint8Array(length);
        // Basic random fallback if crypto not available (Node usually has global crypto or require)
        // Since we are in NestJS/Node:
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    private async getNextDrawDate(gameId: string): Promise<Date> {
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
            select: { extractionTimes: true }
        });

        const extractionTimes = game?.extractionTimes && game.extractionTimes.length > 0
            ? game.extractionTimes
            : ['12:00', '19:00']; // default fallback

        // Helper to parse time string "HH:MM"
        const parseTime = (timeStr: string, baseDate: Date) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            const date = new Date(baseDate);
            date.setHours(hours, minutes, 0, 0);
            return date;
        };

        const now = new Date();
        const CUTOFF_MINUTES = 10;

        // Sort times to ensure we check in order
        extractionTimes.sort();

        // Check for today's draws
        for (const timeStr of extractionTimes) {
            const drawDate = parseTime(timeStr, now);

            // Calculate cutoff time: Draw Time - 10 minutes
            // Example: Draw is 08:00. Cutoff is 07:50.
            // If now is 07:50:59, it is <= 07:50:00? No.
            // Requirement: "ate as 07:50hs da manha concorrem... as 8hs"
            // So if now is 07:50:59, it works? User said "apartir das 07:51hs todos passarão a concorrer para o sorteio das 11hs"
            // So strictly: NOW < 07:51:00.
            // 07:50:59 < 07:51:00 => True (Concorrem as 8hs)
            // 07:51:00 < 07:51:00 => False (Concorrem as 11hs)

            // DrawDate (08:00) - 10 minutes = 07:50.
            // We need the cutoff to be exactly at the minute start of the "next interval".
            // Actually, simply: Limit Time = DrawDate - 9 minutes (07:51)
            // Wait, logic: "ate as 07:50" means 07:50:59 is OK.
            // So Ticket Time <= 07:50:59.
            // Which is Ticket Time < 07:51:00.
            // 08:00 minus 9 minutes = 07:51.
            // So if Now < 07:51:00, use 08:00.

            const cutoffDate = new Date(drawDate.getTime() - (CUTOFF_MINUTES - 1) * 60000);

            if (now < cutoffDate) {
                return drawDate;
            }
        }

        // If no slot found today, return first slot of tomorrow
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return parseTime(extractionTimes[0], tomorrow);
    }

    private async validateNumbersAvailability(gameId: string, numbers: number[], drawDate: Date) {
        const soldNumbers = await this.getSoldNumbers(gameId, drawDate);
        const alreadySold = numbers.filter(n => soldNumbers.has(n));
        if (alreadySold.length > 0) {
            throw new Error(`Numbers already sold for draw ${drawDate.toLocaleString()}: ${alreadySold.join(', ')} `);
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
            throw new Error(`Not enough available numbers.Only ${available.length} left.`);
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
        const nextDraw = await this.getNextDrawDate(gameId);
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

    async validateTicket(ticketId: string) {
        // Sanitize input: remove spaces, dashes, etc.
        const originalId = ticketId;
        ticketId = ticketId.replace(/[^a-zA-Z0-9]/g, '');

        console.log(`[TicketsService] Validating ticketId: "${originalId}" -> Sanitized: "${ticketId}"`);

        const ticket = await this.prisma.ticket.findFirst({
            where: {
                OR: [
                    { id: ticketId },
                    { hash: ticketId } // Support lookup by hash if needed, though Barcode uses ID
                ]
            },
            include: {
                game: true,
                user: { select: { name: true, username: true } }
            }
        });

        if (!ticket) {
            console.warn(`[TicketsService] Ticket not found for ID / Hash: "${ticketId}"`);
            throw new BadRequestException("Bilhete não encontrado.");
        }

        // Check if draw has happened
        const now = new Date();
        const drawDate = ticket.drawDate ? new Date(ticket.drawDate) : new Date();
        const isPastDraw = now > drawDate;

        let status = 'PENDING';
        let message = 'Aguardando sorteio.';
        let prizeAmount = 0;

        if (!isPastDraw) {
            return {
                status: 'PENDING',
                message: `Sorteio agendado para ${drawDate.toLocaleString()} `,
                ticket
            };
        }

        // TODO: Here we would check the official results if available in the DB
        // For now, if we don't have results integration, we might just return the ticket status
        // If the ticket status is already updated by a background job (which seems to be missing or manual), return it.

        if (ticket.status === 'WON') {
            return {
                status: 'WON',
                message: 'Bilhete Premiado!',
                ticket
            };
        } else if (ticket.status === 'LOST') {
            return {
                status: 'LOST',
                message: 'Não foi dessa vez.',
                ticket
            };
        } else {
            // If status is PENDING but draw passed, it might be waiting for processed results
            return {
                status: 'PENDING_RESULT',
                message: 'Aguardando apuração do resultado.',
                ticket
            };
        }
    }
}
