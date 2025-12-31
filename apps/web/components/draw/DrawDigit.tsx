"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; // Repeated for smooth looping look
const HEIGHT = 80; // Height of each number container

interface DrawDigitProps {
    value: number | string;
    isSpinning: boolean;
    delay?: number;
}

export function DrawDigit({ value, isSpinning, delay = 0 }: DrawDigitProps) {
    const [targetY, setTargetY] = useState(0);

    // Spring physics for smooth deceleration
    const springY = useSpring(0, {
        stiffness: 50,
        damping: 15,
        mass: 1,
    });

    useEffect(() => {
        if (isSpinning) {
            // Spinning state is handled by the animate prop directly
        } else {
            if (typeof value === 'number') {
                // Calculate position to land on 'value'
                // We want to land on the second set of numbers to ensure we scrolled past the first
                const index = value + 10;
                const newY = -(index * HEIGHT);
                setTargetY(newY);
            } else {
                // Reset to 0 or specific position for placeholder
                setTargetY(0);
            }
        }
    }, [value, isSpinning, delay]);

    // If we want a constant spin, we can use a separate animation control.
    // But for now, let's try a simpler approach where we just animate to a very low negative number then snap back?
    // Actually, standard slot machines just spin until they stop.

    // Let's implement a continuous spin style:

    return (
        <div className="relative overflow-hidden h-20 w-16 bg-muted rounded-md border border-border flex justify-center items-center shadow-inner">
            <motion.div
                className="flex flex-col items-center"
                initial={{ y: 0 }}
                animate={isSpinning ? {
                    y: [0, -1000, 0],
                    transition: {
                        repeat: Infinity,
                        duration: 0.5,
                        ease: "linear"
                    }
                } : {
                    y: typeof value === 'number' ? -(value * HEIGHT) : 0,
                    transition: {
                        type: "spring",
                        stiffness: 60,
                        damping: 15,
                        delay: delay // Use exact seconds passed
                    }
                }}
            >
                {value === '?' ? (
                    <div className="flex items-center justify-center font-mono font-bold text-4xl text-foreground/50 h-20 w-full">
                        ?
                    </div>
                ) : (
                    /* Render a long strip of numbers */
                    Array.from({ length: 30 }).map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "flex items-center justify-center font-mono font-black text-5xl",
                                "h-20 w-full text-white drop-shadow-md"
                            )}
                        >
                            {i % 10}
                        </div>
                    ))
                )}
            </motion.div>

            {/* Overlay gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none" />
        </div>
    );
}
