import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class NotificationsService {
    private expo = new Expo();
    private readonly logger = new Logger(NotificationsService.name);

    async sendPushNotification(pushTokens: string[], title: string, body: string, data?: any) {
        const messages: ExpoPushMessage[] = [];

        // Filtrar tokens inválidos
        const validTokens = pushTokens.filter(token => Expo.isExpoPushToken(token));

        for (const pushToken of validTokens) {
            messages.push({
                to: pushToken,
                sound: 'default',
                title: title,
                body: body,
                data: data || {},
            });
        }

        // O Expo recomenda enviar em chunks para otimizar
        const chunks = this.expo.chunkPushNotifications(messages);

        for (const chunk of chunks) {
            try {
                const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
                // Não vamos lidar com receipts por enquanto para simplificar, mas logamos erros
                this.logger.log(`Notificações enviadas para ${chunk.length} tokens.`);
                this.logger.debug(ticketChunk);
            } catch (error) {
                this.logger.error('Erro ao enviar notificações Push', error);
            }
        }
    }
}
