"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import Link from "next/link"
import { ArrowRight, Ticket, Pencil, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { API_URL } from "@/lib/api"
import { toast } from "sonner"

// Interface para o Jogo vindo da API
interface Game {
    id: string
    name: string
    rules: any
    price: number
    status?: string // Caso venha do backend ou a gente defina padrão
    // Campos visuais que vamos manter mapeados ou gerar padrão
    description?: string
    href?: string
    color?: string
    secondChanceEnabled?: boolean
    secondChanceRangeStart?: number
    secondChanceRangeEnd?: number
    secondChanceDrawTime?: string
    secondChanceWeekday?: number
}

const GAME_METADATA: Record<string, { description: string, href: string, color: string, status: string }> = {
    "2x1000": {
        description: "Clássico 2x1000. Sorteios diários.",
        href: "/dashboard/games/2x1000",
        color: "bg-emerald-500",
        status: "Ativo"
    },
    "jb": {
        description: "Tradicional. Grupo, Dezena, Centena, Milhar.",
        href: "/dashboard/games/jb",
        color: "bg-amber-500",
        status: "Novo"
    }
}

export default function GamesPage() {
    const [games, setGames] = useState<Game[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [editingGame, setEditingGame] = useState<Game | null>(null)
    const [newName, setNewName] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // State for Second Chance
    const [scEnabled, setScEnabled] = useState(false)
    const [scStart, setScStart] = useState("")
    const [scEnd, setScEnd] = useState("")
    const [scTime, setScTime] = useState("")
    const [scWeekday, setScWeekday] = useState("6")

    const fetchGames = async () => {
        try {
            const response = await fetch(`${API_URL}/games`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem('token')}`
                }
            })
            if (!response.ok) throw new Error("Falha ao buscar jogos")
            const data = await response.json()
            setGames(data)
        } catch (error) {
            console.error(error)
            toast.error("Erro ao carregar jogos")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchGames()
    }, [])

    const handleEditClick = (game: Game) => {
        setEditingGame(game)
        setNewName(game.name)

        // Populate Second Chance
        setScEnabled(game.secondChanceEnabled || false)
        setScStart(game.secondChanceRangeStart?.toString() || "")
        setScEnd(game.secondChanceRangeEnd?.toString() || "")
        setScTime(game.secondChanceDrawTime || "19:00")
        setScWeekday(game.secondChanceWeekday?.toString() || "6") // Default Saturday

        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!editingGame) return

        setIsSaving(true)
        try {
            const payload: any = {
                name: newName,
                secondChanceEnabled: scEnabled,
                secondChanceDrawTime: scTime,
                secondChanceWeekday: parseInt(scWeekday)
            };

            if (scStart) payload.secondChanceRangeStart = parseInt(scStart);
            if (scEnd) payload.secondChanceRangeEnd = parseInt(scEnd);

            const response = await fetch(`${API_URL}/games/${editingGame.id}`, {
                method: "POST", // O controller usa @Post(':id') para update
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem('token')}` // Assumindo auth via token no localStorage
                },
                body: JSON.stringify(payload)
            })

            if (!response.ok) throw new Error("Falha ao atualizar jogo")

            toast.success("Jogo atualizado com sucesso")
            setIsDialogOpen(false)
            fetchGames() // Recarrega a lista
        } catch (error) {
            console.error(error)
            toast.error("Erro ao atualizar jogo")
        } finally {
            setIsSaving(false)
        }
    }

    // Helper para obter metadados ou fallback
    const getGameMetadata = (game: Game) => {
        // Tenta match por ID ou nome (para legacy support dos hardcoded)
        // Como o ID é UUID no banco mas era string simples no mock ("2x1000"), 
        // talvez precisemos de uma lógica mais robusta se os IDs do banco não baterem com as chaves do metadata.
        // Vamos tentar match por nome se ID falhar, ou usar defaults.

        let meta = GAME_METADATA[game.id] || Object.values(GAME_METADATA).find(m => game.name.toLowerCase().includes("bicho") && m.href.includes("jb") || game.name.includes("2x1000") && m.href.includes("2x1000"));

        if (!meta) {
            // Fallback para jogos não mapeados
            meta = {
                description: "Jogo disponível para apostas.",
                href: `/dashboard/games/${game.id}`, // Rota genérica ou a definir
                color: "bg-blue-500",
                status: "Ativo"
            }
        }
        return meta
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <Ticket className="w-8 h-8 text-emerald-500" />
                    </div>
                    Relatório por Jogo
                </h2>
                <p className="text-muted-foreground mt-1 ml-14">Selecione um jogo para visualizar as vendas e apostas realizadas.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {games.map((game) => {
                    const meta = getGameMetadata(game)
                    return (
                        <Card key={game.id} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-muted group relative">
                            <div className="absolute top-4 right-4 z-10">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleEditClick(game)
                                    }}
                                >
                                    <Pencil className="w-4 h-4" />
                                </Button>
                            </div>
                            <Link href={meta.href}>
                                <CardHeader className="space-y-1">
                                    <div className="flex items-center justify-between mr-8">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${meta.color} text-white shadow-lg`}>
                                            <Ticket className="w-6 h-6" />
                                        </div>
                                        <Badge variant={meta.status === "Novo" ? "default" : "secondary"}>
                                            {meta.status}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-xl pt-4 group-hover:text-emerald-500 transition-colors">
                                        {game.name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground text-sm mb-4">
                                        {meta.description}
                                    </p>
                                    <div className="flex items-center text-sm font-medium text-emerald-500">
                                        Ver Vendas <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </CardContent>
                            </Link>
                        </Card>
                    )
                })}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Editar Configurações do Jogo</DialogTitle>
                        <DialogDescription>
                            Ajuste os parâmetros do jogo e funcionalidade de Segunda Chance.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Nome
                            </Label>
                            <Input
                                id="name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="col-span-3"
                            />
                        </div>

                        {/* Divider */}
                        <div className="border-t border-border/50" />

                        {/* Second Chance Config */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Ticket className="w-5 h-5" /> Segunda Chance
                            </h3>

                            <div className="flex items-center gap-3 ml-1">
                                <input
                                    type="checkbox"
                                    id="scEnabled"
                                    checked={scEnabled}
                                    onChange={(e) => setScEnabled(e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <Label htmlFor="scEnabled" className="cursor-pointer">Habilitar Sorteio Extra (Segunda Chance)</Label>
                            </div>

                            {scEnabled && (
                                <div className="grid grid-cols-2 gap-4 ml-1 p-4 bg-muted/40 rounded-lg border border-border/50">
                                    <div>
                                        <Label htmlFor="scWeekday">Dia do Sorteio</Label>
                                        <select
                                            id="scWeekday"
                                            value={scWeekday}
                                            onChange={(e) => setScWeekday(e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="6">Sábado</option>
                                            <option value="0">Domingo</option>
                                            <option value="1">Segunda</option>
                                            <option value="2">Terça</option>
                                            <option value="3">Quarta</option>
                                            <option value="4">Quinta</option>
                                            <option value="5">Sexta</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label htmlFor="scTime">Horário (HH:mm)</Label>
                                        <Input
                                            id="scTime"
                                            value={scTime}
                                            onChange={(e) => setScTime(e.target.value)}
                                            placeholder="19:00"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="scStart">Range Inicial</Label>
                                        <Input
                                            id="scStart"
                                            value={scStart}
                                            onChange={(e) => setScStart(e.target.value)}
                                            placeholder="Ex: 122300"
                                            type="number"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="scEnd">Range Final</Label>
                                        <Input
                                            id="scEnd"
                                            value={scEnd}
                                            onChange={(e) => setScEnd(e.target.value)}
                                            placeholder="Ex: 125500"
                                            type="number"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Alterações
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
