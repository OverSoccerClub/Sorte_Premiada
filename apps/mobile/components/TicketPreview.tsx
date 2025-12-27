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
    vendorName?: string; // New prop
    series?: number; // New prop
    secondChanceNumber?: number; // New prop
    secondChanceDrawDate?: string; // New prop
}

export function TicketPreview({ gameName, numbers, price, date = new Date().toLocaleString(), drawDate, id = "PREVIEW", isCapture = false, hash, vendorName, series, secondChanceNumber, secondChanceDrawDate }: TicketPreviewProps) {

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
                vendorName={vendorName}
                series={series}
                fixPrinterStretch={true} // Apply stretch fix for printing
                secondChanceNumber={secondChanceNumber}
                secondChanceDrawDate={secondChanceDrawDate}
            />
        );
    }

    // Modal Preview Mode
    return (
        <View style={tw`bg-gray-100 items-center justify-center p-1 rounded-xl`}>
            {/* Wrapper to simulate paper background - Scaled up for better visibility */}
            {/* Removed marginVertical: -50 and adjusted scale to 0.80 for better fit without overlap */}
            <View style={[tw`overflow-hidden bg-white shadow-lg`, { width: 384, transform: [{ scale: 0.80 }] }]}>
                <TicketPrintLayout
                    gameName={gameName}
                    numbers={numbers}
                    price={price}
                    date={date}
                    ticketId={id}
                    drawDate={drawDate}
                    hash={hash}
                    vendorName={vendorName}
                    series={series}
                    fixPrinterStretch={false} // Normal aspect ratio for screen
                    secondChanceNumber={secondChanceNumber}
                    secondChanceDrawDate={secondChanceDrawDate}
                />
            </View>
        </View>
    );
}
