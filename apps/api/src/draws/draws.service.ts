
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@repo/database';

@Injectable()
export class DrawsService {
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        return this.prisma.$transaction(async (tx) => {
            // Verificar se temos gameId (direto ou via connect)
            const gameId = data.gameId || (data.game && data.game.connect && data.game.connect.id);

            if (gameId) {
                // Determine time slot from drawDate
                const drawDate = new Date(data.drawDate);
                // Extrai HH:mm em UTC ou Local?
                // O ideal é usar o formato salvo no banco ou consistente.
                // Como drawDate vem ISO, vamos extrair a hora/minuto.
                // IMPORTANTE: `toLocaleTimeString` depende do locale do servidor.
                // Vamos usar getHours/getMinutes para garantir "HH:mm" fixo ou ISO substring se for UTC.
                // Assumindo que os sorteios são agendados e a "hora" é a parte relevante.
                // Vamos usar UTC para consistência ou o horário local do Brasil?
                // O app usa 'pt-BR' no frontend. Vamos tentar normalizar para HH:mm.

                // Melhor abordagem: Extrair HH:mm do ISO string se possível ou Date methods.
                // Vamos pegar a hora local (ou UTC-3) se a data vier com timezone.
                // Simplificação: Pegar HH:mm da string se vier, ou do Date object.
                const hours = drawDate.getUTCHours().toString().padStart(2, '0'); // Usando UTC por padrão para consistência backend
                const minutes = drawDate.getUTCMinutes().toString().padStart(2, '0');
                // Mas espera, se o usuario manda "2023-12-25T08:00:00-03:00", o UTC é 11:00.
                // Se a "Extração das 08:00" for 08:00 Local, precisamos saber o timezone.
                // Vamos tentar extrair a hora visual se for importante, ou confiar no input.
                // Se o frontend manda ISO, vamos confiar no UTC time para diferenciar "slots"?
                // NÃO. "08:00" deve ser 08:00 sempre.
                // Vamos extrair a string de hora enviada se possível, ou usar UTC-3 (Brasil).

                // Ajuste: Vamos considerar timezone Brasil (-3).
                const brasilTime = new Date(drawDate.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
                const timeSlot = `${brasilTime.getHours().toString().padStart(2, '0')}:${brasilTime.getMinutes().toString().padStart(2, '0')}`;

                // Busca ou cria o contador para este horário
                let extractionSeries = await tx.extractionSeries.findUnique({
                    where: {
                        gameId_time: {
                            gameId,
                            time: timeSlot
                        }
                    }
                });

                if (!extractionSeries) {
                    extractionSeries = await tx.extractionSeries.create({
                        data: {
                            gameId,
                            time: timeSlot,
                            lastSeries: 0
                        }
                    });
                }

                // Incrementa o contador da serie especifica
                const updatedSeries = await tx.extractionSeries.update({
                    where: { id: extractionSeries.id },
                    data: { lastSeries: { increment: 1 } }
                });

                // Mantemos o lastSeries global do Game atualizado também (opcional, mas bom p/ compatibilidade)
                await tx.game.update({
                    where: { id: gameId },
                    data: { lastSeries: { increment: 1 } }
                });

                const createdDraw = await tx.draw.create({
                    data: {
                        ...data,
                        series: updatedSeries.lastSeries
                    }
                });

                // IMPORTANT: We cannot await this INSIDE the transaction if it modifies rows that might be locked or if we want it to run after commit.
                // But generally safe if it updates Tickets. 
                // However, Prisma doesn't support "after commit" hooks easily inside $transaction callback unless we manually handle it.
                // Let's return the draw and process results OUTSIDE the transaction or just await it here if performance allows.
                // Updating tickets is related data, safe to do inside transaction to ensure consistency? 
                // If the draw fails, tickets shouldn't be updated.
                // YES, inside transaction is better for consistency.
                await this.processDrawResults(tx, createdDraw);

                return createdDraw;
            }

            const createdDraw = await tx.draw.create({ data });
            await this.processDrawResults(tx, createdDraw);
            return createdDraw;
        });
    }

    private async processDrawResults(tx: Prisma.TransactionClient, draw: any) {
        if (!draw.numbers || draw.numbers.length === 0) return;

        // Find all PENDING tickets for this game and draw date
        // Also include already processed ones if we are re-processing via Update? 
        // Ideally yes, but for now let's focus on PENDING to avoid re-crediting or confusing states.
        // However, if we edited the draw, we might need to re-evaluate EVERYONE?
        // Risky. Let's stick to PENDING for first pass or if explicitly requested.
        // But if I put wrong numbers and fix them, I want to fix the tickets. 
        // Let's allow checking non-cancelled tickets.
        const tickets = await tx.ticket.findMany({
            where: {
                gameId: draw.gameId,
                drawDate: draw.drawDate,
                status: { not: 'CANCELLED' }
            }
        });

        const drawNumbers = new Set(draw.numbers as number[]);

        let wonCount = 0;
        let lostCount = 0;

        for (const ticket of tickets) {
            const ticketNumbers = (ticket.numbers as number[]);

            // "Match Any" Logic
            const hasMatch = ticketNumbers.some(n => drawNumbers.has(n));
            const newStatus = hasMatch ? 'WON' : 'LOST';

            // Only update if status changed to avoid redundant DB writes
            if (ticket.status !== newStatus) {
                await tx.ticket.update({
                    where: { id: ticket.id },
                    data: { status: newStatus }
                });

                if (newStatus === 'WON') wonCount++;
                else lostCount++;
            }
        }
        console.log(`[ProcessResults] Draw ${draw.id} Re-calculed: ${wonCount} Won, ${lostCount} Lost.`);
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
        const updatedDraw = await this.prisma.draw.update({
            where: { id },
            data,
        });

        // Trigger result processing if numbers are present
        if (updatedDraw.numbers && (updatedDraw.numbers as number[]).length > 0) {
            // We need a transaction client if we want to follow the pattern, 
            // but since we are not in a transaction here, we pass the main prisma service.
            // processDrawResults expects Prisma.TransactionClient, which PrismaService satisfies compatible interface wise usually 
            // but strict typing might complain. Let's cast or adjust.
            await this.processDrawResults(this.prisma, updatedDraw);
        }

        return updatedDraw;
    }

    async remove(id: string) {
        return this.prisma.draw.delete({ where: { id } });
    }
    async getDrawDetails(id: string) {
        const draw = await this.prisma.draw.findUnique({
            where: { id },
            include: { game: true }
        });

        if (!draw) return null;

        // Find tickets for this draw
        // Calculate timezone offsets to handle legacy data mismatch
        // Bug: Some tickets might have been saved as UTC-3 (server time) while Draw is UTC (or vice versa), resulting in exactly 3h difference.
        const exactDate = draw.drawDate;
        const minus3h = new Date(exactDate.getTime() - 3 * 60 * 60 * 1000);
        const plus3h = new Date(exactDate.getTime() + 3 * 60 * 60 * 1000);

        // Find tickets for this draw with tolerance for timezone bug
        const tickets = await this.prisma.ticket.findMany({
            where: {
                gameId: draw.gameId,
                OR: [
                    { drawDate: exactDate },
                    { drawDate: minus3h },
                    { drawDate: plus3h }
                ]
            },
            include: {
                user: {
                    include: {
                        area: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Calculate stats
        const totalSales = tickets.reduce((sum, t) => sum + Number(t.amount), 0);
        const totalPrizes = tickets.filter(t => t.status === 'WON').reduce((sum, t) => {
            // Assuming prize calculation logic is elsewhere or we should strictly look at paid prizes?
            // Since we don't store prize amount on ticket yet (only status), we might need to estimate or 
            // if 'amount' is the bet amount.
            // Wait, standard lottery: Prize is defined by Game Rules * Bet Amount or Fixed per winner?
            // The current system seems to lack "Prize Amount" field on Ticket model (it has 'amount' which is bet cost).
            // Let's check schema again. Ticket has 'amount' (Decimal). No 'prizeAmount'.
            // However, the User Request says "qual valor do premio". 
            // For now, let's just return the tickets list and the frontend can infer or we just explicitly return empty prize if not stored.
            // actually, let's just list the tickets.
            return sum;
        }, 0);

        return {
            draw,
            tickets,
            stats: {
                totalSales,
                ticketCount: tickets.length,
                winningCount: tickets.filter(t => t.status === 'WON').length
            }
        };
    }
}
