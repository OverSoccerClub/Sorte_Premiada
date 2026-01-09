import React from 'react';
import { View, Text, Image } from 'react-native';
import tw from '../../lib/tailwind';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Barcode } from '../Barcode';

export interface TicketData {
    gameName: string;
    numbers: number[];
    price: string;
    date: string;
    ticketId: string;
    hash?: string;
    series?: string;
    ticketNumber?: number;
    drawDate?: string;
    terminalId?: string;
    vendorName?: string;
    possiblePrize?: string;
    secondChanceNumber?: number;
    secondChanceDrawDate?: string;
    secondChanceLabel?: string;
    prizes?: {
        milhar?: string;
        centena?: string;
        dezena?: string;
    };
    status?: string;
    secondChanceStatus?: string;
    // Company Branding
    companyName?: string;
    companyLogoUrl?: string;
}

interface TicketContentProps {
    data: TicketData;
    isCapture?: boolean;
}

const numberToText = (num: number): string => {
    const texts = ["ZERO", "UM", "DOIS", "TRÊS", "QUATRO", "CINCO", "SEIS", "SETE", "OITO", "NOVE"];
    return texts[num] || "";
};

export const TicketContent = ({ data, isCapture = false }: TicketContentProps) => {
    const sortedNumbers = [...data.numbers].sort((a, b) => a - b);
    const scDigits = data.secondChanceNumber ? data.secondChanceNumber.toString().split('').map(Number) : [];

    const displayTicketId = data.hash || data.ticketId.substring(0, 8);

    // Derivar nome da empresa para o ticket
    const brandName = data.companyName || 'Sorte Premiada';
    const brandParts = brandName.toUpperCase().split(' ');
    const brandMain = brandParts.slice(0, -1).join(' ') || brandParts[0];
    const brandSuffix = brandParts.length > 1 ? brandParts[brandParts.length - 1] : '';

    return (
        <View style={tw`bg-white w-[384px] p-1`}>
            {/* Header */}
            <View style={tw`items-center mb-1 w-full px-1`}>
                <View style={tw`border-[3px] border-black rounded-xl p-3 w-full flex-row items-center justify-between`}>
                    {data.companyLogoUrl ? (
                        <Image
                            source={{ uri: data.companyLogoUrl }}
                            style={{ width: 60, height: 60, resizeMode: 'contain' }}
                        />
                    ) : (
                        <MaterialCommunityIcons name="clover" size={40} color="#000" />
                    )}
                    <View style={tw`items-center flex-1 ml-3`}>
                        <Text style={[tw`text-4xl font-black text-black leading-tight text-center`, { transform: [{ scaleX: 1.25 }] }, { fontSize: brandMain.length > 15 ? 24 : 36 }]}>{brandMain}</Text>
                        {brandSuffix && (
                            <View style={tw`flex-row items-center -mt-1`}>
                                <Ionicons name="calendar-sharp" size={13} color="#000" style={tw`mr-1`} />
                                <Text style={tw`text-xs font-black text-black uppercase`}>{brandSuffix}</Text>
                            </View>
                        )}
                    </View>
                </View>
                <Text style={tw`text-center font-black text-black text-xl mt-2 uppercase`}>
                    {data.gameName}
                </Text>
                <Text style={tw`text-center font-black text-black text-[12px] mt-1 uppercase`}>
                    SORTEIO {data.drawDate || data.date.split(' ')[0]} - 19H
                </Text>
            </View>

            {/* Numbers Grid */}
            <View style={tw`flex-row flex-wrap justify-between mb-1 px-1`}>
                {Array.from({ length: 4 }).map((_, idx) => {
                    const num = sortedNumbers[idx];
                    return (
                        <View key={idx} style={tw`w-[49%] mb-3 items-center border border-gray-200 rounded p-1`}>
                            <Text style={tw`font-bold text-[12px] text-black self-start mb-0 ml-1`}>{brandMain.split(' ')[0]} {idx + 1}</Text>
                            {num !== undefined ? (
                                <View style={tw`flex-row justify-between w-full px-4`}>
                                    {num.toString().padStart(4, '0').split('').map((digit, i) => (
                                        <View key={i} style={tw`items-center`}>
                                            <Text style={[tw`text-4xl text-black font-bold mb-0`, { fontFamily: 'serif' }]}>{digit}</Text>
                                            <Text style={[tw`text-[8px] text-black text-center font-bold uppercase -mt-1`, { fontFamily: 'serif' }]}>
                                                {numberToText(parseInt(digit))}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <View style={tw`flex-row justify-center w-full px-4 items-center`}>
                                    <Text style={[tw`text-4xl text-gray-300 font-bold mb-0 tracking-[5px]`, { fontFamily: 'serif' }]}>AUTO</Text>
                                </View>
                            )}
                        </View>
                    );
                })}
            </View>

            <View style={tw`border-b-2 border-dashed border-black mb-2 mx-2`} />

            <Text style={tw`text-center font-bold text-[11px] text-black mb-1 uppercase`}>
                VOCÊ GANHA SE ACERTAR EM UMA DAS FEZINHAS:
            </Text>

            {data.prizes ? (
                <View style={tw`mb-3 border-b-2 border-black pb-1 mx-2`}>
                    <View style={tw`flex-row justify-between mb-1`}>
                        <Text style={tw`font-bold text-[11px] text-black`}>MILHAR:</Text>
                        <Text style={tw`font-black text-[12px] text-black`}>{data.prizes.milhar || 'R$ 0,00'}</Text>
                    </View>
                    <View style={tw`flex-row justify-between mb-1`}>
                        <Text style={tw`font-bold text-[11px] text-black`}>CENTENA:</Text>
                        <Text style={tw`font-black text-[12px] text-black`}>{data.prizes.centena || 'R$ 0,00'}</Text>
                    </View>
                    <View style={tw`flex-row justify-between`}>
                        <Text style={tw`font-bold text-[11px] text-black`}>DEZENA:</Text>
                        <Text style={tw`font-black text-[12px] text-black`}>{data.prizes.dezena || 'R$ 0,00'}</Text>
                    </View>
                </View>
            ) : data.possiblePrize ? (
                <View style={tw`mb-3 border-b-2 border-black pb-1 mx-2 items-center`}>
                    <Text style={tw`text-center font-black text-lg text-black uppercase`}>PRÊMIO MÁXIMO</Text>
                    <Text style={tw`text-center font-black text-2xl text-black`}>{data.possiblePrize}</Text>
                </View>
            ) : (
                <View style={tw`mb-3 border-b-2 border-black pb-1 mx-2`} />
            )}

            {/* Second Chance */}
            {data.secondChanceNumber !== undefined && data.secondChanceNumber !== null && (
                <View style={tw`items-center mb-2`}>
                    <View style={tw`bg-black rounded-full py-1 px-10 mb-1 items-center w-full`}>
                        <Text style={tw`text-white text-center font-black text-xl uppercase`}>{data.secondChanceLabel || 'SEGUNDA CHANCE'}</Text>
                        <Text style={tw`text-white text-center text-[9px] font-bold uppercase`}>SORTEIO EXTRA - {data.secondChanceDrawDate || 'SÁBADO'}</Text>
                    </View>

                    {data.secondChanceStatus === 'WON' && (
                        <View style={[tw`border-2 border-emerald-500 px-3 py-1 rounded absolute -right-4 -top-2 bg-emerald-50`, { transform: [{ rotate: '15deg' }] }]}>
                            <Text style={tw`text-emerald-600 font-black text-xs uppercase`}>PREMIADO!</Text>
                        </View>
                    )}
                    <View style={tw`item-center mb-1`}>
                        <View style={tw`flex-row gap-5`}>
                            {scDigits.map((n, i) => (
                                <Text key={i} style={tw`text-4xl font-black text-black`}>{n}</Text>
                            ))}
                        </View>
                    </View>
                    <Text style={tw`text-center font-bold text-[10px] text-black uppercase`}>ACERTANDO TODOS OS NÚMEROS NA ORDEM</Text>
                </View>
            )}

            {/* Info Footer */}
            <View style={tw`mb-2 px-1`}>
                <Text style={tw`text-center font-black text-[12px] text-black mb-1 mt-1 uppercase border-t-2 border-dashed border-black pt-1`}>
                    INFORMAÇÕES DO BILHETE
                </Text>
                <View style={tw`flex-row justify-between mb-1`}>
                    <Text style={tw`text-[12px] text-black font-bold`}>Bilhete: {displayTicketId}</Text>
                    <Text style={tw`text-[12px] text-black font-bold`}>Série: {data.series || '----'} | Nº {data.ticketNumber?.toString().padStart(4, '0') || '----'}</Text>
                    <Text style={tw`text-[12px] text-black font-bold`}>Preço: {data.price}</Text>
                </View>
                <View style={tw`flex-row justify-between mb-1`}>
                    <Text style={tw`text-[12px] text-black font-bold`}>Terminal: {data.terminalId || "----------"}</Text>
                    <Text style={tw`text-[12px] text-black font-bold`}>Vendedor: {data.vendorName || "Cambista"}</Text>
                </View>
                <View style={tw`flex-row justify-between mb-1`}>
                    <Text style={tw`text-[12px] text-black font-bold`}>Data: {data.date}</Text>
                    <Text style={tw`text-[12px] text-black font-bold`}>Ext: {data.drawDate || "Hoje 19H"}</Text>
                </View>
            </View>

            {/* Barcode and QR */}
            <View style={tw`items-center mb-4`}>
                <View style={tw`overflow-hidden items-center justify-center mb-2`}>
                    <Barcode
                        value={data.ticketId || '000000000000'}
                        width={370}
                        height={isCapture ? 80 : 90}
                    />
                    <View style={tw`bg-black rounded-full py-1 px-6 mt-2 mb-4 items-center min-w-[220px]`}>
                        <Text style={tw`font-black text-2xl text-white tracking-[3px]`}>{displayTicketId}</Text>
                    </View>
                </View>

                <View style={[
                    tw`items-center justify-center w-full mt-2`,
                    isCapture && {
                        transform: [{ scaleY: 0.35 }],
                        marginTop: -90,
                        marginBottom: -90
                    }
                ]}>
                    <View style={tw`border-[3px] border-black p-1 bg-white`}>
                        <QRCode
                            value={`https://fezinha.uawtgc.easypanel.host/sorteio/${displayTicketId}`}
                            size={240}
                        />
                    </View>
                </View>
            </View>

            {/* OVERLAY WATERMARK (Rendered last to be on top) */}
            {data.status === 'CANCELLED' && (
                <View
                    pointerEvents="none"
                    style={[
                        tw`absolute items-center justify-center`,
                        {
                            top: 0, left: 0, right: 0, bottom: 0,
                            zIndex: 100,
                            overflow: 'hidden'
                        }
                    ]}
                >
                    <View style={{
                        transform: [{ rotate: '-45deg' }],
                        borderWidth: 10,
                        borderColor: 'rgba(180, 0, 0, 0.7)', // Darker and more opaque
                        padding: 15,
                        borderRadius: 20,
                    }}>
                        <Text style={[
                            tw`text-red-800 font-black`,
                            {
                                fontSize: 80,
                                textAlign: 'center',
                                opacity: 0.8, // Much higher opacity for capture
                            }
                        ]}>
                            CANCELADO
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
};
