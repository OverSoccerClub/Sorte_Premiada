import { Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ticket, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { AppConfig } from '../../../AppConfig';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

async function getTicketData(code: string) {
    try {
        const res = await fetch(`${AppConfig.api.baseUrl}/tickets/public/${code}`, {
            next: { revalidate: 0 } // No cache, always fresh
        });

        if (!res.ok) {
            return null;
        }

        return await res.json();
    } catch (e) {
        console.error('Failed to fetch Minuto Sorte ticket', e);
        return null;
    }
}

export default async function MinutoSortePublicResultPage({ params }: { params: { code: string } }) {
    const { code } = params;
    const ticket = await getTicketData(code);

    if (!ticket) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white p-4">
                <Card className="w-full max-w-md bg-neutral-900 border-neutral-800">
                    <CardHeader className="text-center pb-2">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <CardTitle className="text-xl text-white">Bilhete não encontrado</CardTitle>
                        <CardDescription className="text-neutral-400">
                            O código informado ({code}) não existe ou é inválido.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center pt-6">
                        <Button asChild variant="outline" className="border-emerald-600 text-emerald-500 hover:bg-emerald-950">
                            <Link href="/">Voltar para o Início</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'WON': return <CheckCircle2 className="w-12 h-12 text-emerald-500" />;
            case 'PAID': return <CheckCircle2 className="w-12 h-12 text-blue-500" />;
            case 'LOST': return <XCircle className="w-12 h-12 text-red-500" />;
            case 'PENDING': return <Clock className="w-12 h-12 text-amber-500" />;
            case 'CANCELLED': return <AlertCircle className="w-12 h-12 text-neutral-500" />;
            default: return <Ticket className="w-12 h-12 text-neutral-400" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'WON': return <Badge className="bg-emerald-500 hover:bg-emerald-600">PREMIADO</Badge>;
            case 'PAID': return <Badge className="bg-blue-500 hover:bg-blue-600">PAGO</Badge>;
            case 'LOST': return <Badge variant="destructive">NÃO PREMIADO</Badge>;
            case 'PENDING': return <Badge className="bg-amber-500 hover:bg-amber-600">AGUARDANDO SORTEIO</Badge>;
            case 'CANCELLED': return <Badge variant="outline" className="text-neutral-400 border-neutral-600">CANCELADO</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-neutral-200 p-4 font-sans">
            <div className="w-full max-w-md">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-white tracking-wider uppercase mb-1">
                        Minuto da Sorte
                    </h1>
                    <p className="text-emerald-500 text-sm font-medium">Resultado Oficial</p>
                </div>

                <Card className="bg-neutral-900 border-neutral-800 shadow-2xl relative overflow-hidden">
                    {/* Decorative header line */}
                    <div className={`absolute top-0 left-0 right-0 h-1 ${ticket.status === 'WON' || ticket.status === 'PAID' ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : ticket.status === 'LOST' ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-amber-500 to-amber-400'}`} />

                    <CardHeader className="text-center pt-8 pb-4">
                        <div className="flex justify-center mb-4">
                            {getStatusIcon(ticket.status)}
                        </div>
                        <div className="mb-2">
                            {getStatusBadge(ticket.status)}
                        </div>
                        <CardTitle className="text-lg text-white font-mono tracking-widest break-all">
                            {ticket.code}
                        </CardTitle>
                        <CardDescription className="text-neutral-400 mt-1">
                            Aposta registrada em {format(new Date(ticket.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-6 space-y-6">
                        {/* Aposta section */}
                        <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800">
                            <h3 className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-3">Sua Aposta</h3>

                            <div className="flex justify-between items-center mb-3">
                                <span className="text-neutral-300">Hora Escolhida</span>
                                <span className="text-white font-bold text-lg">{ticket.numbers[0]}h</span>
                            </div>

                            <div className="flex justify-between items-center mb-3">
                                <span className="text-neutral-300">Minuto da Compra</span>
                                <span className="text-emerald-400 font-bold text-lg">{ticket.numbers[1]}m</span>
                            </div>

                            <div className="h-px bg-neutral-800 w-full my-3" />

                            <div className="flex justify-between items-center">
                                <span className="text-neutral-300">Valor da Aposta</span>
                                <span className="text-white font-medium">R$ {Number(ticket.amount).toFixed(2).replace('.', ',')}</span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-neutral-300">Prêmio Máximo</span>
                                <span className="text-emerald-500 font-bold">R$ {Number(ticket.possiblePrize).toFixed(2).replace('.', ',')}</span>
                            </div>
                        </div>

                        {/* Sorteio section */}
                        <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800">
                            <h3 className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-3">
                                Sorteio - {format(new Date(ticket.drawDate), "dd/MM/yyyy")}
                            </h3>

                            {ticket.draw ? (
                                <>
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-neutral-300">Hora Sorteada</span>
                                        <span className="text-white font-bold text-lg">{parseInt((ticket.draw.numbers[0] || "00").substring(0, 2), 10) % 24}h</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-neutral-300">Minuto Sorteado</span>
                                        <span className="text-white font-bold text-lg">{parseInt((ticket.draw.numbers[0] || "00").substring(3, 5), 10) % 60}m</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-4">
                                        <span className="text-neutral-300">Loteria Aberta</span>
                                        <span className="text-neutral-400 font-mono tracking-widest bg-neutral-900 px-2 py-1 rounded">{ticket.draw.numbers[0]}</span>
                                    </div>

                                    {(ticket.status === 'WON' || ticket.status === 'PAID') && (
                                        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex justify-between items-center">
                                            <span className="text-emerald-400 font-bold">Prêmio Atingido:</span>
                                            <span className="text-emerald-400 font-bold text-xl">R$ {Number(ticket.possiblePrize).toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-4">
                                    <Clock className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                                    <p className="text-neutral-400 text-sm">O sorteio para este bilhete ainda não foi realizado.</p>
                                </div>
                            )}
                        </div>

                        <Button asChild className="w-full bg-neutral-800 hover:bg-neutral-700 text-white mt-4">
                            <Link href="/">Ir para InnoBet</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
