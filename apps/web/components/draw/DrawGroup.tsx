"use client";

import { DrawDigit } from "./DrawDigit";
import { motion } from "framer-motion";

interface DrawGroupProps {
    digits: (string | number)[];
    spinningIndex: number | null;
}

export function DrawGroup({ digits, spinningIndex }: DrawGroupProps) {
    // Ensure we always have 4 positions
    const safeDigits = [...digits, '?', '?', '?', '?'].slice(0, 4);
    const hasAnyRevealed = safeDigits.some(d => typeof d === 'number');

    return (
        <div className="relative">
            {/* Glow effect behind the group */}
            {spinningIndex !== null && (
                <motion.div
                    className="absolute -inset-4 bg-amber-500/10 rounded-2xl blur-xl"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                />
            )}

            <div className="flex gap-3 p-5 bg-gradient-to-b from-slate-800/80 to-slate-900/90 rounded-2xl border border-slate-600/50 shadow-2xl relative overflow-hidden backdrop-blur-sm">
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

                {/* Top edge highlight */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-400/30 to-transparent" />

                {safeDigits.map((digit, index) => (
                    <div key={index} className="relative">
                        {/* Active digit spotlight */}
                        {spinningIndex === index && (
                            <motion.div
                                className="absolute -inset-2 bg-amber-400/20 rounded-xl blur-md"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 0.3 }}
                            />
                        )}

                        <DrawDigit
                            value={digit}
                            isSpinning={spinningIndex === index}
                            delay={0}
                        />
                    </div>
                ))}
            </div>

            {/* Complete indicator line */}
            {hasAnyRevealed && spinningIndex === null && (
                <motion.div
                    className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 h-1 bg-gradient-to-r from-emerald-400 to-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '80%' }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                />
            )}
        </div>
    );
}
