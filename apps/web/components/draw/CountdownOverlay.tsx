"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface CountdownOverlayProps {
    isVisible: boolean;
    onComplete: () => void;
    seconds?: number;
}

export function CountdownOverlay({ isVisible, onComplete, seconds = 5 }: CountdownOverlayProps) {
    const [count, setCount] = useState(seconds);

    useEffect(() => {
        if (isVisible) {
            setCount(seconds);
            const interval = setInterval(() => {
                setCount((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            const timeout = setTimeout(() => {
                onComplete();
            }, seconds * 1000);

            return () => {
                clearInterval(interval);
                clearTimeout(timeout);
            };
        }
    }, [isVisible, seconds, onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl"
                >
                    <div className="relative flex items-center justify-center">
                        {/* Pulsing rings */}
                        <motion.div
                            className="absolute inset-0 rounded-full border-4 border-primary opacity-20"
                            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                        />

                        <motion.span
                            key={count}
                            initial={{ scale: 0.5, opacity: 0, y: 20 }}
                            animate={{ scale: 1.5, opacity: 1, y: 0 }}
                            exit={{ scale: 2, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="text-8xl font-black text-primary font-mono drop-shadow-2xl"
                        >
                            {count}
                        </motion.span>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="absolute bottom-20 text-center text-muted-foreground font-semibold text-xl uppercase tracking-widest"
                    >
                        Preparando próximo sorteio...
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
