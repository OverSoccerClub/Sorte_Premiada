import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private prisma: PrismaService,
    ) { }

    async validateUser(username: string, pass: string): Promise<any> {
        console.log(`[AuthService] Validating user: ${username}`);
        const user = await this.usersService.findOne(username);
        if (!user) {
            console.log(`[AuthService] User not found: ${username}`);
            return null;
        }
        console.log(`[AuthService] User found. Hash: ${user.password.substring(0, 10)}...`);
        const isMatch = await bcrypt.compare(pass, user.password);
        console.log(`[AuthService] Password match: ${isMatch}`);
        if (isMatch) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any, twoFactorCode?: string) {
        // If MFA is enabled, we MUST verify the code
        if (user.twoFactorEnabled) {
            if (!twoFactorCode) {
                return {
                    mfa_required: true,
                    userId: user.id,
                    message: 'MFA_REQUIRED'
                };
            }

            const isValid = authenticator.verify({
                token: twoFactorCode,
                secret: user.twoFactorSecret
            });

            if (!isValid) {
                throw new UnauthorizedException('Código MFA inválido');
            }
        }

        const payload = { username: user.username, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
                twoFactorEnabled: user.twoFactorEnabled
            }
        };
    }

    async generateTwoFactorSecret(userId: string) {
        const user = await this.usersService.findById(userId);
        if (!user) throw new UnauthorizedException();

        const secret = authenticator.generateSecret();
        const otpauthUrl = authenticator.keyuri(
            user.username,
            'Sorte Premiada Admin',
            secret,
        );

        const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

        return {
            secret,
            qrCodeDataUrl,
        };
    }

    async enableTwoFactor(userId: string, secret: string, code: string) {
        const isValid = authenticator.verify({
            token: code,
            secret,
        });

        if (!isValid) {
            throw new BadRequestException('Código de ativação inválido');
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorSecret: secret,
                twoFactorEnabled: true,
            },
        });

        return { success: true };
    }

    async disableTwoFactor(userId: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorSecret: null,
                twoFactorEnabled: false,
            },
        });
        return { success: true };
    }
}
