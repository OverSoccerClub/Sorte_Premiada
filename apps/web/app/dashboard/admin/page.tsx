"use client";

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { StandardPageHeader } from "@/components/standard-page-header"
import { ShieldCheck, Plus, Building2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { API_URL } from "@/lib/api"
import { CreateCompanyDialog } from "@/components/admin/create-company-dialog"
import { useAlert } from "@/context/alert-context"

interface CompanySummary {
    id: string
    companyName: string
    slug: string
    createdAt: string
    _count?: {
        users: number
        games: number
    }
}

export default function AdminDashboardPage() {
    const { user, loading: authLoading } = useAuth()
    const { showAlert } = useAlert()
    const router = useRouter()
    const [companies, setCompanies] = useState<CompanySummary[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    useEffect(() => {
        if (!authLoading && user?.role !== 'MASTER') {
            showAlert("Erro!", "Acesso negado. Apenas Master Admin.", "error")
            router.replace("/dashboard")
        }
    }, [user, authLoading, router])

    const fetchCompanies = async () => {
        setIsLoading(true)
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_URL}/company/all`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setCompanies(data)
            } else {
                showAlert("Erro!", "Erro ao carregar empresas", "error")
            }
        } catch (error) {
            console.error(error)
            showAlert("Erro!", "Erro de conexão", "error")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (user?.role === 'MASTER') {
            fetchCompanies()
        }
    }, [user])

    if (authLoading || user?.role !== 'MASTER') {
        return null // Or generic loading spinner
    }

    return (
        <div className="space-y-6">
            <StandardPageHeader
                icon={<ShieldCheck className="w-6 h-6 text-emerald-600" />}
                title="Administração Global"
                description="Gestão de Multi-Tenancy (Empresas e Acessos)"
                onRefresh={fetchCompanies}
                refreshing={isLoading}
            >
                <Button onClick={() => setIsCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Empresa
                </Button>
            </StandardPageHeader>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{companies.length}</div>
                    </CardContent>
                </Card>
                {/* Add more stats later */}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Empresas Cadastradas</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Empresa</TableHead>
                                <TableHead>Slug (Identificador)</TableHead>
                                <TableHead>Criado Em</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {companies.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        Nenhuma empresa encontrada.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                companies.map(company => (
                                    <TableRow key={company.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{company.companyName}</span>
                                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{company.id}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-mono bg-muted/50">
                                                {company.slug}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(company.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.push(`/dashboard/settings/company?companyId=${company.id}`)}
                                                title="Editar configurações da empresa"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <CreateCompanyDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSuccess={fetchCompanies}
            />
        </div>
    )
}
