"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const HEIGHT = 90;

interface DrawDigitProps {
    value: number | string;
    isSpinning: boolean;
    delay?: number;
}

export function DrawDigit({ value, isSpinning, delay = 0 }: DrawDigitProps) {
    // Determine state
    const isRevealed = typeof value === 'number' && !isSpinning;
    const showPlaceholder = value === '?' && !isSpinning;

    // Calculate the target position for revealed digit
    const getTargetY = () => {
        if (typeof value !== 'number') return 0;
        // Land on position 10 + value to ensure scrolled past first set
        return -((10 + value) * HEIGHT);
    };

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
            {/* Placeholder "?" - only when waiting and not spinning */}
            {showPlaceholder && (
                <motion.div
                    className="flex items-center justify-center font-mono font-bold text-5xl text-slate-500 w-full h-full absolute inset-0"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                >
                    ?
                </motion.div>
            )}

            {/* Spinning animation - show when isSpinning is true */}
            {isSpinning && (
                <motion.div
                    className="flex flex-col items-center absolute inset-0"
                    animate={{
                        y: [0, -HEIGHT * 10],
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: 0.5,
                        ease: "linear"
                    }}
                >
                    {/* Render numbers 0-9 multiple times for smooth scrolling */}
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-center font-mono font-black text-5xl text-amber-200 w-full flex-shrink-0"
                            style={{ height: HEIGHT, minHeight: HEIGHT }}
                        >
                            {i % 10}
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Revealed number - show when value is a number and not spinning */}
            {isRevealed && (
                <motion.div
                    key={`digit-${value}`}
                    className="flex items-center justify-center font-mono font-black text-5xl text-white w-full h-full absolute inset-0"
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                        delay: delay
                    }}
                >
                    {value}
                </motion.div>
            )}

            {/* Glass overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/40 pointer-events-none rounded-xl z-10" />

            {/* Top shine line */}
            <div className="absolute inset-x-0 top-0 h-px bg-white/30 rounded-t-xl z-10" />

            {/* Bottom shadow */}
            <div className="absolute inset-x-0 bottom-0 h-1 bg-black/30 rounded-b-xl z-10" />

            {/* Spinning glow effect */}
            {isSpinning && (
                <motion.div
                    className="absolute inset-0 bg-amber-400/10 rounded-xl z-5"
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ repeat: Infinity, duration: 0.3 }}
                />
            )}

            {/* Reveal flash effect */}
            {isRevealed && (
                <motion.div
                    className="absolute inset-0 bg-emerald-400/40 rounded-xl pointer-events-none z-20"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                />
            )}
        </div>
    );
}
