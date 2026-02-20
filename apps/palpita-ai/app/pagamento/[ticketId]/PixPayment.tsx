'use client'

import { useState, useEffect, useTransition } from 'react'
import { createPixPaymentAction, checkPaymentStatus } from '@/actions/payment.actions'

interface PixPaymentProps {
    ticketId: string
}

export function PixPayment({ ticketId }: PixPaymentProps) {
    const [isPending, startTransition] = useTransition()
    const [pixData, setPixData] = useState<{
        qrCode: string
        qrCodeBase64: string
        paymentId: string
    } | null>(null)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)
    const [status, setStatus] = useState<'idle' | 'pending' | 'approved'>('idle')

    function generatePix() {
        startTransition(async () => {
            const result = await createPixPaymentAction(ticketId)
            if (result.success && result.data) {
                setPixData(result.data)
                setStatus('pending')
            } else {
                setError(result.error || 'Erro ao gerar PIX')
            }
        })
    }

    function copyCode() {
        if (pixData?.qrCode) {
            navigator.clipboard.writeText(pixData.qrCode)
            setCopied(true)
            setTimeout(() => setCopied(false), 3000)
        }
    }

    // Polling para verificar pagamento
    useEffect(() => {
        if (status !== 'pending') return
        const interval = setInterval(async () => {
            const result = await checkPaymentStatus(ticketId)
            if (result.success && result.data?.status === 'APPROVED') {
                setStatus('approved')
                clearInterval(interval)
            }
        }, 5000)
        return () => clearInterval(interval)
    }, [status, ticketId])

    if (status === 'approved') {
        return (
            <div style={{
                textAlign: 'center',
                padding: '40px',
                background: 'rgba(0,166,81,0.1)',
                border: '1px solid rgba(0,166,81,0.3)',
                borderRadius: '16px',
            }}>
                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎉</div>
                <h3 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '2rem',
                    color: '#00A651',
                    letterSpacing: '1px',
                    marginBottom: '12px',
                }}>PAGAMENTO CONFIRMADO!</h3>
                <p style={{ color: '#9CA3AF', marginBottom: '24px' }}>
                    Seu bilhete está ativo e participando da rodada!
                </p>
                <a href="/dashboard" className="btn-primary">
                    Ver Meus Bilhetes
                </a>
            </div>
        )
    }

    if (!pixData) {
        return (
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📱</div>
                <h3 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.5rem',
                    letterSpacing: '1px',
                    marginBottom: '12px',
                }}>PAGAR COM PIX</h3>
                <p style={{ color: '#6B7280', marginBottom: '24px', fontSize: '0.95rem' }}>
                    Pagamento instantâneo e seguro. QR Code válido por 30 minutos.
                </p>
                {error && (
                    <div style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: '10px',
                        padding: '12px',
                        marginBottom: '20px',
                        color: '#F87171',
                        fontSize: '0.9rem',
                    }}>⚠️ {error}</div>
                )}
                <button onClick={generatePix} disabled={isPending} className="btn-primary" style={{ width: '100%' }}>
                    {isPending ? (
                        <><span className="spinner" />Gerando QR Code...</>
                    ) : (
                        '⚡ Gerar QR Code PIX'
                    )}
                </button>
            </div>
        )
    }

    return (
        <div style={{ textAlign: 'center' }}>
            <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                letterSpacing: '1px',
                marginBottom: '8px',
                color: '#00A651',
            }}>QR CODE PIX</h3>
            <p style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '24px' }}>
                Escaneie com o app do seu banco
            </p>

            {/* QR Code */}
            <div style={{
                display: 'inline-block',
                background: 'white',
                padding: '16px',
                borderRadius: '16px',
                marginBottom: '20px',
            }}>
                {pixData.qrCodeBase64 ? (
                    <img
                        src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                        alt="QR Code PIX"
                        style={{ width: '200px', height: '200px', display: 'block' }}
                    />
                ) : (
                    <div style={{
                        width: '200px', height: '200px',
                        background: '#f0f0f0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#666', fontSize: '0.8rem',
                    }}>QR Code</div>
                )}
            </div>

            {/* Código copia e cola */}
            <div style={{ marginBottom: '20px' }}>
                <p style={{ color: '#6B7280', fontSize: '0.8rem', marginBottom: '8px' }}>
                    Ou copie o código:
                </p>
                <div style={{
                    background: '#111111',
                    border: '1px solid #2A2A2A',
                    borderRadius: '10px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}>
                    <code style={{
                        flex: 1,
                        color: '#9CA3AF',
                        fontSize: '0.75rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}>
                        {pixData.qrCode.slice(0, 50)}...
                    </code>
                    <button
                        onClick={copyCode}
                        style={{
                            background: copied ? 'rgba(0,166,81,0.2)' : 'rgba(255,255,255,0.05)',
                            border: '1px solid #2A2A2A',
                            borderRadius: '6px',
                            color: copied ? '#00A651' : '#9CA3AF',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {copied ? '✓ Copiado!' : 'Copiar'}
                    </button>
                </div>
            </div>

            {/* Status de aguardo */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                color: '#6B7280',
                fontSize: '0.9rem',
            }}>
                <span className="spinner" style={{ width: '16px', height: '16px', borderColor: 'rgba(107,114,128,0.3)', borderTopColor: '#6B7280' }} />
                Aguardando confirmação do pagamento...
            </div>
        </div>
    )
}
