"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { AppConfig as Config } from "../../../AppConfig";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Save, Ticket, AlertCircle, CheckCircle2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function MinutoSorteAdminPage() {
    const { user, token } = useAuth();
    const [date, setDate] = useState<Date>(new Date());
    const [lotteryNumber, setLotteryNumber] = useState("");
    const [loading, setLoading] = useState(false);

    // In a multi-tenant environment, only MASTER or users with specific permission can insert Loteria Federal.
    // For Minuto da Sorte, we'll restrict to MASTER for safety, or allow standard admin.
    if (user?.role !== "MASTER" && user?.role !== "ADMIN") {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-xl border border-destructive/20 mt-8">
                <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
                <p className="text-muted-foreground">Você não tem permissão para inserir sorteios.</p>
            </div>
        );
    }

    const handleProcessDraw = async () => {
        if (!lotteryNumber || lotteryNumber.length < 4 || lotteryNumber.length > 6) {
            toast.error("Número de Loteria inválido (deve ter entre 4 e 6 dígitos)");
            return;
        }

        if (!date) {
            toast.error("Selecione uma data para o sorteio");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${Config.api.baseUrl}/admin/minuto-sorte/draw`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    drawDate: date.toISOString(),
                    lotteryNumber: lotteryNumber
                })
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Erro ao processar sorteio");
            } else {
                toast.success(`Sorteio processado com sucesso!`);
                setLotteryNumber("");
            }
        } catch (error) {
            console.error(error);
            toast.error("Falha na conexão com o servidor");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sorteio: Minuto da Sorte</h1>
                    <p className="text-muted-foreground mt-1">
                        Insira o 1º Prêmio da Loteria Federal do dia para apurar os bilhetes.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-emerald-900/40 bg-card">
                    <CardHeader className="bg-emerald-900/10 border-b border-border/50 pb-4">
                        <div className="flex items-center gap-2">
                            <Ticket className="w-5 h-5 text-emerald-500" />
                            <CardTitle>Painel de Apuração</CardTitle>
                        </div>
                        <CardDescription>
                            Os bilhetes são processados automaticamente após a inserção.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Data do Sorteio (Loteria Federal)</label>
                            <Input
                                type="date"
                                value={date ? format(date, "yyyy-MM-dd") : ""}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        // create a Date in local time instead of UTC to avoid shifting days
                                        const [year, month, day] = e.target.value.split('-');
                                        setDate(new Date(Number(year), Number(month) - 1, Number(day)));
                                    }
                                }}
                                className="w-full bg-background border-border"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">1º Prêmio da Loteria Federal</label>
                            <Input
                                type="number"
                                placeholder="Ex: 54321"
                                value={lotteryNumber}
                                onChange={(e) => setLotteryNumber(e.target.value)}
                                className="text-xl font-mono tracking-widest bg-background border-border"
                                maxLength={6}
                            />
                            <p className="text-xs text-muted-foreground">
                                O sistema usará os primeiros 2 dígitos para HORA (mod 24) e os últimos 2 para MINUTO (mod 60).
                            </p>
                        </div>

                        <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                            size="lg"
                            onClick={handleProcessDraw}
                            disabled={loading || !lotteryNumber || lotteryNumber.length < 4}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Processando Bilhetes...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Save className="w-4 h-4" />
                                    Processar Sorteio
                                </span>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-muted/30 border-dashed border-border flex flex-col justify-center">
                    <CardContent className="p-8 space-y-4 text-center">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500/50 mx-auto" />
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Como Funciona a Apuração</h3>
                            <ul className="text-sm text-muted-foreground space-y-2 text-left list-disc pl-4">
                                <li>O horário do servidor define a Data de Sorteio válida de cada bilhete.</li>
                                <li>Ao inserir o resultado, todos os bilhetes emitidos para esta data serão verificados.</li>
                                <li><strong>Preço Maior:</strong> Se a Hora (Loteria) coincidir com a Hora (Cartela) <strong>E</strong> o Minuto (Loteria) coincidir com o Minuto da Compra.</li>
                                <li>A hora e minuto sorteados são mostrados na tela do comprovante caso haja ganhos.</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
