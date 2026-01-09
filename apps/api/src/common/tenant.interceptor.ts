import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContextService } from './tenant-context.service';

/**
 * TenantInterceptor
 * 
 * Global interceptor that extracts the companyId from the authenticated user
 * and sets it in the TenantContext for the duration of the request.
 * 
 * This ensures all database queries are automatically scoped to the user's company.
 * 
 * Special cases:
 * - MASTER users: No automatic scoping (can access all companies)
 * - Public endpoints: No scoping (no user context)
 * - Explicit companyId in query/body: MASTER users can override
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
    constructor(private readonly tenantContext: TenantContextService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const user = request.user; // Populated by JWT strategy

        // If no user (public endpoint), proceed without tenant context
        if (!user) {
            return next.handle();
        }

        // MASTER users can optionally specify a target company
        // via query param ?targetCompanyId=xxx or body field
        let targetCompanyId: string | undefined = user.companyId;

        if (user.role === 'MASTER') {
            // Check for explicit company override
            const queryCompanyId = request.query?.targetCompanyId || request.query?.companyId;
            const bodyCompanyId = request.body?.targetCompanyId || request.body?.companyId;

            if (queryCompanyId) {
                targetCompanyId = queryCompanyId;
                console.log(`[TenantInterceptor] MASTER user overriding company to: ${targetCompanyId}`);
            } else if (bodyCompanyId) {
                targetCompanyId = bodyCompanyId;
                console.log(`[TenantInterceptor] MASTER user overriding company to: ${targetCompanyId}`);
            } else {
                // MASTER without explicit company = no scoping (access all)
                targetCompanyId = undefined;
                console.log('[TenantInterceptor] MASTER user accessing global scope');
            }
        }

        // Run the request handler within the tenant context
        return new Observable(subscriber => {
            this.tenantContext.runWithCompanyId(targetCompanyId, () => {
                const subscription = next.handle().subscribe({
                    next: (value) => subscriber.next(value),
                    error: (error) => subscriber.error(error),
                    complete: () => subscriber.complete(),
                });
                return () => subscription.unsubscribe();
            });
        });
    }
}
