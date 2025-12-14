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
import { Plus, Search, Filter, Loader2, Trash2, Pencil, Users, UserPlus, Save, User, Mail, Lock, AtSign, MapPin } from "lucide-react"
import { useAlert } from "@/context/alert-context"

const formSchema = z.object({
    name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres." }),
    username: z.string().min(3, { message: "Usuário deve ter pelo menos 3 caracteres." }),
    password: z.string().optional(),
    email: z.union([z.string().email({ message: "Email inválido." }), z.literal('')]),
    areaId: z.string().optional(),
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
    const { showAlert } = useAlert()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            username: "",
            password: "",
            email: "",
            areaId: undefined,
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
                setCambistas(data)
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
            })
        } else {
            setEditingId(null)
            form.reset({
                name: "",
                username: "",
                email: "",
                password: "",
                areaId: undefined,
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

    const handleDelete = async (id: string) => {
        showAlert(
            "Excluir Cambista",
            "Tem certeza que deseja excluir este cambista? Esta ação não pode ser desfeita.",
            "warning",
            true, // showCancel
            async () => {
                try {
                    const token = localStorage.getItem("token")
                    const res = await fetch(`${API_URL}/users/${id}`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                    })

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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <Users className="w-8 h-8 text-emerald-500" />
                        </div>
                        Cambistas
                    </h2>
                    <p className="text-muted-foreground mt-1 ml-14">Gerencie sua equipe de vendas e monitore o desempenho.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={() => handleOpenDialog()}
                            className="bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-900/20"
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
                                            <Pencil className="w-5 h-5 text-emerald-500" />
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

            <Card className="border-border shadow-sm bg-card">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Equipe de Vendas</CardTitle>
                            <CardDescription>Lista de todos os cambistas cadastrados no sistema.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Buscar cambista..." className="pl-9 bg-muted/50 border-border" />
                            </div>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4 text-slate-500" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-muted/50">
                                    <TableHead className="w-[300px]">Nome</TableHead>
                                    <TableHead>Praça</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cambistas.map((cambista) => (
                                    <TableRow key={cambista.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-xs uppercase">
                                                    {cambista.username.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-foreground">{cambista.name || cambista.username}</div>
                                                    <div className="text-xs text-muted-foreground">{cambista.email || "Sem email"}</div>
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
                                                <span className="text-muted-foreground text-xs italic">Sem praça</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Ativo
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{cambista.role}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                    onClick={() => handleOpenDialog(cambista)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                    <span className="sr-only">Editar</span>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDelete(cambista.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">Excluir</span>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
