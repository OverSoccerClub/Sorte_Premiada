
"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { API_URL } from "@/lib/api"
import { Loader2, Calendar, Search, Ticket, Clock, User, Hash, Banknote, CheckCircle, AlertCircle, PlayCircle, ArrowUpDown } from "lucide-react"

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
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <Ticket className="w-8 h-8 text-emerald-500" />
                    </div>
                    Relatório 2x1000
                </h2>
                <p className="text-muted-foreground mt-1 ml-14">Vendas filtradas por período e cambista.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Vendido</CardTitle>
                        <Ticket className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.amount)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bilhetes</CardTitle>
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totals.count}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium">Filtros</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <label className="text-sm font-medium mb-1 block">Data Inicial</label>
                            <div className="relative">
                                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="date"
                                    className="pl-9"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="text-sm font-medium mb-1 block">Data Final</label>
                            <div className="relative">
                                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="date"
                                    className="pl-9"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="text-sm font-medium mb-1 block">Cambista</label>
                            <Select value={selectedCambista} onValueChange={setSelectedCambista}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {cambistas.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name || c.username}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button onClick={fetchTickets} disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                <span className="ml-2">Atualizar</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Detalhamento de Vendas</CardTitle>
                    <CardDescription>Lista de bilhetes vendidos com os filtros aplicados.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => handleSort('createdAt')}>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            Data/Hora
                                            <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-2">
                                            <Hash className="w-4 h-4" />
                                            Código
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            Extração
                                        </div>
                                    </TableHead>
                                    <TableHead className="cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => handleSort('user')}>
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            Cambista
                                            <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-2">
                                            <Ticket className="w-4 h-4" />
                                            Números
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-right cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => handleSort('amount')}>
                                        <div className="flex items-center justify-end gap-2">
                                            <Banknote className="w-4 h-4" />
                                            Valor
                                            <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" />
                                            Status
                                        </div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-500" />
                                        </TableCell>
                                    </TableRow>
                                ) : sortedTickets.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                            Nenhuma venda encontrada para este período.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sortedTickets.map((ticket) => (
                                        <TableRow key={ticket.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Clock className="w-4 h-4" />
                                                    {new Date(ticket.createdAt).toLocaleString('pt-BR', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono text-sm font-medium">{ticket.hash || ticket.id.slice(0, 8)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                                    {ticket.drawDate ?
                                                        `${new Date(ticket.drawDate).toLocaleDateString('pt-BR')} ${new Date(ticket.drawDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                                                        : '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-emerald-500" />
                                                    {ticket.user?.name || ticket.user?.username || '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 lowercase font-mono text-xs">
                                                    <Ticket className="w-3.5 h-3.5 text-slate-400" />
                                                    {ticket.numbers.map((n: string) => n.toString().padStart(4, '0')).join(', ')}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-emerald-600">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Banknote className="w-3.5 h-3.5 opacity-50" />
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(ticket.amount))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${ticket.status === 'WON' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                    ticket.status === 'PENDING' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' :
                                                        'bg-gray-50 text-gray-600 ring-gray-500/10'
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
                </CardContent>
            </Card>
        </div>
    )
}
