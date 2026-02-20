import React from 'react';

export default function Custom500() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', fontFamily: 'sans-serif' }}>
            <h1 style={{ fontSize: '4rem', fontWeight: 'bold' }}>500</h1>
            <p style={{ color: '#666' }}>Erro no Servidor</p>
            <a href="/dashboard" style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#059669', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
                Voltar ao Início
            </a>
        </div>
    );
}
