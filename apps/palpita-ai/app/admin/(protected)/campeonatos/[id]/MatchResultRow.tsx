'use client'

import { setMatchResultAction } from '@/actions/admin.actions'
import { useState } from 'react'

interface Props {
    match: {
        id: string
        homeTeam: string
        awayTeam: string
        result: string | null // 'HOME' | 'DRAW' | 'AWAY'
    }
}

export function MatchResultRow({ match }: Props) {
    const [loading, setLoading] = useState(false)

    const handleSetResult = async (result: 'HOME' | 'DRAW' | 'AWAY') => {
        if (loading) return
        if (!confirm(`Confirmar resultado: ${result === 'HOME' ? match.homeTeam : result === 'AWAY' ? match.awayTeam : 'EMPATE'}?`)) return

        setLoading(true)
        try {
            await setMatchResultAction(match.id, result)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: '16px', alignItems: 'center',
            background: '#1F2937', padding: '16px', borderRadius: '8px', marginBottom: '8px'
        }}>
            <div style={{ textAlign: 'right', fontWeight: 600 }}>{match.homeTeam}</div>

            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                <button
                    onClick={() => handleSetResult('HOME')}
                    disabled={loading}
                    style={{
                        padding: '8px', borderRadius: '4px', cursor: 'pointer', border: 'none',
                        background: match.result === 'HOME' ? '#00A651' : '#374151',
                        color: match.result === 'HOME' ? 'white' : '#9CA3AF',
                        opacity: loading ? 0.5 : 1
                    }}
                    title="Vitória Casa"
                >H</button>
                <button
                    onClick={() => handleSetResult('DRAW')}
                    disabled={loading}
                    style={{
                        padding: '8px', borderRadius: '4px', cursor: 'pointer', border: 'none',
                        background: match.result === 'DRAW' ? '#FBBF24' : '#374151',
                        color: match.result === 'DRAW' ? 'black' : '#9CA3AF',
                        opacity: loading ? 0.5 : 1
                    }}
                    title="Empate"
                >X</button>
                <button
                    onClick={() => handleSetResult('AWAY')}
                    disabled={loading}
                    style={{
                        padding: '8px', borderRadius: '4px', cursor: 'pointer', border: 'none',
                        background: match.result === 'AWAY' ? '#EF4444' : '#374151',
                        color: match.result === 'AWAY' ? 'white' : '#9CA3AF',
                        opacity: loading ? 0.5 : 1
                    }}
                    title="Vitória Fora"
                >A</button>
            </div>

            <div style={{ fontWeight: 600 }}>{match.awayTeam}</div>
        </div>
    )
}
