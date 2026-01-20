"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useAlert } from "@/context/alert-context"
import { API_URL } from "@/lib/api"
import { Loader2, Calendar, Trophy, Trash2, Eye, Plus, User, MapPin, Hash, DollarSign, Clock } from "lucide-react"
import { StandardPageHeader } from "@/components/standard-page-header"
import { StandardPagination } from "@/components/standard-pagination"
import { useActiveCompanyId } from "@/context/use-active-company"

export default function SecondChancePage() {
    const activeCompanyId = useActiveCompanyId()
    const { showAlert } = useAlert()
    const [games, setGames] = useState<any[]>([])
    const [draws, setDraws] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)

    // Details Modal State
    const [detailModalOpen, setDetailModalOpen] = useState(false)
    const [detailType, setDetailType] = useState<'winners' | 'participants'>('winners')
    const [winners, setWinners] = useState<any[]>([])
    const [participants, setParticipants] = useState<any[]>([])
    const [selectedDraw, setSelectedDraw] = useState<any>(null)
    const [loadingDetails, setLoadingDetails] = useState(false)

    // Form State
    const [selectedGameId, setSelectedGameId] = useState("")
    const [drawDate, setDrawDate] = useState(new Date().toISOString().split('T')[0])
    const [winningNumber, setWinningNumber] = useState("")
    const [prizeAmount, setPrizeAmount] = useState("")
    const [saving, setSaving] = useState(false)

    // Main Table Pagination State
    const [mainPage, setMainPage] = useState(1)
    const [mainLimit, setMainLimit] = useState<number | "all">(10)

    // Upcoming Draw State
    const [upcoming, setUpcoming] = useState<any[]>([])

    useEffect(() => {
        fetchGames()
        fetchDraws()
        fetchUpcoming()
    }, [activeCompanyId])

    const fetchUpcoming = async () => {
        try {
            const token = localStorage.getItem("token")
            const queryParams = new URLSearchParams()
            if (activeCompanyId) queryParams.append('targetCompanyId', activeCompanyId)

            const res = await fetch(`${API_URL}/second-chance-draws/upcoming?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                setUpcoming(await res.json())
            }
        } catch (e) { console.error("Erro ao carregar próximos números", e) }
    }

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
                setGames(data.filter((g: any) => g.secondChanceEnabled))
            }
        } catch (e) { showAlert("Erro!", "Erro ao carregar jogos", "error") }
    }

    const fetchDraws = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem("token")
            const queryParams = new URLSearchParams()
            if (activeCompanyId) queryParams.append('targetCompanyId', activeCompanyId)

            const res = await fetch(`${API_URL}/second-chance-draws?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) setDraws(await res.json())
        } catch (e) { showAlert("Erro!", "Erro ao carregar históricos", "error") }
        finally { setLoading(false) }
    }

    const handleOpenWinners = async (draw: any) => {
        setSelectedDraw(draw)
        setDetailType('winners')
        setDetailModalOpen(true)
        setLoadingDetails(true)
        try {
            const token = localStorage.getItem("token")
            let url = `${API_URL}/second-chance-draws/${draw.id}/winners`
            if (activeCompanyId) url += `?targetCompanyId=${activeCompanyId}`

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                setWinners(await res.json())
            } else {
                showAlert("Erro!", "Erro ao carregar ganhadores", "error")
            }
        } catch (error) {
            showAlert("Erro!", "Erro de conexão", "error")
        } finally {
            setLoadingDetails(false)
        }
    }

    const handleOpenParticipants = async (draw: any) => {
        setSelectedDraw(draw)
        setDetailType('participants')
        setDetailModalOpen(true)
        setLoadingDetails(true)
        try {
            const token = localStorage.getItem("token")
            let url = `${API_URL}/second-chance-draws/${draw.id}/participants`
            if (activeCompanyId) url += `?targetCompanyId=${activeCompanyId}`

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                setParticipants(await res.json())
            } else {
                showAlert("Erro!", "Erro ao carregar participantes", "error")
            }
        } catch (error) {
            showAlert("Erro!", "Erro de conexão", "error")
        } finally {
            setLoadingDetails(false)
        }
    }

    const handleSave = async () => {
        if (!selectedGameId || !winningNumber || !prizeAmount) {
            showAlert("Atenção!", "Preencha todos os campos", "warning")
            return
        }

        setSaving(true)
        try {
            const token = localStorage.getItem("token")
            let url = `${API_URL}/second-chance-draws`
            if (activeCompanyId) url += `?targetCompanyId=${activeCompanyId}`

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    gameId: selectedGameId,
                    drawDate: drawDate,
                    winningNumber: Number(winningNumber),
                    prizeAmount: Number(prizeAmount)
                })
            })

            if (res.ok) {
                showAlert("Sucesso!", "Sorteio registrado e ganhadores processados!", "success")
                setModalOpen(false)
                fetchDraws()
                // Reset form
                setWinningNumber("")
                setPrizeAmount("")
            } else {
                const err = await res.json()
                showAlert("Erro!", err.message || "Erro ao salvar sorteio", "error")
            }
        } catch (e) {
            showAlert("Erro!", "Erro ao salvar", "error")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        showAlert("Atenção!", "Tem certeza que deseja excluir este registro? (Isso não estornará os créditos já lançados)", "warning", true, async () => {
            try {
                const token = localStorage.getItem("token")
                let url = `${API_URL}/second-chance-draws/${id}`
                if (activeCompanyId) url += `?targetCompanyId=${activeCompanyId}`

                await fetch(url, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                })
                fetchDraws()
                showAlert("Sucesso!", "Registro removido", "success")
            } catch (e) { showAlert("Erro!", "Erro ao excluir", "error") }
        })
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <StandardPageHeader
                icon={<Trophy className="w-8 h-8 text-yellow-500" />}
                title="Gestão Segunda Chance"
                description="Controle total dos sorteios de sábado, premiações e ganhadores."
                onRefresh={() => { fetchDraws(); fetchUpcoming(); }}
                refreshing={loading}
            >
                <Button
                    onClick={() => setModalOpen(true)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white h-9"
                    size="sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Lançar Resultado
                </Button>
            </StandardPageHeader>

            {/* Upcoming Draw Section */}
            {Array.isArray(upcoming) && upcoming.length > 0 && (
                <div className="grid gap-6">
                    {upcoming.map((group: any) => (
                        <Card key={group.gameId} className="border-yellow-200 bg-yellow-50/30">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2 text-yellow-800">
                                    <Clock className="w-5 h-5" />
                                    Próximo Sorteio: {new Date(group.date).toLocaleDateString('pt-BR')}
                                    <span className="ml-auto text-sm font-normal text-muted-foreground bg-white/50 px-2 py-1 rounded-md border border-yellow-100">
                                        Jogo: {group.gameName}
                                    </span>
                                </CardTitle>
                                <CardDescription>
                                    Números concorrendo automaticamente para este jogo.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {group.numbers.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Nenhum número gerado ainda.</p>
                                ) : (
                                    <>
                                        <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                            {group.numbers.map((num: number) => (
                                                <Badge key={num} variant="secondary" className="font-mono bg-white border-yellow-200 text-yellow-800 hover:bg-yellow-100">
                                                    {num.toString().padStart(4, '0')}
                                                </Badge>
                                            ))}
                                        </div>
                                        <div className="mt-2 text-xs text-muted-foreground text-right">
                                            Total: <strong>{group.numbers.length}</strong> números.
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Card className="border-border shadow-sm">
                <CardHeader className="bg-muted/30 border-b border-border py-4">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-yellow-500" />
                        Histórico de Sorteios de Sábado
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/20">
                                <TableHead className="pl-6">Data</TableHead>
                                <TableHead>Jogo</TableHead>
                                <TableHead>Número Sorteado</TableHead>
                                <TableHead>Prêmio (p/ ganhador)</TableHead>
                                <TableHead className="text-right pr-6">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-yellow-500" />
                                    </TableCell>
                                </TableRow>
                            ) : draws.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        Nenhum sorteio registrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                draws.slice((mainPage - 1) * (mainLimit === "all" ? draws.length : mainLimit), mainPage * (mainLimit === "all" ? draws.length : mainLimit)).map((draw) => (
                                    <TableRow key={draw.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="pl-6 font-medium">
                                            {new Date(draw.drawDate).toLocaleDateString('pt-BR')}
                                        </TableCell>
                                        <TableCell>{draw.game?.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-mono text-lg bg-yellow-50 text-yellow-700 border-yellow-200 py-1 px-3">
                                                {draw.winningNumber.toString().padStart(4, '0')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-semibold text-emerald-600">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(draw.prizeAmount))}
                                        </TableCell>
                                        <TableCell className="text-right pr-6 py-2">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 gap-2 text-primary border-primary/20 hover:bg-primary/5"
                                                    onClick={() => handleOpenParticipants(draw)}
                                                >
                                                    <Hash className="w-4 h-4" />
                                                    Participantes
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                                                    onClick={() => handleOpenWinners(draw)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Ganhadores
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50"
                                                    onClick={() => handleDelete(draw.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    <StandardPagination
                        currentPage={mainPage}
                        totalPages={mainLimit === "all" ? 1 : Math.ceil(draws.length / mainLimit)}
                        limit={mainLimit}
                        onPageChange={setMainPage}
                        onLimitChange={(l) => {
                            setMainLimit(l)
                            setMainPage(1)
                        }}
                        totalItems={draws.length}
                    />
                </CardContent>
            </Card>

            {/* Modal: Lançar Resultado */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Lançar Resultado Segunda Chance</DialogTitle>
                        <CardDescription>Informe o resultado oficial do sorteio de sábado.</CardDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Jogo</label>
                            <Select value={selectedGameId} onValueChange={setSelectedGameId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o jogo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {games.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Data do Sorteio (Sábado)</label>
                            <Input type="date" value={drawDate} onChange={e => setDrawDate(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Número Sorteado</label>
                                <Input
                                    placeholder="Ex: 1234"
                                    type="number"
                                    value={winningNumber}
                                    onChange={e => setWinningNumber(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Prêmio Individual</label>
                                <Input
                                    placeholder="Ex: 500.00"
                                    type="number"
                                    step="0.01"
                                    value={prizeAmount}
                                    onChange={e => setPrizeAmount(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-yellow-600 hover:bg-yellow-700">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trophy className="h-4 w-4 mr-2" />}
                            Processar Sorteio
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal: Detalhes (Ganhadores ou Participantes) */}
            <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {detailType === 'winners' ? <Trophy className="w-5 h-5 text-yellow-500" /> : <Hash className="w-5 h-5 text-blue-500" />}
                            {detailType === 'winners' ? "Ganhadores" : "Participantes"}: Sorteio {selectedDraw && new Date(selectedDraw.drawDate).toLocaleDateString('pt-BR')}
                        </DialogTitle>
                        <CardDescription>
                            Número: <span className="font-bold text-foreground font-mono">{selectedDraw?.winningNumber.toString().padStart(4, '0')}</span> •
                            Prêmio: <span className="font-bold text-emerald-600">{selectedDraw && new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(selectedDraw.prizeAmount))}</span>
                        </CardDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto mt-4 border rounded-md">
                        <Table>
                            <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                <TableRow>
                                    <TableHead className="pl-4">Bilhete/Hash</TableHead>
                                    <TableHead>Número SC</TableHead>
                                    <TableHead>Cambista</TableHead>
                                    <TableHead>Área / Cidade</TableHead>
                                    <TableHead className="text-right pr-4">Valor Aposta</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingDetails ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-yellow-500" />
                                        </TableCell>
                                    </TableRow>
                                ) : (detailType === 'winners' ? winners : participants).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                            A lista está vazia.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    (detailType === 'winners' ? winners : participants).map((item) => (
                                        <TableRow key={item.id} className={detailType === 'winners' ? 'bg-yellow-50/50' : ''}>
                                            <TableCell className="pl-4">
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-xs font-bold">{item.id.slice(0, 8)}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase">{item.hash}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`font-mono text-xs ${item.secondChanceNumber === selectedDraw?.winningNumber ? 'bg-green-100 text-green-700 border-green-300' : 'text-muted-foreground'}`}>
                                                    {item.secondChanceNumber}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <User className="w-3 h-3 text-muted-foreground" />
                                                    <span className="font-medium">{item.user?.name || item.user?.username}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-3 h-3 text-muted-foreground" />
                                                    <span className="text-sm">{item.user?.area?.name || item.user?.area?.city || '---'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-4">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(item.amount))}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
