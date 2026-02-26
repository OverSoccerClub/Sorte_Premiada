import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { API_URL } from "@/lib/api"
import { useAlert } from "@/context/alert-context"
import { Loader2, Save } from "lucide-react"

import { useActiveCompanyId } from "@/context/use-active-company"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface GameFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    gameToEdit: any | null
    onSuccess: () => void
}

export function GameFormDialog({ open, onOpenChange, gameToEdit, onSuccess }: GameFormDialogProps) {
    const { showAlert } = useAlert()
    const activeCompanyId = useActiveCompanyId()
    const [name, setName] = useState("")
    const [price, setPrice] = useState("5.00")
    const [type, setType] = useState("GENERIC")
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (open) {
            if (gameToEdit) {
                setName(gameToEdit.name)
                setPrice(String(gameToEdit.price))
                setType(gameToEdit.type || "GENERIC")
            } else {
                setName("")
                setPrice("5.00")
                setType("GENERIC")
            }
        }
    }, [open, gameToEdit])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const token = localStorage.getItem("token")
            const url = gameToEdit ? `${API_URL}/games/${gameToEdit.id}` : `${API_URL}/games`
            const method = gameToEdit ? 'PATCH' : 'POST'

            const payload = {
                name,
                price: parseFloat(price),
                type,
                targetCompanyId: activeCompanyId,
                // Default values for new games
                ...(!gameToEdit && {
                    isActive: true,
                    rules: {},
                    extractionTimes: []
                })
            }

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            if (!response.ok) throw new Error("Erro ao salvar jogo")

            showAlert("Sucesso!", gameToEdit ? "Jogo atualizado!" : "Jogo criado com sucesso!", "success")
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            showAlert("Erro!", "Falha ao salvar. Verifique os dados.", "error")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{gameToEdit ? "Editar Jogo" : "Novo Jogo"}</DialogTitle>
                    <DialogDescription>
                        Defina as informações básicas do jogo. Configurações avançadas (Regras, Horários, Visual) podem ser editadas após a criação.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="type">Tipo de Jogo</Label>
                        <Select value={type} onValueChange={setType} disabled={!!gameToEdit}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="GENERIC">Padrão / Outros</SelectItem>
                                <SelectItem value="PAIPITA_AI">Palpita Ai (Loteca)</SelectItem>
                                <SelectItem value="2X1000">2x1000 (Milhar)</SelectItem>
                                <SelectItem value="LOTERIA_TRADICIONAL">Loteria Tradicional (Bicho)</SelectItem>
                                <SelectItem value="MINUTO_SORTE">Minuto da Sorte</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground">O tipo define as regras de validação e interface. Não pode ser alterado após criar.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Nome do Jogo</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Seninha, Bicho, 2x1000"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="price">Preço Padrão (R$)</Label>
                        <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading || !name} className="bg-emerald-600 hover:bg-emerald-700">
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            {gameToEdit ? "Salvar Alterações" : "Criar Jogo"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
