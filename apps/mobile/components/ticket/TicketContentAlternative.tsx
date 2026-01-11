import React, { useState } from 'react';
import { View, Text, Image } from 'react-native';
import tw from '../../lib/tailwind';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Barcode } from '../Barcode';
import { TicketData } from './TicketContent';

interface TicketContentAlternativeProps {
    data: TicketData;
    isCapture?: boolean;
}

const numberToText = (num: number): string => {
    const texts = ["zero", "um", "dois", "três", "quat", "cinc", "seis", "sete", "oito", "nove"];
    return texts[num] || "";
};

export const TicketContentAlternative: React.FC<TicketContentAlternativeProps> = ({ data, isCapture = false }) => {
    const [logoError, setLogoError] = useState(false);

    // Split numbers into 4 groups of 4 (Fezinhas)
    const fezinhas: number[][] = [];
    for (let i = 0; i < data.numbers.length; i += 4) {
        fezinhas.push(data.numbers.slice(i, i + 4));
    }

    // Ensure we have exactly 4 fezinhas (pad with empty if needed)
    while (fezinhas.length < 4) {
        fezinhas.push([]);
    }

    const shouldShowLogo = data.companyLogoUrl && !logoError;
    const displayTicketId = data.hash?.substring(0, 8).toUpperCase() || data.ticketId?.substring(0, 8).toUpperCase() || 'N/A';

    // Format draw date for header
    const formatDrawNumber = () => {
        if (data.series) {
            return data.series.toString().padStart(4, '0');
        }
        return "0001";
    };

    const formatDrawDateHeader = () => {
        if (data.drawDate) {
            const date = new Date(data.drawDate);
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            const hours = date.getHours().toString().padStart(2, '0');
            return `${day}/${month}/${year} - ${hours}H`;
        }
        return "";
    };

    // Format second chance date
    const formatSecondChanceDate = () => {
        if (data.secondChanceDrawDate) {
            return data.secondChanceDrawDate;
        }
        return "XX/XX/XX - 16H15MIN";
    };

    // Split second chance number into digits
    const scDigits = data.secondChanceNumber ? data.secondChanceNumber.toString().split('').map(Number) : [];

    return (
        <View style={tw`bg-white w-[384px] p-4`}>
            {/* Header with Logo */}
            <View style={tw`items-center mb-3 border-2 border-black rounded-xl p-3`}>
                <View style={tw`flex-row items-center gap-2`}>
                    <MaterialCommunityIcons name="clover" size={32} color="#000" />
                    <View>
                        <Text style={tw`text-xl font-black text-black uppercase`}>FEZINHA</Text>
                        <Text style={tw`text-xs font-bold text-black`}>DE HOJE</Text>
                    </View>
                </View>
            </View>

            {/* Draw Info */}
            <Text style={tw`text-center font-black text-black text-[11px] mb-3`}>
                SORTEIO {formatDrawNumber()} - {formatDrawDateHeader()}
            </Text>

            {/* 4 Fezinhas in 2x2 Grid */}
            <View style={tw`mb-3`}>
                {/* Row 1 */}
                <View style={tw`flex-row justify-between mb-2`}>
                    {/* Fezinha 1 */}
                    <View style={tw`w-[48%]`}>
                        <Text style={tw`text-center font-bold text-[10px] mb-1`}>Fezinha 1</Text>
                        <View style={tw`flex-row justify-center gap-1`}>
                            {fezinhas[0]?.map((num, idx) => (
                                <Text key={idx} style={tw`text-2xl font-black text-black`}>{num}</Text>
                            ))}
                        </View>
                        <View style={tw`flex-row justify-center gap-1 mt-0.5`}>
                            {fezinhas[0]?.map((num, idx) => (
                                <Text key={idx} style={tw`text-[7px] text-black`}>{numberToText(num)}</Text>
                            ))}
                        </View>
                    </View>

                    {/* Fezinha 2 */}
                    <View style={tw`w-[48%]`}>
                        <Text style={tw`text-center font-bold text-[10px] mb-1`}>Fezinha 2</Text>
                        <View style={tw`flex-row justify-center gap-1`}>
                            {fezinhas[1]?.map((num, idx) => (
                                <Text key={idx} style={tw`text-2xl font-black text-black`}>{num}</Text>
                            ))}
                        </View>
                        <View style={tw`flex-row justify-center gap-1 mt-0.5`}>
                            {fezinhas[1]?.map((num, idx) => (
                                <Text key={idx} style={tw`text-[7px] text-black`}>{numberToText(num)}</Text>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Row 2 */}
                <View style={tw`flex-row justify-between`}>
                    {/* Fezinha 3 */}
                    <View style={tw`w-[48%]`}>
                        <Text style={tw`text-center font-bold text-[10px] mb-1`}>Fezinha 3</Text>
                        <View style={tw`flex-row justify-center gap-1`}>
                            {fezinhas[2]?.map((num, idx) => (
                                <Text key={idx} style={tw`text-2xl font-black text-black`}>{num}</Text>
                            ))}
                        </View>
                        <View style={tw`flex-row justify-center gap-1 mt-0.5`}>
                            {fezinhas[2]?.map((num, idx) => (
                                <Text key={idx} style={tw`text-[7px] text-black`}>{numberToText(num)}</Text>
                            ))}
                        </View>
                    </View>

                    {/* Fezinha 4 */}
                    <View style={tw`w-[48%]`}>
                        <Text style={tw`text-center font-bold text-[10px] mb-1`}>Fezinha 4</Text>
                        <View style={tw`flex-row justify-center gap-1`}>
                            {fezinhas[3]?.map((num, idx) => (
                                <Text key={idx} style={tw`text-2xl font-black text-black`}>{num}</Text>
                            ))}
                        </View>
                        <View style={tw`flex-row justify-center gap-1 mt-0.5`}>
                            {fezinhas[3]?.map((num, idx) => (
                                <Text key={idx} style={tw`text-[7px] text-black`}>{numberToText(num)}</Text>
                            ))}
                        </View>
                    </View>
                </View>
            </View>

            {/* Prize Message Box */}
            <View style={tw`border-2 border-black rounded-lg p-2 mb-3`}>
                <Text style={tw`text-center font-bold text-[9px] text-black mb-1`}>
                    {data.promptMessage || "VOCÊ GANHA SE ACERTAR EM UMA DAS FEZINHAS:"}
                </Text>
                {data.prizes && (
                    <Text style={tw`text-center font-bold text-[9px] text-black`}>
                        QUADRA - {data.prizes.milhar || 'R$ 1.000,00'}  TRINCA: {data.prizes.centena || 'R$ 60,00'} - DUQUE: {data.prizes.dezena || 'R$ 6,00'}
                    </Text>
                )}
            </View>

            {/* Second Chance Section */}
            {data.secondChanceNumber && (
                <View style={tw`mb-3`}>
                    {/* Black Header */}
                    <View style={tw`bg-black rounded-t-xl py-2 px-3`}>
                        <Text style={tw`text-white text-center font-black text-sm uppercase`}>
                            {data.secondChanceLabel || 'FEZINHA EXTRA'}
                        </Text>
                        <Text style={tw`text-white text-center text-[8px] font-bold mt-0.5`}>
                            SORTEIO EXTRA SÁBADO, DIA {formatSecondChanceDate()}
                        </Text>
                    </View>

                    {/* Numbers */}
                    <View style={tw`border-2 border-t-0 border-black rounded-b-xl p-2`}>
                        <View style={tw`flex-row justify-center gap-2 mb-1`}>
                            {scDigits.map((digit, idx) => (
                                <Text key={idx} style={tw`text-3xl font-black text-black`}>{digit}</Text>
                            ))}
                        </View>
                        <View style={tw`flex-row justify-center gap-2 mb-2`}>
                            {scDigits.map((digit, idx) => (
                                <Text key={idx} style={tw`text-[7px] text-black`}>{numberToText(digit)}</Text>
                            ))}
                        </View>

                        {/* Prize Info */}
                        <Text style={tw`text-center font-bold text-[9px] text-black mb-1`}>
                            PRÊMIO DA FEZINHA EXTRA - R$ 5.000,00
                        </Text>
                        <Text style={tw`text-center font-bold text-[8px] text-black`}>
                            {data.mainMatchMessage || "ACERTANDO TODOS OS NÚMEROS NA ORDEM"}
                        </Text>
                    </View>
                </View>
            )}

            {/* Footer Information */}
            <View style={tw`border-t-2 border-dashed border-black pt-2`}>
                <Text style={tw`text-[9px] text-black font-bold mb-0.5`}>
                    Bilhete Número: {data.ticketNumber?.toString().padStart(4, '0') || '----'} - Série: {data.series?.toString().padStart(3, '0') || '---'}
                </Text>
                <Text style={tw`text-[9px] text-black font-bold mb-0.5`}>
                    Preço da Aposta: {data.price}
                </Text>
                <Text style={tw`text-[9px] text-black font-bold mb-0.5`}>
                    Terminal número: {data.terminalId || '--------'} - Vendedor: {data.vendorName || '------'}
                </Text>
                <Text style={tw`text-[9px] text-black font-bold mb-2`}>
                    Data da aposta: {data.date}
                </Text>

                {/* Barcode */}
                {data.hash && (
                    <View style={tw`items-center mb-2`}>
                        <Barcode value={data.hash} width={1.5} height={40} />
                        <Text style={tw`text-[7px] text-black mt-1`}>{data.hash}</Text>
                    </View>
                )}

                {/* QR Code and Download Message */}
                <View style={tw`flex-row items-center justify-center gap-3 mt-2`}>
                    <View style={tw`items-center`}>
                        <Text style={tw`text-[8px] text-black font-bold text-center mb-1`}>
                            Baixe o App{'\n'}para conferir a{'\n'}sua aposta
                        </Text>
                        <Text style={tw`text-[7px] text-black font-bold`}>
                            www.fezinhadehoje.com.br
                        </Text>
                    </View>
                    {data.hash && (
                        <View style={tw`border-2 border-black p-1`}>
                            <QRCode value={data.hash} size={60} />
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};
