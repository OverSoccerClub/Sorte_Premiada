"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, RotateCw, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppConfig } from "../../AppConfig";

interface PosDevice {
    id: string;
    deviceId: string;
    model: string;
    status: string;
    lastSeenAt: string;
    latitude: number;
    longitude: number;
    appVersion: string;
    currentUser?: {
        name: string;
        username: string;
    };
}

export default function PosManagementPage() {
    const [devices, setDevices] = useState<PosDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");

    const fetchDevices = async () => {
        try {
            // Assuming API proxy or direct call if user is authenticated
            // For now, let's assume we can fetch from API URL via client side or Next API route
            // Since we don't have a Next API route proxy set up in the plan, we might need to hit the NestJS API directly.
            // But CORS might be an issue if running on different ports.
            // Assuming the web app has a way to call API. Usually via an absolute URL or env.
            // Let's rely on standard fetch to the API url.

            // Re-use logic? Or strict fetch. I'll guess localhost:3333 for dev or relative.
            // In layout it imports AppConfig.
            // Use AppConfig for API URL
            const res = await fetch(`${AppConfig.api.baseUrl}/devices`);
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
        const interval = setInterval(fetchDevices, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const isOnline = (dateStr: string) => {
        const lastSeen = new Date(dateStr).getTime();
        const now = new Date().getTime();
        return (now - lastSeen) < 120000; // 2 minutes tolerance
    };

    const filteredDevices = devices.filter(d =>
        d.deviceId.toLowerCase().includes(filter.toLowerCase()) ||
        d.currentUser?.name.toLowerCase().includes(filter.toLowerCase())
    );

    const onlineCount = devices.filter(d => isOnline(d.lastSeenAt)).length;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Gestão de POS</h2>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Terminais</CardTitle>
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{devices.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Online Agora</CardTitle>
                        <div className="h-4 w-4 rounded-full bg-emerald-500 animate-pulse" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{onlineCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Offline</CardTitle>
                        <div className="h-4 w-4 rounded-full bg-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-muted-foreground">{devices.length - onlineCount}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por ID ou usuário..."
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
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">ID do Dispositivo</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Modelo / Versão</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Usuário Atual</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Localização</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Visto por último</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {filteredDevices.map((device) => {
                                const online = isOnline(device.lastSeenAt);
                                return (
                                    <tr key={device.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle">
                                            <Badge variant={online ? "default" : "secondary"} className={online ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                                                {online ? "ONLINE" : "OFFLINE"}
                                            </Badge>
                                        </td>
                                        <td className="p-4 align-middle font-mono text-xs">{device.deviceId}</td>
                                        <td className="p-4 align-middle">
                                            <div className="font-medium">{device.model || "Genérico"}</div>
                                            <div className="text-xs text-muted-foreground">{device.appVersion}</div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            {device.currentUser ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                                                        {device.currentUser.username[0].toUpperCase()}
                                                    </div>
                                                    <span>{device.currentUser.username}</span>
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
                                                    className="flex items-center gap-1 text-blue-500 hover:underline text-xs"
                                                >
                                                    <MapPin className="w-3 h-3" />
                                                    Ver no Mapa
                                                </a>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 align-middle text-muted-foreground text-xs">
                                            {new Date(device.lastSeenAt).toLocaleString('pt-BR')}
                                        </td>
                                    </tr>
                                )
                            })}
                            {filteredDevices.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-4 text-center text-muted-foreground">
                                        Nenhum dispositivo encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
