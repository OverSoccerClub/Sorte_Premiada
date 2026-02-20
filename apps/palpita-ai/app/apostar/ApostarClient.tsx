'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Championship, TicketPick, MatchResult } from '@/types'
import { createTicketAction } from '@/actions/ticket.actions'

interface ApostarClientProps {
    championship: Championship & {
        matches: Array<{
            id: string
            homeTeam: string
            awayTeam: string
            homeTeamLogo?: string | null
            awayTeamLogo?: string | null
            order: number
        }>
    }
}

const RESULT_LABELS: Record<MatchResult, string> = {
    HOME: 'Casa',
    DRAW: 'Empate',
    AWAY: 'Fora',
}

const RESULT_ICONS: Record<MatchResult, string> = {
    HOME: '🏟️',
    DRAW: '🤝',
    AWAY: '⚽',
}

export function ApostarClient({ championship }: ApostarClientProps) {
    const router = useRouter()
    const [picks, setPicks] = useState<Record<string, MatchResult>>({})
    const [error, setError] = useState('')
    const [isPending, startTransition] = useTransition()

    const totalPicks = Object.keys(picks).length
    const isComplete = totalPicks === 14

    function handlePick(matchId: string, result: MatchResult) {
        setPicks((prev) => ({ ...prev, [matchId]: result }))
    }

    function handleSubmit() {
        if (!isComplete) {
            setError('Você precisa fazer exatamente 14 palpites!')
            return
        }

        const ticketPicks: TicketPick[] = Object.entries(picks).map(([matchId, pick]) => ({
            matchId,
            pick,
        }))

        startTransition(async () => {
            const result = await createTicketAction(championship.id, ticketPicks)
            if (result.success && result.data) {
                router.push(`/pagamento/${result.data.ticketId}`)
            } else {
                setError(result.error || 'Erro ao criar bilhete')
            }
        })
    }

    return (
        <div>
            {/* Header da rodada */}
            <div style={{
                background: '#1A1A1A',
                border: '1px solid #2A2A2A',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
            }}>
                <div>
                    <h2 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.6rem',
                        letterSpacing: '1px',
                        color: 'white',
                        marginBottom: '4px',
                    }}>{championship.name}</h2>
                    <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>
                        Selecione o resultado de cada confronto
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '2.5rem',
                        letterSpacing: '2px',
                        color: isComplete ? '#00A651' : '#FFD700',
                        lineHeight: 1,
                    }}>
                        {totalPicks}/14
                    </div>
                    <div style={{ color: '#6B7280', fontSize: '0.8rem', marginTop: '4px' }}>
                        palpites feitos
                    </div>
                </div>
            </div>

            {/* Barra de progresso */}
            <div style={{
                height: '6px',
                background: '#1A1A1A',
                borderRadius: '3px',
                marginBottom: '32px',
                overflow: 'hidden',
            }}>
                <div style={{
                    height: '100%',
                    width: `${(totalPicks / 14) * 100}%`,
                    background: isComplete
                        ? 'linear-gradient(90deg, #00A651, #00C862)'
                        : 'linear-gradient(90deg, #FFD700, #E6A800)',
                    borderRadius: '3px',
                    transition: 'width 0.3s ease',
                }} />
            </div>

            {/* Grid de confrontos */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '16px',
                marginBottom: '32px',
            }}>
                {championship.matches.map((match, index) => {
                    const selectedPick = picks[match.id]

                    return (
                        <div
                            key={match.id}
                            className="card"
                            style={{
                                border: selectedPick
                                    ? '1px solid rgba(0,166,81,0.4)'
                                    : '1px solid #2A2A2A',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {/* Número do confronto */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '16px',
                            }}>
                                <span style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '0.85rem',
                                    color: '#4B5563',
                                    letterSpacing: '1px',
                                }}>JOGO {String(index + 1).padStart(2, '0')}</span>
                                {selectedPick && (
                                    <span className="badge-green" style={{ fontSize: '0.7rem' }}>
                                        ✓ {RESULT_LABELS[selectedPick]}
                                    </span>
                                )}
                            </div>

                            {/* Times */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '20px',
                                gap: '8px',
                            }}>
                                <div style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                                        {match.homeTeamLogo ? (
                                            <img src={match.homeTeamLogo} alt={match.homeTeam} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            <span style={{ fontSize: '2rem' }}>🏟️</span>
                                        )}
                                    </div>
                                    <div style={{
                                        fontFamily: 'var(--font-display)',
                                        fontSize: '1rem',
                                        letterSpacing: '0.5px',
                                        color: 'white',
                                        lineHeight: 1.2,
                                    }}>{match.homeTeam}</div>
                                    <div style={{ color: '#4B5563', fontSize: '0.75rem', marginTop: '2px' }}>Casa</div>
                                </div>

                                <div style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '1.2rem',
                                    color: '#4B5563',
                                    letterSpacing: '2px',
                                }}>VS</div>

                                <div style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                                        {match.awayTeamLogo ? (
                                            <img src={match.awayTeamLogo} alt={match.awayTeam} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            <span style={{ fontSize: '2rem' }}>⚽</span>
                                        )}
                                    </div>
                                    <div style={{
                                        fontFamily: 'var(--font-display)',
                                        fontSize: '1rem',
                                        letterSpacing: '0.5px',
                                        color: 'white',
                                        lineHeight: 1.2,
                                    }}>{match.awayTeam}</div>
                                    <div style={{ color: '#4B5563', fontSize: '0.75rem', marginTop: '2px' }}>Fora</div>
                                </div>
                            </div>

                            {/* Botões de palpite */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                {(['HOME', 'DRAW', 'AWAY'] as MatchResult[]).map((result) => {
                                    const isSelected = selectedPick === result
                                    return (
                                        <button
                                            key={result}
                                            onClick={() => handlePick(match.id, result)}
                                            style={{
                                                padding: '10px 6px',
                                                borderRadius: '10px',
                                                border: isSelected
                                                    ? '2px solid #00A651'
                                                    : '1.5px solid #2A2A2A',
                                                background: isSelected
                                                    ? 'rgba(0,166,81,0.15)'
                                                    : 'transparent',
                                                color: isSelected ? '#00C862' : '#9CA3AF',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease',
                                                fontSize: '0.8rem',
                                                fontWeight: isSelected ? 700 : 500,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '4px',
                                            }}
                                        >
                                            <span style={{ fontSize: '1.1rem' }}>{RESULT_ICONS[result]}</span>
                                            <span>{RESULT_LABELS[result]}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Erro */}
            {error && (
                <div style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    marginBottom: '20px',
                    color: '#F87171',
                    fontSize: '0.9rem',
                }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Resumo e botão de pagar */}
            <div style={{
                position: 'sticky',
                bottom: '24px',
                background: '#1A1A1A',
                border: '1px solid #2A2A2A',
                borderRadius: '16px',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap',
                boxShadow: '0 -4px 40px rgba(0,0,0,0.5)',
            }}>
                <div>
                    <div style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '4px' }}>
                        Valor do bilhete
                    </div>
                    <div style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '2rem',
                        color: '#00A651',
                        letterSpacing: '1px',
                    }}>R$ 10,00</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.2rem',
                        color: isComplete ? '#00A651' : '#6B7280',
                    }}>
                        {isComplete ? '✅ Pronto para pagar!' : `Faltam ${14 - totalPicks} palpites`}
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!isComplete || isPending}
                    className={isComplete ? 'btn-gold' : 'btn-outline'}
                    style={{ minWidth: '200px', fontSize: '1rem', padding: '14px 28px' }}
                >
                    {isPending ? (
                        <><span className="spinner" style={{ borderColor: 'rgba(0,0,0,0.3)', borderTopColor: '#0A0A0A' }} />Processando...</>
                    ) : (
                        '💳 Pagar R$ 10,00'
                    )}
                </button>
            </div>
        </div>
    )
}
