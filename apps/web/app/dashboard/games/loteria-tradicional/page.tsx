"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAlert } from "@/context/alert-context"
import { API_URL } from "@/lib/api"
import { Loader2, Calendar, Search, Filter, Ticket, Clock, User, Hash, Banknote, CheckCircle, AlertCircle, PlayCircle, Tag, LayoutDashboard, Trophy, Users, Plus, Edit, Trash2, Eye, Download } from "lucide-react"
import { useActiveCompanyId } from "@/context/use-active-company"
import { getBrazilToday } from '@/lib/date-utils'

export default function LoteriaTradicionalReportPage() {
    const { showAlert } = useAlert()
    const [tickets, setTickets] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [gameId, setGameId] = useState<string | null>(null)
    const [startDate, setStartDate] = useState<string>(getBrazilToday())
    const [endDate, setEndDate] = useState<string>(getBrazilToday())
    const [cambistas, setCambistas] = useState<any[]>([])
    const [selectedCambista, setSelectedCambista] = useState<string>("all")
    const [totals, setTotals] = useState({ count: 0, amount: 0 })

    useEffect(() => {
        // 1. Fetch Game ID for "Loteria Tradicional"
        // 2. Fetch Cambistas List
        const init = async () => {
            try {
                const token = localStorage.getItem("token")
                const [gamesRes, usersRes] = await Promise.all([
                    fetch(`${API_URL}/games`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API_URL}/users?role=CAMBISTA`, { headers: { Authorization: `Bearer ${token}` } })
                ])

                if (gamesRes.ok) {
                    const games = await gamesRes.json()
                    const game = games.find((g: any) => g.name === "Loteria Tradicional")
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

            // Date Range
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

                // Client-side filter by Cambista
                if (selectedCambista !== "all") {
                    data = data.filter((t: any) => t.userId === selectedCambista)
                }

                setTickets(data)

                // Calculate Totals
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
    }, [gameId, startDate, endDate, selectedCambista]) // Reload when filters change

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <Ticket className="w-8 h-8 text-emerald-500" />
                    </div>
                    Relatório Loteria Tradicional
                </h2>
                <p className="text-muted-foreground mt-1 ml-14">Vendas filtradas por período e cambista.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-md transition-all duration-200 hover:-translate-y-1">
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
                <Card className="hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bilhetes</CardTitle>
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totals.count}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="overflow-hidden border-border shadow-sm">
                <CardHeader className="bg-muted/30 border-b border-border">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <LayoutDashboard className="w-5 h-5 text-emerald-500" />
                                Vendas do Período
                            </CardTitle>
                            <CardDescription>Detalhamento de bilhetes vendidos.</CardDescription>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="date"
                                        className="pl-9 w-[150px] bg-background border-border"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <span className="text-muted-foreground hidden sm:inline">-</span>
                                <div className="relative">
                                    <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="date"
                                        className="pl-9 w-[150px] bg-background border-border"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Select value={selectedCambista} onValueChange={setSelectedCambista}>
                                    <SelectTrigger className="w-[180px] bg-background border-border">
                                        <User className="w-4 h-4 mr-2 text-muted-foreground" />
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos os Cambistas</SelectItem>
                                        {cambistas.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name || c.username}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Button onClick={fetchTickets} disabled={loading} size="icon" variant="outline" className="shrink-0">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-muted/50 border-b border-border/60 bg-muted/20">
                                <TableHead>Hora</TableHead>
                                <TableHead>Cambista</TableHead>
                                <TableHead>Modalidade</TableHead>
                                <TableHead>Números</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-500" />
                                    </TableCell>
                                </TableRow>
                            ) : tickets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        Nenhuma venda encontrada para este período.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tickets.map((ticket) => (
                                    <TableRow key={ticket.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Clock className="w-4 h-4" />
                                                {new Date(ticket.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-emerald-500" />
                                                {ticket.user?.name || ticket.user?.username || '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground border border-border">
                                                <Tag className="w-3 h-3" />
                                                {ticket.gameType.replace('JB-', '')}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 lowercase font-mono text-xs">
                                                <Ticket className="w-3.5 h-3.5 text-slate-400" />
                                                {ticket.numbers.join(', ')}
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
                </CardContent>
            </Card>
        </div>
    )
}
