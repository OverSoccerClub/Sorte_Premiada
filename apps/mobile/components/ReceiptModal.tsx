import React, { useRef, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import tw from '../lib/tailwind';
import { TicketPreview } from './TicketPreview';
import { TicketPrintLayout } from './TicketPrintLayout';

interface ReceiptModalProps {
    visible: boolean;
    onClose: () => void;
    ticketData: {
        gameName: string;
        numbers: number[];
        price: string;
        id: string;
        hash?: string;
        date: string;
        drawDate?: string;
    } | null;
    onPrint?: (imageUri?: string) => Promise<void>;
    autoPrint?: boolean;
    isReprint?: boolean;
}

export function ReceiptModal({ visible, onClose, ticketData, onPrint, autoPrint, isReprint = false }: ReceiptModalProps) {
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
                        // Switch to PNG for better legibility (no compression artifacts on text)
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
                <ScrollView
                    style={tw`w-full max-h-[90%]`}
                    contentContainerStyle={tw`pb-8`}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={tw`text-white font-bold text-xl mb-4 text-center`}>
                        {isReprint ? "Reimprimir / Compartilhar" : "Aposta Confirmada!"}
                    </Text>

                    {/* 1. Visible, Nice Looking Preview */}
                    <View style={tw`items-center mb-6`}>
                        <TicketPreview
                            gameName={ticketData.gameName}
                            numbers={ticketData.numbers}
                            price={ticketData.price}
                            date={ticketData.date}
                            id={ticketData.id}
                            hash={ticketData.hash}
                            isCapture={false} // Normal aspect ratio for screen
                        />
                    </View>

                    {/* 2. Hidden Capture Area (Distorted for Print) */}
                    <View style={{ position: 'absolute', opacity: 0, zIndex: -10, left: -1000 }}>
                        <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1.0, result: "tmpfile" }} style={{ backgroundColor: '#ffffff', width: 384 }}>
                            <TicketPrintLayout
                                gameName={ticketData.gameName}
                                numbers={ticketData.numbers}
                                price={ticketData.price}
                                date={ticketData.date}
                                ticketId={ticketData.id}
                                hash={ticketData.hash}
                                drawDate={ticketData.drawDate}
                            />
                        </ViewShot>
                    </View>

                    {/* Actions - SIMPLIFIED LAYOUT */}
                    <View style={tw`w-full gap-3`}>
                        {/* Print & Share Row */}
                        <View style={tw`flex-row gap-3 w-full`}>
                            {/* Force Render Print Button */}
                            <TouchableOpacity
                                style={tw`flex-1 bg-emerald-600 p-4 rounded-xl flex-row justify-center items-center shadow-lg border border-emerald-500`}
                                onPress={handlePrintPayload}
                                disabled={isPrinting || isSharing}
                            >
                                {isPrinting ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <>
                                        <Ionicons name="print" size={24} color="white" style={tw`mr-2`} />
                                        <Text style={tw`text-white font-bold text-base uppercase`}>
                                            IMPRIMIR
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={tw`flex-1 bg-green-600 p-4 rounded-xl flex-row justify-center items-center shadow-lg border border-green-500`}
                                onPress={handleShare}
                                disabled={isSharing || isPrinting}
                            >
                                {isSharing ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <>
                                        <Ionicons name="logo-whatsapp" size={24} color="white" style={tw`mr-2`} />
                                        <Text style={tw`text-white font-bold text-base uppercase`}>Zap</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Close Button */}
                        <TouchableOpacity
                            style={tw`w-full bg-gray-800 p-4 rounded-xl flex-row justify-center items-center border border-gray-700`}
                            onPress={onClose}
                        >
                            <Text style={tw`text-gray-300 font-bold text-base`}>
                                {isReprint ? "Fechar" : "Novo Jogo"}
                            </Text>
                        </TouchableOpacity>

                        <Text style={tw`text-gray-600 text-xs text-center mt-2`}>vFix-Layout-v2</Text>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}
