"use client"

import { API_URL } from "@/lib/api"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, XCircle, Search, Calendar, User, DollarSign, Filter, RefreshCw, Wallet, Activity } from "lucide-react"
import { useAlert } from "@/context/alert-context"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { StandardPageHeader } from "@/components/standard-page-header"
import { StandardPagination } from "@/components/standard-pagination"
import { Input } from "@/components/ui/input"
import { useActiveCompanyId } from "@/context/use-active-company"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export default function VerificationPage() {
    const activeCompanyId = useActiveCompanyId()
    const [pendingCloses, setPendingCloses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState<number | "all">(10)
    const [selectedClose, setSelectedClose] = useState<any>(null)
    const { showAlert } = useAlert()

    const fetchPendingCloses = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem("token")
            const queryParams = new URLSearchParams()
            if (activeCompanyId) queryParams.append('targetCompanyId', activeCompanyId)

            const res = await fetch(`${API_URL}/finance/pending-closes?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
                const data = await res.json()
                setPendingCloses(data)
            } else {
                console.error("Failed to fetch pending closes")
            }
        } catch (error) {
            console.error("Error fetching pending closes", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPendingCloses()
    }, [activeCompanyId])

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
                const data = await res.json().catch(() => null)
                if (status === 'VERIFIED' && data?.unblocked) {
                    showAlert("Sucesso", "Caixa verificado e vendas liberadas para o cambista.", "success")
                } else if (status === 'VERIFIED') {
                    showAlert("Aprovado", "Caixa verificado com sucesso.", "success")
                } else {
                    showAlert("Sucesso", "Caixa rejeitado com sucesso.", "success")
                }
                setSelectedClose(null)
                fetchPendingCloses()
            } else {
                showAlert("Erro", "Não foi possível atualizar o status.", "error")
            }
        } catch (error) {
            showAlert("Erro", "Erro de conexão.", "error")
        }
    }

    const formatCurrency = (value: any) => {
        return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }

    return (
        <div className="space-y-6">
            <StandardPageHeader
                icon={<CheckCircle2 className="w-8 h-8 text-emerald-500" />}
                title="Conferência de Caixas"
                description="Validação e aprovação de fechamentos diários pendentes."
                onRefresh={fetchPendingCloses}
                refreshing={loading}
            >
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar cambista..."
                            className="pl-9 bg-background border-border h-9 shadow-sm text-xs font-semibold"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setPage(1)
                            }}
                        />
                    </div>
                </div>
            </StandardPageHeader>

            <Card className="border-border shadow-sm bg-card overflow-hidden">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                        </div>
                    ) : pendingCloses.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-3">
                            <CheckCircle2 className="h-10 w-10 opacity-20 text-emerald-500" />
                            <p className="font-medium">Tudo em dia! Nenhum fechamento pendente.</p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-muted/50 bg-muted/20 border-b border-border/60 uppercase">
                                        <TableHead className="pl-6 text-[10px] font-bold">Data/Hora</TableHead>
                                        <TableHead className="text-[10px] font-bold">Cambista (Operador)</TableHead>
                                        <TableHead className="text-[10px] font-bold text-center">Resumo do Dia</TableHead>
                                        <TableHead className="text-[10px] font-bold text-right pr-6">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(() => {
                                        const filtered = pendingCloses.filter(item =>
                                            item.closedByUser?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            item.closedByUser?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                                        );

                                        const paginated = limit === "all" ? filtered : filtered.slice((page - 1) * limit, Number(page) * Number(limit));

                                        if (filtered.length === 0) return (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic font-medium">
                                                    Nenhum fechamento encontrado com os filtros atuais.
                                                </TableCell>
                                            </TableRow>
                                        );

                                        return paginated.map((item) => (
                                            <TableRow key={item.id} className="hover:bg-muted/50 transition-colors border-b border-border/50">
                                                <TableCell className="pl-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                                                            <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                                            {format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground font-medium ml-5 italic">
                                                            Iniciado em {format(new Date(item.date), "dd/MM", { locale: ptBR })}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold text-xs ring-1 ring-blue-500/20">
                                                            {(item.closedByUser?.username || "U").substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="font-bold text-foreground text-sm">
                                                                    {item.closedByUser?.name || item.closedByUser?.username}
                                                                </div>
                                                                {item.daysPending > 1 && (
                                                                    <Badge variant="outline" className={`text-[10px] h-5 px-1.5 ${item.daysPending >= 3 ? 'border-red-500/50 text-red-500 bg-red-500/10' : 'border-amber-500/50 text-amber-500 bg-amber-500/10'}`}>
                                                                        {item.daysPending} dias em aberto
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                                                {item.closedByUser?.username}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-center gap-6">
                                                        <div className="text-center">
                                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Vendas</p>
                                                            <p className="text-xs font-bold text-emerald-600">{formatCurrency(item.totalSales)}</p>
                                                        </div>
                                                        <div className="w-px h-8 bg-border/60" />
                                                        <div className="text-center">
                                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Saldo Net</p>
                                                            <p className="text-sm font-black text-foreground">{formatCurrency(item.finalBalance)}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <Button
                                                        size="sm"
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-6 font-bold text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                                        onClick={() => setSelectedClose(item)}
                                                    >
                                                        Conferir Extrato
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ));
                                    })()}
                                </TableBody>
                            </Table>
                            <StandardPagination
                                currentPage={page}
                                totalPages={limit === "all" ? 1 : Math.ceil(pendingCloses.filter(item =>
                                    item.closedByUser?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    item.closedByUser?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                                ).length / limit)}
                                limit={limit}
                                onPageChange={setPage}
                                onLimitChange={(l) => {
                                    setLimit(l)
                                    setPage(1)
                                }}
                                totalItems={pendingCloses.filter(item =>
                                    item.closedByUser?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    item.closedByUser?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                                ).length}
                            />
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Modal de Conferência */}
            <Dialog open={!!selectedClose} onOpenChange={(open) => !open && setSelectedClose(null)}>
                <DialogContent className="max-w-2xl bg-card border-border shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-muted/30 border-b border-border">
                        <DialogTitle className="flex items-center gap-3 text-xl">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <Wallet className="w-6 h-6 text-emerald-500" />
                            </div>
                            Conferência de Caixa: {selectedClose?.closedByUser?.name}
                        </DialogTitle>
                        <DialogDescription>
                            Revise os valores detalhados antes de processar o recebimento.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-muted/30 rounded-xl border border-border space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold">Vendas Brutas</p>
                                <p className="text-xl font-bold text-emerald-600">{formatCurrency(selectedClose?.totalSales)}</p>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-xl border border-border space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold">Outros Créditos</p>
                                <p className="text-xl font-bold text-blue-600">{formatCurrency(selectedClose?.totalCredits - selectedClose?.totalSales)}</p>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-xl border border-border space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Débitos (Prêmios/Despesas)</p>
                                <p className="text-xl font-bold text-red-500">{formatCurrency(selectedClose?.totalDebits)}</p>
                            </div>
                            <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 space-y-1">
                                <p className="text-[10px] text-emerald-700 uppercase font-bold">SALDO A RECEBER</p>
                                <p className="text-2xl font-black text-emerald-600">{formatCurrency(selectedClose?.finalBalance)}</p>
                            </div>
                        </div>

                        {selectedClose?.physicalCashReported !== null && (
                            <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/20 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-blue-600">INFORMAÇÃO DO CAMBISTA</p>
                                    <p className="text-sm text-muted-foreground">Valor declarado no fechamento:</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-blue-600">{formatCurrency(selectedClose?.physicalCashReported)}</p>
                                    <p className={`text-[10px] font-bold uppercase ${Number(selectedClose?.variance) === 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        Diferença: {formatCurrency(selectedClose?.variance)}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-700 text-xs">
                            <Activity className="w-4 h-4" />
                            <span>Ao aprovar, o sistema marcará o dia como CONFERIDO e liberará o cambista para novas vendas se houver bloqueios por prestação de contas.</span>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-muted/10 border-t border-border gap-2 flex-row justify-end">
                        <Button
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50 font-bold uppercase text-[10px] tracking-widest h-11"
                            onClick={() => handleVerify(selectedClose.id, 'REJECTED')}
                        >
                            Rejeitar e Solicitar Correção
                        </Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest px-8 h-11 shadow-lg"
                            onClick={() => handleVerify(selectedClose.id, 'VERIFIED')}
                        >
                            Aprovar Recebimento
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

