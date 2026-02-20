import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PUBLIC_PATHS = ['/', '/login', '/cadastro', '/resultados', '/api/webhooks', '/admin']

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    const isPublic = PUBLIC_PATHS.some((path) =>
        pathname === path || pathname.startsWith(path + '/')
    )

    if (isPublic) return NextResponse.next()

    const token = request.cookies.get('palpita_session')?.value

    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    const session = verifyToken(token)
    if (!session) {
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('palpita_session')
        return response
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
