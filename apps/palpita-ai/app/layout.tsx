import type { Metadata } from 'next'
import { Bebas_Neue, Inter } from 'next/font/google'
import './globals.css'

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Palpita Aí | Aposte nos Jogos e Ganhe Prêmios',
  description:
    'Faça seus palpites em 14 confrontos de futebol e concorra a prêmios incríveis. Cadastre-se grátis e comece a jogar agora!',
  keywords: 'palpita aí, apostas futebol, palpites, prêmios, bolão futebol',
  openGraph: {
    title: 'Palpita Aí | Aposte e Ganhe',
    description: 'Palpite em 14 jogos de futebol e ganhe prêmios reais!',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${bebasNeue.variable} ${inter.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
