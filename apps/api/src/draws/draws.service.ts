
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

                return tx.draw.create({
                    data: {
                        ...data,
                        series: updatedSeries.lastSeries
                    }
                });
            }

            return tx.draw.create({ data });
        });
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
