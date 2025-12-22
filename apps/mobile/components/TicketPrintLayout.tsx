import React from 'react';
import { View, Text, Image } from 'react-native';
import tw from '../lib/tailwind';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Barcode } from './Barcode'; // Import custom component

interface TicketPrintLayoutProps {
    gameName: string;
    numbers: number[];
    price: string;
    date: string;
    ticketId: string;
    terminalId?: string;
    vendorId?: string;
    vendorName?: string; // New prop
    drawDate?: string;
    hash?: string;
}

// Helper para converter números em texto (simplificado para 0-99 para o layout)
const numberToText = (num: number): string => {
    const map: { [key: number]: string } = {
        0: 'zero', 1: 'um', 2: 'dois', 3: 'tres', 4: 'quat', 5: 'cinc', 6: 'seis', 7: 'sete', 8: 'oito', 9: 'nove',
        10: 'dez', 11: 'onze', 12: 'doze', 13: 'treze', 14: 'quat', 15: 'quin', 16: 'des', 17: 'des', 18: 'dezo', 19: 'deze',
        20: 'vint', 21: 'vint', 22: 'vint', 23: 'vint', 24: 'vint', 25: 'vint' // E assim por diante conforme necessidade ou abreviado como na imagem
    };
    // Na imagem parece que usam abreviações de 4 letras para alinhar: "quat", "cinc", "oito", "tres"
    // Vou usar uma lógica simples de pegar as primeiras 4 letras para manter o estilo da imagem se for maior que 4
    const fullText = map[num] || num.toString();
    return fullText.substring(0, 4);
};

export const TicketPrintLayout = ({
    gameName,
    numbers,
    price,
    date,
    ticketId,
    terminalId = "----------",
    vendorId = "567890",
    vendorName = "Vendedor", // Default
    drawDate,
    hash
}: TicketPrintLayoutProps) => {

    // Ordenar números
    const sortedNumbers = [...numbers].sort((a, b) => a - b);

    return (
        // Adjusted scaleY to 0.85 to help legibility but prevent too much stretch
        // Adjusted scaleY to 0.85. To make QR square, we need to inverse scale Y for it (~1.18).
        // User reported it's stretched VERTICALLY. So we remove the 1.18 inverse to let it be squashed (0.85) to counteract printer stretch.
        <View style={[tw`bg-white w-[384px] p-1`, { transform: [{ scaleY: 0.85 }] }]}>
            {/* Header - Logo Simulada - CLOVER ICON & WIDER */}
            <View style={tw`items-center mb-1`}>
                <View style={tw`border-[3px] border-black rounded-xl p-2 px-4 flex-row items-center justify-center`}>
                    <MaterialCommunityIcons name="clover" size={42} color="#000" style={tw`mr-3`} />
                    <View style={tw`items-center`}>
                        <Text style={[tw`text-4xl font-black text-black leading-tight`, { transform: [{ scaleX: 1.25 }] }]}>FÉZINHA</Text>
                        <View style={tw`flex-row items-center justify-end -mt-2`}>
                            <Ionicons name="calendar-sharp" size={14} color="#000" style={tw`mr-1`} />
                            <Text style={tw`text-sm font-black text-black uppercase`}>DE HOJE</Text>
                        </View>
                    </View>
                </View>
                {/* Info Sorteio */}
                <Text style={tw`text-center font-black text-black text-[12px] mt-1 uppercase`}>
                    SORTEIO {ticketId.substring(0, 4)} - {drawDate || date.split(' ')[0]} - 19H
                </Text>
            </View>

            {/* Fezinhas (Números) 2x2 Grid */}
            <View style={tw`flex-row flex-wrap justify-between mb-1 px-1`}>
                {numbers.length > 0 ? (
                    // Always show 4 slots (or fewer if fewer selected) in a grid
                    Array.from({ length: 4 }).map((_, idx) => {
                        const num = numbers[idx];
                        return (
                            <View key={idx} style={tw`w-[49%] mb-3 items-center border border-gray-200 rounded p-1`}>
                                <Text style={tw`font-bold text-[12px] text-black self-start mb-0 ml-1`}>Fezinha {idx + 1}</Text>
                                {num !== undefined ? (
                                    <View style={tw`items-center w-full`}>
                                        <Text style={tw`text-4xl text-black font-black tracking-widest`}>
                                            {num.toString().padStart(4, '0').split('').join(' ')}
                                        </Text>
                                        <View style={tw`flex-row w-full justify-between px-2`}>
                                            {num.toString().padStart(4, '0').split('').map((digit, i) => (
                                                <Text key={i} style={tw`text-[9px] text-black w-5 text-center font-bold`}>
                                                    {numberToText(parseInt(digit))}
                                                </Text>
                                            ))}
                                        </View>
                                    </View>
                                ) : (
                                    <View style={tw`h-12`} /> // Spacer
                                )}
                            </View>
                        );
                    })
                ) : null}
            </View>

            {/* Linha Tracejada + Ganhos */}
            <View style={tw`border-b-2 border-dashed border-black mb-2 mx-2`} />

            <Text style={tw`text-center font-bold text-[11px] text-black mb-1 uppercase`}>
                VOCÊ GANHA SE ACERTAR EM UMA DAS FEZINHAS:
            </Text>
            <Text style={tw`text-center font-black text-[11px] text-black mb-3 border-b-2 border-black pb-1 mx-2`}>
                MILHAR: R$ 1.000,00 • CENTENA: R$ 100,00 • DEZENA: R$ 10,00
            </Text>

            {/* Segunda Chance */}
            <View style={tw`items-center mb-2`}>
                <View style={tw`bg-black rounded-full py-1 px-10 mb-1 items-center w-full`}>
                    <Text style={tw`text-white text-center font-black text-xl uppercase`}>CHANCE EXTRA</Text>
                    <Text style={tw`text-white text-center text-[9px] font-bold uppercase`}>SORTEIO EXTRA SÁBADO - 16H15MIN</Text>
                </View>

                {/* Números Segunda Chance (Mock) */}
                <View style={tw`items-center mb-1`}>
                    <View style={tw`flex-row gap-5`}>
                        {[1, 5, 8, 6, 5, 6].map((n, i) => (
                            <Text key={i} style={tw`text-4xl font-black text-black`}>{n}</Text>
                        ))}
                    </View>
                </View>

                <Text style={tw`text-center font-bold text-[11px] text-black`}>
                    PRÊMIO EXTRA - R$ 5.000,00
                </Text>
                <Text style={tw`text-center font-bold text-[10px] text-black uppercase`}>
                    ACERTANDO TODOS OS NÚMEROS NA ORDEM
                </Text>
            </View>

            {/* Detalhes do Bilhete - NEW GROUPED LAYOUT */}
            <View style={tw`mb-2 px-1`}>
                <Text style={tw`text-center font-black text-[12px] text-black mb-1 mt-1 uppercase border-t-2 border-dashed border-black pt-1`}>
                    INFORMAÇÕES DO BILHETE
                </Text>

                {/* Row 1: Bilhete | Série | Preço */}
                <View style={tw`flex-row justify-between mb-1`}>
                    <Text style={tw`text-[12px] text-black font-bold`}>Bilhete: {ticketId.substring(0, 4)}</Text>
                    <Text style={tw`text-[12px] text-black font-bold`}>Série: 001</Text>
                    <Text style={tw`text-[12px] text-black font-bold`}>Preço: {price}</Text>
                </View>

                {/* Row 2: Terminal | Vendedor */}
                <View style={tw`flex-row justify-between mb-1`}>
                    <Text style={tw`text-[12px] text-black font-bold`}>Terminal: {terminalId}</Text>
                    <Text style={tw`text-[12px] text-black font-bold`}>Vendedor: {vendorName}</Text>
                </View>

                {/* Row 3: Data | Extração */}
                <View style={tw`flex-row justify-between mb-1`}>
                    <Text style={tw`text-[12px] text-black font-bold`}>Data: {date}</Text>
                    <Text style={tw`text-[12px] text-black font-bold`}>Ext: {drawDate || "Hoje 19H"}</Text>
                </View>
            </View>

            {/* Barcode e QR Code - MAXIMIZED */}
            <View style={tw`items-center mb-4`}>
                <View style={tw`overflow-hidden items-center justify-center mb-2`}>
                    {/* Barcode Component Custom - Fully Optimized */}
                    <View style={tw`items-center justify-center mb-1 px-0 bg-white`}>
                        <Barcode
                            value={ticketId || '000000000000'}
                            width={370}
                            height={90}
                        />
                        <Text style={tw`font-bold text-[9px] text-black tracking-[4px] mt-1`}>
                            {ticketId}
                        </Text>
                    </View>
                </View>

                {/* QR Code Centered and Large - AGGRESSIVE SQUASH to fix vertical stretch */}
                {/* ScaleY 0.70 to counteract strong printer stretch */}
                <View style={[tw`items-center justify-center w-full mt-2`, { transform: [{ scaleY: 0.70 }] }]}>
                    <View style={tw`border-[3px] border-black p-1 bg-white`}>
                        <QRCode value={`https://www.fezinhadehoje.com.br/sorteio/${ticketId}`} size={150} />
                    </View>
                    {/* Removed URL Text */}
                </View>
            </View>

        </View>
    );
};
