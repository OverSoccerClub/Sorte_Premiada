import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface SeriesStats {
    seriesNumber: number;
    drawDate: string;
    ticketsSold: number;
    ticketsRemaining: number;
    percentageFilled: number;
    status: 'ACTIVE' | 'FULL' | 'CLOSED';
}

interface SeriesStatsCardProps {
    gameName: string;
    maxTicketsPerSeries: number;
    series: SeriesStats[];
}

export function SeriesStatsCard({ gameName, maxTicketsPerSeries, series }: SeriesStatsCardProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'FULL': return 'bg-red-500 hover:bg-red-600';
            case 'CLOSED': return 'bg-gray-500 hover:bg-gray-600';
            default: return 'bg-green-500 hover:bg-green-600';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'FULL': return 'Esgotado';
            case 'CLOSED': return 'Encerrado';
            default: return 'Ativo';
        }
    };

    const getProgressColor = (percentage: number) => {
        if (percentage >= 90) return 'bg-red-500';
        if (percentage >= 70) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>{gameName} - Vendas por Série</span>
                    <Badge variant="outline">{maxTicketsPerSeries} bilhetes/série</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {series.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma série encontrada
                    </p>
                ) : (
                    <div className="space-y-4">
                        {series.map((s, index) => (
                            <div key={index} className="space-y-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">
                                            Série #{s.seriesNumber?.toString().padStart(4, '0') || '----'}
                                        </span>
                                        <Badge className={getStatusColor(s.status)}>
                                            {getStatusLabel(s.status)}
                                        </Badge>
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        {new Date(s.drawDate).toLocaleDateString('pt-BR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        {s.ticketsSold.toLocaleString('pt-BR')} vendidos
                                    </span>
                                    <span className="font-bold text-lg">
                                        {s.percentageFilled.toFixed(1)}%
                                    </span>
                                </div>

                                <Progress
                                    value={s.percentageFilled}
                                    className="h-3"
                                />

                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{s.ticketsRemaining.toLocaleString('pt-BR')} disponíveis</span>
                                    <span>{s.ticketsSold}/{maxTicketsPerSeries}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
