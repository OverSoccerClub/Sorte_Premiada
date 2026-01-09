"use client"

import { API_URL } from "@/lib/api"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { History, Search, Loader2, RefreshCw, Filter, User, Globe, Gamepad2, Info } from "lucide-react"
import { useAlert } from "@/context/alert-context"
import { Input } from "@/components/ui/input"
import { StandardPageHeader } from "@/components/standard-page-header"
import { StandardPagination } from "@/components/standard-pagination"
import { useActiveCompanyId } from "@/context/use-active-company"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface AuditLog {
    id: string
    action: string
    entity: string
    entityId: string
    oldValue: any
    newValue: any
    userId: string
    ipAddress: string
    createdAt: string
    user?: {
        name: string
        username: string
    }
}

export default function AuditLogsPage() {
    const activeCompanyId = useActiveCompanyId()
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [entityFilter, setEntityFilter] = useState("")
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState<number | "all">(10)
    const { showAlert } = useAlert()

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem("token")
            const url = new URL(`${API_URL}/audit/logs`)
            if (activeCompanyId) url.searchParams.append('targetCompanyId', activeCompanyId)
            if (entityFilter) url.searchParams.append("entity", entityFilter)

            const res = await fetch(url.toString(), {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setLogs(data)
            }
        } catch (error) {
            showAlert("Erro", "Não foi possível carregar logs de auditoria.", "error")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [entityFilter, activeCompanyId])

    const getActionBadge = (action: string) => {
        if (action.includes("CREATE")) return <Badge className="bg-emerald-500">CRIAR</Badge>
        if (action.includes("UPDATE")) return <Badge className="bg-blue-500">ATUALIZAR</Badge>
        if (action.includes("DELETE")) return <Badge className="bg-red-500">DELETAR</Badge>
        return <Badge variant="secondary">{action}</Badge>
    }

    const getEntityIcon = (entity: string) => {
        switch (entity) {
            case "User": return <User className="w-4 h-4 text-blue-500" />
            case "Game": return <Gamepad2 className="w-4 h-4 text-emerald-500" />
            case "AreaConfig": return <Globe className="w-4 h-4 text-orange-500" />
            default: return <Info className="w-4 h-4 text-muted-foreground" />
        }
    }

    return (
        <div className="space-y-6">
            <StandardPageHeader
                icon={<History className="w-8 h-8 text-blue-500" />}
                title="Logs de Auditoria"
                description="Registro imutável de alterações administrativas do sistema."
                onRefresh={fetchLogs}
                refreshing={loading}
            >
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-full sm:w-64">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Filtrar Entidade (ex: User, Game)..."
                            className="pl-10 h-9 bg-background border-border text-xs font-semibold"
                            value={entityFilter}
                            onChange={(e) => {
                                setEntityFilter(e.target.value)
                                setPage(1)
                            }}
                        />
                    </div>
                </div>
            </StandardPageHeader>

            <Card className="border-border shadow-sm bg-card overflow-hidden">
                <CardContent className="p-0">
                    {loading && logs.length === 0 ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/20">
                                        <TableHead className="w-[180px]">Data/Hora</TableHead>
                                        <TableHead className="w-[120px]">Administrador</TableHead>
                                        <TableHead className="w-[100px]">Ação</TableHead>
                                        <TableHead className="w-[150px]">Entidade</TableHead>
                                        <TableHead>Ref ID</TableHead>
                                        <TableHead className="text-right">Detalhes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(() => {
                                        const totalItems = logs.length;
                                        const paginatedLogs = limit === "all" ? logs : logs.slice((page - 1) * limit, Number(page) * Number(limit));

                                        if (logs.length === 0) return (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground italic">
                                                    Nenhum log de auditoria encontrado.
                                                </TableCell>
                                            </TableRow>
                                        );

                                        return paginatedLogs.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="text-xs font-mono">
                                                    {new Date(log.createdAt).toLocaleString('pt-BR')}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm font-medium">{log.user?.name || "Sistema"}</div>
                                                    <div className="text-[10px] text-muted-foreground font-mono">{log.ipAddress}</div>
                                                </TableCell>
                                                <TableCell>
                                                    {getActionBadge(log.action)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        {getEntityIcon(log.entity)}
                                                        {log.entity}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-[150px]">
                                                    {log.entityId}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button variant="outline" size="sm" className="h-8 border-blue-500/30 text-blue-600 hover:bg-blue-50" onClick={() => setSelectedLog(log)}>
                                                                    Ver Diff
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                                                <DialogHeader>
                                                                    <DialogTitle>Mural de Alterações</DialogTitle>
                                                                    <DialogDescription>
                                                                        Comparação entre o estado anterior e o novo.
                                                                    </DialogDescription>
                                                                </DialogHeader>
                                                                <div className="grid grid-cols-2 gap-4 mt-4">
                                                                    <div className="space-y-2">
                                                                        <h4 className="text-xs font-bold text-red-500 uppercase">Estado Anterior</h4>
                                                                        <pre className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg text-[10px] font-mono overflow-auto max-h-[400px]">
                                                                            {JSON.stringify(log.oldValue, null, 2)}
                                                                        </pre>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <h4 className="text-xs font-bold text-emerald-500 uppercase">Novo Estado</h4>
                                                                        <pre className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-[10px] font-mono overflow-auto max-h-[400px]">
                                                                            {JSON.stringify(log.newValue, null, 2)}
                                                                        </pre>
                                                                    </div>
                                                                </div>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ));
                                    })()}
                                </TableBody>
                            </Table>
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
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
