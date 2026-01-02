"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Radio, Tv } from "lucide-react";
import Image from "next/image";

interface VirtualPresenterProps {
    text: string;
    isSpeaking: boolean;
}

export function VirtualPresenter({ text, isSpeaking }: VirtualPresenterProps) {
    return (
        <div className="w-full max-w-4xl mx-auto mb-8 flex flex-col items-center z-30 pointer-events-auto">
            {/* TV Frame Container */}
            <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-2 border-slate-600 rounded-2xl overflow-hidden shadow-2xl relative w-full flex flex-col md:flex-row min-h-[220px]">

                {/* Presenter Visual Area */}
                <div className="relative w-full md:w-[280px] h-[280px] md:h-auto flex-shrink-0 overflow-hidden border-b md:border-b-0 md:border-r border-slate-700/50">
                    {/* Gradient Background for transparent image */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-slate-800/60 to-emerald-900/40" />

                    {/* Animated background particles */}
                    <div className="absolute inset-0 overflow-hidden">
                        {[...Array(6)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 bg-primary/20 rounded-full"
                                style={{
                                    left: `${20 + i * 12}%`,
                                    top: `${30 + (i % 3) * 20}%`,
                                }}
                                animate={{
                                    y: [-10, 10, -10],
                                    opacity: [0.3, 0.6, 0.3],
                                }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 3 + i * 0.5,
                                    delay: i * 0.2,
                                }}
                            />
                        ))}
                    </div>

                    {/* Live Indicator */}
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                        <motion.div
                            className={`w-2.5 h-2.5 rounded-full ${isSpeaking ? 'bg-red-500' : 'bg-gray-500'}`}
                            animate={isSpeaking ? {
                                scale: [1, 1.2, 1],
                                opacity: [1, 0.7, 1]
                            } : {}}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                        />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                            {isSpeaking ? 'AO VIVO' : 'AGUARDANDO'}
                        </span>
                    </div>

                    {/* HD Badge */}
                    <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[9px] font-mono text-emerald-400 border border-emerald-500/30">
                        <Tv className="w-3 h-3" />
                        HD
                    </div>

                    {/* Presenter Image */}
                    <div className="w-full h-full relative flex items-center justify-center p-2">
                        <motion.div
                            className="relative w-full h-full"
                            animate={isSpeaking ? {
                                scale: [1, 1.01, 1],
                            } : {
                                scale: 1,
                            }}
                            transition={{
                                repeat: isSpeaking ? Infinity : 0,
                                duration: 0.5,
                            }}
                        >
                            <Image
                                src="/presenter.png"
                                alt="Apresentador Virtual"
                                fill
                                className="object-contain drop-shadow-2xl"
                                priority
                            />
                        </motion.div>

                        {/* Speaking Aura Effect */}
                        <AnimatePresence>
                            {isSpeaking && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{
                                        opacity: [0.2, 0.4, 0.2],
                                        scale: [0.9, 1.1, 0.9]
                                    }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                    className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent rounded-full blur-2xl pointer-events-none"
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Lower Third Name Banner */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-primary via-primary/90 to-primary/70 px-4 py-2 backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-white font-bold text-sm tracking-wide">
                                    SORTEIO OFICIAL
                                </div>
                                <div className="text-white/80 text-[10px] uppercase tracking-widest">
                                    2x1000 • Ao Vivo
                                </div>
                            </div>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                            >
                                <Sparkles className="w-5 h-5 text-yellow-300" />
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Dialogue Area */}
                <div className="flex-1 p-6 flex flex-col justify-center relative bg-gradient-to-br from-slate-800/50 to-slate-900/50">
                    {/* Signal indicator */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                        <Radio className={`w-4 h-4 ${isSpeaking ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <div className="flex gap-0.5">
                            {[1, 2, 3, 4].map((bar) => (
                                <motion.div
                                    key={bar}
                                    className={`w-1 rounded-full ${isSpeaking ? 'bg-emerald-400' : 'bg-slate-600'}`}
                                    style={{ height: 4 + bar * 3 }}
                                    animate={isSpeaking ? {
                                        opacity: [0.5, 1, 0.5],
                                        scaleY: [0.8, 1, 0.8],
                                    } : {}}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 0.5,
                                        delay: bar * 0.1,
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <span className="text-xs uppercase tracking-widest text-primary font-bold flex items-center gap-2 mb-4">
                        <motion.div
                            animate={isSpeaking ? { scale: [1, 1.2, 1] } : {}}
                            transition={{ repeat: Infinity, duration: 0.5 }}
                        >
                            <Sparkles className="w-4 h-4" />
                        </motion.div>
                        Apresentador Oficial
                    </span>

                    {/* Speech Bubble */}
                    <div className="relative">
                        <div className="absolute -left-2 top-4 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-slate-700/50 border-b-8 border-b-transparent md:block hidden" />

                        <div className="bg-slate-700/30 backdrop-blur-sm rounded-xl p-4 border border-slate-600/50">
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={text}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.25 }}
                                    className="text-xl md:text-2xl font-medium text-white leading-relaxed"
                                >
                                    {text ? (
                                        <>
                                            <span className="text-primary">"</span>
                                            {text}
                                            <span className="text-primary">"</span>
                                        </>
                                    ) : (
                                        <span className="text-slate-500 italic">Aguardando...</span>
                                    )}
                                </motion.p>
                            </AnimatePresence>

                            {/* Speaking indicator dots */}
                            {isSpeaking && (
                                <div className="flex gap-1 mt-3">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            className="w-2 h-2 bg-primary rounded-full"
                                            animate={{
                                                y: [-2, 2, -2],
                                                opacity: [0.5, 1, 0.5],
                                            }}
                                            transition={{
                                                repeat: Infinity,
                                                duration: 0.6,
                                                delay: i * 0.15,
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
