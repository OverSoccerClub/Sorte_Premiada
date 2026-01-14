import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save, Hash } from "lucide-react"
import { useAlert } from "@/context/alert-context"
import { API_URL } from "@/lib/api"

interface TicketConfigDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    game: any
    onSuccess: () => void
}

export function TicketConfigDialog({ open, onOpenChange, game, onSuccess }: TicketConfigDialogProps) {
    const { showAlert } = useAlert()
    const [config, setConfig] = useState({
        ticketNumberingMode: "RANDOM",
        maxTicketsPerSeries: "2500"
    })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (open && game) {
            setConfig({
                ticketNumberingMode: game.ticketNumberingMode || "RANDOM",
                maxTicketsPerSeries: game.maxTicketsPerSeries ? String(game.maxTicketsPerSeries) : "2500"
            })
        }
    }, [open, game])

    const saveConfig = async () => {
        if (!game) return
        setSaving(true)
        try {
            const token = localStorage.getItem("token")

            const payload = {
                ticketNumberingMode: config.ticketNumberingMode,
                maxTicketsPerSeries: Number(config.maxTicketsPerSeries)
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
                showAlert("Sucesso!", "Configuração de bilhetes atualizada", "success")
                onSuccess()
                onOpenChange(false)
            } else {
                showAlert("Erro!", "Erro ao salvar configuração", "error")
            }
        } catch (e) {
            showAlert("Erro!", "Erro ao salvar", "error")
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Configuração de Bilhetes - {game?.name}</DialogTitle>
                    <DialogDescription>Defina como os números de bilhetes serão atribuídos neste jogo.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Modo de Numeração</Label>
                        <Select
                            value={config.ticketNumberingMode}
                            onValueChange={(value) => setConfig({ ...config, ticketNumberingMode: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="RANDOM">
                                    <div className="flex flex-col py-1">
                                        <span className="font-semibold">Aleatório</span>
                                        <span className="text-xs text-muted-foreground">
                                            Números atribuídos aleatoriamente (ex: 1523, 0047, 2341...)
                                        </span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="SEQUENTIAL">
                                    <div className="flex flex-col py-1">
                                        <span className="font-semibold">Sequencial</span>
                                        <span className="text-xs text-muted-foreground">
                                            Números atribuídos em ordem (ex: 0001, 0002, 0003...)
                                        </span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {config.ticketNumberingMode === "RANDOM"
                                ? "Modo aleatório dificulta fraude e torna a distribuição imprevisível."
                                : "Modo sequencial facilita auditoria e rastreamento de vendas."}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label>Máximo de Bilhetes por Série</Label>
                        <div className="relative">
                            <Hash className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="number"
                                className="pl-9"
                                value={config.maxTicketsPerSeries}
                                onChange={(e) => setConfig({ ...config, maxTicketsPerSeries: e.target.value })}
                                placeholder="Ex: 2500"
                                min="1"
                                max="10000"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Quantidade máxima de bilhetes que podem ser vendidos por série. Padrão: 2500
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={saveConfig} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar Configuração
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
