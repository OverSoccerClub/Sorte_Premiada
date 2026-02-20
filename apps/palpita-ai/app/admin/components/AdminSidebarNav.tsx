'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
    { href: '/admin', icon: '📊', label: 'Dashboard' },
    { href: '/admin/campeonatos', icon: '🏆', label: 'Campeonatos' },
    { href: '/admin/bilhetes', icon: '🎫', label: 'Bilhetes' },
    { href: '/admin/usuarios', icon: '👥', label: 'Usuários' },
]

export function AdminSidebarNav() {
    const pathname = usePathname()

    return (
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {NAV_ITEMS.map(({ href, icon, label }) => {
                const isActive = pathname === href || pathname.startsWith(`${href}/`)
                return (
                    <Link key={href} href={href} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s',
                        background: isActive ? 'rgba(0,166,81,0.1)' : 'transparent',
                        color: isActive ? '#00A651' : '#9CA3AF'
                    }}
                        onMouseEnter={(e) => {
                            if (!isActive) {
                                e.currentTarget.style.background = 'rgba(0,166,81,0.05)'
                                e.currentTarget.style.color = '#00A651'
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive) {
                                e.currentTarget.style.background = 'transparent'
                                e.currentTarget.style.color = '#9CA3AF'
                            }
                        }}
                    >
                        <span>{icon}</span>
                        <span>{label}</span>
                    </Link>
                )
            })}
        </nav>
    )
}
