"use client";

import { DrawDigit } from "./DrawDigit";

interface DrawGroupProps {
    // We now pass the exact state of each digit
    digits: (string | number)[];
    spinningIndex: number | null; // Which digit is currently spinning (if any)
}

export function DrawGroup({ digits, spinningIndex }: DrawGroupProps) {
    // Ensure we always have 4 positions
    const safeDigits = [...digits, '?', '?', '?', '?'].slice(0, 4);

    return (
        <div className="flex gap-2 p-4 bg-muted/20 rounded-xl border border-border/50 shadow-sm relative overflow-hidden">
            {safeDigits.map((digit, index) => (
                <DrawDigit
                    key={index}
                    value={digit}
                    isSpinning={spinningIndex === index}
                    delay={0} // No stagger delay needed, controlled by parent now
                />
            ))}
        </div>
    );
}
