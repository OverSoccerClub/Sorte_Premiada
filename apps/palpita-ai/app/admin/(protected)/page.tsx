import { db } from '@/lib/db'
import Link from 'next/link'

async function getStats() {
    const [totalUsers, totalChampionships, tickets, payments] = await Promise.all([
        db.palpitaUser.count(),
        db.palpitaChampionship.count(),
        db.palpitaTicket.findMany({ where: { status: 'PAID' } }),
        db.palpitaPayment.count({ where: { status: 'APPROVED' } }),
    ])

    const totalRevenue = tickets.length * 10
    const totalPrizes = tickets.reduce((sum, t) => sum + Number(t.prize || 0), 0)
    const activeChampionship = await db.palpitaChampionship.findFirst({
        where: { status: 'OPEN' },
        include: { _count: { select: { tickets: { where: { status: 'PAID' } } } } },
    })

    return { totalUsers, totalChampionships, totalTickets: tickets.length, totalRevenue, totalPrizes, payments, activeChampionship }
}

export default async function AdminDashboard() {
    const stats = await getStats()

    const statCards = [
        { label: 'Usuários Cadastrados', value: stats.totalUsers, icon: '👥', color: '#3B82F6' },
        { label: 'Bilhetes Pagos', value: stats.totalTickets, icon: '🎫', color: '#00A651' },
        { label: 'Arrecadação Total', value: `R$ ${stats.totalRevenue.toFixed(2)}`, icon: '💰', color: '#FFD700' },
        { label: 'Prêmios Distribuídos', value: `R$ ${stats.totalPrizes.toFixed(2)}`, icon: '🏆', color: '#F59E0B' },
    ]

    return (
        <div>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '2px', color: 'white', margin: 0 }}>
                    DASHBOARD
                </h1>
                <p style={{ color: '#6B7280', marginTop: '8px' }}>Visão geral do Palpita Aí</p>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {statCards.map((card) => (
                    <div key={card.label} className="card" style={{ padding: '24px' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{card.icon}</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 700, color: card.color, fontFamily: 'var(--font-display)' }}>
                            {card.value}
                        </div>
                        <div style={{ color: '#6B7280', fontSize: '0.85rem', marginTop: '4px' }}>{card.label}</div>
                    </div>
                ))}
            </div>

            {/* Campeonato Ativo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="card" style={{ padding: '24px' }}>
                    <h2 style={{ color: 'white', fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🏆 Campeonato Ativo
                    </h2>
                    {stats.activeChampionship ? (
                        <div>
                            <div style={{ color: 'white', fontWeight: 600, marginBottom: '8px' }}>
                                {stats.activeChampionship.name}
                            </div>
                            <div style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '16px' }}>
                                📅 {new Date(stats.activeChampionship.drawDate).toLocaleDateString('pt-BR')}
                            </div>
                            <div style={{ color: '#00A651', fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>
                                {stats.activeChampionship._count.tickets}
                            </div>
                            <div style={{ color: '#6B7280', fontSize: '0.8rem', marginBottom: '16px' }}>bilhetes pagos</div>
                            <Link href={`/admin/campeonatos/${stats.activeChampionship.id}`} className="btn-primary" style={{ fontSize: '0.85rem', padding: '10px 16px', display: 'inline-block', textDecoration: 'none' }}>
                                Gerenciar →
                            </Link>
                        </div>
                    ) : (
                        <div>
                            <p style={{ color: '#6B7280', marginBottom: '16px' }}>Nenhum campeonato ativo</p>
                            <Link href="/admin/campeonatos/novo" className="btn-primary" style={{ fontSize: '0.85rem', padding: '10px 16px', display: 'inline-block', textDecoration: 'none' }}>
                                + Criar Campeonato
                            </Link>
                        </div>
                    )}
                </div>

                <div className="card" style={{ padding: '24px' }}>
                    <h2 style={{ color: 'white', fontSize: '1rem', marginBottom: '16px' }}>
                        📈 Financeiro
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { label: 'Arrecadado', value: `R$ ${stats.totalRevenue.toFixed(2)}`, color: '#00A651' },
                            { label: 'Pool de Prêmios (70%)', value: `R$ ${(stats.totalRevenue * 0.7).toFixed(2)}`, color: '#FFD700' },
                            { label: 'Banca (30%)', value: `R$ ${(stats.totalRevenue * 0.3).toFixed(2)}`, color: '#3B82F6' },
                            { label: 'Distribuído', value: `R$ ${stats.totalPrizes.toFixed(2)}`, color: '#F59E0B' },
                        ].map((item) => (
                            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>{item.label}</span>
                                <span style={{ color: item.color, fontWeight: 700 }}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
