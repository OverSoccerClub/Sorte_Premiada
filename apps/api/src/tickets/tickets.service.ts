import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinanceService } from '../finance/finance.service';
import { SecurityService } from '../security/security.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RedisService } from '../redis/redis.service';
import { Prisma } from '@prisma/client';
import { getBrazilTime, dayjs } from '../utils/date.util';
import * as crypto from 'crypto';

@Injectable()
export class TicketsService {
    constructor(
        private prisma: PrismaService,
        private financeService: FinanceService,
        private securityService: SecurityService,
        @Inject(forwardRef(() => NotificationsService)) private notificationsService: NotificationsService,
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
        const game = await this.prisma.client.game.findUnique({
            where: { id: gameId },
        });

        if (!game) throw new Error("Game not found");

        // DEBUG: Log Segunda Chance configuration
        console.log(`[DEBUG] Game ${game.id} Segunda Chance Config:`, {
            secondChanceEnabled: game.secondChanceEnabled,
            secondChanceRangeStart: game.secondChanceRangeStart,
            secondChanceRangeEnd: game.secondChanceRangeEnd,
            secondChanceLabel: (game as any).secondChanceLabel
        });

        const rules = (game.rules as any) || {};

        // Fetch User with Area for Commission Rate AND Series Number
        const user = await this.prisma.client.user.findUnique({
            where: { id: userId },
            select: {
                companyId: true,
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

        // === AUTOMATIC SERIES CONTROL ===
        // Fetch area with series control fields
        let seriesNumber: string | null = null;
        let areaToUpdate: { id: string; name: string; currentSeries: string; ticketsInSeries: number; maxTicketsPerSeries: number; isActive: boolean; warningThreshold: number; notifyOnWarning: boolean; autoCycleSeries: boolean } | null = null;

        if (user?.areaId) {
            areaToUpdate = await this.prisma.client.area.findUnique({
                where: { id: user.areaId },
                select: {
                    id: true,
                    name: true,
                    currentSeries: true,
                    ticketsInSeries: true,
                    maxTicketsPerSeries: true,
                    isActive: true,
                    warningThreshold: true,
                    notifyOnWarning: true,
                    autoCycleSeries: true
                }
            });

            if (areaToUpdate) {
                if (areaToUpdate.isActive === false) {
                    throw new BadRequestException("As vendas estão temporariamente pausadas para esta praça.");
                }

                // Check if we need to increment series
                if (areaToUpdate.ticketsInSeries >= areaToUpdate.maxTicketsPerSeries) {
                    // Check if Auto Cycle is Enabled
                    if (areaToUpdate.autoCycleSeries === false) {
                        throw new BadRequestException("Série Esgotada para esta praça. Aguarde liberação do administrador.");
                    }

                    // Increment series
                    const currentSeriesNum = parseInt(areaToUpdate.currentSeries);
                    const newSeries = (currentSeriesNum + 1).toString().padStart(4, '0');

                    console.log(`[Series Auto-Increment] Area ${user.areaId} reached ${areaToUpdate.ticketsInSeries} tickets. Incrementing series: ${areaToUpdate.currentSeries} → ${newSeries}`);

                    areaToUpdate.currentSeries = newSeries;
                    areaToUpdate.ticketsInSeries = 0;
                } else {
                    // Check Warning Threshold
                    const threshold = areaToUpdate.warningThreshold || 80;
                    const notify = areaToUpdate.notifyOnWarning ?? true;

                    const saturation = (areaToUpdate.ticketsInSeries / areaToUpdate.maxTicketsPerSeries) * 100;

                    if (notify && saturation >= threshold) {
                        try {
                            // Log/Notify about high saturation
                            // Check if we already notified recently? Or just log for now?
                            // Ideally, we create a NotificationLog for Master/Admin
                            console.warn(`[SERIES WARNING] Area ${areaToUpdate.name} (${areaToUpdate.id}) series ${areaToUpdate.currentSeries} is at ${saturation.toFixed(1)}% capacity.`);

                            // Create Notification via NotificationsService
                            const companyId = user?.companyId;
                            if (companyId) {
                                // Notify MASTER and ADMIN of that company
                                await this.notificationsService.sendToRole('MASTER', 'Alerta de Série', `A praça ${areaToUpdate.name} atingiu ${saturation.toFixed(0)}% da série ${areaToUpdate.currentSeries}.`, { areaId: areaToUpdate.id }, companyId);
                                await this.notificationsService.sendToRole('ADMIN', 'Alerta de Série', `A praça ${areaToUpdate.name} atingiu ${saturation.toFixed(0)}% da série ${areaToUpdate.currentSeries}.`, { areaId: areaToUpdate.id }, companyId);
                            }
                        } catch (e) {
                            console.error("Failed to process warning", e);
                        }
                    }
                }

                seriesNumber = areaToUpdate.currentSeries;
                console.log(`[TicketsService] Using series ${seriesNumber} from area (${areaToUpdate.ticketsInSeries + 1}/${areaToUpdate.maxTicketsPerSeries})`);
            }
        }

        // Fetch Area Override
        const areaConfig = (user?.areaId && gameId) ? await this.prisma.client.areaConfig.findUnique({
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
                const relevantTickets = await this.prisma.client.ticket.findMany({
                    where: {
                        gameId: gameId,
                        drawDate: drawDate,
                        numbers: { has: num.toString() },
                        status: { not: 'CANCELLED' }
                    },
                    select: { possiblePrize: true }
                });

                const existingLiability = relevantTickets.reduce((sum: number, t: any) => sum + Number(t.possiblePrize || 0), 0);

                if (existingLiability + currentPotentialWin > maxLiability) {
                    throw new BadRequestException(`Limite de risco excedido para a milhar ${num}. Banca cheia. Tente outro número.`);
                }
            }
        }

        // --- BUSINESS RULE 1: GLOBAL UNIQUENESS ---
        if (rules.globalCheck && drawDate && data.numbers && data.numbers.length > 0) {
            const soldSet = await this.getSoldNumbers(gameId, drawDate);
            const conflicts = data.numbers.filter((n: string) => soldSet.has(n.toString()));

            if (conflicts.length > 0) {
                throw new BadRequestException(`Números indisponíveis(Bloqueio Global): ${conflicts.join(', ')}. Estes números já foram vendidos em outra série.`);
            }
        }

        // 2x1000 Special Logic
        if (data.gameType === '2x1000') {
            const NUMBERS_PER_TICKET = 4;
            const isAutoPick = !data.numbers || data.numbers.length === 0;

            if (isAutoPick) {
                const sNum = seriesNumber ? Number(seriesNumber) : undefined;
                data.numbers = await this.generateRandomAvailableNumbers(gameId, NUMBERS_PER_TICKET, drawDate!, sNum);
            } else {
                if (data.numbers.length !== NUMBERS_PER_TICKET) {
                    throw new Error(`Ticket must have exactly ${NUMBERS_PER_TICKET} thousands.`);
                }
                if (!rules.globalCheck) {
                    const sNum = seriesNumber ? Number(seriesNumber) : undefined;
                    await this.validateNumbersAvailability(gameId, data.numbers, drawDate!, sNum);
                }
            }

            // Get ticket numbering configuration from game
            const maxTickets = game.maxTicketsPerSeries || 2500;
            const numberingMode = game.ticketNumberingMode || 'RANDOM';

            // Generate ticket number based on configuration
            const sNum = seriesNumber ? Number(seriesNumber) : undefined;
            const ticketNumber = await this.generateTicketNumber(gameId, drawDate!, maxTickets, numberingMode, sNum);
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

        // Fetch Device Name from POS Terminal (if deviceId/token provided)
        let deviceName: string | null = null;
        if (data._deviceId) {
            try {
                // Try to find device by token first (x-device-token)
                const deviceByToken = await this.prisma.client.posTerminal.findFirst({
                    where: { deviceToken: data._deviceId },
                    select: { name: true, activationCode: true }
                });

                if (deviceByToken) {
                    deviceName = deviceByToken.name || deviceByToken.activationCode || null;
                } else {
                    // Fallback: try to find by deviceId (x-device-id)
                    const deviceById = await this.prisma.client.posTerminal.findFirst({
                        where: { deviceId: data._deviceId },
                        select: { name: true, activationCode: true }
                    });

                    if (deviceById) {
                        deviceName = deviceById.name || deviceById.activationCode || null;
                    }
                }

                if (deviceName) {
                    console.log(`[TicketsService] Using device name: ${deviceName}`);
                }
            } catch (e) {
                console.warn(`[TicketsService] Failed to fetch device name:`, e);
            }
        }

        try {
            const createData: any = {
                userId: userId,
                gameType: data.gameType,
                numbers: (data.numbers || []).map(String),
                amount: data.amount,
                status: data.status || 'PENDING',
                drawDate: drawDate,
                hash: this.generateTicketCode(8),
                gameId: gameId,
                companyId: user?.companyId || data.company?.connect?.id,
                // New Financials
                commissionRate: commissionRate,
                commissionValue: commissionValue,
                netValue: netValue,
                possiblePrize: possiblePrize,
                // Ticket Number (for 2x1000)
                ...((data as any)._ticketNumber ? { ticketNumber: (data as any)._ticketNumber } : {}),
                // Series from Area
                ...(seriesNumber !== null ? { series: Number(seriesNumber) } : {})
            };

            // Second Chance ...
            if (game.secondChanceEnabled) {
                try {
                    // Use default ranges if not configured
                    const rangeStart = game.secondChanceRangeStart ?? 100000;
                    const rangeEnd = game.secondChanceRangeEnd ?? 999999;

                    const scDrawDate = this.getNextSecondChanceDate(
                        game.secondChanceWeekday ?? 6,
                        game.secondChanceDrawTime || '19:00'
                    );
                    const scNumber = await this.generateUniqueSecondChanceNumber(
                        gameId,
                        scDrawDate,
                        rangeStart,
                        rangeEnd,
                        seriesNumber !== null ? Number(seriesNumber) : undefined
                    );
                    createData['secondChanceDrawDate'] = scDrawDate;
                    createData['secondChanceNumber'] = scNumber;
                } catch (e) {
                    console.error('[TicketsService] Error generating second chance:', e);
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

            const ticket = await this.prisma.client.ticket.create({
                data: createData
            });

            // Update area series counter
            if (areaToUpdate) {
                await this.prisma.client.area.update({
                    where: { id: areaToUpdate.id },
                    data: {
                        currentSeries: areaToUpdate.currentSeries,
                        ticketsInSeries: areaToUpdate.ticketsInSeries + 1
                    }
                });
                console.log(`[Series Counter] Area ${areaToUpdate.id} updated: series=${areaToUpdate.currentSeries}, count=${areaToUpdate.ticketsInSeries + 1}`);
            }

            // Invalidate Redis Caches for this game and draw date
            try {
                // Invalidate both global and specific series cache if necessary
                // Simple approach: invalidate keys by pattern? RedisService might not support pattern del easily.
                // We'll invalidate the specific series key we just wrote to.
                // NOTE: If global check is ON, we might need to invalidate global key too.

                const sKey = seriesNumber ? `:${Number(seriesNumber)}` : ':global';
                const cacheKey = `sold_numbers:${ticket.gameId}:${ticket.drawDate?.toISOString()}${sKey}`;

                const liabilityKey = `liability:${ticket.gameId}:${ticket.drawDate?.toISOString()}`;
                await this.redis.del(cacheKey);
                await this.redis.del(liabilityKey);

                // Also invalidate global lookup if we wrote to a series? 
                // Currently getSoldNumbers segregates by series key. 
                // If a global check uses :global, it won't see this series update unless we invalidate :global too or :global reads all.
                // BUT getSoldNumbers(:global) logic above reads ALL tickets in DB (no series filter).
                // So the DB read will be correct, but the CACHED :global value will be stale.
                if (seriesNumber) {
                    const globalKey = `sold_numbers:${ticket.gameId}:${ticket.drawDate?.toISOString()}:global`;
                    await this.redis.del(globalKey);
                }

            } catch (e) {
                console.error("Redis invalidation failed", e);
            }

            // Return ticket with additional device info
            return {
                ...ticket,
                deviceName: deviceName
            };
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
        const game = await this.prisma.client.game.findUnique({
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

    private async validateNumbersAvailability(gameId: string, numbers: string[], drawDate: Date, series?: number) {
        const soldNumbers = await this.getSoldNumbers(gameId, drawDate, series);
        const alreadySold = numbers.filter(n => soldNumbers.has(n.toString()));
        if (alreadySold.length > 0) {
            throw new Error(`Numbers already sold for draw ${drawDate.toLocaleString()}: ${alreadySold.join(', ')} `);
        }
    }

    private async generateRandomAvailableNumbers(gameId: string, quantity: number, drawDate: Date, series?: number): Promise<string[]> {
        const soldNumbers = await this.getSoldNumbers(gameId, drawDate, series);
        const available: string[] = [];
        // Pool 0000 to 9999
        for (let i = 0; i < 10000; i++) {
            const numStr = i.toString().padStart(4, '0');
            if (!soldNumbers.has(numStr)) {
                available.push(numStr);
            }
        }

        if (available.length < quantity) {
            throw new Error(`Not enough available numbers.Only ${available.length} left.`);
        }

        const selected: string[] = [];
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
        mode: string = 'RANDOM',
        series?: number
    ): Promise<number> {
        // Fetch already used ticket numbers for this series (game + drawDate)
        const where: Prisma.TicketWhereInput = {
            gameId: gameId,
            drawDate: drawDate,
            status: { not: 'CANCELLED' },
            ticketNumber: { not: null }
        };

        if (series !== undefined) {
            where.series = series;
        }

        const usedTickets = await this.prisma.client.ticket.findMany({
            where: where,
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


    private async getSoldNumbers(gameId: string, drawDate: Date, series?: number): Promise<Set<string>> {
        const seriesKey = series !== undefined ? `:${series}` : ':global';
        // Prefix V2 to force cache invalidation
        const cacheKey = `sold_numbers_v2:${gameId}:${drawDate.toISOString()}${seriesKey}`;
        let cached: string | null = null;

        try {
            cached = await this.redis.get(cacheKey);
        } catch (error) {
            console.warn(`[TicketsService] Redis get failed for ${cacheKey}. Falling back to DB.`, error);
        }

        if (cached) {
            return new Set(JSON.parse(cached));
        }

        const where: Prisma.TicketWhereInput = {
            gameId: gameId,
            status: { not: 'CANCELLED' },
            drawDate: drawDate
        };

        if (series !== undefined) {
            where.series = series;
        }

        const tickets = await this.prisma.client.ticket.findMany({
            where: where,
            select: { numbers: true }
        });

        const soldArr: string[] = [];
        tickets.forEach((t: any) => {
            if (Array.isArray(t.numbers)) {
                (t.numbers as string[]).forEach(n => soldArr.push(n.toString()));
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

    async getAvailability(gameId: string, userId?: string): Promise<string[]> {
        const nextDraw = await this.getNextDrawDate(gameId);
        let series: number | undefined;

        console.log(`[getAvailability] Start for Game ${gameId}, User: ${userId}`);

        let user: { areaId?: string | null } | null = null;
        if (userId) {
            user = await this.prisma.client.user.findUnique({
                where: { id: userId },
                select: { areaId: true }
            });
        }

        let areaToUpdate: {
            id: string;
            name: string;
            currentSeries: string;
            ticketsInSeries: number;
            maxTicketsPerSeries: number;
            isActive: boolean;
        } | null = null;
        let seriesNumber: string | undefined;

        if (user?.areaId) {
            areaToUpdate = await this.prisma.client.area.findUnique({
                where: { id: user.areaId },
                select: {
                    id: true,
                    name: true,
                    currentSeries: true,
                    ticketsInSeries: true,
                    maxTicketsPerSeries: true,
                    isActive: true
                }
            });

            if (areaToUpdate) {
                // Check if Area is Active
                if (areaToUpdate.isActive === false) {
                    throw new BadRequestException("As vendas estão temporariamente pausadas para esta praça.");
                }

                // Check if we need to increment series
                if (areaToUpdate.ticketsInSeries >= areaToUpdate.maxTicketsPerSeries) {
                    // Increment series
                    const currentSeriesNum = parseInt(areaToUpdate.currentSeries);
                    const newSeries = (currentSeriesNum + 1).toString().padStart(4, '0');

                    console.log(`[Series Auto-Increment] Area ${user.areaId} reached ${areaToUpdate.ticketsInSeries} tickets. Incrementing series: ${areaToUpdate.currentSeries} → ${newSeries}`);

                    areaToUpdate.currentSeries = newSeries;
                    areaToUpdate.ticketsInSeries = 0;
                }

                seriesNumber = areaToUpdate.currentSeries;
                console.log(`[TicketsService] Using series ${seriesNumber} from area (${areaToUpdate.ticketsInSeries + 1}/${areaToUpdate.maxTicketsPerSeries})`);
            }
        }

        // Fetch Area Override
        const areaConfig = (user?.areaId && gameId) ? await this.prisma.client.areaConfig.findUnique({
            where: { areaId_gameId: { areaId: user.areaId, gameId } }
        }) : null;

        if (seriesNumber) {
            series = parseInt(seriesNumber);
        } else {
            console.log(`[getAvailability] No userId provided or no area/areaConfig. Using global scope.`);
        }

        // Fetch Game to check for globalCheck rule
        const game = await this.prisma.client.game.findUnique({
            where: { id: gameId },
            select: { rules: true }
        });
        const rules = (game?.rules as any) || {};

        // If globalCheck is enabled, we MUST return ALL sold numbers regardless of series
        // to avoid "phantom availability" in the app.
        const effectiveSeries = rules.globalCheck ? undefined : series;

        const soldSet = await this.getSoldNumbers(gameId, nextDraw, effectiveSeries);
        console.log(`[getAvailability] Found ${soldSet.size} sold numbers. Global Check: ${!!rules.globalCheck}, Series Filter: ${effectiveSeries}`);
        return Array.from(soldSet);
    }

    async getSeriesStats(gameId: string, companyId: string, drawDate?: Date) {
        // Get game info
        const game = await this.prisma.client.game.findUnique({
            where: { id: gameId },
            select: {
                name: true,
                maxTicketsPerSeries: true
            }
        });

        if (!game) {
            throw new Error("Game not found");
        }

        const maxTicketsPerSeries = game.maxTicketsPerSeries || 2500;

        // NEW LOGIC: Fetch status from AREAS directly (Real-Time Monitor)
        const areas = await this.prisma.client.area.findMany({
            where: { companyId },
            select: {
                id: true,
                name: true,
                currentSeries: true,
                maxTicketsPerSeries: true,
                isActive: true
            },
            orderBy: { name: 'asc' }
        });

        // Map areas to SeriesStats format with REAL-TIME counts
        const series = await Promise.all(areas.map(async (area: any) => {
            const seriesNum = parseInt(area.currentSeries);

            // Calculate REAL count from database to ensure accuracy
            const currentCount = await this.prisma.client.ticket.count({
                where: {
                    series: seriesNum,
                    user: { areaId: area.id }, // Ensure ticket belongs to this area
                    status: { not: 'CANCELLED' },
                    gameId // Ensure it matches the game (though series usually implies game, good to be safe)
                }
            });

            return {
                seriesNumber: seriesNum,
                drawDate: drawDate ? drawDate.toISOString() : 'ACTIVE',
                ticketsSold: currentCount,
                ticketsRemaining: maxTicketsPerSeries - currentCount, // Use game max
                percentageFilled: Math.round((currentCount / maxTicketsPerSeries) * 100),
                status: (area.isActive === false) ? 'PAUSED' : (currentCount >= maxTicketsPerSeries ? 'FULL' : 'ACTIVE'),
                areaName: area.name,
                areaId: area.id,
                isActive: area.isActive
            };
        }));

        return {
            gameId,
            gameName: game.name,
            maxTicketsPerSeries,
            series
        };
    }


    private async updateExpiredTickets() {
        // Update tickets that are PENDING and have a drawDate in the past
        await this.prisma.client.ticket.updateMany({
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
        return this.prisma.client.ticket.findMany({
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

        return this.prisma.client.ticket.findMany({
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

        const ticket = await this.prisma.client.ticket.findFirst({
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
    async redeemPrize(ticketId: string, loggedUserId: string, companyId?: string) {
        const ticket = await this.prisma.client.ticket.findUnique({
            where: { id: ticketId }
        });

        if (!ticket) throw new BadRequestException("Bilhete não encontrado.");
        if (ticket.status !== 'WON') throw new BadRequestException(`Status inválido para pagamento: ${ticket.status}`);

        // STRICT COMPANY CHECK
        if (companyId && ticket.companyId && ticket.companyId !== companyId) {
            throw new BadRequestException("Acesso negado: Este bilhete pertence a outra empresa.");
        }

        // STRICT OWNERSHIP CHECK
        if (ticket.userId !== loggedUserId) {
            throw new BadRequestException("Este prêmio só pode ser pago pelo Cambista que realizou a venda.");
        }

        const updatedTicket = await this.prisma.client.ticket.update({
            where: { id: ticketId },
            data: { status: 'PAID' }
        });

        // INTEGRATION: Create DEBIT transaction for the prize payout
        // This automatically reduces the balance the cambista owes to the house
        if (ticket.companyId) {
            await this.financeService.createTransaction(loggedUserId, ticket.companyId, {
                description: `Pagamento Prêmio: ${ticket.gameType} (#${ticket.hash})`,
                amount: Number(ticket.possiblePrize),
                type: 'DEBIT',
                category: 'PRIZE_PAYOUT'
            });
        }

        return updatedTicket;
    }

    /**
     * Request a ticket cancellation.
     * If within grace period (e.g. 10 mins), auto-cancel.
     * Otherwise, set status to CANCEL_REQUESTED for admin approval.
     */
    async requestCancellation(ticketId: string, userId: string, reason: string, companyId?: string) {
        const ticket = await this.prisma.client.ticket.findUnique({
            where: { id: ticketId }
        });

        if (!ticket) throw new BadRequestException("Bilhete não encontrado.");

        // STRICT COMPANY CHECK
        if (companyId && ticket.companyId && ticket.companyId !== companyId) {
            throw new BadRequestException("Acesso negado: Este bilhete pertence a outra empresa.");
        }

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
        const requester = await this.prisma.client.user.findUnique({
            where: { id: userId },
            select: { canCancelTickets: true, role: true }
        });

        const hasAutoCancelPermission = requester?.canCancelTickets || requester?.role === 'ADMIN';

        if (hasAutoCancelPermission && now.diff(createdAt, 'minute') <= GRACE_PERIOD_MINUTES) {
            // Auto-cancel within grace period
            const updatedTicket = await this.prisma.client.ticket.update({
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
            return this.prisma.client.ticket.update({
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
    async approveCancellation(ticketId: string, adminId: string, approved: boolean, companyId?: string) {
        const ticket = await this.prisma.client.ticket.findUnique({
            where: { id: ticketId }
        });

        if (!ticket) throw new BadRequestException("Bilhete não encontrado.");

        // STRICT COMPANY CHECK
        if (companyId && ticket.companyId && ticket.companyId !== companyId) {
            throw new BadRequestException("Acesso negado: Este bilhete pertence a outra empresa.");
        }

        if (ticket.status !== 'CANCEL_REQUESTED' as any) {
            throw new BadRequestException("Este bilhete não possui uma solicitação de cancelamento pendente.");
        }

        if (approved) {
            const updatedTicket = await this.prisma.client.ticket.update({
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
            return this.prisma.client.ticket.update({
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
        end: number,
        series?: number
    ): Promise<number> {
        const range = end - start + 1;
        if (range <= 0) throw new Error("Invalid Second Chance range");

        // Try up to 10 times to find a unique random number
        for (let i = 0; i < 10; i++) {
            const randomOffset = Math.floor(Math.random() * range);
            const candidate = start + randomOffset;

            // Check uniqueness - Scope to series if provided
            const where: any = {
                gameId: gameId,
                secondChanceDrawDate: drawDate,
                secondChanceNumber: candidate,
                status: { not: 'CANCELLED' }
            };

            if (series !== undefined) {
                where.series = series;
            }

            const exists = await this.prisma.client.ticket.findFirst({
                where: where
            });

            if (!exists) {
                return candidate;
            }
        }

        throw new Error("Unable to generate unique Second Chance number after multiple attempts.");
    }
    async cycleAreaSeries(areaId: string, userId: string) {
        const area = await this.prisma.client.area.findUnique({ where: { id: areaId } });
        if (!area) throw new BadRequestException("Praça não encontrada");

        const currentSeriesNum = parseInt(area.currentSeries);
        const newSeries = (currentSeriesNum + 1).toString().padStart(4, '0');

        console.log(`[Manual Series Cycle] Area ${area.name} (${areaId}) cycled by user ${userId}. ${area.currentSeries} -> ${newSeries}`);

        // Log audit
        await this.prisma.client.auditLog.create({
            data: {
                action: "CYCLE_SERIES",
                entity: "Area",
                entityId: areaId,
                oldValue: { series: area.currentSeries },
                newValue: { series: newSeries },
                userId: userId,
                companyId: area.companyId
            }
        });

        return this.prisma.client.area.update({
            where: { id: areaId },
            data: {
                currentSeries: newSeries,
                ticketsInSeries: 0
            }
        });
    }
}
