import React from "react";
import { View, ScrollView } from "react-native";
import tw from "../lib/tailwind";
import { TicketPrintLayout } from "./TicketPrintLayout";

interface TicketPreviewProps {
    gameName: string;
    numbers: number[];
    price: string;
    date?: string;
    drawDate?: string;
    id?: string;
    isCapture?: boolean;
    hash?: string;
}

export function TicketPreview({ gameName, numbers, price, date = new Date().toLocaleString(), drawDate, id = "PREVIEW", isCapture = false, hash }: TicketPreviewProps) {

    // If capturing (generating image for printing), we render it "raw" for ViewShot.
    // If previewing (modal), we scale it down to fit the screen nicely.

    if (isCapture) {
        return (
            <TicketPrintLayout
                gameName={gameName}
                numbers={numbers}
                price={price}
                date={date}
                ticketId={id}
                drawDate={drawDate}
                hash={hash}
            />
        );
    }

    // Modal Preview Mode
    return (
        <View style={tw`bg-gray-100 items-center justify-center p-2 rounded-xl`}>
            {/* Wrapper to simulate paper background - Scaled down to 0.6 to fit small screens */}
            <View style={[tw`overflow-hidden bg-white shadow-lg`, { width: 384, transform: [{ scale: 0.6 }], marginVertical: -120 }]}>
                <TicketPrintLayout
                    gameName={gameName}
                    numbers={numbers}
                    price={price}
                    date={date}
                    ticketId={id}
                    drawDate={drawDate}
                    hash={hash}
                />
            </View>
        </View>
    );
}
