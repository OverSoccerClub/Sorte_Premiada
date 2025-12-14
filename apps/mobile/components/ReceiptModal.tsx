import React, { useRef, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import tw from '../lib/tailwind';
import { TicketPreview } from './TicketPreview';

interface ReceiptModalProps {
    visible: boolean;
    onClose: () => void;
    ticketData: {
        gameName: string;
        numbers: number[];
        price: string;
        id: string;
        date: string;
        drawDate?: string;
    } | null;
    onPrint?: (imageUri?: string) => Promise<void>;
    autoPrint?: boolean;
}

export function ReceiptModal({ visible, onClose, ticketData, onPrint, autoPrint }: ReceiptModalProps) {
    const viewShotRef = useRef<ViewShot>(null);
    const [isSharing, setIsSharing] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

    // Auto-Print Effect
    React.useEffect(() => {
        if (visible && autoPrint && onPrint && !isPrinting) {
            // Small delay to ensure rendering
            const timer = setTimeout(() => {
                handlePrintPayload();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [visible, autoPrint]);

    if (!ticketData) return null;

    const handlePrintPayload = async () => {
        if (onPrint) {
            setIsPrinting(true);
            try {
                let uri: string | undefined;
                if (viewShotRef.current?.capture) {
                    try {
                        uri = await viewShotRef.current.capture();
                    } catch (err) {
                        console.warn("Failed to capture receipt image for printing", err);
                    }
                }
                await onPrint(uri);
            } finally {
                setIsPrinting(false);
            }
        }
    };

    const handleShare = async () => {
        if (!viewShotRef.current) return;
        setIsSharing(true);
        try {
            // 1. Capture Image
            const uri = await viewShotRef.current?.capture?.();
            if (!uri) return;

            if (!(await Sharing.isAvailableAsync())) {
                alert("Compartilhamento não disponível neste dispositivo");
                return;
            }

            // 2. Format Text
            const is2x500 = ticketData.gameName === "2x500";
            const formattedNums = ticketData.numbers
                .sort((a, b) => a - b)
                .map(n => n.toString().padStart(is2x500 ? 4 : 2, '0'))
                .join(is2x500 ? '  ' : ' ');

            const message = `🍀 *SORTE PREMIADA* 🍀\n🎟️ *Aposta Confirmada*\n\n🏆 Jogo: *${ticketData.gameName}*\n🔢 Números: *${formattedNums}*\n📅 Data: ${ticketData.date}\n💰 Valor: ${ticketData.price}\n🔑 ID: ${ticketData.id.slice(0, 8)}...\n\n✨ Boa Sorte! ✨`;

            // 3. Copy to Clipboard
            await Clipboard.setStringAsync(message);

            // 4. Share (Image)
            await Sharing.shareAsync(uri, {
                dialogTitle: 'Compartilhar Bilhete',
                mimeType: 'image/png',
                UTI: 'public.png'
            });

        } catch (error) {
            console.error("Sharing failed", error);
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
            <View style={tw`flex-1 justify-center items-center bg-black/90 p-4`}>
                <View style={tw`w-full max-w-sm`}>
                    <Text style={tw`text-white font-bold text-2xl mb-2 text-center`}>
                        {onPrint ? "Reimprimir / Compartilhar" : "Aposta Confirmada!"}
                    </Text>
                    {!onPrint && <Text style={tw`text-emerald-400 font-bold text-sm mb-6 text-center uppercase`}>Boa Sorte!</Text>}
                    {onPrint && <View style={tw`h-4`} />}

                    {/* Capture Area */}
                    <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 1.0, result: "tmpfile" }} style={{ backgroundColor: '#ffffff' }}>
                        <TicketPreview
                            gameName={ticketData.gameName}
                            numbers={ticketData.numbers}
                            price={ticketData.price}
                            date={ticketData.date}
                        />
                    </ViewShot>

                    {/* Actions */}
                    <View style={tw`mt-8 gap-3`}>
                        <View style={tw`flex-row gap-3`}>
                            {onPrint && (
                                <TouchableOpacity
                                    style={tw`flex-1 bg-emerald-600 p-4 rounded-2xl flex-row justify-center items-center shadow-lg shadow-emerald-500/30`}
                                    onPress={handlePrintPayload}
                                    disabled={isPrinting || isSharing}
                                >
                                    {isPrinting ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <>
                                            <Ionicons name="print" size={24} color="white" style={tw`mr-2`} />
                                            <Text style={tw`text-white font-bold text-lg`}>Imprimir</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={tw`${onPrint ? 'flex-1' : 'w-full'} bg-green-600 p-4 rounded-2xl flex-row justify-center items-center shadow-lg shadow-green-500/30`}
                                onPress={handleShare}
                                disabled={isSharing || isPrinting}
                            >
                                {isSharing ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Ionicons name="logo-whatsapp" size={24} color="white" style={tw`mr-2`} />
                                        <Text style={tw`text-white font-bold text-lg`}>{onPrint ? "WhatsApp" : "Compartilhar"}</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={tw`bg-gray-800 p-4 rounded-2xl flex-row justify-center items-center border border-gray-700`}
                            onPress={onClose}
                        >
                            <Text style={tw`text-gray-300 font-bold text-lg`}>{onPrint ? "Fechar" : "Novo Jogo"}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
