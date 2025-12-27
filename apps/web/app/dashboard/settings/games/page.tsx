
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { API_URL } from "@/lib/api"
// ... (imports)
import { Loader2, Ticket, Save, Check, X, SquarePen, Clock, Plus, Trash2, DollarSign, Shield } from "lucide-react"

// ... inside component

// Rules Editing State
const [rulesModalOpen, setRulesModalOpen] = useState(false)
const [rulesValues, setRulesValues] = useState({ globalCheck: false, restrictedMode: false })

// ...

// Rules Functions
const openRulesModal = (game: any) => {
    setSelectedGame(game)
    const currentRules = game.rules || {}
    setRulesValues({
        globalCheck: !!currentRules.globalCheck,
        restrictedMode: !!currentRules.restrictedMode
    })
    setRulesModalOpen(true)
}

const saveRules = async () => {
    if (!selectedGame) return
    setSaving(true)
    try {
        const token = localStorage.getItem("token")

        // Merge existing rules
        const updatedRules = {
            ...(selectedGame.rules || {}),
            globalCheck: rulesValues.globalCheck,
            restrictedMode: rulesValues.restrictedMode
        }

        const res = await fetch(`${API_URL}/games/${selectedGame.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ rules: updatedRules })
        })

        if (res.ok) {
            toast.success("Regras atualizadas com sucesso")
            fetchGames()
            setRulesModalOpen(false)
        } else {
            toast.error("Erro ao salvar regras")
        }
    } catch (e) {
        toast.error("Erro ao salvar")
    } finally {
        setSaving(false)
    }
}

    // ... inside Table actions
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            onClick={() => openRulesModal(game)}
                                                            title="Regras de Negócio"
                                                        >
                                                            <Shield className="h-4 w-4" />
                                                        </Button>

    // ... inside return (add new Dialog)
            <Dialog open={rulesModalOpen} onOpenChange={setRulesModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Regras de Negócio - {selectedGame?.name}</DialogTitle>
                        <CardDescription>Configure as restrições e regras automáticas deste jogo.</CardDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg">
                            <div className="space-y-0.5">
                                <Label className="text-base font-semibold">Bloqueio Global</Label>
                                <p className="text-sm text-muted-foreground">
                                     impede que o mesmo número seja vendido mais de uma vez para o mesmo sorteio, por qualquer cambista.
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={rulesValues.globalCheck}
                                onChange={(e) => setRulesValues({ ...rulesValues, globalCheck: e.target.checked })}
                                className="h-6 w-6 accent-emerald-600"
                            />
                        </div>
                        
                        <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg">
                            <div className="space-y-0.5">
                                <Label className="text-base font-semibold">Modo Restrito (Auto-Preenchimento)</Label>
                                <p className="text-sm text-muted-foreground">
                                    Se o apostador escolher apenas 1 milhar, o sistema irá gerar automaticamente as outras 3 milhares com a mesma terminação (centena).
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={rulesValues.restrictedMode}
                                onChange={(e) => setRulesValues({ ...rulesValues, restrictedMode: e.target.checked })}
                                className="h-6 w-6 accent-emerald-600"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRulesModalOpen(false)}>Cancelar</Button>
                        <Button onClick={saveRules} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Salvar Regras
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

export default function GameSettingsPage() {
    const [games, setGames] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editPrice, setEditPrice] = useState<string>("")
    const [saving, setSaving] = useState(false)

    // Schedule Editing State
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
    const [selectedGame, setSelectedGame] = useState<any>(null)
    const [extractionTimes, setExtractionTimes] = useState<{ time: string, series: number }[]>([])
    const [newTime, setNewTime] = useState("")
    const [newSeries, setNewSeries] = useState("")

    useEffect(() => {
        fetchGames()
    }, [])

    const fetchGames = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/games`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setGames(data)
            }
        } catch (e) {
            toast.error("Erro ao carregar jogos")
        } finally {
            setLoading(false)
        }
    }

    const startEditing = (game: any) => {
        setEditingId(game.id)
        setEditPrice(game.price ? Number(game.price).toFixed(2) : "0.00")
    }

    const cancelEditing = () => {
        setEditingId(null)
        setEditPrice("")
    }

    const savePrice = async (gameId: string) => {
        setSaving(true)
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/games/${gameId}`, {
                method: 'POST', // or PATCH
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ price: Number(editPrice) })
            })

            if (res.ok) {
                toast.success("Preço atualizado com sucesso")
                fetchGames()
                cancelEditing()
            } else {
                toast.error("Erro ao atualizar preço")
            }
        } catch (e) {
            toast.error("Erro ao salvar")
        } finally {
            setSaving(false)
        }
    }

    // Schedule Functions
    const openScheduleModal = (game: any) => {
        setSelectedGame(game)

        // Map existing string times to objects with series
        // If extractionSeries exists (from backend include), use it to populate series
        const existingSeriesMap = new Map()
        if (game.extractionSeries) {
            game.extractionSeries.forEach((s: any) => existingSeriesMap.set(s.time, s.lastSeries))
        }

        const times = (game.extractionTimes || []).map((t: string) => ({
            time: t,
            series: existingSeriesMap.get(t) || 0
        }))

        setExtractionTimes(times)
        setScheduleModalOpen(true)
    }

    const addTime = () => {
        if (!newTime) return
        if (extractionTimes.some(t => t.time === newTime)) {
            toast.warning("Horário já existe")
            return
        }
        // Simple validation or sorting could go here
        const sorted = [...extractionTimes, { time: newTime, series: Number(newSeries) || 0 }].sort((a, b) => a.time.localeCompare(b.time))
        setExtractionTimes(sorted)
        setNewTime("")
        setNewSeries("")
    }

    const removeTime = (time: string) => {
        setExtractionTimes(extractionTimes.filter(t => t.time !== time))
    }

    const updateSeries = (time: string, series: string) => {
        const newSeriesVal = Number(series)
        setExtractionTimes(extractionTimes.map(t =>
            t.time === time ? { ...t, series: newSeriesVal } : t
        ))
    }

    const saveSchedule = async () => {
        if (!selectedGame) return
        setSaving(true)
        try {
            const token = localStorage.getItem("token")

            // Send both the string array (extractionTimes) and the series detail (extractionSeries)
            const payload = {
                extractionTimes: extractionTimes.map(t => t.time),
                extractionSeries: extractionTimes.map(t => ({
                    time: t.time,
                    lastSeries: t.series
                }))
            }

            const res = await fetch(`${API_URL}/games/${selectedGame.id}`, {
                method: 'POST', // Using POST/PATCH typically updates
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast.success("Horários atualizados com sucesso")
                fetchGames()
                setScheduleModalOpen(false)
            } else {
                toast.error("Erro ao salvar horários")
            }
        } catch (e) {
            toast.error("Erro ao salvar")
        } finally {
            setSaving(false)
        }
    }


    // Prize Editing State
    const [prizesModalOpen, setPrizesModalOpen] = useState(false)
    const [prizeValues, setPrizeValues] = useState({ milhar: "", centena: "", dezena: "" })

    // Prize Functions
    const openPrizesModal = (game: any) => {
        setSelectedGame(game)
        const currentPrizes = game.rules?.prizes || {}
        setPrizeValues({
            milhar: currentPrizes.milhar || "10000",
            centena: currentPrizes.centena || "100",
            dezena: currentPrizes.dezena || "10"
        })
        setPrizesModalOpen(true)
    }

    const savePrizes = async () => {
        if (!selectedGame) return
        setSaving(true)
        try {
            const token = localStorage.getItem("token")

            // Merge existing rules with new prizes
            const updatedRules = {
                ...(selectedGame.rules || {}),
                prizes: {
                    milhar: Number(prizeValues.milhar),
                    centena: Number(prizeValues.centena),
                    dezena: Number(prizeValues.dezena)
                }
            }

            const res = await fetch(`${API_URL}/games/${selectedGame.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ rules: updatedRules })
            })

            if (res.ok) {
                toast.success("Premiação atualizada com sucesso")
                fetchGames()
                setPrizesModalOpen(false)
            } else {
                toast.error("Erro ao salvar premiação")
            }
        } catch (e) {
            toast.error("Erro ao salvar")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <Ticket className="w-8 h-8 text-emerald-500" />
                    </div>
                    Configuração de Jogos
                </h2>
                <p className="text-muted-foreground mt-1 ml-14">Defina o valor de venda, horários e premiações.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Jogos Disponíveis</CardTitle>
                    <CardDescription>Gerencie os preços e horários de sorteio.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome do Jogo</TableHead>
                                    <TableHead>Preço Atual</TableHead>
                                    <TableHead>Extrações Diárias</TableHead>
                                    <TableHead className="w-[180px] text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-500" />
                                        </TableCell>
                                    </TableRow>
                                ) : games.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            Nenhum jogo encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    games.map((game) => (
                                        <TableRow key={game.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Ticket className="w-4 h-4 text-emerald-500" />
                                                    {game.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {editingId === game.id ? (
                                                    <Input
                                                        type="number"
                                                        value={editPrice}
                                                        onChange={(e) => setEditPrice(e.target.value)}
                                                        className="w-32"
                                                        step="0.01"
                                                    />
                                                ) : (
                                                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                                                        <span className="text-xs text-muted-foreground">R$</span>
                                                        {new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2 }).format(Number(game.price || 0))}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {game.extractionTimes && game.extractionTimes.length > 0 ? (
                                                        game.extractionTimes.map((time: string) => (
                                                            <Badge key={time} variant="secondary" className="text-xs">
                                                                {time}
                                                            </Badge>
                                                        ))
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs italic">Nenhum horário definido</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {editingId === game.id ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button size="sm" onClick={() => savePrice(game.id)} disabled={saving}>
                                                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                        </Button>
                                                        <Button size="sm" variant="ghost" onClick={cancelEditing} disabled={saving}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                            onClick={() => openPrizesModal(game)}
                                                            title="Configurar Prêmios"
                                                        >
                                                            <DollarSign className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-muted-foreground hover:text-emerald-600"
                                                            onClick={() => openScheduleModal(game)}
                                                            title="Gerenciar Horários"
                                                        >
                                                            <Clock className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                            onClick={() => startEditing(game)}
                                                            title="Editar Preço"
                                                        >
                                                            <SquarePen className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Horários de Extração - {selectedGame?.name}</DialogTitle>
                        <CardDescription>Adicione ou remova os horários de sorteio diários.</CardDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-end gap-2">
                            <div className="grid gap-1.5 flex-1">
                                <Label htmlFor="time">Novo Horário</Label>
                                <Input
                                    id="time"
                                    type="time"
                                    value={newTime}
                                    onChange={(e) => setNewTime(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-1.5 w-[100px]">
                                <Label htmlFor="series">Série Inicial</Label>
                                <Input
                                    id="series"
                                    type="number"
                                    placeholder="0"
                                    value={newSeries}
                                    onChange={(e) => setNewSeries(e.target.value)}
                                />
                            </div>
                            <Button onClick={addTime} disabled={!newTime}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add
                            </Button>
                        </div>

                        <div className="border rounded-md p-2 min-h-[100px] bg-slate-50 dark:bg-slate-900/50">
                            {extractionTimes.length === 0 ? (
                                <div className="text-center text-muted-foreground text-sm py-8">
                                    Nenhum horário adicionado.
                                </div>
                            ) : (
                                <div className="grid gap-2">
                                    <div className="grid grid-cols-[1fr_80px_40px] gap-2 px-2 text-xs font-medium text-muted-foreground mb-1">
                                        <span>Horário</span>
                                        <span>Série Atual</span>
                                        <span></span>
                                    </div>
                                    {extractionTimes.map((item) => (
                                        <div key={item.time} className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded border shadow-sm text-sm">
                                            <div className="flex-1 font-mono font-bold text-base text-slate-700 dark:text-slate-100 flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-emerald-500" />
                                                {item.time}
                                            </div>
                                            <div className="w-[80px]">
                                                <Input
                                                    type="number"
                                                    className="h-8 text-right font-mono"
                                                    value={item.series}
                                                    onChange={(e) => updateSeries(item.time, e.target.value)}
                                                    placeholder="0"
                                                />
                                            </div>
                                            <Button
                                                className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs dark:bg-input/30 dark:border-input dark:hover:bg-input/50 rounded-md gap-1.5 has-[>svg]:px-2.5 h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => removeTime(item.time)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setScheduleModalOpen(false)}>Cancelar</Button>
                        <Button onClick={saveSchedule} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Salvar Horários
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={prizesModalOpen} onOpenChange={setPrizesModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Premiação - {selectedGame?.name}</DialogTitle>
                        <CardDescription>Defina os valores de premiação para cada acerto.</CardDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Prêmio Milhar (Acerto de 4 dígitos)</Label>
                            <Input
                                type="number"
                                value={prizeValues.milhar}
                                onChange={(e) => setPrizeValues({ ...prizeValues, milhar: e.target.value })}
                                placeholder="Ex: 10000"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Prêmio Centena (Acerto de 3 dígitos)</Label>
                            <Input
                                type="number"
                                value={prizeValues.centena}
                                onChange={(e) => setPrizeValues({ ...prizeValues, centena: e.target.value })}
                                placeholder="Ex: 100"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Prêmio Dezena (Acerto de 2 dígitos)</Label>
                            <Input
                                type="number"
                                value={prizeValues.dezena}
                                onChange={(e) => setPrizeValues({ ...prizeValues, dezena: e.target.value })}
                                placeholder="Ex: 10"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPrizesModalOpen(false)}>Cancelar</Button>
                        <Button onClick={savePrizes} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Salvar Prêmios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
