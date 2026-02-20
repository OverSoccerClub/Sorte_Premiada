// Types globais do Palpita Aí

export type MatchResult = 'HOME' | 'DRAW' | 'AWAY'
export type ChampStatus = 'OPEN' | 'CLOSED' | 'FINISHED'
export type TicketStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'WINNER'
export type PayMethod = 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD'
export type PayStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export interface Match {
    id: string
    homeTeam: string
    awayTeam: string
    homeTeamLogo?: string
    awayTeamLogo?: string
    order: number
    result?: MatchResult
}

export interface Championship {
    id: string
    name: string
    description?: string
    status: ChampStatus
    drawDate: Date
    matches: Match[]
}

export interface TicketPick {
    matchId: string
    pick: MatchResult
}

export interface UserSession {
    id: string
    name: string
    email: string
}

export interface ActionResult<T = void> {
    success: boolean
    data?: T
    error?: string
}

export interface PrizePool {
    totalCollected: number
    pool: number
    prize14: number
    prize13: number
    prize12: number
    bankProfit: number
    winners14: number
    winners13: number
    winners12: number
}
