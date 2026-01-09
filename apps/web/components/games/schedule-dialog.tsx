import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Clock, Trash2, Save } from "lucide-react"
import { toast } from "sonner"
import { API_URL } from "@/lib/api"

interface ScheduleDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    game: any
    onSuccess: () => void
}

export function ScheduleDialog({ open, onOpenChange, game, onSuccess }: ScheduleDialogProps) {
    const [extractionTimes, setExtractionTimes] = useState<{ time: string, series: number, areaId?: string | null }[]>([])
    const [newTime, setNewTime] = useState("")
    const [newSeries, setNewSeries] = useState("")
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (open && game) {
            const existingSeriesMap = new Map()
            if (game.extractionSeries) {
                game.extractionSeries.forEach((s: any) => existingSeriesMap.set(s.time, { lastSeries: s.lastSeries, areaId: s.areaId }))
            }

            const times = (game.extractionTimes || []).map((t: string) => {
                const existing = existingSeriesMap.get(t)
                return {
                    time: t,
                    series: existing?.lastSeries || 0,
                    areaId: existing?.areaId || null
                }
            })

            setExtractionTimes(times)
        }
    }, [open, game])

    const addTime = () => {
        if (!newTime) return
        if (extractionTimes.some(t => t.time === newTime)) {
            toast.warning("Horário já existe")
            return
        }
        const sorted = [...extractionTimes, { time: newTime, series: Number(newSeries) || 0, areaId: null }].sort((a, b) => a.time.localeCompare(b.time))
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
        if (!game) return
        setSaving(true)
        try {
            const token = localStorage.getItem("token")

            const payload = {
                extractionTimes: extractionTimes.map(t => t.time),
                extractionSeries: extractionTimes.map(t => ({
                    time: t.time,
                    lastSeries: t.series,
                    areaId: t.areaId || null
                }))
            }

            const res = await fetch(`${API_URL}/games/${game.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast.success("Horários atualizados com sucesso")
                onSuccess()
                onOpenChange(false)
            } else {
                toast.error("Erro ao salvar horários")
            }
        } catch (e) {
            toast.error("Erro ao salvar")
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Horários de Extração - {game?.name}</DialogTitle>
                    <DialogDescription>Adicione ou remova os horários de sorteio diários.</DialogDescription>
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
                                            className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 border bg-background shadow-xs hover:bg-red-500/10 hover:text-red-500 rounded-md h-8 w-8 p-0 text-muted-foreground"
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
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={saveSchedule} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar Horários
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
