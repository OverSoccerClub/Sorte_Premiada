import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { DevicesService } from '../../devices/devices.service';

/**
 * Guard para autenticação de dispositivos POS
 * Valida o token do dispositivo e injeta companyId e deviceId no request
 */
@Injectable()
export class PosDeviceGuard implements CanActivate {
    constructor(private devicesService: DevicesService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const deviceToken = request.headers['x-device-token'];

        if (!deviceToken) {
            throw new UnauthorizedException('Token do dispositivo não fornecido');
        }

        try {
            // Validar token e buscar dispositivo
            const device = await this.devicesService.validateDeviceToken(deviceToken);

            if (!device || !device.isActive) {
                throw new UnauthorizedException('Dispositivo inválido ou inativo');
            }

            // Injetar dados do dispositivo no request para uso nos controllers
            request.companyId = device.companyId;
            request.deviceId = device.id;
            request.device = device;

            return true;
        } catch (error) {
            throw new UnauthorizedException(
                error.message || 'Token do dispositivo inválido ou expirado'
            );
        }
    }
}
