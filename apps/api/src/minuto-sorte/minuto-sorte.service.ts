import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsService } from '../tickets/tickets.service';
import { getBrazilTime } from '../utils/date.util';

@Injectable()
export class MinutoSorteService {
    constructor(
        private prisma: PrismaService,
        private ticketsService: TicketsService
    ) { }

    async createTicket(data: { userId: string, companyId: string, chosenHour: number, amount: number }) {
        const { userId, companyId, chosenHour, amount } = data;

        if (chosenHour < 0 || chosenHour > 23) {
            throw new BadRequestException("Hora escolhida deve ser entre 0 e 23.");
        }

        if (![1, 5, 10].includes(Number(amount))) {
            throw new BadRequestException("O valor da aposta deve ser R$ 1, R$ 5 ou R$ 10.");
        }

        // Determine purchase Minute based in Brazil Time
        const nowBrazil = getBrazilTime();
        const purchaseMinute = nowBrazil.minute();

        // 1. Fetch the MINUTO_SORTE game for this company
        const game = await this.prisma.client.game.findFirst({
            where: {
                companyId,
                type: 'MINUTO_SORTE'
            }
        });

        if (!game) {
            throw new BadRequestException("Jogo 'Minuto da Sorte' não configurado para esta empresa.");
        }

        // 2. Delegate to TicketsService for standard validation (finance, series, limits, etc.)
        // We pass the hour and minute as the "numbers"
        const strHour = chosenHour.toString().padStart(2, '0');
        const strMin = purchaseMinute.toString().padStart(2, '0');

        return this.ticketsService.create({
            user: { connect: { id: userId } },
            company: { connect: { id: companyId } },
            game: { connect: { id: game.id } },
            gameType: 'MINUTO_SORTE',
            numbers: [strHour, strMin],
            amount,
            status: 'PENDING'
        });
    }
}
