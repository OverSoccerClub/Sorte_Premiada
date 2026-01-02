"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Wifi, Radio } from "lucide-react";
import Image from "next/image";

interface VirtualPresenterProps {
    text: string;
    isSpeaking: boolean;
}

export function VirtualPresenter({ text, isSpeaking }: VirtualPresenterProps) {
    return (
        <div className="w-full max-w-4xl mx-auto mb-8 flex flex-col items-center z-30 pointer-events-auto">
            <div className="bg-card border border-primary/30 rounded-2xl overflow-hidden shadow-2xl relative w-full flex flex-col md:flex-row min-h-[180px]">

                {/* Presenter Visual Area */}
                <div className="relative w-full md:w-[220px] h-[220px] md:h-auto flex-shrink-0 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden border-b md:border-b-0 md:border-r border-primary/20">
                    {/* Live Indicator */}
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider">
                        <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
                        {isSpeaking ? 'AO VIVO' : 'EM ESPERA'}
                    </div>

                    {/* Presenter Image */}
                    <div className="w-full h-full relative flex items-center justify-center p-4">
                        <div className={`relative w-full h-full transition-transform duration-150 ${isSpeaking ? 'scale-[1.02]' : 'scale-100'}`}>
                            <Image
                                src="/presenter.png"
                                alt="Apresentador Virtual"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>

                        {/* Speaking Glow Effect */}
                        {isSpeaking && (
                            <motion.div
                                className="absolute inset-0 bg-primary/10 rounded-full blur-3xl"
                                animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.9, 1.1, 0.9] }}
                                transition={{ repeat: Infinity, duration: 0.8 }}
                            />
                        )}
                    </div>
                </div>

                {/* Dialogue Area */}
                <div className="flex-1 p-6 flex flex-col justify-center relative">
                    <div className="absolute top-4 right-4 text-xs font-mono text-muted-foreground flex items-center gap-1 opacity-60">
                        <Radio className="w-3 h-3" />
                        HD
                    </div>

                    <span className="text-xs uppercase tracking-widest text-primary font-bold flex items-center gap-1.5 mb-3">
                        <Sparkles className="w-3 h-3" />
                        Apresentador Virtual
                    </span>

                    <AnimatePresence mode="wait">
                        <motion.p
                            key={text}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="text-xl md:text-2xl font-medium text-foreground leading-relaxed"
                        >
                            {text ? `"${text}"` : "..."}
                        </motion.p>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
