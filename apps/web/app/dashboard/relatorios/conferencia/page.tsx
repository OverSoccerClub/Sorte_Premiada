"use client"

import { API_URL } from "@/lib/api"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Search, FileText, Download, Filter, ArrowUpCircle, ArrowDownCircle, Wallet, Calendar, AlertCircle, ClipboardCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"

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
}

export default function CashConferencePage() {
    const [cambistas, setCambistas] = useState<any[]>([])
    const [summary, setSummary] = useState<FinanceSummary | null>(null)
    const [loading, setLoading] = useState(false)

    // Filters
    const [selectedCambista, setSelectedCambista] = useState<string>("")
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

    useEffect(() => {
        fetchCambistas()
    }, [])

    const fetchCambistas = async () => {
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/users`, {
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
                    toast.warning(`Nenhum cambista encontrado. Total de usuários: ${data.length}`)
                }
                setCambistas(cambistasOnly)
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro ao carregar lista de cambistas")
        }
    }

    const handleSearch = async () => {
        if (!selectedCambista) {
            toast.warning("Selecione um cambista para gerar o relatório")
            return
        }

        setLoading(true)
        try {
            const token = localStorage.getItem("token")
            const url = `${API_URL}/reports/finance-summary?cambistaId=${selectedCambista}&date=${date}`

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (res.ok) {
                const data = await res.json()
                setSummary(data)
                if (data.transactions.length === 0) {
                    toast.info("Nenhuma movimentação encontrada na data selecionada.")
                }
            } else {
                toast.error("Erro ao buscar conferência de caixa")
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro de conexão")
        } finally {
            setLoading(false)
        }
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
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="w-5 h-5 text-emerald-500" />
                        Filtros da Conferência
                    </CardTitle>
                </CardHeader>
                <CardContent>
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
                                            {c.name || c.username}
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
                <Alert className="bg-muted border-border">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <AlertTitle className="text-foreground">Nenhum dado exibido</AlertTitle>
                    <AlertDescription>
                        Selecione um cambista e uma data para visualizar o relatório financeiro.
                    </AlertDescription>
                </Alert>
            )}

            {summary && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                        <CardHeader className="bg-muted/50 border-b border-border flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base text-foreground">Extrato Detalhado</CardTitle>
                                <CardDescription>Todas as movimentações do dia {format(new Date(summary.date), "dd/MM/yyyy")}</CardDescription>
                            </div>
                            <Button variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                <span className="sr-only">Exportar</span>
                                Exportar
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
                                        <TableHead className="w-[140px]">Horário</TableHead>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead className="w-[120px]">Tipo</TableHead>
                                        <TableHead className="text-right w-[140px]">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {summary.transactions.map((t) => (
                                        <TableRow key={t.id} className="hover:bg-muted/50">
                                            <TableCell className="font-mono text-muted-foreground">
                                                {format(new Date(t.createdAt), "HH:mm:ss")}
                                            </TableCell>
                                            <TableCell className="font-medium text-foreground">
                                                {t.description}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                                    ${t.type === 'CREDIT' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    {t.type === 'CREDIT' ? 'Entrada' : 'Saída'}
                                                </span>
                                            </TableCell>
                                            <TableCell className={`text-right font-bold ${t.type === 'CREDIT' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {t.type === 'DEBIT' ? '-' : '+'}{formatCurrency(t.amount)}
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
