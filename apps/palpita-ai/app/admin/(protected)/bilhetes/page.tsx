import { db } from '@/lib/db'
import Link from 'next/link'

export default async function AdminTicketsPage() {
    const tickets = await db.palpitaTicket.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            user: true,
            championship: true,
            picks: { include: { match: true } }
        },
        take: 100, // Paginação simples por enquanto
    })

    return (
        <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '2px', color: 'white', marginBottom: '8px' }}>
                BILHETES
            </h1>
            <p style={{ color: '#6B7280', marginBottom: '32px' }}>Últimos 100 bilhetes registrados</p>

            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                    <thead>
                        <tr style={{ background: '#1F2937', textAlign: 'left' }}>
                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#9CA3AF' }}>ID</th>
                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#9CA3AF' }}>USUÁRIO</th>
                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#9CA3AF' }}>CAMPEONATO</th>
                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#9CA3AF' }}>STATUS</th>
                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#9CA3AF' }}>ACERTOS</th>
                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#9CA3AF' }}>PRÊMIO</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tickets.map((t) => (
                            <tr key={t.id} style={{ borderTop: '1px solid #374151' }}>
                                <td style={{ padding: '16px', fontFamily: 'monospace', fontSize: '0.85rem', color: '#6B7280' }}>
                                    {t.id.slice(-8)}
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ fontWeight: 600 }}>{t.user.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>{t.user.email}</div>
                                </td>
                                <td style={{ padding: '16px' }}>{t.championship.name}</td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                                        background: t.status === 'WINNER' ? 'rgba(255,215,0,0.2)' :
                                            t.status === 'PAID' ? 'rgba(0,166,81,0.2)' :
                                                t.status === 'PENDING' ? 'rgba(255,255,255,0.1)' : 'rgba(239,68,68,0.2)',
                                        color: t.status === 'WINNER' ? '#FFD700' :
                                            t.status === 'PAID' ? '#00A651' :
                                                t.status === 'PENDING' ? '#9CA3AF' : '#F87171'
                                    }}>
                                        {t.status}
                                    </span>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    {t.hits !== null ? t.hits : '-'}
                                </td>
                                <td style={{ padding: '16px', fontWeight: Number(t.prize) > 0 ? 700 : 400, color: Number(t.prize) > 0 ? '#FFD700' : 'inherit' }}>
                                    {Number(t.prize) > 0 ? `R$ ${Number(t.prize).toFixed(2)}` : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
