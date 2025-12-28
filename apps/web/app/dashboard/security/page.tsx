"use client"

import { API_URL } from "@/lib/api"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShieldAlert, ShieldCheck, Clock, AlertTriangle, CheckCircle2, Loader2, RefreshCw, AlertOctagon } from "lucide-react"
import { useAlert } from "@/context/alert-context"

interface SecurityLog {
    id: string
    type: string
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    message: string
    metadata: any
    isResolved: boolean
    createdAt: string
}

export default function SecurityCenterPage() {
    const [logs, setLogs] = useState<SecurityLog[]>([])
    const [loading, setLoading] = useState(true)
    const { showAlert } = useAlert()

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/security/logs`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setLogs(data)
            }
        } catch (error) {
            showAlert("Erro", "Não foi possível carregar logs de segurança.", "error")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [])

    const handleResolve = async (id: string) => {
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/security/logs/${id}/resolve`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                fetchLogs()
                showAlert("Sucesso", "Log marcado como resolvido.", "success")
            }
        } catch (error) {
            showAlert("Erro", "Erro ao resolver log.", "error")
        }
    }

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case "CRITICAL": return <Badge className="bg-red-600 hover:bg-red-700">CRÍTICO</Badge>
            case "HIGH": return <Badge className="bg-orange-500 hover:bg-orange-600">ALTO</Badge>
            case "MEDIUM": return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">MÉDIO</Badge>
            default: return <Badge variant="secondary">BAIXO</Badge>
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "LATE_BET": return <Clock className="w-4 h-4 text-red-500" />
            case "SUSPICIOUS_TIMING": return <AlertTriangle className="w-4 h-4 text-orange-500" />
            default: return <ShieldAlert className="w-4 h-4 text-blue-500" />
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <ShieldAlert className="w-8 h-8 text-red-500" />
                        </div>
                        Security Center
                    </h2>
                    <p className="text-muted-foreground mt-1 ml-14">Monitoramento de integridade e inteligência anti-fraude.</p>
                </div>
                <Button variant="outline" onClick={fetchLogs} disabled={loading} className="gap-2">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-red-500/5 border-red-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <AlertOctagon className="w-4 h-4 text-red-500" />
                            Apostas Críticas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {logs.filter(l => l.severity === "CRITICAL" && !l.isResolved).length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Pendentes de revisão</p>
                    </CardContent>
                </Card>
                <Card className="bg-orange-500/5 border-orange-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Clock className="w-4 h-4 text-orange-500" />
                            Apostas Suspeitas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {logs.filter(l => l.severity === "HIGH" && !l.isResolved).length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Janela de tempo curta</p>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-500/5 border-emerald-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Logs Resolvidos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">
                            {logs.filter(l => l.isResolved).length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Total acumulado</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-border shadow-sm bg-card overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-red-500" />
                        Atividade Recente
                    </CardTitle>
                    <CardDescription>Alertas gerados pelo sistema de inteligência anti-fraude.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading && logs.length === 0 ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-red-500" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/20">
                                    <TableHead className="w-[150px]">Data/Hora</TableHead>
                                    <TableHead className="w-[100px]">Gravidade</TableHead>
                                    <TableHead className="w-[150px]">Evento</TableHead>
                                    <TableHead>Mensagem</TableHead>
                                    <TableHead className="text-right">Ação</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic">
                                            Nenhum alerta de segurança registrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log) => (
                                        <TableRow key={log.id} className={`${log.isResolved ? 'opacity-60 bg-muted/5' : ''}`}>
                                            <TableCell className="text-xs font-mono">
                                                {new Date(log.createdAt).toLocaleString('pt-BR')}
                                            </TableCell>
                                            <TableCell>
                                                {getSeverityBadge(log.severity)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 font-medium">
                                                    {getTypeIcon(log.type)}
                                                    {log.type}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {log.message}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {!log.isResolved ? (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1.5"
                                                        onClick={() => handleResolve(log.id)}
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Resolver
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                                                        <ShieldCheck className="w-3 h-3" />
                                                        Auditado
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
