import MercadoPagoConfig, { Payment, Preference } from 'mercadopago'

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || '',
    options: { timeout: 5000 },
})

export const mpPayment = new Payment(client)
export const mpPreference = new Preference(client)

export interface CreatePixPaymentParams {
    ticketId: string
    userId: string
    userName: string
    userEmail: string
    userCpf: string
    amount: number
}

export async function createPixPayment(params: CreatePixPaymentParams) {
    const payment = await mpPayment.create({
        body: {
            transaction_amount: params.amount,
            description: `Palpita Aí - Bilhete #${params.ticketId.slice(-8).toUpperCase()}`,
            payment_method_id: 'pix',
            payer: {
                email: params.userEmail,
                first_name: params.userName.split(' ')[0],
                last_name: params.userName.split(' ').slice(1).join(' ') || 'Jogador',
                identification: {
                    type: 'CPF',
                    number: params.userCpf.replace(/\D/g, ''),
                },
            },
            notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
            external_reference: params.ticketId,
            date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
        },
    })

    return {
        paymentId: String(payment.id),
        pixQrCode: payment.point_of_interaction?.transaction_data?.qr_code || '',
        pixQrCodeBase64: payment.point_of_interaction?.transaction_data?.qr_code_base64 || '',
        status: payment.status,
    }
}

export interface CreateCardPaymentParams {
    ticketId: string
    userId: string
    userName: string
    userEmail: string
    userCpf: string
    amount: number
    token: string
    installments: number
    paymentMethodId: string
    issuerId?: string
}

export async function createCardPayment(params: CreateCardPaymentParams) {
    const payment = await mpPayment.create({
        body: {
            transaction_amount: params.amount,
            token: params.token,
            description: `Palpita Aí - Bilhete #${params.ticketId.slice(-8).toUpperCase()}`,
            installments: params.installments,
            payment_method_id: params.paymentMethodId,
            issuer_id: params.issuerId,
            payer: {
                email: params.userEmail,
                identification: {
                    type: 'CPF',
                    number: params.userCpf.replace(/\D/g, ''),
                },
            },
            notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
            external_reference: params.ticketId,
        },
    })

    return {
        paymentId: String(payment.id),
        status: payment.status,
        statusDetail: payment.status_detail,
    }
}
