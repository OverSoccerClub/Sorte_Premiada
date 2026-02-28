"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { API_URL } from "@/lib/api"
import { Loader2, Calendar, Trophy, Trash2, Clock, CheckCircle, Plus, Search, MapPin, AlertCircle, RefreshCw } from "lucide-react"
import { StandardPageHeader } from "@/components/standard-page-header"
import { StandardPagination } from "@/components/standard-pagination"
import { useActiveCompanyId } from "@/context/use-active-company"
import { useAlert } from "@/context/alert-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PalpitaPage() {
    const activeCompanyId = useActiveCompanyId()
    const { showAlert } = useAlert()
    const router = useRouter() // For navigation to details
    const [draws, setDraws] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [games, setGames] = useState<any[]>([])
    const [selectedGameId, setSelectedGameId] = useState<string>("")

    // Create Modal State
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedDrawId, setSelectedDrawId] = useState<string | null>(null)
    const [drawDate, setDrawDate] = useState(new Date().toISOString().split('T')[0])
    const [drawTime, setDrawTime] = useState("16:00")
    const [matches, setMatches] = useState<any[]>(Array.from({ length: 14 }, (_, i) => ({
        matchOrder: i + 1,
        homeTeam: "",
        awayTeam: "",
        matchDate: "",
        result: null
    })))
    const [saving, setSaving] = useState(false)

    // Import State
    const [importModalOpen, setImportModalOpen] = useState(false)
    const [importDate, setImportDate] = useState(new Date().toISOString().split('T')[0])
    const [importedFixtures, setImportedFixtures] = useState<any[]>([])
    const [loadingFixtures, setLoadingFixtures] = useState(false)
    const [selectedFixtures, setSelectedFixtures] = useState<string[]>([])

    useEffect(() => {
        if (activeCompanyId) {
            fetchGames()
        }
    }, [activeCompanyId])

    useEffect(() => {
        if (selectedGameId) {
            fetchDraws()
        }
    }, [selectedGameId])

    const fetchGames = async () => {
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/games?targetCompanyId=${activeCompanyId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                // Filter for Palpita games
                const palpitaGames = data.filter((g: any) => g.type === 'PAIPITA_AI')
                setGames(palpitaGames)
                if (palpitaGames.length > 0) {
                    setSelectedGameId(palpitaGames[0].id)
                }
            }
        } catch (e) {
            showAlert("Erro", "Erro ao carregar jogos", "error")
        }
    }

    const fetchDraws = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem("token")
            const queryParams = new URLSearchParams()
            if (selectedGameId) queryParams.append('gameId', selectedGameId)
            if (activeCompanyId) queryParams.append('targetCompanyId', activeCompanyId)

            const res = await fetch(`${API_URL}/draws?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setDraws(data)
            }
        } catch (e) {
            showAlert("Erro", "Erro ao carregar sorteios", "error")
        } finally {
            setLoading(false)
        }
    }

    const fetchFixtures = async () => {
        setLoadingFixtures(true)
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/football/fixtures?date=${importDate}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                if (data.fixtures) {
                    setImportedFixtures(data.fixtures)
                } else if (data.warning) {
                    showAlert("Aviso", data.warning, "warning")
                    setImportedFixtures([])
                }
            }
        } catch (e) {
            showAlert("Erro", "Erro ao buscar jogos na API", "error")
        } finally {
            setLoadingFixtures(false)
        }
    }

    const handleImportSelection = () => {
        const selected = importedFixtures.filter(f => selectedFixtures.includes(f.id.toString()))

        const newMatches = selected.map((f, i) => ({
            matchOrder: i + 1,
            homeTeam: f.homeTeam.name,
            awayTeam: f.awayTeam.name,
            matchDate: new Date(f.timestamp * 1000).toISOString(),
            result: null
        }))

        // Fill remaining or truncate
        const currentMatches = [...newMatches]
        if (currentMatches.length < 14) {
            for (let i = currentMatches.length; i < 14; i++) {
                currentMatches.push({
                    matchOrder: i + 1,
                    homeTeam: "",
                    awayTeam: "",
                    matchDate: new Date().toISOString(), // Default
                    result: null
                })
            }
        } else if (currentMatches.length > 14) {
            currentMatches.length = 14
        }
        currentMatches.forEach((m, i) => m.matchOrder = i + 1)

        setMatches(currentMatches)
        setImportModalOpen(false)
    }

    const toggleFixtureSelection = (id: string) => {
        setSelectedFixtures(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id)
            if (prev.length >= 14) return prev
            return [...prev, id]
        })
    }

    const handleEdit = (draw: any) => {
        setSelectedDrawId(draw.id)

        // Parse date and time
        const dateObj = new Date(draw.drawDate)
        setDrawDate(dateObj.toISOString().split('T')[0])
        setDrawTime(dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))

        // Set matches
        if (draw.matches && draw.matches.length > 0) {
            const sortedMatches = [...draw.matches].sort((a, b) => a.matchOrder - b.matchOrder)
            setMatches(sortedMatches)
        } else {
            // Fallback if no matches
            setMatches(Array.from({ length: 14 }, (_, i) => ({
                matchOrder: i + 1,
                homeTeam: "",
                awayTeam: "",
                matchDate: new Date().toISOString(),
                result: null
            })))
        }

        setModalOpen(true)
    }

    const handleNew = () => {
        setSelectedDrawId(null)
        setDrawDate(new Date().toISOString().split('T')[0])
        setDrawTime("16:00")
        setMatches(Array.from({ length: 14 }, (_, i) => ({
            matchOrder: i + 1,
            homeTeam: "",
            awayTeam: "",
            matchDate: "",
            result: null
        })))
        setModalOpen(true)
    }

    const handleSave = async () => {
        if (!selectedGameId) return
        setSaving(true)
        try {
            const token = localStorage.getItem("token")
            const fullDate = new Date(`${drawDate}T${drawTime}:00`)

            const payload = {
                gameId: selectedGameId,
                drawDate: fullDate.toISOString(),
                description: `Concurso ${fullDate.toLocaleDateString('pt-BR')}`,
                matches: matches.map(m => ({
                    ...m,
                    matchDate: m.matchDate || new Date().toISOString(), // Safety
                    result: null
                })),
                numbers: [] // Empty for Palpita initially
            }

            const queryParams = new URLSearchParams()
            if (activeCompanyId) queryParams.append('targetCompanyId', activeCompanyId)

            const url = selectedDrawId
                ? `${API_URL}/draws/${selectedDrawId}?${queryParams.toString()}`
                : `${API_URL}/draws?${queryParams.toString()}`
            const method = selectedDrawId ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                showAlert("Sucesso", selectedDrawId ? "Concurso Atualizado!" : "Novo Concurso Criado!", "success")
                setModalOpen(false)
                fetchDraws()
            } else {
                showAlert("Erro", selectedDrawId ? "Falha ao atualizar concurso" : "Falha ao criar concurso", "error")
            }
        } catch (e) {
            showAlert("Erro", "Erro ao salvar", "error")
        } finally {
            setSaving(false)
        }
        const handleSeedTest = async () => {
            setSaving(true)
            try {
                const token = localStorage.getItem("token")
                const res = await fetch(`${API_URL}/draws/seed-palpita`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })

                if (res.ok) {
                    showAlert("Sucesso", "Concurso de teste gerado com sucesso!", "success")
                    fetchDraws()
                } else {
                    showAlert("Erro", "Falha ao gerar concurso de teste", "error")
                }
            } catch (e) {
                showAlert("Erro", "Erro de comunicação ao gerar seed", "error")
            } finally {
                setSaving(false)
            }
        }

        return (
            <div className="space-y-6">
                <StandardPageHeader
                    icon={<Trophy className="w-8 h-8 text-yellow-500" />}
                    title="Palpita Ai - Gestão de Concursos"
                    description="Crie e gerencie os concursos da loteria esportiva."
                    onRefresh={fetchDraws}
                    refreshing={loading}
                >
                    <div className="flex gap-2">
                        {games.length > 0 && (
                            <Select value={selectedGameId} onValueChange={setSelectedGameId}>
                                <SelectTrigger className="w-[200px] h-9">
                                    <SelectValue placeholder="Selecione o Jogo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {games.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                        <Button onClick={handleSeedTest} disabled={saving} variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 h-9">
                            <RefreshCw className="w-4 h-4 mr-2" /> Gerar Teste
                        </Button>
                        <Button onClick={handleNew} className="bg-emerald-600 hover:bg-emerald-700 h-9">
                            <Plus className="w-4 h-4 mr-2" /> Novo Concurso
                        </Button>
                    </div>
                </StandardPageHeader>

                <Card>
                    <CardHeader>
                        <CardTitle>Concursos Recentes</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-6">Concurso</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Jogos</TableHead>
                                    <TableHead>Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">
                                            <Loader2 className="animate-spin w-8 h-8 text-emerald-500 mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : draws.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            Nenhum concurso encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    draws.map(draw => (
                                        <TableRow key={draw.id}>
                                            <TableCell className="pl-6 font-mono font-bold">
                                                #{draw.series?.toString().padStart(4, '0') || '---'}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(draw.drawDate).toLocaleString('pt-BR')}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={draw.numbers?.length > 0 ? "default" : "outline"} className={draw.numbers?.length > 0 ? "bg-emerald-500" : ""}>
                                                    {draw.numbers?.length > 0 ? "Finalizado" : "Em Aberto"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground">{draw.matches?.length || 0} jogos</span>
                                            </TableCell>
                                            <TableCell className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={() => handleEdit(draw)}>
                                                    Editar
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/palpita/${draw.id}`)}>
                                                    Detalhes / Apurar
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Modal Novo Concurso */}
                <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{selectedDrawId ? "Editar Concurso" : "Novo Concurso Palpita Ai"}</DialogTitle>
                            <DialogDescription>Selecione a data de encerramento e os 14 jogos.</DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-2 gap-4 my-4">
                            <div>
                                <label className="text-sm font-medium">Data do Sorteio/Encerramento</label>
                                <Input type="date" value={drawDate} onChange={e => setDrawDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Hora</label>
                                <Input type="time" value={drawTime} onChange={e => setDrawTime(e.target.value)} />
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold">Grade de Jogos (14)</h3>
                            <Button variant="secondary" size="sm" onClick={() => setImportModalOpen(true)}>
                                <Search className="w-4 h-4 mr-2" /> Importar da API
                            </Button>
                        </div>

                        <div className="space-y-2 border rounded-md p-2 bg-muted/20">
                            {matches.map((match, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                    <span className="w-6 font-mono font-bold text-muted-foreground">{match.matchOrder}</span>
                                    <Input
                                        placeholder="Casa"
                                        value={match.homeTeam}
                                        onChange={e => {
                                            const newMatches = [...matches];
                                            newMatches[idx].homeTeam = e.target.value;
                                            setMatches(newMatches);
                                        }}
                                        className="flex-1 h-8"
                                    />
                                    <span className="text-xs font-bold text-muted-foreground">X</span>
                                    <Input
                                        placeholder="Fora"
                                        value={match.awayTeam}
                                        onChange={e => {
                                            const newMatches = [...matches];
                                            newMatches[idx].awayTeam = e.target.value;
                                            setMatches(newMatches);
                                        }}
                                        className="flex-1 h-8"
                                    />
                                    <Input
                                        type="datetime-local"
                                        value={match.matchDate ? new Date(match.matchDate).toISOString().slice(0, 16) : ""}
                                        onChange={e => {
                                            const newMatches = [...matches];
                                            newMatches[idx].matchDate = e.target.value;
                                            setMatches(newMatches);
                                        }}
                                        className="w-40 h-8 text-xs"
                                    />
                                </div>
                            ))}
                        </div>

                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar Concurso"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Modal Importar da API */}
                <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Importar Jogos da API</DialogTitle>
                        </DialogHeader>
                        <div className="flex gap-2 my-4">
                            <Input type="date" value={importDate} onChange={e => setImportDate(e.target.value)} />
                            <Button onClick={fetchFixtures} disabled={loadingFixtures}>
                                {loadingFixtures ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
                            </Button>
                        </div>

                        <div className="h-[400px] overflow-y-auto border rounded-md p-2">
                            {importedFixtures.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground">Nenhum jogo encontrado para esta data.</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">Sel.</TableHead>
                                            <TableHead>Liga</TableHead>
                                            <TableHead>Jogo</TableHead>
                                            <TableHead>Hora</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {importedFixtures.map(f => (
                                            <TableRow key={f.id} onClick={() => toggleFixtureSelection(f.id.toString())} className="cursor-pointer hover:bg-muted">
                                                <TableCell>
                                                    <div className={`w-4 h-4 border rounded ${selectedFixtures.includes(f.id.toString()) ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`} />
                                                </TableCell>
                                                <TableCell className="text-xs">{f.league.name}</TableCell>
                                                <TableCell className="text-xs font-semibold">
                                                    {f.homeTeam.name} x {f.awayTeam.name}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {new Date(f.timestamp * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>

                        <div className="flex justify-between items-center text-sm">
                            <span>{selectedFixtures.length} selecionados (Máx 14)</span>
                            <Button onClick={handleImportSelection} disabled={selectedFixtures.length === 0} className="bg-emerald-600">
                                Confirmar Importação
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        )
    }
