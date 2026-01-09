"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Smartphone, Plus, Copy, Check, Power, PowerOff, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppConfig } from "../../../AppConfig";
import { StandardCardHeader } from "@/components/standard-card-header";
import { toast } from "sonner";
import { useActiveCompanyId } from "@/context/use-active-company";

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
    company?: {
        companyName: string;
    };
}

export default function DeviceManagementPage() {
    const activeCompanyId = useActiveCompanyId();
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

            const response = await fetch(`${AppConfig.API_BASE_URL}/devices${queryString}`, {
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
            toast.error("Não foi possível carregar os dispositivos");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateCode = async () => {
        if (!deviceName.trim()) {
            toast.error("Por favor, informe o nome do dispositivo");
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
                toast.success("Código de ativação gerado com sucesso!");
            } else {
                const error = await response.json();
                toast.error(error.message || "Não foi possível gerar o código");
            }
        } catch (error) {
            console.error("Erro ao gerar código:", error);
            toast.error("Erro ao gerar código de ativação");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyCode = () => {
        if (generatedCode) {
            navigator.clipboard.writeText(generatedCode.code);
            setCopiedCode(true);
            toast.success("Código copiado para a área de transferência");
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
                toast.success(`Dispositivo ${currentStatus ? "desativado" : "reativado"} com sucesso!`);
                fetchDevices();
            } else {
                toast.error("Não foi possível alterar o status do dispositivo");
            }
        } catch (error) {
            console.error("Erro ao alterar status:", error);
            toast.error("Erro ao alterar status do dispositivo");
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
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="font-semibold text-lg">{device.name}</h4>
                                                {getStatusBadge(device)}
                                            </div>
                                            {device.description && (
                                                <p className="text-sm text-gray-600 mb-2">{device.description}</p>
                                            )}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                                                {device.activationCode && (
                                                    <div className="flex items-center gap-2">
                                                        <Tag className="h-4 w-4" />
                                                        <span className="font-mono font-semibold text-blue-600">
                                                            {device.activationCode}
                                                        </span>
                                                    </div>
                                                )}
                                                {device.activatedAt && (
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4" />
                                                        Ativado: {formatDate(device.activatedAt)}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <Smartphone className="h-4 w-4" />
                                                    ID: {device.deviceId.substring(0, 12)}...
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
                <DialogContent>
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
