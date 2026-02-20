'use client'

import { useState } from 'react'
import { PixPayment } from './PixPayment'
import { CardPayment } from './CardPayment'

interface PaymentTabsClientProps {
    ticketId: string
}

export function PaymentTabsClient({ ticketId }: PaymentTabsClientProps) {
    const [activeTab, setActiveTab] = useState<'pix' | 'card'>('pix')

    return (
        <div className="card">
            <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.2rem',
                letterSpacing: '1px',
                marginBottom: '20px',
                color: '#9CA3AF',
            }}>FORMA DE PAGAMENTO</h3>

            {/* Tabs */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: '28px',
                background: '#111111',
                padding: '4px',
                borderRadius: '12px',
            }}>
                {[
                    { id: 'pix', label: '⚡ PIX', desc: 'Instantâneo' },
                    { id: 'card', label: '💳 Cartão', desc: 'Crédito/Débito' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as 'pix' | 'card')}
                        style={{
                            padding: '12px',
                            borderRadius: '10px',
                            border: 'none',
                            background: activeTab === tab.id
                                ? 'linear-gradient(135deg, #00A651, #007A3D)'
                                : 'transparent',
                            color: activeTab === tab.id ? 'white' : '#6B7280',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                        }}
                    >
                        <div>{tab.label}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '2px' }}>{tab.desc}</div>
                    </button>
                ))}
            </div>

            {/* Conteúdo da tab */}
            {activeTab === 'pix' ? (
                <PixPayment ticketId={ticketId} />
            ) : (
                <CardPayment ticketId={ticketId} />
            )}
        </div>
    )
}
