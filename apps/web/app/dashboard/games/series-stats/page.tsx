"use client"

import { API_URL } from "@/lib/api"
import { useEffect, useState } from "react"
import { useActiveCompanyId } from "@/context/use-active-company"
import { SeriesStatsCard } from "@/components/dashboard/series-stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, BarChart3 } from "lucide-react"
import { toast } from "sonner"

interface SeriesStats {
    seriesNumber: number;
    drawDate: string;
    ticketsSold: number;
    ticketsRemaining: number;
    percentageFilled: number;
    status: 'ACTIVE' | 'FULL' | 'CLOSED';
}

interface GameSeriesStats {
    gameId: string;
    gameName: string;
    maxTicketsPerSeries: number;
    series: SeriesStats[];
}

export default function GameSeriesStatsPage() {
    const activeCompanyId = useActiveCompanyId()
    const [stats, setStats] = useState<GameSeriesStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [gameId, setGameId] = useState<string | null>(null)

    // Fetch 2x1000 game ID first
    useEffect(() => {
        const fetchGameId = async () => {
            try {
                const token = localStorage.getItem("token")
                const queryParams = new URLSearchParams()
                if (activeCompanyId) {
                    queryParams.append('targetCompanyId', activeCompanyId)
                }

                const res = await fetch(`${API_URL}/games?${queryParams.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })

                if (res.ok) {
                    const games = await res.json()
                    // Find 2x1000 game
                    const game2x1000 = games.find((g: any) => g.name === '2x1000')
                    if (game2x1000) {
                        setGameId(game2x1000.id)
                    } else {
                        toast.error("Jogo 2x1000 não encontrado")
                    }
                }
            } catch (error) {
                console.error("Error fetching games:", error)
                toast.error("Erro ao carregar jogos")
            }
        }

        fetchGameId()
    }, [activeCompanyId])

    // Fetch series stats when gameId is available
    useEffect(() => {
        if (!gameId) return

        const fetchStats = async () => {
            try {
                const token = localStorage.getItem("token")
                const res = await fetch(`${API_URL}/tickets/series-stats/${gameId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })

                if (res.ok) {
                    const data = await res.json()
                    setStats(data)
                } else {
                    toast.error("Erro ao carregar estatísticas")
                }
            } catch (error) {
                console.error("Error fetching series stats:", error)
                toast.error("Erro de conexão")
            } finally {
                setLoading(false)
            }
        }

        fetchStats()

        // Auto-refresh every 30 seconds
        const intervalId = setInterval(fetchStats, 30000)
        return () => clearInterval(intervalId)
    }, [gameId])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-100px)]">
                <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
            </div>
        )
    }

    if (!stats) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <BarChart3 className="w-8 h-8 text-emerald-500" />
                        </div>
                        Estatísticas de Vendas por Série
                    </h2>
                    <p className="text-muted-foreground mt-1 ml-14">Acompanhe o desempenho de vendas de cada série do jogo 2x1000.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Nenhum dado disponível</CardTitle>
                        <CardDescription>
                            Não foi possível carregar as estatísticas de vendas. Verifique se há séries cadastradas.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <BarChart3 className="w-8 h-8 text-emerald-500" />
                    </div>
                    Estatísticas de Vendas por Série
                </h2>
                <p className="text-muted-foreground mt-1 ml-14">
                    Acompanhe o desempenho de vendas de cada série do jogo 2x1000.
                </p>
            </div>

            <SeriesStatsCard
                gameName={stats.gameName}
                maxTicketsPerSeries={stats.maxTicketsPerSeries}
                series={stats.series}
            />
        </div>
    )
}
