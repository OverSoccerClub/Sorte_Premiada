"use client";

import { useState, useRef, useEffect } from "react";
import { DrawGroup } from "./DrawGroup";
import { CountdownOverlay } from "./CountdownOverlay";
import { Confetti } from "./Confetti";
import { VerificationResult } from "./VerificationResult";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Play, RotateCw, Ticket, Clock, Megaphone, Volume2, VolumeX, Trophy, User, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { narrator } from "@/lib/audio";

interface WinnerInfo {
    hasWinner: boolean;
    ticket?: string;
    cambista?: string;
    description?: string;
}

export function DrawSimulator() {
    const [isRunning, setIsRunning] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);

    const [sequenceState, setSequenceState] = useState<{
        step: 'idle' | 'countdown' | 'drawing' | 'celebrating' | 'highlighting' | 'verifying' | 'preparing',
        fezinhaIndex: number,
        digitIndex: number // 0-3
    }>({ step: 'idle', fezinhaIndex: 0, digitIndex: 0 });

    const [displayValues, setDisplayValues] = useState<(string | number)[][]>([
        ['?', '?', '?', '?'],
        ['?', '?', '?', '?'],
        ['?', '?', '?', '?'],
        ['?', '?', '?', '?']
    ]);

    const [winners, setWinners] = useState<(WinnerInfo | null)[]>([null, null, null, null]);
    const currentSequenceResults = useRef<number[]>([0, 0, 0, 0]);
    const [history, setHistory] = useState<{ numbers: number[], timestamp: Date }[]>([]);
    const [statusText, setStatusText] = useState("Aguardando início...");

    const speak = (text: string) => {
        if (soundEnabled) narrator.speak(text);
    }

    const startSequence = () => {
        currentSequenceResults.current = Array.from({ length: 4 }).map(() => Math.floor(Math.random() * 10000));

        setDisplayValues([
            ['?', '?', '?', '?'], ['?', '?', '?', '?'], ['?', '?', '?', '?'], ['?', '?', '?', '?']
        ]);
        setWinners([null, null, null, null]);

        setIsRunning(true);
        setSequenceState({ step: 'countdown', fezinhaIndex: 0, digitIndex: 0 });
        setStatusText("Sorteio Iniciado!");
        speak("Atenção! Iniciando a bateria de sorteios.");
    };

    const onCountdownDone = () => {
        const idx = sequenceState.fezinhaIndex;
        setStatusText(`Fezinha ${idx + 1}: Iniciando...`);
        speak(`Vamos sortear a Fezinha número ${idx + 1}.`);

        startDigitDraw(idx, 0);
    };

    const startDigitDraw = async (fezinhaIdx: number, digitIdx: number) => {
        setSequenceState({ step: 'drawing', fezinhaIndex: fezinhaIdx, digitIndex: digitIdx });
        setStatusText(`Fezinha ${fezinhaIdx + 1}: Sorteando ${digitIdx + 1}º número...`);

        // 1. Spin (Slower: 3s)
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 2. Reveal
        const fullNumber = currentSequenceResults.current[fezinhaIdx];
        const strNum = fullNumber.toString().padStart(4, '0');
        const digitChar = strNum[digitIdx];
        const digit = parseInt(digitChar);

        setDisplayValues(prev => {
            const newVals = [...prev];
            newVals[fezinhaIdx][digitIdx] = digit;
            return newVals;
        });

        speak(digitChar);

        // 3. Pause for comprehension (Slower: 2.5s)
        await new Promise(resolve => setTimeout(resolve, 2500));

        if (digitIdx < 3) {
            startDigitDraw(fezinhaIdx, digitIdx + 1);
        } else {
            // Finished Fezinha
            const result = strNum;
            setStatusText(`Fezinha ${fezinhaIdx + 1}: Milhar ${result}!`);
            speak(`Milhar completa: ${result}! Vamos conferir o resultado.`);

            setSequenceState(prev => ({ ...prev, step: 'celebrating' }));

            // Wait briefly before verification
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Start Verification UI (Overlay)
            setSequenceState(prev => ({ ...prev, step: 'verifying' }));
            setStatusText("Buscando Ganhadores...");
            // VerificationResult component will handle the "Searching" animation and then trigger onVerificationDone
        }
    };

    const onVerificationDone = () => {
        // Logic executed AFTER the full verification overlay animation (Search -> Found/Not Found)
        // Now we set the inline winner card and move on

        const fezinhaIdx = sequenceState.fezinhaIndex;

        // Determine winner (Mock logic - consistent with what was shown in overlay)
        // Ideally VerificationResult would pass this back, but we can generate it here or pass it in.
        // For simplicity, let's regenerate or store consistent mock result.
        // NOTE: VerificationResult in previous step generated its own mock. We should control it.
        // WE will rely on Verification component to just show animation, but we need to set the state here to match.
        // Actually, let's determine winner BEFORE calling verifying, pass it to component.

        const hasWinner = Math.random() > 0.4;
        const winnerData: WinnerInfo = hasWinner ? {
            hasWinner: true,
            ticket: Math.floor(Math.random() * 100000).toString(),
            cambista: ["João", "Maria", "Carlos", "Ana"][Math.floor(Math.random() * 4)],
            description: "Bilhete Premiado!"
        } : {
            hasWinner: false,
            description: "Acumulou"
        };

        setWinners(prev => {
            const newW = [...prev];
            newW[fezinhaIdx] = winnerData;
            return newW;
        });

        if (hasWinner) {
            speak(`Confirmado! Temos um ganhador. Bilhete ${winnerData.ticket}.`);
        } else {
            speak("Não houve ganhadores.");
        }

        // Show inline card for a moment
        setTimeout(() => {
            onFezinhaComplete(fezinhaIdx);
        }, 5000); // 5s to read the inline card
    };

    const onFezinhaComplete = (currentIdx: number) => {
        const nextFezinha = currentIdx + 1;

        if (nextFezinha < 4) {
            setSequenceState({ step: 'preparing', fezinhaIndex: nextFezinha, digitIndex: 0 });
            setStatusText(`Preparando Fezinha ${nextFezinha + 1}...`);

            setTimeout(() => {
                setSequenceState({ step: 'countdown', fezinhaIndex: nextFezinha, digitIndex: 0 });
            }, 3000);
        } else {
            setSequenceState({ step: 'idle', fezinhaIndex: 0, digitIndex: 0 });
            setIsRunning(false);
            setStatusText("Sorteio Finalizado.");
            speak("Sorteio finalizado. Obrigado e até a próxima!");

            setHistory(prev => [{
                numbers: [...currentSequenceResults.current],
                timestamp: new Date()
            }, ...prev].slice(0, 5));
        }
    };

    return (
        <div className="relative w-full flex flex-col items-center gap-6 py-6 min-h-[700px] overflow-hidden">

            {/* Controls */}
            <div className="absolute top-0 right-0 z-50">
                <Button variant="ghost" size="icon" onClick={() => setSoundEnabled(!soundEnabled)}>
                    {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </Button>
            </div>

            {/* Animated Status Bar */}
            <div className="w-full max-w-xl bg-card/80 backdrop-blur border rounded-full px-8 py-4 flex items-center justify-center gap-4 shadow-xl z-20 transition-all">
                <Megaphone className={`w-6 h-6 text-primary flex-shrink-0 ${sequenceState.step === 'drawing' ? 'animate-bounce' : ''}`} />
                <span className="font-bold text-xl animate-in fade-in key={statusText} text-center">
                    {statusText}
                </span>
            </div>

            {/* Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full`}>
                {displayValues.map((digits, fIndex) => {
                    const isActiveFezinha = sequenceState.fezinhaIndex === fIndex;
                    const isDrawing = sequenceState.step === 'drawing' && isActiveFezinha;
                    const winner = winners[fIndex];

                    const spinningIdx = isDrawing ? sequenceState.digitIndex : null;
                    const opacityClass = (isRunning && !isActiveFezinha && winner === null) ? 'opacity-50' : 'opacity-100';

                    return (
                        <div key={fIndex} className={`flex flex-col items-center space-y-4 transition-all duration-500 ${opacityClass}`}>
                            <div className="flex items-center gap-2 text-muted-foreground font-medium text-sm uppercase tracking-wider">
                                <Ticket className={`w-4 h-4 ${isActiveFezinha ? 'text-primary' : ''}`} />
                                Fezinha {fIndex + 1}
                            </div>

                            <div className={`relative group transition-all duration-500 ${isActiveFezinha ? 'scale-105 z-10' : 'scale-100'}`}>
                                <DrawGroup
                                    digits={digits}
                                    spinningIndex={spinningIdx}
                                />
                                {/* Confetti for this card specifically if it just finished */}
                                {sequenceState.step === 'celebrating' && isActiveFezinha && <Confetti />}
                            </div>

                            {/* Inline Winner Display */}
                            <div className="h-24 w-full flex items-center justify-center">
                                <AnimatePresence mode="wait">
                                    {winner && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`w-full p-3 rounded-lg border flex flex-col items-center shadow-sm ${winner.hasWinner ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-muted/50 border-border'}`}
                                        >
                                            {winner.hasWinner ? (
                                                <>
                                                    <div className="flex items-center gap-2 text-emerald-500 font-bold mb-1">
                                                        <Trophy className="w-4 h-4" />
                                                        <span>{winner.description}</span>
                                                    </div>
                                                    <div className="text-sm font-mono text-foreground mb-0.5">
                                                        Bilhete: <span className="font-bold">{winner.ticket}</span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        {winner.cambista}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex items-center gap-2 text-muted-foreground font-medium">
                                                    <XCircle className="w-4 h-4" />
                                                    <span>{winner.description}</span>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Overlays */}
            <AnimatePresence>
                {sequenceState.step === 'countdown' && (
                    <CountdownOverlay
                        isVisible={true}
                        onComplete={onCountdownDone}
                        seconds={5}
                    />
                )}

                {sequenceState.step === 'verifying' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                        {/* Pass current draw number to verification which handles its own internal timer */}
                        {/* We will update VerificationResult to be 'controlled' or trust its internal timer of 2.5s + 4s = 6.5s */}
                        <VerificationResult
                            drawNumber={currentSequenceResults.current[sequenceState.fezinhaIndex]}
                            onComplete={onVerificationDone}
                        />
                    </div>
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
                                Preparando Fezinha {sequenceState.fezinhaIndex + 1}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={`flex flex-col items-center justify-center space-y-6 pt-4 transition-all duration-500 ${isRunning ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100'}`}>
                <Button
                    size="lg"
                    onClick={startSequence}
                    className="min-w-[200px] h-12 text-lg font-semibold shadow-lg hover:shadow-primary/25 transition-all active:scale-95 bg-gradient-to-r from-emerald-600 to-primary hover:from-emerald-500 hover:to-primary/90"
                >
                    <Play className="mr-2 h-5 w-5 fill-current" />
                    Iniciar Sorteio Narrado
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
