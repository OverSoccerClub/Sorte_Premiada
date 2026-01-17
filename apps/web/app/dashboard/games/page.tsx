"use client"

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Pencil, Ticket, Loader2, Settings2, Clock, Shield, DollarSign, Palette, Activity, Check, X, FileText, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { API_URL } from "@/lib/api"
import { useAlert } from "@/context/alert-context"
import { GameFormDialog } from "@/components/games/game-form-dialog"
import { StandardPageHeader } from "@/components/standard-page-header"
import { DisplayConfigDialog } from "@/components/games/display-dialog"
import { RulesDialog } from "@/components/games/rules-dialog"
import { PrizesDialog } from "@/components/games/prizes-dialog"
import { ScheduleDialog } from "@/components/games/schedule-dialog"
import { Switch } from "@/components/ui/switch"
import { useActiveCompanyId } from "@/context/use-active-company"
import { useAuth } from "@/context/auth-context"

interface Game {
    id: string
    name: string
    displayName?: string
    iconName?: string
    colorClass?: string
    isActive: boolean
    price: number
    rules: any
    extractionTimes?: string[]
    // ... other props
    prizeMilhar?: number
    prizeCentena?: number
    prizeDezena?: number
    maxLiability?: number
    prizeMultiplier?: number
    commissionRate?: number
    ticketNumberingMode?: string
    maxTicketsPerSeries?: number
}

export default function GamesPage() {
    const { user } = useAuth()
    const { showAlert } = useAlert()
    const activeCompanyId = useActiveCompanyId()
    const [games, setGames] = useState<Game[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingGame, setEditingGame] = useState<Game | null>(null)

    // Config Modals State
    const [displayModalOpen, setDisplayModalOpen] = useState(false)
    const [rulesModalOpen, setRulesModalOpen] = useState(false)
    const [prizesModalOpen, setPrizesModalOpen] = useState(false)
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
    const [selectedGame, setSelectedGame] = useState<Game | null>(null)

    // Inline Price Edit
    const [editingPriceId, setEditingPriceId] = useState<string | null>(null)
    const [newPrice, setNewPrice] = useState("")

    const fetchGames = async () => {
        setIsLoading(true)
        try {
            const queryParams = new URLSearchParams()
            if (activeCompanyId) {
                queryParams.append('targetCompanyId', activeCompanyId)
            }

            const response = await fetch(`${API_URL}/games?${queryParams.toString()}`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem('token')}`
                }
            })
            if (!response.ok) throw new Error("Falha ao buscar jogos")
            const data = await response.json()
            setGames(data)
        } catch (error) {
            console.error(error)
            showAlert("Erro!", "Erro ao carregar jogos", "error")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchGames()
    }, [activeCompanyId])

    const handleCreateClick = () => {
        setEditingGame(null)
        setIsDialogOpen(true)
    }

    // Config Actions
    const openDisplayConfig = (game: Game) => {
        setSelectedGame(game)
        setDisplayModalOpen(true)
    }

    const openRules = (game: Game) => {
        setSelectedGame(game)
        setRulesModalOpen(true)
    }

    const openPrizes = (game: Game) => {
        setSelectedGame(game)
        setPrizesModalOpen(true)
    }

    const openSchedule = (game: Game) => {
        setSelectedGame(game)
        setScheduleModalOpen(true)
    }

    const toggleActive = async (game: Game) => {
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/games/${game.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ isActive: !game.isActive })
            })

            if (res.ok) {
                showAlert("Sucesso!", game.isActive ? "Jogo desativado" : "Jogo ativado", "success")
                fetchGames()
            } else {
                showAlert("Erro!", "Erro ao alterar status", "error")
            }
        } catch (e) {
            showAlert("Erro!", "Erro ao salvar", "error")
        }
    }

    const startPriceEdit = (game: Game) => {
        setEditingPriceId(game.id)
        setNewPrice(String(game.price))
    }

    const savePrice = async (gameId: string) => {
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/games/${gameId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ price: Number(newPrice) })
            })

            if (res.ok) {
                showAlert("Sucesso!", "Preço atualizado", "success")
                setEditingPriceId(null)
                fetchGames()
            } else {
                showAlert("Erro!", "Erro ao atualizar", "error")
            }
        } catch (e) {
            showAlert("Erro!", "Erro ao salvar", "error")
        }
    }

    return (
        <div className="space-y-6">
            <StandardPageHeader
                icon={<Ticket className="w-8 h-8 text-emerald-500" />}
                title="Gestão de Jogos"
                description="Central de controle dos jogos: Preços, Regras, Prêmios e Horários."
                onRefresh={fetchGames}
                refreshing={isLoading}
            >
                {games.some(g => g.name.includes('2x1000') || g.displayName?.includes('2x1000')) && (
                    <Link href="/dashboard/games/2x1000">
                        <Button variant="outline" size="sm" className="hidden sm:flex">
                            <FileText className="w-4 h-4 mr-2" />
                            Relatório 2x1000
                        </Button>
                    </Link>
                )}
                {games.some(g => g.name.toLowerCase().includes('loteria') || g.name.toLowerCase().includes('tradicional') || g.name.toLowerCase().includes('bicho') || g.displayName?.toLowerCase().includes('jb') || g.displayName?.toLowerCase().includes('lt')) && (
                    <Link href="/dashboard/games/loteria-tradicional">
                        <Button variant="outline" size="sm" className="hidden sm:flex">
                            <FileText className="w-4 h-4 mr-2" />
                            Relatório JB
                        </Button>
                    </Link>
                )}
                <Link href="/dashboard/games/series-stats">
                    <Button variant="outline" size="sm" className="hidden sm:flex">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Estatísticas de Séries
                    </Button>
                </Link>
                {user?.role === 'MASTER' && (
                    <Button onClick={handleCreateClick} className="bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
                        <Plus className="w-4 h-4 mr-2" /> Novo Jogo
                    </Button>
                )}
            </StandardPageHeader>

            {isLoading ? (
                <div className="flex items-center justify-center h-[400px]">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {games.map((game) => (
                        <Card key={game.id} className={`flex flex-col hover:shadow-lg transition-all duration-200 border-muted group relative ${!game.isActive ? 'opacity-90 grayscale-[0.5]' : ''}`}>
                            <CardHeader className="space-y-1 pb-3">
                                <div className="flex items-center justify-between">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${game.colorClass || 'bg-emerald-600'} text-white shadow-lg`}>
                                        <Ticket className="w-6 h-6" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={game.isActive}
                                            onCheckedChange={() => toggleActive(game)}
                                            className="data-[state=checked]:bg-emerald-600"
                                            title={game.isActive ? "Desativar Jogo" : "Ativar Jogo"}
                                        />
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <CardTitle className="text-xl group-hover:text-emerald-500 transition-colors flex items-center justify-between">
                                        {game.displayName || game.name}
                                        {editingPriceId === game.id ? (
                                            <div className="flex items-center gap-1">
                                                <Input
                                                    type="number"
                                                    value={newPrice}
                                                    onChange={e => setNewPrice(e.target.value)}
                                                    className="h-7 w-20 text-right px-1"
                                                    autoFocus
                                                />
                                                <Button size="icon" className="h-7 w-7 bg-emerald-600" onClick={() => savePrice(game.id)}>
                                                    <Check className="w-3 h-3" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingPriceId(null)}>
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div
                                                className="text-sm font-semibold bg-emerald-50 text-emerald-700 px-2 py-1 rounded cursor-pointer hover:bg-emerald-100 border border-emerald-100"
                                                onClick={() => startPriceEdit(game)}
                                                title="Clique para editar preço"
                                            >
                                                R$ {Number(game.price).toFixed(2)}
                                            </div>
                                        )}

                                    </CardTitle>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {game.extractionTimes && game.extractionTimes.length > 0
                                            ? `${game.extractionTimes.length} extrações diárias`
                                            : "Sem horários definidos"
                                        }
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 pb-2">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex flex-col bg-muted/30 p-2 rounded">
                                        <span className="text-muted-foreground">Risco Máx</span>
                                        <span className="font-medium text-foreground">R$ {game.maxLiability || 0}</span>
                                    </div>
                                    <div className="flex flex-col bg-muted/30 p-2 rounded">
                                        <span className="text-muted-foreground">Mult. Prêmios</span>
                                        <span className="font-medium text-foreground">{game.prizeMultiplier || 0}x</span>
                                    </div>
                                    <div className="flex flex-col bg-muted/30 p-2 rounded">
                                        <span className="text-muted-foreground">Comissão</span>
                                        <span className="font-medium text-foreground">{game.commissionRate || 0}%</span>
                                    </div>
                                    <div className="flex flex-col bg-muted/30 p-2 rounded">
                                        <span className="text-muted-foreground">Prêmio Milhar</span>
                                        <span className="font-medium text-foreground">R$ {game.prizeMilhar || 0}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-2 border-t border-border grid grid-cols-4 gap-1 p-2">
                                <Button variant="ghost" size="sm" className="flex flex-col h-14 gap-1 text-[10px] items-center justify-center text-muted-foreground hover:bg-violet-50 hover:text-violet-600" onClick={() => openDisplayConfig(game)}>
                                    <Palette className="w-5 h-5" />
                                    Visual
                                </Button>
                                <Button variant="ghost" size="sm" className="flex flex-col h-14 gap-1 text-[10px] items-center justify-center text-muted-foreground hover:bg-blue-50 hover:text-blue-600" onClick={() => openRules(game)}>
                                    <Shield className="w-5 h-5" />
                                    Regras
                                </Button>
                                <Button variant="ghost" size="sm" className="flex flex-col h-14 gap-1 text-[10px] items-center justify-center text-muted-foreground hover:bg-amber-50 hover:text-amber-600" onClick={() => openPrizes(game)}>
                                    <DollarSign className="w-5 h-5" />
                                    Prêmios
                                </Button>
                                <Button variant="ghost" size="sm" className="flex flex-col h-14 gap-1 text-[10px] items-center justify-center text-muted-foreground hover:bg-emerald-50 hover:text-emerald-600" onClick={() => openSchedule(game)}>
                                    <Clock className="w-5 h-5" />
                                    Horários
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}

                    {games.length === 0 && (
                        <div className="col-span-full text-center py-20 text-muted-foreground">
                            Nenhum jogo encontrado.
                        </div>
                    )}
                </div>
            )}

            <GameFormDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                gameToEdit={editingGame}
                onSuccess={fetchGames}
            />

            <DisplayConfigDialog
                open={displayModalOpen}
                onOpenChange={setDisplayModalOpen}
                game={selectedGame}
                onSuccess={fetchGames}
            />

            <RulesDialog
                open={rulesModalOpen}
                onOpenChange={setRulesModalOpen}
                game={selectedGame}
                onSuccess={fetchGames}
            />

            <PrizesDialog
                open={prizesModalOpen}
                onOpenChange={setPrizesModalOpen}
                game={selectedGame}
                onSuccess={fetchGames}
            />

            <ScheduleDialog
                open={scheduleModalOpen}
                onOpenChange={setScheduleModalOpen}
                game={selectedGame}
                onSuccess={fetchGames}
            />
        </div>
    )
}
