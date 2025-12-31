"use client";

import { useState, useRef } from "react";
import { DrawGroup } from "./DrawGroup";
import { CountdownOverlay } from "./CountdownOverlay";
import { VerificationResult } from "./VerificationResult";
import { Confetti } from "./Confetti";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Play, RotateCw, Ticket, Clock, Megaphone } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function DrawSimulator() {
    const [isRunning, setIsRunning] = useState(false);

    // State for the overarching flow
    const [sequenceState, setSequenceState] = useState<{
        step: 'idle' | 'countdown' | 'drawing' | 'celebrating' | 'highlighting' | 'verifying' | 'preparing',
        fezinhaIndex: number,
        digitIndex: number // 0-3
    }>({ step: 'idle', fezinhaIndex: 0, digitIndex: 0 });

    // Data for the 4 Fezinhas
    // Each entry is an array of 4 digits (or '?' placeholders)
    const [displayValues, setDisplayValues] = useState<(string | number)[][]>([
        ['?', '?', '?', '?'],
        ['?', '?', '?', '?'],
        ['?', '?', '?', '?'],
        ['?', '?', '?', '?']
    ]);

    // Actual results stored secretly
    const currentSequenceResults = useRef<number[]>([0, 0, 0, 0]);

    const [history, setHistory] = useState<{ numbers: number[], timestamp: Date }[]>([]);
    const [statusText, setStatusText] = useState("Aguardando início...");

    const startSequence = () => {
        // Initialize secret results
        currentSequenceResults.current = Array.from({ length: 4 }).map(() => Math.floor(Math.random() * 10000));

        // Reset display
        setDisplayValues([
            ['?', '?', '?', '?'], ['?', '?', '?', '?'], ['?', '?', '?', '?'], ['?', '?', '?', '?']
        ]);

        setIsRunning(true);
        setSequenceState({ step: 'countdown', fezinhaIndex: 0, digitIndex: 0 });
        setStatusText("Preparando Sorteio...");
    };

    const onCountdownDone = () => {
        setStatusText("Iniciando Sorteio!");
        startDigitDraw(sequenceState.fezinhaIndex, 0);
    };

    const startDigitDraw = async (fezinhaIdx: number, digitIdx: number) => {
        setSequenceState({ step: 'drawing', fezinhaIndex: fezinhaIdx, digitIndex: digitIdx });
        setStatusText(`Sorteando ${digitIdx + 1}º número...`);

        // 1. Spin for a random time (drama)
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2s spin per digit

        // 2. Reveal Digit
        const fullNumber = currentSequenceResults.current[fezinhaIdx];
        const strNum = fullNumber.toString().padStart(4, '0');
        const digit = parseInt(strNum[digitIdx]);

        setDisplayValues(prev => {
            const newVals = [...prev];
            newVals[fezinhaIdx][digitIdx] = digit;
            return newVals;
        });

        // 3. Check if done or next digit
        if (digitIdx < 3) {
            // Go to next digit
            setTimeout(() => {
                startDigitDraw(fezinhaIdx, digitIdx + 1);
            }, 500); // Short pause between digits
        } else {
            // Finished this Fezinha
            setStatusText("Milhar Sorteada!");
            setSequenceState(prev => ({ ...prev, step: 'celebrating' })); // Trigger Confetti component

            setTimeout(() => {
                setSequenceState(prev => ({ ...prev, step: 'highlighting' }));
            }, 1000);

            setTimeout(() => {
                setSequenceState(prev => ({ ...prev, step: 'verifying' }));
                setStatusText("Buscando Ganhadores...");
            }, 4000); // Show highlight for 3s
        }
    };

    const onVerificationDone = () => {
        const nextFezinha = sequenceState.fezinhaIndex + 1;

        if (nextFezinha < 4) {
            setSequenceState({ step: 'preparing', fezinhaIndex: nextFezinha, digitIndex: 0 });
            setStatusText("Preparando Próxima Fezinha...");

            setTimeout(() => {
                setSequenceState({ step: 'countdown', fezinhaIndex: nextFezinha, digitIndex: 0 });
            }, 3000);
        } else {
            // All done
            setSequenceState({ step: 'idle', fezinhaIndex: 0, digitIndex: 0 });
            setIsRunning(false);
            setStatusText("Sorteio Finalizado.");

            // Add to history
            setHistory(prev => [{
                numbers: [...currentSequenceResults.current],
                timestamp: new Date()
            }, ...prev].slice(0, 5));
        }
    };

    return (
        <div className="relative w-full flex flex-col items-center gap-6 py-6 min-h-[700px] overflow-hidden">

            {/* Animated Status Bar */}
            <div className="w-full max-w-md bg-card/80 backdrop-blur border rounded-full px-6 py-3 flex items-center justify-center gap-3 shadow-lg z-20">
                <Megaphone className={`w-5 h-5 text-primary ${sequenceState.step === 'drawing' ? 'animate-bounce' : ''}`} />
                <span className="font-semibold text-lg animate-in fade-in key={statusText}">
                    {statusText}
                </span>
            </div>

            {/* Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full transition-all duration-700 ${['countdown', 'highlighting', 'verifying', 'preparing'].includes(sequenceState.step) ? 'opacity-20 blur-sm scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
                {displayValues.map((digits, fIndex) => {
                    const isActiveFezinha = sequenceState.fezinhaIndex === fIndex;
                    const isDrawing = sequenceState.step === 'drawing' && isActiveFezinha;

                    // Determine spinning index for this specific group
                    // If active and drawing, the current digit index is spinning
                    const spinningIdx = isDrawing ? sequenceState.digitIndex : null;

                    return (
                        <div key={fIndex} className="flex flex-col items-center space-y-3">
                            <div className="flex items-center gap-2 text-muted-foreground font-medium text-sm uppercase tracking-wider">
                                <Ticket className={`w-4 h-4 ${isActiveFezinha ? 'text-primary' : ''}`} />
                                Fezinha {fIndex + 1}
                            </div>

                            <div className={`relative group transition-all duration-500 ${isActiveFezinha ? 'scale-105 z-10' : 'scale-100'}`}>
                                {isActiveFezinha && <div className="absolute -inset-4 bg-primary/10 rounded-xl blur-xl animate-pulse" />}

                                <DrawGroup
                                    digits={digits}
                                    spinningIndex={spinningIdx}
                                />

                                {/* Confetti relative to the winner card */}
                                {sequenceState.step === 'celebrating' && isActiveFezinha && (
                                    <Confetti />
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Global Overlays */}
            <AnimatePresence>
                {sequenceState.step === 'countdown' && (
                    <CountdownOverlay
                        isVisible={true}
                        onComplete={onCountdownDone}
                        seconds={5}
                    />
                )}

                {sequenceState.step === 'celebrating' && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
                        {/* Full screen confetti */}
                        <Confetti className="w-full h-full" />
                    </div>
                )}

                {sequenceState.step === 'highlighting' && (
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.5, opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md"
                    >
                        <div className="flex flex-col items-center gap-6">
                            <div className="text-2xl font-light text-muted-foreground uppercase tracking-widest animate-pulse">
                                Resultado Confirmado
                            </div>
                            <div className="text-9xl font-black text-primary font-mono drop-shadow-[0_0_50px_rgba(var(--primary-rgb),0.8)]">
                                {currentSequenceResults.current[sequenceState.fezinhaIndex].toString().padStart(4, '0')}
                            </div>
                            <div className="flex gap-2">
                                <Confetti />
                            </div>
                        </div>
                    </motion.div>
                )}

                {sequenceState.step === 'preparing' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <RotateCw className="w-16 h-16 text-primary animate-spin" />
                            <div className="text-3xl font-bold text-foreground">
                                Preparando Próximo Sorteio...
                            </div>
                        </div>
                    </motion.div>
                )}

                {sequenceState.step === 'verifying' && (
                    <VerificationResult
                        drawNumber={currentSequenceResults.current[sequenceState.fezinhaIndex]}
                        onComplete={onVerificationDone}
                    />
                )}
            </AnimatePresence>

            <div className={`flex flex-col items-center justify-center space-y-6 pt-4 transition-all duration-500 ${isRunning ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100'}`}>
                <Button
                    size="lg"
                    onClick={startSequence}
                    className="min-w-[200px] h-12 text-lg font-semibold shadow-lg hover:shadow-primary/25 transition-all active:scale-95 bg-gradient-to-r from-emerald-600 to-primary hover:from-emerald-500 hover:to-primary/90"
                >
                    <Play className="mr-2 h-5 w-5 fill-current" />
                    Iniciar Sorteio TV Show
                </Button>
            </div>

            {history.length > 0 && (
                <Card className="bg-muted/10 border-dashed w-full max-w-4xl mt-auto animate-in slide-in-from-bottom-10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            Histórico Recente
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {history.map((record, i) => (
                                <div key={i} className="flex flex-wrap gap-2 md:gap-4 items-center justify-between p-4 bg-background/60 backdrop-blur rounded-lg border text-sm shadow-sm">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-mono text-muted-foreground font-bold">#{i + 1}</span>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {record.timestamp.toLocaleTimeString()}
                                        </span>
                                    </div>

                                    <div className="flex flex-1 gap-2 md:gap-8 justify-center">
                                        {record.numbers.map((num, idx) => (
                                            <div key={idx} className="flex flex-col items-center">
                                                <span className="text-[10px] uppercase text-muted-foreground mb-1">Fezinha {idx + 1}</span>
                                                <div className="font-mono font-bold text-xl text-primary bg-primary/10 px-3 py-1 rounded">
                                                    {num.toString().padStart(4, '0')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
