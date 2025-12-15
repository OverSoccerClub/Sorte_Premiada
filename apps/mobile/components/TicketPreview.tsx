import React from "react";
import { View, Text, Image } from "react-native";
import tw from "../lib/tailwind";
import { Ionicons } from "@expo/vector-icons";

import QRCode from 'react-native-qrcode-svg';

interface TicketPreviewProps {
    gameName: string;
    numbers: number[];
    price: string;
    date?: string;
    drawDate?: string;
    id?: string;
    isCapture?: boolean;
}

export function TicketPreview({ gameName, numbers, price, date = new Date().toLocaleString(), drawDate, id = "TEST-ID", isCapture = false }: TicketPreviewProps) {
    // CALCULATION FOR 58mm PRINTER (Approx 48mm printable area)
    // Width: 384px (Exact printable width for standard 58mm thermal printers)
    // Aspect Ratio: Thermal printers typically stretch vertically by ~25%.
    // Correction: scaleY = 1 / 1.25 = 0.8
    const containerStyle = isCapture ? {
        transform: [
            { scaleX: 1.0 }, // Exact fit for 384px width
            { scaleY: 0.8 }  // Squash height by 20% to counter printer stretch
        ],
        width: '100%' as any,
        padding: 0, // Maximize content area
        marginVertical: 0
    } : { padding: 8 }; // Default p-2 is 8px

    return (
        <View style={[tw`bg-white w-full overflow-hidden`, containerStyle]}>
            {/* Header */}
            <View style={tw`items-center border-b-[1px] border-dashed border-black pb-2 mb-2`}>
                <Ionicons name="ticket-outline" size={isCapture ? 32 : 28} color="#000" style={tw`mb-1`} />
                <Text style={[tw`${isCapture ? 'text-3xl' : 'text-xl'} text-black uppercase tracking-widest`, { fontFamily: 'Roboto_900Black' }]}>SORTE PREMIADA</Text>
                <Text style={[tw`${isCapture ? 'text-xs' : 'text-[10px]'} text-black uppercase tracking-widest`, { fontFamily: 'Roboto_700Bold' }]}>Comprovante de Aposta</Text>
            </View>

            {/* Game Info */}
            <View style={tw`mb-2`}>
                <Text style={[tw`${isCapture ? 'text-2xl' : 'text-lg'} text-black uppercase text-center mb-1`, { fontFamily: 'Roboto_700Bold' }]}>{gameName}</Text>
                {drawDate && (
                    <Text style={[tw`${isCapture ? 'text-sm' : 'text-xs'} text-black text-center mb-1 uppercase`, { fontFamily: 'Roboto_700Bold' }]}>
                        Sorteio: {drawDate}
                    </Text>
                )}
                <Text style={[tw`${isCapture ? 'text-xs' : 'text-[10px]'} text-black text-center mb-2`, { fontFamily: 'RobotoMono_700Bold' }]}>Gerado em: {date}</Text>

                <View style={tw`p-2 rounded-lg border border-black`}>
                    <View style={tw`flex-row flex-wrap justify-center items-center gap-2`}>
                        {numbers.sort((a, b) => a - b).map((num) => (
                            <Text key={num} style={[tw`${gameName === "2x500" ? (isCapture ? "text-3xl" : "text-xl") : (isCapture ? "text-4xl" : "text-3xl")} text-black tracking-widest`, { fontFamily: 'RobotoMono_700Bold' }]}>
                                {num.toString().padStart(gameName === "2x500" ? 4 : 2, "0")}
                            </Text>
                        ))}
                    </View>
                </View>
            </View>

            {/* Price */}
            <View style={tw`flex-row justify-between items-center border-t-[1px] border-dashed border-black pt-2 mb-2`}>
                <Text style={[tw`${isCapture ? 'text-sm' : 'text-[10px]'} text-black uppercase`, { fontFamily: 'Roboto_700Bold' }]}>Total a Pagar</Text>
                <Text style={[tw`${isCapture ? 'text-xl' : 'text-sm'} text-black`, { fontFamily: 'RobotoMono_700Bold' }]}>{price}</Text>
            </View>

            {/* QR Code */}
            <View style={tw`items-center mb-2 mt-1`}>
                <View style={[tw`bg-white p-1 rounded-lg`, isCapture && { transform: [{ scaleX: 1.5 }] }]}>
                    <QRCode
                        value={id}
                        size={isCapture ? 120 : 100}
                    />
                </View>
                <Text style={[tw`${isCapture ? 'text-[10px]' : 'text-[8px]'} text-black mt-1`, { fontFamily: 'RobotoMono_700Bold' }]}>
                    {id}
                </Text>
            </View>

            {/* Footer */}
            <View style={tw`items-center`}>
                <Text style={[tw`${isCapture ? 'text-[10px]' : 'text-[8px]'} text-black text-center`, { fontFamily: 'RobotoMono_700Bold' }]}>
                    Este bilhete não possui valor fiscal.
                    {"\n"}Boa Sorte!
                </Text>
            </View>
        </View>
    );
}
