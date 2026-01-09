"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { StandardPageHeader } from "@/components/standard-page-header";
import { Building2, Save, Upload, Phone, Mail, MapPin, Palette, Loader2, CheckCircle2, RefreshCw, Crown, Eye } from "lucide-react";
import { AppConfig } from "@/app/AppConfig";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";
import { useActiveCompanyId } from "@/context/use-active-company";

interface CompanySettings {
    id?: string;
    slug?: string;
    companyName: string;
    slogan: string;
    logoUrl: string;
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
    city: string;
    state: string;
    primaryColor: string;
    updateUrl: string;
    showPlanTotalValue: boolean;
}

const defaultSettings: CompanySettings = {
    slug: "",
    companyName: "A Perseverança",
    slogan: "Cambista Edition",
    logoUrl: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    city: "",
    state: "",
    primaryColor: "#50C878",
    updateUrl: "",
    showPlanTotalValue: true,
};

function CompanySettingsContent() {
    const { user } = useAuth();
    const activeCompanyId = useActiveCompanyId();
    // const searchParams = useSearchParams();
    // const targetCompanyId = searchParams.get('companyId'); // replaced by activeCompanyId

    const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch current settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Se MASTER e tem activeCompanyId, buscar configurações daquela empresa
                const url = activeCompanyId
                    ? `${AppConfig.api.baseUrl}/company/settings?targetCompanyId=${activeCompanyId}`
                    : `${AppConfig.api.baseUrl}/company/settings`;

                const response = await fetch(url, {
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setSettings({
                        ...defaultSettings,
                        ...data,
                    });
                }
            } catch (err) {
                console.error("Failed to fetch company settings:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, [activeCompanyId, user]);

    // Handle input changes
    const handleChange = (field: keyof CompanySettings, value: string) => {
        setSettings((prev) => ({ ...prev, [field]: value }));
        setSaveSuccess(false);
    };

    // Save settings
    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        setSaveSuccess(false);

        try {
            const token = localStorage.getItem("token");

            // Se MASTER e tem activeCompanyId, salvar configurações daquela empresa
            const url = activeCompanyId
                ? `${AppConfig.api.baseUrl}/company/settings?targetCompanyId=${activeCompanyId}`
                : `${AppConfig.api.baseUrl}/company/settings`;

            const response = await fetch(url, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(settings),
            });

            if (!response.ok) {
                throw new Error("Falha ao salvar configurações");
            }

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message || "Erro ao salvar");
        } finally {
            setIsSaving(false);
        }
    };

    // Handle logo upload (base64)
    const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleChange("logoUrl", reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <StandardPageHeader
                title="Configurações da Empresa"
                description={
                    activeCompanyId
                        ? `Editando configurações de: ${settings.companyName}`
                        : "Personalize as informações e identidade visual do sistema"
                }
                icon={<Building2 className="w-8 h-8 text-emerald-500" />}
            >
                {activeCompanyId && (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 mr-2">
                        <Crown className="w-3 h-3 mr-1" />
                        MASTER MODE
                    </Badge>
                )}
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-emerald-600 hover:bg-emerald-700"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Salvando...
                        </>
                    ) : saveSuccess ? (
                        <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Salvo!
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Configurações
                        </>
                    )}
                </Button>
            </StandardPageHeader>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Identidade Visual */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="w-5 h-5 text-emerald-500" />
                            Identidade Visual
                        </CardTitle>
                        <CardDescription>
                            Nome, logo e cores do sistema
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Slug Field (Read Only) */}
                        <div className="space-y-2">
                            <Label htmlFor="slug" className="flex items-center gap-2">
                                Identificador do Sistema (Slug)
                                <Badge variant="outline" className="text-[10px] h-5 bg-muted">Sistema</Badge>
                            </Label>
                            <Input
                                id="slug"
                                value={settings.slug || ""}
                                disabled
                                className="bg-muted text-muted-foreground font-mono"
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Identificador único usado na URL e API. Contate o suporte para alterar.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="companyName">Nome da Empresa</Label>
                            <Input
                                id="companyName"
                                value={settings.companyName}
                                onChange={(e) => handleChange("companyName", e.target.value)}
                                placeholder="Ex: Fezinha de Hoje"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="slogan">Slogan / Subtítulo</Label>
                            <Input
                                id="slogan"
                                value={settings.slogan || ""}
                                onChange={(e) => handleChange("slogan", e.target.value)}
                                placeholder="Ex: Cambista Edition"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Logo da Empresa</Label>
                            <div className="flex items-center gap-4">
                                {settings.logoUrl ? (
                                    <div className="w-20 h-20 rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center">
                                        <img
                                            src={settings.logoUrl}
                                            alt="Logo"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted">
                                        <Building2 className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        className="hidden"
                                        id="logo-upload"
                                    />
                                    <Label
                                        htmlFor="logo-upload"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg cursor-pointer transition-colors"
                                    >
                                        <Upload className="w-4 h-4" />
                                        Fazer Upload
                                    </Label>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        PNG ou JPG, máx. 2MB
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="primaryColor">Cor Principal</Label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    id="primaryColor"
                                    value={settings.primaryColor || "#50C878"}
                                    onChange={(e) => handleChange("primaryColor", e.target.value)}
                                    className="w-12 h-10 rounded cursor-pointer border border-border"
                                />
                                <Input
                                    value={settings.primaryColor || "#50C878"}
                                    onChange={(e) => handleChange("primaryColor", e.target.value)}
                                    placeholder="#50C878"
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Contatos */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Phone className="w-5 h-5 text-emerald-500" />
                            Informações de Contato
                        </CardTitle>
                        <CardDescription>
                            Dados de contato exibidos no app e tickets
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefone</Label>
                            <Input
                                id="phone"
                                value={settings.phone || ""}
                                onChange={(e) => handleChange("phone", e.target.value)}
                                placeholder="(00) 0000-0000"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="whatsapp">WhatsApp (Suporte)</Label>
                            <Input
                                id="whatsapp"
                                value={settings.whatsapp || ""}
                                onChange={(e) => handleChange("whatsapp", e.target.value)}
                                placeholder="5500900000000"
                            />
                            <p className="text-xs text-muted-foreground">
                                Formato internacional sem espaços ou símbolos
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={settings.email || ""}
                                onChange={(e) => handleChange("email", e.target.value)}
                                placeholder="contato@empresa.com"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Endereço */}
                <Card className="bg-card border-border lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-emerald-500" />
                            Endereço (Opcional)
                        </CardTitle>
                        <CardDescription>
                            Endereço físico da empresa
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="address">Endereço</Label>
                                <Input
                                    id="address"
                                    value={settings.address || ""}
                                    onChange={(e) => handleChange("address", e.target.value)}
                                    placeholder="Rua, número, bairro"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">Cidade</Label>
                                    <Input
                                        id="city"
                                        value={settings.city || ""}
                                        onChange={(e) => handleChange("city", e.target.value)}
                                        placeholder="Cidade"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state">Estado</Label>
                                    <Input
                                        id="state"
                                        value={settings.state || ""}
                                        onChange={(e) => handleChange("state", e.target.value)}
                                        placeholder="UF"
                                        maxLength={2}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Configurações de Exibição */}
                <Card className="bg-card border-border lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Eye className="w-5 h-5 text-emerald-500" />
                            Configurações de Exibição
                        </CardTitle>
                        <CardDescription>
                            Controle o que é exibido no sistema
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label htmlFor="showPlanTotalValue">Exibir Valor Total dos Planos</Label>
                                <p className="text-sm text-muted-foreground">
                                    Mostra o valor total calculado (preço × quantidade de POS) ao visualizar os planos disponíveis
                                </p>
                            </div>
                            <Switch
                                id="showPlanTotalValue"
                                checked={settings.showPlanTotalValue}
                                onCheckedChange={(checked) => handleChange("showPlanTotalValue", checked as any)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Atualização do Aplicativo - MASTER ONLY */}
                {user?.role === 'MASTER' && (
                    <Card className="bg-card border-border lg:col-span-2 border-emerald-500/20 bg-emerald-500/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <RefreshCw className="w-5 h-5 text-emerald-500" />
                                Atualização do Aplicativo (Master Only)
                            </CardTitle>
                            <CardDescription>
                                Configure o repositório onde o App mobile buscará novas versões
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="updateUrl">URL do Repositório</Label>
                                <Input
                                    id="updateUrl"
                                    value={settings.updateUrl || ""}
                                    onChange={(e) => handleChange("updateUrl", e.target.value)}
                                    placeholder="Ex: https://meu-repo.com/app"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Esta URL será usada pelo aplicativo para baixar o arquivo <strong>version.json</strong> e o <strong>APK</strong>.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Preview */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle>Pré-visualização</CardTitle>
                    <CardDescription>
                        Como o nome e logo aparecerão no sistema
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="bg-sidebar p-6 rounded-lg inline-flex items-center gap-3">
                        {settings.logoUrl ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                                <img
                                    src={settings.logoUrl}
                                    alt="Logo Preview"
                                    className="max-w-full max-h-full object-contain"
                                />
                            </div>
                        ) : (
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: settings.primaryColor || "#50C878" }}
                            >
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                        )}
                        <div>
                            <span className="font-bold text-xl text-white">
                                {settings.companyName || "Nome da Empresa"}
                            </span>
                            {settings.slogan && (
                                <p className="text-xs text-muted-foreground">
                                    {settings.slogan}
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Wrapper com Suspense para Next.js 15
export default function CompanySettingsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <CompanySettingsContent />
        </Suspense>
    );
}
