"use client"

import { API_URL } from "@/lib/api"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, XCircle, Search, Calendar, User, DollarSign } from "lucide-react"
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
                showAlert("Sucesso", `Caixa ${status === 'VERIFIED' ? 'verificado' : 'rejeitado'} com sucesso.`, "success")
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
                <Button onClick={fetchPendingCloses} variant="outline" size="sm">
                    Atualizar Lista
                </Button>
            </div>

            <Card className="border-border shadow-sm bg-card">
                <CardHeader>
                    <CardTitle>Pendentes de Aprovação</CardTitle>
                    <CardDescription>Estes caixas foram fechados e aguardam sua conferência.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : pendingCloses.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <CheckCircle2 className="mx-auto h-12 w-12 mb-4 opacity-20" />
                            <p>Nenhum fechamento pendente.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Cambista</TableHead>
                                    <TableHead>Vendas</TableHead>
                                    <TableHead>Saldo Final</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingCloses.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
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
                                            <span className="text-emerald-500 font-bold">
                                                {Number(item.totalSales).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-foreground font-bold">
                                                {Number(item.finalBalance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                    onClick={() => handleVerify(item.id, 'REJECTED')}
                                                >
                                                    <XCircle className="w-4 h-4 mr-1" /> Rejeitar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                    onClick={() => handleVerify(item.id, 'VERIFIED')}
                                                >
                                                    <CheckCircle2 className="w-4 h-4 mr-1" /> Aprovar
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
