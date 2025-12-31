"use client";

import { DrawDigit } from "./DrawDigit";

interface DrawGroupProps {
    value: number; // 0 to 9999
    isSpinning: boolean;
}

export function DrawGroup({ value, isSpinning }: DrawGroupProps) {
    // Pad with zeros to ensure 4 digits
    const strValue = value.toString().padStart(4, "0");
    const digits = strValue.split("").map(Number); // [1, 2, 3, 4]

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
