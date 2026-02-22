"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { StandardPageHeader } from "@/components/standard-page-header";
import { Building2, Save, Upload, Phone, Mail, MapPin, Palette, Loader2, CheckCircle2, RefreshCw, Crown, Eye, Settings2 } from "lucide-react";
import { AppConfig } from "@/app/AppConfig";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";
import { useActiveCompanyId } from "@/context/use-active-company";
import { useAlert } from "@/context/alert-context";

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
    ticketTemplate: string;
    alternativeLogoWidth?: number;
    alternativeLogoHeight?: number;
    alternativeQrWidth?: number;
    alternativeQrHeight?: number;
    websiteUrl: string;
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
    ticketTemplate: "default",
    alternativeLogoWidth: 500,
    alternativeLogoHeight: 85,
    alternativeQrWidth: 120,
    alternativeQrHeight: 120,
    websiteUrl: "",
};

function CompanySettingsContent() {
    const { user } = useAuth();
    const activeCompanyId = useActiveCompanyId();
    // const searchParams = useSearchParams();
    // const targetCompanyId = searchParams.get('companyId'); // replaced by activeCompanyId

    const { showAlert } = useAlert();
    const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

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
    const handleChange = (field: keyof CompanySettings, value: string | number | boolean) => {
        setSettings((prev) => ({ ...prev, [field]: value }));
    };

    // Save settings
    const handleSave = async () => {
        setIsSaving(true);

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

            showAlert("Sucesso", "Configurações salvas com sucesso!", "success");
        } catch (err: any) {
            showAlert("Erro", err.message || "Erro ao salvar", "error");
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
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Configurações
                        </>
                    )}
                </Button>
            </StandardPageHeader>



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
                            <Label htmlFor="websiteUrl">URL do Site (para QR Code)</Label>
                            <Input
                                id="websiteUrl"
                                value={settings.websiteUrl || ""}
                                onChange={(e) => handleChange("websiteUrl", e.target.value)}
                                placeholder="www.banca.com.br"
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Define para onde o QR Code do bilhete redirecionará ao ser escaneado.
                            </p>
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

                        <div className="space-y-2">
                            <Label htmlFor="websiteUrl">URL do Site (para QR Code)</Label>
                            <Input
                                id="websiteUrl"
                                value={settings.websiteUrl || ""}
                                onChange={(e) => handleChange("websiteUrl", e.target.value)}
                                placeholder="www.suabanca.com.br"
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Esta URL será usada como base para os QR Codes impressos nos bilhetes.
                            </p>
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

                {/* Ticket Template Selection */}
                <Card className="bg-card border-border lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Eye className="w-5 h-5 text-emerald-500" />
                            Template de Bilhete
                        </CardTitle>
                        <CardDescription>
                            Escolha o layout dos bilhetes impressos
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Default Template */}
                            <div
                                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${settings.ticketTemplate === 'default'
                                    ? 'border-emerald-500 bg-emerald-500/10'
                                    : 'border-border hover:border-emerald-500/50'
                                    }`}
                                onClick={() => handleChange('ticketTemplate', 'default')}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${settings.ticketTemplate === 'default'
                                        ? 'border-emerald-500 bg-emerald-500'
                                        : 'border-border'
                                        }`}>
                                        {settings.ticketTemplate === 'default' && (
                                            <div className="w-2 h-2 bg-white rounded-full" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-sm mb-1">Padrão (Layout Vertical)</h4>
                                        <p className="text-xs text-muted-foreground mb-2">
                                            Layout tradicional com números em lista vertical
                                        </p>
                                        <div className="bg-muted/50 rounded p-2 text-[10px] space-y-1">
                                            <div className="font-mono">• Logo centralizado</div>
                                            <div className="font-mono">• Números em lista</div>
                                            <div className="font-mono">• Segunda Chance destacada</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Alternative Template */}
                            <div
                                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${settings.ticketTemplate === 'alternative'
                                    ? 'border-emerald-500 bg-emerald-500/10'
                                    : 'border-border hover:border-emerald-500/50'
                                    }`}
                                onClick={() => handleChange('ticketTemplate', 'alternative')}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${settings.ticketTemplate === 'alternative'
                                        ? 'border-emerald-500 bg-emerald-500'
                                        : 'border-border'
                                        }`}>
                                        {settings.ticketTemplate === 'alternative' && (
                                            <div className="w-2 h-2 bg-white rounded-full" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-sm mb-1">Alternativo (Fezinha de Hoje)</h4>
                                        <p className="text-xs text-muted-foreground mb-2">
                                            Layout em grid 2x2 com labels nos dígitos
                                        </p>
                                        <div className="bg-muted/50 rounded p-2 text-[10px] space-y-1">
                                            <div className="font-mono">• Grid 2x2 para fezinhas</div>
                                            <div className="font-mono">• Labels (um, dois, três...)</div>
                                            <div className="font-mono">• QR Code + Código de barras</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Milhar Template */}
                            <div
                                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${settings.ticketTemplate === 'milhar'
                                    ? 'border-emerald-500 bg-emerald-500/10'
                                    : 'border-border hover:border-emerald-500/50'
                                    }`}
                                onClick={() => handleChange('ticketTemplate', 'milhar')}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${settings.ticketTemplate === 'milhar'
                                        ? 'border-emerald-500 bg-emerald-500'
                                        : 'border-border'
                                        }`}>
                                        {settings.ticketTemplate === 'milhar' && (
                                            <div className="w-2 h-2 bg-white rounded-full" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-sm mb-1">Milhar (Compacto)</h4>
                                        <p className="text-xs text-muted-foreground mb-2">
                                            Layout compacto baseado na Fezinha, focado em Milhar
                                        </p>
                                        <div className="bg-muted/50 rounded p-2 text-[10px] space-y-1">
                                            <div className="font-mono">• Grid compacto</div>
                                            <div className="font-mono">• Texto "Milhar"</div>
                                            <div className="font-mono">• QR Code + Código de barras</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Configurações Avançadas dos Templates */}
                        <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-4 border border-border">
                            <h4 className="font-semibold text-sm flex items-center gap-2 text-emerald-600">
                                <Settings2 className="w-4 h-4" />
                                Personalizar Dimensões da Logomarca e QR Code
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Largura da Logo (px)</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            value={settings.alternativeLogoWidth || 500}
                                            onChange={(e) => handleChange("alternativeLogoWidth", parseInt(e.target.value))}
                                            className="font-mono"
                                            min={100}
                                            max={1000}
                                        />
                                        <span className="text-xs text-muted-foreground whitespace-nowrap w-24">Padrão: 500px</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Altura da Logo (px)</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            value={settings.alternativeLogoHeight || 85}
                                            onChange={(e) => handleChange("alternativeLogoHeight", parseInt(e.target.value))}
                                            className="font-mono"
                                            min={20}
                                            max={300}
                                        />
                                        <span className="text-xs text-muted-foreground whitespace-nowrap w-24">Padrão: 85px</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Largura QR Code (px)</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            value={settings.alternativeQrWidth || 120}
                                            onChange={(e) => handleChange("alternativeQrWidth", parseInt(e.target.value))}
                                            className="font-mono"
                                            min={50}
                                            max={300}
                                        />
                                        <span className="text-xs text-muted-foreground whitespace-nowrap w-24">Padrão: 120px</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Altura QR Code (px)</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            value={settings.alternativeQrHeight || 120}
                                            onChange={(e) => handleChange("alternativeQrHeight", parseInt(e.target.value))}
                                            className="font-mono"
                                            min={50}
                                            max={300}
                                        />
                                        <span className="text-xs text-muted-foreground whitespace-nowrap w-24">Padrão: 120px</span>
                                    </div>
                                </div>
                            </div>
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
        </div >
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
