import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { getUserTickets } from '@/actions/ticket.actions'
import { logoutAction } from '@/actions/auth.actions'
import { formatCurrency } from '@/lib/prize-calculator'

const STATUS_LABELS: Record<string, string> = {
    PENDING: 'Aguardando Pagamento',
    PAID: 'Ativo',
    CANCELLED: 'Cancelado',
    WINNER: 'Premiado! 🏆',
}

const STATUS_BADGE: Record<string, string> = {
    PENDING: 'badge-gray',
    PAID: 'badge-green',
    CANCELLED: 'badge-red',
    WINNER: 'badge-gold',
}

export default async function DashboardPage() {
    const session = await getSession()
    if (!session) redirect('/login')

    const tickets = await getUserTickets()

    const paidTickets = tickets.filter((t) => t.status === 'PAID' || t.status === 'WINNER')
    const totalPrizes = tickets.reduce((acc, t) => acc + Number(t.prize || 0), 0)

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
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '1px', color: 'white' }}>
                        PALPITA <span style={{ color: '#00A651' }}>AÍ</span>
                    </span>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link href="/apostar" className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
                        ⚽ Novo Palpite
                    </Link>
                    <form action={logoutAction}>
                        <button type="submit" style={{
                            background: 'transparent', border: 'none',
                            color: '#6B7280', cursor: 'pointer', fontSize: '0.85rem', padding: '8px',
                        }}>Sair</button>
                    </form>
                </div>
            </nav>

            <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>
                {/* Header */}
                <div style={{ marginBottom: '40px' }}>
                    <h1 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(2rem, 4vw, 3rem)',
                        letterSpacing: '2px',
                        marginBottom: '8px',
                    }}>
                        OLÁ, <span className="text-gradient-green">{session.name.split(' ')[0].toUpperCase()}!</span>
                    </h1>
                    <p style={{ color: '#6B7280' }}>Acompanhe seus palpites e prêmios</p>
                </div>

                {/* Cards de estatísticas */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '40px',
                }}>
                    {[
                        { label: 'Total de Bilhetes', value: String(tickets.length), icon: '🎫', color: '#9CA3AF' },
                        { label: 'Bilhetes Ativos', value: String(paidTickets.length), icon: '✅', color: '#00A651' },
                        { label: 'Prêmios Ganhos', value: formatCurrency(totalPrizes), icon: '🏆', color: '#FFD700' },
                    ].map((stat) => (
                        <div key={stat.label} className="card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{stat.icon}</div>
                            <div style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '2rem',
                                color: stat.color,
                                letterSpacing: '1px',
                                marginBottom: '4px',
                            }}>{stat.value}</div>
                            <div style={{ color: '#6B7280', fontSize: '0.85rem' }}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Lista de bilhetes */}
                <div>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: '20px',
                    }}>
                        <h2 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '1.5rem',
                            letterSpacing: '1px',
                        }}>MEUS BILHETES</h2>
                        <Link href="/apostar" className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                            + Novo Palpite
                        </Link>
                    </div>

                    {tickets.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 24px',
                            background: '#1A1A1A',
                            borderRadius: '16px',
                            border: '1px solid #2A2A2A',
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎯</div>
                            <h3 style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '1.5rem',
                                letterSpacing: '1px',
                                marginBottom: '12px',
                            }}>Nenhum Bilhete Ainda</h3>
                            <p style={{ color: '#6B7280', marginBottom: '24px' }}>
                                Faça seu primeiro palpite e concorra a prêmios!
                            </p>
                            <Link href="/apostar" className="btn-gold">
                                🎯 Fazer Primeiro Palpite
                            </Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {tickets.map((ticket) => (
                                <div key={ticket.id} className="card" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '16px',
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                            <span style={{
                                                fontFamily: 'var(--font-display)',
                                                fontSize: '1rem',
                                                letterSpacing: '0.5px',
                                                color: 'white',
                                            }}>
                                                #{ticket.id.slice(-8).toUpperCase()}
                                            </span>
                                            <span className={STATUS_BADGE[ticket.status] || 'badge-gray'} style={{ fontSize: '0.7rem' }}>
                                                {STATUS_LABELS[ticket.status] || ticket.status}
                                            </span>
                                        </div>
                                        <div style={{ color: '#6B7280', fontSize: '0.85rem' }}>
                                            {ticket.championship.name} •{' '}
                                            {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                                        </div>
                                        {ticket.hits !== null && (
                                            <div style={{ color: '#9CA3AF', fontSize: '0.85rem', marginTop: '4px' }}>
                                                {ticket.hits} acertos
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ textAlign: 'right' }}>
                                        {ticket.prize ? (
                                            <div>
                                                <div style={{ color: '#6B7280', fontSize: '0.8rem' }}>Prêmio</div>
                                                <div style={{
                                                    fontFamily: 'var(--font-display)',
                                                    fontSize: '1.5rem',
                                                    color: '#FFD700',
                                                    letterSpacing: '1px',
                                                }}>{formatCurrency(Number(ticket.prize))}</div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div style={{ color: '#6B7280', fontSize: '0.8rem' }}>Valor</div>
                                                <div style={{
                                                    fontFamily: 'var(--font-display)',
                                                    fontSize: '1.3rem',
                                                    color: '#9CA3AF',
                                                }}>R$ 10,00</div>
                                            </div>
                                        )}

                                        {ticket.status === 'PENDING' && (
                                            <Link
                                                href={`/pagamento/${ticket.id}`}
                                                className="btn-primary"
                                                style={{ marginTop: '8px', padding: '8px 16px', fontSize: '0.8rem', display: 'inline-flex' }}
                                            >
                                                Pagar
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
