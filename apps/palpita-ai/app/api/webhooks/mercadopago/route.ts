import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import MercadoPagoConfig, { Payment } from 'mercadopago'

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || ''
})

export async function POST(req: NextRequest) {
    try {
        const url = new URL(req.url)
        const topic = url.searchParams.get('topic') || url.searchParams.get('type')
        const id = url.searchParams.get('id') || url.searchParams.get('data.id')

        // O Mercado Pago envia o ID na query string ou no body
        let paymentId = id
        if (!paymentId) {
            const body = await req.json().catch(() => ({}))
            paymentId = body?.data?.id || body?.id
        }

        console.log('[Webhook MP]', { topic, paymentId })

        if (paymentId && (topic === 'payment' || !topic)) { // As vezes vem sem topic no body
            const mp = new Payment(client)
            const mpPayment = await mp.get({ id: paymentId })

            console.log('[Webhook MP] Status:', mpPayment.status)

            if (mpPayment.status === 'approved') {
                // Buscar qual pagamento interno corresponde a este ID
                const internalPayment = await db.palpitaPayment.findFirst({
                    where: { mpPaymentId: String(paymentId) }
                })

                if (internalPayment && internalPayment.status !== 'APPROVED') {
                    // Atualizar Pagamento e Bilhete
                    await db.$transaction([
                        db.palpitaPayment.update({
                            where: { id: internalPayment.id },
                            data: { status: 'APPROVED' }
                        }),
                        db.palpitaTicket.update({
                            where: { ticketId: internalPayment.ticketId },
                            data: { status: 'PAID' }
                        })
                    ])
                    console.log(`[Webhook MP] Pagamento aprovado para ticket ${internalPayment.ticketId}`)
                }
            }
        }

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('[Webhook MP] Erro:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
