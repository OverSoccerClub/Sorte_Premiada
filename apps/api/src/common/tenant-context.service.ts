import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * TenantContextService
 * 
 * Manages the current tenant (company) context using AsyncLocalStorage.
 * This allows us to automatically scope all database queries to the current company
 * without passing companyId through every function call.
 * 
 * Usage:
 * - Set context in middleware/interceptor: tenantContext.setCompanyId(user.companyId)
 * - Get context in services: tenantContext.getCompanyId()
 * - Run with context: tenantContext.runWithCompanyId(companyId, () => { ... })
 */
@Injectable()
export class TenantContextService {
    private readonly asyncLocalStorage = new AsyncLocalStorage<string>();

    /**
     * Set the current company ID in the async context
     */
    setCompanyId(companyId: string): void {
        const store = this.asyncLocalStorage.getStore();
        if (store !== undefined) {
            throw new Error('Company ID already set in this context. Use runWithCompanyId for nested contexts.');
        }
        // This won't work as expected because we need to be inside a run() call
        // This method is kept for compatibility but should not be used directly
        console.warn('[TenantContext] setCompanyId called outside of run context. Use runWithCompanyId instead.');
    }

    /**
     * Get the current company ID from the async context
     * Returns undefined if no company context is set (e.g., for MASTER users or public endpoints)
     */
    getCompanyId(): string | undefined {
        return this.asyncLocalStorage.getStore();
    }

    /**
     * Run a callback with a specific company ID in the async context
     * This is the recommended way to set the tenant context
     */
    runWithCompanyId<T>(companyId: string | undefined, callback: () => T): T {
        // Always run within the AsyncLocalStorage context, even if companyId is undefined.
        // This ensures consistent behavior and prevents context leaking or loss.
        return this.asyncLocalStorage.run(companyId || '', callback);
    }

    /**
     * Check if we're currently in a tenant context
     */
    hasContext(): boolean {
        return this.asyncLocalStorage.getStore() !== undefined;
    }

    /**
     * Clear the current context (rarely needed, mainly for testing)
     */
    clearContext(): void {
        // AsyncLocalStorage doesn't have a direct clear method
        // Context is automatically cleared when exiting the run() callback
        console.warn('[TenantContext] clearContext called - context will be cleared when exiting run() scope');
    }
}
