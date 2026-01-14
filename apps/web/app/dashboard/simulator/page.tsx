"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { DrawSimulator } from "@/components/draw/DrawSimulator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function SimulatorPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && user?.role !== 'MASTER') {
            router.replace("/dashboard");
        }
    }, [user, authLoading, router]);

    if (authLoading || user?.role !== 'MASTER') {
        return null;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <Sparkles className="w-8 h-8 text-emerald-500" />
                    </div>
                    Simulador de Sorteio
                </h2>
                <p className="text-muted-foreground mt-1 ml-14">Ferramenta exclusiva para simulação e validação visual de sorteios.</p>
            </div>

            <Card className="border-border bg-card shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Simuladador Oficial</CardTitle>
                    <CardDescription>Simule o sorteio das milhares para validação visual em tempo real.</CardDescription>
                </CardHeader>
                <CardContent className="pb-8">
                    <DrawSimulator />
                </CardContent>
            </Card>
        </div>
    );
}
