import React, { useRef, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from '../lib/tailwind';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import { TicketDisplay } from './ticket/TicketDisplay';
import { TicketPrintManager } from './ticket/TicketPrintManager';
import { TicketData } from './ticket/TicketContent';
import { useTicketPrint } from '../hooks/useTicketPrint';
import { useSettings } from '../context/SettingsContext';

interface ReceiptModalProps {
    visible: boolean;
    onClose: () => void;
    ticketData: TicketData | null;
    onPrint?: (imageUri?: string) => Promise<void>; // Kept for backward compat if needed, but we'll use hook
    autoPrint?: boolean;
    isReprint?: boolean;
}

export function ReceiptModal({ visible, onClose, ticketData, autoPrint, isReprint = false }: ReceiptModalProps) {
    const viewShotRef = useRef<ViewShot>(null);
    const { user } = useAuth();
    const { settings: companySettings } = useCompany();
    const { settings: appSettings } = useSettings();
    const [isSharing, setIsSharing] = useState(false);
    const { print, isPrinting } = useTicketPrint();

    // Auto-Print Effect
    React.useEffect(() => {
        if (visible && autoPrint && ticketData && !isPrinting) {
            const timer = setTimeout(() => {
                handlePrint();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [visible, autoPrint, ticketData]);

    if (!ticketData) return null;

    // Prepare full data with vendor info if missing
    const fullTicketData: TicketData = {
        ...ticketData,
        vendorName: ticketData.vendorName || user?.name || user?.username || "Vendedor",
        companyName: ticketData.companyName || companySettings.companyName,
    };

    const handlePrint = async () => {
        await print(fullTicketData, viewShotRef);
    };

    const handleShare = async () => {
        if (!viewShotRef.current) return;
        setIsSharing(true);
        try {
            const uri = await viewShotRef.current?.capture?.();
            if (!uri) return;

            if (!(await Sharing.isAvailableAsync())) {
                alert("Compartilhamento não disponível neste dispositivo");
                return;
            }

            const is2x1000 = ticketData.gameName.includes("2x1000");
            const formattedNums = ticketData.numbers
                .sort((a, b) => a - b)
                .map(n => n.toString().padStart(is2x1000 ? 4 : 2, '0'))
                .join(is2x1000 ? '  ' : ' ');

            const message = `🍀 *${companySettings.companyName}* 🍀\n🎟️ *Aposta Confirmada*\n\n🏆 Jogo: *${ticketData.gameName}*\n🔢 Números: *${formattedNums}*\n📅 Data: ${ticketData.date}\n💰 Valor: ${ticketData.price}\n🔑 Bilhete: ${ticketData.hash || ticketData.ticketId.slice(0, 8)}\n\n✨ Boa Sorte! ✨`;

            await Clipboard.setStringAsync(message);
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
            <View style={tw`flex-1 bg-black/90`}>
                <SafeAreaView style={tw`flex-1 p-4`} edges={['right', 'bottom', 'left', 'top']}>

                    <ScrollView
                        style={tw`w-full flex-1 mb-4`}
                        contentContainerStyle={tw`pb-4`}
                        showsVerticalScrollIndicator={false}
                    >
                        <Text style={tw`text-white font-bold text-xl mb-4 text-center mt-2`}>
                            {isReprint ? "Reimprimir / Compartilhar" : "Aposta Confirmada!"}
                        </Text>

                        <View style={tw`items-center mb-6`}>
                            <TicketDisplay
                                data={fullTicketData}
                                mode="preview"
                                scale={0.80}
                                template={appSettings.ticketTemplate}
                            />
                        </View>
                    </ScrollView>

                    <View style={tw`w-full gap-3 pt-2 bg-transparent`}>
                        <View style={tw`flex-row gap-3 w-full`}>
                            <TouchableOpacity
                                style={tw`flex-1 bg-emerald-600 p-4 rounded-xl flex-row justify-center items-center shadow-lg border border-emerald-500`}
                                onPress={handlePrint}
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

                        <TouchableOpacity
                            style={tw`w-full bg-gray-800 p-4 rounded-xl flex-row justify-center items-center border border-gray-700`}
                            onPress={onClose}
                        >
                            <Text style={tw`text-gray-300 font-bold text-base`}>
                                {isReprint ? "Fechar" : "Novo Jogo"}
                            </Text>
                        </TouchableOpacity>

                        <Text style={tw`text-gray-600 text-xs text-center mt-1`}>Modular-Ticket-v1</Text>
                    </View>
                </SafeAreaView>

                {/* HIDDEN CAPTURE AREA */}
                <TicketPrintManager ref={viewShotRef} data={fullTicketData} template={appSettings.ticketTemplate} />
            </View>
        </Modal>
    );
}
