"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StandardPageHeader } from "@/components/standard-page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Loader2, CheckCircle, XCircle, AlertTriangle, Clock, Crown, Monitor, Ticket, Gamepad2, Users } from "lucide-react";
import { AppConfig } from "@/app/AppConfig";
import { useAuth } from "@/context/auth-context";

interface License {
    id: string;
    companyName: string;
    slug: string;
    licenseStatus: string;
    subscriptionPlan: string;
    licenseExpiresAt: string | null;
    trialEndsAt: string | null;
    daysRemaining: number | null;
    trialDaysRemaining: number | null;
    isActive: boolean;
    maxUsers: number;
    maxTicketsPerMonth: number;
    maxGames: number;
    maxActiveDevices?: number;
    usage: {
        users: number;
        games: number;
        tickets: number;
        devices: number;
    };
}

export default function LicensesPage() {
    const router = useRouter();
    const { user, token } = useAuth();
    const [licenses, setLicenses] = useState<License[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");

    useEffect(() => {
        if (user?.role !== "MASTER") {
            router.push("/dashboard");
            return;
        }

        fetchLicenses();
    }, [user]);

    const fetchLicenses = async () => {
        try {
            const response = await fetch(`${AppConfig.api.baseUrl}/license/all`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setLicenses(data.licenses || []);
            }
        } catch (error) {
            console.error("Erro ao buscar licenças:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { color: string; icon: any; label: string }> = {
            TRIAL: { color: "bg-blue-500/10 text-blue-600 border-blue-500/30", icon: Clock, label: "Trial" },
            ACTIVE: { color: "bg-green-500/10 text-green-600 border-green-500/30", icon: CheckCircle, label: "Ativa" },
            SUSPENDED: { color: "bg-orange-500/10 text-orange-600 border-orange-500/30", icon: AlertTriangle, label: "Suspensa" },
            EXPIRED: { color: "bg-red-500/10 text-red-600 border-red-500/30", icon: XCircle, label: "Expirada" },
            BLOCKED: { color: "bg-red-500/10 text-red-600 border-red-500/30", icon: XCircle, label: "Bloqueada" },
            CANCELLED: { color: "bg-gray-500/10 text-gray-600 border-gray-500/30", icon: XCircle, label: "Cancelada" },
        };

        const variant = variants[status] || variants.TRIAL;
        const Icon = variant.icon;

        return (
            <Badge variant="outline" className={variant.color}>
                <Icon className="w-3 h-3 mr-1" />
                {variant.label}
            </Badge>
        );
    };

    const getPlanBadge = (plan: string) => {
        const colors: Record<string, string> = {
            BASIC: "bg-slate-500/10 text-slate-600 border-slate-500/30",
            PRO: "bg-purple-500/10 text-purple-600 border-purple-500/30",
            ENTERPRISE: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
            CUSTOM: "bg-amber-500/10 text-amber-600 border-amber-500/30",
        };

        return (
            <Badge variant="outline" className={colors[plan] || colors.BASIC}>
                {plan}
            </Badge>
        );
    };

    const getDaysRemainingBadge = (days: number | null, status: string) => {
        if (days === null) {
            if (status === 'ACTIVE') return <span className="text-emerald-600 font-medium text-xs">Vitalício/Indefinido</span>;
            return <span className="text-muted-foreground text-xs">-</span>;
        }

        if (days <= 0) {
            return <span className="text-red-500 font-bold text-xs bg-red-100 dark:bg-red-900/20 px-2 py-0.5 rounded-full">Expirado</span>;
        } else if (days <= 3) {
            return <span className="text-red-500 font-bold text-xs bg-red-100 dark:bg-red-900/20 px-2 py-0.5 rounded-full">{days} dia(s)</span>;
        } else if (days <= 7) {
            return <span className="text-orange-500 font-bold text-xs bg-orange-100 dark:bg-orange-900/20 px-2 py-0.5 rounded-full">{days} dias</span>;
        } else {
            return <span className="text-muted-foreground text-xs font-medium">{days} dias</span>;
        }
    };

    const filteredLicenses = licenses.filter((license) => {
        if (filter === "all") return true;
        return license.licenseStatus === filter;
    });

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
                title="Gerenciamento de Licenças"
                description="Visualize e gerencie todas as licenças do sistema"
                icon={<Shield className="w-8 h-8 text-emerald-500" />}
            >
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                    <Crown className="w-3 h-3 mr-1" />
                    MASTER
                </Badge>
            </StandardPageHeader>

            {/* Filtros */}
            <div className="flex gap-2 flex-wrap">
                <Button
                    variant={filter === "all" ? "default" : "outline"}
                    onClick={() => setFilter("all")}
                    size="sm"
                >
                    Todas ({licenses.length})
                </Button>
                <Button
                    variant={filter === "ACTIVE" ? "default" : "outline"}
                    onClick={() => setFilter("ACTIVE")}
                    size="sm"
                >
                    Ativas ({licenses.filter((l) => l.licenseStatus === "ACTIVE").length})
                </Button>
                <Button
                    variant={filter === "TRIAL" ? "default" : "outline"}
                    onClick={() => setFilter("TRIAL")}
                    size="sm"
                >
                    Trial ({licenses.filter((l) => l.licenseStatus === "TRIAL").length})
                </Button>
                <Button
                    variant={filter === "EXPIRED" ? "default" : "outline"}
                    onClick={() => setFilter("EXPIRED")}
                    size="sm"
                >
                    Expiradas ({licenses.filter((l) => l.licenseStatus === "EXPIRED").length})
                </Button>
                <Button
                    variant={filter === "SUSPENDED" ? "default" : "outline"}
                    onClick={() => setFilter("SUSPENDED")}
                    size="sm"
                >
                    Suspensas ({licenses.filter((l) => l.licenseStatus === "SUSPENDED").length})
                </Button>
            </div>

            {/* Tabela de Licenças */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle>Licenças ({filteredLicenses.length})</CardTitle>
                    <CardDescription>
                        Clique em uma empresa para ver detalhes e gerenciar
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Empresa</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Plano</TableHead>
                                <TableHead>Dias Restantes</TableHead>
                                <TableHead>Uso</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLicenses.map((license) => (
                                <TableRow
                                    key={license.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => router.push(`/dashboard/licenses/${license.id}`)}
                                >
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{license.companyName}</div>
                                            <div className="text-sm text-muted-foreground">@{license.slug}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(license.licenseStatus)}</TableCell>
                                    <TableCell>{getPlanBadge(license.subscriptionPlan)}</TableCell>
                                    <TableCell>
                                        {license.licenseStatus === "TRIAL"
                                            ? getDaysRemainingBadge(license.trialDaysRemaining, license.licenseStatus)
                                            : getDaysRemainingBadge(license.daysRemaining, license.licenseStatus)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-3 min-w-[220px] py-1">
                                            {/* Users */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                                                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Usuários</span>
                                                    <span>{license.usage.users} / {license.maxUsers}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${license.usage.users > license.maxUsers ? 'bg-red-500' : 'bg-blue-500'}`}
                                                        style={{ width: `${Math.min(100, (license.usage.users / (license.maxUsers || 1)) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* POS Devices */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                                                    <span className="flex items-center gap-1"><Monitor className="w-3 h-3" /> POS / Disp.</span>
                                                    <span>{license.usage.devices} / {license.maxActiveDevices || 0}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${license.usage.devices > (license.maxActiveDevices || 0) ? 'bg-red-500' : 'bg-purple-500'}`}
                                                        style={{ width: `${Math.min(100, (license.usage.devices / (license.maxActiveDevices || 1)) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Tickets */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                                                    <span className="flex items-center gap-1"><Ticket className="w-3 h-3" /> Bilhetes (Mês)</span>
                                                    <span>{license.usage.tickets} / {license.maxTicketsPerMonth}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${license.usage.tickets > license.maxTicketsPerMonth ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                        style={{ width: `${Math.min(100, (license.usage.tickets / (license.maxTicketsPerMonth || 1)) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/dashboard/licenses/${license.id}`);
                                            }}
                                        >
                                            Gerenciar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {filteredLicenses.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            Nenhuma licença encontrada com o filtro selecionado
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
