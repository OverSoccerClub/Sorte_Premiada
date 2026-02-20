'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { loginAction } from '@/actions/auth.actions'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button type="submit" className="btn-primary" disabled={pending} style={{ width: '100%', fontSize: '1rem', padding: '15px' }}>
            {pending ? (
                <><span className="spinner" />Entrando...</>
            ) : (
                '→ Entrar na Conta'
            )}
        </button>
    )
}

export default function LoginPage() {
    const [state, action] = useActionState(loginAction, { success: false })

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0A0A0A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            position: 'relative',
        }}>
            {/* Background glow */}
            <div style={{
                position: 'fixed', top: '30%', left: '50%',
                transform: 'translateX(-50%)',
                width: '500px', height: '500px',
                background: 'radial-gradient(circle, rgba(0,166,81,0.1) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            <div className="animate-fade-in" style={{ width: '100%', maxWidth: '420px', position: 'relative' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                            <div style={{
                                width: 48, height: 48,
                                background: 'linear-gradient(135deg, #00A651, #007A3D)',
                                borderRadius: '14px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '26px',
                                boxShadow: '0 4px 20px rgba(0,166,81,0.4)',
                            }}>⚽</div>
                            <span style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '2.2rem',
                                letterSpacing: '2px',
                                color: 'white',
                            }}>
                                PALPITA <span style={{ color: '#00A651' }}>AÍ</span>
                            </span>
                        </div>
                    </Link>
                    <p style={{ color: '#6B7280', marginTop: '12px', fontSize: '0.95rem' }}>
                        Entre na sua conta e faça seus palpites
                    </p>
                </div>

                {/* Card do formulário */}
                <div className="card" style={{ padding: '36px' }}>
                    <h1 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.8rem',
                        letterSpacing: '1px',
                        marginBottom: '28px',
                        color: 'white',
                    }}>ENTRAR</h1>

                    {state.error && (
                        <div style={{
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: '10px',
                            padding: '12px 16px',
                            marginBottom: '20px',
                            color: '#F87171',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}>
                            ⚠️ {state.error}
                        </div>
                    )}

                    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label className="label" htmlFor="email">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className="input-field"
                                placeholder="seu@email.com"
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div>
                            <label className="label" htmlFor="password">Senha</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                className="input-field"
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        <SubmitButton />
                    </form>

                    <hr className="divider" />

                    <p style={{ textAlign: 'center', color: '#6B7280', fontSize: '0.9rem' }}>
                        Não tem conta?{' '}
                        <Link href="/cadastro" style={{ color: '#00A651', fontWeight: 700, textDecoration: 'none' }}>
                            Cadastre-se grátis
                        </Link>
                    </p>
                </div>

                <p style={{ textAlign: 'center', marginTop: '24px', color: '#4B5563', fontSize: '0.8rem' }}>
                    🔒 Seus dados estão protegidos com criptografia
                </p>
            </div>
        </div>
    )
}
