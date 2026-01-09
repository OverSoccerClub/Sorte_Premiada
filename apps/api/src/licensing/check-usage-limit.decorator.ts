import { SetMetadata } from '@nestjs/common';

/**
 * Decorator para especificar qual tipo de recurso verificar no UsageLimitGuard
 * 
 * Uso:
 * @CheckUsageLimit('users')
 * @Post('create-user')
 * 
 * @CheckUsageLimit('tickets')
 * @Post('create-ticket')
 * 
 * @CheckUsageLimit('games')
 * @Post('create-game')
 */
export const CheckUsageLimit = (resourceType: 'users' | 'tickets' | 'games') =>
    SetMetadata('checkUsageLimit', resourceType);
