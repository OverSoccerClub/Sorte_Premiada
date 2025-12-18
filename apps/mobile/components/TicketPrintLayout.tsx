import React from 'react';
import { View, Text, Image } from 'react-native';
import tw from '../lib/tailwind';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

interface TicketPrintLayoutProps {
    gameName: string;
    numbers: number[];
    price: string;
    date: string;
    ticketId: string;
    terminalId?: string;
    vendorId?: string;
    drawDate?: string;
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
    drawDate
}: TicketPrintLayoutProps) => {

    // Ordenar números
    const sortedNumbers = [...numbers].sort((a, b) => a - b);

    return (
        <View style={[tw`bg-white w-[384px] p-2`, { transform: [{ scaleY: 0.8 }] }]}>
            {/* Header - Logo Simulada */}
            <View style={tw`items-center mb-2 border-2 border-black rounded-lg p-2`}>
                <View style={tw`flex-row items-center`}>
                    <Ionicons name="leaf-outline" size={32} color="black" />
                    <View style={tw`ml-2`}>
                        <Text style={[tw`text-3xl font-bold text-black`, { fontFamily: 'serif' }]}>FEZINHA</Text>
                        <Text style={[tw`text-sm text-right text-black -mt-1`]}>DE HOJE</Text>
                    </View>
                </View>
                <View style={tw`mt-1`}>
                    <Ionicons name="calendar-outline" size={16} color="black" />
                </View>
            </View>

            {/* Info Sorteio */}
            <Text style={[tw`text-center font-bold text-black text-xs mb-4`]}>
                SORTEIO {ticketId.substring(0, 4)} - {drawDate || date.split(' ')[0]} - 19H
            </Text>

            {/* Fezinhas (Números) */}
            <View style={tw`flex-row flex-wrap justify-between mb-2`}>
                {/* Simulando "Fezinha 1" com os números reais da aposta */}
                <View style={tw`w-full mb-4`}>
                    <Text style={tw`font-bold text-xs mb-1`}>Fezinha 1</Text>
                    <View style={tw`flex-row justify-between`}>
                        {sortedNumbers.map((num, idx) => (
                            <View key={idx} style={tw`items-center`}>
                                <Text style={[tw`text-4xl text-black`, { fontFamily: 'serif' }]}>{num}</Text>
                                <Text style={tw`text-[10px] text-black`}>{numberToText(num)}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* Linha Tracejada */}
            <Text style={tw`text-center text-black mb-2`} numberOfLines={1}>
                - - - - - - - - - - - - - - - - - - - - - - - - -
            </Text>

            {/* Info Ganhos */}
            <Text style={tw`text-center font-bold text-[10px] text-black mb-1 uppercase`}>
                VOCÊ GANHA SE ACERTAR EM UMA DAS FEZINHAS:
            </Text>
            <Text style={tw`text-center font-bold text-[10px] text-black mb-2`}>
                MILHAR - R$ 1.000,00  CENTENA: R$ 100,00 - DEZENA: R$ 10
            </Text>

            {/* Segunda Chance (Simulada para visual) */}
            <View style={tw`bg-black rounded-full py-1 px-4 mb-2`}>
                <Text style={tw`text-white text-center font-bold text-lg`}>SEGUNDA CHANCE</Text>
                <Text style={tw`text-white text-center text-[8px]`}>SORTEIO EXTRA SÁBADO, DIA XX/XX/XX - 16H15MIN</Text>
            </View>

            {/* Números Segunda Chance (Mock) */}
            <View style={tw`flex-row justify-center gap-4 mb-2`}>
                {[1, 5, 8, 6, 5, 6].map((n, i) => (
                    <View key={i} style={tw`items-center`}>
                        <Text style={[tw`text-3xl font-bold text-black`, { fontFamily: 'serif' }]}>{n}</Text>
                        <Text style={tw`text-[8px] text-black`}>{numberToText(n)}</Text>
                    </View>
                ))}
            </View>

            <Text style={tw`text-center font-bold text-[10px] text-black mb-1`}>
                PRÊMIO EXTRA DA SEGUNDA CHANCE - R$ 5.000,00
            </Text>
            <Text style={tw`text-center font-bold text-[10px] text-black mb-4`}>
                ACERTANDO TODOS OS NÚMEROS NA ORDEM
            </Text>

            {/* Detalhes do Bilhete */}
            <View style={tw`mb-4`}>
                <Text style={tw`text-xs text-black`}>Bilhete Número: {ticketId.substring(0, 4)} - Série: 001</Text>
                <Text style={tw`text-xs text-black`}>Preço da Aposta: {price}</Text>
                <Text style={tw`text-xs text-black`}>Terminal número: {terminalId}   Vendedor: {vendorId}</Text>
                <Text style={tw`text-xs text-black`}>Data da aposta: {date}</Text>
            </View>

            {/* Código de Barras (Visual) */}
            <View style={tw`items-center mb-2`}>
                <View style={tw`h-12 w-64 flex-row justify-between overflow-hidden bg-black`}>
                    {/* Simulação grosseira de barras brancas sobre fundo preto */}
                    {Array.from({ length: 40 }).map((_, i) => (
                        <View key={i} style={[tw`bg-white h-full`, { width: Math.random() * 4 + 1, marginLeft: Math.random() * 4 }]} />
                    ))}
                </View>
                <Text style={tw`text-[8px] text-black mt-1`}>{ticketId.replace(/-/g, '')}</Text>
            </View>

            {/* QR Code e Footer */}
            <View style={tw`flex-row items-center justify-between mt-2`}>
                <View style={tw`w-1/2`}>
                    <Text style={tw`text-right text-sm font-bold text-black pr-4`}>
                        Baixe o App{'\n'}para{'\n'}conferir a{'\n'}sua aposta
                    </Text>
                </View>
                <View style={tw`w-1/2 items-start pl-4`}>
                    <QRCode value={ticketId} size={80} />
                </View>
            </View>

            <Text style={tw`text-center font-bold text-sm text-black mt-4`}>
                www.fezinhadehoje.com.br
            </Text>

        </View>
    );
};
