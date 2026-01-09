import { Controller, Request, Post, UseGuards, Body, UnauthorizedException, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    async login(@Body() body: any) {
        const user = await this.authService.validateUser(body.username, body.password);
        if (!user) {
            throw new UnauthorizedException('Credenciais inválidas');
        }
        return this.authService.login(user, body.twoFactorCode, body.deviceId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('mfa/generate')
    async generateMfa(@Request() req: any) {
        return this.authService.generateTwoFactorSecret(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('mfa/enable')
    async enableMfa(@Request() req: any, @Body() body: { secret: string, code: string }) {
        return this.authService.enableTwoFactor(req.user.userId, body.secret, body.code);
    }

    @UseGuards(JwtAuthGuard)
    @Post('mfa/disable')
    async disableMfa(@Request() req: any) {
        return this.authService.disableTwoFactor(req.user.userId);
    }
}
