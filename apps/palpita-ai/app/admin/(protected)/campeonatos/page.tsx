import { db } from '@/lib/db'
import Link from 'next/link'

export default async function AdminChampionshipsPage() {
    const championships = await db.palpitaChampionship.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: { select: { tickets: true } },
        }
    })

    // Calcular total arrecadado (simulado R$10 por bilhete pago - precisaria filtrar status)
    // Para simplificar a view, vamos apenas contar tickets totais.

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '2px', color: 'white', marginBottom: '8px' }}>
                        CAMPEONATOS
                    </h1>
                    <p style={{ color: '#6B7280' }}>Gerencie as rodadas e veja resultados</p>
                </div>
                <Link href="/admin/campeonatos/novo" style={{
                    background: '#00A651', color: 'white',
                    padding: '12px 24px', borderRadius: '8px',
                    fontWeight: 600, textDecoration: 'none',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    transition: 'background 0.2s'
                }}>
                    + Novo Campeonato
                </Link>
            </div>

            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                    <thead>
                        <tr style={{ background: '#1F2937', textAlign: 'left' }}>
                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#9CA3AF' }}>NOME</th>
                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#9CA3AF' }}>STATUS</th>
                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#9CA3AF' }}>DATA SORTEIO</th>
                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#9CA3AF' }}>BILHETES</th>
                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#9CA3AF' }}>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {championships.map((c) => (
                            <tr key={c.id} style={{ borderTop: '1px solid #374151' }}>
                                <td style={{ padding: '16px', fontWeight: 600 }}>{c.name}</td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                                        background: c.status === 'OPEN' ? 'rgba(0,166,81,0.2)' :
                                            c.status === 'CLOSED' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)',
                                        color: c.status === 'OPEN' ? '#00A651' :
                                            c.status === 'CLOSED' ? '#F87171' : '#60A5FA'
                                    }}>
                                        {c.status}
                                    </span>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    {new Date(c.drawDate).toLocaleDateString('pt-BR')}
                                </td>
                                <td style={{ padding: '16px' }}>{c._count.tickets}</td>
                                <td style={{ padding: '16px' }}>
                                    <Link href={`/admin/campeonatos/${c.id}`} style={{
                                        color: '#60A5FA', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem'
                                    }}>
                                        Gerenciar →
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {championships.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#6B7280' }}>
                                    Nenhum campeonato encontrado. Crie o primeiro!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
