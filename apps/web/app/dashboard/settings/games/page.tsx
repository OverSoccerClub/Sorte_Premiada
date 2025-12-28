"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { API_URL } from "@/lib/api"
import { Loader2, Ticket, Save, Check, X, SquarePen, Clock, Plus, Trash2, DollarSign, Shield, Settings2, Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

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

    // Rules Editing State
    const [rulesModalOpen, setRulesModalOpen] = useState(false)
    const [rulesValues, setRulesValues] = useState({ globalCheck: false, restrictedMode: false, maxLiability: "5000", prizeMultiplier: "1000" })

    // Prize Editing State
    const [prizesModalOpen, setPrizesModalOpen] = useState(false)
    const [prizeValues, setPrizeValues] = useState({ milhar: "", centena: "", dezena: "" })

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

            const payload = {
                extractionTimes: extractionTimes.map(t => t.time),
                extractionSeries: extractionTimes.map(t => ({
                    time: t.time,
                    lastSeries: t.series
                }))
            }

            const res = await fetch(`${API_URL}/games/${selectedGame.id}`, {
                method: 'POST',
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


    // Prize Functions
    const openPrizesModal = (game: any) => {
        setSelectedGame(game)
        setPrizeValues({
            milhar: game.prizeMilhar ? String(Number(game.prizeMilhar)) : "5000",
            centena: game.prizeCentena ? String(Number(game.prizeCentena)) : "600",
            dezena: game.prizeDezena ? String(Number(game.prizeDezena)) : "60"
        })
        setPrizesModalOpen(true)
    }

    const savePrizes = async () => {
        if (!selectedGame) return
        setSaving(true)
        try {
            const token = localStorage.getItem("token")

            const payload = {
                prizeMilhar: Number(prizeValues.milhar),
                prizeCentena: Number(prizeValues.centena),
                prizeDezena: Number(prizeValues.dezena)
            }

            const res = await fetch(`${API_URL}/games/${selectedGame.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
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

    // Rules Functions
    const openRulesModal = (game: any) => {
        setSelectedGame(game)
        const currentRules = game.rules || {}
        setRulesValues({
            globalCheck: !!currentRules.globalCheck,
            restrictedMode: !!currentRules.restrictedMode,
            maxLiability: game.maxLiability ? String(game.maxLiability) : "5000",
            prizeMultiplier: game.prizeMultiplier ? String(game.prizeMultiplier) : "1000"
        })
        setRulesModalOpen(true)
    }

    const saveRules = async () => {
        if (!selectedGame) return
        setSaving(true)
        try {
            const token = localStorage.getItem("token")

            const updatedRules = {
                ...(selectedGame.rules || {}),
                globalCheck: rulesValues.globalCheck,
                restrictedMode: rulesValues.restrictedMode
            }

            const payload = {
                rules: updatedRules,
                maxLiability: Number(rulesValues.maxLiability),
                prizeMultiplier: Number(rulesValues.prizeMultiplier)
            }

            const res = await fetch(`${API_URL}/games/${selectedGame.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <Ticket className="w-8 h-8 text-emerald-500" />
                        </div>
                        Configuração de Jogos
                    </h2>
                    <p className="text-muted-foreground mt-1 ml-14">Defina o valor de venda, horários e premiações.</p>
                </div>
            </div>

            <Card className="border-border shadow-sm bg-card overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Settings2 className="w-5 h-5 text-emerald-500" />
                        Jogos Disponíveis
                    </CardTitle>
                    <CardDescription>Gerencie os preços e horários de sorteio.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-muted/50 bg-muted/20 border-b border-border/60">
                                <TableHead className="pl-6">Nome do Jogo</TableHead>
                                <TableHead>Preço Atual</TableHead>
                                <TableHead>Extrações Diárias</TableHead>
                                <TableHead className="w-[180px] text-right pr-6">Ações</TableHead>
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
                                    <TableRow key={game.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-medium pl-6">
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
                                                    className="w-32 h-8"
                                                    step="0.01"
                                                />
                                            ) : (
                                                <span className="font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded w-fit border border-emerald-100">
                                                    <span className="text-xs text-muted-foreground">R$</span>
                                                    {new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2 }).format(Number(game.price || 0))}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {game.extractionTimes && game.extractionTimes.length > 0 ? (
                                                    game.extractionTimes.map((time: string) => (
                                                        <Badge key={time} variant="secondary" className="text-xs border-border bg-background">
                                                            {time}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-muted-foreground text-xs italic">Nenhum horário definido</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            {editingId === game.id ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button size="sm" onClick={() => savePrice(game.id)} disabled={saving} className="h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-700">
                                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={cancelEditing} disabled={saving} className="h-8 w-8 p-0">
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                                                        onClick={() => openRulesModal(game)}
                                                        title="Regras de Negócio"
                                                    >
                                                        <Shield className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
                                                        onClick={() => openPrizesModal(game)}
                                                        title="Configurar Prêmios"
                                                    >
                                                        <DollarSign className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 px-2 text-muted-foreground hover:text-emerald-600 hover:bg-muted"
                                                        onClick={() => openScheduleModal(game)}
                                                        title="Gerenciar Horários"
                                                    >
                                                        <Clock className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
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

                        <div className="border border-border rounded-md p-2 min-h-[100px] bg-muted/20 max-h-[300px] overflow-y-auto">
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
                                        <div key={item.time} className="flex items-center gap-2 bg-muted/40 border border-border p-2 rounded shadow-sm text-sm">
                                            <div className="flex-1 font-mono font-bold text-base text-foreground flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-emerald-500" />
                                                {item.time}
                                            </div>
                                            <div className="w-[80px]">
                                                <Input
                                                    type="number"
                                                    className="h-8 text-right font-mono bg-background border-input"
                                                    value={item.series}
                                                    onChange={(e) => updateSeries(item.time, e.target.value)}
                                                    placeholder="0"
                                                />
                                            </div>
                                            <Button
                                                className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-red-500/10 hover:text-red-500 rounded-md gap-1.5 has-[>svg]:px-2.5 h-8 w-8 p-0 text-muted-foreground"
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
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
                                <Input
                                    type="number"
                                    className="pl-9"
                                    value={prizeValues.milhar}
                                    onChange={(e) => setPrizeValues({ ...prizeValues, milhar: e.target.value })}
                                    placeholder="Ex: 10000"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Prêmio Centena (Acerto de 3 dígitos)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
                                <Input
                                    type="number"
                                    className="pl-9"
                                    value={prizeValues.centena}
                                    onChange={(e) => setPrizeValues({ ...prizeValues, centena: e.target.value })}
                                    placeholder="Ex: 100"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Prêmio Dezena (Acerto de 2 dígitos)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
                                <Input
                                    type="number"
                                    className="pl-9"
                                    value={prizeValues.dezena}
                                    onChange={(e) => setPrizeValues({ ...prizeValues, dezena: e.target.value })}
                                    placeholder="Ex: 10"
                                />
                            </div>
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

            <Dialog open={rulesModalOpen} onOpenChange={setRulesModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Regras de Negócio - {selectedGame?.name}</DialogTitle>
                        <CardDescription>Configure as restrições e regras automáticas deste jogo.</CardDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                            <div className="space-y-0.5">
                                <Label className="text-base font-semibold">Bloqueio Global</Label>
                                <p className="text-sm text-muted-foreground max-w-[300px]">
                                    Impede que o mesmo número seja vendido mais de uma vez para o mesmo sorteio, por qualquer cambista.
                                </p>
                            </div>
                            <Switch
                                checked={rulesValues.globalCheck}
                                onCheckedChange={(checked) => setRulesValues({ ...rulesValues, globalCheck: checked })}
                                className="data-[state=checked]:bg-emerald-600"
                            />
                        </div>

                        <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                            <div className="space-y-0.5">
                                <Label className="text-base font-semibold">Modo Restrito</Label>
                                <p className="text-sm text-muted-foreground max-w-[300px]">
                                    Gera automaticamente as outras 3 milhares relacionadas ao escolher apenas 1 milhar.
                                </p>
                            </div>
                            <Switch
                                checked={rulesValues.restrictedMode}
                                onCheckedChange={(checked) => setRulesValues({ ...rulesValues, restrictedMode: checked })}
                                className="data-[state=checked]:bg-emerald-600"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-red-500" />
                                    Limite de Risco (R$)
                                </Label>
                                <Input
                                    type="number"
                                    value={rulesValues.maxLiability}
                                    onChange={(e) => setRulesValues({ ...rulesValues, maxLiability: e.target.value })}
                                    placeholder="Ex: 5000"
                                />
                                <p className="text-[10px] text-muted-foreground whitespace-nowrap">Máximo de prêmios por número/sorteio.</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-emerald-500" />
                                    Multiplicador
                                </Label>
                                <Input
                                    type="number"
                                    value={rulesValues.prizeMultiplier}
                                    onChange={(e) => setRulesValues({ ...rulesValues, prizeMultiplier: e.target.value })}
                                    placeholder="Ex: 1000"
                                />
                                <p className="text-[10px] text-muted-foreground whitespace-nowrap text-wrap">Multiplica o valor da aposta no prêmio.</p>
                            </div>
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
        </div>
    )
}
