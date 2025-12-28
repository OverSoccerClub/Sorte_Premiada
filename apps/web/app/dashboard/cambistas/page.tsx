"use client"

import { API_URL } from "@/lib/api"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Filter, Loader2, Trash2, Users, UserPlus, Save, User, Mail, Lock, AtSign, MapPin, SquarePen, Clock, ShieldAlert, ShieldCheck, Ban, CheckCircle2, AlertTriangle, Bell, BellOff, DollarSign, Percent, Info } from "lucide-react"
import { useAlert } from "@/context/alert-context"
import { Switch } from "@/components/ui/switch"
import { StandardPageHeader } from "@/components/standard-page-header"
import { StandardPagination } from "@/components/standard-pagination"

const ACCOUNTABILITY_ALARM_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"

const formSchema = z.object({
    name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres." }),
    username: z.string().min(3, { message: "Usuário deve ter pelo menos 3 caracteres." }),
    password: z.string().optional(),
    email: z.union([z.string().email({ message: "Email inválido." }), z.literal('')]),
    areaId: z.string().optional(),
    salesLimit: z.coerce.number().min(0).optional(),
    commissionRate: z.coerce.number().min(0).max(100).optional(),
    accountabilityLimitHours: z.coerce.number().min(1, { message: "Mínimo 1 hora." }).optional(),
    canCancelTickets: z.boolean().default(false),
    isActive: z.boolean().default(true),
})

interface Area {
    id: string
    name: string
    city: string
    state: string
}

export default function CambistasPage() {
    const [cambistas, setCambistas] = useState<any[]>([])
    const [areas, setAreas] = useState<Area[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [audioEnabled, setAudioEnabled] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState<number | "all">(10)
    const { showAlert, hideAlert } = useAlert()

    // Sound effect for accountability
    useEffect(() => {
        if (!audioEnabled) return

        const hasExpired = cambistas.some(c => c.accountability?.isExpired)
        if (hasExpired) {
            const audio = new Audio(ACCOUNTABILITY_ALARM_URL)
            audio.play().catch(e => console.error("Audio play failed", e))
        }
    }, [cambistas, audioEnabled])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            username: "",
            password: "",
            email: "",
            areaId: undefined,
            salesLimit: 1000,
            commissionRate: 10,
            accountabilityLimitHours: 24,
            canCancelTickets: false,
            isActive: true,
        },
    })

    const fetchAreas = async () => {
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/areas`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
                const data = await res.json()
                setAreas(data)
            }
        } catch (error) {
            console.error("Failed to fetch areas", error)
        }
    }

    const fetchCambistas = async () => {
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/users`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
                const data = await res.json()
                // Filter only CAMBISTAS
                const cambistasOnly = data.filter((user: any) => user.role === "CAMBISTA")
                setCambistas(cambistasOnly)
            } else {
                showAlert("Erro", "Não foi possível carregar a lista de cambistas.", "error")
            }
        } catch (error) {
            showAlert("Erro de Conexão", "Verifique sua conexão e tente novamente.", "error")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCambistas()
        fetchAreas()
    }, [])

    const handleOpenDialog = (cambista?: any) => {
        if (cambista) {
            setEditingId(cambista.id)
            form.reset({
                name: cambista.name || "",
                username: cambista.username,
                email: cambista.email || "",
                password: "", // Password is optional on edit
                areaId: cambista.areaId || undefined,
                salesLimit: cambista.salesLimit ? Number(cambista.salesLimit) : 1000,
                commissionRate: cambista.commissionRate ? Number(cambista.commissionRate) : 10,
                accountabilityLimitHours: cambista.accountabilityLimitHours ?? 24,
                canCancelTickets: cambista.canCancelTickets ?? false,
                isActive: cambista.isActive ?? true,
            })
        } else {
            setEditingId(null)
            form.reset({
                name: "",
                username: "",
                email: "",
                password: "",
                areaId: undefined,
                salesLimit: 1000,
                commissionRate: 10,
                accountabilityLimitHours: 24,
                canCancelTickets: false,
                isActive: true,
            })
        }
        setIsDialogOpen(true)
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const token = localStorage.getItem("token")
            const url = editingId
                ? `${API_URL}/users/${editingId}`
                : `${API_URL}/users`

            const method = editingId ? "PATCH" : "POST"

            // Remove password if empty on edit to avoid overwriting with empty string
            const bodyData: any = { ...values, role: "CAMBISTA" }
            if (editingId && !values.password) {
                delete bodyData.password
            }

            const res = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(bodyData),
            })

            if (res.ok) {
                setIsDialogOpen(false)
                fetchCambistas()
                showAlert(
                    "Sucesso!",
                    editingId ? "Os dados do cambista foram atualizados." : "Novo cambista cadastrado com sucesso!",
                    "success"
                )
            } else {
                showAlert("Erro", "Não foi possível salvar as alterações.", "error")
            }
        } catch (error) {
            showAlert("Erro", "Ocorreu um erro ao enviar o formulário.", "error")
        }
    }

    const handleToggleBlock = async (cambista: any) => {
        const action = cambista.isActive ? "bloquear" : "desbloquear"
        showAlert(
            `${action.charAt(0).toUpperCase() + action.slice(1)} Cambista`,
            `Tem certeza que deseja ${action} o cambista ${cambista.name || cambista.username}?`,
            cambista.isActive ? "warning" : "info",
            true,
            async () => {
                try {
                    const token = localStorage.getItem("token")
                    const res = await fetch(`${API_URL}/users/${cambista.id}`, {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ isActive: !cambista.isActive }),
                    })
                    hideAlert()

                    if (res.ok) {
                        fetchCambistas()
                        showAlert("Sucesso", `O cambista foi ${action === "bloquear" ? "bloqueado" : "desbloqueado"} com sucesso.`, "success")
                    } else {
                        showAlert("Erro", `Não foi possível ${action} o cambista.`, "error")
                    }
                } catch (error) {
                    showAlert("Erro de Conexão", "Não foi possível conectar ao servidor.", "error")
                }
            },
            "Confirmar",
            "Cancelar"
        )
    }

    const handleDelete = async (id: string) => {
        showAlert(
            "Excluir Cambista",
            "Tem certeza que deseja excluir este cambista? Esta ação não pode ser desfeita.",
            "warning",
            true,
            async () => {
                try {
                    const token = localStorage.getItem("token")
                    const res = await fetch(`${API_URL}/users/${id}`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                    })
                    hideAlert()

                    if (res.ok) {
                        fetchCambistas()
                        showAlert("Removido", "O cambista foi removido com sucesso.", "success")
                    } else {
                        showAlert("Erro", "Não foi possível remover o cambista.", "error")
                    }
                } catch (error) {
                    showAlert("Erro de Conexão", "Não foi possível conectar ao servidor.", "error")
                }
            },
            "Sim, Excluir",
            "Cancelar"
        )
    }

    return (
        <StandardPageHeader
            icon={<Users className="w-8 h-8 text-emerald-500" />}
            title="Cambistas"
            description="Gerencie sua equipe de vendas e monitore o desempenho."
            onRefresh={fetchCambistas}
            refreshing={loading}
        >
            <div className="flex flex-wrap items-center gap-3">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className={`h-9 border-border text-xs font-bold transition-all ${audioEnabled ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-background text-muted-foreground"}`}
                >
                    {audioEnabled ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
                    {audioEnabled ? "Alerta Ativo" : "Alerta Sonoro"}
                </Button>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar cambista..."
                        className="pl-9 bg-background border-border h-9 shadow-sm text-xs font-semibold"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value)
                            setPage(1)
                        }}
                    />
                </div>

                <Button variant="outline" size="sm" className="h-9 border-border text-xs font-bold">
                    <Filter className="h-4 w-4 text-slate-500 mr-2" />
                    Filtros
                </Button>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={() => handleOpenDialog()}
                            className="bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-900/20 h-9"
                            size="sm"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Cambista
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-popover border-border">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-foreground">
                                {editingId ? (
                                    <>
                                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                                            <SquarePen className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        Editar Cambista
                                    </>
                                ) : (
                                    <>
                                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                                            <UserPlus className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        Adicionar Novo Cambista
                                    </>
                                )}
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                                {editingId ? "Atualize os dados do vendedor." : "Crie uma conta para um novo vendedor."}
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground">Nome Completo</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input placeholder="João da Silva" className="pl-9 bg-muted/50 border-input" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground">Usuário (Login)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <AtSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input placeholder="joaosilva" className="pl-9 bg-muted/50 border-input" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground">Email (Opcional)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input placeholder="joao@exemplo.com" className="pl-9 bg-muted/50 border-input" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="areaId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground">Praça (Área)</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="pl-9 bg-muted/50 border-input">
                                                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <SelectValue placeholder="Selecione uma praça" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {areas.map((area) => (
                                                        <SelectItem key={area.id} value={area.id}>
                                                            {area.city} - {area.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="salesLimit"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-foreground">Limite Diário (R$)</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input type="number" step="0.01" placeholder="1000.00" className="pl-9 bg-muted/50 border-input" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="accountabilityLimitHours"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-foreground">Prazo Prest. Contas (h)</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input type="number" step="1" placeholder="24" className="pl-9 bg-muted/50 border-input" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="commissionRate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-foreground">Comissão (%)</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input type="number" step="1" placeholder="10" className="pl-9 bg-muted/50 border-input" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="canCancelTickets"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-muted/30">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-foreground">Autorizar Cancelamento</FormLabel>
                                                    <p className="text-[0.7rem] text-muted-foreground mr-2">
                                                        Permite ao cambista cancelar bilhetes dentro do prazo de tolerância.
                                                    </p>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground flex justify-between">
                                                Senha
                                                {editingId && <span className="text-xs font-normal text-muted-foreground">(Opcional na edição)</span>}
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input type="password" placeholder="******" className="pl-9 bg-muted/50 border-input" {...field} />
                                                </div>
                                            </FormControl>
                                            {editingId && <p className="text-[0.8rem] text-muted-foreground mt-1">Deixe em branco para manter a senha atual.</p>}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter className="gap-2 sm:gap-0">
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-border text-foreground hover:bg-muted">
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={form.formState.isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                        {form.formState.isSubmitting ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            editingId ? <Save className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />
                                        )}
                                        {editingId ? "Salvar Alterações" : "Criar Conta"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-border shadow-sm bg-card overflow-hidden">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-muted/50 border-b border-border/60 bg-muted/20">
                                    <TableHead className="w-[300px]">Nome</TableHead>
                                    <TableHead>Praça</TableHead>
                                    <TableHead>Limite / Comissão</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                    {(() => {
                                        const filteredCambistas = cambistas.filter(c =>
                                            c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            c.email?.toLowerCase().includes(searchTerm.toLowerCase())
                                        );

                                        const totalItems = filteredCambistas.length;
                                        const paginatedCambistas = limit === "all" ? filteredCambistas : filteredCambistas.slice((page - 1) * limit, Number(page) * Number(limit));

                                        if (filteredCambistas.length === 0) return (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">
                                                    Nenhum cambista encontrado.
                                                </TableCell>
                                            </TableRow>
                                        );

                                        return paginatedCambistas.map((cambista) => {
                                            const isManuallyBlocked = cambista.isActive === false;

                                            return (
                                                <TableRow key={cambista.id} className="hover:bg-muted/50 transition-colors">
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ring-2 ${isManuallyBlocked ? 'bg-red-100 text-red-600 ring-red-500/20' : 'bg-emerald-100 text-emerald-600 ring-emerald-500/20'}`}>
                                                                {cambista.username.substring(0, 2)}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-foreground flex items-center gap-1.5">
                                                                    <User className={`w-3.5 h-3.5 ${isManuallyBlocked ? 'text-red-500' : 'text-emerald-500'}`} />
                                                                    {cambista.name || cambista.username}
                                                                    {cambista.canCancelTickets && (
                                                                        <div title="Pode cancelar bilhetes" className="p-0.5 bg-red-100 dark:bg-red-900/30 rounded text-red-600 dark:text-red-400">
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                                    <Mail className="w-3 h-3" />
                                                                    {cambista.email || "Sem email"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {cambista.area ? (
                                                            <div className="flex items-center gap-2">
                                                                <MapPin className="h-3 w-3 text-emerald-500" />
                                                                <span className="text-foreground font-medium">{cambista.area.city}</span>
                                                                <span className="text-muted-foreground text-xs">({cambista.area.name})</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs italic flex items-center gap-1">
                                                                <MapPin className="h-3 w-3 text-slate-400" />
                                                                Sem praça
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                                                                <DollarSign className="w-3 h-3 text-emerald-500" />
                                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cambista.salesLimit || 0)}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                <Percent className="w-3 h-3 text-blue-500" />
                                                                {cambista.commissionRate || 0}% de comissão
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {isManuallyBlocked ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 gap-1.5">
                                                                <Ban className="w-3.5 h-3.5" />
                                                                Bloqueado
                                                            </span>
                                                        ) : cambista.accountability?.isExpired ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 gap-1.5 animate-pulse">
                                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                                Expirado
                                                            </span>
                                                        ) : cambista.accountability?.status === 'EXPIRING' ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 gap-1.5">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                Vence em {Math.max(0, cambista.accountability.hoursRemaining).toFixed(1)}h
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 gap-1.5">
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                                Ativo
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className={`h-8 w-8 p-0 ${isManuallyBlocked ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200' : 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200'}`}
                                                                onClick={() => handleToggleBlock(cambista)}
                                                                title={isManuallyBlocked ? "Desbloquear Cambista" : "Bloquear Cambista"}
                                                            >
                                                                {isManuallyBlocked ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                                onClick={() => handleOpenDialog(cambista)}
                                                                title="Editar"
                                                            >
                                                                <SquarePen className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => handleDelete(cambista.id)}
                                                                title="Excluir"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        });
                                    })()}
                                </TableBody>
                            </Table>
                            <StandardPagination
                                currentPage={page}
                                totalPages={limit === "all" ? 1 : Math.ceil(cambistas.filter(c =>
                                    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
                                ).length / limit)}
                                limit={limit}
                                onPageChange={setPage}
                                onLimitChange={(l) => {
                                    setLimit(l)
                                    setPage(1)
                                }}
                                totalItems={cambistas.filter(c =>
                                    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
                                ).length}
                            />
                            </TableBody>
            </Table>
                    )}
        </CardContent>
            </Card >
        </div >
    )
}
