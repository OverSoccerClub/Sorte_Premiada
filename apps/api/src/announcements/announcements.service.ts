import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AnnouncementsService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService
    ) { }

    async create(data: { title: string; content: string; type: string; expiresAt?: Date; targetUserId?: string; sendPush?: boolean; companyId?: string }) {
        const announcement = await this.prisma.announcement.create({
            data: {
                title: data.title,
                content: data.content,
                type: data.type,
                expiresAt: data.expiresAt,
                targetUserId: data.targetUserId,
                companyId: data.companyId,
            },
        });

        // Send Push Notification if enabled
        if (data.sendPush !== false) {
            try {
                let tokens: string[] = [];

                if (data.targetUserId) {
                    // Targeted Announcement
                    const user = await this.prisma.user.findUnique({
                        where: { id: data.targetUserId },
                        select: { pushToken: true }
                    });
                    if (user?.pushToken) {
                        tokens.push(user.pushToken);
                    }
                } else {
                    // Global Announcement (Scyalred to Company)
                    const whereClause: any = {
                        isActive: true,
                        pushToken: { not: null }
                    };

                    if (data.companyId) {
                        whereClause.companyId = data.companyId;
                    }

                    const users = await this.prisma.user.findMany({
                        where: whereClause,
                        select: { pushToken: true }
                    });
                    tokens = users.map(u => u.pushToken).filter(t => t !== null) as string[];
                }

                if (tokens.length > 0) {
                    await this.notificationsService.sendPushNotification(
                        tokens,
                        data.title,
                        data.content,
                        { announcementId: announcement.id, type: 'ANNOUNCEMENT' },
                        data.companyId
                    );
                }
            } catch (error) {
                console.error('Failed to send announcement push notification', error);
            }
        }

        return announcement;
    }

    async findAll(companyId?: string) {
        return this.prisma.announcement.findMany({
            where: companyId ? { companyId } : undefined,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findAllActive(userId?: string, companyId?: string) {
        const now = new Date();
        return this.prisma.announcement.findMany({
            where: {
                isActive: true,
                companyId: companyId,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gte: now } },
                ],
                // Show only Global (targetUserId: null) OR Targeted to this user
                AND: [
                    {
                        OR: [
                            { targetUserId: null },
                            { targetUserId: userId }
                        ]
                    }
                ]
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.announcement.findUnique({
            where: { id },
        });
    }

    async update(id: string, data: any) {
        return this.prisma.announcement.update({
            where: { id },
            data,
        });
    }

    async remove(id: string) {
        return this.prisma.announcement.delete({
            where: { id },
        });
    }
}
