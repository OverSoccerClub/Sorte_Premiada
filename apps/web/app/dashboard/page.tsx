"use client"

import { API_URL } from "@/lib/api"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, Users, Ticket, TrendingUp, ArrowUpRight, User, Calendar, LayoutDashboard } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from "sonner"

interface DashboardStats {
    totalSales: number;
    ticketsSold: number;
    averageTicket: number;
    activeCambistas: number;
    recentSales: {
        id: string;
        amount: string;
        createdAt: string;
        user: {
            username: string;
            name: string | null;
            email: string | null;
        }
    }[];
    chartData: {
        date: string;
        amount: number;
    }[];
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem("token")
                const res = await fetch(`${API_URL}/reports/dashboard`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (res.ok) {
                    const data = await res.json()
                    setStats(data)
                } else {
                    toast.error("Erro ao carregar estatísticas")
                }
            } catch (error) {
                toast.error("Erro de conexão")
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [])

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
            title: "Vendas Totais",
            value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(stats.totalSales)),
            icon: DollarSign,
            description: "Receita acumulada",
            trend: "up",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10"
        },
        {
            title: "Cambistas Ativos",
            value: stats.activeCambistas,
            icon: Users,
            description: "Equipe de vendas",
            trend: "up",
            color: "text-blue-400",
            bg: "bg-blue-500/10"
        },
        {
            title: "Bilhetes Vendidos",
            value: stats.ticketsSold,
            icon: Ticket,
            description: "Total de apostas",
            trend: "up",
            color: "text-purple-400",
            bg: "bg-purple-500/10"
        },
        {
            title: "Ticket Médio",
            value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.averageTicket),
            icon: TrendingUp,
            description: "Média por aposta",
            trend: "up",
            color: "text-orange-400",
            bg: "bg-orange-500/10"
        }
    ]

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
                <Card className="col-span-4 border-border bg-card shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-foreground">Evolução de Vendas</CardTitle>
                        <CardDescription className="text-muted-foreground">Receita dos últimos 7 dias</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full" style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
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
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.2 }} />
                                    <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3 border-border bg-card shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-foreground">Vendas Recentes</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Últimas 5 transações realizadas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {(stats.recentSales || []).length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">Nenhuma venda recente.</div>
                            ) : (
                                (stats.recentSales || []).map((sale, i) => (
                                    <div key={sale.id} className="flex items-center">
                                        <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center">
                                            <User className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none text-foreground">{sale.user.name || sale.user.username}</p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(sale.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <div className="ml-auto font-medium text-emerald-500">
                                            +{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(sale.amount))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
