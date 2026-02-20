'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { registerAction } from '@/actions/auth.actions'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button type="submit" className="btn-gold" disabled={pending} style={{ width: '100%', fontSize: '1rem', padding: '15px' }}>
            {pending ? (
                <><span className="spinner" style={{ borderColor: 'rgba(0,0,0,0.3)', borderTopColor: '#0A0A0A' }} />Cadastrando...</>
            ) : (
                '🎯 Criar Minha Conta'
            )}
        </button>
    )
}

export default function CadastroPage() {
    const [state, action] = useActionState(registerAction, { success: false })

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
                background: 'radial-gradient(circle, rgba(255,215,0,0.06) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            <div className="animate-fade-in" style={{ width: '100%', maxWidth: '480px', position: 'relative' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
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
                        Crie sua conta e comece a palpitar agora!
                    </p>
                </div>

                {/* Card do formulário */}
                <div className="card" style={{ padding: '36px' }}>
                    <h1 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.8rem',
                        letterSpacing: '1px',
                        marginBottom: '8px',
                        color: 'white',
                    }}>CRIAR CONTA</h1>
                    <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '28px' }}>
                        Cadastro gratuito • Bilhete por R$ 10,00
                    </p>

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

                    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div>
                            <label className="label" htmlFor="name">Nome Completo</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                className="input-field"
                                placeholder="João da Silva"
                                required
                                minLength={3}
                                autoComplete="name"
                            />
                        </div>

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

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label className="label" htmlFor="cpf">CPF</label>
                                <input
                                    id="cpf"
                                    name="cpf"
                                    type="text"
                                    className="input-field"
                                    placeholder="00000000000"
                                    required
                                    maxLength={11}
                                    pattern="\d{11}"
                                    autoComplete="off"
                                />
                            </div>
                            <div>
                                <label className="label" htmlFor="phone">Telefone (opcional)</label>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    className="input-field"
                                    placeholder="(11) 99999-9999"
                                    autoComplete="tel"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label" htmlFor="password">Senha</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                className="input-field"
                                placeholder="Mínimo 6 caracteres"
                                required
                                minLength={6}
                                autoComplete="new-password"
                            />
                        </div>

                        <div>
                            <label className="label" htmlFor="confirmPassword">Confirmar Senha</label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                className="input-field"
                                placeholder="Repita a senha"
                                required
                                autoComplete="new-password"
                            />
                        </div>

                        <SubmitButton />
                    </form>

                    <hr className="divider" />

                    <p style={{ textAlign: 'center', color: '#6B7280', fontSize: '0.9rem' }}>
                        Já tem conta?{' '}
                        <Link href="/login" style={{ color: '#00A651', fontWeight: 700, textDecoration: 'none' }}>
                            Entrar
                        </Link>
                    </p>
                </div>

                <p style={{ textAlign: 'center', marginTop: '24px', color: '#4B5563', fontSize: '0.8rem' }}>
                    🔒 Seus dados estão protegidos • Maiores de 18 anos
                </p>
            </div>
        </div>
    )
}
