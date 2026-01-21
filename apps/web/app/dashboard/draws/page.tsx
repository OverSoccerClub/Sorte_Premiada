"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { API_URL } from "@/lib/api"
import { Loader2, Calendar, Trophy, Trash2, Clock, CheckCircle, AlertCircle, SquarePen, Eye, ChevronLeft, ChevronRight, Plus, Filter, Tag, Ticket, Download, Search } from "lucide-react"
import { StandardPageHeader } from "@/components/standard-page-header"
import { StandardPagination } from "@/components/standard-pagination"
import { useActiveCompanyId } from "@/context/use-active-company"
import { useAlert } from "@/context/alert-context"

export default function DrawsSettingsPage() {
    const activeCompanyId = useActiveCompanyId()
    const { showAlert } = useAlert()
    const [games, setGames] = useState<any[]>([])
    const [selectedGameId, setSelectedGameId] = useState<string>("")
    const [draws, setDraws] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedDraw, setSelectedDraw] = useState<any | null>(null)

    // Import Modal State
    const [importModalOpen, setImportModalOpen] = useState(false)
    const [importDate, setImportDate] = useState(new Date().toISOString().split('T')[0])
    const [importedFixtures, setImportedFixtures] = useState<any[]>([])
    const [loadingFixtures, setLoadingFixtures] = useState(false)
    const [selectedFixtures, setSelectedFixtures] = useState<string[]>([])

    // Details Modal State
    const [detailModalOpen, setDetailModalOpen] = useState(false)
    const [drawDetails, setDrawDetails] = useState<any>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [detailLimit, setDetailLimit] = useState<number | "all">(5)

    // Main Table Pagination State
    const [mainPage, setMainPage] = useState(1)
    const [mainLimit, setMainLimit] = useState<number | "all">(10)

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
                showAlert("Erro", "Erro ao carregar detalhes", "error")
                setDetailModalOpen(false)
            }
        } catch (error) {
            showAlert("Erro", "Erro de conexão", "error")
            setDetailModalOpen(false)
        }
    }

    // Form State
    const [drawDate, setDrawDate] = useState("")
    const [drawTime, setDrawTime] = useState("")
    const [drawDescription, setDrawDescription] = useState("")
    const [winningNumbers, setWinningNumbers] = useState("")
    const [matches, setMatches] = useState<any[]>([])
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchGames()
    }, [activeCompanyId])

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
            const queryParams = new URLSearchParams()
            if (activeCompanyId) queryParams.append('targetCompanyId', activeCompanyId)

            const res = await fetch(`${API_URL}/games?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setGames(data)
                // Select first game by default if none selected
                if (data.length > 0 && !selectedGameId) {
                    setSelectedGameId(data[0].id)
                }
            }
        } catch (e) { showAlert("Erro", "Erro ao carregar jogos", "error") }
    }

    const fetchDraws = async (gameId: string) => {
        setLoading(true)
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/draws?gameId=${gameId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setDraws(data)
            }
        } catch (e) { showAlert("Erro", "Erro ao carregar sorteios", "error") }
        finally { setLoading(false) }
    }

    const handleOpenModal = (draw: any | null = null) => {
        setSelectedDraw(draw)
        const game = games.find(g => g.id === selectedGameId)
        const isPaipita = game?.type === 'PAIPITA_AI'

        if (draw) {
            const date = new Date(draw.drawDate)
            setDrawDate(date.toISOString().split('T')[0])
            setDrawTime(date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
            setDrawDescription(draw.description || "")
            setWinningNumbers(draw.numbers ? draw.numbers.join(', ') : "")

            // Paipita: Load matches
            if (isPaipita && draw.matches) {
                setMatches(draw.matches.sort((a: any, b: any) => a.matchOrder - b.matchOrder))
            } else if (isPaipita) {
                // Should not happen if data integrity is good, but fallback
                setMatches(Array.from({ length: 14 }, (_, i) => ({
                    matchOrder: i + 1,
                    homeTeam: "",
                    awayTeam: "",
                    matchDate: date.toISOString().slice(0, 16),
                    result: ""
                })))
            }
        } else {
            const today = new Date()
            setDrawDate(today.toISOString().split('T')[0])
            setDrawTime("19:00")
            setDrawDescription("")
            setWinningNumbers("")

            if (isPaipita) {
                setMatches(Array.from({ length: 14 }, (_, i) => ({
                    matchOrder: i + 1,
                    homeTeam: "",
                    awayTeam: "",
                    matchDate: `${today.toISOString().split('T')[0]}T16:00`,
                    result: ""
                })))
            } else {
                setMatches([])
            }
        }
        setModalOpen(true)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const token = localStorage.getItem("token")
            const fullDate = new Date(`${drawDate}T${drawTime}:00`)
            const game = games.find(g => g.id === selectedGameId)

            const payload: any = {
                gameId: selectedGameId,
                drawDate: fullDate.toISOString(),
                description: drawDescription || null,
                numbers: winningNumbers ? winningNumbers.split(',').map(n => n.trim()) : []
            }

            if (game?.type === 'PAIPITA_AI') {
                if (matches.length !== 14 || matches.some(m => !m.homeTeam || !m.awayTeam || !m.matchDate)) {
                    showAlert("Erro", "Preencha todos os 14 jogos corretamente.", "error")
                    setSaving(false)
                    return
                }
                payload.matches = matches.map(m => ({
                    homeTeam: m.homeTeam,
                    awayTeam: m.awayTeam,
                    matchDate: new Date(m.matchDate).toISOString(),
                    matchOrder: m.matchOrder,
                    result: m.result || null // Send result if editing
                }))
                // Paipita uses matches, numbers might be derived results?
                // For now keep numbers empty or sync with results? Matches are source of truth.
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
                showAlert("Sucesso", selectedDraw ? "Sorteio atualizado!" : "Sorteio agendado!", "success")
                setModalOpen(false)
                fetchDraws(selectedGameId)
            } else {
                showAlert("Erro", "Erro ao salvar sorteio", "error")
            }
        } catch (e) {
            showAlert("Erro", "Erro ao salvar", "error")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string, drawDate: string) => {
        showAlert(
            "Confirmar Exclusão",
            `Tem certeza que deseja excluir o sorteio de ${new Date(drawDate).toLocaleString('pt-BR')}?`,
            "error",
            true,
            async () => {
                try {
                    const token = localStorage.getItem("token")
                    await fetch(`${API_URL}/draws/${id}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    fetchDraws(selectedGameId)
                    showAlert("Sucesso", "Sorteio excluído", "success")
                } catch (e) { showAlert("Erro", "Erro ao excluir", "error") }
            },
            "Sim, excluir",
            "Cancelar"
        )
    }

    return (
        <div className="space-y-6">
            <StandardPageHeader
                icon={<Calendar className="w-8 h-8 text-emerald-500" />}
                title="Gestão de Sorteios"
                description="Agende, acompanhe e informe os resultados dos sorteios."
                onRefresh={() => selectedGameId && fetchDraws(selectedGameId)}
                refreshing={loading}
            >
                <div className="flex flex-wrap items-center gap-3">
                    <Select value={selectedGameId} onValueChange={setSelectedGameId}>
                        <SelectTrigger className="w-64 h-9 bg-background border-border shadow-sm text-xs font-semibold">
                            <SelectValue placeholder="Selecione um jogo..." />
                        </SelectTrigger>
                        <SelectContent>
                            {games.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    {selectedGameId && (
                        <Button
                            onClick={() => handleOpenModal(null)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-9"
                            size="sm"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Sorteio
                        </Button>
                    )}
                </div>
            </StandardPageHeader>

            {selectedGameId && (
                <Card className="border-border shadow-sm bg-card overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-border">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-emerald-500" />
                            Sorteios Agendados / Realizados
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-muted/50 bg-muted/20 border-b border-border/60">
                                    <TableHead className="pl-6">Série</TableHead>
                                    <TableHead>Data / Hora</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Números Sorteados</TableHead>
                                    <TableHead className="text-right pr-6">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(() => {
                                    const totalItems = (draws || []).length;
                                    const totalPages = mainLimit === "all" ? 1 : Math.ceil(totalItems / mainLimit);
                                    const paginatedDraws = mainLimit === "all" ? (draws || []) : (draws || []).slice((mainPage - 1) * mainLimit, mainPage * mainLimit);

                                    if (loading) return (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-500" />
                                            </TableCell>
                                        </TableRow>
                                    );

                                    if (totalItems === 0) return (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                Nenhum sorteio encontrado. Agende um novo sorteio.
                                            </TableCell>
                                        </TableRow>
                                    );

                                    return (
                                        <>
                                            {paginatedDraws.map(draw => (
                                                <TableRow key={draw.id} className="hover:bg-muted/50 transition-colors">
                                                    <TableCell className="pl-6">
                                                        <Badge variant="outline" className="font-mono bg-background">
                                                            #{draw.series?.toString().padStart(4, '0') || '---'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-1.5 text-foreground font-medium">
                                                                <Calendar className="w-4 h-4 text-emerald-500" />
                                                                {new Date(draw.drawDate).toLocaleString('pt-BR')}
                                                            </div>
                                                            {draw.description && (
                                                                <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold ml-5.5">{draw.description}</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(draw.drawDate) > new Date() ?
                                                            <span className="inline-flex items-center gap-1.5 text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full text-xs font-bold w-fit border border-yellow-200">
                                                                <Clock className="w-3 h-3" />
                                                                Agendado
                                                            </span> :
                                                            draw.numbers && draw.numbers.length > 0 ?
                                                                <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-bold w-fit border border-emerald-200">
                                                                    <CheckCircle className="w-3 h-3" />
                                                                    Realizado
                                                                </span> :
                                                                <span className="inline-flex items-center gap-1.5 text-gray-600 bg-gray-50 px-2 py-0.5 rounded-full text-xs font-bold w-fit border border-gray-200">
                                                                    <AlertCircle className="w-3 h-3" />
                                                                    Pendente
                                                                </span>
                                                        }
                                                    </TableCell>
                                                    <TableCell>
                                                        {draw.numbers && draw.numbers.length > 0 ?
                                                            <div className="flex items-center gap-2">
                                                                <div className="p-1 bg-yellow-100 rounded text-yellow-600 border border-yellow-200">
                                                                    <Trophy className="w-3 h-3" />
                                                                </div>
                                                                <span className="font-mono text-sm tracking-widest font-bold">{draw.numbers.join(' - ')}</span>
                                                            </div> :
                                                            <span className="text-muted-foreground italic text-xs pl-2">-</span>
                                                        }
                                                    </TableCell>
                                                    <TableCell className="text-right flex justify-end gap-2 pr-6 py-2">
                                                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200" onClick={() => handleOpenDetails(draw.id)} title="Ver Detalhes">
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200" onClick={() => handleOpenModal(draw)}>
                                                            <SquarePen className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => handleDelete(draw.id, draw.drawDate)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </>
                                    );
                                })()}
                            </TableBody>
                        </Table>
                        <StandardPagination
                            currentPage={mainPage}
                            totalPages={mainLimit === "all" ? 1 : Math.ceil((draws || []).length / mainLimit)}
                            limit={mainLimit}
                            onPageChange={setMainPage}
                            onLimitChange={(l) => {
                                setMainLimit(l)
                                setMainPage(1)
                            }}
                            totalItems={(draws || []).length}
                        />
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
                            <label className="text-sm font-medium">Data do Concurso</label>
                            <Input type="date" value={drawDate} onChange={e => setDrawDate(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Descrição (Opcional)</label>
                            <Input
                                placeholder="Ex: Rodada 25 - Brasileirão"
                                value={drawDescription}
                                onChange={e => setDrawDescription(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Hora Limite (Fechamento)</label>
                            <Input type="time" value={drawTime} onChange={e => setDrawTime(e.target.value)} />
                        </div>

                        {games.find(g => g.id === selectedGameId)?.type === 'PAIPITA_AI' ? (
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center justify-between">
                                    Lista de Jogos (14 Partidas)
                                    <span className="text-xs font-normal text-muted-foreground">Ordene por horário</span>
                                    <Button type="button" size="sm" variant="outline" onClick={handleOpenImport} className="h-6 text-xs gap-1 ml-auto border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                                        <Download className="w-3 h-3" />
                                        Importar da API
                                    </Button>
                                </label>
                                <div className="border rounded-md overflow-hidden max-h-[50vh] overflow-y-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead className="w-[40px] text-center">#</TableHead>
                                                <TableHead>Mandante vs Visitante</TableHead>
                                                <TableHead className="w-[140px]">Data/Hora</TableHead>
                                                <TableHead className="w-[80px]">Resultado</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {matches.map((match, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="text-center font-bold px-2">{index + 1}</TableCell>
                                                    <TableCell className="p-2">
                                                        <div className="flex flex-col gap-1">
                                                            <Input
                                                                placeholder="Time da Casa"
                                                                className="h-7 text-xs"
                                                                value={match.homeTeam}
                                                                onChange={e => {
                                                                    const newMatches = [...matches];
                                                                    newMatches[index].homeTeam = e.target.value;
                                                                    setMatches(newMatches);
                                                                }}
                                                            />
                                                            <Input
                                                                placeholder="Visitante"
                                                                className="h-7 text-xs"
                                                                value={match.awayTeam}
                                                                onChange={e => {
                                                                    const newMatches = [...matches];
                                                                    newMatches[index].awayTeam = e.target.value;
                                                                    setMatches(newMatches);
                                                                }}
                                                            />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="p-2">
                                                        <Input
                                                            type="datetime-local"
                                                            className="h-8 text-xs px-1"
                                                            value={match.matchDate}
                                                            onChange={e => {
                                                                const newMatches = [...matches];
                                                                newMatches[index].matchDate = e.target.value;
                                                                setMatches(newMatches);
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="p-2">
                                                        <Select
                                                            value={match.result || ""}
                                                            onValueChange={val => {
                                                                const newMatches = [...matches];
                                                                newMatches[index].result = val;
                                                                setMatches(newMatches);
                                                            }}
                                                        >
                                                            <SelectTrigger className="h-8 text-xs">
                                                                <SelectValue placeholder="-" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="1">Casa (1)</SelectItem>
                                                                <SelectItem value="X">Empate (X)</SelectItem>
                                                                <SelectItem value="2">Fora (2)</SelectItem>
                                                                <SelectItem value="CANCELLED">Canc.</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Números Sorteados (separar por vírgula)</label>
                                <Input
                                    placeholder="Ex: 5, 10, 15 ou Deixe em branco se for agendamento"
                                    value={winningNumbers}
                                    onChange={e => setWinningNumbers(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">Deixe em branco se o sorteio ainda não ocorreu.</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
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
                            {drawDetails?.draw?.game?.name} - {drawDetails?.draw?.series ? `#${drawDetails.draw.series}` : ''} - {drawDetails?.draw?.description ? `${drawDetails.draw.description} - ` : ''} {drawDetails?.draw?.drawDate && new Date(drawDetails.draw.drawDate).toLocaleString('pt-BR')}
                        </CardDescription>
                    </DialogHeader>

                    {drawDetails && (
                        <div className="space-y-6">
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="bg-emerald-500/10 border-emerald-500/20 shadow-sm border">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-emerald-600 flex items-center gap-2">
                                            <Tag className="w-4 h-4" />
                                            Total Arrecadado
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-foreground">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(drawDetails.stats.totalSales)}
                                        </div>
                                        <p className="text-xs text-muted-foreground">{drawDetails.stats.ticketCount} apostas</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-yellow-500/10 border-yellow-500/20 shadow-sm border">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-yellow-600 flex items-center gap-2">
                                            <Trophy className="w-4 h-4" />
                                            Bilhetes Premiados
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-foreground">
                                            {drawDetails.stats.winningCount}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Vencedores</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-slate-500/10 border-slate-500/20 shadow-sm border">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" />
                                            Números Sorteados
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-lg font-mono font-bold tracking-widest text-foreground">
                                            {drawDetails.draw.numbers && drawDetails.draw.numbers.length > 0 ? (drawDetails.draw.numbers as number[]).join(' - ') : 'Não realizado'}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Tickets List */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <Ticket className="w-5 h-5 text-emerald-500" />
                                    Bilhetes Participantes
                                </h3>
                                <div className="border rounded-md overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/30">
                                                <TableHead className="pl-4">Bilhete / Hash</TableHead>
                                                <TableHead>Cambista / Área</TableHead>
                                                <TableHead>Números</TableHead>
                                                <TableHead>Valor</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(() => {
                                                const paginatedTickets = detailLimit === "all" ? drawDetails.tickets : drawDetails.tickets.slice((currentPage - 1) * detailLimit, currentPage * detailLimit);

                                                return (
                                                    <>
                                                        {paginatedTickets.map((t: any) => (
                                                            <TableRow key={t.id} className={t.status === 'WON' ? 'bg-yellow-500/10 hover:bg-yellow-500/20' : 'hover:bg-muted/50'}>
                                                                <TableCell className="font-mono text-xs pl-4">
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

                                                        <StandardPagination
                                                            currentPage={currentPage}
                                                            totalPages={detailLimit === "all" ? 1 : Math.ceil(drawDetails.tickets.length / detailLimit)}
                                                            limit={detailLimit}
                                                            onPageChange={setCurrentPage}
                                                            onLimitChange={(l) => {
                                                                setDetailLimit(l)
                                                                setCurrentPage(1)
                                                            }}
                                                            totalItems={drawDetails.tickets.length}
                                                        />
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

            <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Importar Jogos (API)</DialogTitle>
                        <CardDescription>Selecione até 14 jogos para preencher a cartela.</CardDescription>
                    </DialogHeader>

                    <div className="flex items-center gap-2 py-2">
                        <Input type="date" value={importDate} onChange={e => setImportDate(e.target.value)} className="w-auto" />
                        <Button onClick={fetchFixtures} disabled={loadingFixtures}>
                            {loadingFixtures ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                            Buscar Jogos
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto border rounded-md min-h-[300px]">
                        {loadingFixtures ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                            </div>
                        ) : importedFixtures.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
                                <Search className="w-8 h-8 mb-2 opacity-50" />
                                <p>Nenhum jogo encontrado para esta data ou filtro.</p>
                                <p className="text-xs">Tente outra data ou verifique se a API Key está configurada.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[40px]"></TableHead>
                                        <TableHead>Hora</TableHead>
                                        <TableHead>Liga</TableHead>
                                        <TableHead>Mandante</TableHead>
                                        <TableHead>Visitante</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {importedFixtures.map((fixture) => (
                                        <TableRow
                                            key={fixture.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => toggleFixtureSelection(fixture.id.toString())}
                                        >
                                            <TableCell>
                                                <div
                                                    className={`w-4 h-4 rounded border flex items-center justify-center
                                                    ${selectedFixtures.includes(fixture.id.toString()) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-input'}
                                                `}>
                                                    {selectedFixtures.includes(fixture.id.toString()) && <CheckCircle className="w-3 h-3" />}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {new Date(fixture.timestamp * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </TableCell>
                                            <TableCell className="text-xs font-medium text-muted-foreground">
                                                {fixture.league.name}
                                            </TableCell>
                                            <TableCell className="font-semibold text-sm">
                                                <div className="flex items-center gap-2">
                                                    {fixture.homeTeam.logo && <img src={fixture.homeTeam.logo} alt="" className="w-4 h-4 object-contain" />}
                                                    {fixture.homeTeam.name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-semibold text-sm">
                                                <div className="flex items-center gap-2">
                                                    {fixture.awayTeam.logo && <img src={fixture.awayTeam.logo} alt="" className="w-4 h-4 object-contain" />}
                                                    {fixture.awayTeam.name}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>

                    <DialogFooter className="flex items-center justify-between sm:justify-between">
                        <div className="text-sm text-muted-foreground">
                            {selectedFixtures.length} selecionados (Máx 14)
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setImportModalOpen(false)}>Cancelar</Button>
                            <Button onClick={handleImportSelection} disabled={selectedFixtures.length === 0} className="bg-emerald-600 hover:bg-emerald-700">
                                <Download className="w-4 h-4 mr-2" />
                                Importar {selectedFixtures.length} Jogos
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
