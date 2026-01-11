import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Building2, Power, PowerOff } from "lucide-react";

interface SeriesStats {
    seriesNumber: number;
    drawDate: string;
    ticketsSold: number;
    ticketsRemaining: number;
    percentageFilled: number;
    status: 'ACTIVE' | 'FULL' | 'CLOSED' | 'PAUSED';
    areaName?: string;
    areaId?: string;
    isActive?: boolean;
}

interface SeriesStatsCardProps {
    gameName: string;
    maxTicketsPerSeries: number;
    series: SeriesStats[];
    onToggleStatus?: (areaId: string, currentStatus: boolean) => void;
}

export function SeriesStatsCard({ gameName, maxTicketsPerSeries, series, onToggleStatus }: SeriesStatsCardProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'FULL': return 'bg-red-500 hover:bg-red-600';
            case 'CLOSED': return 'bg-gray-500 hover:bg-gray-600';
            case 'PAUSED': return 'bg-amber-500 hover:bg-amber-600';
            default: return 'bg-green-500 hover:bg-green-600';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'FULL': return 'Esgotado';
            case 'CLOSED': return 'Encerrado';
            case 'PAUSED': return 'Pausado';
            default: return 'Ativo';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>{gameName} - Monitoramento de Praças</span>
                    <Badge variant="outline">{maxTicketsPerSeries} bilhetes/série</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {series.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma praça encontrada
                    </p>
                ) : (
                    <div className="space-y-4">
                        {series.map((s, index) => (
                            <div key={index} className={`space-y-3 p-4 border rounded-lg transition-colors ${!s.isActive ? 'bg-amber-50/50 border-amber-200' : 'hover:bg-accent/50'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${s.isActive ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                                            <Building2 className={`w-4 h-4 ${s.isActive ? 'text-emerald-600' : 'text-amber-600'}`} />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                                {s.areaName || 'Área Desconhecida'}
                                                <Badge className={`${getStatusColor(s.status)} h-5 text-[10px]`}>
                                                    {getStatusLabel(s.status)}
                                                </Badge>
                                            </h4>
                                            <p className="text-xs text-muted-foreground">
                                                Série Atual: #{s.seriesNumber?.toString().padStart(4, '0') || '----'}
                                            </p>
                                        </div>
                                    </div>

                                    {s.areaId && onToggleStatus && (
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor={`switch-${s.areaId}`} className="text-xs text-muted-foreground">
                                                {s.isActive ? 'Vendas Ativas' : 'Vendas Pausadas'}
                                            </Label>
                                            <Switch
                                                id={`switch-${s.areaId}`}
                                                checked={s.isActive}
                                                onCheckedChange={() => onToggleStatus(s.areaId!, s.isActive || false)}
                                                className="data-[state=checked]:bg-emerald-500"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground text-xs">
                                            {s.ticketsSold.toLocaleString('pt-BR')} vendidos
                                        </span>
                                        <span className="font-bold text-sm">
                                            {s.percentageFilled.toFixed(1)}%
                                        </span>
                                    </div>

                                    <Progress
                                        value={s.percentageFilled}
                                        className={`h-2 ${!s.isActive ? 'opacity-50' : ''}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
