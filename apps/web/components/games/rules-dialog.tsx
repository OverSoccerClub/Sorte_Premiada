import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Activity, DollarSign, Save, Hash, Ticket } from "lucide-react"
import { useAlert } from "@/context/alert-context"
import { API_URL } from "@/lib/api"

interface RulesDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    game: any
    onSuccess: () => void
}

export function RulesDialog({ open, onOpenChange, game, onSuccess }: RulesDialogProps) {
    const { user } = useAuth()
    const { showAlert } = useAlert()
    const [rulesValues, setRulesValues] = useState({
        globalCheck: false,
        restrictedMode: false,
        blockSingleSelection: false,
        maxLiability: "5000",
        prizeMultiplier: "1000",
        ticketNumberingMode: "RANDOM",
        maxTicketsPerSeries: "2500",
        secondChanceEnabled: false,
        secondChanceRangeStart: "",
        secondChanceRangeEnd: "",
        secondChanceWeekday: "6",
        secondChanceDrawTime: "19:00",
        secondChancePrize: "1000",

        secondChanceLabel: "",
        promptMessage: "",
        mainMatchMessage: ""
    })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (open && game) {
            const currentRules = game.rules || {}
            setRulesValues({
                globalCheck: !!currentRules.globalCheck,
                restrictedMode: !!currentRules.restrictedMode,
                blockSingleSelection: !!currentRules.blockSingleSelection,
                maxLiability: game.maxLiability ? String(game.maxLiability) : "5000",
                prizeMultiplier: game.prizeMultiplier ? String(game.prizeMultiplier) : "1000",
                ticketNumberingMode: game.ticketNumberingMode || "RANDOM",
                maxTicketsPerSeries: game.maxTicketsPerSeries ? String(game.maxTicketsPerSeries) : "2500",
                secondChanceEnabled: !!(game.secondChanceRangeStart && game.secondChanceRangeEnd),
                secondChanceRangeStart: game.secondChanceRangeStart ? String(game.secondChanceRangeStart) : "",
                secondChanceRangeEnd: game.secondChanceRangeEnd ? String(game.secondChanceRangeEnd) : "",
                secondChanceWeekday: game.secondChanceWeekday !== null && game.secondChanceWeekday !== undefined ? String(game.secondChanceWeekday) : "6",
                secondChanceDrawTime: game.secondChanceDrawTime || "19:00",
                secondChancePrize: game.secondChancePrize ? String(game.secondChancePrize) : "1000",

                secondChanceLabel: game.secondChanceLabel || "",
                promptMessage: game.promptMessage || "VOCÊ GANHA SE ACERTAR EM UMA DAS FEZINHAS",
                mainMatchMessage: game.mainMatchMessage || "ACERTANDO TODOS OS NÚMEROS NA ORDEM"
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
                restrictedMode: rulesValues.restrictedMode,
                blockSingleSelection: rulesValues.blockSingleSelection
            }

            const payload = {
                rules: updatedRules,
                maxLiability: Number(rulesValues.maxLiability),
                prizeMultiplier: Number(rulesValues.prizeMultiplier),
                ticketNumberingMode: rulesValues.ticketNumberingMode,
                maxTicketsPerSeries: Number(rulesValues.maxTicketsPerSeries),
                secondChanceEnabled: rulesValues.secondChanceEnabled,
                secondChanceRangeStart: rulesValues.secondChanceEnabled && rulesValues.secondChanceRangeStart ? Number(rulesValues.secondChanceRangeStart) : null,
                secondChanceRangeEnd: rulesValues.secondChanceEnabled && rulesValues.secondChanceRangeEnd ? Number(rulesValues.secondChanceRangeEnd) : null,
                secondChanceWeekday: rulesValues.secondChanceEnabled ? Number(rulesValues.secondChanceWeekday) : null,
                secondChanceDrawTime: rulesValues.secondChanceEnabled ? rulesValues.secondChanceDrawTime : null,
                secondChancePrize: rulesValues.secondChanceEnabled && rulesValues.secondChancePrize ? Number(rulesValues.secondChancePrize) : null,

                secondChanceLabel: rulesValues.secondChanceEnabled && rulesValues.secondChanceLabel ? rulesValues.secondChanceLabel : null,
                promptMessage: rulesValues.promptMessage,
                mainMatchMessage: rulesValues.mainMatchMessage
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
                showAlert("Sucesso!", "Regras atualizadas com sucesso", "success")
                onSuccess()
                onOpenChange(false)
            } else {
                showAlert("Erro!", "Erro ao salvar regras", "error")
            }
        } catch (e) {
            showAlert("Erro!", "Erro ao salvar", "error")
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b border-border bg-muted/10">
                    <DialogTitle>Regras de Negócio - {game?.name}</DialogTitle>
                    <DialogDescription>Configure as restrições e regras automáticas deste jogo.</DialogDescription>
                </DialogHeader>

                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                    {game?.type === 'MINUTO_SORTE' ? (
                        <div className="space-y-6">
                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg">
                                <h3 className="text-emerald-800 font-semibold mb-2 flex items-center gap-2">
                                    <Activity className="w-4 h-4" /> Funcionamento do Minuto da Sorte
                                </h3>
                                <ul className="text-sm text-emerald-700 space-y-2 list-disc pl-4">
                                    <li>As premiações são configuradas na aba <strong>"Prêmios"</strong>.</li>
                                    <li>O sorteio é baseado no 1º prêmio da Loteria Federal inserido manualmente.</li>
                                    <li>O minuto da aposta é capturado <strong>automaticamente pelo servidor</strong> no momento da compra.</li>
                                    <li>Não há bloqueio global de números, pois cada aposta é única por segundo/minuto.</li>
                                </ul>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium flex items-center gap-1.5">
                                        <Activity className="w-3.5 h-3.5 text-red-500" /> Limite de Risco (Global)
                                    </Label>
                                    <Input
                                        type="number"
                                        className="h-9"
                                        value={rulesValues.maxLiability}
                                        onChange={(e) => setRulesValues({ ...rulesValues, maxLiability: e.target.value })}
                                        placeholder="5000"
                                    />
                                    <p className="text-[10px] text-muted-foreground">Teto máximo de premiação por sorteio.</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium flex items-center gap-1.5">
                                        <Hash className="w-3.5 h-3.5 text-purple-500" /> Max Bilhetes por Série
                                    </Label>
                                    <Input
                                        type="number"
                                        className="h-9"
                                        value={rulesValues.maxTicketsPerSeries}
                                        onChange={(e) => setRulesValues({ ...rulesValues, maxTicketsPerSeries: e.target.value })}
                                        placeholder="2500"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Top Section: Toggles */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-card">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-semibold">Bloqueio Global</Label>
                                        <p className="text-[10px] text-muted-foreground leading-tight">
                                            Impede repetição de número por sorteio.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={rulesValues.globalCheck}
                                        onCheckedChange={(checked) => setRulesValues({ ...rulesValues, globalCheck: checked })}
                                        className="scale-90 data-[state=checked]:bg-emerald-600"
                                    />
                                </div>

                                <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-card">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-semibold">Modo Restrito</Label>
                                        <p className="text-[10px] text-muted-foreground leading-tight">
                                            Gera milhares relacionadas automaticamente.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={rulesValues.restrictedMode}
                                        onCheckedChange={(checked) => setRulesValues({ ...rulesValues, restrictedMode: checked })}
                                        className="scale-90 data-[state=checked]:bg-emerald-600"
                                    />
                                </div>

                                <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-card">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-semibold">Bloquear Aposta Unitária</Label>
                                        <p className="text-[10px] text-muted-foreground leading-tight">
                                            Força a seleção manual de 4 milhares.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={rulesValues.blockSingleSelection}
                                        onCheckedChange={(checked) => setRulesValues({ ...rulesValues, blockSingleSelection: checked })}
                                        disabled={user?.role !== 'MASTER'}
                                        className="scale-90 data-[state=checked]:bg-emerald-600"
                                    />
                                </div>
                            </div>

                            {/* Middle Section: Configuration Grid */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium flex items-center gap-1.5">
                                        <Activity className="w-3.5 h-3.5 text-red-500" /> Limite Risco
                                    </Label>
                                    <Input
                                        type="number"
                                        className="h-9"
                                        value={rulesValues.maxLiability}
                                        onChange={(e) => setRulesValues({ ...rulesValues, maxLiability: e.target.value })}
                                        placeholder="5000"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium flex items-center gap-1.5">
                                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Multiplicador
                                    </Label>
                                    <Input
                                        type="number"
                                        className="h-9"
                                        value={rulesValues.prizeMultiplier}
                                        onChange={(e) => setRulesValues({ ...rulesValues, prizeMultiplier: e.target.value })}
                                        placeholder="1000"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium flex items-center gap-1.5">
                                        <Hash className="w-3.5 h-3.5 text-purple-500" /> Max Bilhetes
                                    </Label>
                                    <Input
                                        type="number"
                                        className="h-9"
                                        value={rulesValues.maxTicketsPerSeries}
                                        onChange={(e) => setRulesValues({ ...rulesValues, maxTicketsPerSeries: e.target.value })}
                                        placeholder="2500"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium flex items-center gap-1.5">
                                        <Ticket className="w-3.5 h-3.5 text-blue-500" /> Mod. Numeração
                                    </Label>
                                    <Select
                                        value={rulesValues.ticketNumberingMode}
                                        onValueChange={(value) => setRulesValues({ ...rulesValues, ticketNumberingMode: value })}
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="RANDOM">Aleatório</SelectItem>
                                            <SelectItem value="SEQUENTIAL">Sequencial</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Second Chance Compact */}
                            <div className="rounded-lg border shadow-sm overflow-hidden">
                                <div className="bg-muted/30 p-3 flex items-center justify-between border-b border-border">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1 rounded bg-purple-100">
                                            <Ticket className="w-3.5 h-3.5 text-purple-600" />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-semibold block">Segunda Chance</Label>
                                            <span className="text-[10px] text-muted-foreground">Sorteio extra semanal</span>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={rulesValues.secondChanceEnabled}
                                        onCheckedChange={(checked) => setRulesValues({ ...rulesValues, secondChanceEnabled: checked })}
                                        className="scale-90 data-[state=checked]:bg-purple-600"
                                    />
                                </div>

                                {rulesValues.secondChanceEnabled && (
                                    <div className="p-4 bg-card grid grid-cols-6 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <div className="col-span-2 space-y-1.5">
                                            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Faixa Inicial</Label>
                                            <Input
                                                className="h-8 text-sm"
                                                value={rulesValues.secondChanceRangeStart}
                                                onChange={(e) => setRulesValues({ ...rulesValues, secondChanceRangeStart: e.target.value })}
                                                placeholder="122300"
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-1.5">
                                            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Faixa Final</Label>
                                            <Input
                                                className="h-8 text-sm"
                                                value={rulesValues.secondChanceRangeEnd}
                                                onChange={(e) => setRulesValues({ ...rulesValues, secondChanceRangeEnd: e.target.value })}
                                                placeholder="125500"
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-1.5">
                                            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Prêmio (R$)</Label>
                                            <Input
                                                className="h-8 text-sm"
                                                value={rulesValues.secondChancePrize}
                                                onChange={(e) => setRulesValues({ ...rulesValues, secondChancePrize: e.target.value })}
                                                placeholder="1000"
                                            />
                                        </div>

                                        <div className="col-span-2 space-y-1.5">
                                            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Dia do Sorteio</Label>
                                            <Select
                                                value={rulesValues.secondChanceWeekday}
                                                onValueChange={(value) => setRulesValues({ ...rulesValues, secondChanceWeekday: value })}
                                            >
                                                <SelectTrigger className="h-8 text-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="6">Sábado</SelectItem>
                                                    <SelectItem value="0">Domingo</SelectItem>
                                                    <SelectItem value="1">Segunda</SelectItem>
                                                    <SelectItem value="2">Terça</SelectItem>
                                                    <SelectItem value="3">Quarta</SelectItem>
                                                    <SelectItem value="4">Quinta</SelectItem>
                                                    <SelectItem value="5">Sexta</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-1 space-y-1.5">
                                            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Hora</Label>
                                            <Input
                                                className="h-8 text-sm text-center"
                                                value={rulesValues.secondChanceDrawTime}
                                                onChange={(e) => setRulesValues({ ...rulesValues, secondChanceDrawTime: e.target.value })}
                                                placeholder="19:00"
                                            />
                                        </div>
                                        <div className="col-span-3 space-y-1.5">
                                            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Label Exibição</Label>
                                            <Input
                                                className="h-8 text-sm"
                                                value={rulesValues.secondChanceLabel}
                                                onChange={(e) => setRulesValues({ ...rulesValues, secondChanceLabel: e.target.value })}
                                                placeholder="SEGUNDA CHANCE"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Messages Section */}
                            <div className="space-y-3">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mensagens do Bilhete</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px]">Mensagem de Incentivo (Topo)</Label>
                                        <Input
                                            className="h-9 text-xs"
                                            value={rulesValues.promptMessage}
                                            onChange={(e) => setRulesValues({ ...rulesValues, promptMessage: e.target.value })}
                                            placeholder="Ex: VOCÊ GANHA SE..."
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px]">Mensagem de Acerto (Principal)</Label>
                                        <Input
                                            className="h-9 text-xs"
                                            value={rulesValues.mainMatchMessage}
                                            onChange={(e) => setRulesValues({ ...rulesValues, mainMatchMessage: e.target.value })}
                                            placeholder="Ex: ACERTANDO TODOS..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t border-border bg-muted/10">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={saveRules} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 min-w-[140px]">
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Salvar Regras
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
