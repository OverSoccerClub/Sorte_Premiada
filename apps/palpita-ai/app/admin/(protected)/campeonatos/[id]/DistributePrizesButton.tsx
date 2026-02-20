'use client'

import { distributeChampionshipPrizesAction } from '@/actions/admin.actions'
import { useState } from 'react'

export function DistributePrizesButton({ championshipId, disabled }: { championshipId: string, disabled: boolean }) {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)

    const handleDistribute = async () => {
        if (!confirm('Tem certeza? Isso irá calcular os vencedores e distribuir os prêmios finais. Esta ação não pode ser desfeita.')) return

        setLoading(true)
        try {
            const res = await distributeChampionshipPrizesAction(championshipId)
            if (res?.success) {
                setResult(res.stats)
                alert('Prêmios distribuídos com sucesso!')
            } else {
                alert('Erro: ' + res?.error)
            }
        } finally {
            setLoading(false)
        }
    }

    if (result) {
        return (
            <div style={{ background: '#064E3B', padding: '16px', borderRadius: '8px', marginTop: '16px' }}>
                <h3 style={{ color: '#34D399', marginBottom: '8px' }}>🎉 Prêmios Distribuídos!</h3>
                <ul style={{ color: '#D1FAE5', fontSize: '0.9rem' }}>
                    <li>Pool Total: R$ {result.prizePool}</li>
                    <li>14 Acertos: {result.winners14} ganhadores (R$ {result.prize14})</li>
                    <li>13 Acertos: {result.winners13} ganhadores (R$ {result.prize13})</li>
                    <li>12 Acertos: {result.winners12} ganhadores (R$ {result.prize12})</li>
                </ul>
            </div>
        )
    }

    return (
        <button
            onClick={handleDistribute}
            disabled={disabled || loading}
            style={{
                width: '100%',
                padding: '16px',
                background: disabled ? '#374151' : '#F59E0B',
                color: disabled ? '#9CA3AF' : 'black',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: disabled || loading ? 'not-allowed' : 'pointer',
                border: 'none',
                marginTop: '24px'
            }}
        >
            {loading ? 'Calculando...' : 'DISTRIBUIR PRÊMIOS E ENCERRAR'}
        </button>
    )
}
