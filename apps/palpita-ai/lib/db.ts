import { PrismaClient } from '../prisma/generated/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

const databaseUrl = process.env.DATABASE_URL

// Debug temporário - remover após resolver
console.log('[DB] DATABASE_URL exists:', !!databaseUrl)
console.log('[DB] DATABASE_URL preview:', databaseUrl ? databaseUrl.replace(/:([^@]+)@/, ':***@') : 'NOT SET')

if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
}

export const db =
    globalForPrisma.prisma ??
    new PrismaClient({
        datasources: {
            db: {
                url: databaseUrl,
            },
        },
        log: ['error'],
    })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
