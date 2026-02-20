import { cookies } from 'next/headers'

const ADMIN_COOKIE = 'palpita_admin'
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin123'

export async function setAdminSession(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.set(ADMIN_COOKIE, ADMIN_SECRET, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 8, // 8 horas
        path: '/',
    })
}

export async function getAdminSession(): Promise<boolean> {
    const cookieStore = await cookies()
    const value = cookieStore.get(ADMIN_COOKIE)?.value
    return value === ADMIN_SECRET
}

export async function clearAdminSession(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete(ADMIN_COOKIE)
}
