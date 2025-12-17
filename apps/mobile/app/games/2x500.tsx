import { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, ActivityIndicator, Alert, FlatList } from "react-native";
import ViewShot from "react-native-view-shot";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import tw from "../../lib/tailwind";
import { useAuth } from "../../context/AuthContext";
import { useLoading } from "../../context/LoadingContext";
import { usePrinter } from "../../context/PrinterContext";
import { CustomAlert, AlertType } from "../../components/CustomAlert";
import { StatusBar } from "expo-status-bar";
import { VersionFooter } from "../../components/VersionFooter";
import { TicketPreview } from "../../components/TicketPreview";
import { AppConfig } from "../../constants/AppConfig";
import { printTicket } from "../../services/printing.service";

import { ReceiptModal } from "../../components/ReceiptModal";


export default function Game2x500Screen() {
    const router = useRouter();
    const { token } = useAuth();
    const { show, hide } = useLoading();
    const { printerType } = usePrinter();
    const printViewShotRef = useRef<ViewShot>(null);

    // Game State
    const [gameId, setGameId] = useState<string | null>(null);
    const [isLoadingGame, setIsLoadingGame] = useState(true);
    const [gamePrice, setGamePrice] = useState<number>(10.00); // Default fallback
    const [soldNumbers, setSoldNumbers] = useState<Set<number>>(new Set());
    const [isLoadingSold, setIsLoadingSold] = useState(false);

    // Selection State
    const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
    const [manualInput, setManualInput] = useState("");

    // Auto Pick State (Surpresinha) - Just a UI toggle now
    const [isAutoPick, setIsAutoPick] = useState(false);

    // Grid State
    const [currentRangeStart, setCurrentRangeStart] = useState(0); // 0, 1000, 2000...
    const RANGE_SIZE = 1000;

    // UI State
    const [modalVisible, setModalVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean; title: string; message: string; type: AlertType;
        showCancel?: boolean; onConfirm?: () => void; confirmText?: string; cancelText?: string;
    }>({ visible: false, title: "", message: "", type: "info" });

    // Receipt Modal State
    const [receiptVisible, setReceiptVisible] = useState(false);
    const [lastTicket, setLastTicket] = useState<any>(null);

    // Fetch Game ID on Mount
    useEffect(() => {
        fetchGameId();
    }, []);

    const fetchGameId = async () => {
        show("Carregando Jogo...");
        try {
            const API_URL = AppConfig.api.baseUrl;
            const res = await fetch(`${API_URL}/games`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const games = await res.json();
                const game = games.find((g: any) => g.name === "2x500");
                if (game) {
                    setGameId(game.id);
                    if (game.price) setGamePrice(Number(game.price));
                    await fetchSoldNumbers(game.id);
                } else {
                    showAlert("Jogo Indisponível", "Não há um jogo '2x500' ativo no momento.", "error");
                    setIsLoadingGame(false);
                }
            }
        } catch (error) {
            console.error("Error fetching games:", error);
            showAlert("Erro", "Falha ao buscar informações do jogo.", "error");
            setIsLoadingGame(false);
        } finally {
            hide();
            setIsLoadingGame(false); // Ensure local state is also updated
        }
    };

    const fetchSoldNumbers = async (id: string) => {
        setIsLoadingSold(true);
        try {
            const API_URL = AppConfig.api.baseUrl;
            const res = await fetch(`${API_URL}/tickets/availability/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const soldArray = await res.json();
                setSoldNumbers(new Set(soldArray));
            }
        } catch (error) {
            console.error("Error fetching sold numbers:", error);
        } finally {
            setIsLoadingGame(false);
            setIsLoadingSold(false);
        }
    };

    const showAlert = (title: string, message: string, type: AlertType = "info", showCancel?: boolean, onConfirm?: () => void, confirmText?: string, cancelText?: string) => {
        setAlertConfig({ visible: true, title, message, type, showCancel, onConfirm, confirmText, cancelText });
    };

    const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

    const toggleNumber = (num: number) => {
        // If in AutoPick mode, switch to manual if user taps a number? 
        // Or just block? Let's just switch to manual for better UX.
        if (isAutoPick) setIsAutoPick(false);

        if (soldNumbers.has(num)) return;

        if (selectedNumbers.includes(num)) {
            setSelectedNumbers(selectedNumbers.filter(n => n !== num));
        } else {
            if (selectedNumbers.length >= 4) {
                showAlert("Limite Atingido", "Você já selecionou 4 milhares.", "warning");
                return;
            }
            setSelectedNumbers([...selectedNumbers, num]);
        }
    };

    const handleManualAdd = () => {
        if (!manualInput) return;

        const num = parseInt(manualInput, 10);

        if (isNaN(num)) {
            showAlert("Inválido", "Digite apenas números.", "warning");
            return;
        }

        if (num < 0 || num > 9999) {
            showAlert("Inválido", "O número deve ser entre 0000 e 9999.", "warning");
            return;
        }

        if (soldNumbers.has(num)) {
            showAlert("Indisponível", `O número ${num.toString().padStart(4, '0')} já foi vendido.`, "error");
            return;
        }

        if (selectedNumbers.includes(num)) {
            showAlert("Duplicado", "Você já selecionou este número.", "warning");
            return;
        }

        if (selectedNumbers.length >= 4) {
            showAlert("Limite", "Você já selecionou 4 números.", "warning");
            return;
        }

        setSelectedNumbers([...selectedNumbers, num]);
        setManualInput("");
    };

    const generateRandomNumbers = () => {
        const available = [];
        // Only scan current range? NO, scan ALL 10000.
        // Scanning 10k is fast (ms).
        for (let i = 0; i < 10000; i++) {
            if (!soldNumbers.has(i)) {
                available.push(i);
            }
        }

        if (available.length < 4) {
            showAlert("Esgotado", "Não há números suficientes disponíveis.", "error");
            return false;
        }

        const picked: number[] = [];
        while (picked.length < 4) {
            const randomIndex = Math.floor(Math.random() * available.length);
            const num = available[randomIndex];
            if (!picked.includes(num)) {
                picked.push(num);
                // remove from available to avoid duplicate pick in same batch? 
                // Simple check implies unique.
                // We just splice it out to be safe and fast.
                available.splice(randomIndex, 1);
            }
        }
        setSelectedNumbers(picked);
        return true;
    };

    const handleReview = () => {
        if (isAutoPick) {
            // Generate numbers NOW
            const success = generateRandomNumbers();
            if (success) {
                setModalVisible(true);
            }
        } else {
            if (selectedNumbers.length !== 4) {
                showAlert("Incompleto", "Selecione 4 milhares ou use a Surpresinha.", "warning");
                return;
            }
            setModalVisible(true);
        }
    };

    const handleBackFromModal = () => {
        setModalVisible(false);
        if (isAutoPick) {
            // If they cancel Surpresinha preview, should we clear numbers?
            // User might want to keep them. Let's keep them but maybe switch to manual mode visually?
            // Or just keep as is.
            // Let's clear them to allow retry.
            setSelectedNumbers([]);
        }
    };



    const handlePrint = async () => {
        if (!gameId) {
            showAlert("Erro", "Jogo não identificado.", "error");
            return;
        }

        setModalVisible(false);
        show("Salvando Aposta...");

        try {
            const API_URL = AppConfig.api.baseUrl;
            const payload = {
                gameType: "2x500",
                numbers: selectedNumbers, // Always use selected numbers (explicit)
                amount: 10.00,
                game: { connect: { id: gameId } } // Backend expects gameId logic? No, check my backend fix.
                // Wait, I fixed backend to use `gameId` directly in Prisma.
                // Payload sent to Controller -> Service. 
                // Service: `...(data.game?.connect?.id ? { gameId: data.game.connect.id } : {})`
                // So I MUST send `game: { connect: { id: ... } }` for logic to work.
                // OR I can update payload here if I wanted, but Service fix handles it.
            };

            const res = await fetch(`${API_URL}/tickets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorText = await res.text();
                // If sold, refresh availability
                if (errorText.includes("already sold")) {
                    fetchSoldNumbers(gameId);
                    throw new Error("Alguns números escolhidos acabaram de ser vendidos! Atualizando...");
                }
                throw new Error(`Falha ao salvar: ${errorText}`);
            }

            const ticketData = await res.json();
            const finalNumbers = ticketData.numbers || [];



            hide();
            // Refresh sold numbers for next bet
            fetchSoldNumbers(gameId);

            // Prepare Receipt Data & Auto Print
            setLastTicket({
                gameName: "2x500",
                numbers: finalNumbers,
                price: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gamePrice),
                id: ticketData.id,
                date: new Date(ticketData.createdAt).toLocaleString('pt-BR'),
                drawDate: ticketData.drawDate ? new Date(ticketData.drawDate).toLocaleString('pt-BR') : undefined
            });

            // 1. Show Standard Loading
            show("Imprimindo Jeque...");

            // 2. Wait for Render (TicketPreview needs to update with lastTicket)
            setTimeout(async () => {
                try {
                    // 3. Capture Image
                    let uri = undefined;
                    try {
                        if (printViewShotRef.current?.capture) {
                            uri = await printViewShotRef.current.capture();
                        }
                    } catch (capErr) {
                        console.warn("Capture failed", capErr);
                    }

                    // 4. Print
                    await printTicket(
                        finalNumbers,
                        ticketData.id,
                        new Date(),
                        gamePrice,
                        "2x500",
                        printerType,
                        uri // Pass the image!
                    );
                } catch (err) {
                    console.error("Print failed", err);
                    showAlert("Aviso", "Aposta salva, mas erro na impressão.", "warning");
                } finally {
                    hide();
                    setReceiptVisible(true);
                }
            }, 1000); // 1s to ensure render

        } catch (error: any) {
            hide();
            setTimeout(() => {
                showAlert("Erro", error.message || "Erro desconhecido.", "error");
            }, 300);
        }
    };

    const handleCloseReceipt = () => {
        setReceiptVisible(false);
        setLastTicket(null);
        // Reset Game
        setSelectedNumbers([]);
        setIsAutoPick(false);
        setCurrentRangeStart(0);
    };

    const handleAutoPrint = async (imageUri?: string) => {
        if (!lastTicket) return;
        const success = await printTicket(
            lastTicket.numbers,
            lastTicket.id,
            new Date(), // Current date for print or parse from lastTicket.date if needed
            gamePrice,
            "2x500",
            printerType,
            imageUri
        );
        if (success) {
            showAlert("Sucesso", "Bilhete enviado para impressão!", "success");
        } else {
            showAlert("Erro", "Falha ao enviar para impressão.", "error");
        }
    };

    // Grid Render Item (Optimized)
    const renderGridItem = ({ item }: { item: number }) => {
        const isSold = soldNumbers.has(item);
        const isSelected = selectedNumbers.includes(item);

        let bgClass = "bg-gray-800";
        let textClass = "text-white";
        let borderClass = "border-gray-700";

        if (isSold) {
            bgClass = "bg-gray-900";
            textClass = "text-gray-600";
            borderClass = "border-gray-800";
        } else if (isSelected) {
            bgClass = "bg-emerald-600";
            textClass = "text-white";
            borderClass = "border-emerald-500";
        }

        return (
            <TouchableOpacity
                style={tw`flex-1 aspect-square m-1 rounded-lg justify-center items-center border ${bgClass} ${borderClass}`}
                disabled={isSold}
                onPress={() => toggleNumber(item)}
            >
                <Text style={tw`text-xs font-bold ${textClass}`}>
                    {item.toString().padStart(4, '0')}
                </Text>
            </TouchableOpacity>
        );
    };

    // Prepare data for current range
    const getRangeData = () => {
        const data = [];
        const end = Math.min(currentRangeStart + RANGE_SIZE, 10000);
        for (let i = currentRangeStart; i < end; i++) {
            data.push(i);
        }
        return data;
    };

    // Range Tabs
    const renderRangeTabs = () => {
        const tabs = [];
        for (let i = 0; i < 10000; i += 1000) {
            const label = `${i / 1000}k`; // 0k, 1k, 2k...
            const isActive = currentRangeStart === i;
            tabs.push(
                <TouchableOpacity
                    key={i}
                    style={tw`px-3 py-2 rounded-lg mr-2 ${isActive ? 'bg-primary' : 'bg-gray-800 border border-gray-700'}`}
                    onPress={() => setCurrentRangeStart(i)}
                >
                    <Text style={tw`text-xs font-bold ${isActive ? 'text-white' : 'text-gray-400'}`}>{label}</Text>
                </TouchableOpacity>
            );
        }
        return (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-4 flex-grow-0`}>
                {tabs}
            </ScrollView>
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
                    <Text style={tw`text-xl font-bold text-center text-white`}>2x500</Text>
                    <Text style={tw`text-center text-emerald-500 text-xs font-bold uppercase tracking-widest`}>
                        {isLoadingGame ? "Carregando..." : (soldNumbers.size > 0 ? `${soldNumbers.size} Vendidos` : "Jogo Ativo")}
                    </Text>
                </View>
                <View style={tw`w-10`}>
                    {!isLoadingGame && (
                        <TouchableOpacity onPress={() => gameId && fetchSoldNumbers(gameId)}>
                            <Ionicons name="refresh" size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={tw`flex-1 items-center`}>

                {/* Hidden ViewShot for Printing High Quality Ticket */}
                <View style={{ position: 'absolute', top: -2000, left: 0, opacity: 0 }}>
                    <ViewShot ref={printViewShotRef} options={{ format: "png", quality: 1.0, result: "tmpfile" }} style={{ backgroundColor: '#ffffff', width: 384 }}>
                        {lastTicket && (
                            <TicketPreview
                                gameName="2x500"
                                numbers={lastTicket.numbers}
                                price={lastTicket.price}
                                date={lastTicket.date}
                                id={lastTicket.id}
                                isCapture={true} // High contrast / bold for thermal printer
                            />
                        )}
                    </ViewShot>
                </View>

                <View style={tw`w-[90%] max-w-[400px] flex-1 p-4`}>

                    {/* Mode Switch */}
                    <View style={tw`flex-row bg-gray-800 p-1 rounded-xl mb-4`}>
                        <TouchableOpacity
                            style={tw`flex-1 py-3 rounded-lg items-center ${!isAutoPick ? 'bg-emerald-600' : 'bg-transparent'}`}
                            onPress={() => { setIsAutoPick(false); setSelectedNumbers([]); }}
                        >
                            <Text style={tw`font-bold ${!isAutoPick ? 'text-white' : 'text-gray-400'}`}>Tabuleiro Manual</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={tw`flex-1 py-3 rounded-lg items-center ${isAutoPick ? 'bg-emerald-600' : 'bg-transparent'}`}
                            onPress={() => { setIsAutoPick(true); setSelectedNumbers([]); }}
                        >
                            <Text style={tw`font-bold ${isAutoPick ? 'text-white' : 'text-gray-400'}`}>Surpresinha</Text>
                        </TouchableOpacity>
                    </View>

                    {!isAutoPick ? (
                        <View style={tw`flex-1`}>
                            {/* Manual Input */}
                            <View style={tw`bg-gray-800 p-3 rounded-xl mb-4 flex-row items-center gap-2 border border-gray-700`}>
                                <View style={tw`flex-1`}>
                                    <Text style={tw`text-gray-400 text-xs font-bold uppercase mb-1 ml-1`}>Digitar Milhar</Text>
                                    <TextInput
                                        style={tw`bg-gray-900 text-white font-bold p-3 rounded-lg border border-gray-700 text-lg`}
                                        placeholder="Ex: 1234"
                                        placeholderTextColor="#64748b"
                                        keyboardType="numeric"
                                        maxLength={4}
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

                            {/* Range Tabs */}
                            <View style={tw`h-12`}>
                                {renderRangeTabs()}
                            </View>

                            {/* Selected Indicator */}
                            <View style={tw`bg-surface p-3 rounded-xl mb-4 border border-gray-800 items-center`}>
                                <Text style={tw`text-gray-400 font-bold text-[10px] uppercase mb-2`}>
                                    Selecionados: {selectedNumbers.length}/4
                                </Text>
                                <View style={tw`flex-row flex-wrap gap-2 justify-center`}>
                                    {selectedNumbers.map(n => (
                                        <TouchableOpacity
                                            key={n}
                                            style={tw`bg-emerald-900 px-2 py-1 rounded border border-emerald-700 flex-row items-center`}
                                            onPress={() => toggleNumber(n)}
                                        >
                                            <Text style={tw`text-emerald-100 text-[11px] font-bold mr-1`}>{n.toString().padStart(4, '0')}</Text>
                                            <Ionicons name="close-circle" size={12} color="#6ee7b7" />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Optimzed Grid */}
                            {isLoadingSold ? (
                                <ActivityIndicator size="large" color="#10b981" style={tw`mt-10`} />
                            ) : (
                                <FlatList
                                    data={getRangeData()}
                                    renderItem={renderGridItem}
                                    keyExtractor={(item) => item.toString()}
                                    numColumns={5}
                                    initialNumToRender={30}
                                    maxToRenderPerBatch={30}
                                    windowSize={5}
                                    removeClippedSubviews={true}
                                    showsVerticalScrollIndicator={false}
                                    overScrollMode="never"
                                    contentContainerStyle={tw`pb-4`}
                                />
                            )}
                        </View>
                    ) : (
                        <View style={tw`flex-1 justify-center items-center opacity-70`}>
                            <Ionicons name="shuffle" size={80} color="#10b981" style={tw`mb-6`} />
                            <Text style={tw`text-white text-2xl font-bold text-center mb-4`}>Modo Surpresinha</Text>
                            <Text style={tw`text-gray-400 text-center max-w-xs leading-6`}>
                                O sistema escolherá 4 milhares disponíveis aleatoriamente para você.
                            </Text>
                            <Text style={tw`text-emerald-500 text-sm mt-4 font-bold`}>
                                Clique em "Gerar Aposta" para ver os números.
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Footer */}
            <View style={tw`p-4 border-t border-gray-800 bg-surface`}>
                <TouchableOpacity
                    style={tw`w-full bg-emerald-600 p-4 rounded-xl items-center shadow-lg shadow-emerald-600/30`}
                    onPress={handleReview}
                >
                    <Text style={tw`text-white font-bold text-xl uppercase tracking-wide`}>
                        {isAutoPick ? "Gerar Aposta" : "Continuar"}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Modal & Alerts */}
            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={handleBackFromModal}>
                <View style={tw`flex-1 justify-center items-center bg-black/90 p-4`}>
                    <View style={tw`w-full`}>
                        <Text style={tw`text-white font-bold text-xl mb-4 text-center`}>CONFIRMAÇÃO</Text>

                        <View style={tw`bg-white mb-6 shadow-2xl w-full relative rounded-xl`}>
                            <TicketPreview
                                gameName="2x500"
                                numbers={selectedNumbers}
                                price="R$ 10,00"
                            />
                            {isAutoPick && (
                                <View style={tw`absolute -top-3 -right-2 bg-emerald-500 px-3 py-1 rounded-full shadow-lg z-50 elevation-5`}>
                                    <Text style={tw`text-white font-bold text-xs uppercase`}>Surpresinha</Text>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            style={tw`bg-emerald-600 p-4 rounded-2xl items-center mb-3 shadow-lg shadow-emerald-600/20 active:scale-95`}
                            onPress={handlePrint}
                        >
                            <View style={tw`flex-row items-center`}>
                                <Ionicons name="print" size={24} color="white" style={tw`mr-3`} />
                                <Text style={tw`text-white font-bold text-lg uppercase tracking-wide`}>Confirmar</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={tw`bg-gray-800 p-4 rounded-2xl items-center active:scale-95`}
                            onPress={handleBackFromModal}
                        >
                            <Text style={tw`text-gray-400 font-bold`}>Voltar</Text>
                        </TouchableOpacity>
                    </View>
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
                showCancel={alertConfig.showCancel}
                onConfirm={alertConfig.onConfirm}
                confirmText={alertConfig.confirmText}
                cancelText={alertConfig.cancelText}
            />
        </SafeAreaView>
    );
}
