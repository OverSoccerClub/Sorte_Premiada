
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { API_URL } from "@/lib/api"
import { Loader2, Ticket, Save, Check, X, SquarePen, Clock, Plus, Trash2 } from "lucide-react"
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
    const [extractionTimes, setExtractionTimes] = useState<string[]>([])
    const [newTime, setNewTime] = useState("")

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
        setExtractionTimes(game.extractionTimes || [])
        setScheduleModalOpen(true)
    }

    const addTime = () => {
        if (!newTime) return
        if (extractionTimes.includes(newTime)) {
            toast.warning("Horário já existe")
            return
        }
        // Simple validation or sorting could go here
        const sorted = [...extractionTimes, newTime].sort()
        setExtractionTimes(sorted)
        setNewTime("")
    }

    const removeTime = (time: string) => {
        setExtractionTimes(extractionTimes.filter(t => t !== time))
    }

    const saveSchedule = async () => {
        if (!selectedGame) return
        setSaving(true)
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/games/${selectedGame.id}`, {
                method: 'POST', // Using POST/PATCH typically updates
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ extractionTimes })
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


    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <Ticket className="w-8 h-8 text-emerald-500" />
                    </div>
                    Configuração de Jogos
                </h2>
                <p className="text-muted-foreground mt-1 ml-14">Defina o valor de venda e horários de extração.</p>
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
                            <Button onClick={addTime} disabled={!newTime}>
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar
                            </Button>
                        </div>

                        <div className="border rounded-md p-2 min-h-[100px] bg-slate-50 dark:bg-slate-900/50">
                            {extractionTimes.length === 0 ? (
                                <div className="text-center text-muted-foreground text-sm py-8">
                                    Nenhum horário adicionado.
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2">
                                    {extractionTimes.map((time) => (
                                        <div key={time} className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded border shadow-sm text-sm">
                                            <span className="font-mono font-bold text-base text-slate-700 dark:text-slate-100">{time}</span>
                                            <Button
                                                data-slot="button"
                                                className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs dark:bg-input/30 dark:border-input dark:hover:bg-input/50 rounded-md gap-1.5 has-[>svg]:px-2.5 h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => removeTime(time)}
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
        </div>
    )
}
