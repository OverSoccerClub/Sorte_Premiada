"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ConfettiProps {
    className?: string;
}

// Premium gold/celebration color palette
const COLORS = [
    "#FFD700", // Gold
    "#FFC107", // Amber
    "#FF9800", // Orange
    "#4CAF50", // Green
    "#00BCD4", // Cyan
    "#E91E63", // Pink
    "#9C27B0", // Purple
    "#FFFFFF", // White sparkles
];

interface Particle {
    id: number;
    x: number;
    y: number;
    color: string;
    angle: number;
    velocity: number;
    size: number;
    type: 'circle' | 'square' | 'star';
    rotation: number;
}

export function Confetti({ className }: ConfettiProps) {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        // Generate more particles for premium effect
        const newParticles: Particle[] = Array.from({ length: 80 }).map((_, i) => ({
            id: i,
            x: 0,
            y: 0,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            angle: Math.random() * 360 * (Math.PI / 180),
            velocity: 8 + Math.random() * 25,
            size: 4 + Math.random() * 8,
            type: ['circle', 'square', 'star'][Math.floor(Math.random() * 3)] as 'circle' | 'square' | 'star',
            rotation: Math.random() * 720,
        }));
        setParticles(newParticles);
    }, []);

    return (
        <div className={`absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible z-50 ${className}`}>
            {/* Central burst flash */}
            <motion.div
                className="absolute w-40 h-40 bg-yellow-400/50 rounded-full blur-3xl"
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            />

            {/* Confetti particles */}
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
                    animate={{
                        x: Math.cos(p.angle) * p.velocity * 15,
                        y: Math.sin(p.angle) * p.velocity * 15 + 50, // Add gravity effect
                        rotate: p.rotation,
                        scale: [0, 1.2, 1, 0.5],
                        opacity: [1, 1, 0.8, 0],
                    }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    style={{
                        position: "absolute",
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.type !== 'star' ? p.color : 'transparent',
                        borderRadius: p.type === 'circle' ? '50%' : p.type === 'square' ? '2px' : '0',
                        boxShadow: `0 0 ${p.size}px ${p.color}40`,
                    }}
                >
                    {p.type === 'star' && (
                        <svg viewBox="0 0 24 24" fill={p.color} className="w-full h-full">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                    )}
                </motion.div>
            ))}

            {/* Extra sparkle layer */}
            {[...Array(12)].map((_, i) => (
                <motion.div
                    key={`sparkle-${i}`}
                    className="absolute w-1 h-1 bg-white rounded-full"
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{
                        x: (Math.random() - 0.5) * 300,
                        y: (Math.random() - 0.5) * 200,
                        scale: [0, 2, 0],
                        opacity: [0, 1, 0],
                    }}
                    transition={{
                        duration: 1.5,
                        delay: Math.random() * 0.5,
                        ease: "easeOut",
                    }}
                    style={{
                        boxShadow: '0 0 10px 2px white',
                    }}
                />
            ))}
        </div>
    );
}
