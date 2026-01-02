import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Ticket, Save, Banknote, Gamepad2, Dices, PawPrint, Trophy, Star, Diamond, Info } from "lucide-react"
import { toast } from "sonner"
import { API_URL } from "@/lib/api"

interface DisplayConfigDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    game: any
    onSuccess: () => void
}

// Icon options for picker (Mapped to Lucide components for preview)
const iconOptions = [
    { value: "cash-outline", label: "Dinheiro", icon: Banknote },
    { value: "game-controller-outline", label: "Controle", icon: Gamepad2 },
    { value: "dice-outline", label: "Dados", icon: Dices },
    { value: "paw-outline", label: "Pata (Bicho)", icon: PawPrint },
    { value: "trophy-outline", label: "Troféu", icon: Trophy },
    { value: "star-outline", label: "Estrela", icon: Star },
    { value: "diamond-outline", label: "Diamante", icon: Diamond },
    { value: "ticket-outline", label: "Bilhete", icon: Ticket }
]

const colorOptions = [
    { value: "bg-emerald-600", label: "Verde" },
    { value: "bg-amber-600", label: "Âmbar" },
    { value: "bg-blue-600", label: "Azul" },
    { value: "bg-purple-600", label: "Roxo" },
    { value: "bg-red-600", label: "Vermelho" },
    { value: "bg-pink-600", label: "Rosa" },
    { value: "bg-orange-600", label: "Laranja" },
    { value: "bg-cyan-600", label: "Ciano" }
]

export function DisplayConfigDialog({ open, onOpenChange, game, onSuccess }: DisplayConfigDialogProps) {
    const [displayValues, setDisplayValues] = useState({ name: "", displayName: "", iconName: "", colorClass: "" })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (open && game) {
            setDisplayValues({
                name: game.name || "",
                displayName: game.displayName || "",
                iconName: game.iconName || "game-controller-outline",
                colorClass: game.colorClass || "bg-emerald-600"
            })
        }
    }, [open, game])

    const saveDisplayConfig = async () => {
        if (!game) return
        setSaving(true)
        try {
            const token = localStorage.getItem("token")

            const payload = {
                name: displayValues.name,
                displayName: displayValues.displayName || null,
                iconName: displayValues.iconName,
                colorClass: displayValues.colorClass
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
                toast.success("Configuração atualizada com sucesso")
                onSuccess()
                onOpenChange(false)
            } else {
                toast.error("Erro ao salvar configuração")
            }
        } catch (e) {
            toast.error("Erro ao salvar")
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Configuração de Exibição - {game?.name}</DialogTitle>
                    <DialogDescription>Configure como o jogo aparece no aplicativo móvel.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Nome do Jogo (identificador)</Label>
                        <Input
                            value={displayValues.name}
                            onChange={(e) => setDisplayValues({ ...displayValues, name: e.target.value })}
                            placeholder="Ex: 2x1000"
                        />
                        <p className="text-[10px] text-muted-foreground">Nome interno usado no sistema.</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Nome de Exibição (opcional)</Label>
                        <Input
                            value={displayValues.displayName}
                            onChange={(e) => setDisplayValues({ ...displayValues, displayName: e.target.value })}
                            placeholder="Ex: 2x1500"
                        />
                        <p className="text-[10px] text-muted-foreground">Nome mostrado ao usuário no app. Se vazio, usa o nome acima.</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Ícone</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {iconOptions.map(opt => {
                                const IconComp = opt.icon
                                return (
                                    <Button
                                        key={opt.value}
                                        type="button"
                                        variant={displayValues.iconName === opt.value ? "default" : "outline"}
                                        className={`h-12 flex flex-col gap-1 ${displayValues.iconName === opt.value ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                                        onClick={() => setDisplayValues({ ...displayValues, iconName: opt.value })}
                                        title={opt.label}
                                    >
                                        <IconComp className="w-5 h-5" />
                                    </Button>
                                )
                            })}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Cor de Fundo</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {colorOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setDisplayValues({ ...displayValues, colorClass: opt.value })}
                                    className={`h-10 rounded-md border-2 transition-all ${opt.value} ${displayValues.colorClass === opt.value ? 'border-foreground scale-105 shadow-md' : 'border-transparent opacity-80 hover:opacity-100'}`}
                                    title={opt.label}
                                />
                            ))}
                        </div>
                    </div>

                    <div className={`p-4 rounded-xl border flex items-center gap-3 mt-4 ${displayValues.colorClass} text-white`}>
                        <div className="bg-white/20 p-2 rounded-lg">
                            {(() => {
                                const opt = iconOptions.find(o => o.value === displayValues.iconName)
                                const Icon = opt ? opt.icon : Info
                                return <Icon className="w-6 h-6" />
                            })()}
                        </div>
                        <div className="font-bold text-lg">
                            {displayValues.displayName || displayValues.name || "Preview"}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={saveDisplayConfig} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar Config
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
