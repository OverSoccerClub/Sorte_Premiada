"use client"

import { API_URL } from "@/lib/api"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download } from "lucide-react"
import { toast } from "sonner"
import { useActiveCompanyId } from "@/context/use-active-company"

export default function TransactionsExportPage() {
    const activeCompanyId = useActiveCompanyId()
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

    const exportCsv = () => {
        const token = localStorage.getItem("token")
        if (!token) {
            toast.error("Usuário não autenticado")
            return
        }
        const startStr = new Date(startDate + 'T00:00:00').toISOString()
        const endStr = new Date(endDate + 'T23:59:59').toISOString()
        let url = `${API_URL}/reports/transactions/export?startDate=${encodeURIComponent(startStr)}&endDate=${encodeURIComponent(endStr)}&token=${token}`
        if (activeCompanyId) url += `&targetCompanyId=${activeCompanyId}`

        window.open(url, "_blank")
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <Download className="w-8 h-8 text-emerald-500" />
                    </div>
                    Exportar Transações
                </h2>
                <p className="text-muted-foreground mt-1 ml-14">Gere um CSV com todas as transações no período selecionado.</p>
            </div>

            <Card className="border-border shadow-sm bg-card">
                <CardHeader>
                    <CardTitle>Período de Exportação</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-2">
                            <Label>Data Inicial</Label>
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Data Final</Label>
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                        <Button onClick={exportCsv} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Download className="w-4 h-4 mr-2" /> Exportar CSV
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
