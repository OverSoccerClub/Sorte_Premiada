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
import { Plus, Search, Loader2, Trash2, MapPin, Building2, Map, SquarePen, Settings2, Save, RefreshCw } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useAlert } from "@/context/alert-context"
import { Badge } from "@/components/ui/badge"
import { StandardPageHeader } from "@/components/standard-page-header"
import { StandardPagination } from "@/components/standard-pagination"
import { useActiveCompanyId } from "@/context/use-active-company"

const formSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    city: z.string().min(1, "Cidade é obrigatória"),
    state: z.string().min(1, "Estado é obrigatório").length(2, { message: "Estado deve ser a sigla (ex: SP)." }).toUpperCase(),
    seriesNumber: z.string().min(4, "Série é obrigatória (ex: 0001)"),
    warningThreshold: z.coerce.number().min(1).max(100).default(80),
    autoCycleSeries: z.boolean().default(true),
})

interface Area {
    id: string
    name: string
    city: string
    state: string
    seriesNumber?: string
    currentSeries?: string
    warningThreshold?: number
    autoCycleSeries?: boolean
    company?: {
        companyName: string
    }
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
    extractionTimes?: string[]
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
            city: "",
            state: "",
            seriesNumber: "",
            warningThreshold: 80,
            autoCycleSeries: true
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
            city: "",
            state: "",
            autoCycleSeries: true,
            warningThreshold: 80,
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
            warningThreshold: area.warningThreshold || 80,
            autoCycleSeries: area.autoCycleSeries ?? true
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

    const handleUpdateConfig = (gameId: string, field: string, value: string | string[]) => {
        setAreaConfigs(prev => ({
            ...prev,
            [gameId]: {
                ...(prev[gameId] || { gameId }),
                [field]: (value === "" || (Array.isArray(value) && value.length === 0)) ? undefined : value
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
                    seriesNumber: values.seriesNumber || null,
                    autoCycleSeries: values.autoCycleSeries,
                    warningThreshold: Number(values.warningThreshold),
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

    const handleCycleSeries = async (id: string, currentSeries: string) => {
        showAlert(
            "Girar Série Manualmente",
            `Deseja forçar o início de uma nova série para esta praça? A série atual (${currentSeries}) será encerrada e a ${(parseInt(currentSeries) + 1).toString().padStart(4, '0')} será iniciada.`,
            "warning",
            true,
            async () => {
                try {
                    const token = localStorage.getItem("token")
                    const res = await fetch(`${API_URL}/areas/${id}/cycle-series`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                    })
                    hideAlert()

                    if (res.ok) {
                        fetchAreas()
                        showAlert("Sucesso", "Nova série iniciada com sucesso.", "success")
                    } else {
                        showAlert("Erro", "Não foi possível ciclar a série.", "error")
                    }
                } catch (error) {
                    showAlert("Erro de Conexão", "Não foi possível conectar ao servidor.", "error")
                }
            },
            "Sim, Girar Série",
            "Cancelar"
        )
    }

    // Neighborhoods Logic
    const [isNeighborhoodsOpen, setIsNeighborhoodsOpen] = useState(false)
    const [currentNeighborhoods, setCurrentNeighborhoods] = useState<any[]>([])
    const [newNeighborhoodName, setNewNeighborhoodName] = useState("")

    const handleOpenNeighborhoods = async (area: Area) => {
        setSelectedArea(area)
        setIsNeighborhoodsOpen(true)
        fetchNeighborhoods(area.id)
    }

    const fetchNeighborhoods = async (areaId: string) => {
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/neighborhoods?areaId=${areaId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setCurrentNeighborhoods(data)
            }
        } catch (error) {
            console.error("Failed to fetch neighborhoods")
        }
    }

    const handleAddNeighborhood = async () => {
        if (!newNeighborhoodName.trim() || !selectedArea) return
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/neighborhoods`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newNeighborhoodName,
                    areaId: selectedArea.id
                })
            })

            if (res.ok) {
                setNewNeighborhoodName("")
                fetchNeighborhoods(selectedArea.id)
                showAlert("Sucesso", "Bairro adicionado.", "success")
            } else {
                const err = await res.json()
                showAlert("Erro", err.message || "Erro ao adicionar bairro.", "error")
            }
        } catch (e) {
            showAlert("Erro", "Erro de conexão.", "error")
        }
    }

    const handleDeleteNeighborhood = async (id: string) => {
        if (!selectedArea) return
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/neighborhoods/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                fetchNeighborhoods(selectedArea.id)
            }
        } catch (e) {
            showAlert("Erro", "Erro ao remover bairro.", "error")
        }
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
                                                        placeholder="Ex: 1, 2, 3..."
                                                        className="bg-muted/50 border-input font-mono"
                                                        value={field.value || ''}
                                                        onChange={(e) => {
                                                            const value = e.target.value.replace(/\D/g, '');
                                                            field.onChange(value);
                                                        }}
                                                        onBlur={(e) => {
                                                            const value = e.target.value.replace(/\D/g, '');
                                                            if (value) {
                                                                field.onChange(value.padStart(4, '0'));
                                                            }
                                                        }}
                                                    />
                                                </FormControl>
                                                <p className="text-xs text-muted-foreground">
                                                    Série única para identificar bilhetes desta área (ex: Centro = 1, Ceasa = 2)
                                                </p>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="warningThreshold"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-foreground">Alerta de Saturação (%)</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            max={100}
                                                            placeholder="Ex: 80"
                                                            className="bg-muted/50 border-input"
                                                            value={field.value}
                                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                                        />
                                                        <span className="absolute right-3 top-2 text-sm text-muted-foreground">%</span>
                                                    </div>
                                                </FormControl>
                                                <p className="text-xs text-muted-foreground">
                                                    Porcentagem de vendas para notificar Master/Admin.
                                                </p>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="autoCycleSeries"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/20">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-sm font-medium text-foreground">Ciclar Série Automaticamente</FormLabel>
                                                    <p className="text-xs text-muted-foreground">
                                                        Se ativo, inicia nova série ao atingir limite. Se inativo, para as vendas.
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
                <DialogContent className="sm:max-w-[900px] bg-popover border-border p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="flex items-center gap-2 text-foreground">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <Settings2 className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div className="flex flex-col">
                                <span>Regras de Negócio</span>
                                <span className="text-sm font-normal text-muted-foreground">{selectedArea?.name} ({selectedArea?.city})</span>
                            </div>
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground pt-1">
                            Configure os overrides de comissão e prêmio. Campos vazios usarão o padrão global.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {games.map((game) => (
                                <div key={game.id} className="rounded-lg border border-border bg-card shadow-sm hover:border-emerald-500/30 transition-colors group">
                                    <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/20">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                            <span className="font-semibold text-sm">{game.name}</span>
                                        </div>
                                        <Badge variant="secondary" className="text-[10px] h-5 bg-background border-border/50 text-muted-foreground">
                                            Global: {game.commissionRate}% | {game.prizeMultiplier}x
                                        </Badge>
                                    </div>

                                    <div className="p-3 grid grid-cols-3 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase font-bold text-muted-foreground">Comissão</label>
                                            <div className="relative">
                                                <Input
                                                    placeholder={`${game.commissionRate}`}
                                                    value={areaConfigs[game.id]?.commissionRate ?? ""}
                                                    onChange={(e) => handleUpdateConfig(game.id, "commissionRate", e.target.value)}
                                                    className="h-8 text-sm pr-6 focus-visible:ring-emerald-500/30"
                                                />
                                                <span className="absolute right-2 top-2 text-[10px] text-muted-foreground font-medium">%</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase font-bold text-muted-foreground">Prêmio</label>
                                            <div className="relative">
                                                <Input
                                                    placeholder={`${game.prizeMultiplier}`}
                                                    value={areaConfigs[game.id]?.prizeMultiplier ?? ""}
                                                    onChange={(e) => handleUpdateConfig(game.id, "prizeMultiplier", e.target.value)}
                                                    className="h-8 text-sm pr-5 focus-visible:ring-emerald-500/30"
                                                />
                                                <span className="absolute right-2 top-2 text-[10px] text-muted-foreground font-medium">x</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase font-bold text-muted-foreground">Risco Máx</label>
                                            <div className="relative">
                                                <span className="absolute left-2 top-2 text-[10px] text-muted-foreground font-medium">R$</span>
                                                <Input
                                                    placeholder={`${game.maxLiability}`}
                                                    value={areaConfigs[game.id]?.maxLiability ?? ""}
                                                    onChange={(e) => handleUpdateConfig(game.id, "maxLiability", e.target.value)}
                                                    className="h-8 text-sm pl-6 focus-visible:ring-emerald-500/30"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-3 pb-3 border-t border-border/30 pt-2">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                                Horários de Sorteio <span className="text-[9px] text-muted-foreground font-normal normal-case">(Ex: 12:00, 19:00)</span>
                                            </label>
                                            <Input
                                                placeholder="Use global ou insira: 10:00, 14:00..."
                                                value={Array.isArray(areaConfigs[game.id]?.extractionTimes) ? (areaConfigs[game.id]?.extractionTimes as string[]).join(", ") : ""}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    // Convert string to array by splitting comma
                                                    const times = val.split(',').map(t => t.trim()).filter(t => t);
                                                    // Pass as string array or undefined if empty to revert to global? 
                                                    // Actually UI needs to handle string display, logic handles array.
                                                    // But handleUpdateConfig expects string usually? No, let's cast.
                                                    handleUpdateConfig(game.id, "extractionTimes", times as any);
                                                }}
                                                className="h-8 text-sm focus-visible:ring-emerald-500/30"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter className="p-6 pt-0 bg-transparent">
                        <Button variant="ghost" onClick={() => setIsConfigOpen(false)} className="text-muted-foreground hover:text-foreground">
                            Cancelar
                        </Button>
                        <Button onClick={saveAreaConfigs} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[150px] shadow-lg shadow-emerald-500/20">
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Regras
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Bairros */}
            <Dialog open={isNeighborhoodsOpen} onOpenChange={setIsNeighborhoodsOpen}>
                <DialogContent className="sm:max-w-[500px] bg-popover border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-foreground">
                            <Map className="w-5 h-5 text-indigo-500" />
                            Gestão de Bairros
                        </DialogTitle>
                        <DialogDescription>
                            Gerencie os bairros da praça <strong>{selectedArea?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Nome do Bairro"
                                value={newNeighborhoodName}
                                onChange={(e) => setNewNeighborhoodName(e.target.value)}
                                className="bg-muted/50 text-sm"
                            />
                            <Button onClick={handleAddNeighborhood} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="border border-border rounded-md max-h-[300px] overflow-y-auto">
                            {currentNeighborhoods.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">Nenhum bairro cadastrado.</div>
                            ) : (
                                <Table>
                                    <TableBody>
                                        {currentNeighborhoods.map((n: any) => (
                                            <TableRow key={n.id}>
                                                <TableCell className="py-2 font-medium text-sm">{n.name}</TableCell>
                                                <TableCell className="py-2 text-right">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700" onClick={() => handleDeleteNeighborhood(n.id)}>
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </div>
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
                                        <TableHead>Série Atual</TableHead>
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
                                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">
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
                                                    <Badge variant="outline" className="font-mono bg-muted/50">
                                                        {area.currentSeries || area.seriesNumber || "N/A"}
                                                    </Badge>
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
                                                            className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                            title="Girar Série Manualmente"
                                                            onClick={() => handleCycleSeries(area.id, area.currentSeries || "0000")}
                                                        >
                                                            <RefreshCw className="h-4 w-4" />
                                                            <span className="sr-only">Girar Série</span>
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 px-2 text-indigo-600 border-indigo-500/30 hover:bg-indigo-50"
                                                            onClick={() => handleOpenNeighborhoods(area)}
                                                        >
                                                            <Map className="w-4 h-4 mr-1.5" />
                                                            Bairros
                                                        </Button>
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
        </div >
    )
}
