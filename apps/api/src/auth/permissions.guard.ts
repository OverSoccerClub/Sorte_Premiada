
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@repo/database';

export const PERMISSIONS_KEY = 'permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredPermissions) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        if (user.role === Role.MASTER) {
            return true;
        }

        if (!user.permissions) {
            return false;
        }

        // Check if user has ALL required permissions (strict)
        // Or should it be ANY? Usually strictly required for the specific action.
        // If the decorator asks for ['MANAGE_GAMES'], user must have it.
        // If multiple, user needs all of them.

        // Parse permissions from JSON/Object if needed, but Prisma usually returns it as object.
        const userPermissions = user.permissions as Record<string, boolean>;

        return requiredPermissions.every((permission) => userPermissions[permission] === true);
    }
}
