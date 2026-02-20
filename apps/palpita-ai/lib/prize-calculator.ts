import type { PrizePool } from '@/types'

/**
 * Calcula o pool de prêmios do Palpita Aí:
 * - 70% do total arrecadado vai para prêmios
 * - 30% fica na banca
 * Distribuição do pool:
 * - 50% → dividido entre bilhetes com 14 acertos
 * - 15% → dividido entre bilhetes com 13 acertos
 * - 5%  → dividido entre bilhetes com 12 acertos
 */
export function calculatePrizes(
    totalCollected: number,
    winners: { hits14: number; hits13: number; hits12: number }
): PrizePool {
    const pool = totalCollected * 0.7

    return {
        totalCollected,
        pool,
        prize14: winners.hits14 > 0 ? (pool * 0.5) / winners.hits14 : 0,
        prize13: winners.hits13 > 0 ? (pool * 0.15) / winners.hits13 : 0,
        prize12: winners.hits12 > 0 ? (pool * 0.05) / winners.hits12 : 0,
        bankProfit: totalCollected * 0.3,
        winners14: winners.hits14,
        winners13: winners.hits13,
        winners12: winners.hits12,
    }
}

export function countHits(
    picks: { matchId: string; pick: string }[],
    results: { matchId: string; result: string }[]
): number {
    const resultMap = new Map(results.map((r) => [r.matchId, r.result]))
    return picks.filter((p) => resultMap.get(p.matchId) === p.pick).length
}

export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value)
}
