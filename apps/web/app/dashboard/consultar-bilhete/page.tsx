"use client"

import { useState } from "react"
import { API_URL } from "@/lib/api"
import { Search, Loader2, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function ConsultarBilhetePage() {
    const [ticketId, setTicketId] = useState("")
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState("")

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!ticketId.trim()) return

        setLoading(true)
        setError("")
        setResult(null)

        try {
            const token = localStorage.getItem("token")
            // Assuming we have a dedicated endpoint or using a generic one.
            // The plan mentioned creating logic.
            // For now, let's use the mobile validation endpoint or similar if open.
            // Mobile uses: GET /tickets/validate/:id
            // The backend controller is @Get('validate/:id')

            const res = await fetch(`${API_URL}/tickets/validate/${ticketId.trim()}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            })

            if (res.ok) {
                const data = await res.json()
                setResult(data)
            } else {
                const errData = await res.json().catch(() => ({}))
                setError(errData.message || "Bilhete não encontrado ou inválido.")
            }
        } catch (err) {
            console.error(err)
            setError("Erro ao conectar com o servidor.")
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const map: Record<string, any> = {
            'WON': { label: 'Premiado', color: 'bg-emerald-500 hover:bg-emerald-600', icon: CheckCircle },
            'LOST': { label: 'Não Premiado', color: 'bg-red-500 hover:bg-red-600', icon: XCircle },
            'PENDING': { label: 'Aguardando Sorteio', color: 'bg-amber-500 hover:bg-amber-600', icon: Clock },
            'EXPIRED': { label: 'Expirado', color: 'bg-slate-500 hover:bg-slate-600', icon: Clock },
            'CANCELLED': { label: 'Cancelado', color: 'bg-slate-700 hover:bg-slate-800', icon: XCircle },
        }
        const info = map[status] || { label: status, color: 'bg-gray-500', icon: Clock }
        const Icon = info.icon

        return (
            <Badge className={`${info.color} flex items-center gap-1 text-sm py-1 px-3`}>
                <Icon className="w-4 h-4" />
                {info.label}
            </Badge>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Consultar Bilhete</h2>
                <p className="text-muted-foreground">Verifique o status e resultado de um bilhete pelo código.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Buscar Bilhete</CardTitle>
                    <CardDescription>Digite o código ou hash do bilhete abaixo.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <Input
                            placeholder="Ex: A1B2C3D4"
                            value={ticketId}
                            onChange={(e) => setTicketId(e.target.value.toUpperCase())}
                            className="font-mono uppercase"
                        />
                        <Button type="submit" disabled={loading || !ticketId.trim()} className="bg-emerald-600 hover:bg-emerald-700">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                            Consultar
                        </Button>
                    </form>

                    {error && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Erro</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {result && result.ticket && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 border-2 border-primary/10 shadow-lg">
                    <CardHeader className="bg-muted/30 pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    {result.ticket.game?.name || result.ticket.gameType}
                                </CardTitle>
                                <CardDescription className="mt-1 font-mono">
                                    ID: {result.ticket.id}
                                </CardDescription>
                            </div>
                            {getStatusBadge(result.status || result.ticket.status)}
                        </div>
                    </CardHeader>

                    <CardContent className="pt-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground block mb-1">Data da Aposta</span>
                                <span className="font-medium">
                                    {format(new Date(result.ticket.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block mb-1">Data do Sorteio</span>
                                <span className="font-medium">
                                    {result.ticket.drawDate
                                        ? format(new Date(result.ticket.drawDate), "dd/MM/yyyy 'às' hh:mm:ss a")
                                        : "Não definido"}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block mb-1">Valor da Aposta</span>
                                <span className="font-medium text-emerald-600 font-bold">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(result.ticket.amount))}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block mb-1">Cambista</span>
                                <span className="font-medium">
                                    {result.ticket.user?.name || result.ticket.user?.username || "N/A"}
                                </span>
                            </div>
                        </div>

                        <div className="h-[1px] bg-border my-6" />

                        <div>
                            <span className="text-sm font-medium text-muted-foreground block mb-3 uppercase tracking-wider">Números Apostados</span>
                            <div className="flex flex-wrap gap-2">
                                {(result.ticket.numbers || []).sort((a: number, b: number) => a - b).map((num: number, idx: number) => (
                                    <div
                                        key={idx}
                                        className="h-10 px-3 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm font-mono text-base"
                                    >
                                        {num.toString().padStart(4, '0')}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Second Chance Section */}
                        {result.ticket.secondChanceNumber && (
                            <div className="mt-6 pt-4 border-t border-border">
                                <span className="text-sm font-medium text-emerald-600 block mb-3 uppercase tracking-wider flex items-center gap-2">
                                    <Ticket className="w-4 h-4" />
                                    Segunda Chance
                                    <span className="text-xs text-muted-foreground ml-2 normal-case">
                                        (Sorteio Extra: {result.ticket.secondChanceDrawDate ? new Date(result.ticket.secondChanceDrawDate).toLocaleDateString() : 'Sábado'})
                                    </span>
                                </span>
                                <div className="flex items-center gap-2">
                                    {(result.ticket.secondChanceNumber.toString().split('').map((digit: string, idx: number) => (
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

                        {result.message && (
                            <div className={`p-4 rounded-lg text-center font-medium ${result.status === 'WON' ? 'bg-emerald-100 text-emerald-800' :
                                result.status === 'LOST' ? 'bg-red-100 text-red-800' :
                                    'bg-blue-50 text-blue-800'
                                }`}>
                                {result.message}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
