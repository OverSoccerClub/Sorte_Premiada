"use client"

import { API_URL } from "@/lib/api"
import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertTriangle, TrendingDown, TrendingUp, BarChart3, Filter, Calendar, Activity, ShieldAlert, BadgeInfo } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StandardPageHeader } from "@/components/standard-page-header"
import { StandardPagination } from "@/components/standard-pagination"
import { useActiveCompanyId } from "@/context/use-active-company"

interface LiabilityItem {
    number: string;
    liability: number;
}

interface Game {
    id: string;
    name: string;
    maxLiability: string;
}

export default function RiskPage() {
    const activeCompanyId = useActiveCompanyId()
    const [games, setGames] = useState<Game[]>([])
    const [selectedGame, setSelectedGame] = useState<string>("")
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
    const [report, setReport] = useState<LiabilityItem[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState<number | "all">(10)

    // Fetch Games on mount
    useEffect(() => {
        const fetchGames = async () => {
            try {
                const token = localStorage.getItem("token")
                const queryParams = new URLSearchParams()
                if (activeCompanyId) queryParams.append('targetCompanyId', activeCompanyId)

                const res = await fetch(`${API_URL}/games?${queryParams.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (res.ok) {
                    const data = await res.json()
                    setGames(data)
                    if (data.length > 0) setSelectedGame(data[0].id)
                }
            } catch (error) {
                console.error(error)
            }
        }
        fetchGames()
    }, [activeCompanyId])

    // Fetch Report when selections change
    useEffect(() => {
        if (!selectedGame || !selectedDate) return

        const fetchReport = async () => {
            setLoading(true)
            try {
                const token = localStorage.getItem("token")
                let url = `${API_URL}/draws/liability-report?gameId=${selectedGame}&drawDate=${selectedDate}`
                if (activeCompanyId) url += `&targetCompanyId=${activeCompanyId}`

                const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (res.ok) {
                    const data = await res.json()
                    setReport(data)
                }
            } catch (error) {
                toast.error("Erro ao carregar mapa de risco")
            } finally {
                setLoading(false)
            }
        }
        fetchReport()
    }, [selectedGame, selectedDate])

    const currentGame = useMemo(() => games.find(g => g.id === selectedGame), [games, selectedGame])
    const maxLiability = Number(currentGame?.maxLiability || 5000)

    const stats = useMemo(() => {
        const total = report.reduce((sum, item) => sum + item.liability, 0)
        const highest = report.length > 0 ? report[0] : null
        const riskLevel = highest ? (highest.liability / maxLiability) * 100 : 0
        return { total, highest, riskLevel }
    }, [report, maxLiability])

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <StandardPageHeader
                icon={<ShieldAlert className="w-8 h-8 text-red-500" />}
                title="Gestão de Risco"
                description="Mapa de responsabilidade e exposição financeira por sorteio."
                onRefresh={() => {
                    // Logic to manually refresh if needed, but useEffect handles it
                    const fetchGames = async () => {
                        const token = localStorage.getItem("token")
                        const res = await fetch(`${API_URL}/games`, {
                            headers: { Authorization: `Bearer ${token}` },
                        })
                        if (res.ok) {
                            const data = await res.json()
                            setGames(data)
                        }
                    }
                    fetchGames()
                }}
                refreshing={loading}
            >
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 md:w-[200px]">
                        <Select value={selectedGame} onValueChange={setSelectedGame}>
                            <SelectTrigger className="bg-background border-border h-9 text-xs font-semibold">
                                <SelectValue placeholder="Selecionar Jogo" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                {games.map(g => (
                                    <SelectItem key={g.id} value={g.id} className="text-xs">{g.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <input
                        type="date"
                        className="bg-background border border-border px-3 h-9 rounded-md text-xs font-semibold text-foreground focus:ring-2 focus:ring-emerald-500/20 outline-none shadow-sm"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                </div>
            </StandardPageHeader>

            {/* Quick Stats */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-border bg-card shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Exposição Total</CardTitle>
                        <Activity className="w-4 h-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.total)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Soma de todos os prêmios possíveis</p>
                    </CardContent>
                </Card>

                <Card className="border-border bg-card shadow-sm border-l-4 border-l-red-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Maior Risco (Número)</CardTitle>
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{stats.highest?.number || "----"}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Responsabilidade: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.highest?.liability || 0)}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-border bg-card shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Status do Limite</CardTitle>
                        <Badge variant={stats.riskLevel > 80 ? "destructive" : "outline"}>
                            {stats.riskLevel > 80 ? "Crítico" : "Seguro"}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.riskLevel.toFixed(1)}%</div>
                        <div className="w-full bg-muted h-2 rounded-full mt-2 overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${stats.riskLevel > 80 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(100, stats.riskLevel)}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-7">
                {/* Heatmap/Chart */}
                <Card className="col-span-1 md:col-span-4 border-border bg-card shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-emerald-500" />
                            Números mais "Carregados"
                        </CardTitle>
                        <CardDescription>Top 10 números com maior volume de prêmios potenciais.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[400px] w-full">
                            {loading ? (
                                <div className="h-full w-full flex items-center justify-center animate-pulse bg-muted/20 rounded-lg">
                                    Carregando...
                                </div>
                            ) : report.length === 0 ? (
                                <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                    <BadgeInfo className="w-8 h-8 opacity-50" />
                                    Nenhuma aposta para este sorteio
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <BarChart data={report.slice(0, 10)}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                        <XAxis dataKey="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis
                                            stroke="#94a3b8"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(val) => `R$${val}`}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                            formatter={(val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)}
                                        />
                                        <Bar dataKey="liability" radius={[4, 4, 0, 0]} barSize={40}>
                                            {report.slice(0, 10).map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.liability > (maxLiability * 0.8) ? '#ef4444' : '#10b981'}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* List of Numbers */}
                <Card className="col-span-1 md:col-span-3 border-border bg-card shadow-sm overflow-hidden flex flex-col">
                    <CardHeader className="bg-muted/30 border-b border-border py-3">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-tight">
                            <BadgeInfo className="w-4 h-4 text-emerald-500" />
                            Detalhamento por Número
                        </CardTitle>
                        <CardDescription className="text-[10px]">Lista completa de responsabilidade descendente.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 flex-1">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/20 text-muted-foreground uppercase text-[10px] font-bold border-b border-border/60">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Número</th>
                                        <th className="px-4 py-2 text-right">Potencial</th>
                                        <th className="px-4 py-2 text-right">% Limite</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {(() => {
                                        const paginated = limit === "all" ? report : report.slice((page - 1) * limit, Number(page) * Number(limit));

                                        if (report.length === 0) return (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-10 text-center text-muted-foreground italic font-medium text-xs">
                                                    Sem dados para exibição.
                                                </td>
                                            </tr>
                                        );

                                        return paginated.map(item => (
                                            <tr key={item.number} className="hover:bg-muted/30 transition-colors border-b border-border/40">
                                                <td className="px-4 py-2.5 font-mono font-bold text-foreground text-xs">
                                                    {item.number}
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-bold text-xs">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.liability)}
                                                </td>
                                                <td className="px-4 py-2.5 text-right">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.liability > maxLiability * 0.8 ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                                                        {((item.liability / maxLiability) * 100).toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ));
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                    <div className="border-t border-border bg-muted/10">
                        <StandardPagination
                            currentPage={page}
                            totalPages={limit === "all" ? 1 : Math.ceil(report.length / limit)}
                            limit={limit}
                            onPageChange={setPage}
                            onLimitChange={(l) => {
                                setLimit(l)
                                setPage(1)
                            }}
                            totalItems={report.length}
                        />
                    </div>
                </Card>
            </div>
        </div>
    )
}
