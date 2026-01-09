"use client"

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Plus, Copy, Check, Power, PowerOff, Calendar, Tag, RotateCw, MapPin, Search, User, Cpu, Radio, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppConfig } from "../../AppConfig";
import { StandardPageHeader } from "@/components/standard-page-header";
import { StandardPagination } from "@/components/standard-pagination";
import { toast } from "sonner";
import { useActiveCompanyId } from "@/context/use-active-company";
import { useCompany } from "@/context/company-context";
import { useAuth } from "@/context/auth-context";

interface PosDevice {
    id: string;
    name?: string;
    description?: string;
    deviceId: string;
    model?: string;
    activationCode?: string;
    activatedAt?: string;
    isActive: boolean;
    status: string;
    lastSeenAt: string;
    latitude?: number;
    longitude?: number;
    appVersion?: string;
    currentUser?: {
        name: string;
        username: string;
    };
    lastUser?: {
        name: string;
        username: string;
    };
    company?: {
        companyName: string;
    };
}

export default function PosManagementPage() {
    const activeCompanyId = useActiveCompanyId();
    const { user } = useAuth();
    const { settings } = useCompany();
    const [devices, setDevices] = useState<PosDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLINE' | 'ACTIVE' | 'PENDING'>('ALL');
    const [filter, setFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    // ... existing state ...
    const [limit, setLimit] = useState<number | "all">(10);
    const [activeTab, setActiveTab] = useState("monitoring");

    // Activation tab states
    const [isGenerating, setIsGenerating] = useState(false);
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [generatedCode, setGeneratedCode] = useState<{
        activationCode: string;
        name: string;
        id: string;
    } | null>(null);
    const [copiedCode, setCopiedCode] = useState(false);
    const [deviceName, setDeviceName] = useState("");
    const [deviceDescription, setDeviceDescription] = useState("");
    const [deviceToDelete, setDeviceToDelete] = useState<PosDevice | null>(null);

    const [tick, setTick] = useState(0);

    const fetchDevices = async () => {
        try {
            const token = localStorage.getItem("token");
            const queryParams = new URLSearchParams();
            if (activeCompanyId) {
                queryParams.append('targetCompanyId', activeCompanyId);
            }

            const res = await fetch(`${AppConfig.api.baseUrl}/devices?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDevices(data);
            }
        } catch (e) {
            console.error("Failed to fetch devices", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDevices();
        const interval = setInterval(fetchDevices, 30000);
        const tickInterval = setInterval(() => setTick(t => t + 1), 5000);

        return () => {
            clearInterval(interval);
            clearInterval(tickInterval);
        };
    }, [activeCompanyId]);

    // Gerar nome sugerido quando a lista de dispositivos ou nome da empresa mudar
    useEffect(() => {
        const nextNumber = devices.length + 1;
        const companyPrefix = settings?.companyName ? `${settings.companyName} - ` : '';
        const suggestedName = `${companyPrefix}POS ${String(nextNumber).padStart(3, '0')}`;
        setDeviceName(suggestedName);
    }, [devices.length, settings?.companyName]);

    // Helper to check online status (seen in last 2 minutes)
    const isOnline = (lastSeenAt: string, status?: string) => {
        if (status === 'offline') return false;
        const lastSeen = new Date(lastSeenAt).getTime();
        const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })).getTime();
        const diff = (now - lastSeen) / 1000 / 60; // diff in minutes
        return diff < 2;
    };

    const handleGenerateCode = async () => {
        if (!deviceName.trim()) return;

        setIsGenerating(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${AppConfig.api.baseUrl}/devices/generate-code`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: deviceName,
                    description: deviceDescription,
                    companyId: activeCompanyId
                })
            });

            if (res.ok) {
                const data = await res.json();
                setGeneratedCode(data);
                setShowCodeModal(true);
                setDeviceName("");
                setDeviceDescription("");
                fetchDevices();
                toast.success("Código gerado com sucesso!");
            } else {
                toast.error("Erro ao gerar código");
            }
        } catch (e) {
            console.error("Failed to generate code", e);
            toast.error("Erro ao gerar código");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyCode = () => {
        if (generatedCode) {
            navigator.clipboard.writeText(generatedCode.activationCode);
            setCopiedCode(true);
            toast.success("Código copiado!");
            setTimeout(() => setCopiedCode(false), 2000);
        }
    };

    const handleToggleDevice = async (deviceId: string, isActive: boolean) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${AppConfig.api.baseUrl}/devices/${deviceId}/toggle`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ isActive: !isActive })
            });

            if (res.ok) {
                toast.success(isActive ? "Dispositivo desativado" : "Dispositivo reativado");
                fetchDevices();
            } else {
                toast.error("Erro ao alterar status do dispositivo");
            }
        } catch (e) {
            console.error("Failed to toggle device", e);
            toast.error("Erro ao alterar status");
        }
    };

    const handleDeleteDevice = async () => {
        if (!deviceToDelete) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${AppConfig.api.baseUrl}/devices/${deviceToDelete.id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.ok) {
                toast.success("Dispositivo excluído com sucesso");
                fetchDevices();
                setDeviceToDelete(null);
            } else {
                toast.error("Erro ao excluir dispositivo");
            }
        } catch (e) {
            console.error("Failed to delete device", e);
            toast.error("Erro ao excluir");
        }
    };

    const filteredDevices = devices.filter(d => {
        const matchesSearch = d.deviceId.toLowerCase().includes(filter.toLowerCase()) ||
            d.name?.toLowerCase().includes(filter.toLowerCase()) ||
            d.currentUser?.name.toLowerCase().includes(filter.toLowerCase());

        if (!matchesSearch) return false;

        if (statusFilter === 'ALL') return true;
        if (statusFilter === 'ONLINE') return isOnline(d.lastSeenAt, d.status);
        if (statusFilter === 'ACTIVE') return d.isActive && d.activatedAt;
        if (statusFilter === 'PENDING') return !d.activatedAt;

        return true;
    });

    // ... pagination logic ...

    const totalItems = filteredDevices.length;
    const effectiveLimit = limit === "all" ? totalItems : limit;
    const totalPages = limit === "all" ? 1 : Math.ceil(totalItems / effectiveLimit);
    const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages || 1));

    const paginatedDevices = limit === "all"
        ? filteredDevices
        : filteredDevices.slice((validCurrentPage - 1) * effectiveLimit, validCurrentPage * effectiveLimit);

    useEffect(() => {
        setCurrentPage(1);
    }, [filter, statusFilter]);

    const handleLimitChange = (newLimit: number | "all") => {
        setLimit(newLimit);
        setCurrentPage(1);
    };

    // Counts for cards
    const onlineCount = devices.filter(d => isOnline(d.lastSeenAt, d.status)).length;
    const pendingCount = devices.filter(d => !d.activatedAt).length;
    const activeCount = devices.filter(d => d.isActive && d.activatedAt).length;

    return (
        <div className="space-y-6">
            <StandardPageHeader
                icon={<Smartphone className="w-8 h-8 text-emerald-500" />}
                title="Gestão de Dispositivos POS"
                description="Monitore terminais, gere códigos de ativação e controle o status dos dispositivos."
                onRefresh={fetchDevices}
                refreshing={loading}
            />

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card
                    className={`cursor-pointer transition-all hover:bg-accent ${statusFilter === 'ALL' ? 'border-primary shadow-sm bg-accent/50' : ''}`}
                    onClick={() => setStatusFilter('ALL')}
                >
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total</p>
                                <p className="text-2xl font-bold">{devices.length}</p>
                            </div>
                            <Smartphone className={`h-8 w-8 ${statusFilter === 'ALL' ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                    </CardContent>
                </Card>
                <Card
                    className={`cursor-pointer transition-all hover:bg-accent ${statusFilter === 'ONLINE' ? 'border-emerald-500 shadow-sm bg-emerald-50/10' : ''}`}
                    onClick={() => setStatusFilter('ONLINE')}
                >
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Online</p>
                                <p className="text-2xl font-bold text-emerald-600">{onlineCount}</p>
                            </div>
                            <div className={`h-8 w-8 rounded-full bg-emerald-500 ${statusFilter === 'ONLINE' ? '' : 'animate-pulse'}`} />
                        </div>
                    </CardContent>
                </Card>
                <Card
                    className={`cursor-pointer transition-all hover:bg-accent ${statusFilter === 'ACTIVE' ? 'border-blue-500 shadow-sm bg-blue-50/10' : ''}`}
                    onClick={() => setStatusFilter('ACTIVE')}
                >
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Ativos</p>
                                <p className="text-2xl font-bold text-blue-600">{activeCount}</p>
                            </div>
                            <Power className={`h-8 w-8 ${statusFilter === 'ACTIVE' ? 'text-blue-600' : 'text-blue-600/70'}`} />
                        </div>
                    </CardContent>
                </Card>
                <Card
                    className={`cursor-pointer transition-all hover:bg-accent ${statusFilter === 'PENDING' ? 'border-orange-500 shadow-sm bg-orange-50/10' : ''}`}
                    onClick={() => setStatusFilter('PENDING')}
                >
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                                <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
                            </div>
                            <Tag className={`h-8 w-8 ${statusFilter === 'PENDING' ? 'text-orange-600' : 'text-orange-600/70'}`} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
                    <TabsTrigger value="activation">Ativação</TabsTrigger>
                </TabsList>

                {/* Monitoring Tab */}
                <TabsContent value="monitoring" className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por ID, nome ou usuário..."
                                className="pl-8"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            />
                        </div>
                        <Button onClick={fetchDevices} variant="outline" size="icon">
                            <RotateCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>

                    <div className="rounded-md border bg-card">
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50">
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Dispositivo</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Empresa</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Modelo / Versão</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Usuário Atual</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Localização</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Visto por último</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {paginatedDevices.map((device) => {
                                        const online = isOnline(device.lastSeenAt, device.status);
                                        return (
                                            <tr key={device.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-4 align-middle">
                                                    <Badge variant={online ? "default" : "secondary"} className={online ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                                                        {online ? "ONLINE" : "OFFLINE"}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <div className="font-medium">{device.name || "Sem nome"}</div>
                                                    <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground mt-1">
                                                        <Radio className="w-3 h-3" />
                                                        {device.deviceId}
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <div className="font-medium text-sm text-foreground">{device.company?.companyName || "-"}</div>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <div className="font-medium flex items-center gap-1.5">
                                                        <Cpu className="w-3.5 h-3.5 text-slate-500" />
                                                        {device.model || "Genérico"}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                        <Tag className="w-3 h-3" />
                                                        {device.appVersion || "N/A"}
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    {device.currentUser ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs font-bold ring-1 ring-emerald-500/20">
                                                                {device.currentUser.username[0].toUpperCase()}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-foreground text-xs">{device.currentUser.username}</span>
                                                                <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                                                                    <User className="w-2.5 h-2.5" /> Logado
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs italic">Nenhum</span>
                                                    )}
                                                </td>
                                                <td className="p-4 align-middle">
                                                    {(device.latitude && device.longitude) ? (
                                                        <a
                                                            href={`https://www.google.com/maps?q=${device.latitude},${device.longitude}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 hover:underline text-xs bg-emerald-50 px-2 py-1 rounded border border-emerald-100 w-fit"
                                                        >
                                                            <MapPin className="w-3 h-3" />
                                                            Ver no Mapa
                                                        </a>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className="p-4 align-middle text-muted-foreground text-xs">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                        {new Date(device.lastSeenAt).toLocaleString('pt-BR')}
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle text-right">
                                                    {user?.role === 'MASTER' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => setDeviceToDelete(device)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {paginatedDevices.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="p-4 text-center text-muted-foreground">
                                                Nenhum dispositivo encontrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <StandardPagination
                            currentPage={validCurrentPage}
                            totalPages={totalPages}
                            limit={limit}
                            onPageChange={setCurrentPage}
                            onLimitChange={handleLimitChange}
                            totalItems={totalItems}
                        />
                    </div>
                </TabsContent>

                {/* Activation Tab */}
                <TabsContent value="activation" className="space-y-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Ativar Novo Dispositivo</h3>
                                    <p className="text-sm text-muted-foreground">Gere um código de ativação para configurar um novo terminal POS.</p>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="deviceName" className="flex items-center gap-2">
                                            Nome do Dispositivo *
                                            <Badge variant="outline" className="text-[10px] h-4 px-1">Automático</Badge>
                                        </Label>
                                        <Input
                                            id="deviceName"
                                            value={deviceName}
                                            readOnly
                                            disabled
                                            className="font-medium bg-muted text-muted-foreground cursor-not-allowed"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            🔒 O nome é gerado automaticamente para manter o padrão do sistema.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="deviceDescription">Descrição (Opcional)</Label>
                                        <Input
                                            id="deviceDescription"
                                            placeholder="Ex: Terminal principal da loja"
                                            value={deviceDescription}
                                            onChange={(e) => setDeviceDescription(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <Button
                                    onClick={handleGenerateCode}
                                    disabled={isGenerating || !deviceName.trim()}
                                    className="bg-emerald-500 hover:bg-emerald-600"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    {isGenerating ? "Gerando..." : "Gerar Código de Ativação"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Devices List */}
                    <div className="rounded-md border bg-card">
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50">
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Nome</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Código</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Ativado em</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {devices.map((device) => (
                                        <tr key={device.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle">
                                                <div className="font-medium">{device.name || "Sem nome"}</div>
                                                {device.description && (
                                                    <div className="text-xs text-muted-foreground">{device.description}</div>
                                                )}
                                            </td>
                                            <td className="p-4 align-middle">
                                                {device.activationCode ? (
                                                    <div className="font-mono text-sm bg-muted px-2 py-1 rounded w-fit">
                                                        {device.activationCode}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 align-middle">
                                                {!device.activatedAt ? (
                                                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                                        Pendente
                                                    </Badge>
                                                ) : device.isActive ? (
                                                    <Badge className="bg-emerald-500">Ativo</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Inativo</Badge>
                                                )}
                                            </td>
                                            <td className="p-4 align-middle text-muted-foreground text-xs">
                                                {device.activatedAt ? new Date(device.activatedAt).toLocaleString('pt-BR') : "-"}
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {user?.role === 'MASTER' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => setDeviceToDelete(device)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {device.activatedAt && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleToggleDevice(device.id, device.isActive)}
                                                        >
                                                            {device.isActive ? (
                                                                <>
                                                                    <PowerOff className="mr-2 h-4 w-4" />
                                                                    Desativar
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Power className="mr-2 h-4 w-4" />
                                                                    Reativar
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {devices.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-4 text-center text-muted-foreground">
                                                Nenhum dispositivo cadastrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Code Modal */}
            <Dialog open={showCodeModal} onOpenChange={setShowCodeModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <Smartphone className="w-5 h-5 text-emerald-500" />
                            </div>
                            Código Gerado com Sucesso!
                        </DialogTitle>
                        <DialogDescription>
                            Use este código para ativar o dispositivo no aplicativo mobile.
                        </DialogDescription>
                    </DialogHeader>
                    {generatedCode && (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg space-y-2">
                                <p className="text-sm font-medium">Dispositivo: {generatedCode.name}</p>
                                <div className="flex items-center justify-between gap-2 p-3 bg-background rounded border-2 border-emerald-500">
                                    <code className="text-2xl font-bold font-mono text-emerald-600">
                                        {generatedCode.activationCode}
                                    </code>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleCopyCode}
                                        className="shrink-0"
                                    >
                                        {copiedCode ? (
                                            <Check className="h-4 w-4 text-emerald-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm text-muted-foreground">
                                <p className="font-semibold text-foreground">Instruções:</p>
                                <ol className="list-decimal list-inside space-y-1">
                                    <li>Instale o aplicativo no dispositivo POS</li>
                                    <li>Abra o aplicativo pela primeira vez</li>
                                    <li>Digite o código acima na tela de ativação</li>
                                    <li>Aguarde a confirmação de ativação</li>
                                </ol>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={!!deviceToDelete} onOpenChange={(open) => !open && setDeviceToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Confirmar Exclusão
                        </DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir o dispositivo <strong>{deviceToDelete?.name}</strong>?
                            <br />
                            <br />
                            Esta ação é irreversível e removerá o histórico e configurações deste terminal.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeviceToDelete(null)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteDevice}>
                            Excluir Dispositivo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
