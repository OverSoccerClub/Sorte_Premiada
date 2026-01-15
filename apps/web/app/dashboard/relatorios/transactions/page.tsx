"use client"

import { API_URL } from "@/lib/api"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Download, Printer, Filter, Calendar, User, ArrowUpCircle, ArrowDownCircle, Receipt, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useAlert } from "@/context/alert-context"
import { useActiveCompanyId } from "@/context/use-active-company"
import { StandardPageHeader } from "@/components/standard-page-header"

export default function TransactionsDetailedPage() {
    const activeCompanyId = useActiveCompanyId()
    const { showAlert } = useAlert()
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [users, setUsers] = useState<any[]>([])

    // Filters
    const [selectedUser, setSelectedUser] = useState("all")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [selectedType, setSelectedType] = useState("all")
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem("token")
            const queryParams = new URLSearchParams()
            if (activeCompanyId) queryParams.append('targetCompanyId', activeCompanyId)

            const res = await fetch(`${API_URL}/users?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
                const data = await res.json()
                setUsers(data)
            }
        } catch (error) {
            console.error("Erro ao buscar usuários", error)
        }
    }

    const fetchTransactions = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem("token")
            const queryParams = new URLSearchParams({
                startDate: new Date(startDate + 'T00:00:00').toISOString(),
                endDate: new Date(endDate + 'T23:59:59').toISOString(),
            })

            if (selectedUser !== "all") queryParams.append('userId', selectedUser)
            if (selectedCategory !== "all") queryParams.append('category', selectedCategory)
            if (selectedType !== "all") queryParams.append('type', selectedType)
            if (activeCompanyId) queryParams.append('targetCompanyId', activeCompanyId)

            const res = await fetch(`${API_URL}/finance/all-transactions?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (res.ok) {
                const data = await res.json()
                setTransactions(data)
            } else {
                showAlert("Erro", "Não foi possível carregar as transações.", "error")
            }
        } catch (error) {
            showAlert("Erro de Conexão", "Verifique sua conexão.", "error")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
        fetchTransactions()
    }, [activeCompanyId])

    const handlePrintReceipt = (transaction: any) => {
        // Mock print logic or navigate to a receipt route
        showAlert("Impressão", "Gerando comprovante digital para a transação...", "info")
        // In a real scenario, this could open a print-friendly window or generate a PDF/Image
    }

    const categories = [
        { value: "SALE", label: "Venda (Aposta)" },
        { value: "PRIZE_PAYOUT", label: "Pagamento de Prêmio" },
        { value: "COLLECTION", label: "Recolhimento (Sangria)" },
        { value: "COMMISSION_PAYMENT", label: "Pagamento de Comissão" },
        { value: "ADJUSTMENT", label: "Ajuste Manual" },
    ]

    return (
        <div className="space-y-6">
            <StandardPageHeader
                icon={<Receipt className="w-8 h-8 text-emerald-500" />}
                title="Movimentações Financeiras"
                description="Extrato detalhado de todas as transações de caixa."
                onRefresh={fetchTransactions}
                refreshing={loading}
            >
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-36 h-9 bg-background"
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-36 h-9 bg-background"
                        />
                    </div>
                    <Button onClick={fetchTransactions} className="h-9 bg-emerald-600 hover:bg-emerald-700">
                        Filtrar
                    </Button>
                </div>
            </StandardPageHeader>

            <Card className="border-border shadow-sm bg-card">
                <CardHeader className="bg-muted/30 border-b border-border py-4">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block ml-1">Usuário / Cambista</Label>
                            <Select value={selectedUser} onValueChange={setSelectedUser}>
                                <SelectTrigger className="h-9 bg-background">
                                    <SelectValue placeholder="Todos os usuários" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os usuários</SelectItem>
                                    {users.map(u => (
                                        <SelectItem key={u.id} value={u.id}>{u.name || u.username}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-[200px]">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block ml-1">Categoria</Label>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="h-9 bg-background">
                                    <SelectValue placeholder="Todas as categorias" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as categorias</SelectItem>
                                    {categories.map(c => (
                                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-[150px]">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block ml-1">Tipo</Label>
                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger className="h-9 bg-background">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="CREDIT">Entrada (+)</SelectItem>
                                    <SelectItem value="DEBIT">Saída (-)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/20 hover:bg-muted/20">
                                    <TableHead className="pl-6 text-[10px] font-bold uppercase">Data/Hora</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase">Usuário</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase">Descrição / Categoria</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-center">Tipo</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-right pr-6">Valor</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-right pr-6">Ação</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                                            Nenhuma transação encontrada para os filtros aplicados.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    transactions.map(t => (
                                        <TableRow key={t.id} className="hover:bg-muted/30 border-b border-border/40">
                                            <TableCell className="pl-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-foreground">
                                                        {format(new Date(t.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {format(new Date(t.createdAt), "HH:mm:ss")}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold text-[10px] ring-1 ring-blue-500/20">
                                                        {t.user?.username?.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="text-xs font-semibold text-foreground">{t.user?.name || t.user?.username}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium text-foreground">{t.description}</span>
                                                    <Badge variant="outline" className="w-fit text-[9px] h-4 mt-1 bg-muted/50 text-muted-foreground font-normal border-border/60">
                                                        {categories.find(c => c.value === t.category)?.label || t.category}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {t.type === 'CREDIT' ? (
                                                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 flex items-center gap-1 w-fit mx-auto px-2">
                                                        <ArrowUpCircle className="w-3 h-3" /> Entrada
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 flex items-center gap-1 w-fit mx-auto px-2">
                                                        <ArrowDownCircle className="w-3 h-3" /> Saída
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className={`text-right pr-6 font-bold text-sm ${t.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {t.type === 'DEBIT' ? '-' : ''}
                                                {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                                                    onClick={() => handlePrintReceipt(t)}
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </Button>
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
