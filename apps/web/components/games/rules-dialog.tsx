import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2, Activity, DollarSign, Save } from "lucide-react"
import { toast } from "sonner"
import { API_URL } from "@/lib/api"

interface RulesDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    game: any
    onSuccess: () => void
}

export function RulesDialog({ open, onOpenChange, game, onSuccess }: RulesDialogProps) {
    const [rulesValues, setRulesValues] = useState({ globalCheck: false, restrictedMode: false, maxLiability: "5000", prizeMultiplier: "1000" })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (open && game) {
            const currentRules = game.rules || {}
            setRulesValues({
                globalCheck: !!currentRules.globalCheck,
                restrictedMode: !!currentRules.restrictedMode,
                maxLiability: game.maxLiability ? String(game.maxLiability) : "5000",
                prizeMultiplier: game.prizeMultiplier ? String(game.prizeMultiplier) : "1000"
            })
        }
    }, [open, game])

    const saveRules = async () => {
        if (!game) return
        setSaving(true)
        try {
            const token = localStorage.getItem("token")

            const updatedRules = {
                ...(game.rules || {}),
                globalCheck: rulesValues.globalCheck,
                restrictedMode: rulesValues.restrictedMode
            }

            const payload = {
                rules: updatedRules,
                maxLiability: Number(rulesValues.maxLiability),
                prizeMultiplier: Number(rulesValues.prizeMultiplier)
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
                toast.success("Regras atualizadas com sucesso")
                onSuccess()
                onOpenChange(false)
            } else {
                toast.error("Erro ao salvar regras")
            }
        } catch (e) {
            toast.error("Erro ao salvar")
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Regras de Negócio - {game?.name}</DialogTitle>
                    <DialogDescription>Configure as restrições e regras automáticas deste jogo.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                        <div className="space-y-0.5">
                            <Label className="text-base font-semibold">Bloqueio Global</Label>
                            <p className="text-sm text-muted-foreground max-w-[300px]">
                                Impede que o mesmo número seja vendido mais de uma vez para o mesmo sorteio, por qualquer cambista.
                            </p>
                        </div>
                        <Switch
                            checked={rulesValues.globalCheck}
                            onCheckedChange={(checked) => setRulesValues({ ...rulesValues, globalCheck: checked })}
                            className="data-[state=checked]:bg-emerald-600"
                        />
                    </div>

                    <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                        <div className="space-y-0.5">
                            <Label className="text-base font-semibold">Modo Restrito</Label>
                            <p className="text-sm text-muted-foreground max-w-[300px]">
                                Gera automaticamente as outras 3 milhares relacionadas ao escolher apenas 1 milhar.
                            </p>
                        </div>
                        <Switch
                            checked={rulesValues.restrictedMode}
                            onCheckedChange={(checked) => setRulesValues({ ...rulesValues, restrictedMode: checked })}
                            className="data-[state=checked]:bg-emerald-600"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-red-500" />
                                Limite de Risco (R$)
                            </Label>
                            <Input
                                type="number"
                                value={rulesValues.maxLiability}
                                onChange={(e) => setRulesValues({ ...rulesValues, maxLiability: e.target.value })}
                                placeholder="Ex: 5000"
                            />
                            <p className="text-[10px] text-muted-foreground whitespace-nowrap">Máximo de prêmios por número/sorteio.</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-emerald-500" />
                                Multiplicador
                            </Label>
                            <Input
                                type="number"
                                value={rulesValues.prizeMultiplier}
                                onChange={(e) => setRulesValues({ ...rulesValues, prizeMultiplier: e.target.value })}
                                placeholder="Ex: 1000"
                            />
                            <p className="text-[10px] text-muted-foreground whitespace-nowrap text-wrap">Multiplica o valor da aposta no prêmio.</p>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={saveRules} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar Regras
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
