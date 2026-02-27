import { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from "react-native";
import ViewShot from "react-native-view-shot";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Device from 'expo-device';
import { Ionicons } from "@expo/vector-icons";
import tw from "../../lib/tailwind";
import { formatBrazilDate, getBrazilNowDate } from "../../lib/date-utils";
import { useAuth } from "../../context/AuthContext";
import { useLoading } from "../../context/LoadingContext";
import { usePrinter } from "../../context/PrinterContext";
import { CustomAlert, AlertType } from "../../components/CustomAlert";
import { StatusBar } from "expo-status-bar";
import { ReceiptModal } from "../../components/ReceiptModal";
import { TicketPrintManager } from "../../components/ticket/TicketPrintManager";
import { TicketDisplay } from "../../components/ticket/TicketDisplay";
import { useTicketPrint } from "../../hooks/useTicketPrint";
import { TicketData } from "../../components/ticket/TicketContent";
import { AppConfig } from "../../constants/AppConfig";
import { useCompany } from "../../context/CompanyContext";
import { useSettings } from "../../context/SettingsContext";

const API_URL = AppConfig.api.baseUrl;

export default function GameMinutoSorteScreen() {
    const router = useRouter();
    const { token, user } = useAuth();
    const { show, hide } = useLoading();
    const { printerType, connectedPrinter } = usePrinter();
    const { settings: companySettings } = useCompany();
    const { settings } = useSettings();
    const printViewShotRef = useRef<ViewShot>(null);

    // Game State
    const [chosenHour, setChosenHour] = useState<string>("");
    const [gamePrice, setGamePrice] = useState<number>(1);

    // UI State
    const [modalVisible, setModalVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean; title: string; message: string; type: AlertType;
    }>({ visible: false, title: "", message: "", type: "info" });

    // Receipt Modal State
    const [receiptVisible, setReceiptVisible] = useState(false);
    const [lastTicket, setLastTicket] = useState<TicketData | null>(null);
    const { print } = useTicketPrint();

    useEffect(() => {
        // Check printer status on enter
        const timer = setTimeout(() => {
            if (printerType === 'BLE' && !connectedPrinter) {
                showAlert("Impressora", "Impressora não detectada. Verifique a conexão.", "warning");
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    const showAlert = (title: string, message: string, type: AlertType = "info") => {
        setAlertConfig({ visible: true, title, message, type });
    };

    const handleReview = () => {
        if (!printerType) {
            showAlert("Impressora", "Configure a impressora antes de vender.", "warning");
            return;
        }
        if (printerType === 'BLE' && !connectedPrinter) {
            showAlert("Impressora", "Impressora desconectada. Verifique a conexão.", "warning");
            return;
        }

        const hourInt = parseInt(chosenHour, 10);
        if (isNaN(hourInt) || hourInt < 0 || hourInt > 23) {
            showAlert("Hora Inválida", "A hora escolhida deve ser entre 0 e 23.", "warning");
            return;
        }

        if (![1, 5, 10].includes(gamePrice)) {
            showAlert("Valor Inválido", "Valor de aposta deve ser 1, 5 ou 10 reais.", "warning");
            return;
        }

        setModalVisible(true);
    };

    const handlePrint = async () => {
        if (printerType === 'BLE' && !connectedPrinter) {
            showAlert("Impressora", "Impressora desconectada. Conecte novamente.", "error");
            return;
        }

        setModalVisible(false);
        show("Registrando Aposta...");

        try {
            const payload = {
                chosenHour: parseInt(chosenHour, 10),
                amount: gamePrice
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const res = await fetch(`${API_URL}/minuto-sorte/purchase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!res.ok) {
                const errText = await res.text();
                let msg = errText;
                try {
                    const json = JSON.parse(errText);
                    if (json.message) msg = json.message;
                } catch { }
                throw new Error(msg);
            }

            const ticketData = await res.json();
            hide();

            // Prepare Ticket Data
            const drawFormatted = formatBrazilDate(ticketData.drawDate, { dateStyle: 'short' });

            const numbersArray = ticketData.numbers || [];
            const boughtHour = numbersArray[0] ?? ticketData.chosenHour;
            const boughtMinute = numbersArray[1] ?? ticketData.purchaseMinute;

            const fullTicket: TicketData = {
                gameName: "MINUTO DA SORTE",
                numbers: [
                    `Aposta: ${boughtHour}h e ${boughtMinute}m`,
                    `Prêmio Máximo: R$ ${Number(ticketData.possiblePrize).toFixed(2).replace('.', ',')}`,
                    `Concurso: ${drawFormatted}`,
                ],
                price: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ticketData.amount),
                ticketId: ticketData.id,
                hash: ticketData.hash || ticketData.code,
                date: formatBrazilDate(ticketData.createdAt, { dateStyle: 'short', timeStyle: 'medium' }),
                drawDate: ticketData.drawDate,
                ticketNumber: ticketData.hash || ticketData.code,
                terminalId: Device.modelName || "Terminal",
                deviceName: Device.modelName || "Dispositivo",
                vendorName: user?.name || user?.username || "Vendedor",
                companyName: settings.companyName,
                companyLogoUrl: settings.logoUrl,
                status: ticketData.status,
                websiteUrl: companySettings?.websiteUrl || undefined,
                promptMessage: "Escaneie o QR Code para conferir",
                minutoSorteData: {
                    chosenHour: boughtHour,
                    purchaseMinute: boughtMinute,
                    prizeOursHora: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((ticketData.amount / 10) * (ticketData.game?.prizeOursHora || 15)),
                    prizeOursMinuto: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((ticketData.amount / 10) * (ticketData.game?.prizeOursMinuto || 15)),
                    prizeOursAmbos: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((ticketData.amount / 10) * (ticketData.game?.prizeOursAmbos || 500)),
                }
            };

            setLastTicket(fullTicket);
            show("Imprimindo...");

            setTimeout(async () => {
                try {
                    await print(fullTicket, printViewShotRef);
                } catch (e) {
                    showAlert("Erro Impressão", "Aposta salva, mas erro ao imprimir.", "warning");
                } finally {
                    hide();
                    setReceiptVisible(true);
                }
            }, 800);

        } catch (error: any) {
            hide();
            showAlert("Erro", error.message || "Falha desconhecida", "error");
        }
    };

    const handleCloseReceipt = () => {
        setReceiptVisible(false);
        setLastTicket(null);
        setChosenHour("");
    };

    const handleAutoPrint = async () => {
        if (lastTicket) await print(lastTicket, printViewShotRef);
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-background`}>
            <StatusBar style="light" />
            <View style={tw`p-4 border-b border-gray-800 flex-row items-center bg-surface`}>
                <TouchableOpacity onPress={() => router.back()} style={tw`p-2 bg-gray-800 rounded-full`}>
                    <Ionicons name="arrow-back" size={24} color="#94a3b8" />
                </TouchableOpacity>
                <View style={tw`flex-1`}>
                    <Text style={tw`text-xl font-bold text-center text-white`}>Minuto da Sorte</Text>
                </View>
                <View style={tw`w-10`} />
            </View>

            <TicketPrintManager ref={printViewShotRef} data={lastTicket} template="default" />

            <ScrollView style={tw`flex-1 px-4`} contentContainerStyle={tw`pb-20 pt-6`}>

                <View style={tw`bg-surface p-5 rounded-2xl mb-6 border border-gray-800`}>
                    <Text style={tw`text-white font-bold text-lg mb-2`}>Regras do Jogo</Text>
                    <Text style={tw`text-gray-400 text-sm mb-1`}>• Você escolhe uma HORA e ganha pelo MINUTO em que fez a compra.</Text>
                    <Text style={tw`text-gray-400 text-sm mb-1`}>• O sorteio baseia-se no 1º Prêmio da Loteria Federal.</Text>
                    <Text style={tw`text-gray-400 text-sm`}>• O minuto em que você passar a aposta é o seu minuto da sorte!</Text>
                </View>

                <View style={tw`bg-surface p-5 rounded-2xl mb-6 border border-gray-800`}>
                    <Text style={tw`text-gray-300 font-bold mb-4 uppercase text-xs tracking-wider`}>Qual a hora da sorte? (0 a 23)</Text>
                    <View style={tw`flex-row items-center border border-gray-700 bg-gray-900 rounded-xl px-4 py-2`}>
                        <Ionicons name="time-outline" size={24} color="#10b981" />
                        <TextInput
                            style={tw`flex-1 text-white text-2xl font-bold p-3 text-center`}
                            keyboardType="number-pad"
                            maxLength={2}
                            placeholder="Ex: 15"
                            placeholderTextColor="#4b5563"
                            value={chosenHour}
                            onChangeText={setChosenHour}
                            onSubmitEditing={handleReview}
                        />
                    </View>
                </View>

                <View style={tw`bg-surface p-5 rounded-2xl mb-6 border border-gray-800`}>
                    <Text style={tw`text-gray-300 font-bold mb-4 uppercase text-xs tracking-wider`}>Valor da Aposta</Text>
                    <View style={tw`flex-row gap-3`}>
                        {[1, 5, 10].map((val) => (
                            <TouchableOpacity
                                key={val}
                                style={tw`flex-1 py-4 items-center justify-center rounded-xl border ${gamePrice === val ? 'bg-emerald-600 border-emerald-500' : 'bg-gray-800 border-gray-700'}`}
                                onPress={() => setGamePrice(val)}
                            >
                                <Text style={tw`font-bold text-lg ${gamePrice === val ? 'text-white' : 'text-gray-400'}`}>R$ {val}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

            </ScrollView>

            <View style={tw`p-4 border-t border-gray-800 bg-surface`}>
                <TouchableOpacity
                    style={tw`w-full bg-emerald-600 p-4 rounded-xl items-center shadow-lg shadow-emerald-600/30 ${!chosenHour ? 'opacity-50' : ''}`}
                    onPress={handleReview}
                    disabled={!chosenHour}
                >
                    <Text style={tw`text-white font-bold text-xl uppercase tracking-wide`}>
                        GERAR APOSTA - R$ {gamePrice.toFixed(2)}
                    </Text>
                </TouchableOpacity>
            </View>

            {modalVisible && (
                <View style={[tw`absolute inset-0 z-50 bg-black/90`, { paddingTop: Device.osName === 'Android' ? 30 : 0 }]}>
                    <View style={tw`flex-1 relative`}>
                        <ScrollView contentContainerStyle={tw`items-center p-4 pt-4 pb-40`}>
                            <View style={tw`w-full max-w-[400px] items-center`}>
                                <Text style={tw`text-white font-bold text-xl mb-4 text-center mt-4`}>CONFIRMAR APOSTA</Text>
                                <TicketDisplay
                                    data={{
                                        gameName: "MINUTO DA SORTE",
                                        numbers: [
                                            `Aposta: ${chosenHour}h e ??m`,
                                            `Prêmio Máximo: R$ ${(gamePrice * 15).toFixed(2).replace('.', ',')}`,
                                        ],
                                        price: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gamePrice),
                                        date: formatBrazilDate(getBrazilNowDate(), { dateStyle: 'short', timeStyle: 'medium' }),
                                        ticketId: "PREVIEW",
                                        companyName: settings.companyName,
                                        companyLogoUrl: settings.logoUrl,
                                        websiteUrl: companySettings?.websiteUrl || undefined,
                                        minutoSorteData: {
                                            chosenHour: parseInt(chosenHour, 10),
                                            purchaseMinute: getBrazilNowDate().getMinutes(),
                                            prizeOursHora: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((gamePrice / 10) * (15)), // Preview constant
                                            prizeOursMinuto: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((gamePrice / 10) * (15)),
                                            prizeOursAmbos: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((gamePrice / 10) * (500)),
                                        }
                                    }}
                                    mode="preview"
                                    scale={0.8}
                                />
                            </View>
                        </ScrollView>

                        <View style={tw`absolute bottom-0 w-full bg-gray-900 border-t border-gray-800 pb-4 pt-4 px-4 shadow-2xl`}>
                            <View style={tw`flex-row gap-3 w-full max-w-[400px] mx-auto`}>
                                <TouchableOpacity style={tw`flex-1 bg-gray-800 p-4 rounded-xl items-center border border-gray-700`} onPress={() => setModalVisible(false)}>
                                    <Text style={tw`text-gray-400 font-bold uppercase tracking-wide`}>Voltar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={tw`flex-1 bg-emerald-600 p-4 rounded-xl items-center shadow-lg shadow-emerald-600/20`} onPress={handlePrint}>
                                    <View style={tw`flex-row items-center`}>
                                        <Ionicons name="print" size={20} color="white" style={tw`mr-2`} />
                                        <Text style={tw`text-white font-bold text-lg uppercase tracking-wide`}>Confirmar</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                            <View style={{ height: Device.osName === 'iOS' ? 20 : 0 }} />
                        </View>
                    </View>
                </View>
            )}

            <ReceiptModal
                visible={receiptVisible}
                onClose={handleCloseReceipt}
                onPrint={handleAutoPrint}
                ticketData={lastTicket}
                autoPrint={false}
                isReprint={false}
                template="default"
            />

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
                showCancel={false}
            />
        </SafeAreaView>
    );
}
