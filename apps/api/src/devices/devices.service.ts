import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DevicesService {
    constructor(private prisma: PrismaService) { }

    async register(data: { deviceId: string; model?: string; appVersion?: string }) {
        return this.prisma.posTerminal.upsert({
            where: { deviceId: data.deviceId },
            update: {
                model: data.model,
                appVersion: data.appVersion,
                lastSeenAt: new Date(),
                status: 'ONLINE',
            },
            create: {
                deviceId: data.deviceId,
                model: data.model,
                appVersion: data.appVersion,
                status: 'ONLINE',
            },
        });
    }

    async heartbeat(data: { deviceId: string; latitude?: number; longitude?: number; currentUserId?: string }) {
        console.log(`[API Heartbeat] Device: ${data.deviceId}, UserID: ${data.currentUserId}`);

        let connectUser = undefined;
        if (data.currentUserId) {
            connectUser = { connect: { id: data.currentUserId } };
        } else {
            // If null explicitly sent, disconnect (optional, assumes logged out)
            // But for safety, let's only disconnect if we know
        }

        // Prepare update payload
        const updateData: any = {
            lastSeenAt: new Date(),
            status: 'ONLINE',
            latitude: data.latitude,
            longitude: data.longitude,
        };
        if (connectUser) {
            updateData.currentUser = connectUser;
        } else if (data.currentUserId === null) {
            updateData.currentUser = { disconnect: true };
        }

        return this.prisma.posTerminal.upsert({
            where: { deviceId: data.deviceId },
            update: updateData,
            create: {
                deviceId: data.deviceId,
                status: 'ONLINE',
                lastSeenAt: new Date(),
                latitude: data.latitude,
                longitude: data.longitude,
                currentUser: connectUser
            },
        });
    }

    async findAll() {
        return this.prisma.posTerminal.findMany({
            include: {
                currentUser: {
                    select: {
                        name: true,
                        username: true,
                    },
                },
            },
            orderBy: {
                lastSeenAt: 'desc',
            },
        });
    }
}
