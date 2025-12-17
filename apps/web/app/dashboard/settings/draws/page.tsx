
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { API_URL } from "@/lib/api"
import { Loader2, Ticket, Settings as SettingsIcon, Plus, Calendar, Trophy, Trash2 } from "lucide-react"

export default function DrawsSettingsPage() {
    const [games, setGames] = useState<any[]>([])
    const [selectedGameId, setSelectedGameId] = useState<string>("")
    const [draws, setDraws] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedDraw, setSelectedDraw] = useState<any | null>(null)

    // Form State
    const [drawDate, setDrawDate] = useState("")
    const [drawTime, setDrawTime] = useState("")
    const [winningNumbers, setWinningNumbers] = useState("")
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchGames()
    }, [])

    useEffect(() => {
        if (selectedGameId) {
            fetchDraws(selectedGameId)
        } else {
            setDraws([])
        }
    }, [selectedGameId])

    const fetchGames = async () => {
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/games`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) setGames(await res.json())
        } catch (e) { toast.error("Erro ao carregar jogos") }
    }

    const fetchDraws = async (gameId: string) => {
        setLoading(true)
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/draws?gameId=${gameId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) setDraws(await res.json())
        } catch (e) { toast.error("Erro ao carregar sorteios") }
        finally { setLoading(false) }
    }

    const handleOpenModal = (draw: any | null = null) => {
        setSelectedDraw(draw)
        if (draw) {
            const date = new Date(draw.drawDate)
            setDrawDate(date.toISOString().split('T')[0])
            setDrawTime(date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
            setWinningNumbers(draw.numbers ? draw.numbers.join(', ') : "")
        } else {
            setDrawDate(new Date().toISOString().split('T')[0])
            setDrawTime("19:00")
            setWinningNumbers("")
        }
        setModalOpen(true)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const token = localStorage.getItem("token")
            const fullDate = new Date(`${drawDate}T${drawTime}:00`)

            const payload = {
                gameId: selectedGameId,
                drawDate: fullDate.toISOString(),
                numbers: winningNumbers ? winningNumbers.split(',').map(n => Number(n.trim())) : []
            }

            let url = `${API_URL}/draws`
            let method = 'POST'

            if (selectedDraw) {
                url = `${API_URL}/draws/${selectedDraw.id}`
                method = 'PATCH'
            }

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast.success(selectedDraw ? "Sorteio atualizado!" : "Sorteio agendado!")
                setModalOpen(false)
                fetchDraws(selectedGameId)
            } else {
                toast.error("Erro ao salvar sorteio")
            }
        } catch (e) {
            toast.error("Erro ao salvar")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir?")) return
        try {
            const token = localStorage.getItem("token")
            await fetch(`${API_URL}/draws/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            })
            fetchDraws(selectedGameId)
            toast.success("Sorteio excluído")
        } catch (e) { toast.error("Erro ao excluir") }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <Calendar className="w-8 h-8 text-emerald-500" />
                    </div>
                    Gestão de Sorteios
                </h2>
                <p className="text-muted-foreground mt-1 ml-14">Agende e gerencie os resultados dos sorteios.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filtrar por Jogo</CardTitle>
                    <CardDescription>Selecione um jogo para ver seus sorteios.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                    <Select value={selectedGameId} onValueChange={setSelectedGameId}>
                        <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder="Selecione um jogo..." />
                        </SelectTrigger>
                        <SelectContent>
                            {games.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    {selectedGameId && (
                        <Button onClick={() => handleOpenModal(null)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Sorteio
                        </Button>
                    )}
                </CardContent>
            </Card>

            {selectedGameId && (
                <Card>
                    <CardHeader>
                        <CardTitle>Sorteios Agendados / Realizados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data / Hora</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Números Sorteados</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-500" />
                                        </TableCell>
                                    </TableRow>
                                ) : draws.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            Nenhum sorteio encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    draws.map(draw => (
                                        <TableRow key={draw.id}>
                                            <TableCell>
                                                {new Date(draw.drawDate).toLocaleString('pt-BR')}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(draw.drawDate) > new Date() ?
                                                    <span className="text-yellow-600 bg-yellow-100 px-2 py-1 rounded text-xs font-bold">Agendado</span> :
                                                    draw.numbers && draw.numbers.length > 0 ?
                                                        <span className="text-green-600 bg-green-100 px-2 py-1 rounded text-xs font-bold">Realizado</span> :
                                                        <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded text-xs font-bold">Pendente</span>
                                                }
                                            </TableCell>
                                            <TableCell>
                                                {draw.numbers && draw.numbers.length > 0 ?
                                                    <span className="font-mono text-sm">{draw.numbers.join(', ')}</span> :
                                                    <span className="text-muted-foreground italic">-</span>
                                                }
                                            </TableCell>
                                            <TableCell className="text-right flex justify-end gap-2">
                                                <Button size="sm" variant="outline" onClick={() => handleOpenModal(draw)}>
                                                    <SettingsIcon className="w-4 h-4" />
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleDelete(draw.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedDraw ? "Editar Sorteio" : "Novo Sorteio"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label>Data</label>
                            <Input type="date" value={drawDate} onChange={e => setDrawDate(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <label>Hora</label>
                            <Input type="time" value={drawTime} onChange={e => setDrawTime(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <label>Números Sorteados (separar por vírgula)</label>
                            <Input
                                placeholder="Ex: 5, 10, 15 ou Deixe em branco se for agendamento"
                                value={winningNumbers}
                                onChange={e => setWinningNumbers(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Deixe em branco se o sorteio ainda não ocorreu.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trophy className="h-4 w-4 mr-2" />}
                            Salvar Sorteio
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
