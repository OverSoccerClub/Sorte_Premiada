"use client"

import { API_URL } from "@/lib/api"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Download, BellRing, Bell } from "lucide-react"
import { useActiveCompanyId } from "@/context/use-active-company"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAlert } from "@/context/alert-context"

export default function NotificationsReportPage() {
    const activeCompanyId = useActiveCompanyId()
    const { showAlert } = useAlert()
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem("token")
            const queryParams = new URLSearchParams()
            if (activeCompanyId) queryParams.append('targetCompanyId', activeCompanyId)

            const res = await fetch(`${API_URL}/reports/notifications?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
                const data = await res.json()
                setLogs(data)
                if (data.length === 0) showAlert("Aviso", "Nenhum log de notificação encontrado.", "info")
            } else {
                showAlert("Erro", "Erro ao carregar logs de notificação", "error")
            }
        } catch (err) {
            console.error(err)
            showAlert("Erro", "Erro de conexão", "error")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [activeCompanyId])

    const exportCsv = () => {
        const token = localStorage.getItem("token")
        let url = `${API_URL}/reports/notifications/export?token=${token}`
        if (activeCompanyId) url += `&targetCompanyId=${activeCompanyId}`

        window.open(url, "_blank")
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <BellRing className="w-8 h-8 text-emerald-500" />
                        </div>
                        Logs de Notificações
                    </h2>
                    <p className="text-muted-foreground mt-1 ml-14">Histórico de envios push e respostas do provedor.</p>
                </div>
            </div>

            <Card className="border-border shadow-sm bg-card overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Bell className="w-5 h-5 text-emerald-500" />
                            Histórico de Disparos
                        </CardTitle>
                        <CardDescription>Visualize e exporte o histórico de notificações enviadas.</CardDescription>
                    </div>
                    <Button onClick={exportCsv} variant="outline" size="sm" className="gap-2">
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Exportar CSV</span>
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-muted/50 bg-muted/20 border-b border-border/60">
                                <TableHead className="pl-6">Data</TableHead>
                                <TableHead>Cambista</TableHead>
                                <TableHead>Título</TableHead>
                                <TableHead>Mensagem</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="pr-6">Resposta</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        Nenhum log encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
                            {logs.map((l) => (
                                <TableRow key={l.id} className="hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-mono text-muted-foreground pl-6">
                                        {format(new Date(l.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                    </TableCell>
                                    <TableCell className="font-medium text-foreground">
                                        {l.user?.name || l.user?.username || "-"}
                                    </TableCell>
                                    <TableCell className="font-medium">{l.title}</TableCell>
                                    <TableCell className="max-w-[240px] truncate text-muted-foreground" title={l.body}>
                                        {l.body}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border
                                            ${l.status === 'SENT' || l.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                l.status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                            {l.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="max-w-[240px] truncate font-mono text-xs text-muted-foreground pr-6" title={JSON.stringify(l.response)}>
                                        {typeof l.response === 'string' ? l.response : JSON.stringify(l.response)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
