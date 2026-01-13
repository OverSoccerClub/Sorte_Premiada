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

    // data.numbers contains the 4 thousands as numbers (e.g., [32, 7863, 8838, 9788])
    // We need to convert each to a 4-digit string and then to array of digits
    const fezinhasData: number[][] = data.numbers.map(num => {
        const str = num.toString().padStart(4, '0');
        return str.split('').map(d => parseInt(d, 10));
    });

    // Sort fezinhas by their integer value (ascending)
    fezinhasData.sort((a, b) => {
        const valA = parseInt(a.join(''), 10);
        const valB = parseInt(b.join(''), 10);
        return valA - valB;
    });

    // Ensure we have exactly 4 fezinhas (pad with empty if needed)
    const fezinhas = fezinhasData;
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
        if (!data.drawDate) return "";

        try {
            // Handle both string and Date object
            const date = typeof data.drawDate === 'string' ? new Date(data.drawDate) : data.drawDate;

            // Check if date is valid
            if (isNaN(date.getTime())) {
                return "";
            }

            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            const hours = date.getHours().toString().padStart(2, '0');
            return `${day}/${month}/${year} - ${hours}H`;
        } catch (error) {
            console.error('Error formatting draw date:', error);
            return "";
        }
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
            {/* Header Image */}
            <View style={tw`items-center mb-2`}>
                <Image
                    source={require('../../assets/fezinha_header.png')}
                    style={{ width: 370, height: 85, resizeMode: 'contain' }}
                />
            </View>

            {/* Draw Info */}
            <Text style={tw`text-center font-black text-black text-[10px] mb-1 leading-tight`}>
                SORTEIO {formatDrawNumber()} - {formatDrawDateHeader()}
            </Text>

            {/* 4 Fezinhas in Grid */}
            <View style={tw`mb-1 border-b-2 border-dashed border-gray-400 pb-2`}>
                {/* Row 1 */}
                <View style={tw`flex-row justify-between mb-1 px-2`}>
                    {/* Fezinha 1 */}
                    <View style={tw`w-[45%]`}>
                        <Text style={tw`text-left font-black text-[11px] mb-0 ml-1`}>Fezinha 1</Text>
                        <View style={tw`flex-row justify-center gap-2`}>
                            {fezinhas[0]?.map((num, idx) => (
                                <View key={idx} style={tw`items-center`}>
                                    <Text style={[tw`text-4xl font-normal text-black`, { fontFamily: 'serif' }]}>{num}</Text>
                                    <Text style={[tw`text-[7px] text-black -mt-1 font-bold`, { fontFamily: 'serif' }]}>{numberToText(num)}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Fezinha 2 */}
                    <View style={tw`w-[45%]`}>
                        <Text style={tw`text-left font-black text-[11px] mb-0 ml-1`}>Fezinha 2</Text>
                        <View style={tw`flex-row justify-center gap-2`}>
                            {fezinhas[1]?.map((num, idx) => (
                                <View key={idx} style={tw`items-center`}>
                                    <Text style={[tw`text-4xl font-normal text-black`, { fontFamily: 'serif' }]}>{num}</Text>
                                    <Text style={[tw`text-[7px] text-black -mt-1 font-bold`, { fontFamily: 'serif' }]}>{numberToText(num)}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Row 2 */}
                <View style={tw`flex-row justify-between px-2`}>
                    {/* Fezinha 3 */}
                    <View style={tw`w-[45%]`}>
                        <Text style={tw`text-left font-black text-[11px] mb-0 ml-1`}>Fezinha 3</Text>
                        <View style={tw`flex-row justify-center gap-2`}>
                            {fezinhas[2]?.map((num, idx) => (
                                <View key={idx} style={tw`items-center`}>
                                    <Text style={[tw`text-4xl font-normal text-black`, { fontFamily: 'serif' }]}>{num}</Text>
                                    <Text style={[tw`text-[7px] text-black -mt-1 font-bold`, { fontFamily: 'serif' }]}>{numberToText(num)}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Fezinha 4 */}
                    <View style={tw`w-[45%]`}>
                        <Text style={tw`text-left font-black text-[11px] mb-0 ml-1`}>Fezinha 4</Text>
                        <View style={tw`flex-row justify-center gap-2`}>
                            {fezinhas[3]?.map((num, idx) => (
                                <View key={idx} style={tw`items-center`}>
                                    <Text style={[tw`text-4xl font-normal text-black`, { fontFamily: 'serif' }]}>{num}</Text>
                                    <Text style={[tw`text-[7px] text-black -mt-1 font-bold`, { fontFamily: 'serif' }]}>{numberToText(num)}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </View>

            {/* Prize Message Box */}
            <View style={tw`mb-2`}>
                {/* Dashed Line */}
                <Text style={tw`text-center text-black text-lg font-black mb-0.5 tracking-widest`}>
                    ___  ___  ___  ___  ___  ___  ___  ___
                </Text>

                <Text style={tw`text-center font-bold text-[10px] text-black mb-0.5 uppercase leading-tight`}>
                    {data.promptMessage || "VOCÊ GANHA SE ACERTAR EM UMA DAS FEZINHAS:"}
                </Text>
                {data.prizes && (
                    <Text style={tw`text-center font-black text-[10px] text-black uppercase leading-tight`}>
                        QUADRA - {data.prizes.milhar || 'R$ 1.000,00'}   TRINCA: {data.prizes.centena || 'R$ 60,00'} - DUQUE: {data.prizes.dezena || 'R$ 6,00'}
                    </Text>
                )}
            </View>

            {/* Second Chance Section (Fezinha Extra) */}
            {data.secondChanceNumber && (
                <View style={tw`mb-2`}>
                    {/* Black Header with Draw Info */}
                    <View style={tw`items-center mb-2`}>
                        <View style={tw`bg-black rounded-full py-1 px-8`}>
                            <Text style={tw`text-white text-center font-black text-lg uppercase leading-tight`}>
                                {data.secondChanceLabel || 'FEZINHA EXTRA'}
                            </Text>
                            <Text style={tw`text-white text-center text-[8px] font-bold uppercase leading-tight`}>
                                SORTEIO EXTRA, DIA {formatSecondChanceDate()}
                            </Text>
                        </View>
                    </View>


                    {/* Extra Numbers */}
                    <View style={tw`flex-row justify-center gap-3 mb-1`}>
                        {scDigits.map((digit, idx) => (
                            <View key={idx} style={tw`items-center`}>
                                <Text style={[tw`text-4xl font-medium text-black`, { fontFamily: 'serif' }]}>{digit}</Text>
                                <Text style={[tw`text-[7px] text-black -mt-1 font-bold`, { fontFamily: 'serif' }]}>{numberToText(digit)}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Extra Prize Info */}
                    <Text style={tw`text-center font-bold text-[10px] text-black mb-0.5 px-2`}>
                        PRÊMIO DA FEZINHA EXTRA - R$ 5.000,00
                    </Text>
                    <Text style={tw`text-center font-bold text-[8px] text-black uppercase`}>
                        {data.mainMatchMessage || "ACERTANDO TODOS OS NÚMEROS NA ORDEM"}
                    </Text>
                </View>
            )}

            {/* Footer Information */}
            <View style={tw`mx-2`}>
                <Text style={tw`text-[10px] text-black font-bold mb-0.5`}>
                    Bilhete Número: {data.ticketNumber?.toString().padStart(4, '0') || '----'} - Série: {data.series?.toString().padStart(3, '0') || '---'}
                </Text>
                <Text style={tw`text-[10px] text-black font-bold mb-0.5`}>
                    Preço da Aposta: {data.price}
                </Text>
                <Text style={tw`text-[10px] text-black font-bold mb-0.5`}>
                    Terminal número: {data.terminalId || '--------'} - Vendedor: {data.vendorName || '------'}
                </Text>
                <Text style={tw`text-[10px] text-black font-bold mb-1 leading-tight`}>
                    Data da aposta: {data.date}
                </Text>

                {/* Barcode */}
                {data.hash && (
                    <View style={tw`items-center mb-2 bg-white w-full overflow-hidden`}>
                        <Barcode
                            value={data.hash}
                            width={370}
                            height={80}
                        />
                        <Text style={tw`text-[8px] text-black mt-0.5 font-mono`}>
                            {data.hash}
                        </Text>
                    </View>
                )}

                {/* QR Code */}
                <View style={tw`items-center mt-2`}>
                    {data.hash && (
                        <View style={tw`p-1 border-[3px] border-black rounded-none`}>
                            <QRCode
                                value={`https://fezinha.uawtgc.easypanel.host/sorteio/${displayTicketId}`}
                                size={120}
                            />
                        </View>
                    )}
                </View>


                <Text style={tw`text-center font-bold text-[11px] text-black mt-3`}>
                    www.fezinhadehoje.com.br
                </Text>
            </View>
        </View>
    );
};
