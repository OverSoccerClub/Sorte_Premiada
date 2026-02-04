"use client"

import { API_URL } from "@/lib/api"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useAlert } from "@/context/alert-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MapPin, TrendingUp, DollarSign, Users, Loader2, Calendar, Search, ChevronDown, ChevronRight, BarChart, Filter } from "lucide-react"
import { useActiveCompanyId } from "@/context/use-active-company"
import { getBrazilToday } from '@/lib/date-utils'

interface CambistaStats {
    id: string
    name: string
    sales: number
    tickets: number
}

interface AreaStats {
    areaId: string
    areaName: string
    city: string
    state: string
    totalSales: number
    ticketsCount: number
    cambistasCount: number
    cambistas: CambistaStats[]
}

export default function AreaReportPage() {
    const activeCompanyId = useActiveCompanyId()
    const [areas, setAreas] = useState<AreaStats[]>([])
    const [loading, setLoading] = useState(false)
    const [startDate, setStartDate] = useState(getBrazilToday())
    const [endDate, setEndDate] = useState(getBrazilToday())
    const { showAlert } = useAlert()
    const [expandedAreaId, setExpandedAreaId] = useState<string | null>(null)

    const fetchReport = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem("token")
            let url = `${API_URL}/reports/sales-by-area?startDate=${startDate}&endDate=${endDate}`
            if (activeCompanyId) url += `&targetCompanyId=${activeCompanyId}`

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (res.ok) {
                const data = await res.json()
                setAreas(data)
            } else {
                showAlert("Erro", "Não foi possível carregar o relatório.", "error")
            }
        } catch (error) {
            showAlert("Erro de Conexão", "Verifique sua conexão e tente novamente.", "error")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchReport()
    }, [activeCompanyId])

    const toggleExpand = (areaId: string) => {
        setExpandedAreaId(expandedAreaId === areaId ? null : areaId)
    }

    const totalSalesAll = areas.reduce((acc, curr) => acc + curr.totalSales, 0)

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <MapPin className="w-8 h-8 text-emerald-500" />
                        </div>
                        Relatório por Área (Praça)
                    </h2>
                    <p className="text-muted-foreground mt-1 ml-14">Acompanhe o desempenho de vendas por região e cambista.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-emerald-500 text-white border-none shadow-lg shadow-emerald-500/20">
                    <CardContent className="pt-6">
                        <div className="text-emerald-100 text-sm font-medium mb-1">Vendas Totais no Período</div>
                        <div className="text-3xl font-bold">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSalesAll)}
                        </div>
                        <div className="mt-4 flex items-center text-xs text-emerald-100 bg-emerald-600/30 w-fit px-2 py-1 rounded">
                            <DollarSign className="w-3 h-3 mr-1" />
                            Receita Global
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border shadow-sm">
                    <CardContent className="pt-6">
                        <div className="text-muted-foreground text-sm font-medium mb-1">Praças Ativas</div>
                        <div className="text-3xl font-bold text-foreground">{areas.length}</div>
                        <div className="mt-4 flex items-center text-xs text-muted-foreground bg-muted w-fit px-2 py-1 rounded">
                            <MapPin className="w-3 h-3 mr-1" />
                            Regiões com Vendas
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border shadow-sm">
                    <CardContent className="pt-6">
                        <div className="text-muted-foreground text-sm font-medium mb-1">Melhor Desempenho</div>
                        <div className="text-xl font-bold text-foreground truncate">
                            {areas.length > 0 ? areas[0].areaName : "-"}
                        </div>
                        <div className="mt-4 flex items-center text-xs text-muted-foreground bg-muted w-fit px-2 py-1 rounded">
                            <BarChart className="w-3 h-3 mr-1" />
                            {areas.length > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(areas[0].totalSales) : "R$ 0,00"}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-border shadow-sm bg-card overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Filter className="w-5 h-5 text-emerald-500" />
                                Detalhamento por Praça
                            </CardTitle>
                            <CardDescription>Expanda para ver os cambistas de cada área.</CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center">
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="date"
                                        className="pl-9 w-[150px] bg-background border-border h-9"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <span className="text-muted-foreground">-</span>
                                <div className="relative">
                                    <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="date"
                                        className="pl-9 w-[150px] bg-background border-border h-9"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button
                                onClick={fetchReport}
                                disabled={loading}
                                size="sm"
                                className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {loading ? "..." : "Filtrar"}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-muted/50 bg-muted/20 border-b border-border/60">
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Praça (Área)</TableHead>
                                <TableHead>Cidade/UF</TableHead>
                                <TableHead className="text-center">Cambistas Ativos</TableHead>
                                <TableHead className="text-center">Qtd. Vendas</TableHead>
                                <TableHead className="text-right">Total Vendido</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {areas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        Nenhum dado encontrado para o período selecionado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                areas.map((area) => (
                                    <>
                                        <TableRow
                                            key={area.areaId}
                                            className="hover:bg-muted/50 transition-colors cursor-pointer border-b border-border/50"
                                            onClick={() => toggleExpand(area.areaId)}
                                        >
                                            <TableCell className="pl-4">
                                                {expandedAreaId === area.areaId ? (
                                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                                )}
                                            </TableCell>
                                            <TableCell className="font-semibold text-foreground">
                                                {area.areaName}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {area.city} - {area.state}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                                                    <Users className="w-3 h-3 mr-1 text-muted-foreground" />
                                                    {area.cambistasCount}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center text-muted-foreground">
                                                {area.ticketsCount}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-emerald-500 pr-6">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(area.totalSales)}
                                            </TableCell>
                                        </TableRow>
                                        {expandedAreaId === area.areaId && (
                                            <TableRow className="bg-muted/10 hover:bg-muted/10">
                                                <TableCell colSpan={6} className="p-0">
                                                    <div className="p-4 border-l-2 border-emerald-500 ml-6 my-2 bg-card rounded-r-lg shadow-sm mr-4">
                                                        <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                            <Users className="w-4 h-4" />
                                                            Desempenho dos Cambistas - {area.areaName}
                                                        </h4>
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow className="border-b border-border/50 hover:bg-transparent">
                                                                    <TableHead className="h-8 text-xs font-semibold pl-4">Cambista</TableHead>
                                                                    <TableHead className="h-8 text-xs font-semibold text-center">Qtd. Apostas</TableHead>
                                                                    <TableHead className="h-8 text-xs font-semibold text-right pr-4">Faturamento</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {area.cambistas.map((cambista) => (
                                                                    <TableRow key={cambista.id} className="border-0 hover:bg-transparent">
                                                                        <TableCell className="py-2 text-sm text-foreground font-medium pl-4">
                                                                            {cambista.name}
                                                                        </TableCell>
                                                                        <TableCell className="py-2 text-sm text-center text-muted-foreground">
                                                                            {cambista.tickets}
                                                                        </TableCell>
                                                                        <TableCell className="py-2 text-sm text-right text-emerald-600 font-semibold pr-4">
                                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cambista.sales)}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
