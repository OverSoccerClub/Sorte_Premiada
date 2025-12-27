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

export default function VerificationPage() {
    const [pendingCloses, setPendingCloses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const { showAlert } = useAlert()

    const fetchPendingCloses = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/finance/pending-closes`, {
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
    }, [])

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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <CheckCircle2 className="w-8 h-8 text-blue-500" />
                        </div>
                        Verificação de Caixas
                    </h2>
                    <p className="text-muted-foreground mt-1 ml-14">Aprovação de fechamentos diários de cambistas.</p>
                </div>
            </div>

            <Card className="border-border shadow-sm bg-card overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Filter className="w-5 h-5 text-blue-500" />
                            Pendentes de Aprovação
                        </CardTitle>
                        <CardDescription>Estes caixas foram fechados e aguardam sua conferência.</CardDescription>
                    </div>
                    <Button onClick={fetchPendingCloses} variant="outline" size="sm" className="gap-2">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar Lista
                    </Button>
                </CardHeader>
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
                                {pendingCloses.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="pl-6">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                {format(new Date(item.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{item.closedByUser?.username || "Desconhecido"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                                {Number(item.totalSales).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-foreground font-bold">
                                                {Number(item.finalBalance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 h-8 font-normal"
                                                    onClick={() => handleVerify(item.id, 'REJECTED')}
                                                >
                                                    <XCircle className="w-4 h-4 mr-1.5" /> Rejeitar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 font-normal"
                                                    onClick={() => handleVerify(item.id, 'VERIFIED')}
                                                >
                                                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Aprovar
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
