'use client'

import { useActionState } from 'react'
import { adminLoginAction } from '@/actions/admin.actions'

export default function AdminLoginPage() {
    const [state, action] = useActionState(adminLoginAction, { error: '' })

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0A0A0A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
        }}>
            <div style={{ width: '100%', maxWidth: '380px' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{
                        width: 56, height: 56,
                        background: 'linear-gradient(135deg, #00A651, #007A3D)',
                        borderRadius: '16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '28px',
                        margin: '0 auto 16px',
                        boxShadow: '0 4px 20px rgba(0,166,81,0.4)',
                    }}>🔐</div>
                    <h1 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '2rem',
                        letterSpacing: '2px',
                        color: 'white',
                        margin: 0,
                    }}>ADMIN</h1>
                    <p style={{ color: '#6B7280', marginTop: '8px', fontSize: '0.9rem' }}>
                        Palpita Aí — Painel Administrativo
                    </p>
                </div>

                <div className="card" style={{ padding: '32px' }}>
                    {state?.error && (
                        <div style={{
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: '10px',
                            padding: '12px 16px',
                            marginBottom: '20px',
                            color: '#F87171',
                            fontSize: '0.9rem',
                        }}>
                            ⚠️ {state.error}
                        </div>
                    )}

                    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label className="label" htmlFor="password">Senha de Acesso</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                className="input-field"
                                placeholder="••••••••"
                                required
                                autoFocus
                            />
                        </div>
                        <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px' }}>
                            → Acessar Painel
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
