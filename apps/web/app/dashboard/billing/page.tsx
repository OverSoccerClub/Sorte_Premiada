"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StandardPageHeader } from "@/components/standard-page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Loader2, CheckCircle, Clock, XCircle, AlertTriangle, Crown } from "lucide-react";
import { AppConfig } from "@/app/AppConfig";
import { useAuth } from "@/context/auth-context";
import { useActiveCompanyId } from "@/context/use-active-company";

interface Payment {
    id: string;
    company: {
        companyName: string;
    };
    amount: number;
    currency: string;
    status: string;
    method: string | null;
    referenceMonth: string;
    dueDate: string;
    paidAt: string | null;
    createdAt: string;
}

export default function BillingPage() {
    const activeCompanyId = useActiveCompanyId();
    const router = useRouter();
    const { user, token } = useAuth();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");

    useEffect(() => {
        if (user?.role !== "MASTER") {
            router.push("/dashboard");
            return;
        }

        fetchPayments();
    }, [user, filter, activeCompanyId]);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const url =
                filter === "all"
                    ? `${AppConfig.api.baseUrl}/billing/payments?limit=100`
                    : `${AppConfig.api.baseUrl}/billing/payments?status=${filter}&limit=100`;

            const finalUrl = activeCompanyId ? `${url}&targetCompanyId=${activeCompanyId}` : url;

            const response = await fetch(finalUrl, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setPayments(data.payments || []);
            }
        } catch (error) {
            console.error("Erro ao buscar pagamentos:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { color: string; icon: any; label: string }> = {
            PENDING: { color: "bg-blue-500/10 text-blue-600 border-blue-500/30", icon: Clock, label: "Pendente" },
            PAID: { color: "bg-green-500/10 text-green-600 border-green-500/30", icon: CheckCircle, label: "Pago" },
            OVERDUE: { color: "bg-red-500/10 text-red-600 border-red-500/30", icon: AlertTriangle, label: "Atrasado" },
            CANCELLED: { color: "bg-gray-500/10 text-gray-600 border-gray-500/30", icon: XCircle, label: "Cancelado" },
            REFUNDED: { color: "bg-orange-500/10 text-orange-600 border-orange-500/30", icon: XCircle, label: "Reembolsado" },
        };

        const variant = variants[status] || variants.PENDING;
        const Icon = variant.icon;

        return (
            <Badge variant="outline" className={variant.color}>
                <Icon className="w-3 h-3 mr-1" />
                {variant.label}
            </Badge>
        );
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: currency || "BRL",
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("pt-BR");
    };

    const totalPaid = payments
        .filter((p) => p.status === "PAID")
        .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalPending = payments
        .filter((p) => p.status === "PENDING")
        .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalOverdue = payments
        .filter((p) => p.status === "OVERDUE")
        .reduce((sum, p) => sum + Number(p.amount), 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <StandardPageHeader
                title="Gerenciamento de Billing"
                description="Visualize e gerencie todos os pagamentos do sistema"
                icon={<DollarSign className="w-8 h-8 text-emerald-500" />}
            >
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                    <Crown className="w-3 h-3 mr-1" />
                    MASTER
                </Badge>
            </StandardPageHeader>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Total Pago</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(totalPaid, "BRL")}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                            {payments.filter((p) => p.status === "PAID").length} pagamentos
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Total Pendente</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(totalPending, "BRL")}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                            {payments.filter((p) => p.status === "PENDING").length} pagamentos
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Total Atrasado</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(totalOverdue, "BRL")}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                            {payments.filter((p) => p.status === "OVERDUE").length} pagamentos
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filtros */}
            <div className="flex gap-2 flex-wrap">
                <Button
                    variant={filter === "all" ? "default" : "outline"}
                    onClick={() => setFilter("all")}
                    size="sm"
                >
                    Todos ({payments.length})
                </Button>
                <Button
                    variant={filter === "PAID" ? "default" : "outline"}
                    onClick={() => setFilter("PAID")}
                    size="sm"
                >
                    Pagos
                </Button>
                <Button
                    variant={filter === "PENDING" ? "default" : "outline"}
                    onClick={() => setFilter("PENDING")}
                    size="sm"
                >
                    Pendentes
                </Button>
                <Button
                    variant={filter === "OVERDUE" ? "default" : "outline"}
                    onClick={() => setFilter("OVERDUE")}
                    size="sm"
                >
                    Atrasados
                </Button>
            </div>

            {/* Tabela de Pagamentos */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle>Pagamentos ({payments.length})</CardTitle>
                    <CardDescription>Histórico completo de pagamentos</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Empresa</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Mês Ref.</TableHead>
                                <TableHead>Vencimento</TableHead>
                                <TableHead>Pago em</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments.map((payment) => (
                                <TableRow key={payment.id}>
                                    <TableCell>
                                        <div className="font-medium">{payment.company.companyName}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-semibold">
                                            {formatCurrency(Number(payment.amount), payment.currency)}
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                    <TableCell>{formatDate(payment.referenceMonth)}</TableCell>
                                    <TableCell>
                                        <div
                                            className={
                                                new Date(payment.dueDate) < new Date() && payment.status === "PENDING"
                                                    ? "text-red-500 font-semibold"
                                                    : ""
                                            }
                                        >
                                            {formatDate(payment.dueDate)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {payment.paidAt ? (
                                            <div className="text-green-600">{formatDate(payment.paidAt)}</div>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {payments.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            Nenhum pagamento encontrado
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
