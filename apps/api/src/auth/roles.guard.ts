import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { Role } from '@repo/database';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        console.log('RolesGuard: Checking roles for handler', context.getHandler().name);
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        console.log('RolesGuard: requiredRoles', requiredRoles);
        if (!requiredRoles) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();
        console.log('RolesGuard: user', user);
        if (user.role === Role.MASTER) {
            return true;
        }
        return requiredRoles.some((role) => user.role === role);
    }
}
