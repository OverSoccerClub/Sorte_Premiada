import { SetMetadata } from '@nestjs/common';

/**
 * Decorator para pular verificação de licença em endpoints específicos
 * Útil para endpoints públicos ou de autenticação
 * 
 * Uso:
 * @SkipLicenseCheck()
 * @Get('public-endpoint')
 */
export const SkipLicenseCheck = () => SetMetadata('skipLicenseCheck', true);
