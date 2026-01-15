"use client"
import { API_URL } from "@/lib/api"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Search, FileText, Download, Filter, ArrowUpCircle, ArrowDownCircle, Wallet, Calendar, AlertCircle, ClipboardCheck, DollarSign, CheckCircle, Clock, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAlert } from "@/context/alert-context"
import { useActiveCompanyId } from "@/context/use-active-company"

interface Transaction {
    id: string
    description: string
    amount: number | string
    type: 'CREDIT' | 'DEBIT'
    createdAt: string
    isTicket?: boolean
}

interface FinanceSummary {
    date: string
    totalSales: number
    totalCredits: number
    totalDebits: number
    finalBalance: number
    transactions: Transaction[]
    status: 'OPEN' | 'PENDING' | 'VERIFIED'
    dailyCloseId?: string
}

export default function CashConferencePage() {
    const activeCompanyId = useActiveCompanyId()
    const [cambistas, setCambistas] = useState<any[]>([])
    const [summary, setSummary] = useState<FinanceSummary | null>(null)
    const [loading, setLoading] = useState(false)
    const { showAlert, hideAlert } = useAlert()

    // Filters
    const [selectedCambista, setSelectedCambista] = useState<string>("")
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

    useEffect(() => {
        fetchCambistas()
    }, [activeCompanyId])

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
                // Robust filtering
                const cambistasOnly = data.filter((u: any) => {
                    if (!u.role) return false;
                    const r = String(u.role).toUpperCase();
                    return r === "CAMBISTA";
                })
                if (cambistasOnly.length === 0) {
                    showAlert("Aviso", `Nenhum cambista encontrado. Total de usuários: ${data.length}`, "warning")
                }
                setCambistas(cambistasOnly)
            }
        } catch (error) {
            console.error(error)
            showAlert("Erro", "Erro ao carregar lista de cambistas", "error")
        }
    }

    const handleSearch = async () => {
        if (!selectedCambista) {
            showAlert("Atenção", "Selecione um cambista para gerar o relatório", "warning")
            return
        }

        setLoading(true)
        try {
            const token = localStorage.getItem("token")
            let url = `${API_URL}/reports/finance-summary?cambistaId=${selectedCambista}&date=${date}`
            if (activeCompanyId) url += `&targetCompanyId=${activeCompanyId}`

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (res.ok) {
                const data = await res.json()
                setSummary(data)
                if (data.transactions.length === 0) {
                    showAlert("Informação", "Nenhuma movimentação encontrada na data selecionada.", "info")
                }
            } else {
                showAlert("Erro", "Erro ao buscar conferência de caixa", "error")
            }
        } catch (error) {
            console.error(error)
            showAlert("Erro", "Erro de conexão", "error")
        } finally {
            setLoading(false)
        }
    }

    const handleCloseCashier = async () => {
        if (!selectedCambista || !summary) return

        const cambista = cambistas.find(c => c.id === selectedCambista)
        const name = cambista?.name || cambista?.username || 'Selecionado'

        const isPending = summary.status === 'PENDING'
        const title = isPending ? "Conferir e Liberar Caixa" : "Fechar Caixa e Liberar"
        const message = isPending
            ? `Confirma que conferiu os valores e deseja liberar o caixa de ${name}?`
            : `Confirma que conferiu todos os valores e deseja fechar o caixa de ${name}? Isso irá zerar o caixa para novas vendas.`

        showAlert(
            title,
            message,
            "info",
            true,
            async () => {
                try {
                    const token = localStorage.getItem("token")

                    let url = `${API_URL}/finance/close/${selectedCambista}/admin`
                    let method = 'POST'
                    let body = JSON.stringify({
                        autoVerify: true,
                        date: date // Pass the selected date from the state
                    })

                    if (isPending && summary.dailyCloseId) {
                        url = `${API_URL}/finance/close/${summary.dailyCloseId}/verify`
                        body = JSON.stringify({ status: 'VERIFIED' })
                    }

                    const res = await fetch(url, {
                        method,
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body
                    })
                    hideAlert() // Hide confirmation alert

                    if (res.ok) {
                        // Show success alert after operation
                        setTimeout(() => {
                            showAlert("Sucesso!", "O caixa foi fechado com sucesso e as vendas liberadas!", "success")
                        }, 300)

                        handleSearch()
                        // Also update the cambista list to reflect the new status
                        fetchCambistas()
                    } else {
                        const err = await res.text()
                        setTimeout(() => {
                            showAlert("Erro", `Falha ao processar: ${err}`, "error")
                        }, 300)
                    }
                } catch (e) {
                    setTimeout(() => {
                        showAlert("Erro", "Não foi possível conectar ao servidor.", "error")
                    }, 300)
                }
            },
            isPending ? "Confirmar Liberação" : "Confirmar Fechamento",
            "Cancelar"
        )
    }


    const handlePrint = () => {
        window.print()
    }

    const formatCurrency = (value: number | string) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <ClipboardCheck className="w-8 h-8 text-emerald-500" />
                    </div>
                    Conferência de Caixa
                </h2>
                <p className="text-muted-foreground mt-1 ml-14">Fechamento diário e detalhamento financeiro por cambista.</p>
            </div>

            <Card className="border-border shadow-sm bg-card">
                <CardHeader className="bg-muted/30 border-b border-border">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Filter className="w-5 h-5 text-emerald-500" />
                        Filtros da Conferência
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-2">
                            <Label>Selecione o Cambista</Label>
                            <Select value={selectedCambista} onValueChange={setSelectedCambista}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {cambistas.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            <div className="flex items-center justify-between w-full gap-4">
                                                <span>{c.name || c.username}</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border uppercase
                                                    ${c.cashierStatus === 'OPEN' ? 'border-amber-500/30 text-amber-500 bg-amber-500/5' :
                                                        c.cashierStatus === 'PENDING' ? 'border-blue-500/30 text-blue-500 bg-blue-500/5' :
                                                            'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'}`}>
                                                    {c.cashierStatus === 'OPEN' ? 'Aberto' : c.cashierStatus === 'PENDING' ? 'Pendente' : 'Conferido'}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Data do Fechamento</Label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={handleSearch}
                            disabled={loading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-900/10"
                        >
                            {loading ? "Gerando..." : "Gerar Conferência"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {!summary && !loading && (
                <Alert className="bg-muted/30 border-border">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <AlertTitle className="text-foreground">Nenhum dado exibido</AlertTitle>
                    <AlertDescription>
                        Selecione um cambista e uma data para visualizar o relatório financeiro.
                    </AlertDescription>
                </Alert>
            )}

            {summary && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Header para Impressão */}
                    <div className="hidden print:block border-b border-zinc-200 pb-4 mb-4">
                        <h2 className="text-2xl font-bold">Relatório de Conferência de Caixa</h2>
                        <div className="flex gap-6 mt-2 text-sm text-zinc-600">
                            <span>Cambista: <strong>{cambistas.find(c => c.id === selectedCambista)?.name || selectedCambista}</strong></span>
                            <span>Data: <strong>{format(new Date(summary.date), "dd/MM/yyyy")}</strong></span>
                            <span>Status: <strong>{summary.status === 'VERIFIED' ? 'CONFERIDO' : summary.status === 'PENDING' ? 'AGUARDANDO CONFERÊNCIA' : 'ABERTO'}</strong></span>
                        </div>
                    </div>

                    <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4 no-print">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Status do Caixa:</span>
                            {summary.status === 'OPEN' && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 gap-1.5">
                                    <AlertCircle className="w-4 h-4" />
                                    ABERTO / AGUARDANDO FECHAMENTO
                                </span>
                            )}
                            {summary.status === 'PENDING' && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    FECHADO / PENDENTE CONFERÊNCIA
                                </span>
                            )}
                            {summary.status === 'VERIFIED' && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 gap-1.5">
                                    <CheckCircle className="w-4 h-4" />
                                    FECHADO / CONFERIDO E LIBERADO
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <Button
                                onClick={handlePrint}
                                variant="outline"
                                className="bg-background hover:bg-muted text-foreground border-border shadow-sm flex-1 md:flex-none"
                            >
                                <Printer className="mr-2 h-4 w-4" />
                                Imprimir
                            </Button>

                            {(summary.status === 'OPEN' || summary.status === 'PENDING') && (
                                <Button
                                    onClick={handleCloseCashier}
                                    className="bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-900/20 flex-1 md:flex-none"
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    {summary.status === 'PENDING' ? 'Conferir e Liberar Caixa' : 'Fechar Caixa e Liberar'}
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="bg-card border-border shadow-sm">
                            <CardContent className="pt-6">
                                <div className="text-muted-foreground text-sm font-medium mb-1">Total Vendas</div>
                                <div className="text-2xl font-bold text-foreground">{formatCurrency(summary.totalSales)}</div>
                                <div className="mt-2 flex items-center text-xs text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded">
                                    <ArrowUpCircle className="w-3 h-3 mr-1" />
                                    Entradas (Vendas)
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-card border-border shadow-sm">
                            <CardContent className="pt-6">
                                <div className="text-muted-foreground text-sm font-medium mb-1">Créditos Manuais</div>
                                <div className="text-2xl font-bold text-foreground">{formatCurrency(summary.totalCredits - summary.totalSales)}</div>
                                <div className="mt-2 flex items-center text-xs text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded">
                                    <ArrowUpCircle className="w-3 h-3 mr-1" />
                                    Entradas (Ajustes)
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-card border-border shadow-sm">
                            <CardContent className="pt-6">
                                <div className="text-muted-foreground text-sm font-medium mb-1">Débitos / Pagamentos</div>
                                <div className="text-2xl font-bold text-red-500">{formatCurrency(summary.totalDebits)}</div>
                                <div className="mt-2 flex items-center text-xs text-red-600 bg-red-50 w-fit px-2 py-1 rounded">
                                    <ArrowDownCircle className="w-3 h-3 mr-1" />
                                    Saídas
                                </div>
                            </CardContent>
                        </Card>
                        <Card className={`border-none shadow-lg ${summary.finalBalance >= 0 ? "bg-emerald-600" : "bg-red-600"}`}>
                            <CardContent className="pt-6 text-white">
                                <div className="text-white/80 text-sm font-medium mb-1">Saldo Final</div>
                                <div className="text-3xl font-bold">{formatCurrency(summary.finalBalance)}</div>
                                <div className="mt-2 flex items-center text-xs text-white/90 bg-white/20 w-fit px-2 py-1 rounded">
                                    <Wallet className="w-3 h-3 mr-1" />
                                    {summary.finalBalance >= 0 ? "Caixa Positivo" : "Caixa Negativo"}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-border shadow-sm bg-card overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b border-border flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base text-foreground flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-emerald-500" />
                                    Extrato Detalhado
                                </CardTitle>
                                <CardDescription>Todas as movimentações do dia {format(new Date(summary.date), "dd/MM/yyyy")}</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" className="hidden md:flex">
                                <Download className="w-4 h-4 mr-2" />
                                Exportar
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/20 hover:bg-muted/30 border-b border-border/60">
                                        <TableHead className="w-[140px] pl-6">Horário</TableHead>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead className="w-[140px]">Tipo</TableHead>
                                        <TableHead className="text-right w-[160px] pr-6">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {summary.transactions.map((t) => (
                                        <TableRow key={t.id} className="hover:bg-muted/50 transition-colors">
                                            <TableCell className="font-mono text-muted-foreground pl-6">
                                                {format(new Date(t.createdAt), "HH:mm:ss")}
                                            </TableCell>
                                            <TableCell className="font-medium text-foreground">
                                                {t.description}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border
                                                    ${t.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                    {t.type === 'CREDIT' ? 'Entrada' : 'Saída'}
                                                </span>
                                            </TableCell>
                                            <TableCell className={`text-right font-bold pr-6 ${t.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {t.type === 'DEBIT' ? '- ' : '+ '}{formatCurrency(t.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
