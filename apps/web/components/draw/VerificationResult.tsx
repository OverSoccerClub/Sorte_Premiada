"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Search, Trophy, XCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface VerificationResultProps {
    onComplete: () => void;
    drawNumber: number; // The drawn number to check
}

export function VerificationResult({ onComplete, drawNumber }: VerificationResultProps) {
    const [status, setStatus] = useState<'searching' | 'found' | 'none'>('searching');
    const [winner, setWinner] = useState<{ id: string, name: string } | null>(null);

    useEffect(() => {
        // 1. Searching Animation (2 seconds)
        const searchTimer = setTimeout(() => {
            // Mock logic: 30% chance of finding a winner for demo purposes
            const hasWinner = Math.random() > 0.7;

            if (hasWinner) {
                setWinner({ id: "12345", name: "João Da Silva" });
                setStatus('found');
            } else {
                setStatus('none');
            }

            // 2. Show Result (3 seconds) then complete
            setTimeout(() => {
                onComplete();
            }, 4000); // Show result for 4s

        }, 2500); // Search duration

        return () => clearTimeout(searchTimer);
    }, [drawNumber, onComplete]);

    return (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-6">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md"
            >
                <Card className="border-2 shadow-2xl overflow-hidden">
                    <CardContent className="p-8 flex flex-col items-center text-center space-y-6 min-h-[300px] justify-center">

                        {status === 'searching' && (
                            <>
                                <div className="relative">
                                    <motion.div
                                        className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
                                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                    />
                                    <Search className="w-16 h-16 text-primary relative z-10" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold">Verificando Bilhetes...</h3>
                                    <p className="text-muted-foreground">Buscando ganhadores para a milhar <span className="text-primary font-mono font-bold">{drawNumber.toString().padStart(4, '0')}</span></p>
                                </div>
                            </>
                        )}

                        {status === 'found' && winner && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex flex-col items-center space-y-4"
                            >
                                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-2 ring-4 ring-green-500/20">
                                    <Trophy className="w-10 h-10 text-green-500" />
                                </div>
                                <h3 className="text-3xl font-bold text-green-500">BILHETE PREMIADO!</h3>
                                <div className="bg-muted p-4 rounded-lg w-full">
                                    <div className="text-sm text-muted-foreground uppercase tracking-wide">Ganhador</div>
                                    <div className="text-xl font-bold">{winner.name}</div>
                                    <div className="text-sm font-mono text-muted-foreground mt-1">Ticket #{winner.id}</div>
                                </div>
                            </motion.div>
                        )}

                        {status === 'none' && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex flex-col items-center space-y-4"
                            >
                                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-2">
                                    <XCircle className="w-10 h-10 text-muted-foreground" />
                                </div>
                                <h3 className="text-2xl font-bold text-muted-foreground">Sem Ganhadores</h3>
                                <p className="text-muted-foreground">Nenhum bilhete com a milhar <span className="font-mono">{drawNumber.toString().padStart(4, '0')}</span> foi encontrado.</p>
                            </motion.div>
                        )}

                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
