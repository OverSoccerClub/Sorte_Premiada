"use client"

import { API_URL } from "@/lib/api"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, Ticket, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Activity, Receipt, CreditCard } from "lucide-react"
import { useActiveCompanyId } from "@/context/use-active-company"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface FinanceMetrics {
    pendingAccountability: number;
    pendingCount: number;
    totalPrizesPaidToday: number;
    totalSalesToday: number;
    ticketsCountToday: number;
    netBalanceToday: number;
}

export default function FinanceOverviewPage() {
    const activeCompanyId = useActiveCompanyId()
    const [metrics, setMetrics] = useState<FinanceMetrics | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const token = localStorage.getItem("token")
                const queryParams = new URLSearchParams()
                if (activeCompanyId) {
                    queryParams.append('targetCompanyId', activeCompanyId)
                }

                const res = await fetch(`${API_URL}/finance/dashboard-metrics?${queryParams.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (res.ok) {
                    const data = await res.json()
                    setMetrics(data)
                }
            } catch (error) {
                console.error("Erro ao carregar métricas financeiras", error)
            } finally {
                setLoading(false)
            }
        }

        fetchMetrics()
        const intervalId = setInterval(fetchMetrics, 30000) // Refresh every 30s
        return () => clearInterval(intervalId)
    }, [activeCompanyId])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-100px)]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        )
    }

    if (!metrics) return null

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    }

    const cards = [
        {
            title: "Vendas (Hoje)",
            value: formatCurrency(metrics.totalSalesToday),
            subValue: `${metrics.ticketsCountToday} bilhetes`,
            icon: Ticket,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            description: "Total bruto vendido nas últimas 24h"
        },
        {
            title: "Prêmios Pagos (Hoje)",
            value: formatCurrency(metrics.totalPrizesPaidToday),
            subValue: "Débitos automáticos",
            icon: CreditCard,
            color: "text-red-500",
            bg: "bg-red-500/10",
            description: "Total de prêmios pagos por cambistas"
        },
        {
            title: "Saldo Líquido (Hoje)",
            value: formatCurrency(metrics.netBalanceToday),
            subValue: "Entradas - Saídas",
            icon: TrendingUp,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            description: "Lucro operacional bruto do dia"
        },
        {
            title: "Caixas em Aberto",
            value: formatCurrency(metrics.pendingAccountability),
            subValue: `${metrics.pendingCount} caixas fechados`,
            icon: Wallet,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            description: "Valores aguardando conferência física"
        }
    ]

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/10 rounded-xl ring-1 ring-emerald-500/20">
                        <DollarSign className="w-8 h-8 text-emerald-500" />
                    </div>
                    Visão Financeira
                </h2>
                <p className="text-muted-foreground mt-1 ml-16">Acompanhamento de caixa e liquidez em tempo real.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {cards.map((card, index) => {
                    const Icon = card.icon
                    return (
                        <Card key={index} className="border-border bg-card shadow-sm hover:shadow-md transition-all duration-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {card.title}
                                </CardTitle>
                                <div className={`p-2 rounded-full ${card.bg}`}>
                                    <Icon className={`w-4 h-4 ${card.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-foreground">{card.value}</div>
                                <div className="text-xs font-medium text-muted-foreground mt-1">{card.subValue}</div>
                                <p className="text-[10px] text-muted-foreground/60 mt-3 border-t border-border pt-2 uppercase tracking-wide">
                                    {card.description}
                                </p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <div className="grid gap-6 md:grid-cols-7">
                <Card className="col-span-4 border-border bg-card shadow-sm">
                    <CardHeader className="bg-muted/30 border-b border-border">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Activity className="w-5 h-5 text-emerald-500" />
                            Métricas de Performance Operacional
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 ring-1 ring-emerald-500/20">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-foreground">Recebível Estimado (Na Rua)</p>
                                        <p className="text-xs text-muted-foreground">Vendas de hoje + Caixas em conferência</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-emerald-500">{formatCurrency(metrics.totalSalesToday + metrics.pendingAccountability)}</p>
                                    <Badge variant="outline" className="text-[10px] uppercase font-bold bg-white/5">Fluxo de Caixa</Badge>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-muted/20 rounded-2xl border border-border">
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1.5 grayscale opacity-70">Payout Rate</p>
                                    <p className="text-3xl font-black text-foreground">
                                        {metrics.totalSalesToday > 0
                                            ? ((metrics.totalPrizesPaidToday / metrics.totalSalesToday) * 100).toFixed(1)
                                            : "0.0"}%
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                                        <Activity className="w-3 h-3 text-red-400" />
                                        Exposição a prêmios sobre vendas
                                    </p>
                                </div>
                                <div className="p-5 bg-muted/20 rounded-2xl border border-border">
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1.5 grayscale opacity-70">Média de Aposta</p>
                                    <p className="text-3xl font-black text-foreground">
                                        {metrics.ticketsCountToday > 0
                                            ? formatCurrency(metrics.totalSalesToday / metrics.ticketsCountToday)
                                            : "R$ 0,00"}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                                        <Ticket className="w-3 h-3 text-blue-400" />
                                        Valor médio por bilhete emitido
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3 border-border bg-card shadow-sm">
                    <CardHeader className="bg-muted/30 border-b border-border">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-emerald-500" />
                            Gestão & Conciliação
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <Button className="w-full justify-start gap-3 h-14 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg transition-transform active:scale-95" onClick={() => window.location.href = '/dashboard/prestacao-contas'}>
                                <Wallet className="w-6 h-6" />
                                <div className="text-left">
                                    <p className="font-bold text-sm">Validar Caixas</p>
                                    <p className="text-[10px] opacity-80 font-normal">Conferir dinheiro físico recebido</p>
                                </div>
                            </Button>
                            <Button variant="outline" className="w-full justify-start gap-3 h-14 hover:bg-muted transition-colors" onClick={() => window.location.href = '/dashboard/relatorios'}>
                                <Receipt className="w-6 h-6 text-muted-foreground" />
                                <div className="text-left">
                                    <p className="font-bold text-sm">Extratos Detalhados</p>
                                    <p className="text-[10px] text-muted-foreground font-normal">Auditar todas as movimentações</p>
                                </div>
                            </Button>
                        </div>

                        <div className="mt-8 p-5 bg-blue-500/5 rounded-2xl border border-blue-500/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                            <p className="text-xs font-bold text-blue-400 uppercase flex items-center gap-1.5 mb-2">
                                <Activity className="w-3 h-3" />
                                Monitoramento Inteligente
                            </p>
                            <p className="text-xs text-muted-foreground leading-relaxed relative z-10">
                                O **Saldo Líquido** é atualizado a cada venda ou prêmio pago no POS. Use este painel para monitorar a liquidez da banca durante o dia.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
