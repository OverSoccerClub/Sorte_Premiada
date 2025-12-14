import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    canActivate(context: any) {
        console.log('JwtAuthGuard: Checking access');
        return super.canActivate(context);
    }
}
