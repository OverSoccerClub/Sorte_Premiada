"use client"

import { API_URL } from "@/lib/api"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShieldAlert, ShieldCheck, Clock, AlertTriangle, CheckCircle2, Loader2, RefreshCw, AlertOctagon } from "lucide-react"
import { useAlert } from "@/context/alert-context"
import { StandardPageHeader } from "@/components/standard-page-header"
import { StandardPagination } from "@/components/standard-pagination"
import { useActiveCompanyId } from "@/context/use-active-company"

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
    const activeCompanyId = useActiveCompanyId()
    const [logs, setLogs] = useState<SecurityLog[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState<number | "all">(10)
    const { showAlert } = useAlert()

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem("token")
            const queryParams = new URLSearchParams()
            if (activeCompanyId) queryParams.append('targetCompanyId', activeCompanyId)

            const res = await fetch(`${API_URL}/security/logs?${queryParams.toString()}`, {
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
    }, [activeCompanyId])

    const handleResolve = async (id: string) => {
        try {
            const token = localStorage.getItem("token")
            let url = `${API_URL}/security/logs/${id}/resolve`
            if (activeCompanyId) url += `?targetCompanyId=${activeCompanyId}`

            const res = await fetch(url, {
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
            <StandardPageHeader
                icon={<ShieldAlert className="w-8 h-8 text-red-500" />}
                title="Security Center"
                description="Monitoramento de integridade e inteligência anti-fraude."
                onRefresh={fetchLogs}
                refreshing={loading}
            />

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

            <Card className="border-border shadow-sm bg-card">
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
                                {(() => {
                                    const paginated = limit === "all" ? logs : logs.slice((page - 1) * limit, Number(page) * Number(limit));

                                    if (logs.length === 0) return (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic font-medium">
                                                Nenhum alerta de segurança registrado.
                                            </TableCell>
                                        </TableRow>
                                    );

                                    return paginated.map((log) => (
                                        <TableRow key={log.id} className={`${log.isResolved ? 'opacity-60 bg-muted/5' : ''} border-b border-border/50 hover:bg-muted/30 transition-colors`}>
                                            <TableCell className="text-[10px] font-bold font-mono text-muted-foreground pl-6">
                                                <div className="flex flex-col">
                                                    <span>{new Date(log.createdAt).toLocaleDateString('pt-BR')}</span>
                                                    <span className="text-[9px] opacity-70">{new Date(log.createdAt).toLocaleTimeString('pt-BR')}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="scale-90 origin-left">
                                                    {getSeverityBadge(log.severity)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-tight">
                                                    <div className="p-1.5 bg-muted rounded-md border border-border/50">
                                                        {getTypeIcon(log.type)}
                                                    </div>
                                                    {log.type.replace(/_/g, ' ')}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs font-medium text-foreground max-w-[300px] truncate">
                                                {log.message}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                {!log.isResolved ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-emerald-600 border-emerald-500/30 hover:bg-emerald-50 h-8 font-bold text-[10px] uppercase tracking-wider"
                                                        onClick={() => handleResolve(log.id)}
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Resolver
                                                    </Button>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-1.5 text-emerald-600/70 font-bold text-[10px] uppercase">
                                                        <ShieldCheck className="w-3.5 h-3.5" />
                                                        Auditado
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ));
                                })()}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <StandardPagination
                currentPage={page}
                totalPages={limit === "all" ? 1 : Math.ceil(logs.length / limit)}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={(l) => {
                    setLimit(l)
                    setPage(1)
                }}
                totalItems={logs.length}
            />
        </div>
    )
}
