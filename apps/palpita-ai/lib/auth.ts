import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import type { UserSession } from '@/types'

const JWT_SECRET = process.env.JWT_SECRET || 'palpita-ai-secret-key-change-in-production'
const COOKIE_NAME = 'palpita_session'

export function signToken(payload: UserSession): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): UserSession | null {
    try {
        return jwt.verify(token, JWT_SECRET) as UserSession
    } catch {
        return null
    }
}

export async function getSession(): Promise<UserSession | null> {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null
    return verifyToken(token)
}

export async function setSession(user: UserSession): Promise<void> {
    const token = signToken(user)
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 dias
        path: '/',
    })
}

export async function clearSession(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete(COOKIE_NAME)
}
