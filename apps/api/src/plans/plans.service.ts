import { Injectable, NotFoundException, ConflictException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/plans.dto';
import { Prisma, TransactionType } from '@prisma/client';
import { FinanceService } from '../finance/finance.service';

@Injectable()
export class PlansService {
    private readonly logger = new Logger(PlansService.name);

    constructor(
        private prisma: PrismaService,
        private financeService: FinanceService,
    ) { }

    private serializePlan(plan: any) {
        return {
            ...plan,
            price: Number(plan.price)
        };
    }

    async create(data: CreatePlanDto) {
        this.logger.log(`Creating new plan: ${data.name}`);
        this.logger.debug(`Plan data: ${JSON.stringify(data)}`);

        try {
            // Verifica se nome já existe
            const existing = await this.prisma.plan.findUnique({
                where: { name: data.name }
            });

            if (existing) {
                this.logger.warn(`Plan with name "${data.name}" already exists`);
                throw new ConflictException('Já existe um plano com este nome.');
            }

            // Se este for o padrão, remover padrão dos outros
            if (data.isDefault) {
                this.logger.log('Setting this plan as default, removing default from others');
                await this.prisma.plan.updateMany({
                    where: { isDefault: true },
                    data: { isDefault: false }
                });
            }

            // Converte price para Decimal do Prisma
            const priceDecimal = new Prisma.Decimal(data.price);
            this.logger.debug(`Converted price to Decimal: ${priceDecimal}`);

            const plan = await this.prisma.plan.create({
                data: {
                    name: data.name,
                    description: data.description,
                    price: priceDecimal,
                    maxUsers: data.maxUsers,
                    maxTicketsPerMonth: data.maxTicketsPerMonth,
                    maxGames: data.maxGames,
                    maxActiveDevices: data.maxActiveDevices,
                    features: data.features || [],
                    isActive: data.isActive !== undefined ? data.isActive : true,
                    isDefault: data.isDefault || false,
                }
            });

            this.logger.log(`Plan created successfully: ${plan.id}`);
            return this.serializePlan(plan);
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            this.logger.error(`Error creating plan: ${error.message}`, error.stack);
            throw new BadRequestException(`Erro ao criar plano: ${error.message}`);
        }
    }

    async findAll(includeInactive = false) {
        this.logger.log(`Finding all plans (includeInactive: ${includeInactive})`);

        try {
            const plans = await this.prisma.plan.findMany({
                where: includeInactive ? {} : { isActive: true },
                orderBy: { price: 'asc' },
                include: {
                    _count: {
                        select: { companies: true }
                    }
                }
            });

            this.logger.log(`Found ${plans.length} plans`);
            return plans.map(p => this.serializePlan(p));
        } catch (error) {
            this.logger.error(`Error finding plans: ${error.message}`, error.stack);
            throw new BadRequestException(`Erro ao buscar planos: ${error.message}`);
        }
    }

    async findOne(id: string) {
        this.logger.log(`Finding plan by id: ${id}`);

        try {
            const plan = await this.prisma.plan.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: { companies: true }
                    }
                }
            });

            if (!plan) {
                this.logger.warn(`Plan not found: ${id}`);
                throw new NotFoundException('Plano não encontrado');
            }

            return this.serializePlan(plan);
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Error finding plan: ${error.message}`, error.stack);
            throw new BadRequestException(`Erro ao buscar plano: ${error.message}`);
        }
    }

    async update(id: string, data: UpdatePlanDto) {
        this.logger.log(`Updating plan: ${id}`);
        this.logger.debug(`Update data: ${JSON.stringify(data)}`);

        try {
            // Se este for o padrão, remover padrão dos outros
            if (data.isDefault) {
                this.logger.log('Setting this plan as default, removing default from others');
                await this.prisma.plan.updateMany({
                    where: { isDefault: true, id: { not: id } },
                    data: { isDefault: false }
                });
            }

            // Prepara dados para atualização
            const updateData: any = {
                ...data,
                updatedAt: new Date(),
            };

            // Converte price para Decimal se fornecido
            if (data.price !== undefined) {
                updateData.price = new Prisma.Decimal(data.price);
                this.logger.debug(`Converted price to Decimal: ${updateData.price}`);
            }

            const plan = await this.prisma.plan.update({
                where: { id },
                data: updateData
            });

            this.logger.log(`Plan updated successfully: ${plan.id}`);
            return this.serializePlan(plan);
        } catch (error) {
            if (error.code === 'P2002') {
                this.logger.warn(`Duplicate plan name in update`);
                throw new ConflictException('Já existe um plano com este nome.');
            }
            if (error.code === 'P2025') {
                this.logger.warn(`Plan not found for update: ${id}`);
                throw new NotFoundException('Plano não encontrado');
            }
            this.logger.error(`Error updating plan: ${error.message}`, error.stack);
            throw new BadRequestException(`Erro ao atualizar plano: ${error.message}`);
        }
    }

    async remove(id: string) {
        this.logger.log(`Removing plan: ${id}`);

        try {
            const plan = await this.prisma.plan.delete({
                where: { id }
            });

            this.logger.log(`Plan removed successfully: ${id}`);
            return this.serializePlan(plan);
        } catch (error) {
            if (error.code === 'P2003') {
                this.logger.warn(`Cannot delete plan with companies: ${id}`);
                throw new BadRequestException('Não é possível remover um plano que possui empresas vinculadas');
            }
            if (error.code === 'P2025') {
                this.logger.warn(`Plan not found for deletion: ${id}`);
                throw new NotFoundException('Plano não encontrado');
            }
            this.logger.error(`Error removing plan: ${error.message}`, error.stack);
            throw new BadRequestException(`Erro ao remover plano: ${error.message}`);
        }
    }

    async applyPlanToCompany(companyId: string, planId: string, masterUserId?: string) {
        this.logger.log(`Applying plan ${planId} to company ${companyId}`);

        try {
            const planRaw = await this.prisma.plan.findUnique({ where: { id: planId } });
            if (!planRaw) {
                this.logger.warn(`Plan not found: ${planId}`);
                throw new NotFoundException('Plano não encontrado');
            }

            // Calcular data de expiração (1 mês a partir de agora)
            const now = new Date();
            const licenseExpiresAt = new Date(now);
            licenseExpiresAt.setMonth(licenseExpiresAt.getMonth() + 1);

            const company = await this.prisma.company.update({
                where: { id: companyId },
                data: {
                    planId: planRaw.id,
                    // Copia valores do plano como snapshot
                    maxUsers: planRaw.maxUsers,
                    maxTicketsPerMonth: planRaw.maxTicketsPerMonth,
                    maxGames: planRaw.maxGames,
                    maxActiveDevices: planRaw.maxActiveDevices,
                    monthlyPrice: planRaw.price,
                    // Define status como ACTIVE e data de expiração
                    licenseStatus: 'ACTIVE',
                    licenseExpiresAt: licenseExpiresAt,
                    isActive: true,
                }
            });

            // Criar registro financeiro
            if (masterUserId) {
                try {
                    // Calcular valor total: Preço do plano × Máximo de usuários
                    const totalAmount = Number(planRaw.price) * planRaw.maxUsers;

                    await this.financeService.createTransaction(
                        masterUserId,
                        companyId,
                        {
                            description: `Ativação Plano ${planRaw.name} - Empresa: ${company.companyName} (${planRaw.maxUsers} usuários)`,
                            amount: totalAmount,
                            type: TransactionType.CREDIT,
                        }
                    );
                    this.logger.log(`Financial transaction created for plan application: R$ ${totalAmount.toFixed(2)}`);
                } catch (error) {
                    this.logger.error(`Failed to create financial transaction: ${error.message}`);
                    // Não falhar a aplicação do plano se a transação falhar
                }
            }

            this.logger.log(`Plan applied successfully to company ${companyId}`);
            return company;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Error applying plan to company: ${error.message}`, error.stack);
            throw new BadRequestException(`Erro ao aplicar plano: ${error.message}`);
        }
    }
}
