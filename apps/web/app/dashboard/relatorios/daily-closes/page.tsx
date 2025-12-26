"use client"

import { API_URL } from "@/lib/api"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Download, CalendarCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"

export default function DailyClosesPage() {
    const [closes, setCloses] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const fetchCloses = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/reports/daily-closes`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
                const data = await res.json()
                setCloses(data)
                if (data.length === 0) toast.info("Nenhum fechamento encontrado.")
            } else {
                toast.error("Erro ao carregar fechamentos")
            }
        } catch (err) {
            console.error(err)
            toast.error("Erro de conexão")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCloses()
    }, [])

    const exportCsv = () => {
        const token = localStorage.getItem("token")
        const url = `${API_URL}/reports/daily-closes/export`
        window.open(url + `?token=${token}`, "_blank")
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <CalendarCheck className="w-8 h-8 text-emerald-500" />
                    </div>
                    Fechamentos Diários
                </h2>
                <p className="text-muted-foreground mt-1 ml-14">Lista de fechamentos e status de conferência.</p>
            </div>

            <Card className="border-border shadow-sm bg-card">
                <CardHeader className="flex items-center justify-between">
                    <CardTitle>Exportar / Visualizar</CardTitle>
                    <Button onClick={exportCsv} variant="outline" className="gap-2">
                        <Download className="w-4 h-4" /> Exportar CSV
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead>Data</TableHead>
                                <TableHead>Cambista</TableHead>
                                <TableHead className="text-right">Total Vendas</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Desbloqueado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {closes.map((c) => (
                                <TableRow key={c.id} className="hover:bg-muted/50">
                                    <TableCell>{format(new Date(c.date || c.createdAt), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                                    <TableCell>{c.user?.name || c.user?.username || "-"}</TableCell>
                                    <TableCell className="text-right font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(c.totalSales || 0))}</TableCell>
                                    <TableCell>{c.status}</TableCell>
                                    <TableCell>{c.unblocked ? 'Sim' : 'Não'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
