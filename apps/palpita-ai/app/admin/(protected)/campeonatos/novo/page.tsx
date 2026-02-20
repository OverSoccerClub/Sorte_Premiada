'use client'

import { createChampionshipAction } from '@/actions/admin.actions'
import Link from 'next/link'
import { useActionState } from 'react'

export default function NewChampionshipPage() {
    const [state, action, isPending] = useActionState(createChampionshipAction, null)

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <Link href="/admin/campeonatos" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.9rem' }}>
                    ← Voltar para lista
                </Link>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '2px', color: 'white', marginTop: '8px' }}>
                    NOVO CAMPEONATO
                </h1>
            </div>

            <div className="card" style={{ padding: '32px' }}>
                {state?.error && (
                    <div style={{ background: 'rgba(239,68,68,0.1)', color: '#F87171', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.9rem' }}>
                        ⚠️ {state.error}
                    </div>
                )}

                <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Dados Básicos */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', color: '#9CA3AF', marginBottom: '8px', fontSize: '0.9rem' }}>Nome do Campeonato</label>
                            <input name="name" type="text" placeholder="Ex: Rodada 34 - Brasileirão" required
                                style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #374151', borderRadius: '8px', color: 'white' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', color: '#9CA3AF', marginBottom: '8px', fontSize: '0.9rem' }}>Data do Sorteio</label>
                            <input name="drawDate" type="datetime-local" required
                                style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #374151', borderRadius: '8px', color: 'white' }}
                            />
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', color: '#9CA3AF', marginBottom: '8px', fontSize: '0.9rem' }}>Descrição (Opcional)</label>
                            <textarea name="description" rows={2}
                                style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #374151', borderRadius: '8px', color: 'white' }}
                            />
                        </div>
                    </div>

                    <hr style={{ border: '0', borderTop: '1px solid #374151', margin: '8px 0' }} />

                    {/* 14 Partidas */}
                    <div>
                        <h3 style={{ color: 'white', fontSize: '1.2rem', marginBottom: '16px' }}>Definir 14 Partidas</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {Array.from({ length: 14 }).map((_, i) => (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#1F2937', padding: '16px', borderRadius: '8px', border: '1px solid #374151' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontWeight: 700, color: '#6B7280' }}>JOGO #{i + 1}</span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'start' }}>
                                        {/* Casa */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <input name={`match_${i + 1}_home`} placeholder="Time Casa" required
                                                style={{ padding: '10px', background: '#111', border: '1px solid #374151', borderRadius: '4px', color: 'white', fontSize: '0.9rem' }}
                                            />
                                            <input name={`match_${i + 1}_home_logo`} placeholder="URL do Logo Casa (Opcional)"
                                                style={{ padding: '8px', background: '#111', border: '1px solid #374151', borderRadius: '4px', color: '#9CA3AF', fontSize: '0.8rem' }}
                                            />
                                        </div>

                                        <div style={{ alignSelf: 'center', color: '#6B7280', fontWeight: 600, fontSize: '0.8rem' }}>VS</div>

                                        {/* Fora */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <input name={`match_${i + 1}_away`} placeholder="Time Fora" required
                                                style={{ padding: '10px', background: '#111', border: '1px solid #374151', borderRadius: '4px', color: 'white', fontSize: '0.9rem' }}
                                            />
                                            <input name={`match_${i + 1}_away_logo`} placeholder="URL do Logo Fora (Opcional)"
                                                style={{ padding: '8px', background: '#111', border: '1px solid #374151', borderRadius: '4px', color: '#9CA3AF', fontSize: '0.8rem' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button type="submit" disabled={isPending} style={{
                        background: '#00A651', color: 'white', padding: '16px', borderRadius: '8px',
                        fontWeight: 700, fontSize: '1rem', cursor: isPending ? 'not-allowed' : 'pointer',
                        marginTop: '16px', opacity: isPending ? 0.7 : 1
                    }}>
                        {isPending ? 'Criando...' : 'CRIAR CAMPEONATO'}
                    </button>

                </form>
            </div>
        </div>
    )
}
