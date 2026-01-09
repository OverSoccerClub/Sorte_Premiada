import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DevicesService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService
    ) { }

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

        // Fetch current terminal state
        const currentTerminal = await this.prisma.posTerminal.findUnique({
            where: { deviceId: data.deviceId },
            include: { company: true }
        });

        // === VALIDAÇÃO DE LIMITES ===
        // Se está tentando ficar ONLINE, validar limites
        if (data.status === 'ONLINE' || (data.currentUserId && (!currentTerminal || currentTerminal.status !== 'ONLINE'))) {
            // 1. Verificar se dispositivo tem empresa vinculada
            if (currentTerminal?.companyId && currentTerminal.company) {
                const company = currentTerminal.company;

                // 2. Contar dispositivos ativos da empresa (excluindo este)
                const activeDevicesCount = await this.prisma.posTerminal.count({
                    where: {
                        companyId: company.id,
                        status: 'ONLINE',
                        deviceId: { not: data.deviceId }
                    }
                });

                // 3. Verificar se atingiu o limite
                if (activeDevicesCount >= company.maxActiveDevices) {
                    throw new Error(
                        `Limite de ${company.maxActiveDevices} dispositivos ativos atingido. ` +
                        `Faça upgrade do plano para adicionar mais dispositivos.`
                    );
                }
            }

            // 4. SESSÃO ÚNICA: Se userId fornecido, deslogar de outros dispositivos
            if (data.currentUserId) {
                const otherDevices = await this.prisma.posTerminal.updateMany({
                    where: {
                        currentUserId: data.currentUserId,
                        deviceId: { not: data.deviceId }
                    },
                    data: {
                        status: 'OFFLINE',
                        lastUserId: data.currentUserId,
                        currentUserId: null
                    }
                });

                if (otherDevices.count > 0) {
                    console.log(`[Session Control] User ${data.currentUserId} logged out from ${otherDevices.count} other device(s)`);
                }
            }
        }

        // === ATUALIZAÇÃO DO DISPOSITIVO ===
        let connectUser = undefined;
        let updateData: any = {
            lastSeenAt: new Date(),
            status: data.status || 'ONLINE',
        };

        // Only update location if provided (preserve last known location)
        if (data.latitude !== undefined && data.latitude !== null) {
            updateData.latitude = data.latitude;
        }
        if (data.longitude !== undefined && data.longitude !== null) {
            updateData.longitude = data.longitude;
        }

        if (data.currentUserId) {
            connectUser = { connect: { id: data.currentUserId } };
            updateData.currentUser = connectUser;

            // Only update lastUser if the user CHANGED (A -> B transitions)
            if (currentTerminal?.currentUserId && currentTerminal.currentUserId !== data.currentUserId) {
                updateData.lastUser = { connect: { id: currentTerminal.currentUserId } };
            }

        } else if (data.currentUserId === null) {
            updateData.currentUser = { disconnect: true };

            // User Logout (A -> null). Last User must become A.
            if (currentTerminal?.currentUserId) {
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
                company: true,
            },
            orderBy: {
                lastSeenAt: 'desc',
            },
        });
    }

    /**
     * Lista dispositivos com filtro multi-tenant
     * MASTER: vê todos os dispositivos
     * ADMIN: vê apenas dispositivos da empresa
     */
    async findAllFiltered(where: any = {}) {
        return this.prisma.posTerminal.findMany({
            where: {
                ...where,
                // status: 'ONLINE'
            },
            include: {
                company: {
                    select: {
                        id: true,
                        companyName: true,
                        slug: true,
                        primaryColor: true
                    }
                },
                currentUser: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        role: true
                    }
                },
                lastUser: {
                    select: {
                        name: true,
                        username: true
                    }
                }
            },
            orderBy: {
                lastSeenAt: 'desc'
            }
        });
    }

    /**
     * Lista dispositivos com localização GPS para exibição em mapa
     * MASTER: vê todos os dispositivos
     * ADMIN: vê apenas dispositivos da empresa
     */
    async findAllWithLocation(where: any = {}) {
        const devices = await this.prisma.posTerminal.findMany({
            where: {
                ...where,
                status: 'ONLINE',
                latitude: { not: null },
                longitude: { not: null }
            },
            include: {
                company: {
                    select: {
                        id: true,
                        companyName: true,
                        primaryColor: true,
                        slug: true
                    }
                },
                currentUser: {
                    select: {
                        id: true,
                        name: true,
                        username: true
                    }
                }
            },
            orderBy: {
                lastSeenAt: 'desc'
            }
        });

        // Formatar dados para o mapa
        return devices.map(d => ({
            id: d.id,
            deviceId: d.deviceId,
            latitude: d.latitude,
            longitude: d.longitude,
            company: d.company,
            user: d.currentUser,
            lastSeen: d.lastSeenAt,
            model: d.model,
            appVersion: d.appVersion
        }));
    }

    // ========================================
    // SISTEMA DE ATIVAÇÃO DE DISPOSITIVOS POS
    // ========================================

    /**
     * Gera um código de ativação único automaticamente
     * Formato: SIGLA-ANO-CÓDIGO (ex: AP-2024-XYZ123)
     */
    private async generateUniqueActivationCode(companySlug: string): Promise<string> {
        const year = new Date().getFullYear();
        const prefix = companySlug.substring(0, 2).toUpperCase(); // Primeiras 2 letras da sigla

        let code: string;
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!isUnique && attempts < maxAttempts) {
            // Gera código aleatório de 6 caracteres (letras maiúsculas e números)
            const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            code = `${prefix}-${year}-${randomCode}`;

            // Verifica se já existe
            const existing = await this.prisma.posTerminal.findUnique({
                where: { activationCode: code }
            });

            if (!existing) {
                isUnique = true;
                return code;
            }

            attempts++;
        }

        throw new BadRequestException('Não foi possível gerar um código único. Tente novamente.');
    }

    /**
     * Gera um novo código de ativação para um dispositivo POS
     * Endpoint: POST /devices/generate-code
     */
    async generateActivationCode(companyId: string, data: { name: string; description?: string }) {
        // Buscar informações da empresa
        const company = await this.prisma.company.findUnique({
            where: { id: companyId }
        });

        if (!company) {
            throw new NotFoundException('Empresa não encontrada');
        }

        // Gerar código único
        const activationCode = await this.generateUniqueActivationCode(company.slug);

        // Criar registro de dispositivo pendente de ativação
        const device = await this.prisma.posTerminal.create({
            data: {
                deviceId: `pending-${activationCode}`, // Temporário até ativação
                name: data.name,
                description: data.description,
                activationCode,
                companyId,
                status: 'OFFLINE',
                isActive: false // Inativo até ser ativado
            },
            include: {
                company: {
                    select: {
                        companyName: true,
                        slug: true
                    }
                }
            }
        });

        return {
            id: device.id,
            name: device.name,
            description: device.description,
            activationCode: device.activationCode,
            company: device.company,
            createdAt: device.createdAt
        };
    }

    /**
     * Ativa um dispositivo usando o código de ativação
     * Endpoint: POST /devices/activate (público)
     */
    async activateDevice(activationCode: string, deviceId: string) {
        // Buscar dispositivo pelo código de ativação
        const device = await this.prisma.posTerminal.findUnique({
            where: { activationCode },
            include: {
                company: {
                    select: {
                        id: true,
                        companyName: true,
                        slogan: true,
                        logoUrl: true,
                        primaryColor: true,
                        phone: true,
                        whatsapp: true,
                        email: true,
                        updateUrl: true
                    }
                }
            }
        });

        if (!device) {
            throw new NotFoundException('Código de ativação inválido');
        }

        if (device.activatedAt) {
            throw new BadRequestException('Este código já foi utilizado');
        }

        if (!device.company) {
            throw new BadRequestException('Dispositivo não está vinculado a nenhuma empresa');
        }

        // === CONFLICT RESOLUTION ===
        // Verificar se já existe um dispositivo registrado com este deviceId físico
        // Isso acontece se o app for reinstalado ou dados limpos no mesmo aparelho
        const existingDevice = await this.prisma.posTerminal.findUnique({
            where: { deviceId }
        });

        if (existingDevice && existingDevice.id !== device.id) {
            // Verificar se pertence a OUTRA empresa
            // O dispositivo registrado (existingDevice) pode não ter companyId carregado aqui se não fizermos include.
            // O findUnique acima { where: { deviceId } } não tinha include. Mas o model tem companyId.
            // Vamos assumir que existingDevice.companyId está disponível.

            // Buscar informações completas do dispositivo existente para verificar empresa e nome
            const conflictDevice = await this.prisma.posTerminal.findUnique({
                where: { id: existingDevice.id },
                include: { company: true }
            });

            if (conflictDevice?.companyId && conflictDevice.companyId !== device.companyId) {
                // Bloqueio de Segurança: Dispositivo vinculado a outra empresa
                throw new ForbiddenException(
                    `Este dispositivo já está vinculado à empresa "${conflictDevice.company?.companyName || 'Outra Empresa'}". ` +
                    `Entre em contato com o suporte para liberação.`
                );
            }

            console.warn(`[Device Activation] Re-install detected within same company. Archiving old device record ${existingDevice.id} to release deviceId ${deviceId}`);

            // Se for a MESMA empresa, permite (Reinstalação/Limpeza de Cache)
            // Arquivar o registro antigo para liberar o deviceId
            await this.prisma.posTerminal.update({
                where: { id: existingDevice.id },
                data: {
                    // Renomeia para liberar a constraint unique
                    deviceId: `archived_${Date.now()}_${deviceId.substring(0, 50)}`,
                    isActive: false,
                    status: 'OFFLINE',
                    deviceToken: null // Invalida o token antigo
                }
            });
        }


        // Gerar token JWT do dispositivo (válido por 1 ano)
        const deviceToken = this.jwtService.sign(
            {
                deviceId: device.id,
                companyId: device.companyId,
                type: 'device'
            },
            {
                expiresIn: '365d' // Token válido por 1 ano
            }
        );

        // Atualizar dispositivo: marcar como ativado e atualizar deviceId real
        const activatedDevice = await this.prisma.posTerminal.update({
            where: { id: device.id },
            data: {
                deviceId, // Atualiza com o deviceId real do aparelho
                deviceToken,
                activatedAt: new Date(),
                isActive: true,
                status: 'OFFLINE' // Começa offline, ficará online no primeiro heartbeat
            },
            include: {
                company: {
                    select: {
                        id: true,
                        companyName: true,
                        slogan: true,
                        logoUrl: true,
                        primaryColor: true,
                        phone: true,
                        whatsapp: true,
                        email: true,
                        updateUrl: true
                    }
                }
            }
        });

        return {
            deviceToken,
            companyId: activatedDevice.companyId,
            companySettings: activatedDevice.company,
            device: {
                id: activatedDevice.id,
                name: activatedDevice.name,
                description: activatedDevice.description,
                activatedAt: activatedDevice.activatedAt
            }
        };
    }

    /**
     * Valida o token de um dispositivo
     * Usado pelo PosDeviceGuard
     */
    async validateDeviceToken(token: string) {
        try {
            // Verificar e decodificar o token JWT
            const payload = this.jwtService.verify(token);

            if (payload.type !== 'device') {
                throw new UnauthorizedException('Token inválido');
            }

            // Buscar dispositivo no banco
            const device = await this.prisma.posTerminal.findUnique({
                where: { id: payload.deviceId },
                include: {
                    company: true
                }
            });

            if (!device) {
                throw new UnauthorizedException('Dispositivo não encontrado');
            }

            if (!device.isActive) {
                throw new UnauthorizedException('Dispositivo desativado');
            }

            if (device.deviceToken !== token) {
                throw new UnauthorizedException('Token inválido');
            }

            // Atualizar lastSeenAt
            await this.prisma.posTerminal.update({
                where: { id: device.id },
                data: { lastSeenAt: new Date() }
            });

            return device;
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new UnauthorizedException('Token inválido ou expirado');
        }
    }

    /**
     * Desativa um dispositivo remotamente
     * Endpoint: PUT /devices/:id/deactivate
     */
    async deactivateDevice(deviceId: string, companyId: string) {
        const device = await this.prisma.posTerminal.findFirst({
            where: {
                id: deviceId,
                companyId
            }
        });

        if (!device) {
            throw new NotFoundException('Dispositivo não encontrado');
        }

        return this.prisma.posTerminal.update({
            where: { id: deviceId },
            data: {
                isActive: false,
                status: 'OFFLINE'
            }
        });
    }

    /**
     * Reativa um dispositivo
     * Endpoint: PUT /devices/:id/reactivate
     */
    async reactivateDevice(deviceId: string, companyId: string) {
        const device = await this.prisma.posTerminal.findFirst({
            where: {
                id: deviceId,
                companyId
            }
        });

        if (!device) {
            throw new NotFoundException('Dispositivo não encontrado');
        }

        return this.prisma.posTerminal.update({
            where: { id: deviceId },
            data: {
                isActive: true
            }
        });
    }

    /**
     * Força a desvinculação de um dispositivo (MASTER ONLY)
     * Usado para resolver conflitos de licença quando um deviceId está preso em outra empresa.
     */
    async forceUnbind(deviceId: string) {
        // ... legacy code ...
        return this.delete(deviceId);
    }

    /**
     * Remove permanentemente um dispositivo
     */
    async delete(deviceId: string) {
        const device = await this.prisma.posTerminal.findUnique({
            where: { id: deviceId }
        });

        if (!device) {
            throw new NotFoundException('Dispositivo não encontrado');
        }

        return this.prisma.posTerminal.delete({
            where: { id: deviceId }
        });
    }
}
