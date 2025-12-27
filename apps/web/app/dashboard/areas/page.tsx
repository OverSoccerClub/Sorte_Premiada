"use client"

import { API_URL } from "@/lib/api"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Plus, Search, Loader2, Trash2, MapPin, Building2, Map, SquarePen } from "lucide-react"
import { useAlert } from "@/context/alert-context"

const formSchema = z.object({
    name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres." }),
    city: z.string().min(2, { message: "Cidade deve ter pelo menos 2 caracteres." }),
    state: z.string().length(2, { message: "Estado deve ser a sigla (ex: SP)." }).toUpperCase(),
})

interface Area {
    id: string
    name: string
    city: string
    state: string
    _count?: {
        users: number
    }
}

export default function AreasPage() {
    const [areas, setAreas] = useState<Area[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const { showAlert, hideAlert } = useAlert()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            city: "",
            state: "",
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
            } else {
                showAlert("Erro", "Não foi possível carregar a lista de praças.", "error")
            }
        } catch (error) {
            showAlert("Erro de Conexão", "Verifique sua conexão e tente novamente.", "error")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAreas()
    }, [])

    const [editingId, setEditingId] = useState<string | null>(null)

    const handleOpenDialog = () => {
        setEditingId(null)
        form.reset({
            name: "",
            city: "",
            state: "",
        })
        setIsDialogOpen(true)
    }

    const handleEdit = (area: Area) => {
        setEditingId(area.id)
        form.reset({
            name: area.name,
            city: area.city,
            state: area.state,
        })
        setIsDialogOpen(true)
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const token = localStorage.getItem("token")
            const url = editingId ? `${API_URL}/areas/${editingId}` : `${API_URL}/areas`
            const method = editingId ? "PATCH" : "POST"

            const res = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(values),
            })

            if (res.ok) {
                setIsDialogOpen(false)
                fetchAreas()
                showAlert("Sucesso!", editingId ? "Praça atualizada com sucesso!" : "Nova praça cadastrada com sucesso!", "success")
            } else {
                showAlert("Erro", "Não foi possível salvar a praça.", "error")
            }
        } catch (error) {
            showAlert("Erro", "Ocorreu um erro ao enviar o formulário.", "error")
        }
    }

    const handleDelete = async (id: string) => {
        showAlert(
            "Excluir Praça",
            "Tem certeza que deseja excluir esta praça? Isso pode afetar os cambistas vinculados.",
            "warning",
            true,
            async () => {
                try {
                    const token = localStorage.getItem("token")
                    const res = await fetch(`${API_URL}/areas/${id}`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                    })
                    hideAlert()

                    if (res.ok) {
                        fetchAreas()
                        showAlert("Removido", "A praça foi removida com sucesso.", "success")
                    } else {
                        showAlert("Erro", "Não foi possível remover a praça.", "error")
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
                            <MapPin className="w-8 h-8 text-emerald-500" />
                        </div>
                        Gestão de Praças
                    </h2>
                    <p className="text-muted-foreground mt-1 ml-14">Gerencie as áreas de atuação da sua equipe.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={handleOpenDialog}
                            className="bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-900/20"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Nova Praça
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-popover border-border">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-foreground">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <MapPin className="w-5 h-5 text-emerald-500" />
                                </div>
                                {editingId ? "Editar Praça" : "Adicionar Nova Praça"}
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                                {editingId ? "Atualize os dados da praça." : "Cadastre uma nova área de atuação (Cidade/Bairro)."}
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-foreground">Cidade</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input placeholder="Ex: São Paulo" className="pl-9 bg-muted/50 border-input" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="state"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-foreground">Estado (UF)</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Map className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input placeholder="Ex: SP" maxLength={2} className="pl-9 bg-muted/50 border-input" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground">Nome da Área</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input placeholder="Ex: Centro, Zona Norte..." className="pl-9 bg-muted/50 border-input" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-border text-foreground hover:bg-muted">
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={form.formState.isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                        {form.formState.isSubmitting ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            editingId ? <SquarePen className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />
                                        )}
                                        {editingId ? "Salvar Alterações" : "Criar Praça"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-border shadow-sm bg-card overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-emerald-500" />
                                Praças Cadastradas
                            </CardTitle>
                            <CardDescription>Gerencie as cidades e áreas onde seus cambistas atuam.</CardDescription>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Buscar praça..." className="pl-9 bg-background border-border h-9" />
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
                                    <TableHead>Localização</TableHead>
                                    <TableHead>Área</TableHead>
                                    <TableHead>Cambistas</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {areas.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                            Nenhuma praça cadastrada.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    areas.map((area) => (
                                        <TableRow key={area.id} className="hover:bg-muted/50 transition-colors">
                                            <TableCell className="font-medium text-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-emerald-500" />
                                                    {area.city} <span className="text-muted-foreground">- {area.state}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-slate-400" />
                                                    {area.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                                    {area._count?.users || 0} Vinculados
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                        onClick={() => handleEdit(area)}
                                                    >
                                                        <SquarePen className="h-4 w-4" />
                                                        <span className="sr-only">Editar</span>
                                                    </Button>
                                                    <Button
                                                        data-slot="button"
                                                        className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs dark:bg-input/30 dark:border-input dark:hover:bg-input/50 rounded-md gap-1.5 has-[>svg]:px-2.5 h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDelete(area.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="sr-only">Excluir</span>
                                                    </Button>
                                                </div>
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
