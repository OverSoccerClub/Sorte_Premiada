
"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { API_URL } from "@/lib/api"
import { Loader2, Ticket, Settings as SettingsIcon, Plus, Calendar, Trophy, Trash2, Clock, Hash, CheckCircle, AlertCircle, SquarePen, Eye, ChevronLeft, ChevronRight } from "lucide-react"

export default function DrawsSettingsPage() {
    const [games, setGames] = useState<any[]>([])
    const [selectedGameId, setSelectedGameId] = useState<string>("")
    const [draws, setDraws] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedDraw, setSelectedDraw] = useState<any | null>(null)

    // Details Modal State
    const [detailModalOpen, setDetailModalOpen] = useState(false)
    const [drawDetails, setDrawDetails] = useState<any>(null)
    const [currentPage, setCurrentPage] = useState(1)

    const handleOpenDetails = async (drawId: string) => {
        setDetailModalOpen(true)
        setDrawDetails(null)
        setCurrentPage(1)
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/draws/${drawId}/details`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setDrawDetails(data)
            } else {
                toast.error("Erro ao carregar detalhes")
                setDetailModalOpen(false)
            }
        } catch (error) {
            toast.error("Erro de conexão")
            setDetailModalOpen(false)
        }
    }

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
                                    <TableHead>Série</TableHead>
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
                                ) : (draws || []).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            Nenhum sorteio encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    (draws || []).map(draw => (
                                        <TableRow key={draw.id}>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono bg-slate-50">
                                                    #{draw.series?.toString().padStart(4, '0') || '---'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-foreground font-medium">
                                                    <Calendar className="w-4 h-4 text-emerald-500" />
                                                    {new Date(draw.drawDate).toLocaleString('pt-BR')}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(draw.drawDate) > new Date() ?
                                                    <span className="flex items-center gap-1 text-yellow-700 bg-yellow-100 px-2 py-1 rounded text-xs font-bold w-fit border border-yellow-200">
                                                        <Clock className="w-3 h-3" />
                                                        Agendado
                                                    </span> :
                                                    draw.numbers && draw.numbers.length > 0 ?
                                                        <span className="flex items-center gap-1 text-green-700 bg-green-100 px-2 py-1 rounded text-xs font-bold w-fit border border-green-200">
                                                            <CheckCircle className="w-3 h-3" />
                                                            Realizado
                                                        </span> :
                                                        <span className="flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-1 rounded text-xs font-bold w-fit border border-gray-200">
                                                            <AlertCircle className="w-3 h-3" />
                                                            Pendente
                                                        </span>
                                                }
                                            </TableCell>
                                            <TableCell>
                                                {draw.numbers && draw.numbers.length > 0 ?
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1 bg-yellow-100 rounded text-yellow-600">
                                                            <Trophy className="w-3 h-3" />
                                                        </div>
                                                        <span className="font-mono text-sm tracking-widest">{draw.numbers.join(' - ')}</span>
                                                    </div> :
                                                    <span className="text-muted-foreground italic text-xs pl-2">-</span>
                                                }
                                            </TableCell>
                                            <TableCell className="text-right flex justify-end gap-2">
                                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleOpenDetails(draw.id)} title="Ver Detalhes">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => handleOpenModal(draw)}>
                                                    <SquarePen className="w-4 h-4" />
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

            <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detalhes do Sorteio</DialogTitle>
                        <CardDescription>
                            {drawDetails?.draw?.game?.name} - {drawDetails?.draw?.series ? `#${drawDetails.draw.series}` : ''} - {drawDetails?.draw?.drawDate && new Date(drawDetails.draw.drawDate).toLocaleString('pt-BR')}
                        </CardDescription>
                    </DialogHeader>

                    {drawDetails && (
                        <div className="space-y-6">
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="bg-emerald-500/10 border-emerald-500/20">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-emerald-600">Total Arrecadado</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(drawDetails.stats.totalSales)}
                                        </div>
                                        <p className="text-xs text-muted-foreground">{drawDetails.stats.ticketCount} apostas</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-yellow-500/10 border-yellow-500/20">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-yellow-600">Bilhetes Premiados</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {drawDetails.stats.winningCount}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Vencedores</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-slate-500/10 border-slate-500/20">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-600">Números Sorteados</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-lg font-mono font-bold tracking-widest">
                                            {drawDetails.draw.numbers && drawDetails.draw.numbers.length > 0 ? (drawDetails.draw.numbers as number[]).join(' - ') : 'Não realizado'}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Tickets List */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Bilhetes Participantes</h3>
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Bilhete / Hash</TableHead>
                                                <TableHead>Cambista / Área</TableHead>
                                                <TableHead>Números</TableHead>
                                                <TableHead>Valor</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(() => {
                                                const ITEMS_PER_PAGE = 5;
                                                const totalPages = Math.ceil(drawDetails.tickets.length / ITEMS_PER_PAGE);
                                                const paginatedTickets = drawDetails.tickets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

                                                return (
                                                    <>
                                                        {paginatedTickets.map((t: any) => (
                                                            <TableRow key={t.id} className={t.status === 'WON' ? 'bg-yellow-500/10 hover:bg-yellow-500/20' : ''}>
                                                                <TableCell className="font-mono text-xs">
                                                                    <div className="font-bold">{t.id.slice(0, 8)}...</div>
                                                                    <div className="text-[10px] text-muted-foreground">{t.hash || '-'}</div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="font-medium text-sm">{t.user?.name || t.user?.username}</div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {t.user?.area?.name ? `${t.user.area.city}/${t.user.area.state}` : 'Sem Área'}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="font-mono text-xs max-w-[150px] break-words">
                                                                    {t.numbers.join(', ')}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(t.amount))}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant={t.status === 'WON' ? 'default' : t.status === 'PENDING' ? 'outline' : 'secondary'} className={t.status === 'WON' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}>
                                                                        {t.status === 'WON' ? 'PREMIADO' : t.status}
                                                                    </Badge>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                        {drawDetails.tickets.length === 0 && (
                                                            <TableRow>
                                                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Nenhum bilhete encontrado para este sorteio.</TableCell>
                                                            </TableRow>
                                                        )}

                                                        {/* Pagination Controls */}
                                                        {drawDetails.tickets.length > ITEMS_PER_PAGE && (
                                                            <TableRow>
                                                                <TableCell colSpan={5} className="p-2">
                                                                    <div className="flex items-center justify-between w-full">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                                            disabled={currentPage === 1}
                                                                        >
                                                                            <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                                                                        </Button>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            Página {currentPage} de {totalPages}
                                                                        </span>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                                            disabled={currentPage === totalPages}
                                                                        >
                                                                            Próximo <ChevronRight className="w-4 h-4 ml-1" />
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </>
                                                )
                                            })()}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
