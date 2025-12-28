import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        console.warn('[Redis] Redis integration is DISABLED. System will use database only.');
    }

    onModuleDestroy() {
        // No-op
    }

    // Retracting getClient to avoid compilation errors if it's used somewhere I missed,
    // but returning null or throwing if called.
    // However, since I grepped and didn't see external usages, I'll remove it or make it return null casted as any.
    // Better to remove it if possible, but to be safe against "implicit" usages or if I missed something, 
    // I'll keep the method signature if I can.
    // But wait, `tickets.service.ts` imports `RedisService`. proper typing is needed.
    // The previous grep for `getClient` showed NO results in other files.
    // So I can remove `getClient`.

    async get(key: string): Promise<string | null> {
        return null; // Always cache miss
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        // No-op
    }

    async del(key: string): Promise<void> {
        // No-op
    }

    async flushAll(): Promise<void> {
        // No-op
    }
}
