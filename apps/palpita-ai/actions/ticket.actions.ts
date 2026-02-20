'use server'

import { z } from 'zod'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const pickSchema = z.object({
    matchId: z.string(),
    pick: z.enum(['HOME', 'DRAW', 'AWAY']),
})

const createTicketSchema = z.object({
    championshipId: z.string(),
    picks: z.array(pickSchema).length(14, 'É necessário palpitar em todos os 14 jogos'),
})

export async function createTicketAction(championshipId: string, picksRaw: { matchId: string, pick: 'HOME' | 'DRAW' | 'AWAY' }[]) {
    // 1. Autenticação
    const session = await getSession()
    if (!session) {
        return { error: 'Você precisa estar logado para apostar' }
    }

    if (!championshipId) return { error: 'Campeonato não identificado' }

    // Validar formato dos picks
    const picksParse = z.array(pickSchema).safeParse(picksRaw)
    if (!picksParse.success) {
        return { error: 'Dados dos palpites inválidos' }
    }
    const picks = picksParse.data

    if (picks.length !== 14) return { error: 'É necessário completar os 14 palpites' }

    // 3. Buscar campeonato para validar os jogos
    const championship = await db.palpitaChampionship.findUnique({
        where: { id: championshipId },
        include: { matches: { orderBy: { order: 'asc' } } }
    })

    if (!championship) return { error: 'Campeonato não encontrado' }
    if (championship.status !== 'OPEN') return { error: 'Este campeonato não está mais recebendo apostas' }

    // Validar se os jogos existem no campeonato (opcional mas bom)
    const matchIds = new Set(championship.matches.map(m => m.id))
    for (const p of picks) {
        if (!matchIds.has(p.matchId)) {
            return { error: `Partida inválida: ${p.matchId}` }
        }
    }

    let ticketId: string | undefined

    try {
        // 5. Criar Bilhete
        const ticket = await db.palpitaTicket.create({
            data: {
                userId: session.id,
                championshipId: championshipId,
                status: 'PENDING',
                picks: {
                    createMany: {
                        data: picks.map(p => ({
                            matchId: p.matchId,
                            pick: p.pick
                        }))
                    }
                }
            }
        })

        ticketId = ticket.id
        revalidatePath('/dashboard')
    } catch (err) {
        console.error('[createTicket]', err)
        return { error: 'Erro ao registrar aposta' }
    }

    if (ticketId) {
        redirect(`/pagamento/${ticketId}`)
    }
}

export async function getActiveChampionship() {
    const championship = await db.palpitaChampionship.findFirst({
        where: { status: 'OPEN' },
        include: {
            matches: {
                orderBy: { order: 'asc' }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    return championship
}

export async function getUserTickets() {
    const session = await getSession()
    if (!session) return []

    const tickets = await db.palpitaTicket.findMany({
        where: { userId: session.id },
        include: {
            championship: true,
            payment: true,
        },
        orderBy: { createdAt: 'desc' },
    })

    return tickets
}
