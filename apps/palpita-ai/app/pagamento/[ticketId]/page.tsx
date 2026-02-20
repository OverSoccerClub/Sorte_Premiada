import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { PaymentTabsClient } from './PaymentTabsClient'

interface PagamentoPageProps {
    params: Promise<{ ticketId: string }>
}

export default async function PagamentoPage({ params }: PagamentoPageProps) {
    const session = await getSession()
    if (!session) redirect('/login')

    const { ticketId } = await params

    const ticket = await db.palpitaTicket.findUnique({
        where: { id: ticketId, userId: session!.id },
        include: {
            championship: true,
            picks: { include: { match: true } },
            payment: true,
        },
    })

    if (!ticket) notFound()

    if (ticket.status === 'PAID') {
        redirect('/dashboard')
    }

    return (
        <div style={{ minHeight: '100vh', background: '#0A0A0A' }}>
            {/* Navbar */}
            <nav style={{
                background: 'rgba(10,10,10,0.95)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid #1A1A1A',
                padding: '0 24px',
                height: '64px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: 36, height: 36,
                        background: 'linear-gradient(135deg, #00A651, #007A3D)',
                        borderRadius: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '20px',
                    }}>⚽</div>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '1px', color: 'white' }}>
                        PALPITA <span style={{ color: '#00A651' }}>AÍ</span>
                    </span>
                </Link>
                <Link href="/apostar" style={{ color: '#6B7280', textDecoration: 'none', fontSize: '0.9rem' }}>
                    ← Voltar
                </Link>
            </nav>

            <main style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
                <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                    <h1 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(2rem, 4vw, 3rem)',
                        letterSpacing: '2px',
                        marginBottom: '8px',
                    }}>
                        FINALIZAR <span className="text-gradient-gold">PAGAMENTO</span>
                    </h1>
                    <p style={{ color: '#6B7280' }}>
                        Bilhete #{ticketId.slice(-8).toUpperCase()} • {ticket.championship.name}
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Resumo do bilhete */}
                    <div>
                        <div className="card" style={{ marginBottom: '16px' }}>
                            <h3 style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '1.2rem',
                                letterSpacing: '1px',
                                marginBottom: '16px',
                                color: '#9CA3AF',
                            }}>RESUMO DO BILHETE</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                                {ticket.picks.map((pick) => (
                                    <div key={pick.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '8px 12px',
                                        background: '#111111',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                    }}>
                                        <span style={{ color: '#9CA3AF' }}>
                                            {pick.match.homeTeam} vs {pick.match.awayTeam}
                                        </span>
                                        <span className={
                                            pick.pick === 'HOME' ? 'badge-green' :
                                                pick.pick === 'DRAW' ? 'badge-gray' : 'badge-gold'
                                        } style={{ fontSize: '0.7rem' }}>
                                            {pick.pick === 'HOME' ? '🏠 Casa' : pick.pick === 'DRAW' ? '🤝 Empate' : '✈️ Fora'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <hr className="divider" style={{ margin: '16px 0' }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#6B7280' }}>Total a pagar:</span>
                                <span style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '1.8rem',
                                    color: '#00A651',
                                    letterSpacing: '1px',
                                }}>R$ 10,00</span>
                            </div>
                        </div>

                        {/* Segurança */}
                        <div style={{
                            padding: '16px',
                            background: 'rgba(0,166,81,0.05)',
                            border: '1px solid rgba(0,166,81,0.15)',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            color: '#6B7280',
                        }}>
                            🔒 Pagamento processado com segurança pelo <strong style={{ color: '#9CA3AF' }}>Mercado Pago</strong>
                        </div>
                    </div>

                    {/* Opções de pagamento */}
                    <div>
                        <PaymentTabsClient ticketId={ticketId} />
                    </div>
                </div>
            </main>
        </div>
    )
}
