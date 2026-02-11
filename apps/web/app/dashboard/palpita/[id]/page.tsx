"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { API_URL } from "@/lib/api"
import { Loader2, ArrowLeft, Save, Play, CheckCircle, XCircle } from "lucide-react"
import { StandardPageHeader } from "@/components/standard-page-header"
import { useAlert } from "@/context/alert-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PalpitaDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const { showAlert } = useAlert()
    const [draw, setDraw] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [stats, setStats] = useState<any>(null)
    const [winners, setWinners] = useState<any[]>([])

    // Match Results State
    // We map 14 matches to results 'H' (Home), 'D' (Draw), 'A' (Away)
    const [results, setResults] = useState<Record<number, string>>({})
    const [scores, setScores] = useState<Record<number, { home: string, away: string }>>({})

    useEffect(() => {
        if (params.id) {
            fetchDetails()
        }
    }, [params.id])

    const fetchDetails = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/draws/${params.id}/details`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setDraw(data.draw)
                setStats(data.stats)
                setWinners(data.tickets.filter((t: any) => t.status === 'WON'))

                // Initialize results from draw data
                const initialResults: any = {}
                const initialScores: any = {}
                if (data.draw.matches) {
                    data.draw.matches.forEach((m: any) => {
                        if (m.result) initialResults[m.matchOrder] = m.result
                        // If we had score fields, we would populate them here. 
                        // For now we just use the result 'H'/'D'/'A' directly or infer it.
                        initialScores[m.matchOrder] = { home: "", away: "" }
                    })
                }
                setResults(initialResults)
                setScores(initialScores)
            }
        } catch (e) {
            showAlert("Erro", "Erro ao carregar detalhes", "error")
        } finally {
            setLoading(false)
        }
    }

    const handleResultChange = (matchOrder: number, value: string) => {
        setResults(prev => ({ ...prev, [matchOrder]: value }))
    }

    const saveResults = async () => {
        setProcessing(true)
        try {
            const token = localStorage.getItem("token")
            // Prepare payload
            const matches = draw.matches.map((m: any) => ({
                ...m,
                matchDate: new Date(m.matchDate).toISOString(), // Ensure format
                result: results[m.matchOrder] || null
            }))

            const payload = {
                matches
                // We keep 'numbers' empty or set it to a representation of results
                // But the backend uses matches.result
            }

            const res = await fetch(`${API_URL}/draws/${draw.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                showAlert("Sucesso", "Resultados Salvos!", "success")
                fetchDetails()
            }
        } catch (e) {
            showAlert("Erro", "Erro ao salvar resultados", "error")
        } finally {
            setProcessing(false)
        }
    }

    const processDraw = async () => {
        // Validation: All 14 matches must have a result
        const missing = draw.matches.some((m: any) => !results[m.matchOrder])
        if (missing) {
            showAlert("Atenção", "Informe o resultado de todos os 14 jogos antes de apurar.", "warning")
            return
        }

        showAlert(
            "Confirmar Apuração",
            "Deseja calcular a premiação? Isso irá gerar os pagamentos para os vencedores.",
            "info",
            true,
            async () => {
                setProcessing(true)
                try {
                    // Updating calls the same endpoint, but passing 'numbers' or triggering logic?
                    // The backend logic runs "if (updatedDraw.numbers ...)" OR we can rely on matches result check.
                    // Wait, `draws.service.ts` logic triggers in `update` ONLY IF `numbers` has length > 0.
                    // BUT for PALPITA AI, we changed logic to check `fullDraw.matches`.
                    // Does it auto-trigger on every update? 
                    // No, `update` calls `processDrawResults` ONLY if `numbers.length > 0`.
                    // I MUST send a dummy 'numbers' array to trigger it, OR update the service to trigger on matches update too.
                    // FIX: I will send a dummy 'numbers' array (e.g. ["1","2"]) just to trigger the processor, 
                    // or better, I rely on my recent edit to `draws.service.ts`?
                    // My edit was in `processDrawResults`. 
                    // `update` calls `processDrawResults` inside transaction.
                    // Let's check `update` in `draws.service.ts`:
                    // `if (updatedDraw.numbers && ... length > 0) { await this.processDrawResults... }`
                    // So I MUST send numbers.
                    // I will send the results string as numbers array: ["H", "D", "A", ...].

                    const efficientArray = Array.from({ length: 14 }, (_, i) => results[i + 1] || "X")

                    const token = localStorage.getItem("token")
                    const payload = {
                        gameId: draw.gameId, // Validates existence
                        numbers: efficientArray, // Triggers processing
                        matches: draw.matches.map((m: any) => ({
                            ...m,
                            matchDate: new Date(m.matchDate).toISOString(),
                            result: results[m.matchOrder]
                        }))
                    }

                    const res = await fetch(`${API_URL}/draws/${draw.id}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify(payload)
                    })

                    if (res.ok) {
                        showAlert("Sucesso", "Apuração Realizada com Sucesso!", "success")
                        fetchDetails()
                    } else {
                        showAlert("Erro", "Erro ao apurar", "error")
                    }
                } catch (e) {
                    showAlert("Erro", "Erro na requisição", "error")
                } finally {
                    setProcessing(false)
                }
            }
        )
    }

    if (loading || !draw) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-500" /></div>
    }

    return (
        <div className="space-y-6">
            <StandardPageHeader
                icon={<ArrowLeft className="w-6 h-6 cursor-pointer" onClick={() => router.back()} />}
                title={`Detalhes do Concurso #${draw.series || draw.code || '---'}`}
                description={`Data: ${new Date(draw.drawDate).toLocaleString('pt-BR')}`}
            >
                <div className="flex gap-2">
                    <Button variant="outline" onClick={saveResults} disabled={processing}>
                        <Save className="w-4 h-4 mr-2" /> Salvar Resultados
                    </Button>
                    <Button onClick={processDraw} disabled={processing} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                        <Play className="w-4 h-4 mr-2" /> Apurar / Finalizar
                    </Button>
                </div>
            </StandardPageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Board de Jogos */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Grade de 14 Jogos</CardTitle>
                        <CardDescription>Defina o resultado (Casa, Empate, Fora) para apurar.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10">#</TableHead>
                                    <TableHead className="text-right">Casa</TableHead>
                                    <TableHead className="text-center w-20">X</TableHead>
                                    <TableHead>Fora</TableHead>
                                    <TableHead className="text-center">Resultado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {draw.matches?.sort((a: any, b: any) => a.matchOrder - b.matchOrder).map((match: any) => (
                                    <TableRow key={match.id}>
                                        <TableCell className="font-bold">{match.matchOrder}</TableCell>
                                        <TableCell className="text-right font-medium">{match.homeTeam}</TableCell>
                                        <TableCell className="text-center text-xs text-muted-foreground">vs</TableCell>
                                        <TableCell className="font-medium">{match.awayTeam}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center gap-1">
                                                <Button
                                                    size="sm"
                                                    variant={results[match.matchOrder] === 'H' ? "default" : "outline"}
                                                    className={`w-8 h-8 p-0 ${results[match.matchOrder] === 'H' ? 'bg-emerald-600' : ''}`}
                                                    onClick={() => handleResultChange(match.matchOrder, 'H')}
                                                >
                                                    C
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant={results[match.matchOrder] === 'D' ? "default" : "outline"}
                                                    className={`w-8 h-8 p-0 ${results[match.matchOrder] === 'D' ? 'bg-blue-600' : ''}`}
                                                    onClick={() => handleResultChange(match.matchOrder, 'D')}
                                                >
                                                    E
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant={results[match.matchOrder] === 'A' ? "default" : "outline"}
                                                    className={`w-8 h-8 p-0 ${results[match.matchOrder] === 'A' ? 'bg-red-600' : ''}`}
                                                    onClick={() => handleResultChange(match.matchOrder, 'A')}
                                                >
                                                    F
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Resumo e Ganhadores */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Resumo Financeiro</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-muted-foreground">Arrecadação Total</span>
                                <span className="font-bold text-lg">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.totalSales || 0)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-muted-foreground">Prêmio Distribuído</span>
                                <span className="font-bold text-lg text-emerald-600">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.totalPrizes || 0)}
                                </span>
                            </div>
                            <div className="text-xs text-muted-foreground text-center">
                                {stats?.ticketCount} apostas participantes
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Ganhadores ({winners.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                            {winners.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground">Nenhum ganhador apurado ainda.</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nome</TableHead>
                                            <TableHead>Prêmio</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {winners.map(w => (
                                            <TableRow key={w.id}>
                                                <TableCell className="text-sm">
                                                    <div className="font-medium">{w.user?.name || w.user?.username || 'Anônimo'}</div>
                                                    <div className="text-[10px] text-muted-foreground">{w.id.slice(0, 8)}...</div>
                                                </TableCell>
                                                <TableCell className="text-sm font-bold text-emerald-600">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(w.possiblePrize))}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
