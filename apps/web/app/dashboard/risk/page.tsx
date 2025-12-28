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
    const [games, setGames] = useState<Game[]>([])
    const [selectedGame, setSelectedGame] = useState<string>("")
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
    const [report, setReport] = useState<LiabilityItem[]>([])
    const [loading, setLoading] = useState(true)

    // Fetch Games on mount
    useEffect(() => {
        const fetchGames = async () => {
            try {
                const token = localStorage.getItem("token")
                const res = await fetch(`${API_URL}/games`, {
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
    }, [])

    // Fetch Report when selections change
    useEffect(() => {
        if (!selectedGame || !selectedDate) return

        const fetchReport = async () => {
            setLoading(true)
            try {
                const token = localStorage.getItem("token")
                const res = await fetch(`${API_URL}/draws/liability-report?gameId=${selectedGame}&drawDate=${selectedDate}`, {
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <ShieldAlert className="w-8 h-8 text-red-500" />
                        </div>
                        Gestão de Risco
                    </h2>
                    <p className="text-muted-foreground mt-1 ml-14">Mapa de responsabilidade e exposição financeira por sorteio.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex-1 md:w-[200px]">
                        <Select value={selectedGame} onValueChange={setSelectedGame}>
                            <SelectTrigger className="bg-card border-border">
                                <SelectValue placeholder="Selecionar Jogo" />
                            </SelectTrigger>
                            <SelectContent>
                                {games.map(g => (
                                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <input
                        type="date"
                        className="bg-card border border-border p-2 rounded-md text-sm text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                </div>
            </div>

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
                                <ResponsiveContainer width="100%" height="100%">
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
                <Card className="col-span-1 md:col-span-3 border-border bg-card shadow-sm">
                    <CardHeader>
                        <CardTitle>Detalhamento por Número</CardTitle>
                        <CardDescription>Lista completa de liablity descendente.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[400px] overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-muted-foreground sticky top-0 uppercase text-[10px] font-bold">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Número</th>
                                        <th className="px-4 py-3 text-right">Potencial</th>
                                        <th className="px-4 py-3 text-right">% Limite</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {report.map(item => (
                                        <tr key={item.number} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-4 py-3 font-mono font-bold text-foreground">
                                                {item.number}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.liability)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`text-xs font-bold ${item.liability > maxLiability * 0.8 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                    {((item.liability / maxLiability) * 100).toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {report.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">
                                                Sem dados para exibição.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
