/**
 * EXEMPLO DE INTEGRAÇÃO DOS GUARDS DE LICENCIAMENTO
 * 
 * Este arquivo mostra como aplicar os guards nos controllers existentes
 * para proteger endpoints críticos
 */

import { Controller, Post, Get, UseGuards, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { LicenseGuard } from '../licensing/license.guard';
import { UsageLimitGuard } from '../licensing/usage-limit.guard';
import { CheckUsageLimit } from '../licensing/check-usage-limit.decorator';
import { SkipLicenseCheck } from '../licensing/skip-license-check.decorator';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

/**
 * EXEMPLO 1: Proteger criação de usuários
 * Verifica licença E limite de usuários
 */
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, LicenseGuard) // Verificar licença em todos os endpoints
export class UsersControllerExample {

    @Post()
    @Roles(Role.ADMIN, 'MASTER')
    @UseGuards(UsageLimitGuard) // Verificar limite de usuários
    @CheckUsageLimit('users')   // Especificar que é limite de usuários
    async createUser(@Body() data: any) {
        // Se chegou aqui:
        // ✅ Usuário está autenticado (JwtAuthGuard)
        // ✅ Usuário tem role ADMIN ou MASTER (RolesGuard)
        // ✅ Licença da empresa está válida (LicenseGuard)
        // ✅ Não excedeu limite de usuários (UsageLimitGuard)

        return { message: 'Usuário criado com sucesso!' };
    }

    @Get()
    @SkipLicenseCheck() // Endpoint público, não verificar licença
    async listUsers() {
        return { users: [] };
    }
}

/**
 * EXEMPLO 2: Proteger criação de bilhetes
 * Verifica licença E limite de bilhetes do mês
 */
@Controller('tickets')
@UseGuards(JwtAuthGuard, LicenseGuard) // Verificar licença em todos os endpoints
export class TicketsControllerExample {

    @Post()
    @UseGuards(UsageLimitGuard) // Verificar limite de bilhetes
    @CheckUsageLimit('tickets')  // Especificar que é limite de bilhetes
    async createTicket(@Body() data: any) {
        // Se chegou aqui:
        // ✅ Usuário está autenticado
        // ✅ Licença da empresa está válida
        // ✅ Não excedeu limite de bilhetes do mês

        return { message: 'Bilhete criado com sucesso!' };
    }
}

/**
 * EXEMPLO 3: Proteger criação de jogos
 * Verifica licença E limite de jogos
 */
@Controller('games')
@UseGuards(JwtAuthGuard, RolesGuard, LicenseGuard)
export class GamesControllerExample {

    @Post()
    @Roles(Role.ADMIN, 'MASTER')
    @UseGuards(UsageLimitGuard) // Verificar limite de jogos
    @CheckUsageLimit('games')    // Especificar que é limite de jogos
    async createGame(@Body() data: any) {
        // Se chegou aqui:
        // ✅ Usuário está autenticado
        // ✅ Usuário tem role ADMIN ou MASTER
        // ✅ Licença da empresa está válida
        // ✅ Não excedeu limite de jogos

        return { message: 'Jogo criado com sucesso!' };
    }
}

/**
 * EXEMPLO 4: Endpoint que NÃO precisa verificar licença
 * Útil para endpoints públicos, autenticação, etc
 */
@Controller('auth')
export class AuthControllerExample {

    @Post('login')
    @SkipLicenseCheck() // Não verificar licença no login
    async login(@Body() data: any) {
        return { token: 'jwt-token' };
    }

    @Post('register')
    @SkipLicenseCheck() // Não verificar licença no registro
    async register(@Body() data: any) {
        return { message: 'Usuário registrado' };
    }
}

/**
 * RESUMO DE COMO APLICAR:
 * 
 * 1. Importar os guards:
 *    import { LicenseGuard } from '../licensing/license.guard';
 *    import { UsageLimitGuard } from '../licensing/usage-limit.guard';
 * 
 * 2. Importar os decorators:
 *    import { CheckUsageLimit } from '../licensing/check-usage-limit.decorator';
 *    import { SkipLicenseCheck } from '../licensing/skip-license-check.decorator';
 * 
 * 3. Aplicar no controller (nível de classe):
 *    @UseGuards(JwtAuthGuard, LicenseGuard)
 * 
 * 4. Aplicar em endpoints específicos (nível de método):
 *    @UseGuards(UsageLimitGuard)
 *    @CheckUsageLimit('users') // ou 'tickets' ou 'games'
 * 
 * 5. Pular verificação quando necessário:
 *    @SkipLicenseCheck()
 * 
 * ORDEM RECOMENDADA DOS GUARDS:
 * 1. JwtAuthGuard (autenticação)
 * 2. RolesGuard (autorização por role)
 * 3. LicenseGuard (verificar licença)
 * 4. UsageLimitGuard (verificar limites)
 */
