"use client";

import { DrawDigit } from "./DrawDigit";

interface DrawGroupProps {
    value: number | null; // null triggers ???
    isSpinning: boolean;
}

export function DrawGroup({ value, isSpinning }: DrawGroupProps) {
    // If null, we use placeholders '?'
    const digits = value === null
        ? ['?', '?', '?', '?']
        : value.toString().padStart(4, "0").split("").map(Number);

    return (
        <div className="flex gap-2 p-4 bg-muted/20 rounded-xl border border-border/50 shadow-sm">
            {digits.map((digit, index) => (
                <DrawDigit
                    key={index}
                    value={digit}
                    isSpinning={isSpinning}
                    delay={index} // Stagger by index
                />
            ))}
        </div>
    );
}
