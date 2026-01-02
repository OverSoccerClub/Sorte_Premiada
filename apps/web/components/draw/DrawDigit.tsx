"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const HEIGHT = 80;

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

    return (
        <div
            className="relative overflow-hidden w-16 bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg border border-slate-700 flex justify-center items-center shadow-lg"
            style={{ height: HEIGHT }}
        >
            {value === '?' ? (
                // Placeholder state
                <div className="flex items-center justify-center font-mono font-bold text-5xl text-slate-500 w-full h-full">
                    ?
                </div>
            ) : (
                <motion.div
                    className="flex flex-col items-center"
                    initial={{ y: 0 }}
                    animate={isSpinning ? {
                        y: [0, -800],
                        transition: {
                            repeat: Infinity,
                            duration: 0.3,
                            ease: "linear"
                        }
                    } : {
                        y: getTargetY(),
                        transition: {
                            type: "spring",
                            stiffness: 80,
                            damping: 12,
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
                                "w-full text-white"
                            )}
                            style={{ height: HEIGHT, minHeight: HEIGHT }}
                        >
                            {i % 10}
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Glass overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/30 pointer-events-none" />

            {/* Shine line */}
            <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
        </div>
    );
}
