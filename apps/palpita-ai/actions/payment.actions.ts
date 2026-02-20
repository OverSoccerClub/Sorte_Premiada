'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// Importando Mercado Pago condicionalmente para evitar erro em build se não instalado
// Mas como instalei, deve funcionar.
import MercadoPagoConfig, { Payment } from 'mercadopago'

// Inicializa o Mercado Pago
// IMPORTANTE: Adicionar MP_ACCESS_TOKEN no .env.local
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || '',
    options: { timeout: 10000 }
})

// Tipagem básica de retorno
interface PaymentResponse {
    success: boolean
    data?: any
    error?: string
}

export async function createPixPaymentAction(ticketId: string): Promise<PaymentResponse> {
    const session = await getSession()
    if (!session) return { success: false, error: 'Não autenticado' }

    // 1. Buscar Ticket
    const ticket = await db.palpitaTicket.findUnique({
        where: { id: ticketId },
        include: { user: true }
    })

    if (!ticket) return { success: false, error: 'Bilhete não encontrado' }
    if (ticket.status === 'PAID') return { success: false, error: 'Bilhete já pago' }

    // 2. Verificar se já existe pagamento pendente válido
    const existingPayment = await db.palpitaPayment.findFirst({
        where: {
            ticketId,
            status: 'PENDING',
            method: 'PIX',
            expiresAt: { gt: new Date() }
        }
    })

    if (existingPayment && existingPayment.pixQrCode && existingPayment.pixQrCodeBase64) {
        return {
            success: true,
            data: {
                paymentId: existingPayment.mpPaymentId,
                qrCode: existingPayment.pixQrCode,
                qrCodeBase64: existingPayment.pixQrCodeBase64
            }
        }
    }

    // 3. Criar Pagamento no Mercado Pago
    try {
        if (!process.env.MP_ACCESS_TOKEN) {
            console.warn('MP_ACCESS_TOKEN não configurado. Retornando erro.')
            return { success: false, error: 'Configuração de pagamento pendente no servidor' }
        }

        const payment = new Payment(client)

        // Dados do pagador (simplificado)
        // Mercado Pago exige alguns campos para PIX
        const payerFirstName = ticket.user.name.split(' ')[0]
        const payerLastName = ticket.user.name.split(' ').slice(1).join(' ') || 'User'

        const body = {
            transaction_amount: Number(ticket.amount),
            description: `Bilhete #${ticket.id.slice(-8)}`,
            payment_method_id: 'pix',
            payer: {
                email: ticket.user.email,
                first_name: payerFirstName,
                last_name: payerLastName,
                identification: {
                    type: 'CPF',
                    number: ticket.user.cpf.replace(/\D/g, '') // CPF Limpo
                }
            },
            notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
            date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 min expiration
        }

        const response = await payment.create({ body })

        // 4. Salvar no Banco
        const qrCode = response.point_of_interaction?.transaction_data?.qr_code
        const qrCodeBase64 = response.point_of_interaction?.transaction_data?.qr_code_base64
        const paymentId = String(response.id)

        if (!qrCode || !qrCodeBase64) {
            throw new Error('Falha ao gerar QR Code: Resposta incompleta do MP')
        }

        // Upsert para garantir 1 pagamento ativo por ticket
        // Se já existir um expirado, atualiza
        await db.palpitaPayment.upsert({
            where: { ticketId },
            create: {
                ticketId,
                mpPaymentId: paymentId,
                method: 'PIX',
                status: 'PENDING',
                pixQrCode: qrCode,
                pixQrCodeBase64: qrCodeBase64,
                expiresAt: new Date(Date.now() + 30 * 60 * 1000)
            },
            update: {
                mpPaymentId: paymentId,
                method: 'PIX',
                status: 'PENDING',
                pixQrCode: qrCode,
                pixQrCodeBase64: qrCodeBase64,
                expiresAt: new Date(Date.now() + 30 * 60 * 1000)
            }
        })

        return {
            success: true,
            data: {
                paymentId,
                qrCode,
                qrCodeBase64
            }
        }

    } catch (error: any) {
        console.error('[MercadoPago] Erro ao criar PIX:', error)
        // Melhor tratamento de erro
        const msg = error.cause?.description || error.message || 'Erro ao processar pagamento'
        return { success: false, error: msg }
    }
}

export async function checkPaymentStatus(ticketId: string) {
    const session = await getSession()
    if (!session) return { success: false, error: 'Não autenticado' }

    const payment = await db.palpitaPayment.findUnique({
        where: { ticketId }
    })

    if (!payment) return { success: false, error: 'Pagamento não encontrado' }

    // Se estiver pendente, consulta o MP para atualizar status em tempo real (polling do cliente)
    if (payment.status === 'PENDING' && payment.mpPaymentId && process.env.MP_ACCESS_TOKEN) {
        try {
            const mp = new Payment(client)
            const mpPayment = await mp.get({ id: payment.mpPaymentId })

            if (mpPayment.status === 'approved') {
                // Atualizar banco numa transação
                await db.$transaction([
                    db.palpitaPayment.update({
                        where: { id: payment.id },
                        data: { status: 'APPROVED' }
                    }),
                    // IMPORTANTE: Atualizar o Ticket também!
                    db.palpitaTicket.update({
                        where: { id: ticketId },
                        data: { status: 'PAID' }
                    })
                ])
                return { success: true, data: { status: 'APPROVED' } }
            } else if (mpPayment.status === 'cancelled' || mpPayment.status === 'rejected') {
                await db.palpitaPayment.update({
                    where: { id: payment.id },
                    data: { status: mpPayment.status === 'cancelled' ? 'CANCELLED' : 'REJECTED' }
                })
                return { success: true, data: { status: mpPayment.status } }
            }
        } catch (err) {
            console.error('Erro ao verificar status MP:', err)
        }
    }

    return { success: true, data: { status: payment.status } }
}

export async function createCardPaymentAction(ticketId: string, cardData: any): Promise<PaymentResponse> {
    console.log('[createCardPayment]', ticketId, cardData)
    // Simulação ou erro por enquanto
    return { success: false, error: 'Pagamento via cartão indisponível no momento. Use o PIX.' }
}
