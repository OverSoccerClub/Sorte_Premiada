"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAlert } from "@/context/alert-context"
import { API_URL } from "@/lib/api"
import { Loader2, Trophy, Clock, Calendar, CheckCircle, AlertCircle, ShoppingCart } from "lucide-react"

export default function PaipitaAiBettingPage() {
    const { showAlert } = useAlert()
    const [loading, setLoading] = useState(true)
    const [game, setGame] = useState<any>(null)
    const [activeDraw, setActiveDraw] = useState<any>(null)
    const [selections, setSelections] = useState<Record<number, string>>({})
    const [submitting, setSubmitting] = useState(false)
    const [ticketAmount, setTicketAmount] = useState("2.00") // Default value?
    const [cambistaId, setCambistaId] = useState("") // Only if needed or auto-detected

    useEffect(() => {
        fetchGameAndDraws()
    }, [])

    const fetchGameAndDraws = async () => {
        try {
            const token = localStorage.getItem("token")
            // 1. Get Game
            const gamesRes = await fetch(`${API_URL}/games`, { headers: { Authorization: `Bearer ${token}` } })
            if (!gamesRes.ok) throw new Error("Falha ao carregar jogos")
            const games = await gamesRes.json()
            const paipitaGame = games.find((g: any) => g.type === 'PAIPITA_AI')

            if (paipitaGame) {
                setGame(paipitaGame)
                // 2. Get Draws
                const drawsRes = await fetch(`${API_URL}/draws?gameId=${paipitaGame.id}`, { headers: { Authorization: `Bearer ${token}` } })
                if (drawsRes.ok) {
                    const draws = await drawsRes.json()
                    // Filter for active draws (future date) and pick the soonest
                    const now = new Date()
                    const openDraw = draws
                        .filter((d: any) => new Date(d.drawDate) > now)
                        .sort((a: any, b: any) => new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime())[0]

                    if (openDraw) {
                        // Ensure matches are sorted
                        if (openDraw.matches) {
                            openDraw.matches.sort((a: any, b: any) => a.matchOrder - b.matchOrder)
                        }
                        setActiveDraw(openDraw)
                    }
                }
            }
        } catch (e) {
            console.error(e)
            showAlert("Erro", "Erro ao carregar dados do jogo", "error")
        } finally {
            setLoading(false)
        }
    }

    const handleSelection = (matchOrder: number, value: string) => {
        setSelections(prev => ({
            ...prev,
            [matchOrder]: value
        }))
    }

    const handleSubmit = async () => {
        if (!activeDraw) return

        // Validate 14 selections
        if (Object.keys(selections).length !== 14) {
            showAlert("Atenção", `Você precisa palpitar em todos os 14 jogos. Faltam ${14 - Object.keys(selections).length}.`, "warning")
            return
        }

        setSubmitting(true)
        try {
            const token = localStorage.getItem("token")

            // Convert selections to ordered array
            const numbers = []
            for (let i = 1; i <= 14; i++) {
                numbers.push(selections[i])
            }

            const payload = {
                gameId: game.id,
                drawId: activeDraw.id, // Usually ticket is linked to draw via game logic or explicit drawId if supported
                // If the API CreateTicketDto doesn't explicitly take drawId, it might infer from date or game. 
                // But for Loteca-style, it MUST be linked to a specific Draw.
                // Assuming the backend handles "Open Draw for Game" or I send drawId if backend supports it.
                // Looking at standard TicketService, it often takes `gameId` and `numbers`.
                // If multiple draws exist, it might pick the open one. 
                // However, updated backend might need `drawId`?
                // Checking previous implementation plan: "Bloquear aposta se jogo já começou".
                // I'll send `numbers`. The backend `create` usually finds the active draw or we might need to modify backend if it doesn't support explicit drawId in DTO.
                // For now, I will send `numbers` and `amount`.
                numbers: numbers,
                amount: parseFloat(ticketAmount)
            }

            const res = await fetch(`${API_URL}/tickets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                const data = await res.json()
                showAlert("Sucesso!", `Aposta realizada! Bilhete: ${data.hash?.substring(0, 8)}`, "success")
                setSelections({}) // Reset
            } else {
                const err = await res.json()
                showAlert("Erro", err.message || "Erro ao realizar aposta", "error")
            }
        } catch (e) {
            showAlert("Erro", "Erro ao conectar com servidor", "error")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        )
    }

    if (!game) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
                <AlertCircle className="w-10 h-10 mb-2" />
                <p>Jogo Palpita Ai não encontrado.</p>
            </div>
        )
    }

    if (!activeDraw) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
                <Calendar className="w-10 h-10 mb-2" />
                <p>Nenhum concurso aberto para apostas no momento.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Trophy className="w-8 h-8 text-yellow-500" />
                        Palpita Ai
                    </h2>
                    <p className="text-muted-foreground">Faça seus 14 palpites e concorra!</p>
                </div>
                <div className="bg-muted px-4 py-2 rounded-lg border border-border flex items-center gap-3">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    <div className="text-sm">
                        <p className="font-semibold text-foreground">Fechamento</p>
                        <p className="text-muted-foreground">
                            {new Date(activeDraw.drawDate).toLocaleDateString('pt-BR')} às {new Date(activeDraw.drawDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>
            </div>

            <Card className="border-border shadow-md">
                <CardHeader className="bg-muted/30 pb-4">
                    <CardTitle className="text-lg flex justify-between">
                        <span>Concurso #{activeDraw.id.substring(0, 8)}</span>
                        <span className="text-sm font-normal text-muted-foreground">
                            {Object.keys(selections).length}/14 Selecionados
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-border">
                        {activeDraw.matches && activeDraw.matches.map((match: any, index: number) => (
                            <div key={match.id || index} className="p-4 hover:bg-muted/20 transition-colors">
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    <div className="flex-none w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-muted-foreground">
                                        {match.matchOrder}
                                    </div>

                                    <div className="flex-1 grid grid-cols-3 gap-2 items-center text-center">
                                        {/* Home Team */}
                                        <div className="text-right font-medium text-sm md:text-base truncate pr-2">
                                            {match.homeTeam}
                                        </div>

                                        {/* VS / Date */}
                                        <div className="flex flex-col items-center justify-center">
                                            <span className="text-xs text-muted-foreground font-mono">VS</span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {new Date(match.matchDate).toLocaleDateString('pt-BR', { weekday: 'short' })}
                                            </span>
                                        </div>

                                        {/* Away Team */}
                                        <div className="text-left font-medium text-sm md:text-base truncate pl-2">
                                            {match.awayTeam}
                                        </div>
                                    </div>

                                    {/* Selection Buttons */}
                                    <div className="flex-none flex items-center justify-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                                        <Button
                                            variant={selections[match.matchOrder] === '1' ? "default" : "outline"}
                                            className={`w-12 h-10 font-bold ${selections[match.matchOrder] === '1' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                                            onClick={() => handleSelection(match.matchOrder, '1')}
                                        >
                                            1
                                        </Button>
                                        <Button
                                            variant={selections[match.matchOrder] === 'X' ? "default" : "outline"}
                                            className={`w-12 h-10 font-bold ${selections[match.matchOrder] === 'X' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                                            onClick={() => handleSelection(match.matchOrder, 'X')}
                                        >
                                            X
                                        </Button>
                                        <Button
                                            variant={selections[match.matchOrder] === '2' ? "default" : "outline"}
                                            className={`w-12 h-10 font-bold ${selections[match.matchOrder] === '2' ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                                            onClick={() => handleSelection(match.matchOrder, '2')}
                                        >
                                            2
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Footer / Value */}
            <div className="fixed bottom-0 left-0 right-0 md:left-64 p-4 bg-background border-t border-border z-10 shadow-lg">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase">Valor da Aposta</span>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-emerald-500">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(ticketAmount))}
                            </span>
                            {/* Input hidden for now or editable if variable price */}
                            {/* <Input 
                                type="number" 
                                value={ticketAmount} 
                                onChange={e => setTicketAmount(e.target.value)} 
                                className="w-24 h-8"
                            /> */}
                        </div>
                    </div>
                    <Button
                        size="lg"
                        onClick={handleSubmit}
                        disabled={submitting || Object.keys(selections).length !== 14 || !activeDraw}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                        Finalizar Aposta
                    </Button>
                </div>
            </div>
        </div>
    )
}
