"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const HEIGHT = 90;

interface DrawDigitProps {
    value: number | string;
    isSpinning: boolean;
    delay?: number;
}

export function DrawDigit({ value, isSpinning, delay = 0 }: DrawDigitProps) {
    // Track the displayed value internally to handle transitions
    const [displayedValue, setDisplayedValue] = useState<number | null>(null);
    const [hasRevealed, setHasRevealed] = useState(false);

    // When value changes to a number and not spinning, update displayed value
    useEffect(() => {
        if (typeof value === 'number' && !isSpinning) {
            setDisplayedValue(value);
            setHasRevealed(true);
        }
    }, [value, isSpinning]);

    // Reset when value goes back to '?'
    useEffect(() => {
        if (value === '?') {
            setDisplayedValue(null);
            setHasRevealed(false);
        }
    }, [value]);

    const isRevealed = typeof value === 'number' && !isSpinning;
    const showSpinner = isSpinning || (typeof value === 'number');

    return (
        <div
            className={cn(
                "relative overflow-hidden w-[72px] rounded-xl border-2 flex justify-center items-center shadow-xl transition-all duration-300",
                isSpinning
                    ? "bg-gradient-to-b from-amber-900 to-amber-950 border-amber-500/50 shadow-amber-500/30"
                    : isRevealed
                        ? "bg-gradient-to-b from-emerald-800 to-emerald-950 border-emerald-400/50 shadow-emerald-500/30"
                        : "bg-gradient-to-b from-slate-700 to-slate-900 border-slate-600"
            )}
            style={{ height: HEIGHT }}
        >
            <AnimatePresence mode="wait">
                {value === '?' ? (
                    // Placeholder state - question mark
                    <motion.div
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        exit={{ opacity: 0 }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="flex items-center justify-center font-mono font-bold text-5xl text-slate-500 w-full h-full"
                    >
                        ?
                    </motion.div>
                ) : isSpinning ? (
                    // Spinning animation
                    <motion.div
                        key="spinning"
                        className="flex flex-col items-center"
                        initial={{ y: 0 }}
                        animate={{
                            y: [0, -900],
                        }}
                        transition={{
                            repeat: Infinity,
                            duration: 0.2,
                            ease: "linear"
                        }}
                    >
                        {Array.from({ length: 30 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-center font-mono font-black text-5xl w-full text-amber-200"
                                style={{ height: HEIGHT, minHeight: HEIGHT }}
                            >
                                {i % 10}
                            </div>
                        ))}
                    </motion.div>
                ) : (
                    // Revealed static number
                    <motion.div
                        key={`revealed-${value}`}
                        initial={{ scale: 1.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                            delay: delay
                        }}
                        className="flex items-center justify-center font-mono font-black text-5xl text-white w-full h-full"
                    >
                        {value}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Glass overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/40 pointer-events-none rounded-xl" />

            {/* Top shine line */}
            <div className="absolute inset-x-0 top-0 h-px bg-white/30 rounded-t-xl" />

            {/* Bottom shadow */}
            <div className="absolute inset-x-0 bottom-0 h-1 bg-black/30 rounded-b-xl" />

            {/* Spinning glow effect */}
            {isSpinning && (
                <motion.div
                    className="absolute inset-0 bg-amber-400/10 rounded-xl"
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ repeat: Infinity, duration: 0.3 }}
                />
            )}

            {/* Reveal flash effect */}
            {isRevealed && (
                <motion.div
                    className="absolute inset-0 bg-emerald-400/40 rounded-xl pointer-events-none"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                />
            )}
        </div>
    );
}
