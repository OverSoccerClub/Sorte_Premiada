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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Filter, Loader2, Trash2, Users, UserPlus, Save, User, Mail, Lock, AtSign, MapPin, SquarePen, ShieldAlert, ShieldCheck, Ban, CheckCircle2, Shield } from "lucide-react"
import { useAlert } from "@/context/alert-context"
import { Switch } from "@/components/ui/switch"
import { StandardPageHeader } from "@/components/standard-page-header"
import { StandardPagination } from "@/components/standard-pagination"
import { useActiveCompanyId } from "@/context/use-active-company"
import { useAuth } from "@/context/auth-context"
import { PERMISSIONS, PERMISSION_LABELS, PERMISSION_GROUPS } from "@/lib/permissions"

const formSchema = z.object({
    name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres." }),
    username: z.string().min(3, { message: "Usuário deve ter pelo menos 3 caracteres." }),
    password: z.string().optional(),
    email: z.union([z.string().email({ message: "Email inválido." }), z.literal('')]),
    role: z.enum(["ADMIN", "SUPERVISOR", "GERENTE", "MASTER"], {
        required_error: "Selecione um nível de acesso.",
    }),
    canResetActivation: z.boolean().default(false),
    isActive: z.boolean().default(true),
    areaId: z.string().optional(),
    neighborhoodId: z.string().optional(),
    permissions: z.record(z.boolean()).optional(),
})

export default function UsersPage() {
    const { user } = useAuth()
    const activeCompanyId = useActiveCompanyId()
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState<number | "all">(10)
    const { showAlert } = useAlert()
    const [areas, setAreas] = useState<any[]>([])
    const [neighborhoods, setNeighborhoods] = useState<any[]>([])
    const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({})

    const fetchAreas = async () => {
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/areas${activeCompanyId ? `?targetCompanyId=${activeCompanyId}` : ''}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                setAreas(await res.json())
            }
        } catch (e) {
            console.error("Failed to fetch areas")
        }
    }

    const fetchNeighborhoods = async (areaId: string) => {
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/neighborhoods?areaId=${areaId}${activeCompanyId ? `&targetCompanyId=${activeCompanyId}` : ''}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                setNeighborhoods(await res.json())
            }
        } catch (e) {
            console.error("Failed to fetch neighborhoods")
        }
    }

    useEffect(() => {
        fetchAreas()
    }, [activeCompanyId])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            username: "",
            password: "",
            email: "",
            role: "SUPERVISOR",
            canResetActivation: false,
            isActive: true,
            areaId: "",
            neighborhoodId: "",
        },
    })

    // Watch areaId to fetch neighborhoods
    const selectedAreaId = form.watch("areaId")
    useEffect(() => {
        if (selectedAreaId) {
            fetchNeighborhoods(selectedAreaId)
        } else {
            setNeighborhoods([])
        }
    }, [selectedAreaId])

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem("token")
            const queryParams = new URLSearchParams()
            if (activeCompanyId) {
                queryParams.append('targetCompanyId', activeCompanyId)
            }

            const res = await fetch(`${API_URL}/users?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
                const data = await res.json()
                // Filter roles based on user permissions
                // If MASTER, show everything including MASTER. If ADMIN, only ADMIN/SUPERVISOR/GERENTE
                const adminsOnly = data.filter((u: any) =>
                    ["ADMIN", "SUPERVISOR", "GERENTE", "MASTER"].includes(u.role)
                )
                setUsers(adminsOnly)
            } else {
                showAlert("Erro", "Não foi possível carregar a lista de usuários.", "error")
            }
        } catch (error) {
            showAlert("Erro de Conexão", "Verifique sua conexão e tente novamente.", "error")
        } finally {
            setLoading(false)
        }
    }

    const handleSyncPermissions = async () => {
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/users/sync-permissions`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json();
                showAlert("Sucesso", `Permissões sincronizadas! ${data.updated} usuários atualizados.`, "success");
                fetchUsers();
            } else {
                showAlert("Erro", "Falha ao sincronizar permissões.", "error");
            }
        } catch (e) {
            showAlert("Erro", "Erro de conexão ao sincronizar permissões.", "error");
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [activeCompanyId])

    const handleOpenDialog = (user?: any) => {
        if (user) {
            setEditingId(user.id)
            const permissions = user.permissions || {}
            setUserPermissions(permissions)
            form.reset({
                name: user.name || "",
                username: user.username,
                email: user.email || "",
                password: "", // Password is optional on edit
                role: user.role,
                canResetActivation: user.canResetActivation ?? false,
                isActive: user.isActive ?? true,
                areaId: user.areaId || "",
                neighborhoodId: user.neighborhoodId || "",
                permissions: permissions,
            })
            // Fetch neighborhoods immediately for edit
            if (user.areaId) {
                fetchNeighborhoods(user.areaId)
            }
        } else {
            setEditingId(null)
            setUserPermissions({})
            form.reset({
                name: "",
                username: "",
                email: "",
                password: "",
                role: "SUPERVISOR",
                canResetActivation: false,
                isActive: true,
                areaId: "",
                neighborhoodId: "",
                permissions: {},
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
            const bodyData: any = { ...values, permissions: userPermissions }
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
                fetchUsers()
                showAlert(
                    "Sucesso!",
                    editingId ? "Os dados do usuário foram atualizados." : "Novo usuário cadastrado com sucesso!",
                    "success"
                )
            } else {
                const errorData = await res.json().catch(() => ({}))
                showAlert("Erro", errorData.message || "Não foi possível salvar as alterações.", "error")
            }
        } catch (error) {
            showAlert("Erro", "Ocorreu um erro ao enviar o formulário.", "error")
        }
    }

    const handleToggleBlock = async (user: any) => {
        const action = user.isActive ? "bloquear" : "desbloquear"
        showAlert(
            `${action.charAt(0).toUpperCase() + action.slice(1)} Usuário`,
            `Tem certeza que deseja ${action} o usuário ${user.name || user.username}?`,
            user.isActive ? "warning" : "info",
            true,
            async () => {
                try {
                    const token = localStorage.getItem("token")
                    const res = await fetch(`${API_URL}/users/${user.id}`, {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ isActive: !user.isActive }),
                    })

                    if (res.ok) {
                        fetchUsers()
                        showAlert("Sucesso", `O usuário foi ${action === "bloquear" ? "bloqueado" : "desbloqueado"} com sucesso.`, "success")
                    } else {
                        showAlert("Erro", `Não foi possível ${action} o usuário.`, "error")
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
        const isMaster = user?.role === 'MASTER';



        // Implementation of performDelete
        const performDelete = async (id: string, force: boolean) => {
            try {
                const token = localStorage.getItem("token")
                const res = await fetch(`${API_URL}/users/${id}?force=${force}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                })

                if (res.ok) {
                    fetchUsers()
                    showAlert("Removido", force ? "Usuário e histórico excluídos permanentemente." : "Usuário removido com sucesso.", "success")
                } else {
                    const err = await res.json().catch(() => ({}));
                    showAlert("Erro", err.message || "Não foi possível remover o usuário.", "error")
                }
            } catch (error) {
                showAlert("Erro de Conexão", "Não foi possível conectar ao servidor.", "error")
            }
        }

        if (isMaster) {
            showAlert(
                "EXCLUSÃO MASTER (PERIGOSO)",
                "ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\nDeseja realizar uma EXCLUSÃO TOTAL deste usuário, apagando permanentemente:\n- Vendas e Bilhetes\n- Fechamentos de Caixa (Financeiro)\n- Histórico de Ações\n\nClique em 'Excluir TUDO' para confirmar ou 'Cancelar' para desistir.",
                "error", // Red alert
                true,
                () => performDelete(id, true),
                "Excluir TUDO (Destrutivo)",
                "Cancelar"
            )
        } else {
            // Standard User (Admin)
            showAlert(
                "Excluir Usuário",
                "Tem certeza que deseja excluir este usuário? Se ele tiver histórico financeiro, ele será apenas desativado.",
                "warning",
                true,
                () => performDelete(id, false),
                "Sim, Excluir",
                "Cancelar"
            )
        }
    }

    return (
        <>
            <div className="space-y-6">
                <StandardPageHeader
                    icon={<Shield className="w-8 h-8 text-emerald-500" />}
                    title="Usuários Administrativos"
                    description="Gerencie administradores, supervisores e gerentes."
                    onRefresh={fetchUsers}
                    refreshing={loading}
                >
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Botão de Emergência para Permissões */}
                        {user?.role === 'MASTER' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSyncPermissions}
                                className="h-9 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                                title="Restaurar permissões padrão de todos os usuários"
                            >
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Restaurar Permissões
                            </Button>
                        )}

                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar usuário..."
                                className="pl-9 bg-background border-border h-9 shadow-sm text-xs font-semibold"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setPage(1)
                                }}
                            />
                        </div>
                        <Button variant="outline" size="sm" className="h-9 border-border text-xs font-bold">
                            <Filter className="h-4 w-4 text-muted-foreground mr-2" />
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
                                    Novo Usuário
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[700px] bg-popover border-border max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-foreground">
                                        {editingId ? (
                                            <>
                                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                                    <SquarePen className="w-5 h-5 text-emerald-500" />
                                                </div>
                                                Editar Usuário
                                            </>
                                        ) : (
                                            <>
                                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                                    <UserPlus className="w-5 h-5 text-emerald-500" />
                                                </div>
                                                Adicionar Novo Usuário
                                            </>
                                        )}
                                    </DialogTitle>
                                    <DialogDescription className="text-muted-foreground">
                                        {editingId ? "Atualize os dados do usuário." : "Crie uma conta para um novo administrador ou gerente."}
                                    </DialogDescription>
                                </DialogHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                        <Tabs defaultValue="dados" className="w-full">
                                            <TabsList className="grid w-full grid-cols-2">
                                                <TabsTrigger value="dados">Dados Básicos</TabsTrigger>
                                                {user?.role === 'MASTER' && (
                                                    <TabsTrigger value="acessos">Acessos</TabsTrigger>
                                                )}
                                            </TabsList>
                                            <TabsContent value="dados" className="space-y-4 mt-4">
                                                <FormField
                                                    control={form.control}
                                                    name="name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-foreground">Nome Completo</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                                    <Input placeholder="Nome do usuário" className="pl-9 bg-muted/50 border-input" {...field} />
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
                                                                    <Input placeholder="usuario.admin" className="pl-9 bg-muted/50 border-input" {...field} />
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
                                                                    <Input placeholder="email@exemplo.com" className="pl-9 bg-muted/50 border-input" {...field} />
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="role"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-foreground">Nível de Acesso</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger className="pl-9 bg-muted/50 border-input">
                                                                        <Shield className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                                        <SelectValue placeholder="Selecione o nível" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="ADMIN">Administrador (ADMIN)</SelectItem>
                                                                    <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                                                                    <SelectItem value="GERENTE">Gerente</SelectItem>
                                                                    {user?.role === 'MASTER' && (
                                                                        <SelectItem value="MASTER" className="text-emerald-600 font-bold">
                                                                            Master (Global)
                                                                        </SelectItem>
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="areaId"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-foreground">Praça (Opcional)</FormLabel>
                                                            <Select onValueChange={(val) => {
                                                                field.onChange(val)
                                                                form.setValue("neighborhoodId", "") // Reset neighborhood on area change
                                                            }} value={field.value || ""}>
                                                                <FormControl>
                                                                    <SelectTrigger className="pl-9 bg-muted/50 border-input">
                                                                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                                        <SelectValue placeholder="Selecione a praça" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {areas.map((area) => (
                                                                        <SelectItem key={area.id} value={area.id}>
                                                                            {area.name} ({area.city})
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="neighborhoodId"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-foreground">Bairro (Opcional)</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value || ""} disabled={!selectedAreaId}>
                                                                <FormControl>
                                                                    <SelectTrigger className="pl-9 bg-muted/50 border-input">
                                                                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                                        <SelectValue placeholder="Selecione o bairro" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {neighborhoods.map((n) => (
                                                                        <SelectItem key={n.id} value={n.id}>
                                                                            {n.name}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="canResetActivation"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3 shadow-sm bg-muted/20">
                                                            <div className="space-y-0.5">
                                                                <FormLabel className="text-foreground text-xs font-bold flex items-center gap-1.5 uppercase">
                                                                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                                                                    Resetar Ativação
                                                                </FormLabel>
                                                                <p className="text-[10px] text-muted-foreground">O usuário poderá remover a ativação do app.</p>
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
                                            </TabsContent>
                                            {user?.role === 'MASTER' && (
                                                <TabsContent value="acessos" className="space-y-4 mt-4">
                                                    <div className="space-y-4">
                                                        <p className="text-sm text-muted-foreground">
                                                            Selecione as permissões que este usuário terá no sistema:
                                                        </p>
                                                        {Object.entries(PERMISSION_GROUPS).map(([groupName, permissions]) => (
                                                            <div key={groupName} className="space-y-3">
                                                                <h4 className="text-sm font-semibold text-foreground">{groupName}</h4>
                                                                <div className="space-y-2 pl-4">
                                                                    {permissions.map((permission) => (
                                                                        <div key={permission} className="flex items-center space-x-2">
                                                                            <Checkbox
                                                                                id={permission}
                                                                                checked={userPermissions[permission] || false}
                                                                                onCheckedChange={(checked) => {
                                                                                    setUserPermissions({
                                                                                        ...userPermissions,
                                                                                        [permission]: checked as boolean
                                                                                    })
                                                                                }}
                                                                            />
                                                                            <label
                                                                                htmlFor={permission}
                                                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                                            >
                                                                                {PERMISSION_LABELS[permission]}
                                                                            </label>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </TabsContent>
                                            )}
                                        </Tabs>
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
                                            <TableHead>Empresa</TableHead>
                                            <TableHead>Nível de Acesso</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(() => {
                                            const filteredUsers = users.filter(u =>
                                                u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                u.email?.toLowerCase().includes(searchTerm.toLowerCase())
                                            );

                                            const paginatedUsers = limit === "all" ? filteredUsers : filteredUsers.slice((page - 1) * limit, Number(page) * Number(limit));

                                            if (filteredUsers.length === 0) return (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                                        Nenhum usuário encontrado.
                                                    </TableCell>
                                                </TableRow>
                                            );

                                            return paginatedUsers.map((user) => {
                                                const isManuallyBlocked = user.isActive === false;

                                                return (
                                                    <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                                                        <TableCell className="font-medium">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ring-2 ${isManuallyBlocked ? 'bg-red-100 text-red-600 ring-red-500/20' : 'bg-emerald-100 text-emerald-600 ring-emerald-500/20'}`}>
                                                                    {user.username.substring(0, 2)}
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                                                                        <User className={`w-3.5 h-3.5 ${isManuallyBlocked ? 'text-red-500' : 'text-emerald-500'}`} />
                                                                        {user.name || user.username}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                                        <Mail className="w-3 h-3" />
                                                                        {user.email || "Sem email"}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="text-sm text-foreground">{user.company?.companyName || "-"}</span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border gap-1.5">
                                                                <Shield className="w-3.5 h-3.5" />
                                                                {user.role}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            {isManuallyBlocked ? (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 gap-1.5">
                                                                    <Ban className="w-3.5 h-3.5" />
                                                                    Bloqueado
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
                                                                    onClick={() => handleToggleBlock(user)}
                                                                    title={isManuallyBlocked ? "Desbloquear Usuário" : "Bloquear Usuário"}
                                                                >
                                                                    {isManuallyBlocked ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                                    onClick={() => handleOpenDialog(user)}
                                                                    title="Editar"
                                                                >
                                                                    <SquarePen className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    onClick={() => handleDelete(user.id)}
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
                                    totalPages={limit === "all" ? 1 : Math.ceil(users.filter(u =>
                                        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
                                    ).length / limit)}
                                    limit={limit}
                                    onPageChange={setPage}
                                    onLimitChange={(l) => {
                                        setLimit(l)
                                        setPage(1)
                                    }}
                                    totalItems={users.filter(u =>
                                        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
                                    ).length}
                                />
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    )
}
