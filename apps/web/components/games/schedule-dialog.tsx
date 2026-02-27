import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Clock, Trash2, Save, MapPin } from "lucide-react"
import { useAlert } from "@/context/alert-context"
import { API_URL } from "@/lib/api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface ScheduleDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    game: any
    onSuccess: () => void
}

interface AreaConfigRow {
    areaId: string
    areaName: string
    currentSeries: string
    extractionTimes: string[] // Array of "HH:mm"
    hasCustomConfig: boolean
}

export function ScheduleDialog({ open, onOpenChange, game, onSuccess }: ScheduleDialogProps) {
    const { showAlert } = useAlert()

    // Global State
    const [globalTimes, setGlobalTimes] = useState<{ time: string, series: number }[]>([])
    const [newGlobalTime, setNewGlobalTime] = useState("")
    const [newGlobalSeries, setNewGlobalSeries] = useState("")

    // Per-Area State
    const [areaRows, setAreaRows] = useState<AreaConfigRow[]>([])
    const [isLoadingAreas, setIsLoadingAreas] = useState(false)
    const [activeTab, setActiveTab] = useState("global")

    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (open && game) {
            // Setup Global
            const existingSeriesMap = new Map()
            if (game.extractionSeries) {
                game.extractionSeries.filter((s: any) => !s.areaId).forEach((s: any) => existingSeriesMap.set(s.time, s.lastSeries))
            }

            const times = (game.extractionTimes || []).map((t: string) => ({
                time: t,
                series: existingSeriesMap.get(t) || 0
            }))
            setGlobalTimes(times)

            // Fetch Areas & Configs
            fetchAreaConfiguration()
        }
    }, [open, game])

    const fetchAreaConfiguration = async () => {
        setIsLoadingAreas(true)
        try {
            const token = localStorage.getItem("token")

            // 1. Fetch all Areas
            const areasRes = await fetch(`${API_URL}/areas`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (!areasRes.ok) throw new Error("Falha ao buscar praças")
            const areas = await areasRes.json()

            // 2. Fetch existing Area Configs for this Game
            const configsRes = await fetch(`${API_URL}/areas-config/game/${game.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (!configsRes.ok) throw new Error("Falha ao buscar configurações")
            const configs = await configsRes.json()

            // 3. Merge
            const merged: AreaConfigRow[] = areas.map((area: any) => {
                const config = configs.find((c: any) => c.areaId === area.id)
                return {
                    areaId: area.id,
                    areaName: area.name,
                    currentSeries: area.currentSeries || "0000",
                    extractionTimes: config?.extractionTimes || [],
                    hasCustomConfig: !!config && config.extractionTimes.length > 0
                }
            })

            setAreaRows(merged)

        } catch (error) {
            console.error(error)
            showAlert("Erro", "Falha ao carregar dados das praças", "error")
        } finally {
            setIsLoadingAreas(false)
        }
    }

    // --- Global Handlers ---
    const addGlobalTime = () => {
        if (!newGlobalTime) return
        if (globalTimes.some(t => t.time === newGlobalTime)) {
            showAlert("Atenção!", "Horário já existe", "warning")
            return
        }
        const sorted = [...globalTimes, { time: newGlobalTime, series: Number(newGlobalSeries) || 0 }].sort((a, b) => a.time.localeCompare(b.time))
        setGlobalTimes(sorted)
        setNewGlobalTime("")
        setNewGlobalSeries("")
    }

    const removeGlobalTime = (time: string) => {
        setGlobalTimes(globalTimes.filter(t => t.time !== time))
    }

    const updateGlobalSeries = (time: string, series: string) => {
        const newSeriesVal = Number(series)
        setGlobalTimes(globalTimes.map(t =>
            t.time === time ? { ...t, series: newSeriesVal } : t
        ))
    }

    // --- Area Handlers ---
    const handleAreaTimesChange = (areaId: string, value: string) => {
        // Value comes as comma separated string "10:00, 12:00"
        const times = value.split(",").map(t => t.trim()).filter(t => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(t))

        setAreaRows(rows => rows.map(r => {
            if (r.areaId === areaId) {
                return { ...r, extractionTimes: times, hasCustomConfig: times.length > 0 }
            }
            return r
        }))
    }

    // Just to control input state before validation
    const handleAreaInputChange = (areaId: string, parsedString: string) => {
        // Temporarily we don't update state valid times until blur? 
        // Or we parse immediately?
        // Let's assume input is separated by comma
        // Simple Approach: We store string in local state? No, let's parse on Save/Blur?
        // Limitation: If I type "10:0", it's invalid.
        // Let's treat the Input value as raw string and parse on Save? No, state structure expects array.
        // Let's parse immediately but be lenient.

        const rawTimes = parsedString.split(",").map(t => t.trim())
        setAreaRows(rows => rows.map(r => r.areaId === areaId ? { ...r, extractionTimes: rawTimes } : r))
    }

    const saveSchedule = async () => {
        if (!game) return
        setSaving(true)
        try {
            const token = localStorage.getItem("token")

            // 1. Save Global
            const globalPayload = {
                extractionTimes: globalTimes.map(t => t.time),
                extractionSeries: globalTimes.map(t => ({
                    time: t.time,
                    lastSeries: t.series,
                    areaId: null
                }))
            }

            const resGlobal = await fetch(`${API_URL}/games/${game.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(globalPayload)
            })

            if (!resGlobal.ok) throw new Error("Erro ao salvar horários globais")

            // 2. Save Areas (Only those that changed essentially, or all? Let's upsert all active ones)
            // Filter valid times first
            const updatePromises = areaRows.map(row => {
                // Valid times only
                const validTimes = row.extractionTimes.filter(t => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(t)).sort()

                // If empty and no custom config, maybe skip? 
                // If empty, we send empty array to clear it.

                return fetch(`${API_URL}/areas-config`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        areaId: row.areaId,
                        gameId: game.id,
                        extractionTimes: validTimes
                    })
                })
            })

            await Promise.all(updatePromises)

            showAlert("Sucesso!", "Horários atualizados com sucesso", "success")
            onSuccess()
            onOpenChange(false)

        } catch (e: any) {
            console.error(e)
            showAlert("Erro!", e.message || "Erro ao salvar", "error")
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Horários de Extração - {game?.name}</DialogTitle>
                    <DialogDescription>
                        {game?.type === 'MINUTO_SORTE'
                            ? "Para o Minuto da Sorte, defina o horário em que o sorteio da Loteria Federal costuma ocorrer (ex: 19:00). Isso serve para informar ao usuário quando será a apuração."
                            : "Configure os horários de sorteio Globais e por Praça."}
                    </DialogDescription>
                </DialogHeader>

                {game?.type === 'MINUTO_SORTE' && (
                    <div className="mx-6 mt-2 p-3 bg-blue-50 border border-blue-100 rounded-md text-xs text-blue-700">
                        <strong>Nota:</strong> O Minuto da Sorte geralmente tem apenas <strong>um horário por dia</strong> (vinculado à Loteria Federal). Diferente de outros jogos, você não precisa de múltiplos horários diários.
                    </div>
                )}

                <Tabs defaultValue="global" value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="global">Padrão (Global)</TabsTrigger>
                        <TabsTrigger value="areas">Por Praça (Específico)</TabsTrigger>
                    </TabsList>

                    <TabsContent value="global" className="flex-1 overflow-y-auto py-4 space-y-4">
                        <div className="flex items-end gap-2 bg-muted/20 p-4 rounded-lg border border-border">
                            <div className="grid gap-1.5 flex-1">
                                <Label htmlFor="time">Novo Horário</Label>
                                <Input
                                    id="time"
                                    type="time"
                                    value={newGlobalTime}
                                    onChange={(e) => setNewGlobalTime(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-1.5 w-[100px]">
                                <Label htmlFor="series">Série Inicial</Label>
                                <Input
                                    id="series"
                                    type="number"
                                    placeholder="0"
                                    value={newGlobalSeries}
                                    onChange={(e) => setNewGlobalSeries(e.target.value)}
                                />
                            </div>
                            <Button onClick={addGlobalTime} disabled={!newGlobalTime}>
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar
                            </Button>
                        </div>

                        <div className="border border-border rounded-md p-2 bg-muted/20">
                            {globalTimes.length === 0 ? (
                                <div className="text-center text-muted-foreground text-sm py-8">
                                    Nenhum horário global definido.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {globalTimes.map((item) => (
                                        <div key={item.time} className="flex items-center gap-4 bg-background border border-border p-3 rounded-lg shadow-sm">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                                    <Clock className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-lg">{item.time}</p>
                                                    <p className="text-xs text-muted-foreground">Série Atual: {item.series}</p>
                                                </div>
                                            </div>
                                            <div className="w-[100px]">
                                                <Input
                                                    type="number"
                                                    className="h-9 text-right font-mono"
                                                    value={item.series}
                                                    onChange={(e) => updateGlobalSeries(item.time, e.target.value)}
                                                    placeholder="Série"
                                                    title="Editar Série Atual"
                                                />
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                                onClick={() => removeGlobalTime(item.time)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="areas" className="flex-1 overflow-y-auto py-4">
                        {isLoadingAreas ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                            </div>
                        ) : (
                            <div className="rounded-md border border-border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Praça</TableHead>
                                            <TableHead>Série da Praça</TableHead>
                                            <TableHead className="w-[300px]">Horários (Ex: 10:00, 14:00)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {areaRows.map((row) => (
                                            <TableRow key={row.areaId}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                                        {row.areaName}
                                                        {row.hasCustomConfig && <Badge variant="secondary" className="text-[10px] ml-1">Custom</Badge>}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-mono">
                                                        {row.currentSeries}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={row.extractionTimes.join(", ")}
                                                        onChange={(e) => handleAreaInputChange(row.areaId, e.target.value)}
                                                        placeholder="Use Global"
                                                        className={`font-mono text-sm ${row.hasCustomConfig ? 'border-emerald-500/50 bg-emerald-50/10' : ''}`}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {areaRows.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                                    Nenhuma praça cadastrada.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2 px-1">
                            * Deixe o campo vazio para usar os horários Globais. Separe múltiplos horários com vírgula.
                        </p>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={saveSchedule} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar Todos
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
