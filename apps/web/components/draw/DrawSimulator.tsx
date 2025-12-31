"use client";

import { useState } from "react";
import { DrawGroup } from "./DrawGroup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Dices, RotateCw } from "lucide-react";

export function DrawSimulator() {
    const [isSpinning, setIsSpinning] = useState(false);
    const [result, setResult] = useState<number>(1234); // Initial default
    const [history, setHistory] = useState<number[]>([]);

    const handleDraw = () => {
        if (isSpinning) return;

        setIsSpinning(true);

        // Simulate API call or random generation delay
        setTimeout(() => {
            // Generate random number 0-9999
            const newNumber = Math.floor(Math.random() * 10000);
            setResult(newNumber);

            // Stop spinning after a bit (the digits themselves will handle the stagger stop)
            setIsSpinning(false);
            setHistory(prev => [newNumber, ...prev].slice(0, 5));
        }, 2000); // Spin for 2 seconds
    };

    return (
        <div className="w-full max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                    {/* Glow effect */}
                    <div className="absolute -inset-4 bg-primary/20 rounded-full blur-3xl opacity-50 animate-pulse" />

                    <DrawGroup value={result} isSpinning={isSpinning} />
                </div>

                <Button
                    size="lg"
                    onClick={handleDraw}
                    disabled={isSpinning}
                    className="min-w-[200px] h-12 text-lg font-semibold shadow-lg hover:shadow-primary/25 transition-all"
                >
                    {isSpinning ? (
                        <>
                            <RotateCw className="mr-2 h-5 w-5 animate-spin" />
                            Sorteando...
                        </>
                    ) : (
                        <>
                            <Dices className="mr-2 h-5 w-5" />
                            Sortear Número
                        </>
                    )}
                </Button>
            </div>

            {history.length > 0 && (
                <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            Últimos Sorteios
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {history.map((num, i) => (
                                <div key={i} className="flex flex-col items-center gap-1 min-w-[80px] p-2 bg-muted rounded-lg border text-xl font-mono font-bold">
                                    #{i + 1}
                                    <span className="text-primary">{num.toString().padStart(4, '0')}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
