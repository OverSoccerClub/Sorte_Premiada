"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Ticket, Loader2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { API_URL } from "@/lib/api"
import { toast } from "sonner"
import { GameFormDialog } from "@/components/games/game-form-dialog"
import { StandardPageHeader } from "@/components/standard-page-header"

// Interface para o Jogo vindo da API
interface Game {
    id: string
    name: string
    displayName?: string
    iconName?: string
    colorClass?: string
    isActive: boolean
    price: number
    rules: any
    // ... outros campos que vem da API
}

export default function GamesPage() {
    const [games, setGames] = useState<Game[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingGame, setEditingGame] = useState<Game | null>(null)

    const fetchGames = async () => {
        setIsLoading(true)
        try {
            // Fetch all games (active and inactive) for admin
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

    const handleCreateClick = () => {
        setEditingGame(null)
        setIsDialogOpen(true)
    }

    const handleEditClick = (game: Game) => {
        setEditingGame(game)
        setIsDialogOpen(true)
    }

    return (
        <div className="space-y-6">
            <StandardPageHeader
                icon={<Ticket className="w-8 h-8 text-emerald-500" />}
                title="Gerenciamento de Jogos"
                description="Configure os jogos disponíveis, preços, prêmios e horários de sorteio."
                onRefresh={fetchGames}
                refreshing={isLoading}
            >
                <Link href="/dashboard/games/2x1000">
                    <Button variant="outline" size="sm">
                        Relatório 2x1000
                    </Button>
                </Link>
                <Link href="/dashboard/games/jb">
                    <Button variant="outline" size="sm">
                        Relatório JB
                    </Button>
                </Link>
                <Button onClick={handleCreateClick} className="bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
                    <Plus className="w-4 h-4 mr-2" /> Novo Jogo
                </Button>
            </StandardPageHeader>

            {isLoading ? (
                <div className="flex items-center justify-center h-[400px]">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {games.map((game) => (
                        <Card key={game.id} className={`hover:shadow-lg transition-all duration-200 border-muted group relative ${!game.isActive ? 'opacity-75 grayscale' : ''}`}>
                            <div className="absolute top-4 right-4 z-10 w-auto">
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-8 w-8 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleEditClick(game)
                                    }}
                                >
                                    <Pencil className="w-4 h-4" />
                                </Button>
                            </div>

                            <CardHeader className="space-y-1">
                                <div className="flex items-center justify-between mr-8">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${game.colorClass || 'bg-emerald-600'} text-white shadow-lg`}>
                                        <Ticket className="w-6 h-6" />
                                    </div>
                                    <Badge variant={game.isActive ? "default" : "destructive"}>
                                        {game.isActive ? "Ativo" : "Inativo"}
                                    </Badge>
                                </div>
                                <CardTitle className="text-xl pt-4 group-hover:text-emerald-500 transition-colors">
                                    {game.displayName || game.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm text-muted-foreground">
                                    <div className="flex justify-between">
                                        <span>Preço do Bilhete:</span>
                                        <span className="font-semibold text-foreground">R$ {game.price ? Number(game.price).toFixed(2) : '0.00'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {games.length === 0 && (
                        <div className="col-span-full text-center py-10 text-muted-foreground">
                            Nenhum jogo cadastrado. Clique em "Novo Jogo" para começar.
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
        </div>
    )
}
