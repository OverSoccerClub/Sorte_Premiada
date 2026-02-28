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
    Filter,
    Watch
} from "lucide-react"

export default function MinutoSorteReportPage() {
    const { showAlert } = useAlert()

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

    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({
        key: 'createdAt',
        direction: 'desc'
    })

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
                    const game = games.find((g: any) =>
                        g.name?.toLowerCase() === "minuto da sorte" ||
                        g.type === "MINUTO_SORTE"
                    )
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
            const start = new Date(`${startDate}T00:00:00-03:00`)
            const end = new Date(`${endDate}T23:59:59.999-03:00`)

            let url = `${API_URL}/tickets?startDate=${start.toISOString()}&endDate=${end.toISOString()}`

            if (gameId) {
                url += `&gameId=${gameId}`
            } else {
                url += `&gameType=MINUTO_SORTE`
            }

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
        fetchTickets()
    }, [gameId, startDate, endDate, selectedCambista])

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }))
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
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Watch className="w-8 h-8 text-blue-500" />
                    </div>
                    Relatório Minuto da Sorte
                </h2>
                <p className="text-muted-foreground mt-1 ml-14">Acompanhamento das apostas baseadas no tempo.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-border bg-card shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Volume de Vendas
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
                                Total arrecadado no período
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
                                Total de participações
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
                                <LayoutDashboard className="w-5 h-5 text-blue-500" />
                                Detalhamento de Vendas
                            </CardTitle>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                            <div className="flex items-center gap-2 flex-1 min-w-[200px] xl:flex-none xl:w-auto">
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="h-9 bg-background"
                                />
                                <span className="text-muted-foreground">-</span>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="h-9 bg-background"
                                />
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

                            <Button onClick={fetchTickets} disabled={loading} size="sm" className="h-9">
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
                                <TableRow className="bg-muted/30">
                                    <TableHead className="cursor-pointer" onClick={() => handleSort('createdAt')}>
                                        <div className="flex items-center gap-2 py-2">
                                            <Clock className="w-4 h-4" />
                                            <span>Data/Hora Compra</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-2">
                                            <Hash className="w-4 h-4" />
                                            <span>Bilhete</span>
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-2">
                                            <Watch className="w-4 h-4" />
                                            <span>Hora Escolhida</span>
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-2 text-blue-500 font-bold">
                                            <Watch className="w-4 h-4" />
                                            <span>Minuto da Sorte</span>
                                        </div>
                                    </TableHead>
                                    <TableHead className="cursor-pointer" onClick={() => handleSort('user')}>
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            <span>Cambista</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-right cursor-pointer" onClick={() => handleSort('amount')}>
                                        <div className="flex items-center justify-end gap-2">
                                            <Banknote className="w-4 h-4" />
                                            <span>Valor</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                                        </TableCell>
                                    </TableRow>
                                ) : sortedTickets.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                            Nenhuma venda encontrada no período.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sortedTickets.map((ticket) => {
                                        const ticketDate = new Date(ticket.createdAt)
                                        const purchaseMinute = ticketDate.getMinutes().toString().padStart(2, '0')
                                        const hourChosen = ticket.numbers?.[0] || '?'

                                        return (
                                            <TableRow key={ticket.id} className="hover:bg-muted/30">
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">
                                                            {ticketDate.toLocaleDateString('pt-BR')}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {ticketDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-mono text-xs font-medium px-2 py-1 rounded border">
                                                        {ticket.hash || ticket.id.slice(0, 8)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-lg font-bold px-3">
                                                        {hourChosen}h
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-lg font-black px-4 py-1">
                                                        {purchaseMinute}m
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-medium">{ticket.user?.name || ticket.user?.username || '-'}</span>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-emerald-500">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(ticket.amount))}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant={ticket.status === 'WON' || ticket.status === 'PAID' ? 'default' : 'secondary'} className={ticket.status === 'WON' || ticket.status === 'PAID' ? 'bg-green-500' : ''}>
                                                        {ticket.status}
                                                    </Badge>
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
        </div>
    )
}
