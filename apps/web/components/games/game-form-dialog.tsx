"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Trash2, Save, Ticket, DollarSign, Clock, ShieldAlert } from "lucide-react"
import { toast } from "sonner"
import { API_URL } from "@/lib/api"

// --- Schemas ---

const extractionSeriesSchema = z.object({
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato inválido (HH:mm)"),
    // We could add areaId here later if needed
    lastSeries: z.coerce.number().optional().default(0),
})

const gameFormSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    displayName: z.string().optional(),
    iconName: z.string().optional(),
    colorClass: z.string().optional(),
    isActive: z.boolean().default(true),

    // Financial
    price: z.coerce.number().min(0.01, "Preço inválido"),
    commissionRate: z.coerce.number().min(0).max(100),
    prizeMultiplier: z.coerce.number().min(1),

    // Fixed Prizes
    prizeMilhar: z.coerce.number().optional(),
    prizeCentena: z.coerce.number().optional(),
    prizeDezena: z.coerce.number().optional(),

    // Risk
    maxLiability: z.coerce.number().min(0),

    // Schedule
    extractionSeries: z.array(extractionSeriesSchema).default([]),

    // Second Chance
    secondChanceEnabled: z.boolean().default(false),
    secondChanceWeekday: z.coerce.number().min(0).max(6).optional(),
    secondChanceDrawTime: z.string().optional(),
    secondChanceRangeStart: z.coerce.number().optional(),
    secondChanceRangeEnd: z.coerce.number().optional(),
})

type GameFormValues = z.infer<typeof gameFormSchema>

interface GameFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    gameToEdit?: any // If null, it's create mode
    onSuccess: () => void
}

export function GameFormDialog({ open, onOpenChange, gameToEdit, onSuccess }: GameFormDialogProps) {
    const isEditing = !!gameToEdit
    const [isSaving, setIsSaving] = useState(false)

    const form = useForm<GameFormValues>({
        resolver: zodResolver(gameFormSchema),
        defaultValues: {
            name: "",
            displayName: "",
            iconName: "game-controller-outline",
            colorClass: "bg-emerald-600",
            isActive: true,
            price: 5.00,
            commissionRate: 10.0,
            prizeMultiplier: 1000.0,
            maxLiability: 5000.0,
            extractionSeries: [],
            secondChanceEnabled: false,
            secondChanceWeekday: 6,
            secondChanceDrawTime: "19:00",
            prizeMilhar: 5000,
            prizeCentena: 600,
            prizeDezena: 60,
        }
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "extractionSeries",
    })

    // Reset form when dialog opens/closes or gameToEdit changes
    useEffect(() => {
        if (open) {
            if (gameToEdit) {
                // Map API data to Form Values
                form.reset({
                    name: gameToEdit.name,
                    displayName: gameToEdit.displayName || "",
                    iconName: gameToEdit.iconName || "game-controller-outline",
                    colorClass: gameToEdit.colorClass || "bg-emerald-600",
                    isActive: gameToEdit.isActive,

                    price: Number(gameToEdit.price),
                    commissionRate: Number(gameToEdit.commissionRate),
                    prizeMultiplier: Number(gameToEdit.prizeMultiplier),
                    maxLiability: Number(gameToEdit.maxLiability),

                    prizeMilhar: gameToEdit.prizeMilhar ? Number(gameToEdit.prizeMilhar) : undefined,
                    prizeCentena: gameToEdit.prizeCentena ? Number(gameToEdit.prizeCentena) : undefined,
                    prizeDezena: gameToEdit.prizeDezena ? Number(gameToEdit.prizeDezena) : undefined,

                    extractionSeries: gameToEdit.extractionSeries || [],

                    secondChanceEnabled: gameToEdit.secondChanceEnabled,
                    secondChanceWeekday: gameToEdit.secondChanceWeekday,
                    secondChanceDrawTime: gameToEdit.secondChanceDrawTime || "",
                    secondChanceRangeStart: gameToEdit.secondChanceRangeStart,
                    secondChanceRangeEnd: gameToEdit.secondChanceRangeEnd,
                })
            } else {
                form.reset({
                    name: "",
                    isActive: true,
                    price: 5.00,
                    commissionRate: 10.0,
                    prizeMultiplier: 1000.0,
                    maxLiability: 5000.0,
                    extractionSeries: [{ time: "11:00", lastSeries: 0 }, { time: "14:00", lastSeries: 0 }, { time: "16:00", lastSeries: 0 }, { time: "18:00", lastSeries: 0 }, { time: "21:00", lastSeries: 0 }], // Defaults
                    secondChanceEnabled: false,
                    prizeMilhar: 5000,
                    prizeCentena: 600,
                    prizeDezena: 60,
                })
            }
        }
    }, [open, gameToEdit, form])

    const onSubmit = async (values: GameFormValues) => {
        setIsSaving(true)
        try {
            const url = isEditing
                ? `${API_URL}/games/${gameToEdit.id}`
                : `${API_URL}/games`

            const method = "POST" // Both are POST in our current controller setup (or standard REST: Create=POST, Update=PUT/PATCH, but controller handles update on Post :id)

            // Prepare payload - ensure numbers are numbers
            const payload = {
                ...values,
                rules: gameToEdit?.rules || {}, // Preserve existing rules if any
            }

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}))
                throw new Error(errData.message || "Falha ao salvar jogo")
            }

            toast.success(`Jogo ${isEditing ? 'atualizado' : 'criado'} com sucesso!`)
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Erro desconhecido")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>{isEditing ? `Editar: ${gameToEdit.name}` : "Criar Novo Jogo"}</DialogTitle>
                    <DialogDescription>
                        Configure todos os parâmetros do jogo, prêmios e horários.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <Form {...form}>
                        <form id="game-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            <Tabs defaultValue="general" className="w-full">
                                <TabsList className="grid w-full grid-cols-4 mb-6">
                                    <TabsTrigger value="general">Geral</TabsTrigger>
                                    <TabsTrigger value="financial">Financeiro & Prêmios</TabsTrigger>
                                    <TabsTrigger value="schedule">Horários (Sorteios)</TabsTrigger>
                                    <TabsTrigger value="risk">Risco & Outros</TabsTrigger>
                                </TabsList>

                                {/* --- GENERAL TAB --- */}
                                <TabsContent value="general" className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nome Interno (ID)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Ex: Jogo do Bicho" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="displayName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nome de Exibição (Mobile)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Ex: JB Tradicional" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="colorClass"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Cor (Tailwind Class)</FormLabel>
                                                    <FormControl>
                                                        <div className="flex gap-2">
                                                            <Input placeholder="Ex: bg-emerald-600" {...field} />
                                                            <div className={`w-10 h-10 rounded border ${field.value}`}></div>
                                                        </div>
                                                    </FormControl>
                                                    <FormDescription>Usado nos cards e cabeçalhos do app.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="iconName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Ícone (Ionicons)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Ex: game-controller-outline" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="isActive"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Ativo</FormLabel>
                                                    <FormDescription>
                                                        Se desativado, o jogo não aparecerá no aplicativo.
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </TabsContent>

                                {/* --- FINANCIAL TAB --- */}
                                <TabsContent value="financial" className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="price"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Preço do Bilhete (R$)</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                            <Input className="pl-8" type="number" step="0.01" {...field} />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="prizeMultiplier"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Multiplicador Geral</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="0.1" {...field} />
                                                    </FormControl>
                                                    <FormDescription>Ex: 1000x o valor apostado</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="commissionRate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Comissão Padrão (%)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="0.1" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="border-t pt-4 mt-4">
                                        <h3 className="text-sm font-semibold mb-3">Prêmios Fixos (Opcionais - Sobrescrevem Multiplicador)</h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="prizeMilhar"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Prêmio Milhar (Seca)</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" placeholder="5000" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="prizeCentena"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Prêmio Centena (Seca)</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" placeholder="600" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="prizeDezena"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Prêmio Dezena (Seca)</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" placeholder="60" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* --- SCHEDULE TAB --- */}
                                <TabsContent value="schedule" className="space-y-4">
                                    <div className="p-4 border rounded-lg space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold flex items-center gap-2">
                                                    <Clock className="w-5 h-5 text-emerald-500" />
                                                    Horários de Extração (Sorteios)
                                                </h3>
                                                <p className="text-sm text-muted-foreground">Defina os horários diários dos sorteios.</p>
                                            </div>
                                            <Button type="button" size="sm" onClick={() => append({ time: "00:00", lastSeries: 0 })}>
                                                <Plus className="w-4 h-4 mr-2" /> Adicionar Horário
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-2">
                                            {fields.map((field, index) => (
                                                <div key={field.id} className="flex items-end gap-2 p-3 bg-secondary/20 rounded-md border">
                                                    <FormField
                                                        control={form.control}
                                                        name={`extractionSeries.${index}.time`}
                                                        render={({ field }) => (
                                                            <FormItem className="flex-1">
                                                                <FormLabel className="text-xs">Horário (HH:mm)</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="19:00" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`extractionSeries.${index}.lastSeries`}
                                                        render={({ field }) => (
                                                            <FormItem className="flex-1">
                                                                <FormLabel className="text-xs">Últ./Série Atual</FormLabel>
                                                                <FormControl>
                                                                    <Input type="number" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => remove(index)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* --- RISK & OTHER TAB --- */}
                                <TabsContent value="risk" className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="maxLiability"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-2">
                                                        <ShieldAlert className="w-4 h-4" />
                                                        Limite de Risco (Liability)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="100" {...field} />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Valor máximo acumulado a pagar por Milhar antes de bloquear novas apostas nela.
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-lg p-4 mt-6">
                                        <FormField
                                            control={form.control}
                                            name="secondChanceEnabled"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-emerald-200 p-4 bg-white/50 mb-4">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base font-bold text-emerald-800">Segunda Chance</FormLabel>
                                                        <FormDescription className="text-emerald-600/80">
                                                            Habilitar sorteio extra acumulado semanal.
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        {form.watch("secondChanceEnabled") && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="secondChanceWeekday"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Dia da Semana</FormLabel>
                                                            <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={field.value?.toString()}>
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Selecione..." />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="0">Domingo</SelectItem>
                                                                    <SelectItem value="1">Segunda</SelectItem>
                                                                    <SelectItem value="2">Terça</SelectItem>
                                                                    <SelectItem value="3">Quarta</SelectItem>
                                                                    <SelectItem value="4">Quinta</SelectItem>
                                                                    <SelectItem value="5">Sexta</SelectItem>
                                                                    <SelectItem value="6">Sábado</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="secondChanceDrawTime"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Horário (HH:mm)</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="19:00" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="secondChanceRangeStart"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Range Inicial</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" placeholder="100000" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="secondChanceRangeEnd"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Range Final</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" placeholder="200000" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </form>
                    </Form>
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-muted/20">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit" form="game-form" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 min-w-[150px]">
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {isEditing ? "Salvar Alterações" : "Criar Jogo"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
