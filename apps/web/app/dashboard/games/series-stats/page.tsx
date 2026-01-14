"use client"

import { API_URL } from "@/lib/api"
import { useEffect, useState } from "react"
import { useActiveCompanyId } from "@/context/use-active-company"
import { SeriesStatsCard } from "@/components/dashboard/series-stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, BarChart3 } from "lucide-react"
import { useAlert } from "@/context/alert-context"

interface SeriesStats {
    seriesNumber: number;
    drawDate: string;
    ticketsSold: number;
    ticketsRemaining: number;
    percentageFilled: number;
    status: 'ACTIVE' | 'FULL' | 'CLOSED' | 'PAUSED';
    areaName?: string;
    areaId?: string;
    isActive?: boolean;
}

interface GameSeriesStats {
    gameId: string;
    gameName: string;
    maxTicketsPerSeries: number;
    series: SeriesStats[];
}

export default function GameSeriesStatsPage() {
    const { showAlert } = useAlert()
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
                        showAlert("Erro!", "Jogo 2x1000 não encontrado", "error")
                    }
                }
            } catch (error) {
                console.error("Error fetching games:", error)
                showAlert("Erro!", "Erro ao carregar jogos", "error")
            }
        }

        fetchGameId()
    }, [activeCompanyId])

    const fetchStats = async () => {
        if (!gameId) return;

        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/tickets/series-stats/${gameId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (res.ok) {
                const data = await res.json()
                setStats(data)
            }
        } catch (error) {
            console.error("Error fetching series stats:", error)
        } finally {
            setLoading(false)
        }
    }

    // Fetch series stats when gameId is available
    useEffect(() => {
        fetchStats()

        // Auto-refresh every 30 seconds
        const intervalId = setInterval(fetchStats, 30000)
        return () => clearInterval(intervalId)
    }, [gameId])

    const handleToggleStatus = async (areaId: string, currentStatus: boolean) => {
        try {
            const token = localStorage.getItem("token")
            const newStatus = !currentStatus; // Toggle

            // Optimistic update
            setStats(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    series: prev.series.map(s =>
                        s.areaId === areaId
                            ? { ...s, isActive: newStatus, status: newStatus ? 'ACTIVE' : 'PAUSED' }
                            : s
                    )
                };
            });

            const res = await fetch(`${API_URL}/areas/${areaId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ isActive: newStatus }),
            });

            if (res.ok) {
                showAlert("Sucesso!", newStatus ? "Praça ativada com sucesso!" : "Praça pausada com sucesso!", "success");
                fetchStats(); // Refresh to ensure sync
            } else {
                showAlert("Erro!", "Erro ao atualizar status da praça.", "error");
                fetchStats(); // Revert on error
            }
        } catch (error) {
            console.error("Error toggling status:", error);
            showAlert("Erro!", "Erro de conexão.", "error");
            fetchStats(); // Revert on error
        }
    }

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
                        Painel de Controle de Séries
                    </h2>
                    <p className="text-muted-foreground mt-1 ml-14">Acompanhe e gerencie as séries ativas por praça.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Nenhum dado disponível</CardTitle>
                        <CardDescription>
                            Não foi possível carregar as informações ou não há praças cadastradas.
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
                    Painel de Controle de Séries
                </h2>
                <p className="text-muted-foreground mt-1 ml-14">
                    Acompanhe em tempo real e gerencie (pause/ative) as vendas por praça.
                </p>
            </div>

            <SeriesStatsCard
                gameName={stats.gameName}
                maxTicketsPerSeries={stats.maxTicketsPerSeries}
                series={stats.series}
                onToggleStatus={handleToggleStatus}
            />
        </div>
    )
}
