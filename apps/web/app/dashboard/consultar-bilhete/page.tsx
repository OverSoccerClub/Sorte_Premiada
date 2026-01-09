"use client"

import { useState } from "react"
import { API_URL } from "@/lib/api"
import { Search, Loader2, CheckCircle, XCircle, Clock, AlertTriangle, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { TicketDetails } from "@/components/dashboard/tickets/TicketDetails"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useActiveCompanyId } from "@/context/use-active-company"

export default function ConsultarBilhetePage() {
    const activeCompanyId = useActiveCompanyId()
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

            const queryParams = new URLSearchParams()
            if (activeCompanyId) queryParams.append('targetCompanyId', activeCompanyId)
            const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ''

            const res = await fetch(`${API_URL}/tickets/validate/${ticketId.trim()}${queryString}`, {
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



    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <Search className="w-8 h-8 text-emerald-500" />
                    </div>
                    Consultar Bilhete
                </h2>
                <p className="text-muted-foreground mt-1 ml-14">Verifique o status e resultado de um bilhete pelo código.</p>
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
                <TicketDetails data={result} />
            )}
        </div>
    )
}
