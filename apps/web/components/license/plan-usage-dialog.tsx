
"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Check, AlertCircle, TrendingUp, Smartphone, Users, Ticket, Gamepad2, ArrowRight } from "lucide-react"
import { licenseService, UsageReport } from "@/services/license.service"
import { plansService, Plan } from "@/services/plans.service"
import { useAlert } from "@/context/alert-context"
import { useCompany } from "@/context/company-context"
import { formatCurrency } from "@/lib/utils"

interface PlanUsageDialogProps {
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function PlanUsageDialog({ trigger, open: controlledOpen, onOpenChange }: PlanUsageDialogProps) {
    const { showAlert } = useAlert()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [usage, setUsage] = useState<UsageReport | null>(null)
    const [plans, setPlans] = useState<Plan[]>([])
    const [viewMode, setViewMode] = useState<'USAGE' | 'UPGRADE'>('USAGE')
    const { settings, refreshSettings } = useCompany()

    const isControlled = controlledOpen !== undefined
    const isOpen = isControlled ? controlledOpen : open

    const handleOpenChange = (newOpen: boolean) => {
        if (!isControlled) setOpen(newOpen)
        onOpenChange?.(newOpen)

        if (newOpen) {
            setViewMode('USAGE') // Reset to usage view when opening
            fetchData()
        }
    }

    const fetchData = async () => {
        setLoading(true)
        try {
            const usageData = await licenseService.getMyUsage()
            setUsage(usageData)

            // Pre-fetch plans for upgrade view
            const allPlans = await plansService.getAll()
            setPlans(allPlans.filter(p => p.isActive))
        } catch (error) {
            showAlert("Erro ao carregar dados", "Não foi possível carregar as informações do plano.", "error")
        } finally {
            setLoading(false)
        }
    }

    const handleUpgrade = async (plan: Plan) => {
        setLoading(true)
        try {
            await licenseService.requestUpgrade(plan.id)
            showAlert("Upgrade realizado com sucesso!", `Seu plano foi atualizado para ${plan.name}.`, "success")
            await refreshSettings()
            handleOpenChange(false)
        } catch (error: any) {
            showAlert("Erro no upgrade", error.message || "Não foi possível realizar o upgrade.", "error")
        } finally {
            setLoading(false)
        }
    }

    const renderUsageItem = (
        icon: any,
        label: string,
        current: number,
        max: number,
        percent: number,
        colorClass = "bg-primary"
    ) => (
        <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="font-medium text-muted-foreground">{label}</span>
                </div>
                <span className="font-bold">
                    {current} <span className="text-muted-foreground font-normal">/ {max}</span>
                </span>
            </div>
            <Progress value={percent} className="h-2" indicatorClassName={percent > 90 ? "bg-red-500" : (percent > 75 ? "bg-amber-500" : colorClass)} />
            {percent >= 100 && (
                <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Limite atingido
                </p>
            )}
        </div>
    )

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            {!!trigger && <DialogTrigger asChild>{trigger as any}</DialogTrigger>}
            <DialogContent className="max-w-7xl w-full max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span>Gerenciar Plano</span>
                            {settings.plan && (
                                <Badge variant="outline" className="bg-emerald-50/50 text-emerald-600 border-emerald-200 uppercase tracking-widest text-[10px]">
                                    {settings.plan.name}
                                </Badge>
                            )}
                        </div>
                        {viewMode === 'USAGE' && (
                            <Button size="sm" onClick={() => setViewMode('UPGRADE')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Fazer Upgrade
                            </Button>
                        )}
                        {viewMode === 'UPGRADE' && (
                            <Button variant="ghost" size="sm" onClick={() => setViewMode('USAGE')}>
                                Voltar para Consumo
                            </Button>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {viewMode === 'USAGE'
                            ? "Acompanhe o consumo de recursos e os limites do seu plano atual."
                            : "Escolha o plano ideal para escalar sua operação."
                        }
                    </DialogDescription>
                </DialogHeader>

                {loading && !usage ? (
                    <div className="py-12 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : viewMode === 'USAGE' && usage ? (
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-muted/30 p-4 rounded-lg space-y-4 border border-border">
                                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Consumo de Recursos</h3>

                                {renderUsageItem(
                                    <Users className="w-4 h-4 text-blue-500" />,
                                    "Usuários (Cambistas/Cobradores)",
                                    usage.limits.users.current,
                                    usage.limits.users.max,
                                    usage.limits.users.percentage,
                                    "bg-blue-500"
                                )}

                                {renderUsageItem(
                                    <Ticket className="w-4 h-4 text-emerald-500" />,
                                    "Bilhetes (Mensal)",
                                    usage.limits.tickets.current,
                                    usage.limits.tickets.max,
                                    usage.limits.tickets.percentage,
                                    "bg-emerald-500"
                                )}

                                {renderUsageItem(
                                    <Smartphone className="w-4 h-4 text-purple-500" />,
                                    "Dispositivos POS",
                                    usage.limits.devices.current,
                                    usage.limits.devices.max,
                                    usage.limits.devices.percentage,
                                    "bg-purple-500"
                                )}

                                {renderUsageItem(
                                    <Gamepad2 className="w-4 h-4 text-amber-500" />,
                                    "Jogos Ativos",
                                    usage.limits.games.current,
                                    usage.limits.games.max,
                                    usage.limits.games.percentage,
                                    "bg-amber-500"
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="bg-muted/30 p-4 rounded-lg border border-border h-full">
                                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Features do Plano</h3>
                                    {settings.plan?.features && settings.plan.features.length > 0 ? (
                                        <ul className="space-y-3">
                                            {settings.plan.features.map((feature: string, idx: number) => (
                                                <li key={idx} className="flex items-start gap-2 text-sm">
                                                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">Nenhuma feature listada.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-center justify-between border border-blue-100 dark:border-blue-900/30">
                            <div>
                                <h4 className="font-semibold text-blue-900 dark:text-blue-300">Precisa de mais limites?</h4>
                                <p className="text-sm text-blue-700 dark:text-blue-400">Faça o upgrade agora mesmo e libere mais recursos.</p>
                            </div>
                            <Button onClick={() => setViewMode('UPGRADE')} className="bg-blue-600 hover:bg-blue-700 text-white">
                                Ver Planos
                            </Button>
                        </div>
                    </div>
                ) : viewMode === 'UPGRADE' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                        {plans.map(plan => {
                            const isCurrent = settings.plan?.name === plan.name
                            return (
                                <div key={plan.id} className={`relative flex flex-col p-6 rounded-xl border-2 transition-all ${isCurrent
                                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10"
                                    : "border-border hover:border-emerald-500/50 hover:shadow-lg"
                                    }`}>
                                    {isCurrent && (
                                        <div className="absolute top-0 right-0 transform translate-x-px -translate-y-px">
                                            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg uppercase tracking-wider">
                                                Atual
                                            </span>
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <h3 className="font-bold text-lg">{plan.name}</h3>
                                        <div className="mt-2">
                                            <div className="text-2xl font-bold">
                                                {formatCurrency(plan.price)}
                                                <span className="text-sm font-normal text-muted-foreground">/mês por POS</span>
                                            </div>
                                            {settings.showPlanTotalValue && (
                                                <div className="text-sm text-muted-foreground mt-1">
                                                    Valor total: <span className="font-semibold text-foreground">{formatCurrency(plan.price * plan.maxActiveDevices)}/mês</span>
                                                    <span className="text-xs ml-1">({plan.maxActiveDevices} POS)</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-3 mb-6">
                                        <div className="text-sm flex items-center gap-2">
                                            <Users className="w-4 h-4 text-muted-foreground" />
                                            <span>Até <b>{plan.maxUsers}</b> usuários</span>
                                        </div>
                                        <div className="text-sm flex items-center gap-2">
                                            <Ticket className="w-4 h-4 text-muted-foreground" />
                                            <span>Até <b>{plan.maxTicketsPerMonth}</b> bilhetes/mês</span>
                                        </div>
                                        <div className="text-sm flex items-center gap-2">
                                            <Smartphone className="w-4 h-4 text-muted-foreground" />
                                            <span>Até <b>{plan.maxActiveDevices}</b> POS</span>
                                        </div>

                                        <div className="pt-2 border-t border-dashed"></div>

                                        {plan.features.map((f, i) => ( // Show all features
                                            <div key={i} className="text-xs flex items-center gap-2 text-muted-foreground">
                                                <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                                                <span>{f}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        className={`w-full ${isCurrent ? "bg-muted text-muted-foreground" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}
                                        disabled={isCurrent || loading}
                                        onClick={() => handleUpgrade(plan)}
                                    >
                                        {isCurrent ? "Plano Atual" : (
                                            <>
                                                Assinar Agora <ArrowRight className="w-4 h-4 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    )
}
