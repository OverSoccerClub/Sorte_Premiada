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
import { Plus, Search, Loader2, Trash2, MapPin, Building2, Map, SquarePen, Settings2, Save } from "lucide-react"
import { useAlert } from "@/context/alert-context"
import { Badge } from "@/components/ui/badge"
import { StandardPageHeader } from "@/components/standard-page-header"
import { StandardPagination } from "@/components/standard-pagination"
import { useActiveCompanyId } from "@/context/use-active-company"

const formSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    city: z.string().min(1, "Cidade é obrigatória"),
    state: z.string().min(1, "Estado é obrigatório").length(2, { message: "Estado deve ser a sigla (ex: SP)." }).toUpperCase(),
    seriesNumber: z.string().optional(),
})

interface Area {
    id: string
    name: string
    city: string
    state: string
    seriesNumber?: string
    _count?: {
        users: number
    }
}

interface Game {
    id: string
    name: string
    commissionRate: string | number
    prizeMultiplier: string | number
    maxLiability: string | number
}

interface AreaConfig {
    gameId: string
    commissionRate?: string | number
    prizeMultiplier?: string | number
    maxLiability?: string | number
}

export default function AreasPage() {
    const activeCompanyId = useActiveCompanyId()
    const [areas, setAreas] = useState<Area[]>([])
    const [games, setGames] = useState<Game[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isConfigOpen, setIsConfigOpen] = useState(false)
    const [selectedArea, setSelectedArea] = useState<Area | null>(null)
    const [areaConfigs, setAreaConfigs] = useState<Record<string, AreaConfig>>({})
    const [searchTerm, setSearchTerm] = useState("")
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState<number | "all">(10)
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
            const queryParams = new URLSearchParams()
            if (activeCompanyId) {
                queryParams.append('targetCompanyId', activeCompanyId)
            }
            const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ''

            const [areasRes, gamesRes] = await Promise.all([
                fetch(`${API_URL}/areas${queryString}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/games${queryString}`, { headers: { Authorization: `Bearer ${token}` } })
            ])

            if (areasRes.ok && gamesRes.ok) {
                const areasData = await areasRes.json()
                const gamesData = await gamesRes.json()
                setAreas(areasData)
                setGames(gamesData)
            } else {
                showAlert("Erro", "Não foi possível carregar os dados.", "error")
            }
        } catch (error) {
            showAlert("Erro de Conexão", "Verifique sua conexão e tente novamente.", "error")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAreas()
    }, [activeCompanyId])

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
            seriesNumber: area.seriesNumber?.toString() || "",
        })
        setIsDialogOpen(true)
    }

    const handleOpenConfig = async (area: Area) => {
        setSelectedArea(area)
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/areas-config/area/${area.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                const configMap: Record<string, AreaConfig> = {}
                data.forEach((c: any) => {
                    configMap[c.gameId] = {
                        gameId: c.gameId,
                        commissionRate: c.commissionRate,
                        prizeMultiplier: c.prizeMultiplier,
                        maxLiability: c.maxLiability
                    }
                })
                setAreaConfigs(configMap)
                setIsConfigOpen(true)
            }
        } catch (error) {
            showAlert("Erro", "Erro ao carregar configurações da praça.", "error")
        }
    }

    const handleUpdateConfig = (gameId: string, field: string, value: string) => {
        setAreaConfigs(prev => ({
            ...prev,
            [gameId]: {
                ...(prev[gameId] || { gameId }),
                [field]: value === "" ? undefined : value
            }
        }))
    }

    const saveAreaConfigs = async () => {
        if (!selectedArea) return
        try {
            const token = localStorage.getItem("token")
            const promises = Object.values(areaConfigs).map(config =>
                fetch(`${API_URL}/areas-config`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        areaId: selectedArea.id,
                        ...config
                    })
                })
            )

            await Promise.all(promises)
            setIsConfigOpen(false)
            showAlert("Sucesso!", "Configurações da praça salvas com sucesso.", "success")
        } catch (error) {
            showAlert("Erro", "Erro ao salvar configurações.", "error")
        }
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const token = localStorage.getItem("token")
            const url = editingId ? `${API_URL}/areas/${editingId}` : `${API_URL}/areas`
            const method = editingId ? "PATCH" : "POST"

            const seriesNum = values.seriesNumber ? parseInt(values.seriesNumber) : null

            const res = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: values.name,
                    city: values.city,
                    state: values.state,
                    seriesNumber: seriesNum,
                    companyId: activeCompanyId
                }),
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
            <StandardPageHeader
                icon={<MapPin className="w-8 h-8 text-emerald-500" />}
                title="Gestão de Praças"
                description="Gerencie as áreas de atuação e suas regras específicas."
                onRefresh={fetchAreas}
                refreshing={loading}
            >
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar praça..."
                            className="pl-9 bg-background border-border h-9 shadow-sm text-xs font-semibold"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setPage(1)
                            }}
                        />
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={handleOpenDialog}
                                className="bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-900/20 h-9"
                                size="sm"
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
                                    <FormField
                                        control={form.control}
                                        name="seriesNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-foreground">Número da Série (Opcional)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="text"
                                                        maxLength={4}
                                                        placeholder="Ex: 0001, 0002, 0003..."
                                                        className="bg-muted/50 border-input font-mono"
                                                        value={field.value || ''}
                                                        onChange={(e) => {
                                                            const value = e.target.value.replace(/\D/g, ''); // Apenas números
                                                            if (value) {
                                                                field.onChange(value.padStart(4, '0')); // Formata com 4 dígitos
                                                            } else {
                                                                field.onChange('');
                                                            }
                                                        }}
                                                    />
                                                </FormControl>
                                                <p className="text-xs text-muted-foreground">
                                                    Série única para identificar bilhetes desta área (ex: Centro = 0001, Ceasa = 0002)
                                                </p>
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
            </StandardPageHeader>

            {/* Modal de Configuração de Regras por Área */}
            <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                <DialogContent className="sm:max-w-[700px] bg-popover border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-foreground">
                            <Settings2 className="w-5 h-5 text-emerald-500" />
                            Regras de Negócio: {selectedArea?.name} ({selectedArea?.city})
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Configure overrides de comissão e prêmio para esta praça específica.
                            Deixe em branco para usar o padrão global do jogo.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4">
                        {games.map((game) => (
                            <Card key={game.id} className="border-border/60 bg-muted/10">
                                <CardHeader className="py-3 px-4 flex-row justify-between items-center space-y-0 bg-muted/20">
                                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                        {game.name}
                                    </CardTitle>
                                    <Badge variant="outline" className="text-[10px] uppercase font-normal text-muted-foreground">
                                        Global: {game.commissionRate}% | {game.prizeMultiplier}x
                                    </Badge>
                                </CardHeader>
                                <CardContent className="p-4 grid grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground">Comissão (%)</label>
                                        <Input
                                            placeholder={`Padrão: ${game.commissionRate}%`}
                                            value={areaConfigs[game.id]?.commissionRate ?? ""}
                                            onChange={(e) => handleUpdateConfig(game.id, "commissionRate", e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground">Mult. Prêmio (x)</label>
                                        <Input
                                            placeholder={`Padrão: ${game.prizeMultiplier}x`}
                                            value={areaConfigs[game.id]?.prizeMultiplier ?? ""}
                                            onChange={(e) => handleUpdateConfig(game.id, "prizeMultiplier", e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground">Risco Máx (R$)</label>
                                        <Input
                                            placeholder={`Padrão: R$ ${game.maxLiability}`}
                                            value={areaConfigs[game.id]?.maxLiability ?? ""}
                                            onChange={(e) => handleUpdateConfig(game.id, "maxLiability", e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={() => setIsConfigOpen(false)} className="border-border">
                            Cancelar
                        </Button>
                        <Button onClick={saveAreaConfigs} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Regras da Praça
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                                        <TableHead>Localização</TableHead>
                                        <TableHead>Empresa</TableHead>
                                        <TableHead>Área</TableHead>
                                        <TableHead>Cambistas</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(() => {
                                        const filteredAreas = areas.filter(a =>
                                            a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            a.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            a.state.toLowerCase().includes(searchTerm.toLowerCase())
                                        );

                                        const totalItems = filteredAreas.length;
                                        const paginatedAreas = limit === "all" ? filteredAreas : filteredAreas.slice((page - 1) * limit, Number(page) * Number(limit));

                                        if (filteredAreas.length === 0) return (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                                                    Nenhuma praça encontrada.
                                                </TableCell>
                                            </TableRow>
                                        );

                                        return paginatedAreas.map((area) => (
                                            <TableRow key={area.id} className="hover:bg-muted/50 transition-colors">
                                                <TableCell className="font-medium text-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="w-4 h-4 text-emerald-500" />
                                                        {area.city} <span className="text-muted-foreground">- {area.state}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    <span className="text-sm text-foreground">{area.company?.companyName || "-"}</span>
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
                                                            className="h-8 px-2 text-emerald-600 border-emerald-500/30 hover:bg-emerald-50"
                                                            onClick={() => handleOpenConfig(area)}
                                                        >
                                                            <Settings2 className="w-4 h-4 mr-1.5" />
                                                            Regras
                                                        </Button>
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
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleDelete(area.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            <span className="sr-only">Excluir</span>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ));
                                    })()}
                                </TableBody>
                            </Table>
                            <StandardPagination
                                currentPage={page}
                                totalPages={limit === "all" ? 1 : Math.ceil(areas.filter(a =>
                                    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    a.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    a.state.toLowerCase().includes(searchTerm.toLowerCase())
                                ).length / limit)}
                                limit={limit}
                                onPageChange={setPage}
                                onLimitChange={(l) => {
                                    setLimit(l)
                                    setPage(1)
                                }}
                                totalItems={areas.filter(a =>
                                    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    a.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    a.state.toLowerCase().includes(searchTerm.toLowerCase())
                                ).length}
                            />
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

