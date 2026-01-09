"use client"

import { API_URL } from "@/lib/api"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, XCircle, Search, Calendar, User, DollarSign, Filter, RefreshCw } from "lucide-react"
import { useAlert } from "@/context/alert-context"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { StandardPageHeader } from "@/components/standard-page-header"
import { StandardPagination } from "@/components/standard-pagination"
import { Input } from "@/components/ui/input"
import { useActiveCompanyId } from "@/context/use-active-company"

export default function VerificationPage() {
    const activeCompanyId = useActiveCompanyId()
    const [pendingCloses, setPendingCloses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState<number | "all">(10)
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
                    showAlert("Aprovado", "Caixa verificado. Nota: o cambista ainda pode estar bloqueado por outros critérios.", "info")
                } else {
                    showAlert("Sucesso", "Caixa rejeitado com sucesso.", "success")
                }
                fetchPendingCloses()
            } else {
                showAlert("Erro", "Não foi possível atualizar o status.", "error")
            }
        } catch (error) {
            showAlert("Erro", "Erro de conexão.", "error")
        }
    }

    return (
        <div className="space-y-6">
            <StandardPageHeader
                icon={<CheckCircle2 className="w-8 h-8 text-blue-500" />}
                title="Verificação de Caixas"
                description="Aprovação de fechamentos diários de cambistas."
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
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : pendingCloses.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-3">
                            <CheckCircle2 className="h-10 w-10 opacity-20" />
                            <p>Nenhum fechamento pendente.</p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-muted/50 bg-muted/20 border-b border-border/60">
                                        <TableHead className="pl-6">Data</TableHead>
                                        <TableHead>Cambista</TableHead>
                                        <TableHead>Vendas</TableHead>
                                        <TableHead>Saldo Final</TableHead>
                                        <TableHead className="text-right pr-6">Ações</TableHead>
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
                                                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic font-medium">
                                                    Nenhum fechamento encontrado.
                                                </TableCell>
                                            </TableRow>
                                        );

                                        return paginated.map((item) => (
                                            <TableRow key={item.id} className="hover:bg-muted/50 transition-colors border-b border-border/50">
                                                <TableCell className="pl-6">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 text-foreground font-bold text-xs uppercase">
                                                            <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                                            {format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground font-medium italic ml-5">
                                                            {format(new Date(item.createdAt), "HH:mm", { locale: ptBR })}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold text-xs uppercase ring-1 ring-blue-500/20">
                                                            {(item.closedByUser?.username || "U").substring(0, 2)}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-foreground text-sm uppercase">
                                                                {item.closedByUser?.username || "Desconhecido"}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground font-medium italic flex items-center gap-1">
                                                                <User className="w-3 h-3 text-blue-500/50" />
                                                                {item.closedByUser?.name || "Cambista"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-emerald-600 font-bold text-xs">
                                                            {Number(item.totalSales).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground font-medium uppercase italic">Bruto</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-foreground font-bold text-xs">
                                                            {Number(item.finalBalance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground font-medium uppercase italic">A Receber</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 h-8 font-bold text-[10px] uppercase tracking-wider"
                                                            onClick={() => handleVerify(item.id, 'REJECTED')}
                                                        >
                                                            <XCircle className="w-3.5 h-3.5 mr-1" /> Rejeitar
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 font-bold text-[10px] uppercase tracking-wider shadow-sm"
                                                            onClick={() => handleVerify(item.id, 'VERIFIED')}
                                                        >
                                                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Aprovar
                                                        </Button>
                                                    </div>
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
        </div>
    )
}
