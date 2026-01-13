import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Modal, FlatList, Image } from "react-native";
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
import { TicketPrintManager } from "../../components/ticket/TicketPrintManager";
import { TicketDisplay } from "../../components/ticket/TicketDisplay";
import { useTicketPrint } from "../../hooks/useTicketPrint";
import { TicketData } from "../../components/ticket/TicketContent";
import { ReceiptModal } from "../../components/ReceiptModal";
import { AppConfig } from "../../constants/AppConfig";
import { useCompany } from "../../context/CompanyContext";
import { useSettings } from "../../context/SettingsContext";


// Animal Data
const ANIMALS = [
    { id: 1, name: "Avestruz", tens: ["01", "02", "03", "04"] },
    { id: 2, name: "Águia", tens: ["05", "06", "07", "08"] },
    { id: 3, name: "Burro", tens: ["09", "10", "11", "12"] },
    { id: 4, name: "Borboleta", tens: ["13", "14", "15", "16"] },
    { id: 5, name: "Cachorro", tens: ["17", "18", "19", "20"] },
    { id: 6, name: "Cabra", tens: ["21", "22", "23", "24"] },
    { id: 7, name: "Carneiro", tens: ["25", "26", "27", "28"] },
    { id: 8, name: "Camelo", tens: ["29", "30", "31", "32"] },
    { id: 9, name: "Cobra", tens: ["33", "34", "35", "36"] },
    { id: 10, name: "Coelho", tens: ["37", "38", "39", "40"] },
    { id: 11, name: "Cavalo", tens: ["41", "42", "43", "44"] },
    { id: 12, name: "Elefante", tens: ["45", "46", "47", "48"] },
    { id: 13, name: "Galo", tens: ["49", "50", "51", "52"] },
    { id: 14, name: "Gato", tens: ["53", "54", "55", "56"] },
    { id: 15, name: "Jacaré", tens: ["57", "58", "59", "60"] },
    { id: 16, name: "Leão", tens: ["61", "62", "63", "64"] },
    { id: 17, name: "Macaco", tens: ["65", "66", "67", "68"] },
    { id: 18, name: "Porco", tens: ["69", "70", "71", "72"] },
    { id: 19, name: "Pavão", tens: ["73", "74", "75", "76"] },
    { id: 20, name: "Peru", tens: ["77", "78", "79", "80"] },
    { id: 21, name: "Touro", tens: ["81", "82", "83", "84"] },
    { id: 22, name: "Tigre", tens: ["85", "86", "87", "88"] },
    { id: 23, name: "Urso", tens: ["89", "90", "91", "92"] },
    { id: 24, name: "Veado", tens: ["93", "94", "95", "96"] },
    { id: 25, name: "Vaca", tens: ["97", "98", "99", "00"] },
];

type Modality = "GRUPO" | "DEZENA" | "CENTENA" | "MILHAR";

export default function JogoDoBichoScreen() {
    const router = useRouter();
    const { token, user } = useAuth();
    const { show, hide } = useLoading();
    const { printerType } = usePrinter();
    const { settings: companySettings } = useCompany();
    const { settings } = useSettings();
    const printViewShotRef = useRef<ViewShot>(null);

    // Game State
    const [gameId, setGameId] = useState<string | null>(null);
    const [gameConfig, setGameConfig] = useState<any>(null);
    const [isLoadingGame, setIsLoadingGame] = useState(true);
    const [modality, setModality] = useState<Modality>("GRUPO");

    // Selection State
    const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
    const [manualInput, setManualInput] = useState("");

    // UI State
    const [modalVisible, setModalVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean; title: string; message: string; type: AlertType;
    }>({ visible: false, title: "", message: "", type: "info" });

    // Receipt Modal State
    const [receiptVisible, setReceiptVisible] = useState(false);
    const [lastTicket, setLastTicket] = useState<TicketData | null>(null);
    const { print, isPrinting } = useTicketPrint();

    // Fetch Game ID on Mount
    useEffect(() => {
        fetchGameId();
    }, []);

    // Game Price State
    const [gamePrice, setGamePrice] = useState<number>(10.00); // Default fallback

    const fetchGameId = async () => {
        setIsLoadingGame(true);
        try {
            const API_URL = AppConfig.api.baseUrl;
            const res = await fetch(`${API_URL}/games`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const games = await res.json();
                const game = games.find((g: any) =>
                    g.name.toLowerCase().includes("bicho") ||
                    g.rules?.type === "BICHO"
                );
                if (game) {
                    setGameId(game.id);
                    setGameConfig(game);
                    if (game.price) setGamePrice(Number(game.price));
                } else {
                    showAlert("Jogo Indisponível", "Jogo do Bicho não encontrado no sistema.", "error");
                }
            }
        } catch (error) {
            console.error("Error fetching games:", error);
            showAlert("Erro", "Falha ao buscar informações do jogo.", "error");
        } finally {
            setIsLoadingGame(false);
        }
    };

    const showAlert = (title: string, message: string, type: AlertType = "info") => {
        setAlertConfig({ visible: true, title, message, type });
    };

    const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

    const handleModalityChange = (newModality: Modality) => {
        setModality(newModality);
        setSelectedNumbers([]);
        setManualInput("");
    };

    const toggleNumber = (num: number) => {
        if (selectedNumbers.includes(num)) {
            setSelectedNumbers(selectedNumbers.filter(n => n !== num));
        } else {
            // Check limits if needed. Usually JB allows multiple bets.
            // Let's limit to 10 selections per bet for now to process?
            if (selectedNumbers.length >= 10) {
                showAlert("Limite", "Máximo de 10 seleções por vez.", "warning");
                return;
            }
            setSelectedNumbers([...selectedNumbers, num]);
        }
    };

    const handleManualAdd = () => {
        if (!manualInput) return;
        const num = parseInt(manualInput, 10);
        if (isNaN(num)) return;

        // Validations based on Modality
        if (modality === 'DEZENA' && (num < 0 || num > 99)) {
            showAlert("Inválido", "Dezena deve ser entre 00 e 99.", "warning"); return;
        }
        if (modality === 'CENTENA' && (num < 0 || num > 999)) {
            showAlert("Inválido", "Centena deve ser entre 000 e 999.", "warning"); return;
        }
        if (modality === 'MILHAR' && (num < 0 || num > 9999)) {
            showAlert("Inválido", "Milhar deve ser entre 0000 e 9999.", "warning"); return;
        }

        if (selectedNumbers.includes(num)) {
            showAlert("Duplicado", "Número já inserido.", "warning");
            return;
        }

        setSelectedNumbers([...selectedNumbers, num]);
        setManualInput("");
    };

    const handleReview = () => {
        if (selectedNumbers.length === 0) {
            showAlert("Atenção", "Selecione pelo menos um número/grupo.", "warning");
            return;
        }
        setModalVisible(true);
    };

    const handlePrint = async () => {
        if (!gameId) {
            showAlert("Erro", "Jogo não configurado. Reinicie o aplicativo.", "error");
            return;
        }
        setModalVisible(false);
        show("Salvando Aposta...");

        try {
            const API_URL = AppConfig.api.baseUrl;
            const payload = {
                gameType: `JB-${modality}`,
                numbers: selectedNumbers,
                amount: gamePrice,
                game: { connect: { id: gameId } }
            };

            const res = await fetch(`${API_URL}/tickets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-device-id': Device.modelName || 'unknown'
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Falha ao salvar: ${errorText}`);
            }

            const ticketData = await res.json();

            hide();

            const ticketObj: TicketData = {
                gameName: `JB - ${modality}`,
                numbers: ticketData.numbers,
                price: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gamePrice),
                ticketId: ticketData.id,
                hash: ticketData.hash,
                possiblePrize: ticketData.possiblePrize ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(ticketData.possiblePrize)) : undefined,
                status: ticketData.status,
                secondChanceNumber: ticketData.secondChanceNumber,
                secondChanceLabel: gameConfig?.secondChanceLabel || ticketData.secondChanceLabel,
                date: new Date(ticketData.createdAt).toLocaleString('pt-BR'),
                drawDate: ticketData.drawDate ? new Date(ticketData.drawDate).toLocaleString('pt-BR') : undefined,
                prizes: gameConfig ? {
                    milhar: gameConfig.prizeMilhar ? `R$ ${Number(gameConfig.prizeMilhar).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : undefined,
                    centena: gameConfig.prizeCentena ? `R$ ${Number(gameConfig.prizeCentena).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : undefined,
                    dezena: gameConfig.prizeDezena ? `R$ ${Number(gameConfig.prizeDezena).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : undefined,
                } : undefined,
                companyName: settings.companyName,
                companyLogoUrl: settings.logoUrl,
                areaName: user?.area?.name,
                city: user?.area?.city,
                alternativeLogoWidth: settings.alternativeLogoWidth,
                alternativeLogoHeight: settings.alternativeLogoHeight,
                alternativeQrWidth: settings.alternativeQrWidth,
                alternativeQrHeight: settings.alternativeQrHeight,
                promptMessage: gameConfig?.promptMessage,
                mainMatchMessage: gameConfig?.mainMatchMessage,
                secondChanceDrawDate: (() => {
                    if (!gameConfig?.secondChanceWeekday || !gameConfig?.secondChanceDrawTime) return undefined;
                    const weekday = parseInt(gameConfig.secondChanceWeekday.toString());
                    const timeStr = gameConfig.secondChanceDrawTime;
                    const now = new Date();
                    const [hours, minutes] = timeStr.split(':').map(Number);
                    const result = new Date(now);
                    result.setHours(hours, minutes, 0, 0);

                    const currentDay = now.getDay();
                    let daysUntil = weekday - currentDay;
                    if (daysUntil < 0 || (daysUntil === 0 && now > result)) {
                        daysUntil += 7;
                    }
                    result.setDate(now.getDate() + daysUntil);

                    const weekDays = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
                    const dayName = weekDays[weekday];
                    const dateStr = result.toLocaleDateString('pt-BR'); // DD/MM/YYYY
                    return `${dayName}, ${dateStr} - ${timeStr}`;
                })()
            };

            setLastTicket(ticketObj);

            // 1. Show Standard Loading
            show("Imprimindo...");

            // 2. Wait for Render
            setTimeout(async () => {
                try {
                    await print(ticketObj, printViewShotRef);
                } catch (err) {
                    console.error("[JB] Print failed", err);
                    showAlert("Aviso", "Aposta salva, mas erro na impressão.", "warning");
                } finally {
                    hide();
                    setReceiptVisible(true);
                }
            }, 800);

        } catch (error: any) {
            hide();
            showAlert("Erro", error.message || "Erro desconhecido.", "error");
        }
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

    const renderAnimalItem = ({ item }: { item: any }) => {
        const isSelected = selectedNumbers.includes(item.id);
        return (
            <TouchableOpacity
                style={tw`flex-1 aspect-square m-1 rounded-lg border ${isSelected ? 'bg-emerald-600 border-emerald-500' : 'bg-gray-800 border-gray-700'} items-center justify-center`}
                onPress={() => toggleNumber(item.id)}
            >
                <Text style={tw`text-xs font-bold ${isSelected ? 'text-white' : 'text-gray-400'}`}>{item.id.toString().padStart(2, '0')}</Text>
                <Text style={tw`text-[10px] text-center ${isSelected ? 'text-emerald-100' : 'text-gray-500'}`}>{item.name}</Text>
            </TouchableOpacity>
        );
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
                    <Text style={tw`text-xl font-bold text-center text-white`}>Jogo do Bicho</Text>
                    <Text style={tw`text-center text-emerald-500 text-xs font-bold uppercase tracking-widest`}>
                        {modality}
                    </Text>
                </View>
                <View style={tw`w-10`} />
            </View>

            {/* Hidden Capture Area */}
            <TicketPrintManager ref={printViewShotRef} data={lastTicket} template={settings.ticketTemplate as 'default' | 'alternative'} />


            <View style={tw`flex-1 p-4`}>
                {/* Modality Tabs */}
                <View style={tw`flex-row bg-gray-800 p-1 rounded-xl mb-4`}>
                    {['GRUPO', 'DEZENA', 'CENTENA', 'MILHAR'].map((m) => (
                        <TouchableOpacity
                            key={m}
                            style={tw`flex-1 py-3 rounded-lg items-center ${modality === m ? 'bg-emerald-600' : 'bg-transparent'}`}
                            onPress={() => handleModalityChange(m as Modality)}
                        >
                            <Text style={tw`font-bold text-[10px] ${modality === m ? 'text-white' : 'text-gray-400'}`}>{m.substring(0, 3)}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Content */}
                {modality === 'GRUPO' ? (
                    <FlatList
                        data={ANIMALS}
                        renderItem={renderAnimalItem}
                        keyExtractor={(item) => item.id.toString()}
                        numColumns={5}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={tw`pb-20`}
                    />
                ) : (
                    <View style={tw`flex-1`}>
                        <View style={tw`bg-gray-800 p-3 rounded-xl mb-4 flex-row items-center gap-2 border border-gray-700`}>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-gray-400 text-xs font-bold uppercase mb-1 ml-1`}>
                                    Digitar {modality.charAt(0) + modality.slice(1).toLowerCase()}
                                </Text>
                                <TextInput
                                    style={tw`bg-gray-900 text-white font-bold p-3 rounded-lg border border-gray-700 text-lg`}
                                    placeholder={modality === 'MILHAR' ? "Ex: 1234" : modality === 'CENTENA' ? "Ex: 123" : "Ex: 12"}
                                    placeholderTextColor="#64748b"
                                    keyboardType="numeric"
                                    maxLength={modality === 'MILHAR' ? 4 : modality === 'CENTENA' ? 3 : 2}
                                    value={manualInput}
                                    onChangeText={setManualInput}
                                    onSubmitEditing={handleManualAdd}
                                />
                            </View>
                            <TouchableOpacity
                                style={tw`bg-emerald-600 h-12 w-12 rounded-lg justify-center items-center shadow-lg mt-5`}
                                onPress={handleManualAdd}
                            >
                                <Ionicons name="add" size={28} color="white" />
                            </TouchableOpacity>
                        </View>

                        {/* Selected List */}
                        <View style={tw`flex-row flex-wrap gap-2`}>
                            {selectedNumbers.map((n, idx) => (
                                <TouchableOpacity
                                    key={`${n}-${idx}`}
                                    style={tw`bg-gray-800 px-3 py-2 rounded-lg border border-gray-700 flex-row items-center`}
                                    onPress={() => toggleNumber(n)}
                                >
                                    <Text style={tw`text-white font-bold mr-2`}>
                                        {n.toString().padStart(
                                            modality === 'MILHAR' ? 4 : modality === 'CENTENA' ? 3 : 2, '0'
                                        )}
                                    </Text>
                                    <Ionicons name="close-circle" size={16} color="#ef4444" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
            </View>

            <View style={tw`p-4 border-t border-gray-800 bg-surface`}>
                <TouchableOpacity
                    style={tw`w-full bg-emerald-600 p-4 rounded-xl items-center shadow-lg shadow-emerald-600/30`}
                    onPress={handleReview}
                >
                    <Text style={tw`text-white font-bold text-xl uppercase tracking-wide`}>Confirmar</Text>
                </TouchableOpacity>
            </View>

            {/* Modal */}
            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={tw`flex-1 bg-black/90`}>
                    <ScrollView
                        contentContainerStyle={tw`flex-grow justify-center items-center p-4 pb-20`}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={tw`w-full max-w-[400px]`}>
                            <Text style={tw`text-white font-bold text-xl mb-4 text-center`}>CONFIRMAÇÃO</Text>
                            <TicketDisplay
                                data={{
                                    gameName: `JB - ${modality}`,
                                    numbers: selectedNumbers,
                                    price: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gamePrice),
                                    date: new Date().toLocaleString('pt-BR'),
                                    ticketId: "PREVIEW",
                                    prizes: gameConfig ? {
                                        milhar: gameConfig.prizeMilhar ? `R$ ${Number(gameConfig.prizeMilhar).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : undefined,
                                        centena: gameConfig.prizeCentena ? `R$ ${Number(gameConfig.prizeCentena).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : undefined,
                                        dezena: gameConfig.prizeDezena ? `R$ ${Number(gameConfig.prizeDezena).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : undefined,
                                    } : undefined,
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
                            <TouchableOpacity style={tw`bg-emerald-600 p-4 rounded-2xl items-center mb-3 mt-6`} onPress={handlePrint}>
                                <Text style={tw`text-white font-bold text-lg`}>Confirmar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={tw`bg-gray-800 p-4 rounded-2xl items-center mb-4`} onPress={() => setModalVisible(false)}>
                                <Text style={tw`text-gray-400 font-bold`}>Voltar</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>

            <ReceiptModal
                visible={receiptVisible}
                onClose={handleCloseReceipt}
                onPrint={handleAutoPrint}
                autoPrint={false}
                isReprint={false}
                ticketData={lastTicket}
            />



            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={hideAlert}
                showCancel={false}
            />

        </SafeAreaView>
    );
}
