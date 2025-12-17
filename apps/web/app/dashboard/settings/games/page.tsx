
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { API_URL } from "@/lib/api"
import { Loader2, Ticket, Save, Check, X, SquarePen } from "lucide-react"

export default function GameSettingsPage() {
    const [games, setGames] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editPrice, setEditPrice] = useState<string>("")
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchGames()
    }, [])

    const fetchGames = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/games`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setGames(data)
            }
        } catch (e) {
            toast.error("Erro ao carregar jogos")
        } finally {
            setLoading(false)
        }
    }

    const startEditing = (game: any) => {
        setEditingId(game.id)
        setEditPrice(game.price ? Number(game.price).toFixed(2) : "0.00")
    }

    const cancelEditing = () => {
        setEditingId(null)
        setEditPrice("")
    }

    const savePrice = async (gameId: string) => {
        setSaving(true)
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/games/${gameId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ price: Number(editPrice) })
            })

            if (res.ok) {
                toast.success("Preço atualizado com sucesso")
                fetchGames()
                cancelEditing()
            } else {
                toast.error("Erro ao atualizar preço")
            }
        } catch (e) {
            toast.error("Erro ao salvar")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <Ticket className="w-8 h-8 text-emerald-500" />
                    </div>
                    Configuração de Jogos
                </h2>
                <p className="text-muted-foreground mt-1 ml-14">Defina o valor de venda para cada jogo.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Jogos Disponíveis</CardTitle>
                    <CardDescription>Gerencie os preços dos jogos listados no sistema.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome do Jogo</TableHead>
                                    <TableHead>Preço Atual</TableHead>
                                    <TableHead className="w-[150px]">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-500" />
                                        </TableCell>
                                    </TableRow>
                                ) : games.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                            Nenhum jogo encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    games.map((game) => (
                                        <TableRow key={game.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Ticket className="w-4 h-4 text-emerald-500" />
                                                    {game.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {editingId === game.id ? (
                                                    <Input
                                                        type="number"
                                                        value={editPrice}
                                                        onChange={(e) => setEditPrice(e.target.value)}
                                                        className="w-32"
                                                        step="0.01"
                                                    />
                                                ) : (
                                                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                                                        <span className="text-xs text-muted-foreground">R$</span>
                                                        {new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2 }).format(Number(game.price || 0))}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {editingId === game.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <Button size="sm" onClick={() => savePrice(game.id)} disabled={saving}>
                                                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                        </Button>
                                                        <Button size="sm" variant="ghost" onClick={cancelEditing} disabled={saving}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => startEditing(game)}>
                                                        <SquarePen className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
