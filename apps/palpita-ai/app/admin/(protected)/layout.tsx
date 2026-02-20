import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'
import Link from 'next/link'
import { adminLogoutAction } from '@/actions/admin.actions'
import { AdminSidebarNav } from '@/app/admin/components/AdminSidebarNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const isAdmin = await getAdminSession()
    if (!isAdmin) redirect('/admin/login')

    return (
        <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex' }}>
            {/* Sidebar */}
            <aside style={{
                width: '240px',
                background: '#111111',
                borderRight: '1px solid #1F2937',
                display: 'flex',
                flexDirection: 'column',
                padding: '24px 0',
                position: 'fixed',
                top: 0, left: 0, bottom: 0,
                zIndex: 10,
            }}>
                {/* Logo */}
                <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #1F2937' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: 36, height: 36,
                            background: 'linear-gradient(135deg, #00A651, #007A3D)',
                            borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '18px',
                        }}>⚽</div>
                        <div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', letterSpacing: '1px', color: 'white' }}>
                                PALPITA <span style={{ color: '#00A651' }}>AÍ</span>
                            </div>
                            <div style={{ fontSize: '0.65rem', color: '#6B7280', letterSpacing: '1px' }}>ADMIN</div>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <AdminSidebarNav />

                {/* Logout */}
                <div style={{ padding: '16px 12px', borderTop: '1px solid #1F2937' }}>
                    <form action={adminLogoutAction}>
                        <button type="submit" style={{
                            width: '100%', padding: '10px 12px',
                            background: 'transparent',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#6B7280',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            display: 'flex', alignItems: 'center', gap: '8px',
                        }}>
                            🚪 Sair
                        </button>
                    </form>
                    <Link href="/" style={{
                        display: 'block', textAlign: 'center',
                        marginTop: '8px',
                        color: '#4B5563', fontSize: '0.75rem',
                        textDecoration: 'none',
                    }}>
                        ← Ver site
                    </Link>
                </div>
            </aside>

            {/* Main content */}
            <main style={{ flex: 1, marginLeft: '240px', padding: '32px', overflowY: 'auto' }}>
                {children}
            </main>
        </div>
    )
}
