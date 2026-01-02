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
    // Calculate the target position based on the value
    const getTargetY = () => {
        if (typeof value !== 'number') return 0;
        // Land on position 10 + value to ensure we scrolled past first set
        return -((10 + value) * HEIGHT);
    };

    const isRevealed = typeof value === 'number';

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
            {value === '?' ? (
                // Placeholder state
                <motion.div
                    className="flex items-center justify-center font-mono font-bold text-5xl text-slate-500 w-full h-full"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                >
                    ?
                </motion.div>
            ) : (
                <motion.div
                    className="flex flex-col items-center"
                    initial={{ y: 0 }}
                    animate={isSpinning ? {
                        y: [0, -900],
                        transition: {
                            repeat: Infinity,
                            duration: 0.25,
                            ease: "linear"
                        }
                    } : {
                        y: getTargetY(),
                        transition: {
                            type: "spring",
                            stiffness: 60,
                            damping: 15,
                            delay: delay
                        }
                    }}
                >
                    {/* Render 30 digits for smooth scrolling */}
                    {Array.from({ length: 30 }).map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "flex items-center justify-center font-mono font-black text-5xl",
                                "w-full",
                                isSpinning ? "text-amber-200" : "text-white"
                            )}
                            style={{ height: HEIGHT, minHeight: HEIGHT }}
                        >
                            {i % 10}
                        </div>
                    ))}
                </motion.div>
            )}

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
            {isRevealed && !isSpinning && (
                <motion.div
                    className="absolute inset-0 bg-emerald-400/30 rounded-xl pointer-events-none"
                    initial={{ opacity: 0.8 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                />
            )}
        </div>
    );
}
