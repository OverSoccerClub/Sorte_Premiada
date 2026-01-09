"use client"

import { API_URL } from "@/lib/api"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, X, XCircle, RefreshCcw, AlertCircle, Clock, Search } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StandardPageHeader } from "@/components/standard-page-header"
import { StandardPagination } from "@/components/standard-pagination"
import { useActiveCompanyId } from "@/context/use-active-company"

interface Ticket {
    id: string;
    hash?: string;
    gameType: string;
    amount: number;
    createdAt: string;
    drawDate: string;
    cancellationReason?: string;
    user: {
        name: string;
        username: string;
    }
}

export default function CancellationsPage() {
    const activeCompanyId = useActiveCompanyId()
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [history, setHistory] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [pendingPage, setPendingPage] = useState(1);
    const [pendingLimit, setPendingLimit] = useState<number | "all">(10);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyLimit, setHistoryLimit] = useState<number | "all">(10);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");

            // Fetch Pending
            const pendingParams = new URLSearchParams({ status: 'CANCEL_REQUESTED' })
            if (activeCompanyId) pendingParams.append('targetCompanyId', activeCompanyId)

            const pendingRes = await fetch(`${API_URL}/tickets?${pendingParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (pendingRes.ok) {
                setTickets(await pendingRes.json());
            }

            // Fetch History (Cancelled)
            const historyParams = new URLSearchParams({ status: 'CANCELLED' })
            if (activeCompanyId) historyParams.append('targetCompanyId', activeCompanyId)

            const historyRes = await fetch(`${API_URL}/tickets?${historyParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (historyRes.ok) {
                setHistory(await historyRes.json());
            }

        } catch (error) {
            console.error(error);
            toast.error("Erro de conexão");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData, activeCompanyId]);

    const handleAction = async (id: string, approved: boolean) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/tickets/${id}/approve-cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ approved })
            });

            if (res.ok) {
                toast.success(approved ? "Cancelamento aprovado!" : "Solicitação rejeitada.");
                fetchData();
            } else {
                const err = await res.json();
                toast.error(err.message || "Falha ao processar ação");
            }
        } catch (error) {
            toast.error("Erro de conexão");
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
    };

    return (
        <div className="space-y-6">
            <StandardPageHeader
                icon={<XCircle className="w-8 h-8 text-red-500" />}
                title="Solicitações de Cancelamento"
                description="Aprove ou rejeite pedidos de cancelamento feitos após o prazo de tolerância."
                onRefresh={fetchData}
                refreshing={loading}
            >
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar bilhete ou cambista..."
                            className="pl-9 bg-background border-border h-9 shadow-sm text-xs font-semibold"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setPendingPage(1)
                                setHistoryPage(1)
                            }}
                        />
                    </div>
                </div>
            </StandardPageHeader>

            <Tabs defaultValue="pending" className="space-y-4">
                <TabsList className="bg-muted/50 border border-border">
                    <TabsTrigger value="pending" className="gap-2">
                        Solicitações Pendentes
                        <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-none px-1.5 py-0 h-5">
                            {tickets.length}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="history">Histórico de Cancelados</TabsTrigger>
                </TabsList>

                <TabsContent value="pending">
                    <Card className="border-border shadow-sm bg-card">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/20 hover:bg-muted/30 border-b border-border/60">
                                    <TableRow>
                                        <TableHead className="w-[150px]">ID / Bilhete</TableHead>
                                        <TableHead>Cambista</TableHead>
                                        <TableHead>Data Venda</TableHead>
                                        <TableHead>Sorteio</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead className="max-w-[200px]">Motivo</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(() => {
                                        const filtered = tickets.filter(t =>
                                            t.user.name?.toLowerCase().includes(search.toLowerCase()) ||
                                            t.user.username.toLowerCase().includes(search.toLowerCase()) ||
                                            t.hash?.toLowerCase().includes(search.toLowerCase()) ||
                                            t.id.toLowerCase().includes(search.toLowerCase())
                                        );

                                        const paginated = pendingLimit === "all" ? filtered : filtered.slice((pendingPage - 1) * pendingLimit, Number(pendingPage) * Number(pendingLimit));

                                        if (loading) return (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-24 text-center">
                                                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                                        <RefreshCcw className="w-4 h-4 animate-spin" />
                                                        Carregando...
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );

                                        if (filtered.length === 0) return (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground italic">
                                                    Nenhuma solicitação de cancelamento encontrada.
                                                </TableCell>
                                            </TableRow>
                                        );

                                        return paginated.map((ticket) => (
                                            <TableRow key={ticket.id} className="hover:bg-muted/10 transition-colors border-b border-border/50">
                                                <TableCell className="font-mono text-xs">
                                                    <div className="font-bold text-foreground">{ticket.hash || ticket.id.slice(0, 8)}</div>
                                                    <div className="text-[10px] text-muted-foreground font-semibold">{ticket.gameType}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-bold text-foreground text-sm">{ticket.user.name || ticket.user.username}</div>
                                                    <div className="text-[10px] text-muted-foreground font-mono">@{ticket.user.username}</div>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    <div className="flex items-center gap-1 font-medium text-muted-foreground">
                                                        <Clock className="w-3 h-3 text-red-500" />
                                                        {new Date(ticket.createdAt).toLocaleString('pt-BR')}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs font-semibold text-muted-foreground">
                                                    {new Date(ticket.drawDate).toLocaleString('pt-BR')}
                                                </TableCell>
                                                <TableCell className="font-bold text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(ticket.amount)}
                                                </TableCell>
                                                <TableCell className="text-sm text-yellow-600 dark:text-yellow-500 font-bold max-w-[200px]">
                                                    <div className="flex items-start gap-1">
                                                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                                        <span className="truncate" title={ticket.cancellationReason}>{ticket.cancellationReason || "Motivo não informado"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50"
                                                            onClick={() => handleAction(ticket.id, true)}
                                                            title="Aprovar Cancelamento"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 border-red-500/30 text-red-600 hover:bg-red-50"
                                                            onClick={() => handleAction(ticket.id, false)}
                                                            title="Rejeitar Solicitação"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ));
                                    })()}
                                </TableBody>
                            </Table>
                            <StandardPagination
                                currentPage={pendingPage}
                                totalPages={pendingLimit === "all" ? 1 : Math.ceil(tickets.filter(t =>
                                    t.user.name?.toLowerCase().includes(search.toLowerCase()) ||
                                    t.user.username.toLowerCase().includes(search.toLowerCase()) ||
                                    t.hash?.toLowerCase().includes(search.toLowerCase()) ||
                                    t.id.toLowerCase().includes(search.toLowerCase())
                                ).length / pendingLimit)}
                                limit={pendingLimit}
                                onPageChange={setPendingPage}
                                onLimitChange={(l) => {
                                    setPendingLimit(l)
                                    setPendingPage(1)
                                }}
                                totalItems={tickets.filter(t =>
                                    t.user.name?.toLowerCase().includes(search.toLowerCase()) ||
                                    t.user.username.toLowerCase().includes(search.toLowerCase()) ||
                                    t.hash?.toLowerCase().includes(search.toLowerCase()) ||
                                    t.id.toLowerCase().includes(search.toLowerCase())
                                ).length}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history">
                    <Card className="border-border shadow-sm bg-card">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/20 hover:bg-muted/30 border-b border-border/60">
                                    <TableRow>
                                        <TableHead className="w-[150px]">ID / Bilhete</TableHead>
                                        <TableHead>Cambista</TableHead>
                                        <TableHead>Data Venda</TableHead>
                                        <TableHead>Sorteio</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Motivo</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(() => {
                                        const filtered = history.filter(t =>
                                            t.user.name?.toLowerCase().includes(search.toLowerCase()) ||
                                            t.user.username.toLowerCase().includes(search.toLowerCase()) ||
                                            t.hash?.toLowerCase().includes(search.toLowerCase()) ||
                                            t.id.toLowerCase().includes(search.toLowerCase())
                                        );

                                        const paginated = historyLimit === "all" ? filtered : filtered.slice((historyPage - 1) * historyLimit, Number(historyPage) * Number(historyLimit));

                                        if (loading) return (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-24 text-center">
                                                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                                        <RefreshCcw className="w-4 h-4 animate-spin" />
                                                        Carregando...
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );

                                        if (filtered.length === 0) return (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground italic">
                                                    Nenhum bilhete cancelado no histórico.
                                                </TableCell>
                                            </TableRow>
                                        );

                                        return paginated.map((ticket) => (
                                            <TableRow key={ticket.id} className="hover:bg-muted/10 transition-colors border-b border-border/50">
                                                <TableCell className="font-mono text-xs">
                                                    <div className="font-bold text-foreground">{ticket.hash || ticket.id.slice(0, 8)}</div>
                                                    <div className="text-[10px] text-muted-foreground font-semibold">{ticket.gameType}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-bold text-foreground text-sm">{ticket.user.name || ticket.user.username}</div>
                                                    <div className="text-[10px] text-muted-foreground font-mono">@{ticket.user.username}</div>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    <div className="flex items-center gap-1 font-medium text-muted-foreground">
                                                        <Clock className="w-3 h-3 text-red-500" />
                                                        {new Date(ticket.createdAt).toLocaleString('pt-BR')}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs font-semibold text-muted-foreground">
                                                    {new Date(ticket.drawDate).toLocaleString('pt-BR')}
                                                </TableCell>
                                                <TableCell className="font-bold text-foreground">
                                                    {formatCurrency(ticket.amount)}
                                                </TableCell>
                                                <TableCell className="text-[10px] text-muted-foreground italic max-w-[150px] truncate">
                                                    {ticket.cancellationReason || "---"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 uppercase text-[9px] font-bold px-1.5 py-0 h-5">
                                                        Cancelado
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ));
                                    })()}
                                </TableBody>
                            </Table>
                            <StandardPagination
                                currentPage={historyPage}
                                totalPages={historyLimit === "all" ? 1 : Math.ceil(history.filter(t =>
                                    t.user.name?.toLowerCase().includes(search.toLowerCase()) ||
                                    t.user.username.toLowerCase().includes(search.toLowerCase()) ||
                                    t.hash?.toLowerCase().includes(search.toLowerCase()) ||
                                    t.id.toLowerCase().includes(search.toLowerCase())
                                ).length / historyLimit)}
                                limit={historyLimit}
                                onPageChange={setHistoryPage}
                                onLimitChange={(l) => {
                                    setHistoryLimit(l)
                                    setHistoryPage(1)
                                }}
                                totalItems={history.filter(t =>
                                    t.user.name?.toLowerCase().includes(search.toLowerCase()) ||
                                    t.user.username.toLowerCase().includes(search.toLowerCase()) ||
                                    t.hash?.toLowerCase().includes(search.toLowerCase()) ||
                                    t.id.toLowerCase().includes(search.toLowerCase())
                                ).length}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
