"use client";

import { useState, useRef } from "react";
import { DrawGroup } from "./DrawGroup";
import { CountdownOverlay } from "./CountdownOverlay";
import { Confetti } from "./Confetti";
import { VerificationResult } from "./VerificationResult";
import { VirtualPresenter } from "./VirtualPresenter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Ticket, Clock, Volume2, VolumeX, Trophy, User, XCircle } from "lucide-react";
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
        step: 'idle' | 'intro' | 'countdown' | 'digit_intro' | 'drawing_digit' | 'reveal_digit' | 'fezinha_complete' | 'verifying' | 'found_winner' | 'outro',
        fezinhaIndex: number,
        digitIndex: number
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

    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Main speak function - uses Promise for proper sequencing
    const speak = async (text: string, pauseAfter: number = 500) => {
        setPresenterText(text);
        setIsPresenterSpeaking(true);

        if (soundEnabled) {
            await narrator.speakAsync(text);
        } else {
            // Silent mode: just wait based on text length
            await wait(text.length * 60 + 500);
        }

        setIsPresenterSpeaking(false);

        // Pause after speaking for dramatic effect
        if (pauseAfter > 0) {
            await wait(pauseAfter);
        }
    };

    const startSequence = async () => {
        // Generate random results
        currentSequenceResults.current = Array.from({ length: 4 }).map(() =>
            Math.floor(Math.random() * 10000)
        );

        // Reset display
        setDisplayValues([
            ['?', '?', '?', '?'],
            ['?', '?', '?', '?'],
            ['?', '?', '?', '?'],
            ['?', '?', '?', '?']
        ]);
        setWinners([null, null, null, null]);
        setIsRunning(true);

        // --- ABERTURA ---
        setSequenceState({ step: 'intro', fezinhaIndex: 0, digitIndex: 0 });

        await speak("Olá, seja muito bem-vindo, seja muito bem-vinda.", 800);
        await speak("Está começando agora o sorteio oficial dois por mil.", 800);
        await speak("Um sorteio com total transparência e seriedade.", 1000);
        await speak("Prepare-se. Cada número pode fazer a diferença.", 1500);

        // --- EXPLICAÇÃO ---
        await speak("Vamos sortear quatro milhares, as Fezinhas.", 800);
        await speak("Cada milhar será sorteada dígito por dígito.", 800);
        await speak("E agora... vamos começar.", 2000);

        setSequenceState(prev => ({ ...prev, step: 'countdown' }));
    };

    const onCountdownDone = async () => {
        await runFezinhaFlow(0);
    };

    const runFezinhaFlow = async (fIndex: number) => {
        const fNum = fIndex + 1;

        // Announce fezinha
        if (fIndex === 3) {
            await speak("Chegamos ao último sorteio: Fezinha zero quatro.", 1000);
            await speak("Vamos ao sorteio final.", 1500);
        } else if (fIndex === 0) {
            await speak(`Atenção. Vamos iniciar a Fezinha zero ${fNum}.`, 1000);
            await speak("Concentre-se... boa sorte!", 1500);
        } else if (fIndex === 1) {
            await speak("Vamos agora para a Fezinha zero dois.", 1500);
        } else if (fIndex === 2) {
            await speak("Seguimos para a Fezinha zero três.", 1500);
        }

        // Draw each digit
        for (let dIndex = 0; dIndex < 4; dIndex++) {
            await runDigitDraw(fIndex, dIndex);
        }

        // Fezinha complete
        setSequenceState(prev => ({ ...prev, step: 'fezinha_complete', fezinhaIndex: fIndex }));
        const result = currentSequenceResults.current[fIndex].toString().padStart(4, '0');

        await speak(`Está formada a Fezinha zero ${fNum}!`, 1000);
        await speak(`Milhar sorteada: ${result.split('').join(' ')}.`, 2000);

        // Verification
        await speak("Verificando possíveis ganhadores...", 500);
        setSequenceState(prev => ({ ...prev, step: 'verifying' }));
        // VerificationResult component will call onVerificationDone when ready
    };

    const runDigitDraw = async (fIndex: number, dIndex: number) => {
        const fNum = fIndex + 1;

        // Pre-announcement
        setSequenceState({ step: 'digit_intro', fezinhaIndex: fIndex, digitIndex: dIndex });

        if (dIndex === 0) {
            await speak(`Primeiro dígito da Fezinha zero ${fNum}.`, 800);
            await speak("Valendo...", 1000);
        } else if (dIndex === 1) {
            await speak("Segundo dígito.", 800);
            await speak("Atenção...", 1000);
        } else if (dIndex === 2) {
            await speak("Terceiro dígito.", 800);
            await speak("Mais um momento de atenção.", 1000);
        } else {
            await speak(`Quarto e último dígito.`, 1000);
            await speak("Valendo...", 1500);
        }

        // Spinning
        setSequenceState({ step: 'drawing_digit', fezinhaIndex: fIndex, digitIndex: dIndex });
        setPresenterText("🍀 Girando... 🍀");
        await wait(2500);

        // Reveal
        const fullNumber = currentSequenceResults.current[fIndex];
        const strNum = fullNumber.toString().padStart(4, '0');
        const digitChar = strNum[dIndex];
        const digit = parseInt(digitChar);

        // Update the display with the new digit
        setDisplayValues(prev => {
            const newVals = prev.map(row => [...row]);
            newVals[fIndex][dIndex] = digit;
            return newVals;
        });

        setSequenceState({ step: 'reveal_digit', fezinhaIndex: fIndex, digitIndex: dIndex });
        await speak(`Número sorteado: ${digitChar}.`, 1500);
    };

    const onVerificationDone = async () => {
        const fezinhaIdx = sequenceState.fezinhaIndex;

        // Simulate winners
        const hasWinner = Math.random() > 0.5;
        const winnersList = hasWinner ? [
            { ticket: Math.floor(Math.random() * 100000).toString(), name: "João Silva" },
            ...(Math.random() > 0.7 ? [{ ticket: Math.floor(Math.random() * 100000).toString(), name: "Maria Santos" }] : [])
        ] : [];

        const winnerData: WinnerInfo = hasWinner ? {
            hasWinner: true,
            ticket: winnersList[0].ticket,
            cambista: winnersList[0].name,
            description: winnersList.length > 1 ? `${winnersList.length} Ganhadores!` : "Bilhete Premiado!"
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
            await speak("Temos ganhador!", 1000);
            for (let i = 0; i < winnersList.length; i++) {
                const winner = winnersList[i];
                await speak(`Ganhador ${i + 1}: Bilhete ${winner.ticket}.`, 1000);
                await speak(`Nome: ${winner.name}. Parabéns!`, 1500);
            }
        } else {
            await speak("Não houve ganhadores nesta extração.", 2000);
        }

        // Next fezinha or finish
        const nextFezinha = fezinhaIdx + 1;
        if (nextFezinha < 4) {
            await runFezinhaFlow(nextFezinha);
        } else {
            await finishShow();
        }
    };

    const finishShow = async () => {
        setSequenceState(prev => ({ ...prev, step: 'outro' }));

        await speak("O sorteio 2x1000 está oficialmente concluído.", 1000);
        await speak("Parabéns aos ganhadores.", 1000);
        await speak("Agradecemos a participação de todos.", 1000);
        await speak("Boa sorte e até a próxima.", 2000);

        setHistory(prev => [{
            numbers: [...currentSequenceResults.current],
            timestamp: new Date()
        }, ...prev].slice(0, 5));

        setIsRunning(false);
        setPresenterText("Fim da Transmissão");
    };

    return (
        <div className="relative w-full flex flex-col items-center gap-6 py-8 min-h-[800px]">
            {/* Sound Toggle */}
            <div className="absolute top-4 right-4 z-50">
                <Button variant="secondary" size="icon" onClick={() => setSoundEnabled(!soundEnabled)}>
                    {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </Button>
            </div>

            {/* Presenter */}
            <VirtualPresenter text={presenterText} isSpeaking={isPresenterSpeaking} />

            {/* Fezinhas Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full px-4">
                {displayValues.map((digits, fIndex) => {
                    const isActive = sequenceState.fezinhaIndex === fIndex;
                    const isDrawing = sequenceState.step === 'drawing_digit' && isActive;
                    const dimmed = isRunning && !isActive;

                    return (
                        <div
                            key={fIndex}
                            className={`flex flex-col items-center space-y-4 transition-all duration-500 ${dimmed ? 'opacity-30 scale-95' : 'opacity-100 scale-100'}`}
                        >
                            <div className="flex items-center gap-2 text-primary font-bold text-lg uppercase tracking-widest">
                                <Ticket className="w-5 h-5" />
                                Fezinha 0{fIndex + 1}
                            </div>

                            <div className="relative">
                                <DrawGroup
                                    digits={digits}
                                    spinningIndex={isDrawing ? sequenceState.digitIndex : null}
                                />
                                {sequenceState.step === 'fezinha_complete' && isActive && <Confetti />}
                            </div>

                            {/* Winner Display */}
                            <div className="h-28 w-full flex items-center justify-center">
                                <AnimatePresence mode="wait">
                                    {winners[fIndex] && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`w-full p-3 rounded-xl border flex flex-col items-center ${winners[fIndex]!.hasWinner
                                                    ? 'bg-emerald-500/10 border-emerald-500/50'
                                                    : 'bg-muted/50 border-border'
                                                }`}
                                        >
                                            {winners[fIndex]!.hasWinner ? (
                                                <>
                                                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                                                        <Trophy className="w-4 h-4" />
                                                        {winners[fIndex]!.description}
                                                    </div>
                                                    <div className="text-foreground font-mono font-bold text-lg">
                                                        {winners[fIndex]!.ticket}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        {winners[fIndex]!.cambista}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <XCircle className="w-4 h-4" />
                                                    {winners[fIndex]!.description}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Overlays */}
            <AnimatePresence>
                {sequenceState.step === 'countdown' && (
                    <CountdownOverlay isVisible={true} onComplete={onCountdownDone} seconds={5} />
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

            {/* Start Button */}
            {!isRunning && (
                <div className="flex flex-col items-center pt-8">
                    <Button
                        size="lg"
                        onClick={startSequence}
                        className="min-w-[240px] h-14 text-xl font-bold shadow-xl hover:shadow-primary/40 transition-all bg-primary hover:bg-primary/90 rounded-full"
                    >
                        <Play className="mr-3 h-6 w-6 fill-current" />
                        Iniciar Sorteio
                    </Button>
                </div>
            )}

            {/* History */}
            {history.length > 0 && !isRunning && (
                <Card className="bg-muted/10 border-border/50 w-full max-w-5xl mt-8">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Últimos Sorteios
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {history.map((record, i) => (
                                <div key={i} className="flex gap-4 items-center justify-between p-4 bg-background/50 rounded-lg border border-border/30">
                                    <span className="text-xs text-muted-foreground">
                                        {record.timestamp.toLocaleTimeString()}
                                    </span>
                                    <div className="flex gap-8">
                                        {record.numbers.map((num, idx) => (
                                            <div key={idx} className="text-center">
                                                <div className="text-[10px] text-muted-foreground uppercase">F0{idx + 1}</div>
                                                <div className="font-mono font-bold text-xl">{num.toString().padStart(4, '0')}</div>
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
