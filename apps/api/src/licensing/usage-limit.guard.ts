import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Logger,
    BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LicenseService } from './license.service';

/**
 * Guard que verifica se a empresa excedeu os limites de uso
 * Bloqueia criação de novos recursos se limites foram excedidos
 * 
 * Uso:
 * @UseGuards(UsageLimitGuard)
 * @CheckUsageLimit('users') // ou 'tickets' ou 'games'
 */
@Injectable()
export class UsageLimitGuard implements CanActivate {
    private readonly logger = new Logger(UsageLimitGuard.name);

    constructor(
        private licenseService: LicenseService,
        private reflector: Reflector,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Pegar o tipo de recurso a verificar do decorator
        const resourceType = this.reflector.get<string>(
            'checkUsageLimit',
            context.getHandler(),
        );

        // Se não tem decorator, não verificar
        if (!resourceType) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Se não tem usuário autenticado, deixar o AuthGuard lidar
        if (!user) {
            return true;
        }

        // MASTER pode fazer tudo, sem verificação de limites
        if (user.role === 'MASTER') {
            return true;
        }

        // Verificar se usuário tem companyId
        if (!user.companyId) {
            this.logger.warn(`Usuário ${user.username} sem companyId`);
            throw new ForbiddenException('Usuário não está associado a nenhuma empresa');
        }

        try {
            // Verificar limites de uso
            const limits = await this.licenseService.checkUsageLimits(user.companyId);

            // Verificar o tipo de recurso específico
            let exceeded = false;
            let message = '';

            switch (resourceType) {
                case 'users':
                    exceeded = limits.users.exceeded;
                    if (exceeded) {
                        message = `Limite de usuários excedido! Máximo: ${limits.users.max}, Atual: ${limits.users.current}. Faça upgrade do plano para adicionar mais usuários.`;
                    }
                    break;

                case 'tickets':
                    exceeded = limits.tickets.exceeded;
                    if (exceeded) {
                        message = `Limite de bilhetes do mês excedido! Máximo: ${limits.tickets.max}, Atual: ${limits.tickets.current}. Faça upgrade do plano ou aguarde o próximo mês.`;
                    }
                    break;

                case 'games':
                    exceeded = limits.games.exceeded;
                    if (exceeded) {
                        message = `Limite de jogos excedido! Máximo: ${limits.games.max}, Atual: ${limits.games.current}. Faça upgrade do plano para adicionar mais jogos.`;
                    }
                    break;

                case 'devices':
                    exceeded = limits.devices.exceeded;
                    if (exceeded) {
                        message = `Limite de dispositivos ativos excedido! Máximo: ${limits.devices.max}, Atual: ${limits.devices.current}. Faça upgrade do plano para adicionar mais dispositivos.`;
                    }
                    break;

                default:
                    this.logger.warn(`Tipo de recurso desconhecido: ${resourceType}`);
                    return true;
            }

            if (exceeded) {
                this.logger.warn(
                    `Limite excedido: ${user.username} - Empresa: ${user.companyId} - Recurso: ${resourceType}`,
                );
                throw new ForbiddenException(message);
            }

            // Adicionar informações de limites ao request para uso posterior
            request.usageLimits = limits;

            // Log de aviso se próximo do limite (>80%)
            if (limits.users.percentage > 80) {
                this.logger.warn(
                    `Empresa ${user.companyId} próxima do limite de usuários: ${limits.users.percentage}%`,
                );
            }
            if (limits.tickets.percentage > 80) {
                this.logger.warn(
                    `Empresa ${user.companyId} próxima do limite de bilhetes: ${limits.tickets.percentage}%`,
                );
            }
            if (limits.games.percentage > 80) {
                this.logger.warn(
                    `Empresa ${user.companyId} próxima do limite de jogos: ${limits.games.percentage}%`,
                );
            }
            if (limits.devices?.percentage > 80) {
                this.logger.warn(
                    `Empresa ${user.companyId} próxima do limite de dispositivos: ${limits.devices.percentage}%`,
                );
            }

            return true;
        } catch (error) {
            if (error instanceof ForbiddenException || error instanceof BadRequestException) {
                throw error;
            }

            this.logger.error(`Erro ao verificar limites de uso: ${error.message}`);
            throw new ForbiddenException('Erro ao verificar limites de uso. Tente novamente.');
        }
    }
}
