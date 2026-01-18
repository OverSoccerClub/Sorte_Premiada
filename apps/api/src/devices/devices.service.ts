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

        // === BUSCAR DISPOSITIVO EXISTENTE ===
        // Primeiro, tentar encontrar pelo deviceId real
        let currentTerminal = await this.prisma.posTerminal.findUnique({
            where: { deviceId: data.deviceId },
            include: { company: true }
        });

        // Se não encontrou pelo deviceId real, verificar se existe um registro pendente
        // que foi criado pela geração de código mas ainda não foi ativado com este deviceId
        if (!currentTerminal) {
            console.log(`[Heartbeat] Device ${data.deviceId} not found, checking for pending devices...`);

            // Buscar dispositivos pendentes (deviceId começa com "pending-")
            const pendingDevices = await this.prisma.posTerminal.findMany({
                where: {
                    deviceId: { startsWith: 'pending-' },
                    activatedAt: { not: null }, // Apenas dispositivos já ativados mas ainda com deviceId pendente
                },
                include: { company: true }
            });

            // Se encontrou apenas um pendente, assumir que é este dispositivo
            if (pendingDevices.length === 1) {
                currentTerminal = pendingDevices[0];
                console.log(`[Heartbeat] Found pending device ${currentTerminal.id}, updating with real deviceId: ${data.deviceId}`);

                // Atualizar o deviceId pendente com o deviceId real
                currentTerminal = await this.prisma.posTerminal.update({
                    where: { id: currentTerminal.id },
                    data: { deviceId: data.deviceId },
                    include: { company: true }
                });
            } else if (pendingDevices.length > 1) {
                console.warn(`[Heartbeat] Found ${pendingDevices.length} pending devices, cannot determine which one to use. Will create new record.`);
            }
        }

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

        // Usar update ao invés de upsert se já existe
        if (currentTerminal) {
            return this.prisma.posTerminal.update({
                where: { id: currentTerminal.id },
                data: updateData,
            });
        } else {
            // Só criar novo registro se realmente não existe
            console.log(`[Heartbeat] Creating new device record for ${data.deviceId}`);
            return this.prisma.posTerminal.create({
                data: {
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
     * Extrai as iniciais de um nome de empresa
     * Exemplo: "A Perseverança" -> "AP"
     * Exemplo: "Sorte Premiada" -> "SP"
     */
    private extractInitials(companyName: string): string {
        return companyName
            .split(' ')
            .filter(word => word.length > 0)
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2); // Máximo 2 letras
    }

    /**
     * Gera um código de ativação único automaticamente
     * Formato: XX-XXXX-XXXXXX (ex: AP-A3B9-X7K2M5)
     */
    private async generateUniqueActivationCode(company: { initials?: string; companyName: string }): Promise<string> {
        // Usar initials se disponível, senão extrair do nome
        const prefix = company.initials || this.extractInitials(company.companyName);

        let code: string;
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!isUnique && attempts < maxAttempts) {
            // Gera 4 caracteres aleatórios para o meio (letras maiúsculas e números)
            const randomMiddle = Math.random().toString(36).substring(2, 6).toUpperCase();

            // Gera código aleatório de 6 caracteres (letras maiúsculas e números)
            const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

            // Garantir que o prefixo tenha exatamente 2 chars (preencher com X se necessário)
            const formattedPrefix = prefix.substring(0, 2).padEnd(2, 'X').toUpperCase();

            // Formato: XX-XXXX-XXXXXX (Ex: AP-A3B9-X7K2M5)
            code = `${formattedPrefix}-${randomMiddle}-${randomCode}`;

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
        const activationCode = await this.generateUniqueActivationCode({
            initials: company.initials ?? undefined,
            companyName: company.companyName
        });

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
        // Buscar dispositivos da mesma empresa que NÃO têm código de ativação
        // (foram criados por register() antes da ativação)
        const duplicateDevices = await this.prisma.posTerminal.findMany({
            where: {
                companyId: device.companyId,
                activationCode: null, // Dispositivos sem código = criados por register()
                id: { not: device.id } // Excluir o próprio registro do código
            }
        });

        // Deletar todos os dispositivos duplicados criados por register()
        if (duplicateDevices.length > 0) {
            console.log(`[Device Activation] Found ${duplicateDevices.length} duplicate device(s) created by register(). Deleting...`);

            for (const dup of duplicateDevices) {
                console.log(`[Device Activation] Deleting duplicate: ${dup.id} (deviceId: ${dup.deviceId})`);
                await this.prisma.posTerminal.delete({
                    where: { id: dup.id }
                });
            }
        }

        // Verificar se já existe um dispositivo ATIVADO com este deviceId físico
        // IMPORTANTE: Ignora dispositivos arquivados (deviceId começando com "archived_")
        const existingActiveDevice = await this.prisma.posTerminal.findFirst({
            where: {
                AND: [
                    { deviceId },
                    { deviceId: { not: { startsWith: 'archived_' } } } // Ignora dispositivos arquivados
                ],
                activatedAt: { not: null }, // Apenas dispositivos já ativados
                id: { not: device.id }
            },
            include: { company: true }
        });

        if (existingActiveDevice) {
            // Dispositivo já ativado em outra empresa
            if (existingActiveDevice.companyId !== device.companyId) {
                throw new ForbiddenException(
                    `Este dispositivo já está vinculado à empresa "${existingActiveDevice.company?.companyName || 'Outra Empresa'}". ` +
                    `Entre em contato com o suporte para liberação.`
                );
            }

            // Mesmo dispositivo, mesma empresa - arquivar o antigo
            console.log(`[Device Activation] Archiving old activation: ${existingActiveDevice.id}`);
            await this.prisma.posTerminal.update({
                where: { id: existingActiveDevice.id },
                data: {
                    deviceId: `archived_${Date.now()}_${deviceId.substring(0, 50)}`,
                    isActive: false,
                    status: 'OFFLINE',
                    deviceToken: null
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
    async deactivateDevice(deviceId: string, companyId?: string) {
        const where: any = { id: deviceId };
        if (companyId) {
            where.companyId = companyId;
        }

        const device = await this.prisma.posTerminal.findFirst({
            where
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
    async reactivateDevice(deviceId: string, companyId?: string) {
        const where: any = { id: deviceId };
        if (companyId) {
            where.companyId = companyId;
        }

        const device = await this.prisma.posTerminal.findFirst({
            where
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
     * Deleta TODOS os registros relacionados ao deviceId físico.
     */
    async forceUnbind(deviceId: string) {
        // Buscar TODOS os registros relacionados ao deviceId
        const devices = await this.prisma.posTerminal.findMany({
            where: {
                OR: [
                    { deviceId: deviceId },
                    { deviceId: { contains: deviceId } },
                    { deviceId: { startsWith: 'archived' } },
                    { deviceId: { startsWith: 'pending' } }
                ]
            },
            include: {
                company: {
                    select: {
                        companyName: true
                    }
                }
            }
        });

        if (devices.length === 0) {
            throw new NotFoundException(`Nenhum dispositivo encontrado com deviceId: ${deviceId}`);
        }

        // Deletar todos os registros encontrados
        const deletedIds = [];
        for (const device of devices) {
            await this.prisma.posTerminal.delete({
                where: { id: device.id }
            });
            deletedIds.push(device.id);
        }

        return {
            message: `${devices.length} registro(s) deletado(s) com sucesso`,
            deletedCount: devices.length,
            deletedDevices: devices.map(d => ({
                id: d.id,
                deviceId: d.deviceId,
                companyName: d.company?.companyName || 'Sem empresa',
                activatedAt: d.activatedAt
            }))
        };
    }

    /**
     * Remove registros duplicados de dispositivos
     * Mantém o registro com activationCode e mescla informações do registro sem código
     * Endpoint: POST /devices/cleanup-duplicates
     */
    async cleanupDuplicateDevices(companyId: string) {
        console.log(`[Cleanup] Starting duplicate cleanup for company: ${companyId}`);

        // Buscar todos os dispositivos da empresa
        const devices = await this.prisma.posTerminal.findMany({
            where: { companyId },
            include: { currentUser: true, lastUser: true }
        });

        console.log(`[Cleanup] Found ${devices.length} total devices for company`);

        // Agrupar por deviceId real (ignorar pending- e archived_)
        const deviceGroups = new Map<string, typeof devices>();

        for (const device of devices) {
            // Ignorar dispositivos pendentes ou arquivados
            if (device.deviceId.startsWith('pending-') || device.deviceId.startsWith('archived_')) {
                continue;
            }

            const existing = deviceGroups.get(device.deviceId) || [];
            existing.push(device);
            deviceGroups.set(device.deviceId, existing);
        }

        console.log(`[Cleanup] Found ${deviceGroups.size} unique deviceIds`);

        let totalMerged = 0;
        let totalDeleted = 0;

        // Processar grupos com duplicatas
        for (const [deviceId, group] of Array.from(deviceGroups.entries())) {
            if (group.length <= 1) continue;

            console.log(`[Cleanup] Found ${group.length} duplicates for deviceId: ${deviceId}`);

            // Encontrar o registro com activationCode (preferencial)
            const withCode = group.find(d => d.activationCode);
            const withoutCode = group.filter(d => !d.activationCode);

            if (withCode && withoutCode.length > 0) {
                // Mesclar informações do registro sem código para o registro com código
                const mergedData: any = {};

                for (const dup of withoutCode) {
                    if (dup.currentUserId && !withCode.currentUserId) mergedData.currentUserId = dup.currentUserId;
                    if (dup.lastUserId && !withCode.lastUserId) mergedData.lastUserId = dup.lastUserId;
                    if (dup.latitude && !withCode.latitude) mergedData.latitude = dup.latitude;
                    if (dup.longitude && !withCode.longitude) mergedData.longitude = dup.longitude;
                    if (dup.model && !withCode.model) mergedData.model = dup.model;
                    if (dup.appVersion && !withCode.appVersion) mergedData.appVersion = dup.appVersion;
                    if (dup.lastSeenAt > withCode.lastSeenAt) mergedData.lastSeenAt = dup.lastSeenAt;
                    if (dup.status === 'ONLINE' && withCode.status !== 'ONLINE') mergedData.status = dup.status;
                }

                // Atualizar registro com código se houver dados para mesclar
                if (Object.keys(mergedData).length > 0) {
                    await this.prisma.posTerminal.update({
                        where: { id: withCode.id },
                        data: mergedData
                    });
                    console.log(`[Cleanup] Merged data into device ${withCode.id}:`, Object.keys(mergedData));
                    totalMerged++;
                }

                // Deletar duplicados
                for (const dup of withoutCode) {
                    await this.prisma.posTerminal.delete({
                        where: { id: dup.id }
                    });
                    console.log(`[Cleanup] Deleted duplicate: ${dup.id}`);
                    totalDeleted++;
                }
            } else if (!withCode && withoutCode.length > 1) {
                // Se não há registro com código, manter o mais recente e deletar os outros
                const sorted = withoutCode.sort((a, b) => b.lastSeenAt.getTime() - a.lastSeenAt.getTime());
                const toKeep = sorted[0];
                const toDelete = sorted.slice(1);

                for (const dup of toDelete) {
                    await this.prisma.posTerminal.delete({
                        where: { id: dup.id }
                    });
                    console.log(`[Cleanup] Deleted duplicate without code: ${dup.id}`);
                    totalDeleted++;
                }
            }
        }

        return {
            message: 'Limpeza concluída com sucesso',
            totalDevices: devices.length,
            uniqueDevices: deviceGroups.size,
            totalMerged,
            totalDeleted
        };
    }

    /**
     * Remove permanentemente um dispositivo por ID
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
