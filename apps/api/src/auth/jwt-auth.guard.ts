import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    canActivate(context: any) {
        console.log('JwtAuthGuard: Checking access');
        return super.canActivate(context);
    }

    handleRequest(err: any, user: any, info: any) {
        if (err || !user) {
            console.error('JwtAuthGuard Error:', err);
            console.error('JwtAuthGuard Info:', info);
            throw err || new UnauthorizedException();
        }
        return user;
    }
}
