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
}

export function TicketPreview({ gameName, numbers, price, date = new Date().toLocaleString(), drawDate, id = "TEST-ID" }: TicketPreviewProps) {
    return (
        <View style={tw`bg-white p-4 w-full overflow-hidden`}>
            {/* Header */}
            <View style={tw`items-center border-b-2 border-dashed border-black pb-3 mb-3`}>
                <Ionicons name="ticket-outline" size={28} color="#000" style={tw`mb-1`} />
                <Text style={[tw`text-xl text-black uppercase tracking-widest`, { fontFamily: 'Roboto_900Black' }]}>SORTE PREMIADA</Text>
                <Text style={[tw`text-[10px] text-black uppercase tracking-widest`, { fontFamily: 'Roboto_700Bold' }]}>Comprovante de Aposta</Text>
            </View>

            {/* Game Info */}
            <View style={tw`mb-4`}>
                <Text style={[tw`text-lg text-black uppercase text-center mb-1`, { fontFamily: 'Roboto_700Bold' }]}>{gameName}</Text>
                {drawDate && (
                    <Text style={[tw`text-xs text-black text-center mb-1 uppercase`, { fontFamily: 'Roboto_700Bold' }]}>
                        Sorteio: {drawDate}
                    </Text>
                )}
                <Text style={[tw`text-[10px] text-black text-center mb-3`, { fontFamily: 'RobotoMono_700Bold' }]}>Gerado em: {date}</Text>

                <View style={tw`p-3 rounded-lg border-2 border-black`}>
                    <View style={tw`flex-row flex-wrap justify-center items-center gap-2`}>
                        {numbers.sort((a, b) => a - b).map((num) => (
                            <Text key={num} style={[tw`${gameName === "2x500" ? "text-base" : "text-lg"} text-black tracking-widest`, { fontFamily: 'RobotoMono_700Bold' }]}>
                                {num.toString().padStart(gameName === "2x500" ? 4 : 2, "0")}
                            </Text>
                        ))}
                    </View>
                </View>
            </View>

            {/* Price */}
            <View style={tw`flex-row justify-between items-center border-t-2 border-dashed border-black pt-3 mb-4`}>
                <Text style={[tw`text-black uppercase text-xs`, { fontFamily: 'Roboto_700Bold' }]}>Total a Pagar</Text>
                <Text style={[tw`text-xl text-black`, { fontFamily: 'RobotoMono_700Bold' }]}>{price}</Text>
            </View>

            {/* QR Code */}
            <View style={tw`items-center mb-3`}>
                <QRCode
                    value={id}
                    size={100}
                />
                <Text style={[tw`text-[9px] text-black mt-2`, { fontFamily: 'RobotoMono_700Bold' }]}>
                    {id}
                </Text>
            </View>

            {/* Footer */}
            <View style={tw`items-center`}>
                <Text style={[tw`text-[9px] text-black text-center`, { fontFamily: 'RobotoMono_700Bold' }]}>
                    Este bilhete não possui valor fiscal.
                    {"\n"}Boa Sorte!
                </Text>
            </View>
        </View>
    );
}
