import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { formatCurrency } from '@/lib/prize-calculator'

async function getActiveChampionshipData() {
  return db.palpitaChampionship.findFirst({
    where: { status: 'OPEN' },
    include: {
      _count: { select: { tickets: { where: { status: 'PAID' } } } },
    },
  })
}

export default async function HomePage() {
  const session = await getSession()
  const championship = await getActiveChampionshipData()

  const totalCollected = championship
    ? Number(championship._count.tickets) * 10
    : 0
  const prizePool = totalCollected * 0.7

  return (
    <div className="min-h-screen field-texture">
      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(10,10,10,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #1A1A1A',
        padding: '0 24px',
        height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #00A651, #007A3D)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px',
          }}>⚽</div>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.6rem',
            letterSpacing: '1px',
            color: 'white',
          }}>
            PALPITA <span style={{ color: '#00A651' }}>AÍ</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {session ? (
            <>
              <Link href="/apostar" className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
                ⚽ Apostar
              </Link>
              <Link href="/dashboard" className="btn-outline" style={{ padding: '9px 20px', fontSize: '0.9rem' }}>
                Minha Conta
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-outline" style={{ padding: '9px 20px', fontSize: '0.9rem' }}>
                Entrar
              </Link>
              <Link href="/cadastro" className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
                Cadastrar Grátis
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: '120px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background decorativo */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%',
          transform: 'translateX(-50%)',
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(0,166,81,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="animate-slide-up" style={{ position: 'relative', zIndex: 1, maxWidth: '800px' }}>
          {/* Badge */}
          <div style={{ marginBottom: '24px' }}>
            <span className="badge-green" style={{ fontSize: '0.85rem', padding: '6px 16px' }}>
              🏆 Rodada {championship ? 'Aberta' : 'Em Breve'}
            </span>
          </div>

          {/* Título principal */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(4rem, 10vw, 8rem)',
            lineHeight: '0.9',
            letterSpacing: '2px',
            marginBottom: '24px',
          }}>
            <span style={{ color: 'white' }}>PALPITA</span>
            <br />
            <span className="text-gradient-green">AÍ</span>
          </h1>

          <p style={{
            fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
            color: '#9CA3AF',
            lineHeight: '1.6',
            marginBottom: '16px',
            maxWidth: '600px',
            margin: '0 auto 16px',
          }}>
            Palpite em <strong style={{ color: 'white' }}>14 confrontos</strong> de futebol,
            ganhe <strong style={{ color: '#FFD700' }}>prêmios reais</strong> e mostre que você
            entende de bola!
          </p>

          <p style={{ color: '#6B7280', fontSize: '1rem', marginBottom: '40px' }}>
            Bilhete por apenas <span style={{ color: '#00A651', fontWeight: 700 }}>R$ 10,00</span>
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={session ? '/apostar' : '/cadastro'} className="btn-gold" style={{ fontSize: '1.1rem', padding: '16px 36px' }}>
              🎯 Fazer Meu Palpite
            </Link>
            <a href="#como-funciona" className="btn-outline" style={{ fontSize: '1.1rem', padding: '15px 36px' }}>
              Como Funciona
            </a>
          </div>
        </div>

        {/* Stats da rodada */}
        {championship && (
          <div style={{
            marginTop: '80px',
            display: 'flex', gap: '32px', justifyContent: 'center', flexWrap: 'wrap',
          }}>
            {[
              { label: 'Bilhetes Vendidos', value: String(championship._count.tickets), icon: '🎫' },
              { label: 'Pool de Prêmios', value: formatCurrency(prizePool), icon: '💰' },
              { label: 'Confrontos', value: '14', icon: '⚽' },
            ].map((stat) => (
              <div key={stat.label} className="card" style={{ textAlign: 'center', minWidth: '160px' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{stat.icon}</div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.8rem',
                  color: '#00A651',
                  letterSpacing: '1px',
                }}>{stat.value}</div>
                <div style={{ color: '#6B7280', fontSize: '0.85rem', marginTop: '4px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" style={{ padding: '80px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            letterSpacing: '2px',
            marginBottom: '16px',
          }}>
            COMO <span className="text-gradient-green">FUNCIONA</span>
          </h2>
          <p style={{ color: '#6B7280', fontSize: '1.1rem' }}>
            Simples, rápido e emocionante
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
        }}>
          {[
            {
              step: '01',
              icon: '📝',
              title: 'Cadastre-se',
              desc: 'Crie sua conta gratuitamente com nome, email e CPF. Leva menos de 1 minuto!',
            },
            {
              step: '02',
              icon: '⚽',
              title: 'Faça seus Palpites',
              desc: 'Escolha o resultado de 14 confrontos de futebol: vitória da casa, empate ou vitória do visitante.',
            },
            {
              step: '03',
              icon: '💳',
              title: 'Pague R$ 10,00',
              desc: 'Pague via PIX (instantâneo) ou Cartão de Crédito/Débito com total segurança pelo Mercado Pago.',
            },
            {
              step: '04',
              icon: '🏆',
              title: 'Ganhe Prêmios',
              desc: 'Acertou 12, 13 ou 14 jogos? Você ganha! Os prêmios são distribuídos do pool de 70% do total arrecadado.',
            },
          ].map((item) => (
            <div key={item.step} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', top: '-10px', right: '-10px',
                fontFamily: 'var(--font-display)',
                fontSize: '5rem',
                color: 'rgba(0,166,81,0.06)',
                lineHeight: 1,
                letterSpacing: '-2px',
              }}>{item.step}</div>
              <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{item.icon}</div>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                letterSpacing: '1px',
                marginBottom: '12px',
                color: 'white',
              }}>{item.title}</h3>
              <p style={{ color: '#9CA3AF', lineHeight: '1.6', fontSize: '0.95rem' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Prêmios */}
      <section style={{
        padding: '80px 24px',
        background: '#111111',
        borderTop: '1px solid #1A1A1A',
        borderBottom: '1px solid #1A1A1A',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            letterSpacing: '2px',
            marginBottom: '16px',
          }}>
            TABELA DE <span className="text-gradient-gold">PRÊMIOS</span>
          </h2>
          <p style={{ color: '#6B7280', marginBottom: '48px', fontSize: '1rem' }}>
            70% do total arrecadado é distribuído entre os vencedores
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            {[
              { hits: '14 Acertos', pct: '50%', icon: '🥇', color: '#FFD700', desc: 'Jackpot! Acertou tudo!' },
              { hits: '13 Acertos', pct: '15%', icon: '🥈', color: '#C0C0C0', desc: 'Quase perfeito!' },
              { hits: '12 Acertos', pct: '5%', icon: '🥉', color: '#CD7F32', desc: 'Muito bem!' },
            ].map((prize) => (
              <div key={prize.hits} className="card" style={{
                border: `1px solid ${prize.color}33`,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>{prize.icon}</div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.8rem',
                  color: prize.color,
                  letterSpacing: '1px',
                  marginBottom: '4px',
                }}>{prize.hits}</div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '3rem',
                  color: prize.color,
                  letterSpacing: '2px',
                }}>{prize.pct}</div>
                <div style={{ color: '#6B7280', fontSize: '0.85rem', marginTop: '8px' }}>
                  do pool de prêmios
                </div>
                <div style={{ color: '#9CA3AF', fontSize: '0.9rem', marginTop: '8px', fontStyle: 'italic' }}>
                  {prize.desc}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '32px',
            padding: '20px',
            background: 'rgba(0,166,81,0.08)',
            borderRadius: '12px',
            border: '1px solid rgba(0,166,81,0.2)',
          }}>
            <p style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>
              💡 Os prêmios são divididos igualmente entre todos os bilhetes vencedores de cada categoria.
              Quanto menos ganhadores, maior o prêmio individual!
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section style={{ padding: '100px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ fontSize: '4rem', marginBottom: '24px' }}>🎯</div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            letterSpacing: '2px',
            marginBottom: '20px',
          }}>
            PRONTO PARA <span className="text-gradient-green">PALPITAR?</span>
          </h2>
          <p style={{ color: '#6B7280', marginBottom: '40px', fontSize: '1.1rem' }}>
            Cadastre-se agora e faça seu primeiro palpite por apenas R$ 10,00
          </p>
          <Link href={session ? '/apostar' : '/cadastro'} className="btn-gold" style={{ fontSize: '1.2rem', padding: '18px 48px' }}>
            🏆 Começar Agora
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #1A1A1A',
        padding: '40px 24px',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '16px' }}>
          <span style={{ fontSize: '1.5rem' }}>⚽</span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.4rem',
            letterSpacing: '1px',
          }}>
            PALPITA <span style={{ color: '#00A651' }}>AÍ</span>
          </span>
        </div>
        <p style={{ color: '#4B5563', fontSize: '0.85rem' }}>
          © 2026 Palpita Aí. Jogue com responsabilidade. Maiores de 18 anos.
        </p>
        <div style={{ marginTop: '12px', display: 'flex', gap: '24px', justifyContent: 'center' }}>
          <Link href="/resultados" style={{ color: '#6B7280', fontSize: '0.85rem', textDecoration: 'none' }}>
            Resultados
          </Link>
          <Link href="/login" style={{ color: '#6B7280', fontSize: '0.85rem', textDecoration: 'none' }}>
            Entrar
          </Link>
          <Link href="/cadastro" style={{ color: '#6B7280', fontSize: '0.85rem', textDecoration: 'none' }}>
            Cadastrar
          </Link>
        </div>
      </footer>
    </div>
  )
}
