import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinanceService } from '../finance/finance.service';
import { User, Prisma } from '@prisma/client';
import { AuditLogService } from '../audit/audit-log.service';
import { getBrazilTime, getBrazilNow, getBrazilStartOfDay, getBrazilEndOfDay } from '../utils/date.util';

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => FinanceService))
        private financeService: FinanceService,
        private auditLog: AuditLogService
    ) { }

    async findOne(username: string): Promise<User | null> {
        return this.prisma.client.user.findUnique({
            where: { username },
        });
    }

    async getArea(areaId: string) {
        return this.prisma.client.area.findUnique({ where: { id: areaId } });
    }

    async create(data: Prisma.UserCreateInput): Promise<User> {
        if (data.role === 'COBRADOR') {
            const now = getBrazilNow();
            // Generate credentials if not provided (or force them for dynamic behavior)
            // Ideally we force them unless it's a manual override which we support via data

            if (!data.username) {
                data.username = this.generateMatricula();
                data.usernameExpiresAt = getBrazilTime().add(48, 'hour').toDate(); // 48h
            }
            // Ensure expiry is set if username is set manually?
            // Let's assume if creating a cobrador, we set initial expiry.
            if (!data.usernameExpiresAt) {
                data.usernameExpiresAt = getBrazilTime().add(48, 'hour').toDate();
            }

            if (!data.securityPin) {
                data.securityPin = this.generatePin();
                data.securityPinExpiresAt = getBrazilTime().add(24, 'hour').toDate(); // 24h
            }
            if (!data.securityPinExpiresAt) {
                data.securityPinExpiresAt = getBrazilTime().add(24, 'hour').toDate();
            }
        }

        return this.prisma.client.user.create({
            data,
        });
    }

    async findAll(username?: string, role?: string, requestingUserId?: string, companyId?: string): Promise<any[]> {
        const where: Prisma.UserWhereInput = {};
        if (username) where.username = username;
        if (role) where.role = role as any;

        // ✅ Filtrar por companyId se fornecido (para isolamento de dados)
        // Se companyId não for fornecido, retorna todos os usuários (para ADMIN/MASTER sem empresa)
        if (companyId) {
            where.companyId = companyId;
        }

        if (requestingUserId) {
            const requester = await this.prisma.client.user.findUnique({
                where: { id: requestingUserId }
            });

            if (requester && requester.role === 'COBRADOR' && requester.areaId) {
                where.areaId = requester.areaId;
            }
        }

        let users = await this.prisma.client.user.findMany({
            where,
            include: {
                area: true,
                company: true // Incluir dados da empresa
            },
        });

        // Check for expiry and rotate if needed (only for COBRADORES)
        const now = getBrazilNow();
        const results = users.map(async (user: User) => {
            let userToReturn = { ...user } as any;

            if (user.role === 'COBRADOR') {
                let needsUpdate = false;
                const updateData: Prisma.UserUpdateInput = {};

                // Check Username (Matricula) Expiry (48h)
                if (!user.usernameExpiresAt || user.usernameExpiresAt < now) {
                    updateData.username = this.generateMatricula();
                    updateData.usernameExpiresAt = getBrazilTime().add(48, 'hour').toDate();
                    needsUpdate = true;
                }

                // Check PIN Expiry (24h)
                if (!user.securityPinExpiresAt || user.securityPinExpiresAt < now) {
                    updateData.securityPin = this.generatePin();
                    updateData.securityPinExpiresAt = getBrazilTime().add(24, 'hour').toDate();
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    // Update user in DB
                    userToReturn = await this.prisma.client.user.update({
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
                const startOfDay = getBrazilStartOfDay();
                const endOfDay = getBrazilEndOfDay();

                const dailyClose = await this.prisma.client.dailyClose.findFirst({
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

    async findById(id: string): Promise<any | null> {
        return this.prisma.client.user.findUnique({
            where: { id },
            include: { area: true }
        });
    }

    async update(id: string, data: Prisma.UserUpdateInput, adminId?: string): Promise<User> {
        const oldUser = await this.prisma.client.user.findUnique({ where: { id } });

        const updatedUser = await this.prisma.client.user.update({
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

    async updatePermissionsByRole(role: string, permissions: any) {
        return this.prisma.client.user.updateMany({
            where: { role: role as any },
            data: { permissions }
        });
    }

    async remove(id: string, force: boolean = false): Promise<User> {
        if (force) {
            // Hard Delete with Cascade (MASTER Only via Controller)
            return this.prisma.client.$transaction(async (tx: Prisma.TransactionClient) => {
                // 1. Unlink/Delete POS Terminals connections
                await tx.posTerminal.updateMany({
                    where: { currentUserId: id },
                    data: { currentUserId: null }
                });
                await tx.posTerminal.updateMany({
                    where: { lastUserId: id },
                    data: { lastUserId: null }
                });

                // 2. Delete Financial Records (The "Forbidden" Data)
                await tx.dailyClose.deleteMany({ where: { closedByUserId: id } });
                await tx.transaction.deleteMany({ where: { userId: id } });
                await tx.transaction.deleteMany({ where: { cobradorId: id } });

                // 3. Delete Tickets (Sold and Cancelled)
                await tx.ticket.deleteMany({ where: { userId: id } });
                await tx.ticket.deleteMany({ where: { cancelledByUserId: id } });

                // 4. Delete Logs & Reports
                await tx.notificationLog.deleteMany({ where: { userId: id } });
                await tx.auditLog.deleteMany({ where: { userId: id } });
                await tx.bugReport.deleteMany({ where: { reportedByUserId: id } });
                await tx.bugReport.deleteMany({ where: { assignedToUserId: id } });

                // 5. Finally Delete User
                return tx.user.delete({ where: { id } });
            });
        }

        try {
            return await this.prisma.client.user.delete({
                where: { id },
            });
        } catch (error) {
            // Check for Foreign Key Constraint Violation
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
                // Soft Delete Strategy
                const timestamp = Date.now();
                const user = await this.prisma.client.user.findUnique({ where: { id } });

                if (!user) {
                    throw error; // If user not found, let standard error or 404 propagate (though delete would have failed)
                }

                return this.prisma.client.user.update({
                    where: { id },
                    data: {
                        isActive: false,
                        username: `deleted_${timestamp}_${user.username}`,
                        email: user.email ? `deleted_${timestamp}_${user.email}` : undefined,
                        // Optionally clear sensitive data
                        pushToken: null,
                        twoFactorSecret: null,
                    }
                });
            }

            throw error;
        }
    }


    async updatePushToken(id: string, pushToken: string): Promise<User> {
        return this.prisma.client.user.update({
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

    /**
     * Gera username único baseado no nome do usuário e nome da empresa
     * Formato: primeironome.primeirapalavraempresa
     * Exemplo: "Junior Silva" + "A Perseverança" = "junior.perseveranca"
     */
    async generateUsername(fullName: string, companyId: string): Promise<string> {
        // Buscar nome da empresa
        const company = await this.prisma.client.company.findUnique({
            where: { id: companyId },
            select: { companyName: true }
        });

        if (!company) {
            throw new Error('Empresa não encontrada para gerar username');
        }

        // Função auxiliar para remover acentos e caracteres especiais
        const normalize = (str: string): string => {
            return str
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Remove acentos
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
                .trim();
        };

        // Pegar primeiro nome
        const firstName = normalize(fullName.split(' ')[0]);

        // Pegar primeira palavra significativa da empresa (ignorar artigos)
        const companyWords = normalize(company.companyName).split(' ').filter(w => w.length > 0);
        const companyPart = companyWords.find(w => !['a', 'o', 'as', 'os', 'de', 'da', 'do'].includes(w)) || companyWords[0];

        // Gerar base do username
        let baseUsername = `${firstName}.${companyPart}`;

        // Limitar a 20 caracteres
        if (baseUsername.length > 20) {
            baseUsername = baseUsername.substring(0, 20);
        }

        // Verificar se já existe e adicionar número se necessário
        let username = baseUsername;
        let counter = 1;

        while (await this.findOne(username)) {
            counter++;
            const suffix = counter.toString();
            const maxBaseLength = 20 - suffix.length;
            username = `${baseUsername.substring(0, maxBaseLength)}${suffix}`;
        }

        return username;
    }
}
