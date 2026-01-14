"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    BarChart3,
    TrendingUp,
    AlertTriangle,
    CreditCard,
    DollarSign,
    Download,
    Loader2,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Wallet
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StandardPageHeader } from "@/components/standard-page-header";
import { AppConfig } from "@/app/AppConfig";
import { useAuth } from "@/context/auth-context";
import { useAlert } from "@/context/alert-context";
// ... imports

export default function BillingPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { showAlert } = useAlert();

    // ...

    const fetchDashboardData = async () => {
        try {
            // ...
            if (metricsRes.ok && revenueRes.ok && inadimRes.ok) {
                setMetrics(await metricsRes.json());
                setRevenueData(await revenueRes.json());
                setInadimplentes(await inadimRes.json());
            } else {
                showAlert("Erro", "Erro ao carregar dados financeiros", "error");
            }
        } catch (error) {
            console.error(error);
            showAlert("Erro", "Erro de conexão", "error");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background border rounded p-2 shadow-md">
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-primary font-bold text-sm">
                        {formatCurrency(payload[0].value as number)}
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <StandardPageHeader
                title="Financeiro Global"
                description="Visão geral de receitas, inadimplência e projeções"
                icon={<Wallet className="h-6 w-6 text-emerald-600" />}
            />

            {/* Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receita Total (Mês)</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(metrics?.monthlyRevenue || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center">
                            Recebido este mês
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pendente (Futuro)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(metrics?.pendingAmount || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            A receber (vencimento futuro)
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inadimplência</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(metrics?.overdueAmount || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {metrics?.overdueCount} pagamentos atrasados
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                        <Wallet className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700">{formatCurrency(metrics?.totalRevenue || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Acumulado histórico
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
                {/* Gráfico de Receita */}
                <Card className="md:col-span-4">
                    <CardHeader>
                        <CardTitle>Receita Mensal</CardTitle>
                        <CardDescription>
                            Evolução dos pagamentos confirmados no ano atual
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[350px] w-full min-w-0">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                <BarChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `R$${value}`}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                    <Bar
                                        dataKey="total"
                                        fill="currentColor"
                                        radius={[4, 4, 0, 0]}
                                        className="fill-primary"
                                        barSize={40}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Lista de Inadimplência */}
                <Card className="md:col-span-3">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-red-600 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                Inadimplência
                            </CardTitle>
                            <CardDescription>
                                Empresas com pagamentos em atraso
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-[350px] overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Empresa</TableHead>
                                        <TableHead>Vencimento</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {inadimplentes.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                Nenhum atraso registrado 🎉
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        inadimplentes.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">
                                                    {item.company.companyName}
                                                    <div className="text-xs text-muted-foreground">{item.company.phone}</div>
                                                </TableCell>
                                                <TableCell className="text-red-600 font-medium text-xs">
                                                    {new Date(item.dueDate).toLocaleDateString("pt-BR")}
                                                </TableCell>
                                                <TableCell className="text-right font-bold">
                                                    {formatCurrency(Number(item.amount))}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
