import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class SchedulerService {
    private readonly logger = new Logger(SchedulerService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService,
    ) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async handleCron() {
        const timeZone = 'America/Sao_Paulo';
        const now = dayjs().tz(timeZone);

        const minutesAlert1 = 10;
        const minutesAlert2 = 5;

        const timePlus10 = now.add(minutesAlert1, 'minute');
        const timePlus5 = now.add(minutesAlert2, 'minute');

        const timeString10 = timePlus10.format('HH:mm');
        const timeString5 = timePlus5.format('HH:mm');

        this.logger.debug(`Verificando sorteios (TZ: ${timeZone}): Agora=${now.format('HH:mm')}, Avisar 10m=(${timeString10}), Avisar 5m=(${timeString5})`);

        // 2. Buscar Jogos que tenham sorteio nesses horarios
        const games = await this.prisma.game.findMany({
            where: {
                // Otimização: Trazer apenas ativos se houver flag
            }
        });

        const gamesAt10 = games.filter(g => g.extractionTimes.includes(timeString10));
        const gamesAt5 = games.filter(g => g.extractionTimes.includes(timeString5));

        if (gamesAt10.length === 0 && gamesAt5.length === 0) return;

        // 3. Buscar Tokens dos Cambistas
        const users = await this.prisma.user.findMany({
            where: {
                role: 'CAMBISTA',
                pushToken: { not: null }
            },
            select: { pushToken: true }
        });

        const tokens = users.map(u => u.pushToken).filter(t => t !== null) as string[];

        if (tokens.length === 0) return;

        // 4. Enviar Notificações
        for (const game of gamesAt10) {
            await this.notificationsService.sendPushNotification(
                tokens,
                `⏰ Sorteio em 10 minutos!`,
                `O sorteio do ${game.name} será às ${timeString10}. Agilize as apostas!`,
                { gameId: game.id }
            );
            this.logger.log(`Alerta de 10min enviado para o jogo ${game.name} às ${timeString10}`);
        }

        for (const game of gamesAt5) {
            await this.notificationsService.sendPushNotification(
                tokens,
                `⏳ Sorteio em 5 minutos!`,
                `Última chamada para o ${game.name}! Sorteio às ${timeString5}.`,
                { gameId: game.id }
            );
            this.logger.log(`Alerta de 5min enviado para o jogo ${game.name} às ${timeString5}`);
        }
    }
}
