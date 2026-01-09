import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { API_URL } from "@/lib/api"

interface PrizesDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    game: any
    onSuccess: () => void
}

export function PrizesDialog({ open, onOpenChange, game, onSuccess }: PrizesDialogProps) {
    const [prizeValues, setPrizeValues] = useState({ milhar: "", centena: "", dezena: "" })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (open && game) {
            setPrizeValues({
                milhar: game.prizeMilhar ? String(Number(game.prizeMilhar)) : "5000",
                centena: game.prizeCentena ? String(Number(game.prizeCentena)) : "600",
                dezena: game.prizeDezena ? String(Number(game.prizeDezena)) : "60"
            })
        }
    }, [open, game])

    const savePrizes = async () => {
        if (!game) return
        setSaving(true)
        try {
            const token = localStorage.getItem("token")

            const payload = {
                prizeMilhar: Number(prizeValues.milhar),
                prizeCentena: Number(prizeValues.centena),
                prizeDezena: Number(prizeValues.dezena)
            }

            const res = await fetch(`${API_URL}/games/${game.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast.success("Premiação atualizada com sucesso")
                onSuccess()
                onOpenChange(false)
            } else {
                toast.error("Erro ao salvar premiação")
            }
        } catch (e) {
            toast.error("Erro ao salvar")
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Premiação - {game?.name}</DialogTitle>
                    <DialogDescription>Defina os valores de premiação para cada acerto.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Prêmio Milhar (Acerto de 4 dígitos)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
                            <Input
                                type="number"
                                className="pl-9"
                                value={prizeValues.milhar}
                                onChange={(e) => setPrizeValues({ ...prizeValues, milhar: e.target.value })}
                                placeholder="Ex: 10000"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Prêmio Centena (Acerto de 3 dígitos)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
                            <Input
                                type="number"
                                className="pl-9"
                                value={prizeValues.centena}
                                onChange={(e) => setPrizeValues({ ...prizeValues, centena: e.target.value })}
                                placeholder="Ex: 100"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Prêmio Dezena (Acerto de 2 dígitos)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
                            <Input
                                type="number"
                                className="pl-9"
                                value={prizeValues.dezena}
                                onChange={(e) => setPrizeValues({ ...prizeValues, dezena: e.target.value })}
                                placeholder="Ex: 10"
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={savePrizes} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar Prêmios
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
