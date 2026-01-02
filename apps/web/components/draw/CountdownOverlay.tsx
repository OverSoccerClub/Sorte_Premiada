"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";

interface CountdownOverlayProps {
    isVisible: boolean;
    onComplete: () => void;
    seconds?: number;
}

export function CountdownOverlay({ isVisible, onComplete, seconds = 5 }: CountdownOverlayProps) {
    const [count, setCount] = useState(seconds);
    const [showGo, setShowGo] = useState(false);
    const hasStartedRef = useRef(false);

    useEffect(() => {
        // Reset when visibility changes
        if (!isVisible) {
            hasStartedRef.current = false;
            setCount(seconds);
            setShowGo(false);
            return;
        }

        // Prevent double-start
        if (hasStartedRef.current) return;
        hasStartedRef.current = true;

        // Initialize
        setCount(seconds);
        setShowGo(false);

        let currentCount = seconds;

        const interval = setInterval(() => {
            currentCount -= 1;

            if (currentCount > 0) {
                setCount(currentCount);
            } else if (currentCount === 0) {
                setCount(0);
                setShowGo(true);
                clearInterval(interval);
            }
        }, 1000);

        // Call onComplete after countdown + extra time for "Valendo!"
        const timeout = setTimeout(() => {
            onComplete();
        }, seconds * 1000 + 800);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [isVisible, seconds, onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
                >
                    {/* Animated background rings */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        {[1, 2, 3].map((ring) => (
                            <motion.div
                                key={ring}
                                className="absolute rounded-full border-2 border-primary/30"
                                style={{
                                    width: 200 + ring * 100,
                                    height: 200 + ring * 100,
                                }}
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.3, 0.1, 0.3],
                                }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 2,
                                    delay: ring * 0.3,
                                }}
                            />
                        ))}
                    </div>

                    <div className="relative flex flex-col items-center justify-center">
                        {/* Pulsing glow behind number */}
                        <motion.div
                            className="absolute w-64 h-64 rounded-full bg-primary/20 blur-3xl"
                            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.6, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                        />

                        {/* Main countdown container */}
                        <div className="relative z-10">
                            <AnimatePresence mode="wait">
                                {!showGo ? (
                                    <motion.div
                                        key={count}
                                        initial={{ scale: 0.3, opacity: 0, rotateX: -90 }}
                                        animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                                        exit={{ scale: 1.5, opacity: 0, rotateX: 90 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 200,
                                            damping: 15
                                        }}
                                        className="relative"
                                    >
                                        {/* Number shadow */}
                                        <span className="absolute inset-0 text-9xl font-black text-primary/30 blur-sm font-mono">
                                            {count}
                                        </span>
                                        {/* Main number */}
                                        <span className="relative text-9xl font-black text-primary font-mono drop-shadow-2xl">
                                            {count}
                                        </span>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="go"
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{
                                            scale: [0.5, 1.2, 1],
                                            opacity: 1,
                                        }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 15
                                        }}
                                        className="relative"
                                    >
                                        <span className="text-7xl font-black text-emerald-400 uppercase tracking-widest drop-shadow-2xl">
                                            Valendo!
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Bottom text */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mt-12 text-center"
                        >
                            <div className="text-xl text-white/80 font-semibold uppercase tracking-widest">
                                {!showGo ? "Preparando sorteio..." : "Boa sorte!"}
                            </div>
                            <div className="text-sm text-white/50 mt-2">
                                Sorteio Oficial 2x1000
                            </div>
                        </motion.div>

                        {/* Decorative elements */}
                        <div className="absolute -inset-20 pointer-events-none">
                            {[...Array(8)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-2 h-2 bg-primary/50 rounded-full"
                                    style={{
                                        left: `${50 + 40 * Math.cos((i / 8) * Math.PI * 2)}%`,
                                        top: `${50 + 40 * Math.sin((i / 8) * Math.PI * 2)}%`,
                                    }}
                                    animate={{
                                        scale: [1, 1.5, 1],
                                        opacity: [0.5, 1, 0.5],
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 1,
                                        delay: i * 0.1,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
