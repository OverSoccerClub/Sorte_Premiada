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

    async heartbeat(data: { deviceId: string; latitude?: number; longitude?: number; currentUserId?: string; status?: string }) {
        console.log(`[API Heartbeat] Device: ${data.deviceId}, UserID: ${data.currentUserId}, Status: ${data.status}`);

        let connectUser = undefined;
        let updateData: any = {
            lastSeenAt: new Date(),
            status: data.status || 'ONLINE',
            latitude: data.latitude,
            longitude: data.longitude,
        };

        if (data.currentUserId) {
            connectUser = { connect: { id: data.currentUserId } };
            // Update current user
            updateData.currentUser = connectUser;
            // Also update last user
            updateData.lastUser = connectUser;
        } else if (data.currentUserId === null) {
            updateData.currentUser = { disconnect: true };
            // Do not clear lastUser
        }

        return this.prisma.posTerminal.upsert({
            where: { deviceId: data.deviceId },
            update: updateData,
            create: {
                deviceId: data.deviceId,
                status: data.status || 'ONLINE',
                lastSeenAt: new Date(),
                latitude: data.latitude,
                longitude: data.longitude,
                currentUser: connectUser,
                lastUser: connectUser
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
                lastUser: {
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
