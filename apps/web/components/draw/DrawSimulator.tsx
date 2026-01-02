"use client";

import { useState, useRef, useEffect } from "react";
import { DrawGroup } from "./DrawGroup";
import { CountdownOverlay } from "./CountdownOverlay";
import { Confetti } from "./Confetti";
import { VerificationResult } from "./VerificationResult";
import { VirtualPresenter } from "./VirtualPresenter"; // New component
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Play, RotateCw, Ticket, Clock, Volume2, VolumeX, Trophy, User, XCircle, Mic } from "lucide-react";
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

    // Detailed State Machine
    const [sequenceState, setSequenceState] = useState<{
        step: 'idle' | 'intro' | 'countdown' | 'digit_intro' | 'drawing_digit' | 'reveal_digit' | 'fezinha_complete' | 'verifying' | 'found_winner' | 'outro',
        fezinhaIndex: number,
        digitIndex: number // 0-3
    }>({ step: 'idle', fezinhaIndex: 0, digitIndex: 0 });

    const [presenterText, setPresenterText] = useState("");
    const [isPresenterSpeaking, setIsPresenterSpeaking] = useState(false);

    const [displayValues, setDisplayValues] = useState<(string | number)[][]>([
        ['?', '?', '?', '?'],
        ['?', '?', '?', '?'],
        ['?', '?', '?', '?'],
        ['?', '?', '?', '?']
    ]);

    const [winners, setWinners] = useState<(WinnerInfo | null)[]>([null, null, null, null]);
    const currentSequenceResults = useRef<number[]>([0, 0, 0, 0]);
    const [history, setHistory] = useState<{ numbers: number[], timestamp: Date }[]>([]);

    // Queue to prevent overlapping speech
    const speak = (text: string, duration?: number) => {
        setPresenterText(text);
        setIsPresenterSpeaking(true);
        if (soundEnabled) narrator.speak(text);

        // Auto turn off speaking visuals after estimated duration or default
        const estimatedDuration = duration || Math.max(2000, text.length * 60);
        setTimeout(() => setIsPresenterSpeaking(false), estimatedDuration);
    }

    const startSequence = async () => {
        currentSequenceResults.current = Array.from({ length: 4 }).map(() => Math.floor(Math.random() * 10000));

        setDisplayValues([
            ['?', '?', '?', '?'], ['?', '?', '?', '?'], ['?', '?', '?', '?'], ['?', '?', '?', '?']
        ]);
        setWinners([null, null, null, null]);

        setIsRunning(true);

        // INTRO
        setSequenceState({ step: 'intro', fezinhaIndex: 0, digitIndex: 0 });
        speak("Olá! Bem-vindos ao sorteio 2x1000. Vamos iniciar!", 4000);

        await wait(4000);

        setSequenceState(prev => ({ ...prev, step: 'countdown' }));
    };

    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const onCountdownDone = async () => {
        // Start flow for Fezinha 0
        runFezinhaFlow(0);
    };

    const runFezinhaFlow = async (fIndex: number) => {
        // Pre-Fezinha announce
        // speak(`Atenção para a Fezinha 0${fIndex + 1}!`);
        // await wait(3000);

        // Digits Loop
        for (let dIndex = 0; dIndex < 4; dIndex++) {
            await runDigitDraw(fIndex, dIndex);
        }

        // Fezinha Complete
        setSequenceState(prev => ({ ...prev, step: 'fezinha_complete', fezinhaIndex: fIndex }));
        const result = currentSequenceResults.current[fIndex].toString().padStart(4, '0');

        speak(`Atenção! A Fezinha 0${fIndex + 1} foi sorteada com sucesso! Milhar: ${result.split('').join(' ')}.`, 5000);
        await wait(5000);

        // Verify
        speak("Agora estamos verificando possíveis ganhadores...", 3000);
        setSequenceState(prev => ({ ...prev, step: 'verifying' }));
        // The VerificationResult component triggers 'onVerificationDone' after its internal animation
    };

    const runDigitDraw = async (fIndex: number, dIndex: number) => {
        const ordinal = ["primeiro", "segundo", "terceiro", "quarto"][dIndex];

        // 1. Pre-Announcement (Pause: 3s)
        setSequenceState({ step: 'digit_intro', fezinhaIndex: fIndex, digitIndex: dIndex });
        speak(`Atenção... vamos sortear agora o ${ordinal} dígito da Fezinha 0${fIndex + 1}.`, 4000);
        await wait(4000); // Allow text to be read fully

        // 2. Spin Command (Spin: 4s for suspense)
        setSequenceState({ step: 'drawing_digit', fezinhaIndex: fIndex, digitIndex: dIndex });
        setPresenterText("🍀 Girando... 🍀");
        await wait(4000);

        // 3. Reveal Calculation
        const fullNumber = currentSequenceResults.current[fIndex];
        const strNum = fullNumber.toString().padStart(4, '0');
        const digitChar = strNum[dIndex];
        const digit = parseInt(digitChar);

        setDisplayValues(prev => {
            const newVals = [...prev];
            newVals[fIndex][dIndex] = digit;
            return newVals;
        });

        // 4. Reveal & Confirm (Pause: 3s)
        setSequenceState({ step: 'reveal_digit', fezinhaIndex: fIndex, digitIndex: dIndex });
        speak(`Número sorteado... ${digitChar}!`, 3000);

        // 5. Post-Reveal Silence/Verification (Pause: 2s)
        await wait(2000);
    };

    const onVerificationDone = async () => {
        const fezinhaIdx = sequenceState.fezinhaIndex;

        // Determine winner
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

        setSequenceState(prev => ({ ...prev, step: 'found_winner' }));

        if (hasWinner) {
            speak(`Temos um ganhador! Bilhete ${winnerData.ticket}. Parabéns!`, 4000);
        } else {
            speak("Não houve ganhadores nesta extração.", 3000);
        }

        await wait(4000);

        // Next or Outro
        const nextFezinha = fezinhaIdx + 1;
        if (nextFezinha < 4) {
            runFezinhaFlow(nextFezinha);
        } else {
            finishShow();
        }
    };

    const finishShow = async () => {
        setSequenceState(prev => ({ ...prev, step: 'outro' }));
        speak("Sorteio concluído com total transparência. Obrigado a todos e boa sorte na próxima!", 6000);

        setHistory(prev => [{
            numbers: [...currentSequenceResults.current],
            timestamp: new Date()
        }, ...prev].slice(0, 5));

        await wait(6000);
        setIsRunning(false);
        setPresenterText("Sorteio Finalizado");
    };

    return (
        <div className="relative w-full flex flex-col items-center gap-4 py-8 min-h-[800px] overflow-hidden">

            {/* Controls */}
            <div className="absolute top-4 right-4 z-50">
                <Button variant="secondary" size="icon" onClick={() => setSoundEnabled(!soundEnabled)}>
                    {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </Button>
            </div>

            {/* VIRTUAL PRESENTER AREA */}
            <div className="w-full bg-gradient-to-b from-transparent to-background/10 z-20 pointer-events-none sticky top-0">
                <VirtualPresenter text={presenterText} isSpeaking={isPresenterSpeaking} />
            </div>

            {/* Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full px-4 mt-8`}>
                {displayValues.map((digits, fIndex) => {
                    const isActiveFezinha = sequenceState.fezinhaIndex === fIndex;
                    const isDrawingDigit = sequenceState.step === 'drawing_digit' && isActiveFezinha;

                    // Should this Fezinha be fully visible?
                    // Only dim if it's NOT active and we are running
                    const opacityClass = (isRunning && !isActiveFezinha) ? 'opacity-40 scale-95 blur-[1px]' : 'opacity-100 scale-100';

                    // Only spin active digit
                    const spinningIdx = isDrawingDigit ? sequenceState.digitIndex : null;

                    return (
                        <div key={fIndex} className={`flex flex-col items-center space-y-6 transition-all duration-700 ${opacityClass}`}>
                            <div className="flex items-center gap-2 text-primary font-bold text-lg uppercase tracking-widest border-b-2 border-primary/20 pb-1">
                                <Ticket className="w-5 h-5" />
                                Fezinha 0{fIndex + 1}
                            </div>

                            <div className={`relative group transition-all duration-500`}>
                                <DrawGroup
                                    digits={digits}
                                    spinningIndex={spinningIdx}
                                />
                                {/* Confetti if completed */}
                                {sequenceState.step === 'fezinha_complete' && isActiveFezinha && <Confetti />}
                            </div>

                            {/* Winner Display */}
                            <div className="h-32 w-full flex items-center justify-center">
                                <AnimatePresence mode="wait">
                                    {winners[fIndex] && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`w-full p-4 rounded-xl border flex flex-col items-center shadow-lg backdrop-blur-sm ${winners[fIndex]!.hasWinner ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-muted/50 border-border'}`}
                                        >
                                            {winners[fIndex]!.hasWinner ? (
                                                <>
                                                    <div className="flex items-center gap-2 text-emerald-400 font-black text-lg mb-2 uppercase tracking-wide">
                                                        <Trophy className="w-5 h-5" />
                                                        <span>{winners[fIndex]!.description}</span>
                                                    </div>
                                                    <div className="text-base text-foreground mb-1">
                                                        Bilhete: <span className="font-mono font-black text-xl">{winners[fIndex]!.ticket}</span>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground flex items-center gap-1 bg-background/50 px-3 py-1 rounded-full mt-1">
                                                        <User className="w-3 h-3" />
                                                        {winners[fIndex]!.cambista}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex items-center gap-2 text-muted-foreground font-medium">
                                                    <XCircle className="w-5 h-5" />
                                                    <span>{winners[fIndex]!.description}</span>
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
                        <VerificationResult
                            drawNumber={currentSequenceResults.current[sequenceState.fezinhaIndex]}
                            onComplete={onVerificationDone}
                        />
                    </div>
                )}
            </AnimatePresence>

            <div className={`flex flex-col items-center justify-center space-y-6 pt-12 transition-all duration-500 ${isRunning ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100'}`}>
                <Button
                    size="lg"
                    onClick={startSequence}
                    className="min-w-[240px] h-14 text-xl font-bold shadow-2xl hover:shadow-primary/50 transition-all active:scale-95 bg-primary hover:bg-primary/90 rounded-full"
                >
                    <Play className="mr-3 h-6 w-6 fill-current" />
                    Iniciar Transmissão
                </Button>
            </div>

            {history.length > 0 && !isRunning && (
                <Card className="bg-muted/5 border-none w-full max-w-5xl mt-12 animate-in slide-in-from-bottom-10">
                    <CardHeader className="pb-4 border-b border-border/10">
                        <CardTitle className="text-base font-medium text-muted-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            Últimos Sorteios Realizados
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            {history.map((record, i) => (
                                <div key={i} className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-6 bg-background/40 hover:bg-background/60 transition-colors rounded-xl border border-border/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">#{i + 1}</div>
                                        <span className="text-sm text-muted-foreground">
                                            {record.timestamp.toLocaleTimeString()}
                                        </span>
                                    </div>

                                    <div className="flex flex-1 gap-4 md:gap-12 justify-center flex-wrap">
                                        {record.numbers.map((num, idx) => (
                                            <div key={idx} className="flex flex-col items-center gap-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Fezinha 0{idx + 1}</span>
                                                <div className="font-mono font-black text-2xl text-foreground tracking-widest">
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
