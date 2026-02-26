import React, { useState } from 'react';
import { View, Text, Image } from 'react-native';
import tw from '../../lib/tailwind';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Barcode } from '../Barcode';
import { TicketData } from './TicketContent';
import { formatBrazilDate } from '../../lib/date-utils';

interface TicketContentMilharProps {
    data: TicketData;
    isCapture?: boolean;
}

const numberToText = (num: number): string => {
    const texts = ["zero", "um", "dois", "três", "quat", "cinc", "seis", "sete", "oito", "nove"];
    return texts[num] || "";
};

export const TicketContentMilhar: React.FC<TicketContentMilharProps> = ({ data, isCapture = false }) => {
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

    // Ensure we have exactly 4 milhares (pad with empty if needed)
    const milhares = fezinhasData;
    while (milhares.length < 4) {
        milhares.push([]); // Empty arrays for missing milhares will need handling in render
    }

    const shouldShowLogo = data.companyLogoUrl && !logoError;
    const displayTicketId = data.hash?.substring(0, 8).toUpperCase() || data.ticketId?.substring(0, 8).toUpperCase() || 'N/A';

    // Derivar nome da empresa para o ticket
    const brandName = data.companyName || 'Sorte Premiada';
    const brandParts = brandName.toUpperCase().split(' ');
    const brandMain = brandParts.slice(0, -1).join(' ') || brandParts[0];
    const brandSuffix = brandParts.length > 1 ? brandParts[brandParts.length - 1] : '';

    // Format draw date for header
    const formatDrawNumber = () => {
        if (data.series) {
            return data.series.toString().padStart(4, '0');
        }
        return "0001";
    };

    const formatDrawDateHeader = () => {
        return formatBrazilDate(data.drawDate, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(' ', ' - ');
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
            {/* Header Image or Text */}
            <View style={tw`items-center w-full pt-1 pb-0 border-b border-dashed border-black mx-2`}>
                {shouldShowLogo ? (
                    <Image
                        source={{ uri: data.companyLogoUrl }}
                        style={{ width: logoWidth, height: logoHeight, resizeMode: 'contain', marginBottom: -25 }}
                        onError={() => setLogoError(true)}
                    />
                ) : (
                    <View style={tw`items-center justify-center`}>
                        <Text style={[tw`text-2xl font-black text-black text-center uppercase mb-0.5`, { letterSpacing: 1 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
                            {brandMain}
                        </Text>
                        {brandSuffix ? (
                            <Text style={tw`text-[12px] font-bold text-black uppercase mb-1`}>
                                {brandSuffix}
                            </Text>
                        ) : null}
                    </View>
                )}
            </View>

            {/* Draw Info - All in one line */}
            <Text style={tw`text-center font-bold text-black text-[12px] mb-1 leading-tight px-1`}>
                Sorteio: <Text style={tw`font-black text-[14px]`}>{formatDrawDateHeader()}</Text>{data.city && data.areaName ? ` - ${data.city}/${data.areaName}` : data.city ? ` - ${data.city}` : data.areaName ? ` - ${data.areaName}` : ''}
            </Text>

            {/* 4 Milhares in Grid - More Compact */}
            <View style={tw`mb-0`}>
                {/* Row 1 */}
                <View style={tw`flex-row justify-between mb-0 px-2`}>
                    {/* Milhar 1 */}
                    <View style={tw`w-[48%]`}>
                        <Text style={tw`text-left font-black text-[12px] mb-0 ml-1 leading-tight`}>Milhar 1</Text>
                        <View style={tw`flex-row justify-center gap-1`}>
                            {milhares[0]?.length > 0 ? milhares[0].map((num, idx) => (
                                <View key={idx} style={tw`items-center`}>
                                    <Text style={[tw`text-3xl font-normal text-black leading-tight`, { fontFamily: 'Roboto_400Regular' }]}>{num}</Text>
                                    <Text style={[tw`text-[6px] text-black -mt-1 font-bold`, { fontFamily: 'Roboto_400Regular' }]}>{numberToText(num)}</Text>
                                </View>
                            )) : <Text style={tw`text-xs text-black font-bold opacity-30 my-1`}>-----</Text>}
                        </View>
                    </View>

                    {/* Milhar 2 */}
                    <View style={tw`w-[48%]`}>
                        <Text style={tw`text-left font-black text-[12px] mb-0 ml-1 leading-tight`}>Milhar 2</Text>
                        <View style={tw`flex-row justify-center gap-1`}>
                            {milhares[1]?.length > 0 ? milhares[1].map((num, idx) => (
                                <View key={idx} style={tw`items-center`}>
                                    <Text style={[tw`text-3xl font-normal text-black leading-tight`, { fontFamily: 'Roboto_400Regular' }]}>{num}</Text>
                                    <Text style={[tw`text-[6px] text-black -mt-1 font-bold`, { fontFamily: 'Roboto_400Regular' }]}>{numberToText(num)}</Text>
                                </View>
                            )) : <Text style={tw`text-xs text-black font-bold opacity-30 my-1`}>-----</Text>}
                        </View>
                    </View>
                </View>

                {/* Row 2 */}
                <View style={tw`flex-row justify-between px-2`}>
                    {/* Milhar 3 */}
                    <View style={tw`w-[48%]`}>
                        <Text style={tw`text-left font-black text-[12px] mb-0 ml-1 leading-tight`}>Milhar 3</Text>
                        <View style={tw`flex-row justify-center gap-1`}>
                            {milhares[2]?.length > 0 ? milhares[2].map((num, idx) => (
                                <View key={idx} style={tw`items-center`}>
                                    <Text style={[tw`text-3xl font-normal text-black leading-tight`, { fontFamily: 'Roboto_400Regular' }]}>{num}</Text>
                                    <Text style={[tw`text-[6px] text-black -mt-1 font-bold`, { fontFamily: 'Roboto_400Regular' }]}>{numberToText(num)}</Text>
                                </View>
                            )) : <Text style={tw`text-xs text-black font-bold opacity-30 my-1`}>-----</Text>}
                        </View>
                    </View>

                    {/* Milhar 4 */}
                    <View style={tw`w-[48%]`}>
                        <Text style={tw`text-left font-black text-[12px] mb-0 ml-1 leading-tight`}>Milhar 4</Text>
                        <View style={tw`flex-row justify-center gap-1`}>
                            {milhares[3]?.length > 0 ? milhares[3].map((num, idx) => (
                                <View key={idx} style={tw`items-center`}>
                                    <Text style={[tw`text-3xl font-normal text-black leading-tight`, { fontFamily: 'Roboto_400Regular' }]}>{num}</Text>
                                    <Text style={[tw`text-[6px] text-black -mt-1 font-bold`, { fontFamily: 'Roboto_400Regular' }]}>{numberToText(num)}</Text>
                                </View>
                            )) : <Text style={tw`text-xs text-black font-bold opacity-30 my-1`}>-----</Text>}
                        </View>
                    </View>
                </View>
            </View>

            {/* Prize Message Box */}
            <View style={tw`mb-1 -mt-1`}>
                {/* Dashed Line */}
                <Text style={tw`text-center text-black text-lg font-black mb-0 leading-tight tracking-widest`}>
                    ___  ___  ___  ___  ___  ___  ___  ___
                </Text>

                <Text style={tw`text-center font-bold text-[11px] text-black mb-0.5 uppercase leading-tight`}>
                    {data.promptMessage || "VOCÊ GANHA SE ACERTAR EM UM DOS MILHARES:"}
                </Text>
                {data.prizes && (
                    <Text style={tw`text-center font-black text-[12px] text-black uppercase leading-tight`}>
                        MILHAR - {data.prizes.milhar || 'R$ 1.000,00'}   CENTENA: {data.prizes.centena || 'R$ 60,00'} - DEZENA: {data.prizes.dezena || 'R$ 6,00'}
                    </Text>
                )}
            </View>

            {/* Second Chance Section (Milhar Extra) */}
            {data.secondChanceNumber && (
                <View style={tw`mb-1`}>
                    {/* Rounded Header with Draw Info */}
                    <View style={tw`mb-1 mx-1`}>
                        <View style={tw`bg-black py-0.5 px-4 rounded-xl shadow-sm`}>
                            <Text style={tw`text-white text-center font-black text-lg uppercase leading-tight`}>
                                {data.secondChanceLabel && data.secondChanceLabel.replace(/FEZINHA/ig, 'MILHAR') || 'MILHAR EXTRA'}
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
                                <Text style={[tw`text-4xl font-medium text-black`, { fontFamily: 'Roboto_400Regular' }]}>{digit}</Text>
                                <Text style={[tw`text-[7px] text-black -mt-1 font-bold`, { fontFamily: 'Roboto_400Regular' }]}>{numberToText(digit)}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Extra Prize Info */}
                    <Text style={tw`text-center font-bold text-[11px] text-black mb-0 px-2 leading-tight`}>
                        {data.secondChancePrize ? `PRÊMIO DO ${data.secondChanceLabel && data.secondChanceLabel.replace(/FEZINHA/ig, 'MILHAR') || 'MILHAR EXTRA'} - ${data.secondChancePrize}` : `PRÊMIO DO ${data.secondChanceLabel && data.secondChanceLabel.replace(/FEZINHA/ig, 'MILHAR') || 'MILHAR EXTRA'} - R$ 5.000,00`}
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
                        <Text style={tw`text-left font-bold text-[15px] text-black leading-tight mt-1`}>
                            {data.websiteUrl || 'www.suabanca.com'}
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
                                    value={`https://${data.websiteUrl || 'www.suabanca.com'}/sorteio/${data.hash || data.ticketId}`}
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
