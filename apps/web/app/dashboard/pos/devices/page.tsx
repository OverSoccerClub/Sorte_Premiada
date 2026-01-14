"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Smartphone, Plus, Copy, Check, Power, PowerOff, Calendar, Tag, User, MapPin, Clock, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppConfig } from "../../../AppConfig";
import { StandardCardHeader } from "@/components/standard-card-header";
import { useActiveCompanyId } from "@/context/use-active-company";
import { useAlert } from "@/context/alert-context";

interface PosDevice {
    id: string;
    name: string;
    description?: string;
    deviceId: string;
    activationCode?: string;
    activatedAt?: string;
    isActive: boolean;
    status: string;
    lastSeenAt: string;
    model?: string;
    appVersion?: string;
    latitude?: number;
    longitude?: number;
    company?: {
        companyName: string;
    };
    currentUser?: {
        id: string;
        name: string;
        username: string;
        role: string;
    };
    lastUser?: {
        name: string;
        username: string;
    };
}

export default function DeviceManagementPage() {
    const activeCompanyId = useActiveCompanyId();
    const { showAlert } = useAlert();
    const [devices, setDevices] = useState<PosDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [generatedCode, setGeneratedCode] = useState<{
        code: string;
        name: string;
        id: string;
    } | null>(null);
    const [copiedCode, setCopiedCode] = useState(false);

    // Form state
    const [deviceName, setDeviceName] = useState("");
    const [deviceDescription, setDeviceDescription] = useState("");

    useEffect(() => {
        fetchDevices();
    }, [activeCompanyId]);

    const fetchDevices = async () => {
        try {
            const token = localStorage.getItem("token");
            const queryParams = new URLSearchParams();
            if (activeCompanyId) {
                queryParams.append('targetCompanyId', activeCompanyId);
            }
            const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

            const response = await fetch(`${AppConfig.api.baseUrl}/devices${queryString}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setDevices(data);
            }
        } catch (error) {
            console.error("Erro ao buscar dispositivos:", error);
            showAlert("Erro", "Não foi possível carregar os dispositivos", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateCode = async () => {
        if (!deviceName.trim()) {
            showAlert("Atenção", "Por favor, informe o nome do dispositivo", "warning");
            return;
        }

        setIsGenerating(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${AppConfig.API_BASE_URL}/devices/generate-code`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: deviceName,
                    description: deviceDescription,
                    targetCompanyId: activeCompanyId,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setGeneratedCode({
                    code: data.activationCode,
                    name: data.name,
                    id: data.id,
                });
                setShowCodeModal(true);
                setDeviceName("");
                setDeviceDescription("");
                fetchDevices(); // Atualizar lista
                showAlert("Sucesso", "Código de ativação gerado com sucesso!", "success");
            } else {
                const error = await response.json();
                showAlert("Erro", error.message || "Não foi possível gerar o código", "error");
            }
        } catch (error) {
            console.error("Erro ao gerar código:", error);
            showAlert("Erro", "Erro ao gerar código de ativação", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyCode = () => {
        if (generatedCode) {
            navigator.clipboard.writeText(generatedCode.code);
            setCopiedCode(true);
            showAlert("Copiado!", "Código copiado para a área de transferência", "success");
            setTimeout(() => setCopiedCode(false), 2000);
        }
    };

    const handleToggleDevice = async (deviceId: string, currentStatus: boolean) => {
        try {
            const token = localStorage.getItem("token");
            const endpoint = currentStatus ? "deactivate" : "reactivate";
            const response = await fetch(`${AppConfig.API_BASE_URL}/devices/${deviceId}/${endpoint}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                showAlert("Sucesso", `Dispositivo ${currentStatus ? "desativado" : "reativado"} com sucesso!`, "success");
                fetchDevices();
            } else {
                showAlert("Erro", "Não foi possível alterar o status do dispositivo", "error");
            }
        } catch (error) {
            console.error("Erro ao alterar status:", error);
            showAlert("Erro", "Erro ao alterar status do dispositivo", "error");
        }
    };

    const getStatusBadge = (device: PosDevice) => {
        if (!device.activatedAt) {
            return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">🟡 Pendente</Badge>;
        }
        if (!device.isActive) {
            return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">🔴 Inativo</Badge>;
        }
        if (device.status === "ONLINE") {
            return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">🟢 Online</Badge>;
        }
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">⚪ Offline</Badge>;
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleString("pt-BR");
    };

    const getRelativeTime = (dateStr?: string) => {
        if (!dateStr) return "Nunca";
        const now = new Date();
        const date = new Date(dateStr);
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "agora";
        if (minutes < 60) return `há ${minutes}min`;
        if (hours < 24) return `há ${hours}h`;
        return `há ${days}d`;
    };

    const formatLocation = (lat?: number, lon?: number) => {
        if (!lat || !lon) return "Não disponível";
        return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    };

    if (loading) {
        return (
            <div className="p-8">
                <p>Carregando dispositivos...</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6">
            <Card>
                <CardHeader>
                    <StandardCardHeader
                        title="Gestão de Dispositivos POS"
                        description="Gere códigos de ativação e gerencie dispositivos remotamente"
                        icon={<Smartphone className="h-5 w-5" />}
                    />
                </CardHeader>
                <CardContent>
                    {/* Formulário de Geração de Código */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Gerar Novo Código de Ativação
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="deviceName">Nome do Dispositivo *</Label>
                                <Input
                                    id="deviceName"
                                    placeholder="Ex: POS Loja Centro"
                                    value={deviceName}
                                    onChange={(e) => setDeviceName(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="deviceDescription">Descrição (Opcional)</Label>
                                <Input
                                    id="deviceDescription"
                                    placeholder="Ex: Balcão principal"
                                    value={deviceDescription}
                                    onChange={(e) => setDeviceDescription(e.target.value)}
                                />
                            </div>
                            <div className="flex items-end">
                                <Button
                                    onClick={handleGenerateCode}
                                    disabled={isGenerating}
                                    className="w-full"
                                >
                                    {isGenerating ? "Gerando..." : "Gerar Código"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Lista de Dispositivos */}
                    <div className="space-y-3">
                        {devices.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">
                                Nenhum dispositivo cadastrado. Gere um código de ativação para começar.
                            </p>
                        ) : (
                            devices.map((device) => (
                                <div
                                    key={device.id}
                                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <h4 className="font-semibold text-lg">{device.name}</h4>
                                                {getStatusBadge(device)}
                                            </div>
                                            {device.description && (
                                                <p className="text-sm text-gray-600 mb-3">{device.description}</p>
                                            )}

                                            {/* Grid de Informações */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                                                {/* Empresa */}
                                                {device.company && (
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <Smartphone className="h-4 w-4 text-blue-500" />
                                                        <span className="font-medium">{device.company.companyName}</span>
                                                    </div>
                                                )}

                                                {/* Modelo/Versão */}
                                                {(device.model || device.appVersion) && (
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <Monitor className="h-4 w-4 text-purple-500" />
                                                        <span>{device.model || 'Genérico'} {device.appVersion ? `v${device.appVersion}` : ''}</span>
                                                    </div>
                                                )}

                                                {/* Usuário Atual */}
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <User className="h-4 w-4 text-green-500" />
                                                    <span className={device.currentUser ? "font-medium text-green-700" : "text-gray-500"}>
                                                        {device.currentUser ? device.currentUser.name : "Nenhum"}
                                                    </span>
                                                </div>

                                                {/* Localização */}
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <MapPin className="h-4 w-4 text-red-500" />
                                                    <span className="text-xs">{formatLocation(device.latitude, device.longitude)}</span>
                                                </div>

                                                {/* Código de Ativação */}
                                                {device.activationCode && (
                                                    <div className="flex items-center gap-2">
                                                        <Tag className="h-4 w-4 text-blue-500" />
                                                        <span className="font-mono font-semibold text-blue-600">
                                                            {device.activationCode}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Último Visto */}
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <Clock className="h-4 w-4 text-orange-500" />
                                                    <span>{getRelativeTime(device.lastSeenAt)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {device.activatedAt && (
                                                <Button
                                                    variant={device.isActive ? "destructive" : "default"}
                                                    size="sm"
                                                    onClick={() => handleToggleDevice(device.id, device.isActive)}
                                                >
                                                    {device.isActive ? (
                                                        <>
                                                            <PowerOff className="h-4 w-4 mr-2" />
                                                            Desativar
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Power className="h-4 w-4 mr-2" />
                                                            Reativar
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Modal de Código Gerado */}
            <Dialog open={showCodeModal} onOpenChange={setShowCodeModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Código de Ativação Gerado</DialogTitle>
                        <DialogDescription>
                            Copie este código e utilize-o no aplicativo mobile para ativar o dispositivo.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Dispositivo</Label>
                            <p className="font-semibold">{generatedCode?.name}</p>
                        </div>
                        <div>
                            <Label>Código de Ativação</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <Input
                                    value={generatedCode?.code || ""}
                                    readOnly
                                    className="font-mono text-lg font-bold text-center"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleCopyCode}
                                >
                                    {copiedCode ? (
                                        <Check className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                                <strong>Instruções:</strong>
                                <br />
                                1. Instale o aplicativo no dispositivo POS
                                <br />
                                2. Na primeira abertura, digite este código
                                <br />
                                3. O dispositivo será automaticamente vinculado à sua empresa
                            </p>
                        </div>
                        <Button onClick={() => setShowCodeModal(false)} className="w-full">
                            Fechar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
