import { db } from '@/lib/db'
import Link from 'next/link'
import { MatchResultRow } from './MatchResultRow'
import { DistributePrizesButton } from './DistributePrizesButton'

export default async function ChampionshipDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const championship = await db.palpitaChampionship.findUnique({
        where: { id },
        include: {
            matches: { orderBy: { order: 'asc' } },
            _count: { select: { tickets: true } }
        }
    })

    if (!championship) return <div>Campeonato não encontrado</div>

    const allResultsSet = championship.matches.every(m => m.result !== null)
    const isFinished = championship.status === 'FINISHED'

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <Link href="/admin/campeonatos" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.9rem' }}>
                    ← Voltar para lista
                </Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginTop: '8px' }}>
                    <div>
                        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '2px', color: 'white' }}>
                            {championship.name}
                        </h1>
                        <p style={{ color: '#6B7280' }}>
                            Sorteio: {new Date(championship.drawDate).toLocaleString('pt-BR')} • {championship._count.tickets} bilhetes
                        </p>
                    </div>
                    <div style={{
                        padding: '6px 12px', borderRadius: '4px', fontWeight: 600, fontSize: '0.9rem',
                        background: championship.status === 'OPEN' ? 'rgba(0,166,81,0.2)' : 'rgba(239,68,68,0.2)',
                        color: championship.status === 'OPEN' ? '#00A651' : '#F87171'
                    }}>
                        {championship.status}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>

                {/* Lista de Partidas */}
                <div>
                    <h2 style={{ color: 'white', fontSize: '1.2rem', marginBottom: '16px', borderBottom: '1px solid #374151', paddingBottom: '8px' }}>
                        Resultados das Partidas
                    </h2>

                    {championship.matches.map((match) => (
                        <MatchResultRow key={match.id} match={match} />
                    ))}
                </div>

                {/* Painel de Controle */}
                <div>
                    <div className="card" style={{ padding: '24px', position: 'sticky', top: '24px' }}>
                        <h3 style={{ color: 'white', marginBottom: '16px', fontSize: '1.1rem' }}>Ações Administrativas</h3>

                        <p style={{ color: '#9CA3AF', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.5' }}>
                            Para distribuir os prêmios, lance o resultado de todos os 14 jogos.
                            O sistema calculará automaticamente os bilhetes com 14, 13 e 12 acertos.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6B7280' }}>Status Jogos:</span>
                                <span style={{ color: allResultsSet ? '#00A651' : '#F59E0B' }}>
                                    {allResultsSet ? 'Completos' : 'Pendentes'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6B7280' }}>Status Sorteio:</span>
                                <span style={{ color: isFinished ? '#00A651' : '#F59E0B' }}>
                                    {isFinished ? 'Finalizado' : 'Aberto'}
                                </span>
                            </div>
                        </div>

                        {!isFinished && (
                            <DistributePrizesButton
                                championshipId={championship.id}
                                disabled={!allResultsSet}
                            />
                        )}

                        {isFinished && (
                            <div style={{ marginTop: '24px', textAlign: 'center', color: '#00A651', fontWeight: 600 }}>
                                🏆 Campeonato Finalizado
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
