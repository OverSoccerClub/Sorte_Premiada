"use client"

import { API_URL } from "@/lib/api"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Filter, Loader2, Trash2, Megaphone, SquarePen, Save, Clock, Info, AlertTriangle, AlertCircle, CheckCircle2, Eye, EyeOff, Users, User } from "lucide-react"
import { useAlert } from "@/context/alert-context"
import { Badge } from "@/components/ui/badge"
import { StandardPageHeader } from "@/components/standard-page-header"
import { useActiveCompanyId } from "@/context/use-active-company"

const formSchema = z.object({
    title: z.string().min(3, { message: "Título deve ter pelo menos 3 caracteres." }),
    content: z.string().min(5, { message: "Conteúdo deve ter pelo menos 5 caracteres." }),
    type: z.string().default("INFO"),
    isActive: z.boolean().default(true),
    expiresAt: z.string().optional().nullable(),
    targetType: z.string().default("GLOBAL"), // GLOBAL or USER
    targetUserId: z.string().optional().nullable(),
    sendPush: z.boolean().default(false),
})

export default function AnnouncementsPage() {
    const activeCompanyId = useActiveCompanyId()
    const [announcements, setAnnouncements] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const { showAlert, hideAlert } = useAlert()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            content: "",
            type: "INFO",
            isActive: true,
            expiresAt: "",
            targetType: "GLOBAL",
            targetUserId: "",
            sendPush: false,
        },
    })

    const targetType = form.watch("targetType")

    const fetchAnnouncements = async () => {
        try {
            const token = localStorage.getItem("token")
            const queryParams = new URLSearchParams()
            if (activeCompanyId) queryParams.append('targetCompanyId', activeCompanyId)

            const res = await fetch(`${API_URL}/announcements?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
                const data = await res.json()
                setAnnouncements(data)
            } else {
                showAlert("Erro", "Não foi possível carregar os avisos.", "error")
            }
        } catch (error) {
            showAlert("Erro de Conexão", "Verifique sua conexão e tente novamente.", "error")
        } finally {
            setLoading(false)
        }
    }

    const fetchUsers = async () => {
        console.log("Fetching users for announcements...");
        try {
            const token = localStorage.getItem("token")
            const queryParams = new URLSearchParams({ role: 'CAMBISTA' })
            if (activeCompanyId) queryParams.append('targetCompanyId', activeCompanyId)

            const res = await fetch(`${API_URL}/users?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
                const data = await res.json()
                setUsers(data)
            }
        } catch (error) {
            console.error("Failed to fetch users", error)
        }
    }

    useEffect(() => {
        fetchAnnouncements()
        fetchUsers()
    }, [activeCompanyId])

    const handleOpenDialog = (announcement?: any) => {
        if (announcement) {
            setEditingId(announcement.id)
            form.reset({
                title: announcement.title,
                content: announcement.content,
                type: announcement.type,
                isActive: announcement.isActive,
                expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt).toISOString().split('T')[0] : "",
                targetType: announcement.targetUserId ? "USER" : "GLOBAL",
                targetUserId: announcement.targetUserId || "",
            })
        } else {
            setEditingId(null)
            form.reset({
                title: "",
                content: "",
                type: "INFO",
                isActive: true,
                expiresAt: "",
                targetType: "GLOBAL",
                targetUserId: "",
                sendPush: false,
            })
        }
        setIsDialogOpen(true)
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const token = localStorage.getItem("token")
            const url = editingId
                ? `${API_URL}/announcements/${editingId}`
                : `${API_URL}/announcements`

            const method = editingId ? "PATCH" : "POST"

            const bodyData = {
                ...values,
                expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : null,
                targetUserId: values.targetType === "USER" ? values.targetUserId : null,
            }

            // Remove targetType from payload if backend doesn't expect it (it's UI only state generally, but let's be clean)
            // @ts-ignore
            delete bodyData.targetType

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
                fetchAnnouncements()
                showAlert(
                    "Sucesso!",
                    editingId ? "O aviso foi atualizado." : "Novo aviso publicado com sucesso!",
                    "success"
                )
            } else {
                showAlert("Erro", "Não foi possível salvar o aviso.", "error")
            }
        } catch (error) {
            showAlert("Erro", "Ocorreu um erro ao enviar o formulário.", "error")
        }
    }

    const handleDelete = async (id: string) => {
        showAlert(
            "Excluir Aviso",
            "Tem certeza que deseja excluir este aviso? Esta ação não pode ser desfeita.",
            "warning",
            true,
            async () => {
                try {
                    const token = localStorage.getItem("token")
                    const res = await fetch(`${API_URL}/announcements/${id}`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                    })
                    hideAlert()

                    if (res.ok) {
                        fetchAnnouncements()
                        showAlert("Removido", "O aviso foi removido com sucesso.", "success")
                    } else {
                        showAlert("Erro", "Não foi possível remover o aviso.", "error")
                    }
                } catch (error) {
                    showAlert("Erro de Conexão", "Não foi possível conectar ao servidor.", "error")
                }
            },
            "Sim, Excluir",
            "Cancelar"
        )
    }

    const getStatusIcon = (type: string) => {
        switch (type) {
            case "INFO": return <Info className="w-4 h-4 text-blue-500" />
            case "WARNING": return <AlertTriangle className="w-4 h-4 text-amber-500" />
            case "ALERT": return <AlertCircle className="w-4 h-4 text-red-500" />
            case "SUCCESS": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            default: return <Info className="w-4 h-4 text-slate-500" />
        }
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "INFO": return "Informativo"
            case "WARNING": return "Atenção"
            case "ALERT": return "Urgente"
            case "SUCCESS": return "Sucesso"
            default: return type
        }
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case "INFO": return "bg-blue-100 text-blue-800 border-blue-200"
            case "WARNING": return "bg-amber-100 text-amber-800 border-amber-200"
            case "ALERT": return "bg-red-100 text-red-800 border-red-200"
            case "SUCCESS": return "bg-emerald-100 text-emerald-800 border-emerald-200"
            default: return "bg-slate-100 text-slate-800 border-slate-200"
        }
    }

    return (
        <div className="space-y-6">
            <StandardPageHeader
                icon={<Megaphone className="w-8 h-8 text-emerald-500" />}
                title="Gestão de Avisos"
                description="Envie comunicados globais ou para cambistas específicos."
            >
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={() => handleOpenDialog()}
                            className="bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-900/20"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Aviso
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] bg-popover border-border">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-foreground">
                                {editingId ? "Editar Aviso" : "Criar Novo Aviso"}
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                                Configure a mensagem e o público alvo.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Título</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Título do aviso" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tipo</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione o tipo" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="INFO">Informativo</SelectItem>
                                                        <SelectItem value="WARNING">Aviso / Atenção</SelectItem>
                                                        <SelectItem value="ALERT">Urgente / Perigo</SelectItem>
                                                        <SelectItem value="SUCCESS">Sucesso / Promoção</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="expiresAt"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Expira em</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} value={field.value || ""} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-xl border border-border/50">
                                    <FormField
                                        control={form.control}
                                        name="targetType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Público Alvo</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione o destino" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="GLOBAL">
                                                            <div className="flex items-center gap-2">
                                                                <Users className="w-4 h-4 text-emerald-500" />
                                                                <span>Todos (Global)</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="USER">
                                                            <div className="flex items-center gap-2">
                                                                <User className="w-4 h-4 text-blue-500" />
                                                                <span>Cambista Específico</span>
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />

                                    {targetType === "USER" && (
                                        <FormField
                                            control={form.control}
                                            name="targetUserId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Selecionar Cambista</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Escolha um cambista" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="max-h-[200px]">
                                                            {users.map((user) => (
                                                                <SelectItem key={user.id} value={user.id}>
                                                                    {user.name || user.username}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>

                                <FormField
                                    control={form.control}
                                    name="content"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Conteúdo</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Digite a mensagem aqui..."
                                                    className="min-h-[120px] resize-none"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="isActive"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                            <div className="space-y-0.5">
                                                <FormLabel>Aviso Ativo</FormLabel>
                                                <p className="text-xs text-muted-foreground">
                                                    Define se este aviso está visível agora.
                                                </p>
                                            </div>
                                            <FormControl>
                                                <Button
                                                    type="button"
                                                    variant={field.value ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => field.onChange(!field.value)}
                                                    className={field.value ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                                                >
                                                    {field.value ? "Ativo" : "Inativo"}
                                                </Button>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="sendPush"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-muted/20">
                                            <div className="space-y-0.5">
                                                <FormLabel>Enviar Notificação Push</FormLabel>
                                                <p className="text-xs text-muted-foreground">
                                                    Se ativado, envia um alerta para o celular.
                                                    <span className="block text-amber-500 font-medium mt-1">
                                                        *Requer configuração Firebase (Google)
                                                    </span>
                                                </p>
                                            </div>
                                            <FormControl>
                                                <Button
                                                    type="button"
                                                    variant={field.value ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => field.onChange(!field.value)}
                                                    className={field.value ? "bg-blue-600 hover:bg-blue-700" : ""}
                                                >
                                                    {field.value ? "Sim" : "Não"}
                                                </Button>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={form.formState.isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                                        {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        {editingId ? "Salvar Alterações" : "Publicar Aviso"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </StandardPageHeader>

            <Card className="border-border shadow-sm bg-card overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Megaphone className="w-5 h-5 text-emerald-500" />
                                Histórico de Avisos
                            </CardTitle>
                            <CardDescription>Gerencie as mensagens exibidas para sua equipe.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Buscar avisos..." className="pl-9 bg-background border-border h-9" />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-muted/50 border-b border-border/60 bg-muted/20">
                                    <TableHead>Publicação</TableHead>
                                    <TableHead>Destino</TableHead>
                                    <TableHead>Título / Conteúdo</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Expirado</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {announcements.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground italic">
                                            Nenhum aviso cadastrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    announcements.map((item) => {
                                        const isExpired = item.expiresAt && new Date(item.expiresAt) < new Date();
                                        const targetUser = users.find(u => u.id === item.targetUserId);

                                        return (
                                            <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                                                <TableCell className="text-xs font-mono text-muted-foreground">
                                                    <div className="flex flex-col">
                                                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                                        <span>{new Date(item.createdAt).toLocaleTimeString()}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {item.targetUserId ? (
                                                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-200">
                                                            <User className="w-3 h-3 mr-1" />
                                                            {targetUser ? (targetUser.name || targetUser.username) : "Usuário Específico"}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                                                            <Users className="w-3 h-3 mr-1" />
                                                            Global
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="max-w-[300px]">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-semibold text-foreground">{item.title}</span>
                                                        <span className="text-xs text-muted-foreground line-clamp-1">{item.content}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`flex w-fit items-center gap-1.5 ${getTypeColor(item.type)}`}>
                                                        {getStatusIcon(item.type)}
                                                        {getTypeLabel(item.type)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {item.expiresAt ? (
                                                        <div className={`flex items-center gap-1.5 text-xs ${isExpired ? "text-red-500 font-medium" : "text-slate-500"}`}>
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {new Date(item.expiresAt).toLocaleDateString()}
                                                            {isExpired && " (Expirado)"}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">Nunca</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {item.isActive ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 gap-1.5">
                                                            <Eye className="w-3 h-3" />
                                                            Visível
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200 gap-1.5">
                                                            <EyeOff className="w-3 h-3" />
                                                            Oculto
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                            onClick={() => handleOpenDialog(item)}
                                                        >
                                                            <SquarePen className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleDelete(item.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
