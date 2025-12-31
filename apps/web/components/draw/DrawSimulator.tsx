"use client";

import { useState, useRef, useEffect } from "react";
import { DrawGroup } from "./DrawGroup";
import { CountdownOverlay } from "./CountdownOverlay";
import { VerificationResult } from "./VerificationResult";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Dices, RotateCw, Ticket, Play, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function DrawSimulator() {
    const [isRunning, setIsRunning] = useState(false);
    const [activeDrawIndex, setActiveDrawIndex] = useState<number | null>(null);
    const [highlightedResult, setHighlightedResult] = useState<{ number: number, index: number } | null>(null);
    const [preparingNext, setPreparingNext] = useState(false);

    // Sequence State Machine
    const [sequenceState, setSequenceState] = useState<{
        step: 'idle' | 'countdown' | 'drawing' | 'highlighting' | 'verifying' | 'preparing',
        index: number
    }>({ step: 'idle', index: 0 });

    // Data State
    const [results, setResults] = useState<(number | null)[]>([null, null, null, null]);
    const [history, setHistory] = useState<number[][]>([]);
    const currentSequenceResults = useRef<(number | null)[]>([null, null, null, null]);

    const startSequence = () => {
        setResults([null, null, null, null]);
        currentSequenceResults.current = [null, null, null, null];
        setSequenceState({ step: 'countdown', index: 0 });
        setIsRunning(true);
    };

    const onCountdownDone = () => {
        setSequenceState(prev => ({ ...prev, step: 'drawing' }));
        // Start spin logic
        setTimeout(() => {
            performDraw(sequenceState.index);
        }, 100);
    };

    const performDraw = async (index: number) => {
        setActiveDrawIndex(index);

        // Total spin duration = (3 digits * 2.5s) + base duration ~ 10s
        // We need to wait for the generic "drawing" phase to complete visually
        // The last digit stops at index 3 * 2.5 = 7.5s delay + transition
        // Let's set a sufficient wait time before moving to highlight

        // Generate result immediately so we can pass it to the component
        const randomNum = Math.floor(Math.random() * 10000);
        currentSequenceResults.current[index] = randomNum;
        setResults([...currentSequenceResults.current]);

        // Wait for animations to finish (4 digits * 2.5s interval + buffer)
        await new Promise(resolve => setTimeout(resolve, 8000 + 2000));

        // Move to Highlight
        setActiveDrawIndex(null); // Stop the "active" pulse on grid
        setHighlightedResult({ number: randomNum, index });
        setSequenceState(prev => ({ ...prev, step: 'highlighting' }));

        // Show highlighted result for 3 seconds
        setTimeout(() => {
            setHighlightedResult(null);
            setSequenceState(prev => ({ ...prev, step: 'verifying' }));
        }, 4000);
    };

    const onVerificationDone = () => {
        const nextIndex = sequenceState.index + 1;

        if (nextIndex < 4) {
            // Prepare for next
            setSequenceState(prev => ({ ...prev, step: 'preparing' }));
            setPreparingNext(true);

            setTimeout(() => {
                setPreparingNext(false);
                setSequenceState({ step: 'countdown', index: nextIndex });
            }, 3000); // Wait 3s saying "Preparing next..."
        } else {
            // Finish
            setSequenceState({ step: 'idle', index: 0 });
            setIsRunning(false);
            const finalResults = currentSequenceResults.current.map(r => r ?? 0);
            setHistory(prev => [finalResults, ...prev].slice(0, 5));
        }
    };

    return (
        <div className="relative w-full flex flex-col items-center gap-10 py-6 min-h-[600px] overflow-hidden">

            {/* Overlays */}
            <AnimatePresence>
                {sequenceState.step === 'countdown' && (
                    <CountdownOverlay
                        isVisible={true}
                        onComplete={onCountdownDone}
                        seconds={5} // 5s countdown
                    />
                )}

                {/* Highlight Overlay */}
                {sequenceState.step === 'highlighting' && highlightedResult && (
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.5, opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md"
                    >
                        <div className="flex flex-col items-center gap-6">
                            <div className="text-2xl font-light text-muted-foreground uppercase tracking-widest">
                                Resultado Fezinha {highlightedResult.index + 1}
                            </div>
                            <div className="text-9xl font-black text-primary font-mono drop-shadow-[0_0_50px_rgba(var(--primary-rgb),0.5)]">
                                {highlightedResult.number.toString().padStart(4, '0')}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Preparing Next Overlay */}
                {sequenceState.step === 'preparing' && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <RotateCw className="w-16 h-16 text-primary animate-spin" />
                            <div className="text-3xl font-bold text-foreground">
                                Preparando Próximo Sorteio...
                            </div>
                            <div className="text-muted-foreground">
                                Fezinha {sequenceState.index + 2} de 4
                            </div>
                        </div>
                    </motion.div>
                )}

                {sequenceState.step === 'verifying' && currentSequenceResults.current[sequenceState.index] !== null && (
                    <VerificationResult
                        drawNumber={currentSequenceResults.current[sequenceState.index]!}
                        onComplete={onVerificationDone}
                    />
                )}
            </AnimatePresence>

            {/* 4 Cards Grid - Dimmed when overlay is active */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full transition-all duration-700 ${sequenceState.step !== 'drawing' && sequenceState.step !== 'idle' ? 'opacity-10 blur-md scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
                {results.map((result, index) => {
                    const isActive = activeDrawIndex === index;

                    return (
                        <div key={index} className="flex flex-col items-center space-y-3">
                            <div className="flex items-center gap-2 text-muted-foreground font-medium text-sm uppercase tracking-wider">
                                <Ticket className={`w-4 h-4 ${isActive ? 'text-primary animate-pulse' : ''}`} />
                                Fezinha {index + 1}
                            </div>

                            <div className={`relative group transition-all duration-500 ${isActive ? 'scale-110 z-10' : 'scale-100'}`}>
                                <DrawGroup
                                    value={result}
                                    isSpinning={isActive}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className={`flex flex-col items-center justify-center space-y-6 pt-4 transition-all duration-500 ${isRunning ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100'}`}>
                <Button
                    size="lg"
                    onClick={startSequence}
                    className="min-w-[200px] h-12 text-lg font-semibold shadow-lg hover:shadow-primary/25 transition-all active:scale-95"
                >
                    <Play className="mr-2 h-5 w-5 fill-current" />
                    Iniciar Sorteio Completo
                </Button>
            </div>

            {history.length > 0 && (
                <Card className="bg-muted/10 border-dashed w-full max-w-4xl mt-auto">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            Histórico Recente
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {history.map((drawSet, i) => (
                                <div key={i} className="flex flex-wrap gap-2 md:gap-4 items-center justify-between p-3 bg-background/50 rounded-lg border text-sm">
                                    <span className="font-mono text-muted-foreground w-6">#{i + 1}</span>
                                    <div className="flex flex-1 gap-2 md:gap-8 justify-center">
                                        {drawSet.map((num, idx) => (
                                            <div key={idx} className="font-mono font-bold text-lg">
                                                <span className="text-xs text-muted-foreground mr-1">F{idx + 1}:</span>
                                                <span className="text-primary">
                                                    {num?.toString().padStart(4, '0')}
                                                </span>
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
