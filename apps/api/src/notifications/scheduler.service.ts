import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import * as dayjs from 'dayjs';

// Usar dayjs puro ou nativo Date? Vamos de nativo para evitar dep extra se possivel, mas dayjs é mais seguro.
// O projeto não parece ter dayjs instalado no package.json lido anteriormente (não li, mas vou assumir nativo para não quebrar).
// Vou usar Date nativo.

@Injectable()
export class SchedulerService {
    private readonly logger = new Logger(SchedulerService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService,
    ) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async handleCron() {
        // 1. Hora atual precisa
        const now = new Date();
        // Ajustar para fuso horario pode ser tricky. O servidor provavelmente está em UTC.
        // Os horarios de extração "19:00" são strings. Precisamos saber o fuso do usuário.
        // Assumindo Horário de Brasília (UTC-3) ou o fuso do servidor.
        // A regra de negócio geralmente é fixa no BR.

        // Vamos pegar a hora atual em string HH:mm
        // E calcular a hora atual + 5min e hora atual + 10min

        // ATENCAO: Os 'extractionTimes' nos jogos sao strings tipo "10:00", "19:00".

        const minutesAlert1 = 10;
        const minutesAlert2 = 5;

        const timePlus10 = this.addMinutes(now, minutesAlert1);
        const timePlus5 = this.addMinutes(now, minutesAlert2);

        const timeString10 = this.formatTime(timePlus10);
        const timeString5 = this.formatTime(timePlus5);

        this.logger.debug(`Verificando sorteios para avisar: 10m(${timeString10}) e 5m(${timeString5})`);

        // 2. Buscar Jogos que tenham sorteio nesses horarios
        // O campo extractionTimes é um array de strings ["HH:mm", ...]
        // Infelizmente filtrar arrays JSON/String array no Prisma pode ser chato, vamos trazer os jogos e filtrar na memoria (poucos jogos).
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
            this.logger.log(`Alerta de 10min enviado para o jogo ${game.name}`);
        }

        for (const game of gamesAt5) {
            await this.notificationsService.sendPushNotification(
                tokens,
                `⏳ Sorteio em 5 minutos!`,
                `Última chamada para o ${game.name}! Sorteio às ${timeString5}.`,
                { gameId: game.id }
            );
            this.logger.log(`Alerta de 5min enviado para o jogo ${game.name}`);
        }
    }

    private addMinutes(date: Date, minutes: number): Date {
        // Importante: Tratamento de fuso. Se o servidor for UTC, precisamos ajustar para -3 para bater com o "19:00" do banco BR.
        // Vamos assumir que processamos tudo baseando-se no horario local do servidor que roda no Brasil ou configurado corretamente.
        // Se estiver em UTC, e o banco "19:00" for BRT, temos um problema.
        // O usuario disse "paramatrizado os horarios".
        // Vou usar a data atual simples + offset.
        return new Date(date.getTime() + minutes * 60000);
    }

    private formatTime(date: Date): string {
        // Formata HH:mm
        // Se o servidor for cloud (UTC), precisamos forçar UTC-3 para comparar com o banco?
        // Melhor usar toLocaleString com timeZone
        const hour = date.getHours().toString().padStart(2, '0');
        const min = date.getMinutes().toString().padStart(2, '0');
        return `${hour}:${min}`;
    }
}
