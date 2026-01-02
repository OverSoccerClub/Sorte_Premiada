"use client";

import { useState, useRef, useCallback } from "react";
import { DrawGroup } from "./DrawGroup";
import { CountdownOverlay } from "./CountdownOverlay";
import { Confetti } from "./Confetti";
import { VerificationResult } from "./VerificationResult";
import { VirtualPresenter } from "./VirtualPresenter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Ticket, Clock, Volume2, VolumeX, Trophy, User, XCircle, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { narrator } from "@/lib/audio";
import { soundFX } from "@/lib/soundfx";

interface WinnerInfo {
    hasWinner: boolean;
    ticket?: string;
    cambista?: string;
    description?: string;
}

// Professional TV-style timing constants (in milliseconds)
const TIMING = {
    SHORT_PAUSE: 600,
    MEDIUM_PAUSE: 1000,
    LONG_PAUSE: 1500,
    DRAMATIC_PAUSE: 2000,
    EXTRA_DRAMATIC: 2500,
    SPIN_DURATION: 3000,
    BETWEEN_FEZINHAS: 2000,
    AFTER_REVEAL: 1200,
};

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

    const wait = useCallback((ms: number) => new Promise(resolve => setTimeout(resolve, ms)), []);

    // Professional speak function with proper timing
    const speak = useCallback(async (text: string, pauseAfter: number = TIMING.MEDIUM_PAUSE) => {
        setPresenterText(text);
        setIsPresenterSpeaking(true);

        if (soundEnabled) {
            await narrator.speakAsync(text);
        } else {
            // Silent mode: estimate time based on text length
            await wait(Math.max(text.length * 50 + 500, 1500));
        }

        setIsPresenterSpeaking(false);

        // Pause after speaking for dramatic effect
        if (pauseAfter > 0) {
            await wait(pauseAfter);
        }
    }, [soundEnabled, wait]);

    const startSequence = async () => {
        // Generate random results for all 4 fezinhas
        currentSequenceResults.current = Array.from({ length: 4 }).map(() =>
            Math.floor(Math.random() * 10000)
        );

        // Reset display state
        setDisplayValues([
            ['?', '?', '?', '?'],
            ['?', '?', '?', '?'],
            ['?', '?', '?', '?'],
            ['?', '?', '?', '?']
        ]);
        setWinners([null, null, null, null]);
        setIsRunning(true);

        // === ABERTURA PROFISSIONAL ===
        setSequenceState({ step: 'intro', fezinhaIndex: 0, digitIndex: 0 });

        await speak("Boa noite, Brasil!", TIMING.LONG_PAUSE);
        await speak("Bem-vindos ao sorteio oficial dois por mil.", TIMING.MEDIUM_PAUSE);
        await speak("Eu sou seu apresentador, e é uma honra estar aqui com vocês.", TIMING.LONG_PAUSE);

        await speak("Este sorteio é realizado com total transparência e segurança.", TIMING.MEDIUM_PAUSE);
        await speak("Todos os números são gerados de forma aleatória e auditável.", TIMING.LONG_PAUSE);

        await speak("Hoje vamos sortear quatro milhares.", TIMING.MEDIUM_PAUSE);
        await speak("Cada uma das nossas Fezinhas terá seus quatro dígitos revelados, um por um.", TIMING.LONG_PAUSE);

        await speak("Segurem a emoção...", TIMING.DRAMATIC_PAUSE);
        await speak("Vamos começar!", TIMING.EXTRA_DRAMATIC);

        setSequenceState(prev => ({ ...prev, step: 'countdown' }));
    };

    const onCountdownDone = async () => {
        await runFezinhaFlow(0);
    };

    const runFezinhaFlow = async (fIndex: number) => {
        const fezinhaNum = fIndex + 1;
        const fezinhaName = `zero ${['um', 'dois', 'três', 'quatro'][fIndex]}`;

        // === ANÚNCIO DA FEZINHA ===
        setSequenceState(prev => ({ ...prev, fezinhaIndex: fIndex }));

        if (fIndex === 0) {
            await speak(`Chegou a hora da primeira extração!`, TIMING.MEDIUM_PAUSE);
            await speak(`Fezinha ${fezinhaName}, você está pronta?`, TIMING.LONG_PAUSE);
            await speak("Atenção, jogadores...", TIMING.DRAMATIC_PAUSE);
        } else if (fIndex === 1) {
            await speak(`E agora, senhoras e senhores...`, TIMING.MEDIUM_PAUSE);
            await speak(`Chegou a vez da Fezinha ${fezinhaName}!`, TIMING.LONG_PAUSE);
            await speak("Muita calma nessa hora!", TIMING.DRAMATIC_PAUSE);
        } else if (fIndex === 2) {
            await speak(`Continuamos com energia total!`, TIMING.MEDIUM_PAUSE);
            await speak(`Fezinha ${fezinhaName} está chegando!`, TIMING.LONG_PAUSE);
            await speak("A sorte pode estar do seu lado!", TIMING.DRAMATIC_PAUSE);
        } else {
            await speak(`E chegamos ao grande final!`, TIMING.MEDIUM_PAUSE);
            await speak(`A última extração da noite: Fezinha ${fezinhaName}!`, TIMING.LONG_PAUSE);
            await speak("Este é o momento decisivo!", TIMING.DRAMATIC_PAUSE);
            await speak("Vamos descobrir juntos!", TIMING.EXTRA_DRAMATIC);
        }

        // === SORTEIO DOS DÍGITOS ===
        for (let dIndex = 0; dIndex < 4; dIndex++) {
            await runDigitDraw(fIndex, dIndex);
        }

        // === FEZINHA COMPLETA ===
        setSequenceState(prev => ({ ...prev, step: 'fezinha_complete' }));
        const result = currentSequenceResults.current[fIndex].toString().padStart(4, '0');
        const resultSpoken = result.split('').map(d =>
            ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'][parseInt(d)]
        ).join('... ');

        await wait(500); // Let confetti start
        await speak(`Está formada a Fezinha ${fezinhaName}!`, TIMING.LONG_PAUSE);
        await speak(`A milhar sorteada é: ${resultSpoken}!`, TIMING.DRAMATIC_PAUSE);

        // === VERIFICAÇÃO ===
        await speak("Vamos verificar se temos ganhadores...", TIMING.MEDIUM_PAUSE);
        setSequenceState(prev => ({ ...prev, step: 'verifying' }));
    };

    const runDigitDraw = async (fIndex: number, dIndex: number) => {
        const digitPosition = ['primeiro', 'segundo', 'terceiro', 'quarto'][dIndex];
        const fezinhaName = `zero ${['um', 'dois', 'três', 'quatro'][fIndex]}`;

        // === PRÉ-ANÚNCIO ===
        setSequenceState({ step: 'digit_intro', fezinhaIndex: fIndex, digitIndex: dIndex });

        if (dIndex === 0) {
            await speak(`${digitPosition} dígito!`, TIMING.SHORT_PAUSE);
            await speak("Atenção...", TIMING.MEDIUM_PAUSE);
        } else if (dIndex === 1) {
            await speak(`Agora, o ${digitPosition} dígito.`, TIMING.SHORT_PAUSE);
            await speak("Girando...", TIMING.MEDIUM_PAUSE);
        } else if (dIndex === 2) {
            await speak(`${digitPosition} dígito vem aí!`, TIMING.SHORT_PAUSE);
            await speak("Concentração...", TIMING.MEDIUM_PAUSE);
        } else {
            await speak(`E agora, o ${digitPosition} e último dígito!`, TIMING.MEDIUM_PAUSE);
            await speak("Momento crucial!", TIMING.LONG_PAUSE);
        }

        // === SPINNING ===
        setSequenceState({ step: 'drawing_digit', fezinhaIndex: fIndex, digitIndex: dIndex });
        setPresenterText("🎰 Girando... 🎰");

        // Start spinning sound
        if (soundEnabled) soundFX.startSpinSound();
        await wait(TIMING.SPIN_DURATION);
        // Stop spinning sound
        soundFX.stopSpinSound();

        // === REVELAÇÃO ===
        const fullNumber = currentSequenceResults.current[fIndex];
        const strNum = fullNumber.toString().padStart(4, '0');
        const digitChar = strNum[dIndex];
        const digit = parseInt(digitChar);
        const digitWord = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'][digit];

        // Update display with revealed digit
        setDisplayValues(prev => {
            const newVals = prev.map(row => [...row]);
            newVals[fIndex][dIndex] = digit;
            return newVals;
        });

        setSequenceState({ step: 'reveal_digit', fezinhaIndex: fIndex, digitIndex: dIndex });

        // Play reveal "plim" sound
        if (soundEnabled) soundFX.playRevealSound();

        await speak(`Número: ${digitWord}!`, TIMING.AFTER_REVEAL);
    };

    const onVerificationDone = async () => {
        const fezinhaIdx = sequenceState.fezinhaIndex;
        const fezinhaName = `zero ${['um', 'dois', 'três', 'quatro'][fezinhaIdx]}`;

        // Simulate winner check (in production, this would call the API)
        const hasWinner = Math.random() > 0.5;
        const winnersList = hasWinner ? [
            { ticket: Math.floor(Math.random() * 100000).toString().padStart(5, '0'), name: "Sortudo da Vez" },
            ...(Math.random() > 0.7 ? [{ ticket: Math.floor(Math.random() * 100000).toString().padStart(5, '0'), name: "Grande Vencedor" }] : [])
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

        // === ANÚNCIO DO RESULTADO ===
        if (hasWinner) {
            // Play winner celebration with applause
            if (soundEnabled) soundFX.playWinnerSound();

            await speak("Atenção! Temos ganhador!", TIMING.LONG_PAUSE);

            for (let i = 0; i < winnersList.length; i++) {
                const winner = winnersList[i];
                if (winnersList.length > 1) {
                    await speak(`Ganhador número ${i + 1}:`, TIMING.SHORT_PAUSE);
                }
                await speak(`Bilhete número ${winner.ticket}!`, TIMING.MEDIUM_PAUSE);
                await speak("Parabéns ao nosso sortudo!", TIMING.LONG_PAUSE);
            }

            if (winnersList.length > 1) {
                await speak(`Incrível! ${winnersList.length} ganhadores nesta extração!`, TIMING.LONG_PAUSE);
            }
        } else {
            await speak("Não temos ganhadores para esta milhar.", TIMING.MEDIUM_PAUSE);
            await speak("O prêmio acumula!", TIMING.LONG_PAUSE);
        }

        // === PRÓXIMA FEZINHA OU FINALIZAÇÃO ===
        const nextFezinha = fezinhaIdx + 1;
        if (nextFezinha < 4) {
            await speak("Mas calma, ainda não acabou!", TIMING.MEDIUM_PAUSE);
            await wait(TIMING.BETWEEN_FEZINHAS);
            await runFezinhaFlow(nextFezinha);
        } else {
            await finishShow();
        }
    };

    const finishShow = async () => {
        setSequenceState(prev => ({ ...prev, step: 'outro' }));

        // === ENCERRAMENTO PROFISSIONAL ===
        await speak("E assim chegamos ao fim do nosso sorteio!", TIMING.LONG_PAUSE);

        // Resumo dos resultados
        await speak("Vamos relembrar os números sorteados:", TIMING.MEDIUM_PAUSE);

        for (let i = 0; i < 4; i++) {
            const result = currentSequenceResults.current[i].toString().padStart(4, '0');
            const fezinhaName = `Fezinha zero ${['um', 'dois', 'três', 'quatro'][i]}`;
            await speak(`${fezinhaName}: ${result.split('').join(' ')}`, TIMING.SHORT_PAUSE);
        }

        await speak("Parabéns a todos os ganhadores de hoje!", TIMING.LONG_PAUSE);
        await speak("E para quem não ganhou desta vez, não desanime!", TIMING.MEDIUM_PAUSE);
        await speak("A sorte pode estar mais perto do que você imagina.", TIMING.LONG_PAUSE);

        await speak("Muito obrigado pela sua participação.", TIMING.MEDIUM_PAUSE);
        await speak("Até o próximo sorteio!", TIMING.DRAMATIC_PAUSE);
        await speak("Boa sorte!", TIMING.EXTRA_DRAMATIC);

        // Save to history
        setHistory(prev => [{
            numbers: [...currentSequenceResults.current],
            timestamp: new Date()
        }, ...prev].slice(0, 5));

        setIsRunning(false);
        setPresenterText("Fim da Transmissão • Obrigado por assistir!");
    };

    return (
        <div className="relative w-full flex flex-col items-center gap-6 py-8 min-h-[800px] bg-gradient-to-b from-slate-900 via-slate-950 to-black">
            {/* Ambient particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-primary/30 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [-20, 20],
                            opacity: [0.2, 0.5, 0.2],
                        }}
                        transition={{
                            repeat: Infinity,
                            duration: 3 + Math.random() * 2,
                            delay: Math.random() * 2,
                        }}
                    />
                ))}
            </div>

            {/* Sound Toggle */}
            <div className="absolute top-4 right-4 z-50">
                <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="bg-slate-800/80 border-slate-700 hover:bg-slate-700"
                >
                    {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </Button>
            </div>

            {/* Presenter */}
            <VirtualPresenter text={presenterText} isSpeaking={isPresenterSpeaking} />

            {/* Fezinhas Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full px-4 relative z-10">
                {displayValues.map((digits, fIndex) => {
                    const isActive = sequenceState.fezinhaIndex === fIndex;
                    const isDrawing = sequenceState.step === 'drawing_digit' && isActive;
                    const isComplete = winners[fIndex] !== null;
                    const dimmed = isRunning && !isActive;

                    return (
                        <motion.div
                            key={fIndex}
                            className={`flex flex-col items-center space-y-4 transition-all duration-500 ${dimmed ? 'opacity-30 scale-95' : 'opacity-100 scale-100'}`}
                            animate={isActive && !isComplete ? {
                                boxShadow: ['0 0 20px rgba(var(--primary-rgb), 0.2)', '0 0 40px rgba(var(--primary-rgb), 0.4)', '0 0 20px rgba(var(--primary-rgb), 0.2)']
                            } : {}}
                            transition={{ repeat: Infinity, duration: 2 }}
                        >
                            {/* Fezinha Header */}
                            <div className="flex items-center gap-2 text-primary font-bold text-lg uppercase tracking-widest bg-slate-800/50 px-4 py-2 rounded-full border border-primary/30">
                                <Ticket className="w-5 h-5" />
                                Fezinha 0{fIndex + 1}
                                {isComplete && <Sparkles className="w-4 h-4 text-yellow-400" />}
                            </div>

                            {/* Draw Group */}
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
                                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            className={`w-full p-3 rounded-xl border flex flex-col items-center backdrop-blur-sm ${winners[fIndex]!.hasWinner
                                                ? 'bg-emerald-500/20 border-emerald-500/50 shadow-lg shadow-emerald-500/20'
                                                : 'bg-slate-800/50 border-slate-600/50'
                                                }`}
                                        >
                                            {winners[fIndex]!.hasWinner ? (
                                                <>
                                                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                                                        <Trophy className="w-4 h-4" />
                                                        {winners[fIndex]!.description}
                                                    </div>
                                                    <div className="text-white font-mono font-bold text-lg">
                                                        {winners[fIndex]!.ticket}
                                                    </div>
                                                    <div className="text-xs text-emerald-300/70 flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        {winners[fIndex]!.cambista}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <XCircle className="w-4 h-4" />
                                                    {winners[fIndex]!.description}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
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
                <motion.div
                    className="flex flex-col items-center pt-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Button
                        size="lg"
                        onClick={startSequence}
                        className="min-w-[280px] h-16 text-xl font-bold shadow-2xl hover:shadow-primary/40 transition-all bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-500 rounded-full border-2 border-primary/50"
                    >
                        <Play className="mr-3 h-7 w-7 fill-current" />
                        Iniciar Sorteio Oficial
                    </Button>
                    <p className="text-slate-500 text-sm mt-3">Clique para começar a transmissão ao vivo</p>
                </motion.div>
            )}

            {/* History */}
            {history.length > 0 && !isRunning && (
                <Card className="bg-slate-900/80 border-slate-700/50 w-full max-w-5xl mt-8 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Últimos Sorteios
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {history.map((record, i) => (
                                <div key={i} className="flex gap-4 items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/30">
                                    <span className="text-xs text-slate-500">
                                        {record.timestamp.toLocaleTimeString()}
                                    </span>
                                    <div className="flex gap-8">
                                        {record.numbers.map((num, idx) => (
                                            <div key={idx} className="text-center">
                                                <div className="text-[10px] text-slate-500 uppercase">F0{idx + 1}</div>
                                                <div className="font-mono font-bold text-xl text-white">{num.toString().padStart(4, '0')}</div>
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
