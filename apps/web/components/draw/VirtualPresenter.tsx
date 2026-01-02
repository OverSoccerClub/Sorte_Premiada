"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mic2, Sparkles } from "lucide-react";

interface VirtualPresenterProps {
    text: string;
    isSpeaking: boolean;
}

export function VirtualPresenter({ text, isSpeaking }: VirtualPresenterProps) {
    return (
        <div className="w-full max-w-3xl mx-auto mb-8 flex flex-col items-center z-30">
            <AnimatePresence mode="wait">
                {text && (
                    <motion.div
                        key={text}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="bg-card/90 backdrop-blur-md border border-primary/20 rounded-2xl p-6 shadow-2xl relative flex items-center gap-6 min-h-[120px] w-full"
                    >
                        {/* Avatar / Icon */}
                        <div className="relative flex-shrink-0">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary to-emerald-600 rounded-full flex items-center justify-center shadow-lg ring-4 ring-primary/20">
                                <Mic2 className="w-8 h-8 text-white" />
                            </div>
                            {isSpeaking && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse border-2 border-background" />
                            )}
                            {/* Pulse rings */}
                            {isSpeaking && (
                                <>
                                    <motion.div
                                        className="absolute inset-0 rounded-full border-4 border-primary/30"
                                        animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                    />
                                </>
                            )}
                        </div>

                        {/* Dialogue Bubble */}
                        <div className="flex-1 flex flex-col">
                            <span className="text-xs uppercase tracking-widest text-primary font-bold mb-1 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                Apresentador Virtual
                            </span>
                            <p className="text-xl md:text-2xl font-medium text-foreground leading-relaxed">
                                "{text}"
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
