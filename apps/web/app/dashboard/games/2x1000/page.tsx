"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { API_URL } from "@/lib/api"
import {
    Loader2,
    Calendar,
    Search,
    Ticket,
    Clock,
    User,
    Hash,
    Banknote,
    CheckCircle,
    AlertCircle,
    PlayCircle,
    ArrowUpDown,
    RefreshCw,
    Trophy
} from "lucide-react"

export default function TwoXOneThousandReportPage() {
    const [tickets, setTickets] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [gameId, setGameId] = useState<string | null>(null)
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0])
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0])
    const [cambistas, setCambistas] = useState<any[]>([])
    const [selectedCambista, setSelectedCambista] = useState<string>("all")
    const [totals, setTotals] = useState({ count: 0, amount: 0 })

    // Sort configuration state
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({
        key: 'createdAt',
        direction: 'desc'
    })

    useEffect(() => {
        const init = async () => {
            try {
                const token = localStorage.getItem("token")
                const [gamesRes, usersRes] = await Promise.all([
                    fetch(`${API_URL}/games`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API_URL}/users?role=CAMBISTA`, { headers: { Authorization: `Bearer ${token}` } })
                ])

                if (gamesRes.ok) {
                    const games = await gamesRes.json()
                    const game = games.find((g: any) => g.name === "2x1000")
                    if (game) setGameId(game.id)
                }

                if (usersRes.ok) {
                    const users = await usersRes.json()
                    setCambistas(users)
                }

            } catch (e) {
                console.error(e)
            }
        }
        init()
    }, [])

    const fetchTickets = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem("token")

            const start = new Date(startDate)
            start.setUTCHours(0, 0, 0, 0)

            const end = new Date(endDate)
            end.setUTCHours(23, 59, 59, 999)

            let url = `${API_URL}/tickets?gameId=${gameId}&startDate=${start.toISOString()}&endDate=${end.toISOString()}`

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (res.ok) {
                let data = await res.json()

                if (selectedCambista !== "all") {
                    data = data.filter((t: any) => t.userId === selectedCambista)
                }

                setTickets(data)

                const totalAmount = data.reduce((acc: number, t: any) => acc + Number(t.amount), 0)
                setTotals({
                    count: data.length,
                    amount: totalAmount
                })
            }
        } catch (e) {
            toast.error("Erro ao carregar vendas")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!gameId) return
        fetchTickets()
    }, [gameId, startDate, endDate, selectedCambista])

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }))
    }

    const sortedTickets = useMemo(() => {
        const sorted = [...tickets]
        sorted.sort((a, b) => {
            let aValue = a[sortConfig.key]
            let bValue = b[sortConfig.key]

            if (sortConfig.key === 'user') {
                aValue = a.user?.name || a.user?.username || ''
                bValue = b.user?.name || b.user?.username || ''
            } else if (sortConfig.key === 'amount') {
                aValue = Number(a.amount)
                bValue = Number(b.amount)
            } else if (sortConfig.key === 'createdAt') {
                aValue = new Date(a.createdAt).getTime()
                bValue = new Date(b.createdAt).getTime()
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
            return 0
        })
        return sorted
    }, [tickets, sortConfig])

    return (
        <div className="space-y-8 p-1 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-sm shadow-emerald-500/10">
                            <Ticket className="w-8 h-8 text-emerald-500" />
                        </div>
                        <div className="flex flex-col">
                            <span>Relatório 2x1000</span>
                            <span className="text-sm font-normal text-muted-foreground tracking-normal">
                                Gestão e acompanhamento de vendas em tempo real
                            </span>
                        </div>
                    </h2>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="relative overflow-hidden border-l-4 border-l-emerald-500 shadow-sm bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow">
                    <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none" />
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between space-y-0">
                            <div className="flex flex-col gap-1 z-10">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Banknote className="w-4 h-4" />
                                    Total Vendido
                                </span>
                                <span className="text-3xl font-bold text-emerald-500">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.amount)}
                                </span>
                            </div>
                            <div className="p-3 bg-emerald-500/10 rounded-full ring-1 ring-emerald-500/20">
                                <Banknote className="h-6 w-6 text-emerald-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-l-4 border-l-blue-500 shadow-sm bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow">
                    <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-blue-500/5 to-transparent pointer-events-none" />
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between space-y-0">
                            <div className="flex flex-col gap-1 z-10">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Ticket className="w-4 h-4" />
                                    Bilhetes Emitidos
                                </span>
                                <span className="text-3xl font-bold text-blue-500">{totals.count}</span>
                            </div>
                            <div className="p-3 bg-blue-500/10 rounded-full ring-1 ring-blue-500/20">
                                <Ticket className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters Bar */}
            <div className="bg-card/40 p-4 rounded-xl border border-border/50 shadow-sm space-y-4 md:space-y-0 md:flex md:items-end md:gap-4">
                <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-500" />
                        Período
                    </label>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-background/50 border-emerald-500/20 focus:border-emerald-500 focus:ring-emerald-500/20"
                            />
                        </div>
                        <span className="text-muted-foreground font-medium">-</span>
                        <div className="relative flex-1">
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-background/50 border-emerald-500/20 focus:border-emerald-500 focus:ring-emerald-500/20"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald-500" />
                        Cambista
                    </label>
                    <Select value={selectedCambista} onValueChange={setSelectedCambista}>
                        <SelectTrigger className="bg-background/50 border-emerald-500/20 focus:ring-emerald-500/20">
                            <SelectValue placeholder="Todos os cambistas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as Vendas</SelectItem>
                            {cambistas.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name || c.username}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    onClick={fetchTickets}
                    disabled={loading}
                    className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 min-w-[140px] h-10"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Atualizar Lista
                </Button>
            </div>

            {/* Main Table Card */}
            <Card className="overflow-hidden border-border/50 shadow-lg bg-card/60 backdrop-blur-sm">
                <div className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/40 border-b border-border/60">
                                <TableHead className="w-[200px] cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => handleSort('createdAt')}>
                                    <div className="flex items-center gap-2 py-2">
                                        <Clock className="w-4 h-4" />
                                        <span>Data/Hora</span>
                                        <ArrowUpDown className={`w-3 h-3 transition-opacity ${sortConfig.key === 'createdAt' ? 'opacity-100 text-emerald-500' : 'opacity-30'}`} />
                                    </div>
                                </TableHead>
                                <TableHead className="w-[150px]">
                                    <div className="flex items-center gap-2">
                                        <Hash className="w-4 h-4" />
                                        <span>Código</span>
                                    </div>
                                </TableHead>
                                <TableHead>
                                    <div className="flex items-center gap-2">
                                        <Trophy className="w-4 h-4" />
                                        <span>Extração</span>
                                    </div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => handleSort('user')}>
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        <span>Cambista</span>
                                        <ArrowUpDown className={`w-3 h-3 transition-opacity ${sortConfig.key === 'user' ? 'opacity-100 text-emerald-500' : 'opacity-30'}`} />
                                    </div>
                                </TableHead>
                                <TableHead className="min-w-[200px]">
                                    <div className="flex items-center gap-2">
                                        <Ticket className="w-4 h-4" />
                                        <span>Números Escolhidos</span>
                                    </div>
                                </TableHead>
                                <TableHead className="text-right cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => handleSort('amount')}>
                                    <div className="flex items-center justify-end gap-2">
                                        <Banknote className="w-4 h-4" />
                                        <span>Valor</span>
                                        <ArrowUpDown className={`w-3 h-3 transition-opacity ${sortConfig.key === 'amount' ? 'opacity-100 text-emerald-500' : 'opacity-30'}`} />
                                    </div>
                                </TableHead>
                                <TableHead className="w-[140px] text-center">
                                    <span>Status</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                                            <span className="text-sm text-muted-foreground">Carregando vendas...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : sortedTickets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center hover:bg-transparent">
                                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground/50">
                                            <Search className="h-8 w-8" />
                                            <span className="text-sm font-medium">Nenhuma venda encontrada no período selecionado.</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedTickets.map((ticket, index) => (
                                    <TableRow
                                        key={ticket.id}
                                        className={`transition-colors hover:bg-muted/30 ${index % 2 === 0 ? 'bg-transparent' : 'bg-muted/10'}`}
                                    >
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground text-sm">
                                                    {new Date(ticket.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                </span>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(ticket.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-mono text-xs font-medium bg-muted px-2 py-1 rounded border border-border">
                                                {ticket.hash || ticket.id.slice(0, 8)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                {ticket.drawDate ? (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {new Date(ticket.drawDate).toLocaleDateString('pt-BR')}
                                                    </span>
                                                ) : '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                    <User className="w-3 h-3 text-emerald-500" />
                                                </div>
                                                <span className="font-medium text-sm text-foreground">
                                                    {ticket.user?.name || ticket.user?.username || '-'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1.5">
                                                {ticket.numbers.map((n: string, i: number) => (
                                                    <span
                                                        key={i}
                                                        className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-secondary text-secondary-foreground border border-border/50"
                                                    >
                                                        {n.toString().padStart(4, '0')}
                                                    </span>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="font-bold text-emerald-500">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(ticket.amount))}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${ticket.status === 'WON'
                                                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                    : ticket.status === 'PENDING'
                                                        ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                                                        : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                                }`}>
                                                {ticket.status === 'WON' ? <CheckCircle className="w-3 h-3" /> :
                                                    ticket.status === 'PENDING' ? <PlayCircle className="w-3 h-3" /> :
                                                        <AlertCircle className="w-3 h-3" />}
                                                {ticket.status === 'PENDING' ? 'Pendente' : ticket.status === 'WON' ? 'Premiado' : ticket.status}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    )
}
