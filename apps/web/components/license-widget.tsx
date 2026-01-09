"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Shield, AlertTriangle, CheckCircle, Clock, ExternalLink } from "lucide-react";
import { AppConfig } from "@/app/AppConfig";
import { useAuth } from "@/context/auth-context";

export function LicenseWidget() {
    const router = useRouter();
    const { user, token } = useAuth();
    const [license, setLicense] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.role === "ADMIN" || user?.role === "MASTER") {
            fetchLicense();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchLicense = async () => {
        try {
            const response = await fetch(`${AppConfig.api.baseUrl}/company/license`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setLicense(data);
            }
        } catch (error) {
            console.error("Erro ao buscar licença:", error);
        } finally {
            setLoading(false);
        }
    };

    // Não mostrar para cambistas/cobradores
    if (user?.role !== "ADMIN" && user?.role !== "MASTER") {
        return null;
    }

    if (loading) {
        return (
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-emerald-500" />
                        Status da Licença
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground">Carregando...</div>
                </CardContent>
            </Card>
        );
    }

    if (!license) {
        return null;
    }

    const getStatusIcon = () => {
        if (license.status === "ACTIVE") return <CheckCircle className="w-5 h-5 text-green-500" />;
        if (license.status === "TRIAL") return <Clock className="w-5 h-5 text-blue-500" />;
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
    };

    const getStatusColor = () => {
        if (license.status === "ACTIVE") return "bg-green-500/10 text-green-600 border-green-500/30";
        if (license.status === "TRIAL") return "bg-blue-500/10 text-blue-600 border-blue-500/30";
        return "bg-red-500/10 text-red-600 border-red-500/30";
    };

    const daysRemaining = license.daysRemaining ?? license.trialDaysRemaining;
    const showWarning = daysRemaining !== null && daysRemaining <= 7;

    return (
        <Card className={`bg-card border-border ${showWarning ? "border-orange-500/50" : ""}`}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-500" />
                    Status da Licença
                </CardTitle>
                <CardDescription>Informações sobre sua licença</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {getStatusIcon()}
                        <span className="font-medium">Status</span>
                    </div>
                    <Badge variant="outline" className={getStatusColor()}>
                        {license.status === "TRIAL" ? "Trial" : license.status}
                    </Badge>
                </div>

                {/* Plano */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Plano</span>
                    <Badge variant="outline">{license.plan}</Badge>
                </div>

                {/* Dias Restantes */}
                {daysRemaining !== null && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Dias Restantes</span>
                            <span
                                className={`font-semibold ${daysRemaining <= 3
                                        ? "text-red-500"
                                        : daysRemaining <= 7
                                            ? "text-orange-500"
                                            : "text-green-500"
                                    }`}
                            >
                                {daysRemaining} dia{daysRemaining !== 1 ? "s" : ""}
                            </span>
                        </div>
                        <Progress
                            value={Math.max(0, Math.min(100, (daysRemaining / 30) * 100))}
                            className="h-2"
                        />
                    </div>
                )}

                {/* Avisos */}
                {license.warnings && license.warnings.length > 0 && (
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                            <div className="space-y-1">
                                {license.warnings.map((warning: string, i: number) => (
                                    <div key={i} className="text-xs text-orange-600">
                                        {warning}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Botão Ver Detalhes */}
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push("/dashboard/my-license")}
                >
                    Ver Detalhes
                    <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
            </CardContent>
        </Card>
    );
}
