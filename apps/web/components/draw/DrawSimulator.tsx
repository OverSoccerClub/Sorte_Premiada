"use client";

import { useState, useRef } from "react";
import { DrawGroup } from "./DrawGroup";
import { CountdownOverlay } from "./CountdownOverlay";
import { VerificationResult } from "./VerificationResult";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Dices, RotateCw, Ticket, Play } from "lucide-react";
import { AnimatePresence } from "framer-motion";

export function DrawSimulator() {
    const [isRunning, setIsRunning] = useState(false);
    const [activeDrawIndex, setActiveDrawIndex] = useState<number | null>(null);
    const [showCountdown, setShowCountdown] = useState(false);
    const [verificationIndex, setVerificationIndex] = useState<number | null>(null);

    // Store results for 4 draws (Fezinha 1 to 4). Null means not drawn yet.
    const [results, setResults] = useState<(number | null)[]>([null, null, null, null]);
    const [history, setHistory] = useState<number[][]>([]);

    const currentSequenceResults = useRef<(number | null)[]>([null, null, null, null]);

    const handleStart = () => {
        if (isRunning) return;

        setIsRunning(true);
        setResults([null, null, null, null]);
        currentSequenceResults.current = [null, null, null, null];

        // Start the chain
        runDrawSequence(0);
    };

    const runDrawSequence = async (index: number) => {
        if (index >= 4) {
            // Sequence finished
            setIsRunning(false);
            const finalResults = currentSequenceResults.current.map(r => r ?? 0);
            setHistory(prev => [finalResults, ...prev].slice(0, 5));
            return;
        }

        // 1. Show Countdown
        setShowCountdown(true);
        // CountdownOverlay calls 'onComplete' when done
        // Logic continues in handleCountdownComplete
        // But we need to pass the index context, so I'll store it in a ref or derive it
    };

    // Callback chain to avoid complex effects
    const handleCountdownComplete = async () => {
        setShowCountdown(false);

        // Determine which index we are on based on results? 
        // Easier to track current index in a state or ref, but let's assume we proceed to next null result
        // Or optimize recursion. Let's just use the 'activeDrawIndex' mechanism implicitly.
        // Actually, we need to know WHICH one we are about to draw.

        // Let's deduce index: count of non-null results in current flow? 
        // No, cause verification comes after result update.

        // Better idea: Just use a pointer in state or Ref is tricky with async closures.
        // Let's use a state 'sequenceStep': 'countdown' | 'drawing' | 'verifying'
    };

    // Let's refactor into a cleaner robust state machine approach 
    // State: { step: 'idle' | 'countdown' | 'drawing' | 'verifying', index: 0-3 }
    const [sequenceState, setSequenceState] = useState<{
        step: 'idle' | 'countdown' | 'drawing' | 'verifying',
        index: number
    }>({ step: 'idle', index: 0 });

    const startSequence = () => {
        setResults([null, null, null, null]);
        currentSequenceResults.current = [null, null, null, null];
        setSequenceState({ step: 'countdown', index: 0 });
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

        // Spin for 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Generate result
        const randomNum = Math.floor(Math.random() * 10000);
        currentSequenceResults.current[index] = randomNum;
        setResults([...currentSequenceResults.current]);

        setActiveDrawIndex(null);

        // Move to verification
        setSequenceState(prev => ({ ...prev, step: 'verifying' }));
    };

    const onVerificationDone = () => {
        const nextIndex = sequenceState.index + 1;
        if (nextIndex < 4) {
            setSequenceState({ step: 'countdown', index: nextIndex });
        } else {
            setSequenceState({ step: 'idle', index: 0 });
            // Add history
            const finalResults = currentSequenceResults.current.map(r => r ?? 0);
            setHistory(prev => [finalResults, ...prev].slice(0, 5));
        }
    };

    return (
        <div className="relative w-full flex flex-col items-center gap-10 py-6 min-h-[600px]">

            {/* Overlays */}
            <AnimatePresence>
                {sequenceState.step === 'countdown' && (
                    <CountdownOverlay
                        isVisible={true}
                        onComplete={onCountdownDone}
                        seconds={5} // 5s as requested
                    />
                )}
                {sequenceState.step === 'verifying' && currentSequenceResults.current[sequenceState.index] !== null && (
                    <VerificationResult
                        drawNumber={currentSequenceResults.current[sequenceState.index]!}
                        onComplete={onVerificationDone}
                    />
                )}
            </AnimatePresence>

            {/* 4 Cards Grid - Dimmed when overlay is active */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full transition-all duration-500 ${sequenceState.step === 'countdown' || sequenceState.step === 'verifying' ? 'opacity-30 blur-sm scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
                {results.map((result, index) => {
                    const isActive = activeDrawIndex === index;

                    return (
                        <div key={index} className="flex flex-col items-center space-y-3">
                            <div className="flex items-center gap-2 text-muted-foreground font-medium text-sm uppercase tracking-wider">
                                <Ticket className={`w-4 h-4 ${isActive ? 'text-primary animate-pulse' : ''}`} />
                                Fezinha {index + 1}
                            </div>

                            <div className={`relative group transition-all duration-500 ${isActive ? 'scale-105' : 'scale-100'}`}>
                                <DrawGroup
                                    value={result}
                                    isSpinning={isActive}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className={`flex flex-col items-center justify-center space-y-6 pt-4 transition-all duration-500 ${sequenceState.step !== 'idle' ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100'}`}>
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
