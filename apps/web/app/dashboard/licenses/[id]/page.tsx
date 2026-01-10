"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StandardPageHeader } from "@/components/standard-page-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Loader2, CheckCircle, XCircle, AlertTriangle, ArrowLeft, Save, RefreshCw, Users, Ticket, Gamepad2, Smartphone, Calendar, TrendingUp, DollarSign, Clock } from "lucide-react";
import { AppConfig } from "@/app/AppConfig";
import { useAuth } from "@/context/auth-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function LicenseDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth(); // Removido token, vamos usar localStorage
    const companyId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [license, setLicense] = useState<any>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string>("");
    const [renewMonths, setRenewMonths] = useState(1);
    const [trialDays, setTrialDays] = useState(30);
    const [suspendReason, setSuspendReason] = useState("");
    const [limits, setLimits] = useState({
        maxUsers: 10,
        maxTicketsPerMonth: 1000,
        maxGames: 5,
        maxActiveDevices: 5,
    });
    const [payments, setPayments] = useState<any[]>([]);

    useEffect(() => {
        fetchLicenseDetails();
        fetchPlans();
        fetchPayments();
    }, [companyId]);

    const fetchLicenseDetails = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${AppConfig.api.baseUrl}/license/${companyId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Dados da licença recebidos:", data); // Debug
                setLicense(data);
                setLimits({
                    maxUsers: data.status.maxUsers || 10,
                    maxTicketsPerMonth: data.status.maxTicketsPerMonth || 1000,
                    maxGames: data.status.maxGames || 5,
                    maxActiveDevices: data.status.maxActiveDevices || 5,
                });
            }
        } catch (error) {
            console.error("Erro ao buscar detalhes:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPlans = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${AppConfig.api.baseUrl}/plans`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setPlans(data.filter((p: any) => p.isActive));
            }
        } catch (error) {
            console.error("Erro ao buscar planos:", error);
        }
    };

    const fetchPayments = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${AppConfig.api.baseUrl}/payments/company/${companyId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setPayments(data);
            }
        } catch (error) {
            console.error("Erro ao buscar pagamentos:", error);
        }
    };

    const handleActivate = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${AppConfig.api.baseUrl}/license/${companyId}/activate`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                toast.success("Empresa ativada com sucesso!");
                fetchLicenseDetails();
            } else {
                const error = await response.json();
                toast.error(error.message || "Erro ao ativar empresa");
            }
        } catch (error) {
            toast.error("Erro ao ativar empresa");
        } finally {
            setSaving(false);
        }
    };

    const handleSuspend = async () => {
        if (!suspendReason.trim()) {
            toast.error("Motivo da suspensão é obrigatório");
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${AppConfig.api.baseUrl}/license/${companyId}/suspend`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ reason: suspendReason }),
            });

            if (response.ok) {
                toast.success("Empresa suspensa com sucesso!");
                setSuspendReason("");
                fetchLicenseDetails();
            } else {
                const error = await response.json();
                toast.error(error.message || "Erro ao suspender empresa");
            }
        } catch (error) {
            toast.error("Erro ao suspender empresa");
        } finally {
            setSaving(false);
        }
    };

    const handleRenew = async () => {
        if (renewMonths < 1) {
            toast.error("Número de meses inválido");
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${AppConfig.api.baseUrl}/license/${companyId}/renew`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ months: renewMonths }),
            });

            if (response.ok) {
                toast.success(`Licença renovada por ${renewMonths} mês(es)!`);
                fetchLicenseDetails();
            } else {
                const error = await response.json();
                toast.error(error.message || "Erro ao renovar licença");
            }
        } catch (error) {
            toast.error("Erro ao renovar licença");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateLimits = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${AppConfig.api.baseUrl}/license/${companyId}/limits`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(limits),
            });

            if (response.ok) {
                toast.success("Limites atualizados com sucesso!");
                fetchLicenseDetails();
            } else {
                const error = await response.json();
                toast.error(error.message || "Erro ao atualizar limites");
            }
        } catch (error) {
            toast.error("Erro ao atualizar limites");
        } finally {
            setSaving(false);
        }
    };

    const handleSetTrial = async () => {
        if (trialDays < 1) {
            toast.error("Número de dias inválido");
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${AppConfig.api.baseUrl}/license/${companyId}/trial`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ trialDays }),
            });

            if (response.ok) {
                toast.success(`Período de teste configurado para ${trialDays} dia(s)!`);
                fetchLicenseDetails();
            } else {
                const error = await response.json();
                toast.error(error.message || "Erro ao configurar período de teste");
            }
        } catch (error) {
            toast.error("Erro ao configurar período de teste");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePlan = async () => {
        if (!selectedPlanId) {
            toast.error("Selecione um plano");
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${AppConfig.api.baseUrl}/plans/${selectedPlanId}/apply/${companyId}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                toast.success("Plano aplicado com sucesso!");
                setSelectedPlanId("");
                fetchLicenseDetails();
            } else {
                const error = await response.json();
                toast.error(error.message || "Erro ao aplicar plano");
            }
        } catch (error) {
            toast.error("Erro ao alterar plano");
        } finally {
            setSaving(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-500/10 text-green-600 border-green-500/30';
            case 'TRIAL': return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
            case 'EXPIRED': return 'bg-red-500/10 text-red-600 border-red-500/30';
            case 'SUSPENDED': return 'bg-orange-500/10 text-orange-600 border-orange-500/30';
            default: return 'bg-gray-500/10 text-gray-600 border-gray-500/30';
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
        return <div>Licença não encontrada</div>;
    }

    return (
        <div className="space-y-6">
            <StandardPageHeader
                title={license.status.companyName}
                description="Gerenciar assinatura, licença e limites de uso"
                icon={<Shield className="w-8 h-8 text-emerald-500" />}
            >
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                </Button>
            </StandardPageHeader>

            {/* Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Status</p>
                                <Badge className={`mt-2 ${getStatusColor(license.status.status)}`}>
                                    {license.status.status}
                                </Badge>
                            </div>
                            <Shield className="w-8 h-8 text-muted-foreground/20" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Plano Atual</p>
                                <p className="text-2xl font-bold mt-1">{license.status.plan}</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-muted-foreground/20" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Dias Restantes</p>
                                <p className="text-2xl font-bold mt-1">
                                    {license.status.daysRemaining !== null ? license.status.daysRemaining : (license.status.trialDaysRemaining !== null ? `${license.status.trialDaysRemaining} (Trial)` : "N/A")}
                                </p>
                            </div>
                            <Calendar className="w-8 h-8 text-muted-foreground/20" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Validade</p>
                                <p className="text-sm font-semibold mt-1">
                                    {license.status.licenseExpiresAt
                                        ? new Date(license.status.licenseExpiresAt).toLocaleDateString()
                                        : (license.status.trialEndsAt ? `${new Date(license.status.trialEndsAt).toLocaleDateString()} (Trial)` : "Indefinida")}
                                </p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-muted-foreground/20" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Warnings */}
            {license.status.warnings && license.status.warnings.length > 0 && (
                <Card className="border-orange-500/30 bg-orange-500/5">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                            <div className="space-y-1 flex-1">
                                {license.status.warnings.map((warning: string, i: number) => (
                                    <p key={i} className="text-sm text-orange-600 font-medium">
                                        {warning}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Plano e Renovação */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Gerenciar Assinatura</CardTitle>
                        <CardDescription>Altere o plano ou renove a licença</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Alterar Plano */}
                        <div className="space-y-3">
                            <Label className="text-base font-semibold">Alterar Plano</Label>
                            <div className="flex gap-3">
                                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Selecione um novo plano" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {plans.map((plan) => (
                                            <SelectItem key={plan.id} value={plan.id}>
                                                <div className="flex items-center justify-between w-full gap-4">
                                                    <span className="font-medium">{plan.name}</span>
                                                    <span className="text-emerald-600 font-semibold">
                                                        R$ {Number(plan.price).toFixed(2)}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={handleChangePlan}
                                    disabled={saving || !selectedPlanId}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Aplicar
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Os limites serão atualizados automaticamente ao aplicar o novo plano
                            </p>
                        </div>

                        <Separator />

                        {/* Renovar Licença */}
                        <div className="space-y-3">
                            <Label className="text-base font-semibold">Renovar Licença</Label>
                            <div className="flex gap-3">
                                <div className="flex-1 flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min="1"
                                        max="12"
                                        value={renewMonths}
                                        onChange={(e) => setRenewMonths(parseInt(e.target.value) || 1)}
                                        className="w-20"
                                    />
                                    <span className="text-sm text-muted-foreground">mês(es)</span>
                                </div>
                                <Button onClick={handleRenew} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Renovar
                                </Button>
                            </div>
                        </div>

                        <Separator />

                        {/* Configurar Período de Teste */}
                        <div className="space-y-3">
                            <Label className="text-base font-semibold">Configurar Período de Teste</Label>
                            <div className="flex gap-3">
                                <div className="flex-1 flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min="1"
                                        max="365"
                                        value={trialDays}
                                        onChange={(e) => setTrialDays(parseInt(e.target.value) || 1)}
                                        className="w-24"
                                    />
                                    <span className="text-sm text-muted-foreground">dia(s)</span>
                                </div>
                                <Button onClick={handleSetTrial} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Aplicar Trial
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Define o período de teste e muda o status para TRIAL
                            </p>
                        </div>

                        <Separator />

                        {/* Ações de Status */}
                        <div className="space-y-3">
                            <Label className="text-base font-semibold">Ações</Label>
                            <div className="flex gap-3">
                                {license.status.status !== "ACTIVE" && (
                                    <Button onClick={handleActivate} disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700">
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Ativar Empresa
                                    </Button>
                                )}

                                {license.status.status === "ACTIVE" && (
                                    <div className="flex-1 space-y-2">
                                        <Textarea
                                            placeholder="Motivo da suspensão..."
                                            value={suspendReason}
                                            onChange={(e) => setSuspendReason(e.target.value)}
                                            rows={2}
                                        />
                                        <Button
                                            onClick={handleSuspend}
                                            disabled={saving || !suspendReason.trim()}
                                            variant="destructive"
                                            className="w-full"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Suspender Empresa
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Uso Atual */}
                <Card>
                    <CardHeader>
                        <CardTitle>Uso Atual</CardTitle>
                        <CardDescription>Consumo vs limites do plano</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Usuários */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Usuários</span>
                                </div>
                                <span className="text-sm font-semibold">
                                    {license.limits.users.current}/{license.limits.users.max}
                                </span>
                            </div>
                            <Progress value={license.limits.users.percentage} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                                {license.limits.users.available} disponíveis
                            </p>
                        </div>

                        {/* Bilhetes */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Ticket className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Bilhetes/Mês</span>
                                </div>
                                <span className="text-sm font-semibold">
                                    {license.limits.tickets.current}/{license.limits.tickets.max}
                                </span>
                            </div>
                            <Progress value={license.limits.tickets.percentage} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                                {license.limits.tickets.available} disponíveis
                            </p>
                        </div>

                        {/* Jogos */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Gamepad2 className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Jogos</span>
                                </div>
                                <span className="text-sm font-semibold">
                                    {license.limits.games.current}/{license.limits.games.max}
                                </span>
                            </div>
                            <Progress value={license.limits.games.percentage} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                                {license.limits.games.available} disponíveis
                            </p>
                        </div>

                        {/* Dispositivos */}
                        {license.limits.devices && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Smartphone className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Dispositivos</span>
                                    </div>
                                    <span className="text-sm font-semibold">
                                        {license.limits.devices.current}/{license.limits.devices.max}
                                    </span>
                                </div>
                                <Progress value={license.limits.devices.percentage} className="h-2" />
                                <p className="text-xs text-muted-foreground">
                                    {license.limits.devices.available} disponíveis
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Limites Personalizados */}
            <Card>
                <CardHeader>
                    <CardTitle>Ajustar Limites Manualmente</CardTitle>
                    <CardDescription>Personalize os limites de uso desta empresa (sobrescreve o plano)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label>Máximo de Usuários</Label>
                            <Input
                                type="number"
                                min="1"
                                value={limits.maxUsers}
                                onChange={(e) => setLimits({ ...limits, maxUsers: parseInt(e.target.value) || 1 })}
                            />
                            <p className="text-xs text-muted-foreground">
                                Atual: {license.limits.users.current}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Máximo de Bilhetes/Mês</Label>
                            <Input
                                type="number"
                                min="1"
                                value={limits.maxTicketsPerMonth}
                                onChange={(e) =>
                                    setLimits({ ...limits, maxTicketsPerMonth: parseInt(e.target.value) || 1 })
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                Atual: {license.limits.tickets.current}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Máximo de Jogos</Label>
                            <Input
                                type="number"
                                min="1"
                                value={limits.maxGames}
                                onChange={(e) => setLimits({ ...limits, maxGames: parseInt(e.target.value) || 1 })}
                            />
                            <p className="text-xs text-muted-foreground">
                                Atual: {license.limits.games.current}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Máximo de Dispositivos</Label>
                            <Input
                                type="number"
                                min="1"
                                value={limits.maxActiveDevices}
                                onChange={(e) => setLimits({ ...limits, maxActiveDevices: parseInt(e.target.value) || 1 })}
                            />
                            <p className="text-xs text-muted-foreground">
                                Atual: {license.limits.devices?.current || 0}
                            </p>
                        </div>
                    </div>

                    <Button onClick={handleUpdateLimits} disabled={saving} className="mt-4">
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Limites Personalizados
                    </Button>
                </CardContent>
            </Card>

            {/* Histórico de Pagamentos */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Histórico de Pagamentos
                    </CardTitle>
                    <CardDescription>
                        Registro de pagamentos e renovações desta empresa
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="p-3 text-left font-medium">Vencimento</th>
                                    <th className="p-3 text-left font-medium">Valor</th>
                                    <th className="p-3 text-left font-medium">Referência</th>
                                    <th className="p-3 text-left font-medium">Status</th>
                                    <th className="p-3 text-left font-medium">Detalhes</th>
                                    <th className="p-3 text-left font-medium">Auditoria</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-4 text-center text-muted-foreground">
                                            Nenhum pagamento registrado
                                        </td>
                                    </tr>
                                ) : (
                                    payments.map((payment) => (
                                        <tr key={payment.id} className="border-b last:border-0 hover:bg-muted/50">
                                            <td className="p-3">
                                                <div className="font-medium">
                                                    {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                                                </div>
                                                {new Date(payment.dueDate) < new Date() && payment.status === 'PENDING' && (
                                                    <span className="text-xs text-red-600 font-semibold flex items-center gap-1">
                                                        <AlertTriangle className="w-3 h-3" /> Vencido
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 font-semibold">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(payment.amount))}
                                            </td>
                                            <td className="p-3 capitalize">
                                                {new Date(payment.referenceMonth).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                            </td>
                                            <td className="p-3">
                                                <Badge
                                                    variant={
                                                        payment.status === 'PAID' ? 'default' :
                                                            payment.status === 'PENDING' ? 'outline' :
                                                                payment.status === 'OVERDUE' ? 'destructive' :
                                                                    'secondary'
                                                    }
                                                    className="gap-1"
                                                >
                                                    {payment.status === 'PAID' && <CheckCircle className="w-3 h-3" />}
                                                    {payment.status === 'PENDING' && <Clock className="w-3 h-3" />}
                                                    {payment.status === 'OVERDUE' && <AlertTriangle className="w-3 h-3" />}
                                                    {payment.status === 'CANCELLED' && <XCircle className="w-3 h-3" />}
                                                    {payment.status === 'PAID' ? 'Pago' :
                                                        payment.status === 'PENDING' ? 'Pendente' :
                                                            payment.status === 'OVERDUE' ? 'Atrasado' :
                                                                payment.status === 'CANCELLED' ? 'Cancelado' : payment.status}
                                                </Badge>
                                                {payment.paidAt && (
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        Em: {new Date(payment.paidAt).toLocaleDateString('pt-BR')}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <div className="text-xs">
                                                    {payment.planName && <div className="font-medium text-foreground">{payment.planName}</div>}
                                                    <div className="text-muted-foreground truncate max-w-[200px]" title={payment.notes || ''}>
                                                        {payment.notes || '-'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3 text-xs text-muted-foreground">
                                                {payment.createdByName && (
                                                    <div title={`Criado por ${payment.createdByName} em ${new Date(payment.createdAt).toLocaleString()}`}>
                                                        Criado por: <span className="text-foreground">{payment.createdByName}</span>
                                                    </div>
                                                )}
                                                {payment.cancelledByName && (
                                                    <div className="text-red-600 mt-1" title={`Cancelado por ${payment.cancelledByName} em ${new Date(payment.cancelledAt).toLocaleString()}`}>
                                                        Cancelado por: <span className="font-medium">{payment.cancelledByName}</span>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
