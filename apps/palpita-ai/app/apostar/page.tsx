import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { getActiveChampionship } from '@/actions/ticket.actions'
import { logoutAction } from '@/actions/auth.actions'
import { ApostarClient } from './ApostarClient'

export default async function ApostarPage() {
    const session = await getSession()
    if (!session) redirect('/login')

    const championship = await getActiveChampionship()

    return (
        <div style={{ minHeight: '100vh' }}>
            {/* Navbar */}
            <nav style={{
                background: 'rgba(10,10,10,0.95)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid #1A1A1A',
                padding: '0 24px',
                height: '64px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'sticky', top: 0, zIndex: 50,
            }}>
                <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: 36, height: 36,
                        background: 'linear-gradient(135deg, #00A651, #007A3D)',
                        borderRadius: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '20px',
                    }}>⚽</div>
                    <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.5rem',
                        letterSpacing: '1px',
                        color: 'white',
                    }}>
                        PALPITA <span style={{ color: '#00A651' }}>AÍ</span>
                    </span>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>
                        Olá, <strong style={{ color: 'white' }}>{session.name.split(' ')[0]}</strong>
                    </span>
                    <Link href="/dashboard" className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                        Meus Bilhetes
                    </Link>
                    <form action={logoutAction}>
                        <button type="submit" style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#6B7280',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            padding: '8px',
                        }}>
                            Sair
                        </button>
                    </form>
                </div>
            </nav>

            <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(2rem, 4vw, 3rem)',
                        letterSpacing: '2px',
                        color: 'white',
                        marginBottom: '8px',
                    }}>
                        FAZER <span className="text-gradient-green">PALPITE</span>
                    </h1>
                    <p style={{ color: '#6B7280', fontSize: '1rem' }}>
                        Escolha o resultado de cada confronto: vitória da casa, empate ou vitória do visitante
                    </p>
                </div>

                {!championship ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '80px 24px',
                        background: '#1A1A1A',
                        borderRadius: '20px',
                        border: '1px solid #2A2A2A',
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⏳</div>
                        <h2 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '2rem',
                            letterSpacing: '1px',
                            marginBottom: '12px',
                        }}>Nenhuma Rodada Aberta</h2>
                        <p style={{ color: '#6B7280', marginBottom: '24px' }}>
                            Aguarde a abertura da próxima rodada para fazer seus palpites.
                        </p>
                        <Link href="/resultados" className="btn-outline">
                            Ver Resultados Anteriores
                        </Link>
                    </div>
                ) : (
                    <ApostarClient championship={championship as Parameters<typeof ApostarClient>[0]['championship']} />
                )}
            </main>
        </div>
    )
}
