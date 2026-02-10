import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        configService: ConfigService,
        private prisma: PrismaService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'secretKey',
        });
    }

    async validate(payload: any) {
        // Optimization: For permissions, we need to fetch the user from DB
        // because permissions might change and are not in the payload.
        // Also helps to check if user is still active/banned.
        const user = await this.prisma.client.user.findUnique({
            where: { id: payload.sub },
            select: { permissions: true, isActive: true, role: true }
        });

        if (!user) {
            throw new UnauthorizedException('User no longer exists');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('User is inactive');
        }

        return {
            userId: payload.sub,
            username: payload.username,
            role: payload.role,
            companyId: payload.companyId,
            permissions: user.permissions // Critical for PermissionsGuard
        };
    }
}
