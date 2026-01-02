import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinanceService } from '../finance/finance.service';
import { User, Prisma } from '@prisma/client';
import { AuditLogService } from '../audit/audit-log.service';

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => FinanceService))
        private financeService: FinanceService,
        private auditLog: AuditLogService
    ) { }

    async findOne(username: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { username },
        });
    }

    async create(data: Prisma.UserCreateInput): Promise<User> {
        if (data.role === 'COBRADOR') {
            const now = new Date();
            // Generate credentials if not provided (or force them for dynamic behavior)
            // Ideally we force them unless it's a manual override which we support via data

            if (!data.username) {
                data.username = this.generateMatricula();
                data.usernameExpiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48h
            }
            // Ensure expiry is set if username is set manually?
            // Let's assume if creating a cobrador, we set initial expiry.
            if (!data.usernameExpiresAt) {
                data.usernameExpiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
            }

            if (!data.securityPin) {
                data.securityPin = this.generatePin();
                data.securityPinExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h
            }
            if (!data.securityPinExpiresAt) {
                data.securityPinExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            }
        }

        return this.prisma.user.create({
            data,
        });
    }

    async findAll(username?: string, role?: string, requestingUserId?: string, companyId?: string): Promise<any[]> {
        const where: Prisma.UserWhereInput = {};
        if (username) where.username = username;
        if (role) where.role = role as any;
        if (companyId) where.companyId = companyId;

        if (requestingUserId) {
            const requester = await this.prisma.user.findUnique({
                where: { id: requestingUserId }
            });

            if (requester && requester.role === 'COBRADOR' && requester.areaId) {
                where.areaId = requester.areaId;
            }
        }

        let users = await this.prisma.user.findMany({
            where,
            include: { area: true },
        });

        // Check for expiry and rotate if needed (only for COBRADORES)
        const now = new Date();
        const results = users.map(async (user) => {
            let userToReturn = { ...user } as any;

            if (user.role === 'COBRADOR') {
                let needsUpdate = false;
                const updateData: Prisma.UserUpdateInput = {};

                // Check Username (Matricula) Expiry (48h)
                if (!user.usernameExpiresAt || user.usernameExpiresAt < now) {
                    updateData.username = this.generateMatricula();
                    updateData.usernameExpiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
                    needsUpdate = true;
                }

                // Check PIN Expiry (24h)
                if (!user.securityPinExpiresAt || user.securityPinExpiresAt < now) {
                    updateData.securityPin = this.generatePin();
                    updateData.securityPinExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    // Update user in DB
                    userToReturn = await this.prisma.user.update({
                        where: { id: user.id },
                        data: updateData,
                        include: { area: true }
                    });
                }
            }

            // Always add accountability info for CAMBISTAS
            if (user.role === 'CAMBISTA') {
                userToReturn.accountability = await this.financeService.getAccountabilityInfo(user.id);

                // Add current day cashier status
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date();
                endOfDay.setHours(23, 59, 59, 999);

                const dailyClose = await this.prisma.dailyClose.findFirst({
                    where: {
                        closedByUserId: user.id,
                        createdAt: { gte: startOfDay, lte: endOfDay }
                    }
                });
                userToReturn.cashierStatus = dailyClose ? dailyClose.status : 'OPEN';
            }

            return userToReturn;
        });

        return Promise.all(results);
    }

    async findById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    async update(id: string, data: Prisma.UserUpdateInput, adminId?: string): Promise<User> {
        const oldUser = await this.prisma.user.findUnique({ where: { id } });

        const updatedUser = await this.prisma.user.update({
            where: { id },
            data,
        });

        if (adminId) {
            const { password: pw1, ...oldValue } = oldUser || {};
            const { password: pw2, ...newValue } = updatedUser;

            await this.auditLog.log({
                userId: adminId,
                action: 'UPDATE_USER',
                entity: 'User',
                entityId: id,
                oldValue,
                newValue
            });
        }

        return updatedUser;
    }

    async remove(id: string): Promise<User> {
        return this.prisma.user.delete({
            where: { id },
        });
    }

    async updatePushToken(id: string, pushToken: string): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data: { pushToken },
        });
    }

    private generateMatricula(): string {
        // 6 random digits
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    private generatePin(): string {
        // 4 random digits
        return Math.floor(1000 + Math.random() * 9000).toString();
    }
}
