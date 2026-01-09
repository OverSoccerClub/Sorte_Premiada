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
import { Plus, Search, Filter, Loader2, Trash2, Users, UserPlus, Save, User, Mail, Lock, AtSign, MapPin, SquarePen, Clock, ShieldAlert, ShieldCheck, Ban, CheckCircle2, AlertTriangle, Bell, BellOff, DollarSign, Percent, Info, Eye, EyeOff, Phone, FileText } from "lucide-react"
import { useAlert } from "@/context/alert-context"
import { Switch } from "@/components/ui/switch"
import { StandardPageHeader } from "@/components/standard-page-header"
import { StandardPagination } from "@/components/standard-pagination"

const ACCOUNTABILITY_ALARM_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"

const formSchema = z.object({
    name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres." }),
    username: z.string().optional(), // Será gerado automaticamente para CAMBISTA
    password: z.string().optional(),
    email: z.union([z.string().email({ message: "Email inválido." }), z.literal('')]),
    areaId: z.string().optional(),
    salesLimit: z.coerce.number().min(0).optional(),
    commissionRate: z.coerce.number().min(0).max(100).optional(),
    minSalesThreshold: z.coerce.number().min(0).optional(),
    fixedCommission: z.coerce.number().min(0).optional(),
    accountabilityLimitHours: z.coerce.number().min(1, { message: "Mínimo 1 hora." }).optional(),
    canCancelTickets: z.boolean().default(false),
    isActive: z.boolean().default(true),
    // New fields
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    phone: z.string().optional(),
    neighborhood: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    cpf: z.string().optional(),
})

interface Area {
    id: string
    name: string
    city: string
    state: string
}

import { useActiveCompanyId } from "@/context/use-active-company"

export default function CambistasPage() {
    const activeCompanyId = useActiveCompanyId()
    const [cambistas, setCambistas] = useState<any[]>([])
    const [areas, setAreas] = useState<Area[]>([])
    // ... (rest of state items are unchanged, I need to be careful not to overwrite them if I don't include them in Replacement, but here I am replacing the START of the component)
    // Actually, I should just replace the specific parts: Import, Component Start, and fetchCambistas function.
    // BUT replace_file_content needs contiguous block. 
    // I will replace from "export default function..." down to useEffect.

    // WAIT: I need to preserve all the useState lines that I'm overwriting if I do a large block.
    // The previous tool call output showed lines 45-125. Ideally I shouldn't rewrite all useState hooks if I can avoid it.
    // But I need to insert `const activeCompanyId = ...` at the top.

    // Better strategy:
    // 1. Insert import at top. (I can't do multiple discontinuous edits with replace_file_content... wait, I can use multi_replace_file_content).
    // I will use multi_replace_file_content for CambistasPage.

    // Aborting this specific tool call for Cambistas and will do it in the next step with multi_replace.
    // I will use this tool call ONLY for tenant-switcher.

    // Oh, I already put 2 tool calls in the queue?
    // "Call tools as you normally would... execute this tool immediately (parallel)".
    // I will try to rewrite the content carefully for Cambistas Page using `replace_file_content` but I have to include the whole block.

    // Let's use `replace_file_content` for TenantSwitcher (above) and I will send `multi_replace` for Cambistas in a SEPARATE turn or wait... 
    // I can't undo the prompt "I'll do them in one turn". 
    // The previous tool setup allowed multiple tools.

    // I will use `replace_file_content` for CambistasPage but I will include the necessary lines.
    // I will verify the lines from `view_file` (Step 597).
    // Lines 45-125 covers state + fetch functions + useEffect.
    // I will rewrite fetchCambistas and useEffect.

    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [audioEnabled, setAudioEnabled] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState<number | "all">(10)
    const [showPassword, setShowPassword] = useState(false)
    const { showAlert, hideAlert } = useAlert()

    // State for Success Dialog (Generated Username)
    const [createdUser, setCreatedUser] = useState<{ name: string; username: string } | null>(null)
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
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
            minSalesThreshold: 200,
            fixedCommission: 40,
            accountabilityLimitHours: 24,
            canCancelTickets: false,
            isActive: true,
        },
    })

    // Funções de máscara para formatação automática
    const maskCPF = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1')
    }

    const maskPhone = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1')
    }

    const maskCEP = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{3})\d+?$/, '$1')
    }


    const fetchAreas = async () => {
        try {
            const token = localStorage.getItem("token")
            // Passar targetCompanyId se houver
            const queryParams = new URLSearchParams()
            if (activeCompanyId) {
                queryParams.append('targetCompanyId', activeCompanyId)
            }

            const res = await fetch(`${API_URL}/areas?${queryParams.toString()}`, {
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
            // Passar targetCompanyId se houver
            const queryParams = new URLSearchParams()
            if (activeCompanyId) {
                queryParams.append('targetCompanyId', activeCompanyId)
            }

            const res = await fetch(`${API_URL}/users?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
                const data = await res.json()
                // Filter only CAMBISTAS
                const cambistasOnly = data.filter((user: any) => user.role === "CAMBISTA")
                setCambistas(cambistasOnly)
            } else {
                const errorData = await res.json().catch(() => ({}))
                const errorMessage = errorData.message || "Não foi possível carregar a lista de cambistas."
                console.error("Erro ao carregar cambistas:", errorMessage, errorData)
                showAlert("Erro", errorMessage, "error")
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
    }, [activeCompanyId])

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
                minSalesThreshold: cambista.minSalesThreshold ? Number(cambista.minSalesThreshold) : 200,
                fixedCommission: cambista.fixedCommission ? Number(cambista.fixedCommission) : 40,
                accountabilityLimitHours: cambista.accountabilityLimitHours ?? 24,
                canCancelTickets: cambista.canCancelTickets ?? false,
                isActive: cambista.isActive ?? true,
                // New fields
                address: cambista.address || "",
                city: cambista.city || "",
                state: cambista.state || "",
                zipCode: cambista.zipCode || "",
                phone: cambista.phone || "",
                neighborhood: cambista.neighborhood || "",
                number: cambista.number || "",
                complement: cambista.complement || "",
                cpf: cambista.cpf || "",
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
                minSalesThreshold: 200,
                fixedCommission: 40,
                accountabilityLimitHours: 24,
                canCancelTickets: false,
                isActive: true,
                // New fields
                address: "",
                city: "",
                state: "",
                zipCode: "",
                phone: "",
                neighborhood: "",
                number: "",
                complement: "",
                cpf: "",
            })
        }
        setShowPassword(false)
        setIsDialogOpen(true)
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const token = localStorage.getItem("token")
            const queryParams = new URLSearchParams()
            if (activeCompanyId) {
                queryParams.append('targetCompanyId', activeCompanyId)
            }
            const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ""

            const url = editingId
                ? `${API_URL}/users/${editingId}${queryString}`
                : `${API_URL}/users${queryString}`

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
                const data = await res.json()
                setIsDialogOpen(false)

                // Se foi criação (não edição) e temos o username gerado, mostrar modal
                // Backend returns the created user object
                if (!editingId && data.username) {
                    setCreatedUser({ name: data.name, username: data.username })
                    setIsSuccessDialogOpen(true)
                } else {
                    showAlert(
                        "Sucesso!",
                        editingId ? "Os dados do cambista foram atualizados." : "Novo cambista cadastrado com sucesso!",
                        "success"
                    )
                }

                // Recarregar a lista de cambistas
                await fetchCambistas()
            } else {
                const errorData = await res.json().catch(() => ({}))
                const errorMessage = errorData.message || "Não foi possível salvar as alterações."
                showAlert("Erro", errorMessage, "error")
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
                        showAlert("Sucesso", `O cambista foi ${action === "bloquear" ? "bloqueado" : "desbloqueado"} com sucesso.`, "success")
                        // Recarregar a lista de cambistas
                        await fetchCambistas()
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
                        showAlert("Removido", "O cambista foi removido com sucesso.", "success")
                        // Recarregar a lista de cambistas
                        await fetchCambistas()
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
        <div className="space-y-6">
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
                        <DialogContent className="sm:max-w-5xl bg-popover border-border overflow-y-auto max-h-[90vh]">
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
                                                <Users className="w-5 h-5 text-emerald-500" />
                                            </div>
                                            Adicionar Novo Cambista
                                        </>
                                    )}
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                    {editingId ? "Atualize os dados do Cambista." : "Crie uma conta para um novo Cambista."}
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                                        {/* --- DADOS PESSOAIS --- */}
                                        <div className="md:col-span-12">
                                            <h3 className="text-sm font-semibold mb-3 text-emerald-600 flex items-center gap-2">
                                                <User className="w-4 h-4" /> Dados Pessoais e Acesso
                                            </h3>
                                        </div>

                                        <div className="md:col-span-5">
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-foreground">Nome Completo <span className="text-red-500">*</span></FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                                <Input placeholder="Nome do Cambista" className="pl-9 bg-muted/50 border-input" {...field} />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="md:col-span-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                                    <AtSign className="h-4 w-4 text-muted-foreground" />
                                                    Login (Automático)
                                                </label>
                                                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 h-10 flex items-center">
                                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 truncate">
                                                        <Info className="h-3 w-3 inline mr-1" />
                                                        Gerado via Nome + Empresa
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="md:col-span-3">
                                            <FormField
                                                control={form.control}
                                                name="password"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-foreground flex justify-between">
                                                            Senha
                                                            {editingId && <span className="text-xs font-normal text-muted-foreground">(Opcional)</span>}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                                <Input type={showPassword ? "text" : "password"} placeholder="******" className="pl-9 pr-10 bg-muted/50 border-input" {...field} />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowPassword(!showPassword)}
                                                                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                                                                    tabIndex={-1}
                                                                >
                                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                                </button>
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* --- CONTATO (LINHA UNICA) --- */}
                                        <div className="md:col-span-4">
                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-foreground">Email (Opcional)</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                                <Input placeholder="email@exemplo.com" className="pl-9 bg-muted/50 border-input" {...field} />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="md:col-span-4">
                                            <FormField
                                                control={form.control}
                                                name="cpf"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-foreground">CPF</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                                <Input
                                                                    placeholder="000.000.000-00"
                                                                    className="pl-9 bg-muted/50 border-input"
                                                                    {...field}
                                                                    onChange={(e) => field.onChange(maskCPF(e.target.value))}
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="md:col-span-4">
                                            <FormField
                                                control={form.control}
                                                name="phone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-foreground">Telefone</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                                <Input
                                                                    placeholder="(00) 00000-0000"
                                                                    className="pl-9 bg-muted/50 border-input"
                                                                    {...field}
                                                                    onChange={(e) => field.onChange(maskPhone(e.target.value))}
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {/* --- ENDEREÇO (MOVEU PARA CIMA) --- */}
                                    <div className="border-t border-border/50 pt-4">
                                        <h3 className="text-sm font-semibold mb-3 text-emerald-600 flex items-center gap-2">
                                            <MapPin className="w-4 h-4" /> Endereço
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                            <div className="md:col-span-2">
                                                <FormField
                                                    control={form.control}
                                                    name="zipCode"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-foreground">CEP</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="00000-000"
                                                                    className="bg-muted/50 border-input"
                                                                    {...field}
                                                                    onChange={(e) => field.onChange(maskCEP(e.target.value))}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="md:col-span-4">
                                                <FormField
                                                    control={form.control}
                                                    name="city"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-foreground">Cidade</FormLabel>
                                                            <FormControl>
                                                                <Input className="bg-muted/50 border-input" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="md:col-span-1">
                                                <FormField
                                                    control={form.control}
                                                    name="state"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-foreground">UF</FormLabel>
                                                            <FormControl>
                                                                <Input maxLength={2} className="bg-muted/50 border-input" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="md:col-span-5">
                                                <FormField
                                                    control={form.control}
                                                    name="neighborhood"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-foreground">Bairro</FormLabel>
                                                            <FormControl>
                                                                <Input className="bg-muted/50 border-input" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="md:col-span-5">
                                                <FormField
                                                    control={form.control}
                                                    name="address"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-foreground">Logradouro</FormLabel>
                                                            <FormControl>
                                                                <Input className="bg-muted/50 border-input" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <FormField
                                                    control={form.control}
                                                    name="number"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-foreground">Número</FormLabel>
                                                            <FormControl>
                                                                <Input className="bg-muted/50 border-input" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="md:col-span-5">
                                                <FormField
                                                    control={form.control}
                                                    name="complement"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-foreground">Complemento</FormLabel>
                                                            <FormControl>
                                                                <Input className="bg-muted/50 border-input" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* --- CONFIGURAÇÃO FINANCEIRA (LINHA OTIMIZADA) --- */}
                                    <div className="border-t border-border/50 pt-4">
                                        <h3 className="text-sm font-semibold mb-3 text-emerald-600 flex items-center gap-2">
                                            <DollarSign className="w-4 h-4" /> Configuração Financeira
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                            <div className="md:col-span-3 lg:col-span-2">
                                                <FormField
                                                    control={form.control}
                                                    name="areaId"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-foreground text-xs uppercase font-bold text-muted-foreground">Praça</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger className="pl-8 bg-muted/50 border-input h-9 text-xs">
                                                                        <MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                                                        <SelectValue placeholder="Selecionar" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {areas.map((area) => (
                                                                        <SelectItem key={area.id} value={area.id}>
                                                                            {area.city}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="md:col-span-3 lg:col-span-2">
                                                <FormField
                                                    control={form.control}
                                                    name="salesLimit"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-foreground text-xs uppercase font-bold text-muted-foreground">Limite Diário</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <DollarSign className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                                                    <Input type="number" step="0.01" className="pl-8 bg-muted/50 border-input h-9 text-xs" {...field} />
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="md:col-span-3 lg:col-span-2">
                                                <FormField
                                                    control={form.control}
                                                    name="commissionRate"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-foreground text-xs uppercase font-bold text-muted-foreground">Comissão (%)</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Percent className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                                                    <Input type="number" step="0.5" className="pl-8 bg-muted/50 border-input h-9 text-xs" {...field} />
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="md:col-span-3 lg:col-span-2">
                                                <FormField
                                                    control={form.control}
                                                    name="minSalesThreshold"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-foreground text-xs uppercase font-bold text-muted-foreground">Meta Mín.</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <DollarSign className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                                                    <Input type="number" step="0.01" className="pl-8 bg-muted/50 border-input h-9 text-xs" {...field} />
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="md:col-span-3 lg:col-span-2">
                                                <FormField
                                                    control={form.control}
                                                    name="fixedCommission"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-foreground text-xs uppercase font-bold text-muted-foreground">Com. Fixa</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <DollarSign className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                                                    <Input type="number" step="0.01" className="pl-8 bg-muted/50 border-input h-9 text-xs" {...field} />
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="md:col-span-3 lg:col-span-2">
                                                <FormField
                                                    control={form.control}
                                                    name="accountabilityLimitHours"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-foreground text-xs uppercase font-bold text-muted-foreground">Prazo (Horas)</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Clock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                                                    <Input type="number" step="1" className="pl-8 bg-muted/50 border-input h-9 text-xs" {...field} />
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="md:col-span-12 flex justify-end">
                                                <FormField
                                                    control={form.control}
                                                    name="canCancelTickets"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center space-x-2 space-y-0 rounded-lg border p-2 bg-muted/30">
                                                            <FormControl>
                                                                <Switch
                                                                    checked={field.value}
                                                                    onCheckedChange={field.onChange}
                                                                />
                                                            </FormControl>
                                                            <div className="space-y-0.5">
                                                                <FormLabel className="text-xs font-medium text-foreground">
                                                                    Permitir Cancelar Bilhetes
                                                                </FormLabel>
                                                            </div>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-border/50">
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
            </StandardPageHeader>

            <Card className="border-border shadow-sm bg-card overflow-hidden">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-muted/50 border-b border-border/60 bg-muted/20">
                                        <TableHead className="w-[300px]">Nome</TableHead>
                                        <TableHead className="w-[150px]">Login</TableHead>
                                        <TableHead>Empresa</TableHead>
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
                                                        <div className="font-mono text-xs bg-muted px-2 py-1 rounded inline-block select-all">
                                                            {cambista.username}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm text-foreground">{cambista.company?.companyName || "-"}</span>
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
                        </>
                    )
                    }
                </CardContent>
            </Card>

            {/* Success Dialog for Generated Username */}
            <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-green-600 flex items-center gap-2">
                            <CheckCircle2 className="w-6 h-6" />
                            Cambista Criado com Sucesso!
                        </DialogTitle>
                        <DialogDescription>
                            O cambista foi cadastrado no sistema.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-4">
                        <div className="p-4 bg-muted rounded-lg border text-center space-y-2">
                            <p className="text-sm text-muted-foreground">Login de Acesso Gerado:</p>
                            <p className="text-3xl font-bold tracking-wider select-all font-mono text-primary">
                                {createdUser?.username}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                <Info className="w-3 h-3 inline mr-1" />
                                Clique no login para selecionar e copiar
                            </p>
                        </div>

                        <div className="text-sm text-center text-muted-foreground">
                            Por favor, informe este login e a senha definida ao cambista para que ele possa acessar o sistema.
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setIsSuccessDialogOpen(false)} className="w-full">
                            Entendi, fechar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
