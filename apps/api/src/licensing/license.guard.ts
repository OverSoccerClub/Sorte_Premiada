import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LicenseService } from './license.service';

/**
 * Guard que verifica se a licença da empresa está válida
 * Bloqueia acesso se licença expirada, suspensa ou bloqueada
 * 
 * Uso:
 * @UseGuards(LicenseGuard)
 * ou
 * @SkipLicenseCheck() para pular verificação em endpoints específicos
 */
@Injectable()
export class LicenseGuard implements CanActivate {
    private readonly logger = new Logger(LicenseGuard.name);

    constructor(
        private licenseService: LicenseService,
        private reflector: Reflector,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Verificar se o endpoint tem decorator @SkipLicenseCheck()
        const skipLicenseCheck = this.reflector.get<boolean>(
            'skipLicenseCheck',
            context.getHandler(),
        );

        if (skipLicenseCheck) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Se não tem usuário autenticado, deixar o AuthGuard lidar
        if (!user) {
            return true;
        }

        // MASTER pode fazer tudo, sem verificação de licença
        if (user.role === 'MASTER') {
            return true;
        }

        // Verificar se usuário tem companyId
        if (!user.companyId) {
            this.logger.warn(`Usuário ${user.username} sem companyId`);
            throw new ForbiddenException('Usuário não está associado a nenhuma empresa');
        }

        try {
            // Verificar status da licença
            const licenseStatus = await this.licenseService.checkLicenseStatus(user.companyId);

            // Se licença não é válida, bloquear
            if (!licenseStatus.isValid) {
                this.logger.warn(
                    `Acesso bloqueado: ${user.username} - Empresa: ${licenseStatus.companyName} - Status: ${licenseStatus.status}`,
                );

                // Mensagens específicas por status
                if (licenseStatus.status === 'EXPIRED') {
                    throw new ForbiddenException(
                        `Licença expirada! Entre em contato com o administrador para renovar. Expirou em: ${licenseStatus.licenseExpiresAt?.toLocaleDateString()}`,
                    );
                }

                if (licenseStatus.status === 'SUSPENDED') {
                    throw new ForbiddenException(
                        `Acesso suspenso: ${licenseStatus.suspensionReason || 'Entre em contato com o suporte'}`,
                    );
                }

                if (licenseStatus.status === 'BLOCKED') {
                    throw new ForbiddenException(
                        'Acesso bloqueado. Entre em contato com o suporte.',
                    );
                }

                if (licenseStatus.status === 'CANCELLED') {
                    throw new ForbiddenException(
                        'Licença cancelada. Entre em contato com o administrador.',
                    );
                }

                if (licenseStatus.status === 'TRIAL' && licenseStatus.trialDaysRemaining !== null && licenseStatus.trialDaysRemaining <= 0) {
                    throw new ForbiddenException(
                        'Período de teste expirado! Ative sua licença para continuar usando o sistema.',
                    );
                }

                // Mensagem genérica
                throw new ForbiddenException(
                    `Licença inválida (${licenseStatus.status}). Entre em contato com o administrador.`,
                );
            }

            // Licença válida - adicionar informações ao request para uso posterior
            request.licenseStatus = licenseStatus;

            // Log de avisos se próximo da expiração
            if (licenseStatus.warnings && licenseStatus.warnings.length > 0) {
                this.logger.warn(
                    `Avisos de licença para ${licenseStatus.companyName}: ${licenseStatus.warnings.join(', ')}`,
                );
            }

            return true;
        } catch (error) {
            if (error instanceof ForbiddenException) {
                throw error;
            }

            this.logger.error(`Erro ao verificar licença: ${error.message}`);
            throw new ForbiddenException('Erro ao verificar licença. Tente novamente.');
        }
    }
}
