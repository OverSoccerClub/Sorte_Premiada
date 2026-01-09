import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { API_URL } from "@/lib/api"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"

import { useActiveCompanyId } from "@/context/use-active-company"

interface GameFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    gameToEdit: any | null
    onSuccess: () => void
}

export function GameFormDialog({ open, onOpenChange, gameToEdit, onSuccess }: GameFormDialogProps) {
    const activeCompanyId = useActiveCompanyId()
    const [name, setName] = useState("")
    const [price, setPrice] = useState("5.00")
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (open) {
            if (gameToEdit) {
                setName(gameToEdit.name)
                setPrice(String(gameToEdit.price))
            } else {
                setName("")
                setPrice("5.00")
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

            toast.success(gameToEdit ? "Jogo atualizado!" : "Jogo criado com sucesso!")
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error("Falha ao salvar. Verifique os dados.")
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
