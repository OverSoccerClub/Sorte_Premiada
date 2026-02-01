"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { TicketDetails } from "@/components/dashboard/tickets/TicketDetails"
import { useAlert } from "@/context/alert-context"
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
    Trophy,
    LayoutDashboard,
    ArrowUpRight,
    Filter
} from "lucide-react"

export default function TwoXOneThousandReportPage() {
    const { showAlert } = useAlert()
    // Fix: Use Brazil timezone for initial dates
    const getBrazilToday = () => {
        return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    }

    const [tickets, setTickets] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [gameId, setGameId] = useState<string | null>(null)
    const [startDate, setStartDate] = useState<string>(getBrazilToday())
    const [endDate, setEndDate] = useState<string>(getBrazilToday())
    const [cambistas, setCambistas] = useState<any[]>([])
    const [selectedCambista, setSelectedCambista] = useState<string>("all")
    const [totals, setTotals] = useState({ count: 0, amount: 0 })

    // Sort configuration state
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({
        key: 'createdAt',
        direction: 'desc'
    })

    // Modal state
    const [selectedTicketResult, setSelectedTicketResult] = useState<any>(null)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [detailsLoading, setDetailsLoading] = useState(false)

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

            // Fix: Construct dates using explicit Brazil offset (-03:00)
            // This ensures we query 00:00 BRT to 23:59 BRT
            const start = new Date(`${startDate}T00:00:00-03:00`)
            const end = new Date(`${endDate}T23:59:59.999-03:00`)

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
            showAlert("Erro!", "Erro ao carregar vendas", "error")
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

    const getExtractionInfo = (dateString: string) => {
        if (!dateString) return { label: '-', time: '-' }

        const date = new Date(dateString)
        const hour = date.getHours()
        const minutes = date.getMinutes()
        const timeStr = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`

        // Determinar a extração baseada no horário aproximado
        // PTM: ~11h, PT: ~14h, PTV: ~16h, PTN: ~18h, COR: ~21h
        let label = 'Extração'

        if (hour >= 10 && hour < 13) label = '1ª Extração (PTM)'
        else if (hour >= 13 && hour < 15) label = '2ª Extração (PT)'
        else if (hour >= 15 && hour < 17) label = '3ª Extração (PTV)'
        else if (hour >= 17 && hour < 20) label = '4ª Extração (PTN)'
        else if (hour >= 20 && hour < 23) label = '5ª Extração (COR)'
        else label = `Extração ${timeStr}`

        return { label, time: timeStr, fullDate: date.toLocaleDateString('pt-BR') }
    }

    const handleTicketClick = async (ticketId: string) => {
        setDetailsLoading(true)
        setSelectedTicketResult(null)
        setDetailsOpen(true)

        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/tickets/validate/${ticketId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (res.ok) {
                const data = await res.json()
                setSelectedTicketResult(data)
            } else {
                showAlert("Erro!", "Erro ao carregar detalhes do bilhete", "error")
                setDetailsOpen(false)
            }
        } catch (error) {
            console.error(error)
            showAlert("Erro!", "Erro ao conectar com o servidor", "error")
            setDetailsOpen(false)
        } finally {
            setDetailsLoading(false)
        }
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
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Page Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <Ticket className="w-8 h-8 text-emerald-500" />
                    </div>
                    Relatório 2x1000
                </h2>
                <p className="text-muted-foreground mt-1 ml-14">Gestão e acompanhamento de vendas em tempo real.</p>
            </div>


            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-border bg-card shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Vendido
                        </CardTitle>
                        <div className="p-2 rounded-full bg-emerald-500/10">
                            <Banknote className="w-4 h-4 text-emerald-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.amount)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <span className="text-emerald-500 font-medium flex items-center">
                                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                                +12% em relação a ontem
                            </span>
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-border bg-card shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Bilhetes Emitidos
                        </CardTitle>
                        <div className="p-2 rounded-full bg-blue-500/10">
                            <Ticket className="w-4 h-4 text-blue-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{totals.count}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <span className="text-blue-500 font-medium flex items-center">
                                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                                Volume de hoje
                            </span>
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Card */}
            <Card className="border-border bg-card shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                        <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <LayoutDashboard className="w-5 h-5 text-emerald-500" />
                                Vendas do Período
                            </CardTitle>
                            <CardDescription>
                                Detalhamento das apostas realizadas.
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                            <div className="flex items-center gap-2 flex-1 min-w-[200px] xl:flex-none xl:w-auto">
                                <div className="relative flex-1">
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="h-9 bg-background w-full"
                                    />
                                </div>
                                <span className="text-muted-foreground font-medium">-</span>
                                <div className="relative flex-1">
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="h-9 bg-background w-full"
                                    />
                                </div>
                            </div>

                            <Select value={selectedCambista} onValueChange={setSelectedCambista}>
                                <SelectTrigger className="h-9 bg-background w-full sm:w-[200px]">
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-4 h-4 text-muted-foreground" />
                                        <SelectValue placeholder="Cambista" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Cambistas</SelectItem>
                                    {cambistas.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name || c.username}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button
                                onClick={fetchTickets}
                                disabled={loading}
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-9 px-4 w-full sm:w-auto"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                                Atualizar
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
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
                                            <span>ID</span>
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-2">
                                            <Trophy className="w-4 h-4" />
                                            <span>Extração</span>
                                        </div>
                                    </TableHead>
                                    <TableHead className="w-[100px]">
                                        <div className="flex items-center gap-2 text-center justify-center">
                                            <Hash className="w-4 h-4" />
                                            <span>Nº Bilhete</span>
                                        </div>
                                    </TableHead>
                                    <TableHead className="w-[120px]">
                                        <div className="flex items-center gap-2">
                                            <Trophy className="w-4 h-4" />
                                            <span>Chance Extra</span>
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
                                    sortedTickets.map((ticket, index) => {
                                        const extraction = getExtractionInfo(ticket.drawDate)
                                        return (
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
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-sm font-medium text-foreground">
                                                            {extraction.label}
                                                        </span>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {extraction.fullDate}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {extraction.time}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                                        {ticket.ticketNumber ? ticket.ticketNumber.toString().padStart(4, '0') : '-'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-mono text-xs text-muted-foreground">
                                                        {ticket.secondChanceNumber || '-'}
                                                    </span>
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
                                                            <button
                                                                key={i}
                                                                onClick={() => handleTicketClick(ticket.hash || ticket.id)}
                                                                className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-secondary text-secondary-foreground border border-border/50 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                                                            >
                                                                {n.toString().padStart(4, '0')}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="font-bold text-emerald-500">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(ticket.amount))}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {(() => {
                                                        const status = ticket.status || 'PENDING'
                                                        const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
                                                            'PENDING': { label: 'Pendente', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: PlayCircle },
                                                            'WON': { label: 'Premiado', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle },
                                                            'PAID': { label: 'Pago', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle },
                                                            'LOST': { label: 'Expirado', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20', icon: AlertCircle },
                                                            'EXPIRED': { label: 'Expirado', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20', icon: AlertCircle },
                                                            'CANCELLED': { label: 'Cancelado', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: AlertCircle },
                                                            'CANCELED': { label: 'Cancelado', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: AlertCircle },
                                                            'CANCEL_REQUESTED': { label: 'Canc. Solicitado', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: AlertCircle },
                                                        }
                                                        const config = statusConfig[status] || { label: status, color: 'bg-slate-500/10 text-slate-500 border-slate-500/20', icon: AlertCircle }
                                                        const Icon = config.icon

                                                        return (
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
                                                                <Icon className="w-3 h-3" />
                                                                {config.label}
                                                            </span>
                                                        )
                                                    })()}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>


            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="sm:max-w-md p-0 border-none bg-transparent shadow-none">
                    {detailsLoading ? (
                        <div className="flex items-center justify-center p-8 bg-background rounded-lg border">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : selectedTicketResult && (
                        <TicketDetails data={selectedTicketResult} />
                    )}
                </DialogContent>
            </Dialog>
        </div >
    )
}
