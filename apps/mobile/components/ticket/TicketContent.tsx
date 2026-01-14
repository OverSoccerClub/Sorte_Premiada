import React, { useState } from 'react';
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
    deviceName?: string;
    vendorName?: string;
    possiblePrize?: string;
    secondChanceNumber?: number;
    secondChanceDrawDate?: string;
    secondChanceLabel?: string;
    promptMessage?: string;
    mainMatchMessage?: string;
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
    areaName?: string;
    city?: string;
    // Alternative Template Dimensions
    alternativeLogoWidth?: number;
    alternativeLogoHeight?: number;
    alternativeQrWidth?: number;
    alternativeQrHeight?: number;
    qrcodeWidth?: number;
    qrcodeHeight?: number;
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
    const [logoError, setLogoError] = useState(false);
    const sortedNumbers = [...data.numbers].sort((a, b) => a - b);
    const scDigits = data.secondChanceNumber ? data.secondChanceNumber.toString().split('').map(Number) : [];

    const displayTicketId = data.hash || data.ticketId.substring(0, 8);

    // Derivar nome da empresa para o ticket
    const brandName = data.companyName || 'Sorte Premiada';
    const brandParts = brandName.toUpperCase().split(' ');
    const brandMain = brandParts.slice(0, -1).join(' ') || brandParts[0];
    const brandSuffix = brandParts.length > 1 ? brandParts[brandParts.length - 1] : '';

    // Determinar se deve mostrar logo ou ícone
    const shouldShowLogo = data.companyLogoUrl && !logoError;

    // Helper to get formatted POS name
    const getPosName = () => {
        if (!data.deviceName) return data.terminalId || '----';
        // Tries to match POS 001, TERM 001, TERMINAL 001, or POS-001, etc.
        const match = data.deviceName.match(/(?:POS|TERM|TERMINAL)\s*-?\s*(\d+)/i);
        if (match) return `POS ${match[1]}`;
        // Fallback: use limited length device name or Terminal ID
        return data.terminalId || '----';
    };

    // Helper to format Draw Date as per requirement: DD/MM/YY ÀS HH:MM
    // Enforces Brazil Time (UTC-3) regardless of device timezone
    const formatDrawDate = (dateStr: string | undefined) => {
        if (!dateStr) return "";

        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr; // parsing failed, return original

            // Shift UTC time by -3 hours to get Brazil components via getUTC* methods
            // (Standard Brazil Time is UTC-3)
            const brazilTime = new Date(date.getTime() - 3 * 60 * 60 * 1000);

            const day = brazilTime.getUTCDate().toString().padStart(2, '0');
            const month = (brazilTime.getUTCMonth() + 1).toString().padStart(2, '0');
            const year = brazilTime.getUTCFullYear().toString();
            const shortYear = year.substring(2);
            const hours = brazilTime.getUTCHours().toString().padStart(2, '0');
            const minutes = brazilTime.getUTCMinutes().toString().padStart(2, '0');

            return `${day}/${month}/${shortYear} ÀS ${hours}:${minutes}`;
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <View style={tw`bg-white w-[384px] p-1`}>
            {/* Header Clean & Professional */}
            <View style={tw`items-center mb-4 w-full pt-4 pb-2 border-b-2 border-dashed border-black mx-2`}>
                {/* Logo Centralizado e Maior */}
                {shouldShowLogo ? (
                    <Image
                        source={{ uri: data.companyLogoUrl }}
                        style={{ width: 160, height: 85, resizeMode: 'contain', marginBottom: 6 }}
                        onError={() => {
                            console.warn('[TicketContent] Failed to load company logo, using fallback icon');
                            setLogoError(true);
                        }}
                    />
                ) : (
                    <MaterialCommunityIcons name="clover" size={60} color="#000" style={tw`mb-2`} />
                )}

                {/* Nome da Empresa */}
                <Text style={[
                    tw`text-2xl font-black text-black text-center uppercase mb-1`,
                    { letterSpacing: 1 }
                ]}>
                    {brandMain}
                </Text>

                {brandSuffix && (
                    <Text style={tw`text-sm font-bold text-black uppercase mb-3`}>
                        {brandSuffix}
                    </Text>
                )}

                {/* Nome do Jogo e Data */}
                <View style={tw`w-full items-center mt-2 bg-black py-1`}>
                    <Text style={tw`text-white font-black text-lg uppercase`}>
                        {data.gameName}
                    </Text>
                </View>
                <Text style={tw`text-center font-bold text-black text-[10px] mt-1`}>
                    SORTEIO: <Text style={tw`font-black text-[12px]`}>
                        {formatDrawDate(data.drawDate || data.date)}
                        {data.city || data.areaName ? ` - ${data.city ? `${data.city}/` : ''}${data.areaName || ''}` : ''}
                    </Text>
                </Text>
            </View>

            {/* Numbers Grid */}
            <View style={tw`flex-row flex-wrap justify-between mb-2 px-1`}>
                {Array.from({ length: 4 }).map((_, idx) => {
                    const num = sortedNumbers[idx];
                    return (
                        <View key={idx} style={tw`w-[49%] mb-3 items-center border border-gray-300 rounded-lg p-2 bg-gray-50`}>
                            <Text style={tw`font-bold text-[10px] text-gray-500 self-start mb-0 ml-1 uppercase`}>{brandMain.split(' ')[0]} {idx + 1}</Text>
                            {num !== undefined ? (
                                <View style={tw`flex-row justify-between w-full px-2 mt-1`}>
                                    {num.toString().padStart(4, '0').split('').map((digit, i) => (
                                        <View key={i} style={tw`items-center`}>
                                            <Text style={[tw`text-4xl text-black font-black mb-0`, { fontFamily: 'serif' }]}>{digit}</Text>
                                            <Text style={[tw`text-[7px] text-gray-600 text-center font-bold uppercase -mt-1`, { fontFamily: 'serif' }]}>
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

            <View style={tw`border-b-2 border-dashed border-black mb-3 mx-2`} />

            {/* Prompt Message (Incentivo) */}
            <View style={tw`mb-3 px-4`}>
                <Text style={tw`text-center font-black text-[12px] text-black uppercase leading-tight`}>
                    {data.promptMessage || "VOCÊ GANHA SE ACERTAR EM UMA DAS FEZINHAS:"}
                </Text>
            </View>

            {data.prizes ? (
                <View style={tw`mb-4 border-2 border-black rounded p-2 mx-2 bg-gray-100`}>
                    <View style={tw`flex-row justify-between mb-1 border-b border-gray-300 pb-1`}>
                        <Text style={tw`font-bold text-[11px] text-black`}>MILHAR:</Text>
                        <Text style={tw`font-black text-[13px] text-black`}>{data.prizes.milhar || 'R$ 0,00'}</Text>
                    </View>
                    <View style={tw`flex-row justify-between mb-1 border-b border-gray-300 pb-1`}>
                        <Text style={tw`font-bold text-[11px] text-black`}>CENTENA:</Text>
                        <Text style={tw`font-black text-[13px] text-black`}>{data.prizes.centena || 'R$ 0,00'}</Text>
                    </View>
                    <View style={tw`flex-row justify-between`}>
                        <Text style={tw`font-bold text-[11px] text-black`}>DEZENA:</Text>
                        <Text style={tw`font-black text-[13px] text-black`}>{data.prizes.dezena || 'R$ 0,00'}</Text>
                    </View>
                </View>
            ) : data.possiblePrize ? (
                <View style={tw`mb-4 border-2 border-black rounded p-2 mx-2 bg-gray-100 items-center`}>
                    <Text style={tw`text-center font-bold text-xs text-black uppercase mb-1`}>PRÊMIO MÁXIMO</Text>
                    <Text style={tw`text-center font-black text-3xl text-black`}>{data.possiblePrize}</Text>
                </View>
            ) : null}



            {/* Second Chance */}
            {data.secondChanceNumber !== undefined && data.secondChanceNumber !== null && (
                <View style={tw`items-center mb-4 mx-1 pt-2 border-t-2 border-black border-dashed`}>
                    <View style={tw`bg-black rounded-lg py-1 px-4 mb-2 items-center w-full shadow-sm`}>
                        <View style={tw`flex-row items-center`}>
                            <MaterialCommunityIcons name="ticket-percent" size={16} color="white" style={tw`mr-2`} />
                            <Text style={tw`text-white text-center font-black text-lg uppercase`}>
                                {data.secondChanceLabel || 'SEGUNDA CHANCE'}
                            </Text>
                        </View>
                        <Text style={tw`text-gray-300 text-center text-[9px] font-bold uppercase mt-0.5`}>
                            SORTEIO EXTRA - {data.secondChanceDrawDate || 'SÁBADO'}
                        </Text>
                    </View>

                    {data.secondChanceStatus === 'WON' && (
                        <View style={[tw`border-4 border-emerald-500 px-4 py-2 rounded-xl absolute -right-2 -top-4 bg-white shadow-lg`, { transform: [{ rotate: '15deg' }] }]}>
                            <Text style={tw`text-emerald-600 font-black text-sm uppercase`}>PREMIADO!</Text>
                        </View>
                    )}

                    <View style={tw`item-center my-1 border-2 border-black rounded-lg p-2 w-full items-center bg-gray-50`}>
                        <View style={tw`flex-row gap-4`}>
                            {scDigits.map((n, i) => (
                                <Text key={i} style={tw`text-4xl font-black text-black`}>{n}</Text>
                            ))}
                        </View>
                    </View>

                    {/* Main Match Message (Above dashed line with Black Strip) */}
                    <View style={tw`mt-4 bg-black py-1.5 px-4 w-full shadow-sm`}>
                        <Text style={[tw`text-white text-center font-black text-[10px] uppercase`, { letterSpacing: 0.5 }]}>
                            {data.mainMatchMessage || "ACERTANDO TODOS OS NÚMEROS NA ORDEM"}
                        </Text>
                    </View>

                    <View style={tw`mt-1 w-full border-t border-dashed border-black`} />
                </View>
            )}

            {/* Info Footer title removed (cleaner) */}

            {/* Row 1: ID, Série, Bilhete */}
            <View style={tw`flex-row justify-between mb-1`}>
                <View style={tw`w-[32%]`}>
                    <Text style={tw`text-[10px] text-black font-bold`}>ID: {displayTicketId}</Text>
                </View>
                <View style={tw`w-[30%] items-center`}>
                    <Text style={tw`text-[10px] text-black font-bold`}>Série: {data.series?.toString().padStart(4, '0') || '----'}</Text>
                </View>
                <View style={tw`w-[38%] items-end`}>
                    <Text style={tw`text-[10px] text-black font-bold`}>Bilhete: {data.ticketNumber?.toString().padStart(4, '0') || '----'}</Text>
                </View>
            </View>

            {/* Row 2: Preço, Terminal, Vendedor */}
            <View style={tw`flex-row justify-between mb-1`}>
                <View style={tw`w-[32%]`}>
                    <Text style={tw`text-[10px] text-black font-bold`}>Preço: {data.price}</Text>
                </View>
                <View style={tw`w-[30%] items-center`}>
                    <Text style={tw`text-[10px] text-black font-bold`}>
                        Term: {getPosName()}
                    </Text>
                </View>
                <View style={tw`w-[38%] items-end`}>
                    <Text style={tw`text-[10px] text-black font-bold`}>
                        Vend: {data.vendorName?.substring(0, 10) || "Cambista"}
                    </Text>
                </View>
            </View>
            <View style={tw`flex-row justify-between mb-1`}>
                <Text style={tw`text-[12px] text-black font-bold`}>Data: {data.date}</Text>
                <Text style={tw`text-[12px] text-black font-bold`}>Ext: {data.drawDate || "Hoje 19H"}</Text>
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
                        <Text style={tw`font-black text-4xl text-white tracking-[3px]`}>{displayTicketId}</Text>
                    </View>
                </View>

                <View style={[
                    tw`items-center justify-center w-full mt-2`,
                    {
                        transform: [{ scaleY: data.qrcodeHeight ? (data.qrcodeHeight / (data.qrcodeWidth || 240)) : (isCapture ? 0.45 : 1) }],
                    },
                    (!!data.qrcodeHeight || isCapture) && {
                        marginTop: -((data.qrcodeWidth || 240) * (1 - (data.qrcodeHeight ? (data.qrcodeHeight / (data.qrcodeWidth || 240)) : 0.45)) / 2),
                        marginBottom: -((data.qrcodeWidth || 240) * (1 - (data.qrcodeHeight ? (data.qrcodeHeight / (data.qrcodeWidth || 240)) : 0.45)) / 2)
                    }
                ]}>
                    <View style={tw`border-[3px] border-black p-1 bg-white`}>
                        <QRCode
                            value={`https://www.fezinhadehoje.com.br/sorteio/${displayTicketId}`}
                            size={Number(data.qrcodeWidth) || 240}
                        />
                    </View>
                </View>
            </View>

            {/* OVERLAY WATERMARK (Rendered last to be on top) */}
            {
                data.status === 'CANCELLED' && (
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
                )
            }
        </View >
    );
};
