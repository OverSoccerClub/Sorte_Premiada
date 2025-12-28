"use client"

import { API_URL } from "@/lib/api"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, X, XCircle, RefreshCcw, AlertCircle, Clock } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

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
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [history, setHistory] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");

            // Fetch Pending
            const pendingRes = await fetch(`${API_URL}/tickets?status=CANCEL_REQUESTED`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (pendingRes.ok) {
                setTickets(await pendingRes.json());
            }

            // Fetch History (Cancelled)
            const historyRes = await fetch(`${API_URL}/tickets?status=CANCELLED`, {
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
    }, [fetchData]);

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
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        Solicitações de Cancelamento
                    </h2>
                    <p className="text-muted-foreground mt-1 ml-14">
                        Aprove ou rejeite pedidos de cancelamento feitos após o prazo de tolerância.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar bilhete ou cambista..."
                            className="pl-9 bg-background border-border h-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button onClick={fetchData} variant="outline" size="sm" className="gap-2">
                        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                </div>
            </div>

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
                        <CardHeader className="bg-muted/30 border-b border-border">
                            <CardTitle className="text-sm font-medium">Pedidos Aguardando Aprovação</CardTitle>
                        </CardHeader>
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
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                                    <RefreshCcw className="w-4 h-4 animate-spin" />
                                                    Carregando...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : tickets.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                                Nenhuma solicitação de cancelamento pendente.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        tickets
                                            .filter(t =>
                                                t.user.name?.toLowerCase().includes(search.toLowerCase()) ||
                                                t.user.username.toLowerCase().includes(search.toLowerCase()) ||
                                                t.hash?.toLowerCase().includes(search.toLowerCase()) ||
                                                t.id.toLowerCase().includes(search.toLowerCase())
                                            )
                                            .map((ticket) => (
                                                <TableRow key={ticket.id} className="hover:bg-muted/10 transition-colors">
                                                    <TableCell className="font-mono text-xs">
                                                        <div className="font-bold text-foreground">{ticket.hash || ticket.id.slice(0, 8)}</div>
                                                        <div className="text-[10px] text-muted-foreground">{ticket.gameType}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium text-foreground">{ticket.user.name || ticket.user.username}</div>
                                                        <div className="text-xs text-muted-foreground">@{ticket.user.username}</div>
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(ticket.createdAt).toLocaleString('pt-BR')}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        {new Date(ticket.drawDate).toLocaleString('pt-BR')}
                                                    </TableCell>
                                                    <TableCell className="font-bold text-foreground">
                                                        {formatCurrency(ticket.amount)}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-yellow-600 dark:text-yellow-500 font-medium">
                                                        <div className="flex items-start gap-1">
                                                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                                            {ticket.cancellationReason || "Motivo não informado"}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                                onClick={() => handleAction(ticket.id, true)}
                                                                title="Aprovar Cancelamento"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                                                                onClick={() => handleAction(ticket.id, false)}
                                                                title="Rejeitar Solicitação"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history">
                    <Card className="border-border shadow-sm bg-card">
                        <CardHeader className="bg-muted/30 border-b border-border">
                            <CardTitle className="text-sm font-medium">Histórico de Bilhetes Cancelados</CardTitle>
                        </CardHeader>
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
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                                    <RefreshCcw className="w-4 h-4 animate-spin" />
                                                    Carregando...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : history.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                                Nenhum bilhete cancelado no histórico.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        history
                                            .filter(t =>
                                                t.user.name?.toLowerCase().includes(search.toLowerCase()) ||
                                                t.user.username.toLowerCase().includes(search.toLowerCase()) ||
                                                t.hash?.toLowerCase().includes(search.toLowerCase()) ||
                                                t.id.toLowerCase().includes(search.toLowerCase())
                                            )
                                            .map((ticket) => (
                                                <TableRow key={ticket.id} className="hover:bg-muted/10 transition-colors">
                                                    <TableCell className="font-mono text-xs">
                                                        <div className="font-bold text-foreground">{ticket.hash || ticket.id.slice(0, 8)}</div>
                                                        <div className="text-[10px] text-muted-foreground">{ticket.gameType}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium text-foreground">{ticket.user.name || ticket.user.username}</div>
                                                        <div className="text-xs text-muted-foreground">@{ticket.user.username}</div>
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(ticket.createdAt).toLocaleString('pt-BR')}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        {new Date(ticket.drawDate).toLocaleString('pt-BR')}
                                                    </TableCell>
                                                    <TableCell className="font-bold text-foreground">
                                                        {formatCurrency(ticket.amount)}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground italic">
                                                        {ticket.cancellationReason || "---"}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 uppercase text-[10px]">
                                                            Cancelado
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div >
    );
}
