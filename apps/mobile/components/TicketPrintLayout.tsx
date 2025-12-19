import React from 'react';
import { View, Text, Image } from 'react-native';
import tw from '../lib/tailwind';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import Barcode from 'react-native-barcode-svg';

interface TicketPrintLayoutProps {
    gameName: string;
    numbers: number[];
    price: string;
    date: string;
    ticketId: string;
    terminalId?: string;
    vendorId?: string;
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
    drawDate,
    hash
}: TicketPrintLayoutProps) => {

    // Ordenar números
    const sortedNumbers = [...numbers].sort((a, b) => a - b);

    return (
        <View style={[tw`bg-white w-[384px] p-2`, { transform: [{ scaleY: 0.8 }] }]}>
            {/* Header - Logo Simulada */}
            <View style={tw`items-center mb-2`}>
                <View style={tw`border-2 border-gray-800 rounded-xl p-2 px-6 flex-row items-center justify-center`}>
                    <Ionicons name="leaf-outline" size={36} color="#333" style={tw`mr-2`} />
                    <View>
                        <Text style={[tw`text-3xl font-bold text-gray-800`, { fontFamily: 'serif' }]}>FEZINHA</Text>
                        <View style={tw`flex-row items-center justify-end -mt-1`}>
                            <Ionicons name="calendar" size={12} color="#333" style={tw`mr-1`} />
                            <Text style={tw`text-xs font-bold text-gray-800 uppercase`}>De Hoje</Text>
                        </View>
                    </View>
                </View>
                {/* Info Sorteio */}
                <Text style={tw`text-center font-bold text-black text-[10px] mt-1 uppercase`}>
                    SORTEIO {ticketId.substring(0, 4)} - {drawDate || date.split(' ')[0]} - 19H
                </Text>
            </View>

            {/* Fezinhas (Números) 2x2 Grid */}
            <View style={tw`flex-row flex-wrap justify-between mb-2 px-2`}>
                {numbers.length > 0 ? (
                    // Always show 4 slots (or fewer if fewer selected) in a grid
                    Array.from({ length: 4 }).map((_, idx) => {
                        const num = numbers[idx];
                        return (
                            <View key={idx} style={tw`w-[48%] mb-4 items-center`}>
                                <Text style={tw`font-bold text-[10px] text-black self-start mb-1 ml-2`}>Fezinha {idx + 1}</Text>
                                {num !== undefined ? (
                                    <View style={tw`items-center`}>
                                        <Text style={[tw`text-4xl text-black tracking-widest`, { fontFamily: 'serif' }]}>
                                            {num.toString().padStart(4, '0').split('').join(' ')}
                                        </Text>
                                        <View style={tw`flex-row w-full justify-between px-1`}>
                                            {num.toString().padStart(4, '0').split('').map((digit, i) => (
                                                <Text key={i} style={tw`text-[8px] text-black w-4 text-center`}>
                                                    {numberToText(parseInt(digit))}
                                                </Text>
                                            ))}
                                        </View>
                                    </View>
                                ) : (
                                    <View style={tw`h-10`} /> // Spacer for empty slots if any
                                )}
                            </View>
                        );
                    })
                ) : null}
            </View>

            {/* Linha Tracejada + Ganhos */}
            <View style={tw`border-b border-dashed border-gray-400 mb-2 mx-4`} />

            <Text style={tw`text-center font-bold text-[9px] text-black mb-1 uppercase`}>
                VOCÊ GANHA SE ACERTAR EM UMA DAS FEZINHAS:
            </Text>
            <Text style={tw`text-center font-bold text-[10px] text-black mb-3 border-b border-black pb-1`}>
                MILHAR - R$ 1.000,00  CENTENA: R$ 100,00 - DEZENA: R$ 10
            </Text>

            {/* Segunda Chance */}
            <View style={tw`items-center mb-4`}>
                <View style={tw`bg-black rounded-full py-1 px-8 mb-1 items-center w-full`}>
                    <Text style={tw`text-white text-center font-bold text-lg uppercase`}>SEGUNDA CHANCE</Text>
                    <Text style={tw`text-white text-center text-[8px] uppercase`}>SORTEIO EXTRA SÁBADO, DIA XX/XX/XX - 16H15MIN</Text>
                </View>

                {/* Números Segunda Chance (Mock) */}
                <View style={tw`items-center mb-1`}>
                    <View style={tw`flex-row gap-4`}>
                        {[1, 5, 8, 6, 5, 6].map((n, i) => (
                            <Text key={i} style={[tw`text-3xl font-bold text-black`, { fontFamily: 'serif' }]}>{n}</Text>
                        ))}
                    </View>
                    <View style={tw`flex-row gap-4`}>
                        {[1, 5, 8, 6, 5, 6].map((n, i) => (
                            <Text key={i} style={tw`text-[8px] text-black w-4 text-center`}>{numberToText(n)}</Text>
                        ))}
                    </View>
                </View>

                <Text style={tw`text-center font-bold text-[10px] text-black`}>
                    PRÊMIO EXTRA DA SEGUNDA CHANCE - R$ 5.000,00
                </Text>
                <Text style={tw`text-center font-bold text-[10px] text-black uppercase`}>
                    ACERTANDO TODOS OS NÚMEROS NA ORDEM
                </Text>
            </View>

            {/* Detalhes do Bilhete */}
            <View style={tw`mb-2 px-4`}>
                <Text style={tw`text-[10px] text-black font-bold`}>Bilhete Número: {ticketId.substring(0, 4)} - Série: 001</Text>
                <Text style={tw`text-[10px] text-black font-bold`}>Preço da Aposta: {price}</Text>
                <Text style={tw`text-[10px] text-black font-bold`}>Terminal número: {terminalId}   Vendedor: {vendorId}</Text>
                <Text style={tw`text-[10px] text-black font-bold`}>Data da aposta: {date}</Text>
            </View>

            {/* Barcode e QR Code */}
            <View style={tw`items-center mb-2`}>
                <View style={tw`overflow-hidden items-center justify-center mb-1`}>
                    {ticketId ? (
                        <Barcode
                            value={hash || '000000000000'}
                            format="CODE128"
                            text={hash || ticketId.substring(0, 8)}
                            height={50}
                            maxWidth={300} // Wider barcode
                        />
                    ) : null}
                </View>

                <View style={tw`flex-row items-end justify-between w-full px-4 mt-2`}>
                    <View style={tw`flex-1`}>
                        <Text style={tw`text-center text-[10px] font-bold text-black leading-3`}>
                            Baixe o App{'\n'}para{'\n'}conferir a{'\n'}sua aposta
                        </Text>
                        <Text style={tw`text-center font-bold text-[10px] text-black mt-2`}>
                            www.fezinhadehoje.com.br
                        </Text>
                    </View>
                    <View>
                        <QRCode value={`https://www.fezinhadehoje.com.br/sorteio/${ticketId}`} size={70} />
                    </View>
                </View>
            </View>

        </View>
    );
};
