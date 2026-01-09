"use client"

import { API_URL } from "@/lib/api"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area as ReArea, Cell, PieChart, Pie } from 'recharts'
import { Loader2, TrendingUp, Users, Globe, DollarSign, Award, Target, Map as MapIcon, ChevronRight } from "lucide-react"
import { useAlert } from "@/context/alert-context"
import { Badge } from "@/components/ui/badge"

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsPage() {
    const [overview, setOverview] = useState<any>(null)
    const [heatmap, setHeatmap] = useState<any[]>([])
    const [growth, setGrowth] = useState<any[]>([])
    const [efficiency, setEfficiency] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const { showAlert } = useAlert()

    const fetchData = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem("token")
            const [overviewRes, heatmapRes, growthRes, efficiencyRes] = await Promise.all([
                fetch(`${API_URL}/analytics/overview`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/analytics/heatmap`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/analytics/growth`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/analytics/efficiency`, { headers: { Authorization: `Bearer ${token}` } }),
            ])

            if (overviewRes.ok) setOverview(await overviewRes.json())
            if (heatmapRes.ok) setHeatmap(await heatmapRes.json())
            if (growthRes.ok) setGrowth(await growthRes.json())
            if (efficiencyRes.ok) setEfficiency(await efficiencyRes.json())
        } catch (error) {
            showAlert("Erro", "Falha ao carregar dados analíticos.", "error")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                <p className="text-muted-foreground animate-pulse text-lg font-medium">Processando Big Data...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div>
                <h2 className="text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                    <div className="p-3 bg-blue-500/10 rounded-xl shadow-inner">
                        <TrendingUp className="w-10 h-10 text-blue-500" />
                    </div>
                    Gestão Avançada (BI)
                </h2>
                <p className="text-muted-foreground mt-2 text-lg ml-1">Inteligência de mercado e análise regional em tempo real.</p>
            </div>

            {/* Quick Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-blue-500 text-white border-none shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 opacity-90">
                            <DollarSign className="w-4 h-4" /> Receita Mensal
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(overview?.monthlyRevenue || 0)}
                        </div>
                        <p className="text-xs mt-1 opacity-80">
                            {overview?.growth >= 0 ? '+' : ''}{overview?.growth}% em relação ao mês anterior
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 text-white border-none shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 opacity-90">
                            <Target className="w-4 h-4" /> Bilhetes Vendidos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{overview?.monthlyTickets?.toLocaleString()}</div>
                        <p className="text-xs mt-1 opacity-80">Volume total processado este mês</p>
                    </CardContent>
                </Card>

                <Card className="bg-emerald-600 text-white border-none shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 opacity-90">
                            <Users className="w-4 h-4" /> Cambistas Ativos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{overview?.activeCambistas}</div>
                        <p className="text-xs mt-1 opacity-80">Rede de vendas em operação</p>
                    </CardContent>
                </Card>

                <Card className="bg-orange-500 text-white border-none shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 opacity-90">
                            <Globe className="w-4 h-4" /> Praças (Áreas)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{overview?.totalAreas}</div>
                        <p className="text-xs mt-1 opacity-80">Cidades/Regiões cadastradas</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Growth Chart */}
                <Card className="col-span-1 md:col-span-4 border-border bg-card shadow-sm h-full">
                    <CardHeader className="bg-muted/30 border-b border-border">
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                            Evolução das Vendas (30 dias)
                        </CardTitle>
                        <CardDescription>Tendência de vendas acumuladas no período.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <AreaChart data={growth}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="date" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(val: any) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val), 'Vendas']}
                                    />
                                    <ReArea type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Regional Heatmap (Table + Chart) */}
                <Card className="col-span-1 md:col-span-3 border-border bg-card shadow-sm h-full">
                    <CardHeader className="bg-muted/30 border-b border-border">
                        <CardTitle className="flex items-center gap-2">
                            <MapIcon className="w-5 h-5 text-emerald-500" />
                            Performance por Praça (Heatmap)
                        </CardTitle>
                        <CardDescription>Distribuição de vendas por região geográfica.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="h-[350px] p-6">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <BarChart data={heatmap.slice(0, 8)} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" stroke="#1E293B" fontSize={12} width={100} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                                        formatter={(val: any) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val), 'Faturamento']}
                                    />
                                    <Bar dataKey="sales" radius={[0, 4, 4, 0]}>
                                        {heatmap.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-muted/10 border-t border-border p-4">
                            <div className="grid grid-cols-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                <span>Praça Mais Rentável</span>
                                <span>Total em Áreas</span>
                                <span>Market Share Top 1</span>
                            </div>
                            <div className="grid grid-cols-3 text-center mt-2 font-bold text-foreground">
                                <span>{heatmap[0]?.name || '-'}</span>
                                <span>{heatmap.length}</span>
                                <span>{heatmap.length > 0 ? ((heatmap[0].sales / overview?.monthlyRevenue) * 100).toFixed(1) : 0}%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Efficiency Table */}
            <Card className="border-border shadow-sm overflow-hidden mb-8">
                <CardHeader className="bg-muted/30 border-b border-border">
                    <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-orange-500" />
                        Ranking de Eficiência dos Cambistas
                    </CardTitle>
                    <CardDescription>Análise de vendas vs dias ativos no sistema.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/20">
                                <tr>
                                    <th className="px-6 py-4">Cambista</th>
                                    <th className="px-6 py-4">Faturamento Total</th>
                                    <th className="px-6 py-4">Dias Ativos</th>
                                    <th className="px-6 py-4">Média Diária</th>
                                    <th className="px-6 py-4 text-right">Performance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {efficiency.map((c, idx) => (
                                    <tr key={c.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs shadow-inner">
                                                    #{idx + 1}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-foreground">{c.name}</div>
                                                    <div className="text-[10px] text-muted-foreground font-medium">{c.area}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono font-medium">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.totalSales)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className="font-mono bg-blue-50/50">{c.activeDays} dias</Badge>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-emerald-600 font-semibold">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.dailyAverage)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="w-[100px] h-2 bg-slate-100 rounded-full overflow-hidden hidden md:block">
                                                    <div
                                                        className="h-full bg-emerald-500 rounded-full"
                                                        style={{ width: `${Math.min(100, (c.dailyAverage / (efficiency[0]?.dailyAverage || 1)) * 100)}%` }}
                                                    />
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
