"use client"

import { API_URL } from "@/lib/api"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Search, FileText, Download, Filter, Ticket as TicketIcon, DollarSign, Calendar, MapPin } from "lucide-react"
import { getBrazilToday, dateStringToStartOfDay, dateStringToEndOfDay } from '@/lib/date-utils'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useAlert } from "@/context/alert-context"
import { StandardPageHeader } from "@/components/standard-page-header"
import { StandardPagination } from "@/components/standard-pagination"
import { useActiveCompanyId } from "@/context/use-active-company"

const formatTicketNumbers = (numbers: any[], gameType: string) => {
    if (!numbers) return "";
    return numbers.map(n => {
        const val = n.toString();
        const gt = gameType?.toUpperCase() || "";
        if (gt.includes('1000') || gt.includes('MILHAR')) {
            return val.padStart(4, '0');
        }
        if (gt.includes('CENTENA')) {
            return val.padStart(3, '0');
        }
        if (gt.includes('DEZENA') || gt.includes('GRUPO')) {
            return val.padStart(2, '0');
        }
        return val;
    }).join(', ');
};

export default function RelatoriosPage() {
    const activeCompanyId = useActiveCompanyId()
    const { showAlert } = useAlert()
    const [cambistas, setCambistas] = useState<any[]>([])
    const [games, setGames] = useState<any[]>([])
    const [tickets, setTickets] = useState<any[]>([])
    const [granularSummary, setGranularSummary] = useState<any[]>([])
    const [total, setTotal] = useState(0)
    const [summary, setSummary] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    // Filters
    const [selectedCambista, setSelectedCambista] = useState<string>("all")
    const [selectedGame, setSelectedGame] = useState<string>("all")
    const [startDate, setStartDate] = useState(getBrazilToday())
    const [endDate, setEndDate] = useState(getBrazilToday())
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState<number | "all">(20)
    const [totalPages, setTotalPages] = useState(1)

    const fetchCambistas = async () => {
        const token = localStorage.getItem("token")
        try {
            const queryParams = new URLSearchParams({ role: 'CAMBISTA' })
            if (activeCompanyId) queryParams.append('targetCompanyId', activeCompanyId)

            const res = await fetch(`${API_URL}/users?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (res.ok) {
                const data = await res.json()
                setCambistas(data)
            } else {
                showAlert("Erro", `Erro ao buscar cambistas: ${res.status}`, "error")
            }
        } catch (error: any) {
            console.error(error)
            showAlert("Erro", "Erro de conexão na busca", "error")
        }
    }

    const fetchGames = async () => {
        const token = localStorage.getItem("token")
        try {
            const queryParams = new URLSearchParams()
            if (activeCompanyId) queryParams.append('targetCompanyId', activeCompanyId)

            const res = await fetch(`${API_URL}/games?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
                const data = await res.json()
                setGames(data)
            }
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        fetchCambistas()
        fetchGames()
    }, [activeCompanyId])

    useEffect(() => {
        handleSearch()
    }, [page, limit])

    const handleSearch = async (resetPage = false) => {
        if (resetPage) setPage(1)
        setLoading(true)
        try {
            const token = localStorage.getItem("token")

            const startStr = dateStringToStartOfDay(startDate)
            const endStr = dateStringToEndOfDay(endDate)

            let url = `${API_URL}/reports/sales-by-date?startDate=${startStr}&endDate=${endStr}&page=${resetPage ? 1 : page}&limit=${limit}`
            if (activeCompanyId) url += `&targetCompanyId=${activeCompanyId}`
            if (selectedCambista && selectedCambista !== "all") {
                url += `&cambistaId=${selectedCambista}`
            }
            if (selectedGame && selectedGame !== "all") {
                url += `&gameId=${selectedGame}`
            }

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (res.ok) {
                const data = await res.json()
                setTickets(data.tickets || [])
                setTotal(data.total || 0)
                setSummary(data.summary || [])
                setGranularSummary(data.granularSummary || [])
                setTotalPages(data.totalPages || 1)
                if ((data.tickets?.length || 0) === 0 && (resetPage ? 1 : page) === 1) {
                    showAlert("Aviso", "Nenhuma venda encontrada no período.", "info")
                }
            } else {
                showAlert("Erro", "Erro ao buscar relatório", "error")
            }
        } catch (error) {
            console.error(error)
            showAlert("Erro", "Erro de conexão", "error")
        } finally {
            setLoading(false)
        }
    }

    const calculateTotal = () => {
        return (summary || []).reduce((acc, s) => acc + (s.totalAmount || 0), 0)
    }

    return (
        <div className="space-y-6">
            <StandardPageHeader
                icon={<FileText className="w-8 h-8 text-emerald-500" />}
                title="Vendas do Período"
                description="Detalhamento das apostas realizadas."
                onRefresh={() => handleSearch(true)}
                refreshing={loading}
            >
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-36 h-9 bg-background border-border shadow-sm text-xs font-semibold"
                        />
                        <span className="text-muted-foreground text-xs font-bold leading-none">-</span>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-36 h-9 bg-background border-border shadow-sm text-xs font-semibold"
                        />
                    </div>

                    <Select value={selectedGame} onValueChange={setSelectedGame}>
                        <SelectTrigger className="w-44 h-9 bg-background border-border shadow-sm text-xs font-semibold">
                            <SelectValue placeholder="Todos os jogos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os jogos</SelectItem>
                            {games.map((g) => (
                                <SelectItem key={g.id} value={g.id}>
                                    {g.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedCambista} onValueChange={setSelectedCambista}>
                        <SelectTrigger className="w-48 h-9 bg-background border-border shadow-sm text-xs font-semibold">
                            <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Todos os cambistas" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                            <SelectItem value="all">Todos os cambistas</SelectItem>
                            {cambistas.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                    {c.name || c.username}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </StandardPageHeader>

            <div className="flex flex-wrap gap-2 mb-4">
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 h-8 text-xs"
                    onClick={() => window.location.href = "/dashboard/relatorios/area"}
                >
                    <MapPin className="w-3.5 h-3.5" />
                    Relatório por Área
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 h-8 text-xs"
                    onClick={() => window.location.href = "/dashboard/relatorios/conferencia"}
                >
                    <Calendar className="w-3.5 h-3.5" />
                    Conferência de Caixa
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 h-8 text-xs"
                    onClick={() => window.location.href = "/dashboard/relatorios/daily-closes"}
                >
                    <Calendar className="w-3.5 h-3.5" />
                    Fechamentos
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 h-8 text-xs"
                    onClick={() => window.location.href = "/dashboard/relatorios/notifications"}
                >
                    <FileText className="w-3.5 h-3.5" />
                    Notificações
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 h-8 text-xs"
                    onClick={() => window.location.href = "/dashboard/relatorios/transactions"}
                >
                    <Download className="w-3.5 h-3.5" />
                    Exportar Transações
                </Button>
            </div>


            {
                ((tickets?.length || 0) > 0 || (granularSummary?.length || 0) > 0) && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="bg-emerald-500 text-white border-none shadow-lg shadow-emerald-500/20">
                                <CardContent className="pt-6">
                                    <div className="text-emerald-100 text-sm font-medium mb-1">Total Vendido</div>
                                    <div className="text-3xl font-bold">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotal())}
                                    </div>
                                    <div className="mt-4 flex items-center text-xs text-emerald-100 bg-emerald-600/30 w-fit px-2 py-1 rounded">
                                        <DollarSign className="w-3 h-3 mr-1" />
                                        Receita Bruta
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-card border-border">
                                <CardContent className="pt-6">
                                    <div className="text-muted-foreground text-sm font-medium mb-1">Qtd. Bilhetes</div>
                                    <div className="text-3xl font-bold text-foreground">
                                        {total}
                                    </div>
                                    <div className="mt-4 flex items-center text-xs text-muted-foreground bg-muted w-fit px-2 py-1 rounded">
                                        <TicketIcon className="w-3 h-3 mr-1" />
                                        Total de Apostas
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-card border-border">
                                <CardContent className="pt-6">
                                    <div className="text-muted-foreground text-sm font-medium mb-1">Resumo por Jogo</div>
                                    <div className="space-y-2 mt-2">
                                        {(summary || []).map(s => (
                                            <div key={s.gameId} className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">{s.gameName}:</span>
                                                <span className="font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.totalAmount || 0)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Tabs defaultValue="resumo" className="space-y-6">
                            <TabsList className="bg-muted/50 p-1">
                                <TabsTrigger value="resumo" className="data-[state=active]:bg-background data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm">
                                    Resumo por Operação
                                </TabsTrigger>
                                <TabsTrigger value="detalhes" className="data-[state=active]:bg-background data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm">
                                    Detalhamento de Vendas
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="resumo">
                                <Card className="border-border shadow-sm overflow-hidden bg-card">
                                    <CardHeader className="bg-muted/50 border-b border-border">
                                        <CardTitle className="text-base text-foreground">Relatório Financeiro Agrupado</CardTitle>
                                        <p className="text-xs text-muted-foreground mt-1">Consolidado por dia, cambista e jogo.</p>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="rounded-md overflow-hidden">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="hover:bg-muted/50 bg-muted/30 border-b border-border">
                                                        <TableHead>Data</TableHead>
                                                        <TableHead>Cambista</TableHead>
                                                        <TableHead>Jogo</TableHead>
                                                        <TableHead className="text-center">Status Caixa</TableHead>
                                                        <TableHead className="text-right">Total Vendas</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {granularSummary.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                                Nenhum resumo disponível para este período.
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        granularSummary.map((item, idx) => (
                                                            <TableRow key={`${item.date}-${item.userId}-${item.gameId}-${idx}`} className="hover:bg-muted/50 transition-colors border-b border-border/50">
                                                                <TableCell className="font-medium text-foreground">
                                                                    {format(new Date(item.date + 'T12:00:00'), "dd/MM/yyyy")}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-semibold text-emerald-700">{item.user?.name || item.user?.username}</span>
                                                                        <span className="text-[10px] text-muted-foreground uppercase">{item.user?.username}</span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                                                                        {item.gameName}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ring-1 ring-inset ${item.status === 'CONFERIDO' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                                        item.status === 'FECHADO' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                                                                            item.status === 'BLOQUEADO' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                                                                                'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
                                                                        }`}>
                                                                        {item.status}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="text-right font-bold text-foreground">
                                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="detalhes">
                                <Card className="border-border shadow-sm overflow-hidden bg-card">
                                    <CardHeader className="bg-muted/50 border-b border-border">
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-base text-foreground">Detalhamento Individual dos Bilhetes</CardTitle>
                                            <Button variant="outline" size="sm" className="h-8">
                                                <Download className="w-4 h-4 mr-2" />
                                                Exportar CSV
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="hover:bg-muted/50 bg-muted/30">
                                                    <TableHead className="w-[180px]">Data/Hora</TableHead>
                                                    <TableHead>Praça</TableHead>
                                                    <TableHead>Cambista</TableHead>
                                                    <TableHead>Jogo</TableHead>
                                                    <TableHead>Números</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Valor</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {(tickets || []).map((ticket) => (
                                                    <TableRow key={ticket.id} className="hover:bg-muted/50 transition-colors">
                                                        <TableCell className="font-medium text-foreground">
                                                            {format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1.5">
                                                                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                                                <span className="text-xs font-medium">{ticket.user?.area?.name || "Geral"}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                                                    {ticket.user?.username?.substring(0, 2).toUpperCase()}
                                                                </div>
                                                                <span className="text-muted-foreground">{ticket.user?.name || ticket.user?.username}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">{ticket.game?.name || ticket.gameType}</TableCell>
                                                        <TableCell className="font-mono text-xs max-w-[200px] truncate" title={formatTicketNumbers(ticket.numbers, ticket.gameType)}>
                                                            {formatTicketNumbers(ticket.numbers, ticket.gameType)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                className={`
                                                        ${ticket.status === 'WON' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                                                        ${ticket.status === 'LOST' ? 'bg-red-500 hover:bg-red-600' : ''}
                                                        ${ticket.status === 'PENDING' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                                                        ${ticket.status === 'CANCELLED' ? 'bg-slate-500 hover:bg-slate-600' : ''}
                                                        ${ticket.status === 'EXPIRED' ? 'bg-slate-700 hover:bg-slate-800' : ''}
                                                    `}
                                                            >
                                                                {{
                                                                    'PENDING': 'Aguardando',
                                                                    'WON': 'Premiado',
                                                                    'LOST': 'Expirado',
                                                                    'CANCELLED': 'Cancelado',
                                                                    'EXPIRED': 'Expirado'
                                                                }[ticket.status as string] || ticket.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium text-emerald-600">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(ticket.amount))}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                    <StandardPagination
                                        currentPage={page}
                                        totalPages={totalPages}
                                        limit={limit}
                                        onPageChange={setPage}
                                        onLimitChange={(l) => {
                                            setLimit(l)
                                            setPage(1)
                                        }}
                                        totalItems={tickets.length}
                                    />
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                )
            }
        </div>
    )
}
