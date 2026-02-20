import { db } from '@/lib/db'

export default async function AdminUsersPage() {
    const users = await db.palpitaUser.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: { select: { tickets: true } }
        },
        take: 100,
    })

    return (
        <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '2px', color: 'white', marginBottom: '8px' }}>
                USUÁRIOS
            </h1>
            <p style={{ color: '#6B7280', marginBottom: '32px' }}>Últimos 100 usuários cadastrados</p>

            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                    <thead>
                        <tr style={{ background: '#1F2937', textAlign: 'left' }}>
                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#9CA3AF' }}>NOME</th>
                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#9CA3AF' }}>EMAIL</th>
                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#9CA3AF' }}>CPF</th>
                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#9CA3AF' }}>TELEFONE</th>
                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#9CA3AF' }}>BILHETES</th>
                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#9CA3AF' }}>DATA CADASTRO</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.id} style={{ borderTop: '1px solid #374151' }}>
                                <td style={{ padding: '16px', fontWeight: 600 }}>{u.name}</td>
                                <td style={{ padding: '16px' }}>{u.email}</td>
                                <td style={{ padding: '16px' }}>{u.cpf}</td>
                                <td style={{ padding: '16px' }}>{u.phone || '-'}</td>
                                <td style={{ padding: '16px' }}>{u._count.tickets}</td>
                                <td style={{ padding: '16px', fontSize: '0.85rem', color: '#9CA3AF' }}>
                                    {new Date(u.createdAt).toLocaleDateString('pt-BR')} {new Date(u.createdAt).toLocaleTimeString('pt-BR')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
