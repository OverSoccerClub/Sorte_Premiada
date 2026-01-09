import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
    handleRequest(err: any, user: any, info: any) {
        // Se houver erro ou não houver usuário, apenas retorna null/undefined
        // em vez de lançar exceção. Isso permite acesso público.
        if (err || !user) {
            return null;
        }
        return user;
    }
}
