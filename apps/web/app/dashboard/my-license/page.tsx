"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StandardPageHeader } from "@/components/standard-page-header";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Loader2, Users, Ticket, Gamepad2, DollarSign, History } from "lucide-react";
import { AppConfig } from "@/app/AppConfig";
import { useAuth } from "@/context/auth-context";
import { useActiveCompanyId } from "@/context/use-active-company";

export default function MyLicensePage() {
    const activeCompanyId = useActiveCompanyId();
    const router = useRouter();
    const { user, token } = useAuth();
    const [license, setLicense] = useState<any>(null);
    const [usage, setUsage] = useState<any>(null);
    const [payments, setPayments] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.role !== "ADMIN" && user?.role !== "MASTER") {
            router.push("/dashboard");
            return;
        }

        fetchData();
    }, [user, activeCompanyId]);

    const fetchData = async () => {
        try {
            const queryParams = new URLSearchParams();
            if (activeCompanyId) queryParams.append("targetCompanyId", activeCompanyId);
            const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

            // Buscar licença
            const licenseRes = await fetch(`${AppConfig.api.baseUrl}/company/license${queryString}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (licenseRes.ok) {
                setLicense(await licenseRes.json());
            }

            // Buscar uso
            const usageRes = await fetch(`${AppConfig.api.baseUrl}/company/license/usage${queryString}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (usageRes.ok) {
                setUsage(await usageRes.json());
            }

            // Buscar pagamentos
            const paymentsRes = await fetch(`${AppConfig.api.baseUrl}/company/license/payments${queryString}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (paymentsRes.ok) {
                const data = await paymentsRes.json();
                setPayments(data.payments || []);
            }

            // Buscar histórico
            const historyRes = await fetch(`${AppConfig.api.baseUrl}/company/license/history${queryString}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (historyRes.ok) {
                const data = await historyRes.json();
                setHistory(data.history || []);
            }
        } catch (error) {
            console.error("Erro ao buscar dados:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!license) {
        return <div>Erro ao carregar licença</div>;
    }

    const formatDate = (date: string) => new Date(date).toLocaleDateString("pt-BR");
    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);

    return (
        <div className="space-y-6">
            <StandardPageHeader
                title="Minha Licença"
                description="Informações sobre sua licença e uso do sistema"
                icon={<Shield className="w-8 h-8 text-emerald-500" />}
            />

            {/* Cards de Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Badge
                            variant="outline"
                            className={
                                license.status === "ACTIVE"
                                    ? "bg-green-500/10 text-green-600"
                                    : "bg-blue-500/10 text-blue-600"
                            }
                        >
                            {license.status}
                        </Badge>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Plano</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{license.plan}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Dias Restantes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div
                            className={`text-2xl font-bold ${(license.daysRemaining ?? license.trialDaysRemaining) <= 7
                                ? "text-red-500"
                                : "text-green-500"
                                }`}
                        >
                            {license.daysRemaining ?? license.trialDaysRemaining ?? "N/A"}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Vencimento</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm">
                            {license.licenseExpiresAt
                                ? formatDate(license.licenseExpiresAt)
                                : license.trialEndsAt
                                    ? formatDate(license.trialEndsAt)
                                    : "N/A"}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Uso Atual */}
            {usage && (
                <Card>
                    <CardHeader>
                        <CardTitle>Uso Atual</CardTitle>
                        <CardDescription>Seu uso em relação aos limites do plano</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Usuários */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Usuários</span>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    {usage.limits.users.current} / {usage.limits.users.max}
                                </span>
                            </div>
                            <Progress value={usage.limits.users.percentage} className="h-2" />
                            {usage.limits.users.exceeded && (
                                <div className="text-xs text-red-500">⚠️ Limite excedido!</div>
                            )}
                        </div>

                        {/* Bilhetes */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Ticket className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Bilhetes (mês atual)</span>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    {usage.limits.tickets.current} / {usage.limits.tickets.max}
                                </span>
                            </div>
                            <Progress value={usage.limits.tickets.percentage} className="h-2" />
                            {usage.limits.tickets.exceeded && (
                                <div className="text-xs text-red-500">⚠️ Limite excedido!</div>
                            )}
                        </div>

                        {/* Jogos */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Gamepad2 className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Jogos</span>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    {usage.limits.games.current} / {usage.limits.games.max}
                                </span>
                            </div>
                            <Progress value={usage.limits.games.percentage} className="h-2" />
                            {usage.limits.games.exceeded && (
                                <div className="text-xs text-red-500">⚠️ Limite excedido!</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Histórico de Pagamentos */}
            {payments.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-emerald-500" />
                            Histórico de Pagamentos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Mês Ref.</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Vencimento</TableHead>
                                    <TableHead>Pago em</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.slice(0, 5).map((payment: any) => (
                                    <TableRow key={payment.id}>
                                        <TableCell>{formatDate(payment.referenceMonth)}</TableCell>
                                        <TableCell className="font-semibold">
                                            {formatCurrency(Number(payment.amount))}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    payment.status === "PAID"
                                                        ? "bg-green-500/10 text-green-600"
                                                        : "bg-orange-500/10 text-orange-600"
                                                }
                                            >
                                                {payment.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatDate(payment.dueDate)}</TableCell>
                                        <TableCell>
                                            {payment.paidAt ? formatDate(payment.paidAt) : "-"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Histórico de Mudanças */}
            {history.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="w-5 h-5 text-emerald-500" />
                            Histórico de Mudanças
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {history.slice(0, 5).map((item: any) => (
                                <div
                                    key={item.id}
                                    className="flex items-start gap-3 pb-3 border-b border-border last:border-0"
                                >
                                    <div className="flex-1">
                                        <div className="font-medium">{item.action}</div>
                                        {item.reason && (
                                            <div className="text-sm text-muted-foreground">{item.reason}</div>
                                        )}
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {formatDate(item.createdAt)}
                                            {item.performedByName && ` • por ${item.performedByName}`}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
