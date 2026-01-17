import { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, Animated } from "react-native";
import ViewShot from "react-native-view-shot";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Device from "expo-device";
import tw from "../../lib/tailwind";
import { useAuth } from "../../context/AuthContext";
import { useLoading } from "../../context/LoadingContext";
import { usePrinter } from "../../context/PrinterContext";
import { CustomAlert, AlertType } from "../../components/CustomAlert";
import { StatusBar } from "expo-status-bar";
import { VersionFooter } from "../../components/VersionFooter";
import { ReceiptModal } from "../../components/ReceiptModal";
import { TicketPrintManager } from "../../components/ticket/TicketPrintManager";
import { TicketDisplay } from "../../components/ticket/TicketDisplay";
import { useTicketPrint } from "../../hooks/useTicketPrint";
import { TicketData } from "../../components/ticket/TicketContent";
import { AppConfig } from "../../constants/AppConfig";
import { useCompany } from "../../context/CompanyContext";
import { useSettings } from "../../context/SettingsContext";


// --- Number Ball Component ---
const NumberBall = ({ num, isSelected, onToggle }: { num: number, isSelected: boolean, onToggle: () => void }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const colorAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: isSelected ? 1.1 : 1,
                useNativeDriver: false,
                friction: 5,
            }),
            Animated.timing(colorAnim, {
                toValue: isSelected ? 1 : 0,
                duration: 300,
                useNativeDriver: false,
            }),
        ]).start();
    }, [isSelected]);

    const backgroundColor = colorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["#1e293b", "#10b981"], // surface -> emerald-500
    });

    const borderColor = colorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["#334155", "#059669"], // slate-700 -> emerald-600
    });

    const textColor = isSelected ? "text-white" : "text-gray-400";

    // Format number with leading zero
    const formattedNum = num.toString().padStart(2, "0");

    return (
        <TouchableOpacity onPress={onToggle} activeOpacity={0.8}>
            <Animated.View
                style={[
                    tw`w-10 h-10 rounded-full justify-center items-center m-1 border-2`,
                    {
                        transform: [{ scale: scaleAnim }],
                        backgroundColor: backgroundColor,
                        borderColor: borderColor,
                    },
                ]}
            >
                <Text style={tw`font-bold text-base ${textColor}`}>{formattedNum}</Text>
            </Animated.View>
        </TouchableOpacity>
    );
};

export default function MegaSenaScreen() {
    const router = useRouter();
    const { token, user } = useAuth();
    const { show, hide } = useLoading(); // Global loading
    const { printerType } = usePrinter();
    const { settings: companySettings } = useCompany();
    const { settings } = useSettings();
    const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const viewShotRef = useRef(null);
    const printViewShotRef = useRef<ViewShot>(null);

    // ... (rest of state)

    // ... (toggleNumber, handleReview, showAlert, hideAlert remain same)

    // I need to be careful not to replace the whole file logic, just the handlePrint part.
    // I will target handlePrint specifically.


    // Alert State
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type: AlertType;
        showCancel?: boolean;
        onConfirm?: () => void;
        confirmText?: string;
        cancelText?: string;
    }>({
        visible: false,
        title: "",
        message: "",
        type: "success",
    });

    // Receipt Modal State
    const [receiptVisible, setReceiptVisible] = useState(false);
    const [lastTicket, setLastTicket] = useState<TicketData | null>(null);
    const { print, isPrinting } = useTicketPrint();

    const numbers = Array.from({ length: 60 }, (_, i) => i + 1);

    const showAlert = (
        title: string,
        message: string,
        type: AlertType = "success",
        showCancel = false,
        onConfirm?: () => void,
        confirmText?: string,
        cancelText?: string
    ) => {
        setAlertConfig({ visible: true, title, message, type, showCancel, onConfirm, confirmText, cancelText });
    };

    const hideAlert = () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
    };

    const toggleNumber = (num: number) => {
        if (selectedNumbers.includes(num)) {
            setSelectedNumbers(selectedNumbers.filter((n) => n !== num));
        } else {
            if (selectedNumbers.length >= 6) {
                showAlert("Limite Atingido", "Você só pode escolher 6 números para esta aposta.", "warning");
                return;
            }
            setSelectedNumbers([...selectedNumbers, num]);
        }
    };

    const handleReview = () => {
        // Check if printer is configured
        if (!printerType) {
            showAlert(
                "Impressora Não Configurada",
                "Por favor, configure a impressora antes de realizar vendas. Acesse o menu de configurações.",
                "warning"
            );
            return;
        }

        if (selectedNumbers.length !== 6) {
            showAlert("Aposta Incompleta", "Por favor, selecione exatamente 6 números para continuar.", "error");
            return;
        }
        setModalVisible(true);
    };

    // Game Price State
    const [gamePrice, setGamePrice] = useState<number>(5.00); // Default fallback
    const [gameId, setGameId] = useState<string | null>(null);

    useEffect(() => {
        const fetchGameDetails = async () => {
            try {
                const API_URL = AppConfig.api.baseUrl;
                const res = await fetch(`${API_URL}/games`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const games = await res.json();
                    // More robust find: case insensitive and handles variations
                    const game = games.find((g: any) =>
                        g.name.toLowerCase().includes("mega") &&
                        g.name.toLowerCase().includes("sena")
                    );

                    if (game) {
                        setGamePrice(Number(game.price));
                        setGameId(game.id);
                    } else {
                        showAlert("Jogo Indisponível", "Configuração da Mega Sena não encontrada.", "error");
                    }
                }
            } catch (error) {
                console.error("Failed to fetch game price", error);
                showAlert("Erro de Conexão", "Não foi possível carregar as informações do jogo.", "error");
            }
        };
        fetchGameDetails();
    }, []);

    // ... (rest of code)

    const handlePrint = async () => {
        if (!gameId) {
            showAlert("Erro", "O jogo não está configurado corretamente. Tente reiniciar o app.", "error");
            return;
        }

        setModalVisible(false);
        show("Processando Aposta...");

        try {
            const API_URL = AppConfig.api.baseUrl;

            const res = await fetch(`${API_URL}/tickets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-device-id': Device.modelName || 'unknown'
                },
                body: JSON.stringify({
                    gameType: "Mega Sena",
                    numbers: selectedNumbers,
                    amount: gamePrice,
                    game: { connect: { id: gameId } }
                })
            });

            if (!res.ok) {
                const errorText = await res.text();
                let errorMessage = errorText;

                // Try to parse JSON error
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.message) {
                        errorMessage = errorJson.message;
                    }
                } catch (e) {
                    // fallback to text
                }

                // Check for Accountability Block
                if (errorMessage.includes("falta de prestação de contas")) {
                    throw new Error("⚠️ Bloqueio Financeiro\n\nVocê possui pendências na prestação de contas. Para voltar a vender, realize o fechamento do caixa e aguarde a validação do financeiro.");
                }

                // Check for paused series
                if (errorMessage.includes("pausadas") || errorMessage.includes("bloqueada")) {
                    throw new Error("⚠️ Vendas Pausadas\n\nEsta praça está temporariamente bloqueada para vendas. Aguarde a liberação do administrador.");
                }

                throw new Error(errorMessage);
            }

            const ticketData = await res.json();

            hide();

            const fullTicket: TicketData = {
                gameName: "Mega Sena",
                numbers: selectedNumbers.map(String),
                price: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gamePrice),
                ticketId: ticketData.id,
                hash: ticketData.hash,
                date: new Date(ticketData.createdAt).toLocaleString('pt-BR'),
                drawDate: ticketData.drawDate ? new Date(ticketData.drawDate).toLocaleString('pt-BR') : undefined,
                series: ticketData.series,
                secondChanceNumber: ticketData.secondChanceNumber,
                secondChanceDrawDate: ticketData.secondChanceDrawDate ? new Date(ticketData.secondChanceDrawDate).toLocaleString('pt-BR', { weekday: 'long', hour: '2-digit', minute: '2-digit' }) : undefined,
                secondChanceLabel: "SEGUNDA CHANCE",
                status: ticketData.status,
                companyName: settings.companyName,
                companyLogoUrl: settings.logoUrl,
                areaName: user?.area?.name,
                city: user?.area?.city,
                alternativeLogoWidth: settings.alternativeLogoWidth,
                alternativeLogoHeight: settings.alternativeLogoHeight,
                alternativeQrWidth: settings.alternativeQrWidth,
                alternativeQrHeight: settings.alternativeQrHeight,
            };

            setLastTicket(fullTicket);

            // 1. Show Standard Loading
            show("Imprimindo...");

            // 2. Wait for Render and Print
            setTimeout(async () => {
                try {
                    await print(fullTicket, printViewShotRef);
                } catch (err) {
                    console.error("[MegaSena] Print failed", err);
                    showAlert("Aviso", "Aposta salva, mas houve erro na impressão.", "warning");
                } finally {
                    hide();
                    setReceiptVisible(true);
                    setSelectedNumbers([]);
                }
            }, 800);

        } catch (error) {
            hide();
            console.error(error);
            setTimeout(() => {
                showAlert("Erro", "Não foi possível salvar a aposta. Verifique sua conexão.", "error");
            }, 300);
        }
    };

    const handleClear = () => {
        if (selectedNumbers.length === 0) return;

        showAlert(
            "Limpar Aposta",
            "Tem certeza que deseja limpar todos os números selecionados?",
            "warning",
            true,
            () => {
                setSelectedNumbers([]);
                hideAlert();
            },
            "Sim, Limpar",
            "Cancelar"
        );
    };

    const handleCloseReceipt = () => {
        setReceiptVisible(false);
        setLastTicket(null);
        setSelectedNumbers([]);
    };




    const handleAutoPrint = async () => {
        if (!lastTicket) return;
        await print(lastTicket, printViewShotRef);
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-background`}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={tw`p-4 border-b border-gray-800 flex-row items-center bg-surface`}>
                <TouchableOpacity onPress={() => router.back()} style={tw`p-2 bg-gray-800 rounded-full`}>
                    <Ionicons name="arrow-back" size={24} color="#94a3b8" />
                </TouchableOpacity>
                <View style={tw`flex-1`}>
                    <Text style={tw`text-xl font-bold text-center text-white`}>Mega Sena</Text>
                    <Text style={tw`text-center text-emerald-500 text-xs font-bold uppercase tracking-widest`}>Selecione 6 números</Text>
                </View>
                <View style={tw`w-10`} />
            </View>

            {/* Hidden Capture Area */}
            <TicketPrintManager ref={printViewShotRef} data={lastTicket} template={settings.ticketTemplate as 'default' | 'alternative'} />


            {/* Grid de Números */}
            <ScrollView
                style={tw`flex-1`}
                overScrollMode="never"
                contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingVertical: 16, paddingBottom: 80 }}
            >
                <View style={tw`w-[90%] max-w-[400px] flex-row flex-wrap justify-center`}>
                    {numbers.map((num) => (
                        <NumberBall
                            key={num}
                            num={num}
                            isSelected={selectedNumbers.includes(num)}
                            onToggle={() => toggleNumber(num)}
                        />
                    ))}
                </View>
            </ScrollView>
            <VersionFooter />

            {/* Footer */}
            <View style={tw`p-4 border-t border-gray-800 bg-surface`}>
                <View style={tw`flex-row justify-between mb-4`}>
                    <Text style={tw`text-lg font-bold text-gray-400`}>Selecionados:</Text>
                    <Text style={tw`text-lg font-bold text-emerald-500`}>{selectedNumbers.length}/6</Text>
                </View>

                <View style={tw`flex-row gap-3`}>
                    <TouchableOpacity
                        style={tw`w-16 rounded-xl items-center justify-center bg-gray-800 border border-gray-700`}
                        onPress={handleClear}
                    >
                        <Ionicons name="trash-outline" size={24} color="#ef4444" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={tw`flex-1 p-4 rounded-xl items-center shadow-lg ${selectedNumbers.length === 6 ? "bg-emerald-600 shadow-emerald-600/50" : "bg-gray-700"}`}
                        onPress={handleReview}
                        disabled={selectedNumbers.length !== 6}
                    >
                        <Text style={tw`text-white font-bold text-xl uppercase tracking-wide`}>Revisar</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Modal de Preview */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={tw`flex-1 bg-black/90`}>
                    <ScrollView
                        contentContainerStyle={tw`flex-grow justify-center items-center p-4 py-10 pb-20`}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={tw`w-[90%] max-w-[400px] items-center`}>
                            <Text style={tw`text-white font-bold text-lg mb-6 uppercase tracking-widest text-center`}>Confira sua Aposta</Text>

                            <View style={tw`w-full mb-8 shadow-2xl shadow-black items-center`}>
                                <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9, result: "tmpfile" }} style={{ backgroundColor: 'white' }}>
                                    <TicketDisplay
                                        data={{
                                            gameName: "Mega Sena",
                                            numbers: selectedNumbers.map(String),
                                            price: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gamePrice),
                                            date: new Date().toLocaleString('pt-BR'),
                                            ticketId: "PREVIEW",
                                            companyName: settings.companyName,
                                            companyLogoUrl: settings.logoUrl,
                                            areaName: user?.area?.name,
                                            city: user?.area?.city,
                                            alternativeLogoWidth: settings.alternativeLogoWidth,
                                            alternativeLogoHeight: settings.alternativeLogoHeight,
                                            alternativeQrWidth: settings.alternativeQrWidth,
                                            alternativeQrHeight: settings.alternativeQrHeight,
                                        }}
                                        mode="preview"
                                        template={settings.ticketTemplate as 'default' | 'alternative'}
                                    />
                                </ViewShot>
                            </View>

                            <View style={tw`w-full gap-3 pb-8`}>
                                <TouchableOpacity
                                    style={tw`w-full bg-emerald-600 p-4 rounded-xl items-center shadow-lg shadow-emerald-600/40 border border-emerald-500`}
                                    onPress={handlePrint}
                                >
                                    <View style={tw`flex-row items-center`}>
                                        <Ionicons name="print" size={24} color="white" style={tw`mr-2`} />
                                        <Text style={tw`text-white font-bold text-lg uppercase`}>Confirmar e Imprimir</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={tw`w-full bg-gray-800 p-4 rounded-xl items-center border border-gray-700`}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <Text style={tw`text-gray-300 font-bold text-lg`}>Voltar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Modal>

            {/* Custom Alert */}
            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={hideAlert}
                showCancel={alertConfig.showCancel}
                onConfirm={alertConfig.onConfirm}
                confirmText={alertConfig.confirmText}
                cancelText={alertConfig.cancelText}
            />

            <ReceiptModal
                visible={receiptVisible}
                onClose={handleCloseReceipt}
                onPrint={handleAutoPrint}
                autoPrint={false}
                isReprint={false}
                ticketData={lastTicket}
            />


        </SafeAreaView>
    );
}
