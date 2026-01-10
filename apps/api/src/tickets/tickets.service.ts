import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinanceService } from '../finance/finance.service';
import { SecurityService } from '../security/security.service';
import { RedisService } from '../redis/redis.service';
import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import { getBrazilTime } from '../utils/date.util';
import * as crypto from 'crypto';

@Injectable()
export class TicketsService {
    constructor(
        private prisma: PrismaService,
        private financeService: FinanceService,
        private securityService: SecurityService,
        private redis: RedisService
    ) { }
    // Force rebuild 1


    async create(data: any) {
        // Check if day is closed
        const userId = data.user?.connect?.id;
        if (!userId) throw new BadRequestException("User ID required");

        // Validate Sales Eligibility (Limit & Previous Box Status)
        await this.financeService.validateSalesEligibility(userId, Number(data.amount || 0));

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

        // Fetch User with Area for Commission Rate AND Series Number
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                commissionRate: true,
                areaId: true,
                area: {
                    select: {
                        seriesNumber: true,
                        name: true
                    }
                }
            }
        });

        // Get Series Number from User's Area
        let seriesNumber: number | null = null;
        if (user?.area?.seriesNumber) {
            seriesNumber = user.area.seriesNumber;
            console.log(`[TicketsService] Using series ${seriesNumber} from user's area: ${user.area.name}`);
        }

        // Fetch Area Override
        const areaConfig = (user?.areaId && gameId) ? await this.prisma.areaConfig.findUnique({
            where: { areaId_gameId: { areaId: user.areaId, gameId } }
        }) : null;

        // Priority Logic: Individual > Area > Global
        const commissionRate = Number(
            user?.commissionRate ??
            areaConfig?.commissionRate ??
            game?.commissionRate ??
            10
        );

        const multiplier = Number(
            areaConfig?.prizeMultiplier ??
            game?.prizeMultiplier ??
            1000
        );

        const maxLiability = Number(
            areaConfig?.maxLiability ??
            game?.maxLiability ??
            5000
        );

        // Calc Financials
        const amount = Number(data.amount || 0);
        const commissionValue = amount * (commissionRate / 100);
        const netValue = amount - commissionValue; // What the cambista owes

        // Prize Calc (Estimated per winning number)
        const numberCount = data.numbers ? data.numbers.length : 1;
        const betPerNumber = numberCount > 0 ? amount / numberCount : 0;

        const possiblePrize = betPerNumber * multiplier;

        let drawDate: Date | undefined;

        // Determine Draw Date Logic (Shared)
        try {
            drawDate = await this.getNextDrawDate(gameId);
        } catch (e) {
            console.warn(`[TicketsService] Could not calculate next draw date: ${e} `);
        }

        // --- BUSINESS RULE 2: RESTRICTED MODE (Auto-Sequence) ---
        if (rules.restrictedMode && data.numbers && data.numbers.length === 1 && (data.gameType === '2x1000' || data.gameType === '2x500' || data.gameType.includes('MILHAR'))) {
            const firstNum = data.numbers[0];
            const excludedCentenas = new Set<number>();
            excludedCentenas.add(firstNum % 1000);

            const others: number[] = [];

            // We need 3 more numbers
            // Constraint: "Totalmente diferentes" and "com terminação diferente"
            // We ensure all 4 numbers have UNIQUE centenas (last 3 digits).
            while (others.length < 3) {
                const candidate = Math.floor(Math.random() * 10000);
                const candidateCentena = candidate % 1000;

                // Must not be the same number, and must not share a used centenary
                if (candidate !== firstNum && !excludedCentenas.has(candidateCentena)) {
                    // One extra check: ensure the number itself isn't already in 'others' (though excludedCentenas handles most collisions)
                    if (!others.includes(candidate)) {
                        others.push(candidate);
                        excludedCentenas.add(candidateCentena);
                    }
                }
            }

            data.numbers = [firstNum, ...others].sort((a, b) => a - b);
        }

        // --- BUSINESS RULE: MAX LIABILITY CHECK (Risk Management) ---
        if (drawDate && data.numbers && data.numbers.length > 0) {
            // We must ensure that for EACH number picked, the total potential payout (including this new bet) does not exceed maxLiability.
            // currentLiability = Sum of (betPerNumber * multiplier) for all tickets having this number in this draw.

            // Optimization: Check only the new numbers.
            // Note: This can be slow if we have many tickets. 
            // Better approach: maintain a separate liability table. But for now, we query.

            const currentBetPerNum = (Number(data.amount) / data.numbers.length);
            const currentPotentialWin = currentBetPerNum * multiplier;

            // We can check aggregate purely on DB?
            // "Give me sum of amount/count where numbers has X" - hard in Prisma/SQL standard without normalization.
            // Fallback: Just Fetch all winning tickets for these numbers? No, too many.
            // Approximation: 
            // Let's rely on `Ticket` records. We can't sum `possiblePrize` efficiently because it's per ticket not per number.
            // But `possiblePrize` stored on ticket IS "Prize per winning number" (as we defined above).
            // So for a number X, finding all tickets that have X, we sum their `possiblePrize`.

            for (const num of data.numbers) {
                // Find tickets with this number for this draw
                const relevantTickets = await this.prisma.ticket.findMany({
                    where: {
                        gameId: gameId,
                        drawDate: drawDate,
                        numbers: { has: Number(num) },
                        status: { not: 'CANCELLED' }
                    },
                    select: { possiblePrize: true }
                });

                const existingLiability = relevantTickets.reduce((sum, t) => sum + Number(t.possiblePrize || 0), 0);

                if (existingLiability + currentPotentialWin > maxLiability) {
                    throw new BadRequestException(`Limite de risco excedido para a milhar ${num}. Banca cheia. Tente outro número.`);
                }
            }
        }

        // --- BUSINESS RULE 1: GLOBAL UNIQUENESS ---
        if (rules.globalCheck && drawDate && data.numbers && data.numbers.length > 0) {
            const soldSet = await this.getSoldNumbers(gameId, drawDate);
            const conflicts = data.numbers.filter((n: number) => soldSet.has(n));

            if (conflicts.length > 0) {
                throw new BadRequestException(`Números indisponíveis(Bloqueio Global): ${conflicts.join(', ')} `);
            }
        }

        // 2x1000 Special Logic
        if (data.gameType === '2x1000') {
            const NUMBERS_PER_TICKET = 4;
            const isAutoPick = !data.numbers || data.numbers.length === 0;

            if (isAutoPick) {
                data.numbers = await this.generateRandomAvailableNumbers(gameId, NUMBERS_PER_TICKET, drawDate!);
            } else {
                if (data.numbers.length !== NUMBERS_PER_TICKET) {
                    throw new Error(`Ticket must have exactly ${NUMBERS_PER_TICKET} thousands.`);
                }
                if (!rules.globalCheck) {
                    await this.validateNumbersAvailability(gameId, data.numbers, drawDate!);
                }
            }

            // Get ticket numbering configuration from game
            const maxTickets = game.maxTicketsPerSeries || 2500;
            const numberingMode = game.ticketNumberingMode || 'RANDOM';

            // Generate ticket number based on configuration
            const ticketNumber = await this.generateTicketNumber(gameId, drawDate!, maxTickets, numberingMode);
            // Store it temporarily to add to createData later
            (data as any)._ticketNumber = ticketNumber;
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

        if (!drawDate) {
            try { drawDate = await this.getNextDrawDate(gameId); } catch { }
        }

        try {
            const createData: any = {
                userId: userId,
                gameType: data.gameType,
                numbers: data.numbers,
                amount: data.amount,
                status: data.status || 'PENDING',
                drawDate: drawDate,
                hash: this.generateTicketCode(8),
                gameId: gameId,
                companyId: data.company?.connect?.id,
                // New Financials
                commissionRate: commissionRate,
                commissionValue: commissionValue,
                netValue: netValue,
                possiblePrize: possiblePrize,
                // Ticket Number (for 2x1000)
                ...((data as any)._ticketNumber ? { ticketNumber: (data as any)._ticketNumber } : {}),
                // Series from Area
                ...(seriesNumber !== null ? { series: seriesNumber } : {})
            };

            // Second Chance ...
            if (game.secondChanceEnabled &&
                game.secondChanceRangeStart !== null && game.secondChanceRangeStart !== undefined &&
                game.secondChanceRangeEnd !== null && game.secondChanceRangeEnd !== undefined) {
                try {
                    const scDrawDate = this.getNextSecondChanceDate(
                        game.secondChanceWeekday ?? 6,
                        game.secondChanceDrawTime || '19:00'
                    );
                    const scNumber = await this.generateUniqueSecondChanceNumber(
                        gameId,
                        scDrawDate,
                        game.secondChanceRangeStart,
                        game.secondChanceRangeEnd
                    );
                    createData['secondChanceDrawDate'] = scDrawDate;
                    createData['secondChanceNumber'] = scNumber;
                } catch (e) {
                    throw new BadRequestException("Erro ao gerar segunda chance.");
                }
            }

            console.log("DEBUG PRISMA DATA (With Financials):", JSON.stringify(createData, null, 2));

            // Anti-Fraud: Late Bet Check
            if (createData.drawDate) {
                const now = new Date();
                const lateCheck = await this.securityService.checkLateBet(
                    createData.hash, // Use the short hash as ref
                    createData.drawDate,
                    now
                );

                if (lateCheck.isSuspicious && lateCheck.severity === 'CRITICAL') {
                    throw new BadRequestException("Sorteio já iniciado. Aposta não permitida.");
                }
            }

            // Anti-Fraud: Digital Signature
            const ticketId = crypto.randomUUID();
            createData.id = ticketId;
            createData.digitalSignature = this.securityService.generateTicketSignature({
                id: ticketId,
                numbers: createData.numbers,
                amount: createData.amount,
                userId: createData.userId,
                drawDate: createData.drawDate
            });

            const ticket = await this.prisma.ticket.create({
                data: createData
            });

            // Invalidate Redis Caches for this game and draw date
            try {
                const cacheKey = `sold_numbers:${ticket.gameId}:${ticket.drawDate?.toISOString()}`;
                const liabilityKey = `liability:${ticket.gameId}:${ticket.drawDate?.toISOString()}`;
                await this.redis.del(cacheKey);
                await this.redis.del(liabilityKey);
            } catch (e) {
                console.error("Redis invalidation failed", e);
            }

            return ticket;
        } catch (error) {
            console.error("Error creating ticket:", error);
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

        // Helper: Create Brazil-based date from "HH:MM", handling day boundaries
        const createBrazilDrawDate = (timeStr: string, baseBrazilDate: dayjs.Dayjs) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            // Set hour/minute on the Brazil-zoned object
            return baseBrazilDate.hour(hours).minute(minutes).second(0).millisecond(0);
        };

        const nowBrazil = getBrazilTime();
        const CUTOFF_MINUTES = 10;

        // Sort times
        extractionTimes.sort();

        // Check slots for today (Brazil Time)
        for (const timeStr of extractionTimes) {
            const drawDateBrazil = createBrazilDrawDate(timeStr, nowBrazil);
            const drawDateNative = drawDateBrazil.toDate(); // Get standard JS Date (UTC) for storage/comparison

            // Cutoff logic: Draw Time - 10 minutes
            // If now is 9:55 and Draw is 10:00 -> Diff is 5 mins -> OK
            // If now is 9:51 and Draw is 10:00 -> Diff is 9 mins -> OK (Wait, cutoff is "closings stops at X mins before")
            // Convention: "Stop selling 10 mins before". So if now > draw - 10mins, valid = false.
            // Or: if now < draw - 10mins, return it.

            // Replicating original logic: cutoffDate = draw - 9 mins
            // if now < cutoffDate -> return draw.
            const cutoffBrazil = drawDateBrazil.subtract(CUTOFF_MINUTES - 1, 'minute');

            if (nowBrazil.isBefore(cutoffBrazil)) {
                return drawDateNative;
            }
        }

        // If no slot found today, return first slot of tomorrow
        const tomorrowBrazil = nowBrazil.add(1, 'day');
        return createBrazilDrawDate(extractionTimes[0], tomorrowBrazil).toDate();
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

    private async generateTicketNumber(
        gameId: string,
        drawDate: Date,
        maxTickets: number,
        mode: string = 'RANDOM'
    ): Promise<number> {
        // Fetch already used ticket numbers for this series (game + drawDate)
        const usedTickets = await this.prisma.ticket.findMany({
            where: {
                gameId: gameId,
                drawDate: drawDate,
                status: { not: 'CANCELLED' },
                ticketNumber: { not: null }
            },
            select: { ticketNumber: true },
            orderBy: { ticketNumber: 'desc' }
        });

        const usedSet = new Set(usedTickets.map((t: any) => t.ticketNumber!));

        // Check if series is full
        if (usedSet.size >= maxTickets) {
            throw new BadRequestException(`Todos os ${maxTickets} bilhetes desta série já foram vendidos.`);
        }

        // SEQUENTIAL MODE: Get next number in sequence
        if (mode === 'SEQUENTIAL') {
            // Find the highest number used
            const highestNumber = usedTickets.length > 0 ? usedTickets[0].ticketNumber : 0;

            // Return next sequential number
            const nextNumber = (highestNumber || 0) + 1;

            if (nextNumber > maxTickets) {
                throw new BadRequestException('Limite de bilhetes atingido.');
            }

            return nextNumber;
        }

        // RANDOM MODE: Generate random available number (up to 100 attempts)
        const MAX_ATTEMPTS = 100;
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            const randomNumber = Math.floor(Math.random() * maxTickets) + 1; // 1 to maxTickets

            if (!usedSet.has(randomNumber)) {
                return randomNumber;
            }
        }

        // Fallback: Find first available number (rare case when series is almost full)
        for (let i = 1; i <= maxTickets; i++) {
            if (!usedSet.has(i)) {
                return i;
            }
        }

        throw new BadRequestException('Não foi possível gerar número de bilhete.');
    }


    private async getSoldNumbers(gameId: string, drawDate: Date): Promise<Set<number>> {
        const cacheKey = `sold_numbers:${gameId}:${drawDate.toISOString()}`;
        let cached: string | null = null;

        try {
            cached = await this.redis.get(cacheKey);
        } catch (error) {
            console.warn(`[TicketsService] Redis get failed for ${cacheKey}. Falling back to DB.`, error);
        }

        if (cached) {
            return new Set(JSON.parse(cached));
        }

        const tickets = await this.prisma.ticket.findMany({
            where: {
                gameId: gameId,
                status: { not: 'CANCELLED' },
                drawDate: drawDate
            },
            select: { numbers: true }
        });

        const soldArr: number[] = [];
        tickets.forEach(t => {
            if (Array.isArray(t.numbers)) {
                (t.numbers as number[]).forEach(n => soldArr.push(n));
            }
        });

        // Cache for 60 seconds (short-lived but effective for bursts)
        try {
            await this.redis.set(cacheKey, JSON.stringify(soldArr), 60);
        } catch (error) {
            console.warn(`[TicketsService] Redis set failed for ${cacheKey}`, error);
        }

        return new Set(soldArr);
    }

    async getAvailability(gameId: string): Promise<number[]> {
        // Default availability: Next Draw?
        // Or we should pass drawDate?
        // Ideally we assume next draw logic implies "Current Selling Cycle".
        const nextDraw = await this.getNextDrawDate(gameId);
        const soldSet = await this.getSoldNumbers(gameId, nextDraw);
        return Array.from(soldSet);
    }

    async getSeriesStats(gameId: string, companyId: string, drawDate?: Date) {
        // Fetch game with configuration
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
            select: {
                name: true,
                maxTicketsPerSeries: true
            }
        });

        if (!game) throw new BadRequestException('Jogo não encontrado');

        const MAX_TICKETS_PER_SERIES = game.maxTicketsPerSeries || 2500;

        // Fetch draws for this game
        const drawsQuery: any = {
            gameId: gameId,
            companyId: companyId
        };

        if (drawDate) {
            drawsQuery.drawDate = drawDate;
        }

        const draws = await this.prisma.draw.findMany({
            where: drawsQuery,
            orderBy: { drawDate: 'asc' }
        });

        // For each draw, count tickets sold
        const seriesStats = await Promise.all(
            draws.map(async (draw: any) => {
                const ticketCount = await this.prisma.ticket.count({
                    where: {
                        gameId: gameId,
                        drawDate: draw.drawDate,
                        status: { not: 'CANCELLED' },
                        ticketNumber: { not: null }
                    }
                });

                const ticketsRemaining = MAX_TICKETS_PER_SERIES - ticketCount;
                const percentageFilled = (ticketCount / MAX_TICKETS_PER_SERIES) * 100;

                let status = 'ACTIVE';
                if (ticketCount >= MAX_TICKETS_PER_SERIES) status = 'FULL';
                else if (new Date() > new Date(draw.drawDate)) status = 'CLOSED';

                return {
                    seriesNumber: draw.series,
                    drawDate: draw.drawDate,
                    ticketsSold: ticketCount,
                    ticketsRemaining: ticketsRemaining,
                    percentageFilled: Math.round(percentageFilled * 10) / 10, // 1 decimal
                    status: status
                };
            })
        );

        return {
            gameId: gameId,
            gameName: game.name,
            maxTicketsPerSeries: MAX_TICKETS_PER_SERIES,
            series: seriesStats
        };
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

    async findAll(filters?: { status?: string; startDate?: string; endDate?: string; gameType?: string; gameId?: string; companyId?: string }) {
        await this.updateExpiredTickets();

        // ✅ CRÍTICO: companyId é OBRIGATÓRIO para isolamento de dados
        if (!filters?.companyId) {
            throw new Error('companyId é obrigatório para listar tickets');
        }

        const where: Prisma.TicketWhereInput = {};
        if (filters) {
            if (filters.status) where.status = filters.status as any;
            if (filters.gameType) where.gameType = filters.gameType;
            if (filters.gameId) where.gameId = filters.gameId;

            // ✅ SEMPRE filtrar por companyId
            where.companyId = filters.companyId;

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

    async findByUser(userId: string, companyId: string, filters?: { status?: string; startDate?: string; endDate?: string; gameType?: string }) {
        await this.updateExpiredTickets();

        const where: Prisma.TicketWhereInput = { userId, companyId };

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

    async validateTicket(ticketId: string, companyId: string) {
        // Sanitize input: remove spaces, dashes, etc.
        const originalId = ticketId;
        ticketId = ticketId.replace(/[^a-zA-Z0-9]/g, '');

        console.log(`[TicketsService] Validating ticketId: "${originalId}" -> Sanitized: "${ticketId}" for companyId: "${companyId}"`);

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ticketId);

        const ticket = await this.prisma.ticket.findFirst({
            where: {
                AND: [
                    {
                        OR: [
                            ...(isUuid ? [{ id: ticketId }] : []),
                            { hash: ticketId }
                        ] as Prisma.TicketWhereInput[]
                    },
                    { companyId: companyId } // ✅ CRITICAL: Multi-tenant isolation
                ]
            },
            include: {
                game: true,
                user: { select: { name: true, username: true } }
            }
        });

        if (!ticket) {
            console.warn(`[TicketsService] Ticket not found for ID / Hash: "${ticketId}" in company: "${companyId}"`);
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
        } else if (ticket.status === 'PAID') {
            return {
                status: 'PAID',
                message: 'Bilhete já pago.',
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

    /**
     * Mark a WON ticket as PAID.
     * STRICT RULE: Only the cambista who sold the ticket can pay it out.
     */
    async redeemPrize(ticketId: string, loggedUserId: string) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { id: ticketId }
        });

        if (!ticket) throw new BadRequestException("Bilhete não encontrado.");
        if (ticket.status !== 'WON') throw new BadRequestException(`Status inválido para pagamento: ${ticket.status}`);

        // STRICT OWNERSHIP CHECK
        if (ticket.userId !== loggedUserId) {
            throw new BadRequestException("Este prêmio só pode ser pago pelo Cambista que realizou a venda.");
        }

        return this.prisma.ticket.update({
            where: { id: ticketId },
            data: { status: 'PAID' }
        });
    }

    /**
     * Request a ticket cancellation.
     * If within grace period (e.g. 10 mins), auto-cancel.
     * Otherwise, set status to CANCEL_REQUESTED for admin approval.
     */
    async requestCancellation(ticketId: string, userId: string, reason: string) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { id: ticketId }
        });

        if (!ticket) throw new BadRequestException("Bilhete não encontrado.");
        if (ticket.userId !== userId) throw new BadRequestException("Você só pode cancelar seus próprios bilhetes.");

        if (ticket.status === 'CANCELLED') return ticket;
        if (ticket.status === 'WON' || ticket.status === 'PAID') {
            throw new BadRequestException("Não é possível cancelar um bilhete premiado ou pago.");
        }

        const now = dayjs();
        const drawDate = dayjs(ticket.drawDate);
        if (now.isAfter(drawDate)) {
            throw new BadRequestException("Não é possível cancelar bilhetes após a realização do sorteio.");
        }

        const GRACE_PERIOD_MINUTES = 10;
        const createdAt = dayjs(ticket.createdAt);

        // Check if user has permission to auto-cancel
        const requester = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { canCancelTickets: true, role: true }
        });

        const hasAutoCancelPermission = requester?.canCancelTickets || requester?.role === 'ADMIN';

        if (hasAutoCancelPermission && now.diff(createdAt, 'minute') <= GRACE_PERIOD_MINUTES) {
            // Auto-cancel within grace period
            const updatedTicket = await this.prisma.ticket.update({
                where: { id: ticketId },
                data: {
                    status: 'CANCELLED',
                    cancellationReason: reason || "Cancelamento automático (Prazo de tolerância)",
                    cancelledByUserId: userId
                }
            });

            // Clear sold numbers cache
            if (ticket.gameId && ticket.drawDate) {
                const cacheKey = `sold_numbers:${ticket.gameId}:${dayjs(ticket.drawDate).toISOString()}`;
                await this.redis.del(cacheKey);
            }

            return updatedTicket;
        } else {
            // Need Admin/Supervisor approval or user doesn't have auto-cancel permission
            return this.prisma.ticket.update({
                where: { id: ticketId },
                data: {
                    status: 'CANCEL_REQUESTED' as any,
                    cancellationReason: reason
                }
            });
        }
    }

    /**
     * Admin/Supervisor approval of a cancellation.
     */
    async approveCancellation(ticketId: string, adminId: string, approved: boolean) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { id: ticketId }
        });

        if (!ticket) throw new BadRequestException("Bilhete não encontrado.");
        if (ticket.status !== 'CANCEL_REQUESTED' as any) {
            throw new BadRequestException("Este bilhete não possui uma solicitação de cancelamento pendente.");
        }

        if (approved) {
            const updatedTicket = await this.prisma.ticket.update({
                where: { id: ticketId },
                data: {
                    status: 'CANCELLED',
                    cancelledByUserId: adminId
                }
            });

            // Clear sold numbers cache
            if (ticket.gameId && ticket.drawDate) {
                const cacheKey = `sold_numbers:${ticket.gameId}:${dayjs(ticket.drawDate).toISOString()}`;
                await this.redis.del(cacheKey);
            }

            return updatedTicket;
        } else {
            // Reject: set back to PENDING (or previous state)
            return this.prisma.ticket.update({
                where: { id: ticketId },
                data: {
                    status: 'PENDING',
                    cancellationReason: null // Clear reason as it was rejected
                }
            });
        }
    }

    private getNextSecondChanceDate(weekday: number, timeStr: string): Date {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const nowBrazil = getBrazilTime();
        let next = nowBrazil.clone().hour(hours).minute(minutes).second(0).millisecond(0);

        const currentDay = nowBrazil.day(); // 0=Sun, 6=Sat
        let daysUntil = (weekday - currentDay + 7) % 7;

        // If today is the day
        if (daysUntil === 0) {
            // If time has passed today (with 10 min cutoff notion, or just strict time?)
            // Usually next draw implies if passed, go to next week.
            // Let's stick to strict time for simple "Next Draw" logic.
            if (nowBrazil.isAfter(next)) {
                daysUntil = 7;
            }
        }

        next = next.add(daysUntil, 'day');
        // Return native Date (UTC-converted)
        return next.toDate();
    }

    private async generateUniqueSecondChanceNumber(
        gameId: string,
        drawDate: Date,
        start: number,
        end: number
    ): Promise<number> {
        const range = end - start + 1;
        if (range <= 0) throw new Error("Invalid Second Chance range");

        // Try up to 10 times to find a unique random number
        for (let i = 0; i < 10; i++) {
            const randomOffset = Math.floor(Math.random() * range);
            const candidate = start + randomOffset;

            // Check uniqueness
            const exists = await this.prisma.ticket.findFirst({
                where: {
                    gameId: gameId,
                    secondChanceDrawDate: drawDate,
                    secondChanceNumber: candidate,
                    status: { not: 'CANCELLED' } // Ignore cancelled tickets? Usually yes, we can reuse number.
                }
            });

            if (!exists) {
                return candidate;
            }
        }

        throw new Error("Unable to generate unique Second Chance number after multiple attempts.");
    }
}
