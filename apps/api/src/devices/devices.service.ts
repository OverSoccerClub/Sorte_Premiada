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

        // Fetch current state to handle history logic
        const currentTerminal = await this.prisma.posTerminal.findUnique({
            where: { deviceId: data.deviceId },
            select: { currentUserId: true }
        });

        if (data.currentUserId) {
            connectUser = { connect: { id: data.currentUserId } };
            updateData.currentUser = connectUser;

            // Only update lastUser if the user CHANGED (A -> B transitions)
            // If it's the same user sending heartbeat, keep lastUser as the *previous* one.
            if (currentTerminal && currentTerminal.currentUserId && currentTerminal.currentUserId !== data.currentUserId) {
                // User changed A -> B. Last User becomes A.
                updateData.lastUser = { connect: { id: currentTerminal.currentUserId } };
            }
            // If currentUserId was null before (New Login), technically lastUser should be whoever was before that.
            // But if we don't touch lastUser here, it remains correct!

        } else if (data.currentUserId === null) {
            updateData.currentUser = { disconnect: true };

            // User Logout (A -> null). Last User must become A.
            if (currentTerminal && currentTerminal.currentUserId) {
                updateData.lastUser = { connect: { id: currentTerminal.currentUserId } };
            }
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
                // On create, lastUser is logicless, let's set it to current or null
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
