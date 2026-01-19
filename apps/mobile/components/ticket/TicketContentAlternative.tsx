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

    // Safety check for numbers
    const numbers = Array.isArray(data.numbers) ? data.numbers : [];

    // data.numbers contains the 4 thousands as numbers (e.g., [32, 7863, 8838, 9788])
    // We need to convert each to a 4-digit string and then to array of digits
    const fezinhasData: number[][] = numbers.map(num => {
        if (num === undefined || num === null) return [0, 0, 0, 0];
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
        fezinhas.push([]); // Empty arrays for missing fezinhas will need handling in render
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
            const dateInput = typeof data.drawDate === 'string' ? new Date(data.drawDate) : data.drawDate;
            const date = typeof dateInput === 'object' ? dateInput : new Date(dateInput);

            // Check if date is valid
            if (isNaN(date.getTime())) {
                return "";
            }

            // Enforce Brazil Time (UTC-3)
            const brazilTime = new Date(date.getTime() - 3 * 60 * 60 * 1000);

            const day = brazilTime.getUTCDate().toString().padStart(2, '0');
            const month = (brazilTime.getUTCMonth() + 1).toString().padStart(2, '0');
            const year = brazilTime.getUTCFullYear();
            const hours = brazilTime.getUTCHours().toString().padStart(2, '0');
            const minutes = brazilTime.getUTCMinutes().toString().padStart(2, '0');
            return `${day}/${month}/${year} - ${hours}:${minutes}`;
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

    const logoWidth = data.alternativeLogoWidth || 500;
    const logoHeight = data.alternativeLogoHeight || 85;

    // QR Code Dimensions - Respect both width and height, keeping it square
    const width = data.alternativeQrWidth || data.qrcodeWidth || 170;
    const height = data.alternativeQrHeight || data.qrcodeHeight || 170;
    const qrSize = Math.min(width, height);

    return (
        <View style={tw`bg-white w-[384px] p-4`}>
            {/* Header Image */}
            <View style={tw`items-center mb-2`}>
                {shouldShowLogo ? (
                    <Image
                        source={{ uri: data.companyLogoUrl }}
                        style={{ width: logoWidth, height: logoHeight, resizeMode: 'contain' }}
                        onError={() => setLogoError(true)}
                    />
                ) : (
                    <Image
                        source={require('../../assets/fezinha_header.png')}
                        style={{ width: logoWidth, height: logoHeight, resizeMode: 'stretch' }}
                    />
                )}
            </View>

            {/* Draw Info - All in one line */}
            <Text style={tw`text-center font-bold text-black text-[12px] mb-1 leading-tight px-1`}>
                Sorteio: <Text style={tw`font-black text-[14px]`}>{formatDrawDateHeader()}</Text>{data.city && data.areaName ? ` - ${data.city}/${data.areaName}` : data.city ? ` - ${data.city}` : data.areaName ? ` - ${data.areaName}` : ''}
            </Text>

            {/* 4 Fezinhas in Grid - Reduced margin */}
            <View style={tw`mb-0`}>
                {/* Row 1 */}
                <View style={tw`flex-row justify-between mb-1 px-2`}>
                    {/* Fezinha 1 */}
                    <View style={tw`w-[45%]`}>
                        <Text style={tw`text-left font-black text-[13px] mb-0 ml-1`}>Fezinha 1</Text>
                        <View style={tw`flex-row justify-center gap-2`}>
                            {fezinhas[0]?.length > 0 ? fezinhas[0].map((num, idx) => (
                                <View key={idx} style={tw`items-center`}>
                                    <Text style={[tw`text-4xl font-normal text-black`, { fontFamily: 'serif' }]}>{num}</Text>
                                    <Text style={[tw`text-[7px] text-black -mt-1 font-bold`, { fontFamily: 'serif' }]}>{numberToText(num)}</Text>
                                </View>
                            )) : <Text style={tw`text-xs text-black font-bold opacity-30 my-2`}>-----</Text>}
                        </View>
                    </View>

                    {/* Fezinha 2 */}
                    <View style={tw`w-[45%]`}>
                        <Text style={tw`text-left font-black text-[13px] mb-0 ml-1`}>Fezinha 2</Text>
                        <View style={tw`flex-row justify-center gap-2`}>
                            {fezinhas[1]?.length > 0 ? fezinhas[1].map((num, idx) => (
                                <View key={idx} style={tw`items-center`}>
                                    <Text style={[tw`text-4xl font-normal text-black`, { fontFamily: 'serif' }]}>{num}</Text>
                                    <Text style={[tw`text-[7px] text-black -mt-1 font-bold`, { fontFamily: 'serif' }]}>{numberToText(num)}</Text>
                                </View>
                            )) : <Text style={tw`text-xs text-black font-bold opacity-30 my-2`}>-----</Text>}
                        </View>
                    </View>
                </View>

                {/* Row 2 */}
                <View style={tw`flex-row justify-between px-2`}>
                    {/* Fezinha 3 */}
                    <View style={tw`w-[45%]`}>
                        <Text style={tw`text-left font-black text-[13px] mb-0 ml-1`}>Fezinha 3</Text>
                        <View style={tw`flex-row justify-center gap-2`}>
                            {fezinhas[2]?.length > 0 ? fezinhas[2].map((num, idx) => (
                                <View key={idx} style={tw`items-center`}>
                                    <Text style={[tw`text-4xl font-normal text-black`, { fontFamily: 'serif' }]}>{num}</Text>
                                    <Text style={[tw`text-[7px] text-black -mt-1 font-bold`, { fontFamily: 'serif' }]}>{numberToText(num)}</Text>
                                </View>
                            )) : <Text style={tw`text-xs text-black font-bold opacity-30 my-2`}>-----</Text>}
                        </View>
                    </View>

                    {/* Fezinha 4 */}
                    <View style={tw`w-[45%]`}>
                        <Text style={tw`text-left font-black text-[13px] mb-0 ml-1`}>Fezinha 4</Text>
                        <View style={tw`flex-row justify-center gap-2`}>
                            {fezinhas[3]?.length > 0 ? fezinhas[3].map((num, idx) => (
                                <View key={idx} style={tw`items-center`}>
                                    <Text style={[tw`text-4xl font-normal text-black`, { fontFamily: 'serif' }]}>{num}</Text>
                                    <Text style={[tw`text-[7px] text-black -mt-1 font-bold`, { fontFamily: 'serif' }]}>{numberToText(num)}</Text>
                                </View>
                            )) : <Text style={tw`text-xs text-black font-bold opacity-30 my-2`}>-----</Text>}
                        </View>
                    </View>
                </View>
            </View>

            {/* Prize Message Box */}
            <View style={tw`mb-2 -mt-1`}>
                {/* Dashed Line */}
                <Text style={tw`text-center text-black text-lg font-black mb-0.5 tracking-widest`}>
                    ___  ___  ___  ___  ___  ___  ___  ___
                </Text>

                <Text style={tw`text-center font-bold text-[12px] text-black mb-0.5 uppercase leading-tight`}>
                    {data.promptMessage || "VOCÊ GANHA SE ACERTAR EM UMA DAS FEZINHAS:"}
                </Text>
                {data.prizes && (
                    <Text style={tw`text-center font-black text-[12px] text-black uppercase leading-tight`}>
                        QUADRA - {data.prizes.milhar || 'R$ 1.000,00'}   TRINCA: {data.prizes.centena || 'R$ 60,00'} - DUQUE: {data.prizes.dezena || 'R$ 6,00'}
                    </Text>
                )}
            </View>

            {/* Second Chance Section (Fezinha Extra) */}
            {data.secondChanceNumber && (
                <View style={tw`mb-2`}>
                    {/* Rounded Header with Draw Info */}
                    <View style={tw`mb-2 mx-1`}>
                        <View style={tw`bg-black py-0.5 px-4 rounded-xl shadow-sm`}>
                            <Text style={tw`text-white text-center font-black text-xl uppercase leading-tight`}>
                                {data.secondChanceLabel || 'FEZINHA EXTRA'}
                            </Text>
                            <Text style={tw`text-white text-center text-[10px] font-bold uppercase leading-tight`}>
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
                    <Text style={tw`text-center font-bold text-[12px] text-black mb-0.5 px-2`}>
                        PRÊMIO DA FEZINHA EXTRA - R$ 5.000,00
                    </Text>
                    <Text style={tw`text-center font-bold text-[10px] text-black uppercase`}>
                        {data.mainMatchMessage || "ACERTANDO TODOS OS NÚMEROS NA ORDEM"}
                    </Text>
                </View>
            )}

            {/* Footer Information - Rearranged */}
            <View style={tw`mx-2`}>
                <View style={tw`flex-row justify-between mb-1`}>
                    <View style={tw`w-[33%]`}>
                        <Text style={tw`text-[10px] text-black font-bold`}>Bilhete: {data.ticketNumber?.toString().padStart(4, '0') || '----'}</Text>
                    </View>
                    <View style={tw`w-[34%] items-center`}>
                        <Text style={tw`text-[10px] text-black font-bold`}>Série: {data.series?.toString().padStart(4, '0') || '----'}</Text>
                    </View>
                    <View style={tw`w-[33%] items-end`}>
                        <Text style={tw`text-[10px] text-black font-bold`}>Preço: {data.price}</Text>
                    </View>
                </View>

                <View style={tw`flex-row justify-between mb-1`}>
                    <View style={tw`w-[33%]`}>
                        <Text style={tw`text-[10px] text-black font-bold`}>
                            Term: {data.terminalId || '---'}
                        </Text>
                    </View>
                    <View style={tw`w-[34%] items-center`}>
                        <Text style={tw`text-[10px] text-black font-bold`}>
                            Vend: {data.vendorName?.substring(0, 10) || "Cambista"}
                        </Text>
                    </View>
                    <View style={tw`w-[33%] items-end`}>
                        <Text style={tw`text-[10px] text-black font-bold`}>{data.date}</Text>
                    </View>
                </View>

                {/* Barcode */}
                {data.hash && (
                    <View style={tw`items-center mb-2 bg-white w-full overflow-hidden`}>
                        <Barcode
                            value={data.hash}
                            width={370}
                            height={31}
                        />
                        <Text style={tw`text-[13px] text-black mt-1 font-black font-mono`}>
                            {data.hash}
                        </Text>
                    </View>
                )}

                {/* Footer: Text Left, QR Right */}
                <View style={tw`flex-row justify-between items-center mt-2`}>

                    {/* Left Side: Texts */}
                    <View style={tw`flex-1 pr-2`}>
                        <Text style={tw`text-left font-bold text-[11px] text-black`}>
                            Acesse o site para conferir o resultado
                        </Text>
                        <Text style={tw`text-left font-bold text-[16px] text-black leading-tight mt-1`}>
                            www.fezinhadehoje.com.br
                        </Text>
                    </View>

                    {/* Right Side: QR Code */}
                    <View style={[
                        tw`items-center`,
                        {
                            transform: [
                                { scaleY: (height / width) * (isCapture ? 0.38 : 1) },
                                { scaleX: (isCapture ? 1.35 : 1) }
                            ],
                        },
                        {
                            marginTop: -(width * (1 - ((height / width) * (isCapture ? 0.38 : 1))) / 2),
                            marginBottom: -(width * (1 - ((height / width) * (isCapture ? 0.38 : 1))) / 2)
                        }
                    ]}>
                        {data.hash && (
                            <View style={[tw`p-2 bg-white border-[3px] border-black rounded-lg`]}>
                                <QRCode
                                    value={`https://www.fezinhadehoje.com.br/sorteio/${data.hash || data.ticketId}`}
                                    size={qrSize}
                                    backgroundColor="white"
                                    color="black"
                                    ecl="L"
                                />
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </View>
    );
};
