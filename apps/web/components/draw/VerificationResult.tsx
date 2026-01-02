"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Search, Trophy, XCircle, Sparkles, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface VerificationResultProps {
    onComplete: () => void;
    drawNumber: number;
}

export function VerificationResult({ onComplete, drawNumber }: VerificationResultProps) {
    const [status, setStatus] = useState<'searching' | 'found' | 'none'>('searching');
    const [winner, setWinner] = useState<{ id: string, name: string } | null>(null);
    const [searchProgress, setSearchProgress] = useState(0);

    useEffect(() => {
        // Animate search progress
        const progressInterval = setInterval(() => {
            setSearchProgress(prev => Math.min(prev + 8, 100));
        }, 200);

        // Searching Animation (2.5 seconds)
        const searchTimer = setTimeout(() => {
            clearInterval(progressInterval);
            setSearchProgress(100);

            // Mock logic: 30% chance of finding a winner
            const hasWinner = Math.random() > 0.7;

            if (hasWinner) {
                setWinner({
                    id: Math.floor(Math.random() * 100000).toString().padStart(5, '0'),
                    name: "Bilhete Premiado"
                });
                setStatus('found');
            } else {
                setStatus('none');
            }

            // Show Result (3.5 seconds) then complete
            setTimeout(() => {
                onComplete();
            }, 3500);

        }, 2500);

        return () => {
            clearTimeout(searchTimer);
            clearInterval(progressInterval);
        };
    }, [drawNumber, onComplete]);

    return (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-6">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md"
            >
                <Card className="border-2 border-slate-600 shadow-2xl overflow-hidden bg-slate-900/95 backdrop-blur-xl">
                    <CardContent className="p-8 flex flex-col items-center text-center space-y-6 min-h-[320px] justify-center">

                        {status === 'searching' && (
                            <>
                                <div className="relative">
                                    {/* Scanning effect */}
                                    <motion.div
                                        className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
                                        animate={{
                                            scale: [1, 1.5, 1],
                                            opacity: [0.3, 0.1, 0.3]
                                        }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                    />

                                    {/* Rotating ring */}
                                    <motion.div
                                        className="absolute inset-0 rounded-full border-2 border-primary/30 border-t-primary"
                                        style={{ width: 80, height: 80, margin: -8 }}
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                    />

                                    <Database className="w-16 h-16 text-primary relative z-10" />
                                </div>

                                <div className="space-y-3 w-full">
                                    <h3 className="text-2xl font-bold text-white">Verificando Bilhetes...</h3>

                                    {/* Progress bar */}
                                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-primary to-emerald-400"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${searchProgress}%` }}
                                            transition={{ duration: 0.2 }}
                                        />
                                    </div>

                                    <p className="text-slate-400">
                                        Buscando milhar <span className="text-primary font-mono font-bold">{drawNumber.toString().padStart(4, '0')}</span>
                                    </p>

                                    {/* Animated dots */}
                                    <div className="flex justify-center gap-1 mt-2">
                                        {[0, 1, 2].map((i) => (
                                            <motion.div
                                                key={i}
                                                className="w-2 h-2 bg-primary rounded-full"
                                                animate={{
                                                    y: [-4, 4, -4],
                                                    opacity: [0.5, 1, 0.5]
                                                }}
                                                transition={{
                                                    repeat: Infinity,
                                                    duration: 0.8,
                                                    delay: i * 0.15,
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {status === 'found' && winner && (
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 200 }}
                                className="flex flex-col items-center space-y-4"
                            >
                                {/* Winner celebration */}
                                <motion.div
                                    className="relative"
                                    animate={{ rotate: [0, -5, 5, -5, 0] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                >
                                    <motion.div
                                        className="absolute inset-0 bg-emerald-400/30 rounded-full blur-xl"
                                        animate={{ scale: [1, 1.3, 1] }}
                                        transition={{ repeat: Infinity, duration: 1 }}
                                    />
                                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center ring-4 ring-emerald-400/30 shadow-xl shadow-emerald-500/30">
                                        <Trophy className="w-12 h-12 text-white" />
                                    </div>

                                    {/* Sparkles around trophy */}
                                    {[...Array(6)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="absolute"
                                            style={{
                                                left: `${50 + 50 * Math.cos((i / 6) * Math.PI * 2)}%`,
                                                top: `${50 + 50 * Math.sin((i / 6) * Math.PI * 2)}%`,
                                            }}
                                            animate={{
                                                scale: [0, 1, 0],
                                                opacity: [0, 1, 0]
                                            }}
                                            transition={{
                                                repeat: Infinity,
                                                duration: 1.5,
                                                delay: i * 0.2
                                            }}
                                        >
                                            <Sparkles className="w-4 h-4 text-yellow-400" />
                                        </motion.div>
                                    ))}
                                </motion.div>

                                <motion.h3
                                    className="text-3xl font-black text-emerald-400 uppercase tracking-wide"
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ repeat: Infinity, duration: 0.8 }}
                                >
                                    Bilhete Premiado!
                                </motion.h3>

                                <div className="bg-slate-800/80 p-5 rounded-xl w-full border border-emerald-500/30">
                                    <div className="text-sm text-emerald-400/80 uppercase tracking-widest mb-2">Ganhador</div>
                                    <div className="text-3xl font-mono font-black text-white">{winner.id}</div>
                                    <div className="text-sm text-slate-400 mt-2">{winner.name}</div>
                                </div>
                            </motion.div>
                        )}

                        {status === 'none' && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex flex-col items-center space-y-4"
                            >
                                <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center ring-2 ring-slate-600">
                                    <XCircle className="w-10 h-10 text-slate-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-300">Sem Ganhadores</h3>
                                <p className="text-slate-500">
                                    Nenhum bilhete com a milhar <span className="font-mono text-slate-400">{drawNumber.toString().padStart(4, '0')}</span> foi encontrado.
                                </p>
                                <div className="text-lg font-semibold text-amber-400 mt-2">
                                    💰 Prêmio Acumula!
                                </div>
                            </motion.div>
                        )}

                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
