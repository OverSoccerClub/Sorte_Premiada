'use server'

import { z } from 'zod'
import { db } from '@/lib/db'
import { setAdminSession, clearAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// ─── Admin Login ────────────────────────────────────────────────────────────

export async function adminLoginAction(_: unknown, formData: FormData) {
    const password = formData.get('password') as string
    const secret = process.env.ADMIN_SECRET || 'admin123'

    if (password !== secret) {
        return { error: 'Senha incorreta' }
    }

    await setAdminSession()
    redirect('/admin')
}

export async function adminLogoutAction() {
    await clearAdminSession()
    redirect('/admin/login')
}

// ─── Championship ────────────────────────────────────────────────────────────

const matchSchema = z.object({
    homeTeam: z.string().min(1),
    awayTeam: z.string().min(1),
})

const championshipSchema = z.object({
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    description: z.string().optional(),
    drawDate: z.string().min(1, 'Data do sorteio é obrigatória'),
})

export async function createChampionshipAction(_: unknown, formData: FormData) {
    const raw = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        drawDate: formData.get('drawDate') as string,
    }

    const parsed = championshipSchema.safeParse(raw)
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
    }

    // Coletar as 14 partidas
    const matches: { homeTeam: string; awayTeam: string; homeTeamLogo?: string | null; awayTeamLogo?: string | null; order: number }[] = []
    for (let i = 1; i <= 14; i++) {
        const homeTeam = formData.get(`match_${i}_home`) as string
        const awayTeam = formData.get(`match_${i}_away`) as string
        const homeTeamLogo = formData.get(`match_${i}_home_logo`) as string
        const awayTeamLogo = formData.get(`match_${i}_away_logo`) as string

        const m = matchSchema.safeParse({ homeTeam, awayTeam })
        if (!m.success) {
            return { error: `Partida ${i}: preencha os dois times` }
        }
        matches.push({
            homeTeam,
            awayTeam,
            homeTeamLogo: homeTeamLogo || null,
            awayTeamLogo: awayTeamLogo || null,
            order: i
        })
    }

    let championshipId: string | undefined

    try {
        const championship = await db.palpitaChampionship.create({
            data: {
                name: parsed.data.name,
                description: parsed.data.description || null,
                drawDate: new Date(parsed.data.drawDate),
                status: 'OPEN',
                matches: {
                    create: matches,
                },
            },
        })

        championshipId = championship.id
        revalidatePath('/admin/campeonatos')
    } catch (err) {
        console.error('[createChampionship]', err)
        return { error: 'Erro ao criar campeonato' }
    }

    if (championshipId) {
        redirect(`/admin/campeonatos/${championshipId}`)
    }
}

export async function closeChampionshipAction(championshipId: string) {
    await db.palpitaChampionship.update({
        where: { id: championshipId },
        data: { status: 'CLOSED' },
    })
    revalidatePath(`/admin/campeonatos/${championshipId}`)
}

// ─── Match Result ─────────────────────────────────────────────────────────────

export async function setMatchResultAction(matchId: string, result: 'HOME' | 'DRAW' | 'AWAY') {
    await db.palpitaMatch.update({
        where: { id: matchId },
        data: { result },
    })
    revalidatePath('/admin/campeonatos')
}

// ─── Prize Distribution ───────────────────────────────────────────────────────

export async function distributeChampionshipPrizesAction(championshipId: string) {
    // Buscar campeonato com partidas e resultados
    const championship = await db.palpitaChampionship.findUnique({
        where: { id: championshipId },
        include: {
            matches: true,
            tickets: {
                where: { status: 'PAID' },
                include: { picks: true },
            },
        },
    })

    if (!championship) return { error: 'Campeonato não encontrado' }

    // Verificar se todos os resultados foram lançados
    const allResultsSet = championship.matches.every((m) => m.result !== null)
    if (!allResultsSet) return { error: 'Lance todos os resultados antes de distribuir' }

    // Calcular acertos de cada bilhete
    const resultsMap = new Map(championship.matches.map((m) => [m.id, m.result]))

    const ticketHits = championship.tickets.map((ticket) => {
        const hits = ticket.picks.filter((pick) => resultsMap.get(pick.matchId) === pick.pick).length
        return { ticket, hits }
    })

    // Pool de prêmios (70% do total arrecadado)
    const totalPaid = championship.tickets.length * 10 // R$10 por bilhete
    const prizePool = totalPaid * 0.7

    // Grupos de vencedores
    const winners14 = ticketHits.filter((t) => t.hits === 14)
    const winners13 = ticketHits.filter((t) => t.hits === 13)
    const winners12 = ticketHits.filter((t) => t.hits === 12)

    // Calcular prêmio por bilhete em cada grupo
    const prize14 = winners14.length > 0 ? (prizePool * 0.5) / winners14.length : 0
    const prize13 = winners13.length > 0 ? (prizePool * 0.15) / winners13.length : 0
    const prize12 = winners12.length > 0 ? (prizePool * 0.05) / winners12.length : 0

    // Atualizar bilhetes no banco
    await Promise.all([
        ...winners14.map(({ ticket }) =>
            db.palpitaTicket.update({
                where: { id: ticket.id },
                data: { hits: 14, prize: prize14, status: 'WINNER' },
            })
        ),
        ...winners13.map(({ ticket }) =>
            db.palpitaTicket.update({
                where: { id: ticket.id },
                data: { hits: 13, prize: prize13, status: 'WINNER' },
            })
        ),
        ...winners12.map(({ ticket }) =>
            db.palpitaTicket.update({
                where: { id: ticket.id },
                data: { hits: 12, prize: prize12, status: 'WINNER' },
            })
        ),
        // Atualizar bilhetes sem prêmio com número de acertos
        ...ticketHits
            .filter((t) => t.hits < 12)
            .map(({ ticket, hits }) =>
                db.palpitaTicket.update({
                    where: { id: ticket.id },
                    data: { hits, prize: 0, status: 'PAID' },
                })
            ),
    ])

    // Fechar campeonato
    await db.palpitaChampionship.update({
        where: { id: championshipId },
        data: { status: 'FINISHED' },
    })

    revalidatePath(`/admin/campeonatos/${championshipId}`)
    revalidatePath('/admin')

    return {
        success: true,
        stats: {
            totalTickets: championship.tickets.length,
            prizePool: prizePool.toFixed(2),
            winners14: winners14.length,
            winners13: winners13.length,
            winners12: winners12.length,
            prize14: prize14.toFixed(2),
            prize13: prize13.toFixed(2),
            prize12: prize12.toFixed(2),
        },
    }
}
