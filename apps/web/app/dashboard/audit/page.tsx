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
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [entityFilter, setEntityFilter] = useState("")
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
    const { showAlert } = useAlert()

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem("token")
            const url = new URL(`${API_URL}/audit/logs`)
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
    }, [entityFilter])

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
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <History className="w-8 h-8 text-blue-500" />
                        </div>
                        Logs de Auditoria
                    </h2>
                    <p className="text-muted-foreground mt-1 ml-14">Registro imutável de alterações administrativas do sistema.</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Filtrar Entidade (ex: User, Game)..."
                            className="pl-10 w-[250px]"
                            value={entityFilter}
                            onChange={(e) => setEntityFilter(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" onClick={fetchLogs} disabled={loading} className="gap-2">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                </div>
            </div>

            <Card className="border-border shadow-sm bg-card overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Search className="w-5 h-5 text-blue-500" />
                        Trilha de Auditoria
                    </CardTitle>
                    <CardDescription>Visualize o histórico detalhado de todas as mutações no banco de dados.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading && logs.length === 0 ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        </div>
                    ) : (
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
                                {logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground italic">
                                            Nenhum log de auditoria encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log) => (
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
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
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
