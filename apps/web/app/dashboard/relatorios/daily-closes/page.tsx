"use client"

import { API_URL } from "@/lib/api"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Download, CalendarCheck, Search, Filter, Eye, ArrowUpCircle, ArrowDownCircle, CheckCircle2, Clock, AlertTriangle, Printer, Calendar } from "lucide-react"
import { useActiveCompanyId } from "@/context/use-active-company"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAlert } from "@/context/alert-context"

export default function DailyClosesPage() {
    const activeCompanyId = useActiveCompanyId()
    const { showAlert } = useAlert()
    const [closes, setCloses] = useState<any[]>([])
    const [cambistas, setCambistas] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    // Filters
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
    const [selectedCambista, setSelectedCambista] = useState<string>("all")
    const [selectedStatus, setSelectedStatus] = useState<string>("all")

    // Details Modal
    const [selectedClose, setSelectedClose] = useState<any>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [detailSummary, setDetailSummary] = useState<any>(null)
    const [loadingDetail, setLoadingDetail] = useState(false)

    const fetchCambistas = async () => {
        try {
            const token = localStorage.getItem("token")
            const queryParams = new URLSearchParams({ role: 'CAMBISTA' })
            if (activeCompanyId) queryParams.append('targetCompanyId', activeCompanyId)

            const res = await fetch(`${API_URL}/users?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
                const data = await res.json()
                setCambistas(data)
            }
        } catch (err) {
            console.error(err)
        }
    }

    const fetchCloses = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem("token")
            let url = `${API_URL}/reports/daily-closes?startDate=${startDate}&endDate=${endDate}`
            if (activeCompanyId) url += `&targetCompanyId=${activeCompanyId}`
            if (selectedCambista !== "all") url += `&userId=${selectedCambista}`
            if (selectedStatus !== "all") url += `&status=${selectedStatus}`

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
                const data = await res.json()
                setCloses(data)
                if (data.length === 0) showAlert("Aviso", "Nenhum fechamento encontrado no período.", "info")
            } else {
                showAlert("Erro", "Erro ao carregar fechamentos", "error")
            }
        } catch (err) {
            console.error(err)
            showAlert("Erro", "Erro de conexão", "error")
        } finally {
            setLoading(false)
        }
    }

    const fetchDetail = async (close: any) => {
        setSelectedClose(close)
        setIsDetailOpen(true)
        setLoadingDetail(true)
        try {
            const token = localStorage.getItem("token")
            // Use the existing finance-summary endpoint for detailed transactions of that day
            const dateStr = format(new Date(close.date || close.createdAt), "yyyy-MM-dd")
            let url = `${API_URL}/reports/finance-summary?cambistaId=${close.closedByUserId}&date=${dateStr}`
            if (activeCompanyId) url += `&targetCompanyId=${activeCompanyId}`

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
                const data = await res.json()
                setDetailSummary(data)
            } else {
                showAlert("Erro", "Erro ao carregar detalhes do caixa", "error")
            }
        } catch (err) {
            showAlert("Erro", "Erro de conexão ao buscar detalhes", "error")
        } finally {
            setLoadingDetail(false)
        }
    }

    const handleVerify = async (id: string, status: 'VERIFIED' | 'REJECTED') => {
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/finance/close/${id}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            })
            if (res.ok) {
                showAlert("Sucesso!", status === 'VERIFIED' ? "Caixa conferido e liberado!" : "Fechamento rejeitado.", "success")
                fetchCloses()
            } else {
                showAlert("Erro", "Erro ao verificar caixa", "error")
            }
        } catch (err) {
            showAlert("Erro", "Erro de conexão", "error")
        }
    }

    useEffect(() => {
        fetchCambistas()
        fetchCloses()
    }, [activeCompanyId])

    const handlePrint = () => {
        window.print()
    }

    const formatCurrency = (value: number | string) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <CalendarCheck className="w-8 h-8 text-emerald-500" />
                        </div>
                        Fechamentos Diários
                    </h2>
                    <p className="text-muted-foreground mt-1 ml-14">Histórico completo de situação e resumos de caixa.</p>
                </div>
            </div>

            <Card className="border-border shadow-sm bg-card overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border no-print">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-base uppercase tracking-wider font-bold flex items-center gap-2">
                                <Filter className="w-4 h-4 text-emerald-500" />
                                Histórico de Fechamentos
                            </CardTitle>
                            <CardDescription>Filtre e visualize os fechamentos de caixa.</CardDescription>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center flex-wrap">
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="date"
                                        className="pl-9 w-[140px] bg-background border-border h-9"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <span className="text-muted-foreground">-</span>
                                <div className="relative">
                                    <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="date"
                                        className="pl-9 w-[140px] bg-background border-border h-9"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <Select value={selectedCambista} onValueChange={setSelectedCambista}>
                                <SelectTrigger className="w-[180px] h-9 bg-background border-border">
                                    <SelectValue placeholder="Todos Cambistas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos Cambistas</SelectItem>
                                    {cambistas.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name || c.username}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="w-[140px] h-9 bg-background border-border">
                                    <SelectValue placeholder="Todas Situações" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    <SelectItem value="PENDING">Pendente</SelectItem>
                                    <SelectItem value="VERIFIED">Conferido</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button onClick={fetchCloses} disabled={loading} size="sm" className="h-9 bg-emerald-600 hover:bg-emerald-700">
                                {loading ? "..." : "Filtrar"}
                            </Button>

                            <Button onClick={handlePrint} variant="outline" size="sm" className="h-9 gap-2 bg-background border-border">
                                <Printer className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                {/* Print Header */}
                <div className="hidden print:block p-6 mb-4 border-b">
                    <h1 className="text-2xl font-bold">Relatório de Fechamentos Diários</h1>
                    <p className="text-sm">Período: {startDate.split('-').reverse().join('/')} até {endDate.split('-').reverse().join('/')}</p>
                    {selectedCambista !== "all" && <p className="text-sm">Cambista: {cambistas.find(c => c.id === selectedCambista)?.name}</p>}
                </div>

                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/20 hover:bg-muted/30 border-b border-border/60">
                                <TableHead className="pl-4">Data</TableHead>
                                <TableHead>Cambista</TableHead>
                                <TableHead className="text-right">Vendas</TableHead>
                                <TableHead className="text-right">Entradas</TableHead>
                                <TableHead className="text-right">Saídas</TableHead>
                                <TableHead className="text-right">Saldo Final</TableHead>
                                <TableHead className="text-right">Informado</TableHead>
                                <TableHead className="text-right">Diferença</TableHead>
                                <TableHead className="text-center">Situação</TableHead>
                                <TableHead className="text-right pr-4">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {closes.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                                        Nenhum registro encontrado para os filtros selecionados.
                                    </TableCell>
                                </TableRow>
                            )}
                            {closes.map((c) => (
                                <TableRow key={c.id} className="hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-medium pl-4">
                                        {new Date(c.date || c.createdAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                                    </TableCell>
                                    <TableCell>{c.closedByUser?.name || c.closedByUser?.username || "-"}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(c.totalSales)}</TableCell>
                                    <TableCell className="text-right text-emerald-600">{formatCurrency(c.totalCredits)}</TableCell>
                                    <TableCell className="text-right text-red-500">{formatCurrency(c.totalDebits)}</TableCell>
                                    <TableCell className="text-right font-bold text-foreground">
                                        {formatCurrency(c.finalBalance)}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {c.physicalCashReported !== null ? formatCurrency(c.physicalCashReported) : "-"}
                                    </TableCell>
                                    <TableCell className={`text-right font-bold ${Number(c.variance || 0) < 0 ? 'text-red-500' : Number(c.variance || 0) > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                                        {c.variance !== null ? (Number(c.variance || 0) > 0 ? "+" : "") + formatCurrency(c.variance) : "-"}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {c.status === 'PENDING' ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 gap-1 mr-1">
                                                <Clock className="w-3 h-3" /> PENDENTE
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 gap-1 mr-1">
                                                <CheckCircle2 className="w-3 h-3" /> CONFERIDO
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right pr-4">
                                        <div className="flex justify-end gap-1">
                                            {c.status === 'PENDING' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-full"
                                                    title="Conferir / Liberar"
                                                    onClick={() => handleVerify(c.id, 'VERIFIED')}
                                                >
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full"
                                                title="Ver Detalhes"
                                                onClick={() => fetchDetail(c)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Details Modal */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="no-print">
                        <DialogTitle className="flex items-center gap-2">
                            <Search className="w-5 h-5 text-emerald-500" />
                            Detalhamento de Caixa
                        </DialogTitle>
                        <DialogDescription>
                            Movimentação detalhada de {selectedClose?.closedByUser?.name || selectedClose?.closedByUser?.username} em {selectedClose && format(new Date(selectedClose.date || selectedClose.createdAt), "dd/MM/yyyy")}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Print Only Header for Modal */}
                    <div className="hidden print:block border-b pb-4 mb-4">
                        <h2 className="text-xl font-bold">Extrato Detalhado de Caixa</h2>
                        <p className="text-sm">Cambista: {selectedClose?.closedByUser?.name || selectedClose?.closedByUser?.username}</p>
                        <p className="text-sm">Data: {selectedClose && new Date(selectedClose.date || selectedClose.createdAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
                    </div>

                    {loadingDetail ? (
                        <div className="py-20 flex justify-center items-center gap-2 text-muted-foreground">
                            <Clock className="w-6 h-6 animate-pulse" />
                            Carregando histórico...
                        </div>
                    ) : detailSummary ? (
                        <div className="space-y-6 pt-4">
                            <div className="flex justify-end no-print">
                                <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2 bg-white text-zinc-900 border-zinc-200 shadow-sm">
                                    <Printer className="w-4 h-4" /> Imprimir Extrato
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                                    <div className="text-xs font-medium text-muted-foreground uppercase mb-1">Vendas</div>
                                    <div className="text-xl font-bold">{formatCurrency(detailSummary.totalSales)}</div>
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 text-emerald-900">
                                    <div className="text-xs font-medium text-emerald-700 uppercase mb-1 flex items-center gap-1">
                                        <ArrowUpCircle className="w-3 h-3" /> Entradas
                                    </div>
                                    <div className="text-xl font-bold">{formatCurrency(detailSummary.totalCredits)}</div>
                                </div>
                                <div className="p-4 bg-red-50 rounded-lg border border-red-100 text-red-900">
                                    <div className="text-xs font-medium text-red-700 uppercase mb-1 flex items-center gap-1">
                                        <ArrowDownCircle className="w-3 h-3" /> Saídas
                                    </div>
                                    <div className="text-xl font-bold">{formatCurrency(detailSummary.totalDebits)}</div>
                                </div>
                                <div className="p-4 bg-foreground rounded-lg border border-foreground text-background">
                                    <div className="text-xs font-medium text-background/60 uppercase mb-1">Saldo Final</div>
                                    <div className="text-xl font-bold">{formatCurrency(detailSummary.finalBalance)}</div>
                                </div>
                            </div>

                            <div className="border border-border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="w-[120px]">Horário</TableHead>
                                            <TableHead>Descrição</TableHead>
                                            <TableHead className="w-[100px]">Tipo</TableHead>
                                            <TableHead className="text-right w-[120px]">Valor</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {detailSummary.transactions.map((t: any) => (
                                            <TableRow key={t.id}>
                                                <TableCell className="text-muted-foreground font-mono">
                                                    {new Date(t.createdAt).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                                                </TableCell>
                                                <TableCell className="font-medium text-sm">{t.description}</TableCell>
                                                <TableCell>
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase
                                                        ${t.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                        {t.type === 'CREDIT' ? 'Entrada' : 'Saída'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className={`text-right font-bold ${t.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {t.type === 'DEBIT' ? '-' : '+'}{formatCurrency(t.amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ) : (
                        <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-3">
                            <AlertTriangle className="w-10 h-10 text-amber-500" />
                            Ocorreu um erro ao carregar os dados detalhados.
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
