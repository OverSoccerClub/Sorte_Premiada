"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { API_URL } from "@/lib/api"
import { Loader2, Ticket } from "lucide-react"

const ANIMALS = [
    { id: 1, name: "Avestruz" }, { id: 2, name: "Águia" }, { id: 3, name: "Burro" }, { id: 4, name: "Borboleta" },
    { id: 5, name: "Cachorro" }, { id: 6, name: "Cabra" }, { id: 7, name: "Carneiro" }, { id: 8, name: "Camelo" },
    { id: 9, name: "Cobra" }, { id: 10, name: "Coelho" }, { id: 11, name: "Cavalo" }, { id: 12, name: "Elefante" },
    { id: 13, name: "Galo" }, { id: 14, name: "Gato" }, { id: 15, name: "Jacaré" }, { id: 16, name: "Leão" },
    { id: 17, name: "Macaco" }, { id: 18, name: "Porco" }, { id: 19, name: "Pavão" }, { id: 20, name: "Peru" },
    { id: 21, name: "Touro" }, { id: 22, name: "Tigre" }, { id: 23, name: "Urso" }, { id: 24, name: "Veado" },
    { id: 25, name: "Vaca" }
]

export default function JogoDoBichoPage() {
    const [modality, setModality] = useState("GRUPO")
    const [selectedNumbers, setSelectedNumbers] = useState<number[]>([])
    const [inputValue, setInputValue] = useState("")
    const [loading, setLoading] = useState(false)
    const [gameId, setGameId] = useState<string | null>(null)

    useEffect(() => {
        // Fetch Game ID
        const fetchGame = async () => {
            try {
                const token = localStorage.getItem("token")
                const res = await fetch(`${API_URL}/games`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (res.ok) {
                    const games = await res.json()
                    const game = games.find((g: any) => g.name === "Jogo do Bicho")
                    if (game) setGameId(game.id)
                }
            } catch (e) {
                console.error(e)
            }
        }
        fetchGame()
    }, [])

    const toggleNumber = (num: number) => {
        if (selectedNumbers.includes(num)) {
            setSelectedNumbers(selectedNumbers.filter(n => n !== num))
        } else {
            setSelectedNumbers([...selectedNumbers, num])
        }
    }

    const handleAddInput = () => {
        const num = parseInt(inputValue)
        if (isNaN(num)) return

        if (modality === 'DEZENA' && (num < 0 || num > 99)) return toast.error("Dezena inválida (00-99)")
        if (modality === 'CENTENA' && (num < 0 || num > 999)) return toast.error("Centena inválida (000-999)")
        if (modality === 'MILHAR' && (num < 0 || num > 9999)) return toast.error("Milhar inválida (0000-9999)")

        if (selectedNumbers.includes(num)) return toast.warning("Número já adicionado")

        setSelectedNumbers([...selectedNumbers, num])
        setInputValue("")
    }

    const handleBet = async () => {
        if (!gameId) return toast.error("Jogo não carregado")
        if (selectedNumbers.length === 0) return toast.warning("Selecione números")

        setLoading(true)
        try {
            const token = localStorage.getItem("token")
            const payload = {
                gameType: `JB-${modality}`,
                numbers: selectedNumbers,
                amount: 10.00,
                game: { connect: { id: gameId } }
            }

            const res = await fetch(`${API_URL}/tickets`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast.success("Aposta realizada com sucesso!")
                setSelectedNumbers([])
            } else {
                const err = await res.text()
                toast.error(`Erro: ${err}`)
            }
        } catch (e) {
            toast.error("Erro de conexão")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Jogo do Bicho</h2>
                    <p className="text-muted-foreground">{modality}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium">Selecionados: {selectedNumbers.length}</p>
                    <p className="text-xl font-bold text-emerald-500">R$ 10,00</p>
                </div>
            </div>

            <Tabs value={modality} onValueChange={(v) => { setModality(v); setSelectedNumbers([]) }} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="GRUPO">Grupo</TabsTrigger>
                    <TabsTrigger value="DEZENA">Dezena</TabsTrigger>
                    <TabsTrigger value="CENTENA">Centena</TabsTrigger>
                    <TabsTrigger value="MILHAR">Milhar</TabsTrigger>
                </TabsList>
            </Tabs>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Faça sua aposta</CardTitle>
                </CardHeader>
                <CardContent>
                    {modality === 'GRUPO' ? (
                        <div className="grid grid-cols-5 gap-2">
                            {ANIMALS.map(animal => (
                                <Button
                                    key={animal.id}
                                    variant={selectedNumbers.includes(animal.id) ? "default" : "outline"}
                                    className={`h-20 flex flex-col gap-1 ${selectedNumbers.includes(animal.id) ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                                    onClick={() => toggleNumber(animal.id)}
                                >
                                    <span className="text-lg font-bold">{animal.id.toString().padStart(2, '0')}</span>
                                    <span className="text-xs uppercase">{animal.name}</span>
                                </Button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex gap-4">
                            <Input
                                type="number"
                                placeholder={`Digite ${modality.toLowerCase()}...`}
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                className="text-lg"
                                onKeyDown={e => e.key === 'Enter' && handleAddInput()}
                            />
                            <Button onClick={handleAddInput} size="lg">Adicionar</Button>
                        </div>
                    )}

                    {modality !== 'GRUPO' && (
                        <div className="flex flex-wrap gap-2 mt-4">
                            {selectedNumbers.map(n => (
                                <div key={n} onClick={() => toggleNumber(n)} className="bg-slate-100 px-3 py-1 rounded-full text-slate-800 font-bold border border-slate-200 cursor-pointer hover:bg-red-100 hover:text-red-600 transition-colors">
                                    {n.toString().padStart(modality === 'MILHAR' ? 4 : modality === 'CENTENA' ? 3 : 2, '0')}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-8 pt-4 border-t">
                        <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg"
                            onClick={handleBet}
                            disabled={loading || selectedNumbers.length === 0}
                        >
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Ticket className="mr-2 h-5 w-5" />}
                            Confirmar Aposta
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
