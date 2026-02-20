import Link from 'next/link'
import { db } from '@/lib/db'
import { formatCurrency, calculatePrizes } from '@/lib/prize-calculator'

async function getFinishedChampionships() {
    return db.palpitaChampionship.findMany({
        where: { status: 'FINISHED' },
        include: {
            matches: { orderBy: { order: 'asc' } },
            _count: {
                select: {
                    tickets: { where: { status: { in: ['PAID', 'WINNER'] } } },
                },
            },
        },
        orderBy: { drawDate: 'desc' },
        take: 10,
    })
}

async function getOpenChampionship() {
    return db.palpitaChampionship.findFirst({
        where: { status: 'OPEN' },
        include: {
            matches: { orderBy: { order: 'asc' } },
            _count: {
                select: {
                    tickets: { where: { status: { in: ['PAID', 'WINNER'] } } },
                },
            },
        },
    })
}

const RESULT_LABELS: Record<string, string> = {
    HOME: 'Casa',
    DRAW: 'Empate',
    AWAY: 'Fora',
}

export default async function ResultadosPage() {
    const [finished, open] = await Promise.all([
        getFinishedChampionships(),
        getOpenChampionship(),
    ])

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
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Link href="/login" className="btn-outline" style={{ padding: '9px 16px', fontSize: '0.85rem' }}>Entrar</Link>
                    <Link href="/apostar" className="btn-primary" style={{ padding: '10px 16px', fontSize: '0.85rem' }}>⚽ Apostar</Link>
                </div>
            </nav>

            <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>
                <div style={{ marginBottom: '40px' }}>
                    <h1 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(2rem, 4vw, 3rem)',
                        letterSpacing: '2px',
                        marginBottom: '8px',
                    }}>
                        RESULTADOS <span className="text-gradient-green">DAS RODADAS</span>
                    </h1>
                    <p style={{ color: '#6B7280' }}>Confira os resultados e os ganhadores de cada rodada</p>
                </div>

                {/* Rodada aberta */}
                {open && (
                    <div style={{ marginBottom: '40px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <h2 style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '1.5rem',
                                letterSpacing: '1px',
                            }}>RODADA ATUAL</h2>
                            <span className="badge-green">🔴 Aberta</span>
                        </div>

                        <div className="card" style={{ border: '1px solid rgba(0,166,81,0.3)' }}>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                marginBottom: '20px', flexWrap: 'wrap', gap: '16px',
                            }}>
                                <div>
                                    <h3 style={{
                                        fontFamily: 'var(--font-display)',
                                        fontSize: '1.3rem',
                                        letterSpacing: '1px',
                                        marginBottom: '4px',
                                    }}>{open.name}</h3>
                                    <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>
                                        {open._count.tickets} bilhetes vendidos •{' '}
                                        Pool: {formatCurrency(open._count.tickets * 10 * 0.7)}
                                    </p>
                                </div>
                                <Link href="/apostar" className="btn-gold" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
                                    🎯 Participar
                                </Link>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: '8px',
                            }}>
                                {open.matches.map((match) => (
                                    <div key={match.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px 14px',
                                        background: '#111111',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                    }}>
                                        <span style={{ color: '#9CA3AF' }}>
                                            {match.homeTeam} vs {match.awayTeam}
                                        </span>
                                        <span style={{ color: '#4B5563', fontSize: '0.8rem' }}>Aguardando</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Rodadas finalizadas */}
                {finished.length > 0 ? (
                    <div>
                        <h2 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '1.5rem',
                            letterSpacing: '1px',
                            marginBottom: '20px',
                        }}>RODADAS ENCERRADAS</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {finished.map((champ) => {
                                const totalCollected = champ._count.tickets * 10
                                const prizes = calculatePrizes(totalCollected, { hits14: 0, hits13: 0, hits12: 0 })

                                return (
                                    <div key={champ.id} className="card">
                                        <div style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                            marginBottom: '16px', flexWrap: 'wrap', gap: '12px',
                                        }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                                    <h3 style={{
                                                        fontFamily: 'var(--font-display)',
                                                        fontSize: '1.2rem',
                                                        letterSpacing: '0.5px',
                                                    }}>{champ.name}</h3>
                                                    <span className="badge-gray" style={{ fontSize: '0.7rem' }}>Encerrada</span>
                                                </div>
                                                <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>
                                                    {champ._count.tickets} bilhetes •{' '}
                                                    Total arrecadado: {formatCurrency(totalCollected)} •{' '}
                                                    Pool: {formatCurrency(prizes.pool)}
                                                </p>
                                            </div>
                                            <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#6B7280' }}>
                                                {new Date(champ.drawDate).toLocaleDateString('pt-BR')}
                                            </div>
                                        </div>

                                        {/* Resultados dos jogos */}
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                                            gap: '6px',
                                        }}>
                                            {champ.matches.map((match) => (
                                                <div key={match.id} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '8px 12px',
                                                    background: '#111111',
                                                    borderRadius: '8px',
                                                    fontSize: '0.82rem',
                                                }}>
                                                    <span style={{ color: '#9CA3AF' }}>
                                                        {match.homeTeam} vs {match.awayTeam}
                                                    </span>
                                                    {match.result ? (
                                                        <span className={
                                                            match.result === 'HOME' ? 'badge-green' :
                                                                match.result === 'DRAW' ? 'badge-gray' : 'badge-gold'
                                                        } style={{ fontSize: '0.65rem' }}>
                                                            {RESULT_LABELS[match.result]}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: '#4B5563', fontSize: '0.75rem' }}>-</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : (
                    !open && (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 24px',
                            background: '#1A1A1A',
                            borderRadius: '16px',
                            border: '1px solid #2A2A2A',
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📊</div>
                            <h3 style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '1.5rem',
                                letterSpacing: '1px',
                                marginBottom: '12px',
                            }}>Nenhum Resultado Ainda</h3>
                            <p style={{ color: '#6B7280' }}>
                                Os resultados aparecerão aqui após o encerramento das rodadas.
                            </p>
                        </div>
                    )
                )}
            </main>
        </div>
    )
}
