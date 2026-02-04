import React from "react";
import { View, Text } from "react-native";
import tw from "../lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { formatBrazilDate, getBrazilNowDate } from "../lib/date-utils";

interface SangriaReceiptProps {
    amount: string;
    cambistaName: string;
    cobradorName: string;
    date?: string;
    id?: string;
    copyName: string; // "Via do Cambista" or "Via do Cobrador"
    signerLabel: string; // "Cobrador" or "Cambista"
    isCapture?: boolean;
    companyName?: string;
}

export function SangriaReceipt({
    amount,
    cambistaName,
    cobradorName,
    date = formatBrazilDate(/* @ts-ignore */ getBrazilNowDate(), { dateStyle: 'short', timeStyle: 'medium' }),
    id = "TEST-ID",
    copyName,
    signerLabel,
    isCapture = false,
    companyName = "Sorte Premiada"
}: SangriaReceiptProps) {
    // Sames styling logic as TicketPreview
    const containerStyle = isCapture ? {
        transform: [
            { scaleX: 1.0 },
            { scaleY: 0.8 }
        ],
        width: '100%' as any,
        padding: 0,
        marginVertical: 0
    } : { padding: 8 };

    return (
        <View style={[tw`bg-white w-full overflow-hidden`, containerStyle]}>
            {/* Header */}
            <View style={tw`items-center border-b-[1px] border-dashed border-black pb-2 mb-2`}>
                <Ionicons name="wallet-outline" size={isCapture ? 32 : 28} color="#000" style={tw`mb-1`} />
                <Text style={[tw`${isCapture ? 'text-3xl' : 'text-xl'} text-black uppercase tracking-widest text-center`, { fontFamily: 'Roboto_900Black' }]}>{companyName}</Text>
                <Text style={[tw`${isCapture ? 'text-xs' : 'text-[10px]'} text-black uppercase tracking-widest text-center`, { fontFamily: 'Roboto_700Bold' }]}>Sangria / Recolhimento</Text>
            </View>

            {/* Info */}
            <View style={tw`mb-2`}>
                <Text style={[tw`${isCapture ? 'text-xs' : 'text-[10px]'} text-black text-center mb-2`, { fontFamily: 'RobotoMono_700Bold' }]}>{date}</Text>

                <View style={tw`border-b-[1px] border-dashed border-black pb-2 mb-2`}>
                    <View style={tw`flex-row justify-between mb-1`}>
                        <Text style={[tw`${isCapture ? 'text-sm' : 'text-[10px]'} text-black font-bold`, { fontFamily: 'Roboto_700Bold' }]}>CAMBISTA:</Text>
                        <Text style={[tw`${isCapture ? 'text-sm' : 'text-[10px]'} text-black`, { fontFamily: 'RobotoMono_700Bold' }]}>{cambistaName}</Text>
                    </View>
                    <View style={tw`flex-row justify-between`}>
                        <Text style={[tw`${isCapture ? 'text-sm' : 'text-[10px]'} text-black font-bold`, { fontFamily: 'Roboto_700Bold' }]}>COBRADOR:</Text>
                        <Text style={[tw`${isCapture ? 'text-sm' : 'text-[10px]'} text-black`, { fontFamily: 'RobotoMono_700Bold' }]}>{cobradorName}</Text>
                    </View>
                </View>

                <View style={tw`items-center py-2 border-b-[1px] border-dashed border-black mb-2`}>
                    <Text style={[tw`${isCapture ? 'text-sm' : 'text-[10px]'} text-black uppercase mb-1`, { fontFamily: 'Roboto_700Bold' }]}>Valor Recolhido</Text>
                    <Text style={[tw`${isCapture ? 'text-4xl' : 'text-3xl'} text-black tracking-widest`, { fontFamily: 'RobotoMono_700Bold' }]}>{amount}</Text>
                </View>

                {/* Copy Info */}
                <Text style={[tw`${isCapture ? 'text-xl' : 'text-lg'} text-black uppercase text-center font-bold mb-4`, { fontFamily: 'Roboto_900Black' }]}>
                    {copyName}
                </Text>

                {/* Signature */}
                <View style={tw`mt-4 items-center`}>
                    <View style={tw`w-4/5 h-[1px] bg-black mb-1`} />
                    <Text style={[tw`${isCapture ? 'text-sm' : 'text-[10px]'} text-black uppercase`, { fontFamily: 'RobotoMono_700Bold' }]}>
                        Assinatura {signerLabel}
                    </Text>
                </View>
            </View>

            {/* Footer */}
            <View style={tw`items-center mt-2`}>
                <Text style={[tw`${isCapture ? 'text-[10px]' : 'text-[8px]'} text-black text-center`, { fontFamily: 'RobotoMono_700Bold' }]}>
                    ID: {id}
                </Text>
            </View>
        </View>
    );
}
