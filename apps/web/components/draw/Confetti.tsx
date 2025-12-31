"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ConfettiProps {
    className?: string;
}

const COLORS = ["#FFD700", "#FF4500", "#00FF00", "#00BFFF", "#FF1493", "#9400D3"];

export function Confetti({ className }: ConfettiProps) {
    const [particles, setParticles] = useState<any[]>([]);

    useEffect(() => {
        // Generate particles
        const newParticles = Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            x: 0,
            y: 0,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            angle: Math.random() * 360 * (Math.PI / 180),
            velocity: 10 + Math.random() * 20,
            size: 5 + Math.random() * 5,
        }));
        setParticles(newParticles);
    }, []);

    return (
        <div className={`absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible z-50 ${className}`}>
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                    animate={{
                        x: Math.cos(p.angle) * p.velocity * 20,
                        y: Math.sin(p.angle) * p.velocity * 20,
                        rotate: Math.random() * 720,
                        scale: [0, 1, 0],
                        opacity: [1, 1, 0],
                    }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    style={{
                        position: "absolute",
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                    }}
                />
            ))}
        </div>
    );
}
