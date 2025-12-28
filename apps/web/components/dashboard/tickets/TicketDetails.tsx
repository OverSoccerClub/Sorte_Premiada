import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CheckCircle, XCircle, Clock, ArrowRight, Ticket } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface TicketDetailsProps {
    data: any
    className?: string
}

export function TicketDetails({ data, className }: TicketDetailsProps) {
    if (!data || !data.ticket) return null

    const { ticket, status, message } = data

    // Helper to get status badge
    const getStatusBadge = (ticketStatus: string, validationStatus: string) => {
        // Priority logic: if ticket is explicitly cancelled in DB, show that.
        // Otherwise use the validation status.
        const finalStatus = ticketStatus === 'CANCELLED' ? 'CANCELLED' : validationStatus

        const map: Record<string, any> = {
            'WON': { label: 'Premiado', color: 'bg-emerald-500 hover:bg-emerald-600', icon: CheckCircle },
            'LOST': { label: 'Não Premiado', color: 'bg-red-500 hover:bg-red-600', icon: XCircle },
            'PENDING': { label: 'Aguardando Sorteio', color: 'bg-amber-500 hover:bg-amber-600', icon: Clock },
            'EXPIRED': { label: 'Expirado', color: 'bg-slate-500 hover:bg-slate-600', icon: Clock },
            'CANCELLED': { label: 'Cancelado', color: 'bg-slate-700 hover:bg-slate-800', icon: XCircle },
        }

        const info = map[finalStatus] || map[ticketStatus] || { label: finalStatus, color: 'bg-gray-500', icon: Clock }
        const Icon = info.icon

        return (
            <Badge className={`${info.color} flex items-center gap-1 text-sm py-1 px-3`}>
                <Icon className="w-4 h-4" />
                {info.label}
            </Badge>
        )
    }

    return (
        <Card className={`animate-in fade-in slide-in-from-bottom-4 duration-500 border-2 border-primary/10 shadow-lg ${className}`}>
            <CardHeader className="bg-muted/30 pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                            {ticket.game?.name || ticket.gameType}
                        </CardTitle>
                        <CardDescription className="mt-1 font-mono">
                            ID: {ticket.code || ticket.hash || ticket.id}
                        </CardDescription>
                    </div>
                    {getStatusBadge(ticket.status, status)}
                </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-muted-foreground block mb-1">Data da Aposta</span>
                        <span className="font-medium">
                            {format(new Date(ticket.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </span>
                    </div>
                    <div>
                        <span className="text-muted-foreground block mb-1">Data do Sorteio</span>
                        <span className="font-medium">
                            {ticket.drawDate
                                ? format(new Date(ticket.drawDate), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })
                                : "Não definido"}
                        </span>
                    </div>
                    <div>
                        <span className="text-muted-foreground block mb-1">Valor da Aposta</span>
                        <span className="font-medium text-emerald-600 font-bold">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(ticket.amount))}
                        </span>
                    </div>
                    <div>
                        <span className="text-muted-foreground block mb-1">Cambista</span>
                        <span className="font-medium">
                            {ticket.user?.name || ticket.user?.username || "N/A"}
                        </span>
                    </div>
                </div>

                <div className="h-[1px] bg-border my-6" />

                <div>
                    <span className="text-sm font-medium text-muted-foreground block mb-3 uppercase tracking-wider text-center">Números Apostados</span>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {(ticket.numbers || []).sort((a: any, b: any) => Number(a) - Number(b)).map((num: any, idx: number) => (
                            <div
                                key={idx}
                                className="h-10 px-3 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm font-mono text-base gap-2"
                            >
                                <Ticket className="w-4 h-4 text-emerald-400" />
                                {num.toString().padStart(4, '0')}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Second Chance Section */}
                {ticket.secondChanceNumber && (
                    <div className="mt-6 pt-4 border-t border-border">
                        <span className="text-sm font-medium text-emerald-600 block mb-3 uppercase tracking-wider flex items-center gap-2 justify-center">
                            <Ticket className="w-4 h-4" />
                            Segunda Chance
                        </span>
                        <div className="text-xs text-muted-foreground mb-2 text-center normal-case">
                            (Sorteio Extra: {ticket.secondChanceDrawDate ? new Date(ticket.secondChanceDrawDate).toLocaleDateString() : 'Sábado'})
                        </div>
                        <div className="flex items-center gap-2 justify-center">
                            {(ticket.secondChanceNumber.toString().split('').map((digit: string, idx: number) => (
                                <div
                                    key={`sc-${idx}`}
                                    className="w-12 h-12 rounded-lg bg-emerald-900 text-white flex items-center justify-center font-bold text-xl shadow-sm border border-emerald-500"
                                >
                                    {digit}
                                </div>
                            )))}
                        </div>
                    </div>
                )}

                {message && (
                    <div className={`p-4 rounded-lg text-center font-medium ${status === 'WON' ? 'bg-emerald-100 text-emerald-800' :
                        status === 'LOST' ? 'bg-red-100 text-red-800' :
                            'bg-blue-50 text-blue-800'
                        }`}>
                        {message}
                    </div>
                )}

                {data.nextDrawDate && (
                    <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-center font-medium text-sm mt-4">
                        Sorteio agendado para {format(new Date(data.nextDrawDate || ticket.drawDate), "dd/MM/yyyy, HH:mm:ss", { locale: ptBR })}
                    </div>
                )}

            </CardContent>
        </Card>
    )
}
