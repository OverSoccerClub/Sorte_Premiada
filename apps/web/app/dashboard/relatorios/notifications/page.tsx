"use client"

import { API_URL } from "@/lib/api"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Download, BellRing } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"

export default function NotificationsReportPage() {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/reports/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
                const data = await res.json()
                setLogs(data)
                if (data.length === 0) toast.info("Nenhum log de notificação encontrado.")
            } else {
                toast.error("Erro ao carregar logs de notificação")
            }
        } catch (err) {
            console.error(err)
            toast.error("Erro de conexão")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [])

    const exportCsv = () => {
        const token = localStorage.getItem("token")
        const url = `${API_URL}/reports/notifications/export`
        window.open(url + `?token=${token}`, "_blank")
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <BellRing className="w-8 h-8 text-emerald-500" />
                    </div>
                    Logs de Notificações
                </h2>
                <p className="text-muted-foreground mt-1 ml-14">Histórico de envios push e respostas do provedor.</p>
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
                                <TableHead>Título</TableHead>
                                <TableHead>Mensagem</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Resposta</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((l) => (
                                <TableRow key={l.id} className="hover:bg-muted/50">
                                    <TableCell>{format(new Date(l.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                                    <TableCell>{l.user?.name || l.user?.username || "-"}</TableCell>
                                    <TableCell className="font-medium">{l.title}</TableCell>
                                    <TableCell className="max-w-[240px] truncate">{l.body}</TableCell>
                                    <TableCell>{l.status}</TableCell>
                                    <TableCell className="max-w-[240px] truncate">{typeof l.response === 'string' ? l.response : JSON.stringify(l.response)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
