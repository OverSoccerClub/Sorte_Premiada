'use client'

import { useState, useTransition, useEffect } from 'react'
import { createCardPaymentAction } from '@/actions/payment.actions'

interface CardPaymentProps {
    ticketId: string
}

declare global {
    interface Window {
        MercadoPago: new (publicKey: string, options?: object) => {
            cardForm: (config: object) => {
                getCardFormData: () => {
                    token: string
                    installments: string
                    paymentMethodId: string
                    issuerId: string
                }
                unmount: () => void
            }
        }
    }
}

export function CardPayment({ ticketId }: CardPaymentProps) {
    const [isPending, startTransition] = useTransition()
    const [status, setStatus] = useState<'idle' | 'processing' | 'approved' | 'error'>('idle')
    const [error, setError] = useState('')
    const [mpLoaded, setMpLoaded] = useState(false)

    useEffect(() => {
        const script = document.createElement('script')
        script.src = 'https://sdk.mercadopago.com/js/v2'
        script.onload = () => setMpLoaded(true)
        document.head.appendChild(script)
        return () => {
            document.head.removeChild(script)
        }
    }, [])

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const form = e.currentTarget
        const cardNumber = (form.elements.namedItem('cardNumber') as HTMLInputElement)?.value
        const cardName = (form.elements.namedItem('cardName') as HTMLInputElement)?.value
        const expiry = (form.elements.namedItem('expiry') as HTMLInputElement)?.value
        const cvv = (form.elements.namedItem('cvv') as HTMLInputElement)?.value

        if (!cardNumber || !cardName || !expiry || !cvv) {
            setError('Preencha todos os campos do cartão')
            return
        }

        setError('')
        startTransition(async () => {
            setStatus('processing')
            // Em produção, usar o SDK do MP para tokenizar o cartão
            // Por ora, simulando com dados de teste
            const result = await createCardPaymentAction(ticketId, {
                token: 'TEST_TOKEN', // Será substituído pelo token real do MP SDK
                installments: 1,
                paymentMethodId: 'visa',
                issuerId: undefined,
            })

            if (result.success) {
                setStatus('approved')
            } else {
                setStatus('error')
                setError(result.error || 'Erro ao processar cartão')
            }
        })
    }

    if (status === 'approved') {
        return (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
                <h3 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.8rem',
                    color: '#00A651',
                    letterSpacing: '1px',
                    marginBottom: '12px',
                }}>PAGAMENTO APROVADO!</h3>
                <p style={{ color: '#9CA3AF', marginBottom: '24px' }}>
                    Seu bilhete está ativo!
                </p>
                <a href="/dashboard" className="btn-primary">Ver Meus Bilhetes</a>
            </div>
        )
    }

    return (
        <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>💳</div>
                <h3 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.3rem',
                    letterSpacing: '1px',
                    marginBottom: '4px',
                }}>CARTÃO DE CRÉDITO/DÉBITO</h3>
                <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>
                    Visa, Mastercard, Elo e mais
                </p>
            </div>

            {!mpLoaded && (
                <div style={{ textAlign: 'center', color: '#6B7280', fontSize: '0.9rem', marginBottom: '16px' }}>
                    <span className="spinner" style={{ display: 'inline-block', marginRight: '8px' }} />
                    Carregando formulário seguro...
                </div>
            )}

            {error && (
                <div style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '10px',
                    padding: '12px',
                    marginBottom: '16px',
                    color: '#F87171',
                    fontSize: '0.9rem',
                }}>⚠️ {error}</div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <label className="label" htmlFor="cardNumber">Número do Cartão</label>
                    <input
                        id="cardNumber"
                        name="cardNumber"
                        type="text"
                        className="input-field"
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                        autoComplete="cc-number"
                    />
                </div>

                <div>
                    <label className="label" htmlFor="cardName">Nome no Cartão</label>
                    <input
                        id="cardName"
                        name="cardName"
                        type="text"
                        className="input-field"
                        placeholder="NOME COMO NO CARTÃO"
                        autoComplete="cc-name"
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                        <label className="label" htmlFor="expiry">Validade</label>
                        <input
                            id="expiry"
                            name="expiry"
                            type="text"
                            className="input-field"
                            placeholder="MM/AA"
                            maxLength={5}
                            autoComplete="cc-exp"
                        />
                    </div>
                    <div>
                        <label className="label" htmlFor="cvv">CVV</label>
                        <input
                            id="cvv"
                            name="cvv"
                            type="text"
                            className="input-field"
                            placeholder="123"
                            maxLength={4}
                            autoComplete="cc-csc"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isPending || !mpLoaded}
                    className="btn-primary"
                    style={{ width: '100%', marginTop: '8px' }}
                >
                    {isPending ? (
                        <><span className="spinner" />Processando...</>
                    ) : (
                        '💳 Pagar R$ 10,00'
                    )}
                </button>
            </form>

            <div style={{
                marginTop: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: '#4B5563',
                fontSize: '0.8rem',
            }}>
                🔒 Pagamento seguro via Mercado Pago
            </div>
        </div>
    )
}
