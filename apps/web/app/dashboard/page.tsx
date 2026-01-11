"use client"

import { API_URL } from "@/lib/api"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, Users, Ticket, TrendingUp, ArrowUpRight, User, Calendar, LayoutDashboard, Trophy, Medal, Star, Search, Filter, Hash, BarChart3, PieChart as PieChartIcon, Activity, Wallet, Percent } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface DashboardStats {
    totalSales: number;
    ticketsSold: number;
    averageTicket: number;
    activeCambistas: number;
    recentSales: {
        id: string;
        amount: string;
        createdAt: string;
        gameName: string;
        numbers: string[];
        user: {
            id: string;
            username: string;
            name: string | null;
        };
        cambistaDailyTotal: number;
        ticketNumber: number | null;
        secondChanceNumber: number | null;
    }[];
    ranking: {
        userId: string;
        name: string;
        amount: number;
        count: number;
    }[];
    chartData: {
        date: string;
        amount: number;
    }[];
    statusBreakdown: {
        status: string;
        count: number;
    }[];
    revenueByGame: {
        game: string;
        amount: number;
    }[];
    hourlySales: {
        hour: string;
        amount: number;
    }[];
    profitMetrics: {
        monthlyRevenue: number;
        monthlyPayout: number;
        netProfit: number;
    };
}

import { useActiveCompanyId } from "@/context/use-active-company"

export default function DashboardPage() {
    const activeCompanyId = useActiveCompanyId()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [filterGame, setFilterGame] = useState("all")
    const [searchTerm, setSearchTerm] = useState("")
    const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem("token")
                // Adicionar targetCompanyId se houver empresa ativa selecionada (para MASTER)
                const queryParams = new URLSearchParams()
                if (activeCompanyId) {
                    queryParams.append('targetCompanyId', activeCompanyId)
                }

                const res = await fetch(`${API_URL}/reports/dashboard?${queryParams.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (res.ok) {
                    const data = await res.json()
                    setStats(data)
                } else {
                    // toast.error("Erro ao carregar estatísticas") // Silently fail on background refresh or handle differently
                }
            } catch (error) {
                // toast.error("Erro de conexão")
            } finally {
                setLoading(false)
            }
        }

        fetchStats()

        // Auto-refresh every 10 seconds
        const intervalId = setInterval(fetchStats, 10000)

        return () => clearInterval(intervalId)
    }, [activeCompanyId]) // Recarregar quando mudar a empresa ativa

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-100px)]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        )
    }

    if (!stats) return null

    const statCards = [
        {
            title: "Vendas (Mês)",
            value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.profitMetrics?.monthlyRevenue || 0),
            icon: DollarSign,
            description: "Faturamento bruto mensal",
            trend: "up",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10"
        },
        {
            title: "Prêmios Pagos",
            value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.profitMetrics?.monthlyPayout || 0),
            icon: Trophy,
            description: "Total pago em prêmios",
            trend: "up",
            color: "text-red-400",
            bg: "bg-red-500/10"
        },
        {
            title: "Lucro Líquido",
            value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.profitMetrics?.netProfit || 0),
            icon: Wallet,
            description: "Vendas - Prêmios/Debitos",
            trend: "up",
            color: "text-blue-400",
            bg: "bg-blue-500/10"
        },
        {
            title: "Ticket Médio",
            value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.averageTicket),
            icon: Percent,
            description: "Média por aposta",
            trend: "up",
            color: "text-purple-400",
            bg: "bg-purple-500/10"
        }
    ]

    const STATUS_COLORS = {
        'WON': '#10b981',    // Emerald
        'LOST': '#ef4444',   // Red
        'PENDING': '#f59e0b', // Amber
        'CANCELLED': '#6b7280', // Gray
        'EXPIRED': '#374151'   // Slate
    };

    const CHART_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];

    const CustomTooltip = ({ active, payload, label }: { active?: boolean, payload?: any[], label?: string | number | Date }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card border border-border p-3 shadow-lg rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground">{new Date(label || "").toLocaleDateString('pt-BR')}</p>
                    <p className="text-sm font-bold text-emerald-500">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload[0].value as number)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <LayoutDashboard className="w-8 h-8 text-emerald-500" />
                    </div>
                    Dashboard
                </h2>
                <p className="text-muted-foreground mt-1 ml-14">Visão geral do desempenho do sistema.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon
                    return (
                        <Card key={index} className="border-border bg-card shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                <div className={`p-2 rounded-full ${stat.bg}`}>
                                    <Icon className={`w-4 h-4 ${stat.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <span className="text-emerald-500 font-medium flex items-center">
                                        <ArrowUpRight className="w-3 h-3 mr-0.5" />
                                        {stat.description}
                                    </span>
                                </p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Evolution Area Chart */}
                <Card className="col-span-1 md:col-span-4 border-border bg-card shadow-sm h-full">
                    <CardHeader className="bg-muted/30 border-b border-border">
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                            Tendência de Vendas
                        </CardTitle>
                        <CardDescription>Volume de apostas nas últimas 24 horas</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                <AreaChart data={stats.hourlySales || []}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                    <XAxis
                                        dataKey="hour"
                                        stroke="#94a3b8"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `R$${value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                        itemStyle={{ color: '#10b981' }}
                                    />
                                    <Area type="monotone" dataKey="amount" stroke="#10b981" fillOpacity={1} fill="url(#colorSales)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Breakdown Pie Chart */}
                <Card className="col-span-1 md:col-span-3 border-border bg-card shadow-sm h-full">
                    <CardHeader className="bg-muted/30 border-b border-border">
                        <CardTitle className="flex items-center gap-2">
                            <PieChartIcon className="w-5 h-5 text-emerald-500" />
                            Status dos Bilhetes (Mês)
                        </CardTitle>
                        <CardDescription>Distribuição de prêmios e apurações</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center pt-0">
                        <div className="h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                <PieChart>
                                    <Pie
                                        data={stats.statusBreakdown.map(item => ({
                                            ...item,
                                            status: {
                                                'PENDING': 'Aguardando',
                                                'WON': 'Premiado',
                                                'LOST': 'Expirado',
                                                'CANCELLED': 'Cancelado',
                                                'EXPIRED': 'Expirado'
                                            }[item.status] || item.status
                                        })) || []}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="count"
                                        nameKey="status"
                                    >
                                        {(stats.statusBreakdown || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || '#8884d8'} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full mt-2">
                            {(stats.statusBreakdown || []).slice(0, 4).map((item) => (
                                <div key={item.status} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] }} />
                                    <span className="text-xs text-muted-foreground font-medium uppercase">
                                        {{
                                            'PENDING': 'Aguardando',
                                            'WON': 'Premiado',
                                            'LOST': 'Expirado',
                                            'CANCELLED': 'Cancelado',
                                            'EXPIRED': 'Expirado'
                                        }[item.status] || item.status}: {item.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mt-6">
                {/* Revenue by Game Horizontal Bars */}
                <Card className="col-span-1 md:col-span-4 border-border bg-card shadow-sm h-full">
                    <CardHeader className="bg-muted/30 border-b border-border">
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-emerald-500" />
                            Receita por Jogo (Mês)
                        </CardTitle>
                        <CardDescription>Volume financeiro por modalidade</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                <BarChart layout="vertical" data={stats.revenueByGame || []} margin={{ left: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                                    <XAxis type="number" stroke="#94a3b8" fontSize={12} hide />
                                    <YAxis
                                        dataKey="game"
                                        type="category"
                                        stroke="#94a3b8"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        width={100}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                        formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                                    />
                                    <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={25}>
                                        {(stats.revenueByGame || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Seller Ranking */}
                <Card className="col-span-1 md:col-span-3 border-border bg-card shadow-sm h-full">
                    <CardHeader className="bg-muted/30 border-b border-border">
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                            Ranking de Vendedores (Mês Atual)
                        </CardTitle>
                        <CardDescription>Cambistas com maior volume de vendas este mês.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {(stats.ranking || []).map((rank, index) => (
                                <div key={rank.userId} className="flex items-center group">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 text-foreground font-bold mr-4 relative">
                                        {index === 0 && <Medal className="w-5 h-5 text-yellow-500 absolute -top-2 -left-2 drop-shadow-sm" />}
                                        {index === 1 && <Medal className="w-5 h-5 text-slate-400 absolute -top-2 -left-2 drop-shadow-sm" />}
                                        {index === 2 && <Medal className="w-5 h-5 text-amber-700 absolute -top-2 -left-2 drop-shadow-sm" />}
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate text-foreground group-hover:text-emerald-500 transition-colors">
                                            {rank.name}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className="flex items-center">
                                                <Ticket className="w-3 h-3 mr-1" />
                                                {rank.count} apostas
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-foreground">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rank.amount)}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Saldo do Mês</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-border bg-card shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                                Vendas Automáticas em Tempo Real
                            </CardTitle>
                            <CardDescription>
                                Vendas processadas no sistema hoje.
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar cambista..."
                                    className="pl-9 w-[200px] h-9 bg-background"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={filterGame} onValueChange={setFilterGame}>
                                <SelectTrigger className="w-[150px] h-9 bg-background">
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-4 h-4 text-muted-foreground" />
                                        <SelectValue placeholder="Jogo" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Jogos</SelectItem>
                                    <SelectItem value="JOGO_DO_BICHO">Bicho</SelectItem>
                                    <SelectItem value="2x1000">2x1000</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">ID</th>
                                    <th className="px-6 py-4 font-semibold">Data/Hora</th>
                                    <th className="px-6 py-4 font-semibold">Cambista</th>
                                    <th className="px-6 py-4 font-semibold">Jogo</th>
                                    <th className="px-6 py-4 font-semibold">Bilhete</th>
                                    <th className="px-6 py-4 font-semibold">Números</th>
                                    <th className="px-6 py-4 font-semibold">Chance Extra</th>
                                    <th className="px-10 py-4 font-semibold text-center">Valor</th>
                                    <th className="px-6 py-4 font-semibold text-right">Total Cambista (Hoje)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {(() => {
                                    const filtered = (stats.recentSales || [])
                                        .filter(s => filterGame === "all" || s.gameName?.toUpperCase().includes(filterGame))
                                        .filter(s => !searchTerm || (s.user.name || s.user.username).toLowerCase().includes(searchTerm.toLowerCase()));

                                    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

                                    return paginated.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-muted/20 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono text-[10px] text-muted-foreground bg-muted p-1 rounded">
                                                    {sale.id.split('-')[0]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-foreground font-medium">
                                                        {new Date(sale.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {new Date(sale.createdAt).toLocaleDateString('pt-BR')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-xs ring-1 ring-emerald-500/20">
                                                        {sale.user.username.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="font-semibold text-foreground">{sale.user.name || sale.user.username}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 uppercase font-medium">
                                                    {sale.gameName}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-700">
                                                    {sale.ticketNumber ? sale.ticketNumber.toString().padStart(4, '0') : '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                                                    <Ticket className="w-3 h-3" />
                                                    {sale.numbers
                                                        .map(n => parseInt(n)) // Convert to number for sorting
                                                        .sort((a, b) => a - b) // Sort numbers ascending
                                                        .map(n => n.toString().padStart(4, '0')) // Pad with zeros
                                                        .join(' - ')
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs text-muted-foreground">
                                                    {sale.secondChanceNumber || '-'}
                                                </span>
                                            </td>
                                            <td className="px-10 py-4 text-center">
                                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full font-bold">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(sale.amount))}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="text-sm font-bold text-foreground">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.cambistaDailyTotal)}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground uppercase">Saldo acumulado</div>
                                            </td>
                                        </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Exibir</span>
                            <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                                <SelectTrigger className="w-[80px] h-8 bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5</SelectItem>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="15">15</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                            <span className="text-sm text-muted-foreground">por página</span>
                        </div>

                        {(() => {
                            const filtered = (stats.recentSales || [])
                                .filter(s => filterGame === "all" || s.gameName?.toUpperCase().includes(filterGame))
                                .filter(s => !searchTerm || (s.user.name || s.user.username).toLowerCase().includes(searchTerm.toLowerCase()));
                            const totalPages = Math.ceil(filtered.length / itemsPerPage);

                            return (
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="h-8"
                                    >
                                        Anterior
                                    </Button>
                                    <div className="text-sm font-medium">
                                        Página {currentPage} de {Math.max(1, totalPages)}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className="h-8"
                                    >
                                        Próxima
                                    </Button>
                                </div>
                            );
                        })()}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
