import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationStatus } from '@prisma/client';

@Injectable()
export class NotificationsService {
    private expo = new Expo();
    private readonly logger = new Logger(NotificationsService.name);

    constructor(private prisma: PrismaService) { }

    async sendPushNotification(pushTokens: string[], title: string, body: string, data?: any, companyId?: string) {
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
                this.logger.log(`Notificações enviadas para ${chunk.length} tokens.`);
                this.logger.debug(ticketChunk);

                // Persist logs for each message in chunk
                for (let i = 0; i < chunk.length; i++) {
                    const msg = chunk[i] as any;
                    const ticket = ticketChunk[i] || null;
                    try {
                        await this.prisma.notificationLog.create({
                            data: {
                                pushToken: msg.to,
                                title,
                                body,
                                data: data ?? null,
                                status: ticket && ticket.status === 'ok' ? NotificationStatus.SENT : NotificationStatus.FAILED,
                                response: ticket ? JSON.parse(JSON.stringify(ticket)) : undefined,
                                userId: null,
                                companyId
                            }
                        });
                    } catch (e) {
                        this.logger.warn('Failed to persist notification log', e?.message ?? e);
                    }
                }
            } catch (error) {
                this.logger.error('Erro ao enviar notificações Push', error);
                // Persist failed logs for this chunk
                for (const msg of chunk) {
                    try {
                        await this.prisma.notificationLog.create({
                            data: {
                                pushToken: (msg as any).to,
                                title,
                                body,
                                data: data ?? null,
                                status: NotificationStatus.FAILED,
                                response: { error: String(error) },
                                userId: null
                            }
                        });
                    } catch (e) {
                        this.logger.warn('Failed to persist failed notification log', e?.message ?? e);
                    }
                }
            }
        }
    }

    async sendToRole(role: 'MASTER' | 'ADMIN' | 'CAMBISTA' | 'COBRADOR', title: string, body: string, data?: any, companyId?: string) {
        try {
            const where: any = { role: role, isActive: true, pushToken: { not: null } };
            if (companyId) {
                where.companyId = companyId;
            }

            const users = await this.prisma.client.user.findMany({
                where: where,
                select: { pushToken: true }
            });

            const tokens = users.map((u: { pushToken: string | null }) => u.pushToken).filter((t: string | null) => t !== null) as string[];

            if (tokens.length > 0) {
                await this.sendPushNotification(tokens, title, body, data, companyId);
                this.logger.log(`Notificação enviada para ${tokens.length} usuários com role ${role}`);
            }
        } catch (error) {
            this.logger.error(`Erro ao enviar notificação para role ${role}`, error);
        }
    }
}

