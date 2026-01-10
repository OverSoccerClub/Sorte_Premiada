import { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, ActivityIndicator, Alert, FlatList } from "react-native";
import ViewShot from "react-native-view-shot";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Device from 'expo-device';
import { Ionicons } from "@expo/vector-icons";
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


export default function Game2x1000Screen() {
    const router = useRouter();
    const { token, user } = useAuth();
    const { show, hide } = useLoading();
    const { printerType } = usePrinter();
    const { settings } = useCompany();
    const printViewShotRef = useRef<ViewShot>(null);

    // Game State
    const [gameId, setGameId] = useState<string | null>(null);
    const [gameName, setGameName] = useState<string>("Jogo 2x1000");
    const [isLoadingGame, setIsLoadingGame] = useState(true);
    const [gamePrice, setGamePrice] = useState<number>(2.00); // Default fallback
    const [soldNumbers, setSoldNumbers] = useState<Set<number>>(new Set());
    const [isLoadingSold, setIsLoadingSold] = useState(false);
    const [drawSeries, setDrawSeries] = useState<number | undefined>(undefined);
    const [isRestrictedMode, setIsRestrictedMode] = useState(false);
    const [gamePrizes, setGamePrizes] = useState<{
        milhar?: string;
        centena?: string;
        dezena?: string;
    } | null>(null);

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
    const [lastTicket, setLastTicket] = useState<TicketData | null>(null);
    const { print, isPrinting } = useTicketPrint();

    // Fetch Game ID on Mount
    useEffect(() => {
        fetchGameId();
    }, []);

    const fetchGameId = async () => {
        show("Carregando o jogo, aguarde um momento.");
        try {
            const API_URL = AppConfig.api.baseUrl;
            const res = await fetch(`${API_URL}/games`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const games = await res.json();
                // Find by name variants or type if possible
                const game = games.find((g: any) =>
                    g.name === "2x500" ||
                    g.name === "2x1000" ||
                    (g.rules?.type === "RAPID" && g.name.includes("2x"))
                );
                if (game) {
                    setGameId(game.id);
                    setGameName(game.name);
                    if (game.rules?.restrictedMode) {
                        setIsRestrictedMode(true);
                    }
                    if (game.price) setGamePrice(Number(game.price));

                    // Store Prizes
                    if (game.prizeMilhar || game.prizeCentena || game.prizeDezena) {
                        const fmt = (val: any) => val ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val)) : undefined;
                        setGamePrizes({
                            milhar: fmt(game.prizeMilhar),
                            centena: fmt(game.prizeCentena),
                            dezena: fmt(game.prizeDezena)
                        });
                    }

                    // Buscar o sorteio ativo para pegar a série
                    const drawsRes = await fetch(`${API_URL}/draws?gameId=${game.id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (drawsRes.ok) {
                        const draws = await drawsRes.json();
                        const nextDraw = draws.find((d: any) => new Date(d.drawDate) > new Date());
                        if (nextDraw && nextDraw.series) {
                            setDrawSeries(nextDraw.series);
                        }
                    }

                    await fetchSoldNumbers(game.id);
                } else {
                    showAlert("Jogo Indisponível", "Não há um jogo compatível ativo no momento.", "error");
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
            // Validation Logic
            if (isRestrictedMode) {
                // In restricted mode, we allow 1 (auto-complete) OR 4 (full manual)
                if (selectedNumbers.length === 1) {
                    // +3 Auto Logic: "Totalmente Diferentes" (Totally Different)
                    // Generate 3 random numbers that do NOT share the same centenary (last 3 digits)
                    // as the user's selection OR each other.
                    const firstNum = selectedNumbers[0];
                    const newNumbers = [firstNum];
                    const excludedCentenas = new Set<number>();
                    excludedCentenas.add(firstNum % 1000);
                    const selectedSet = new Set(newNumbers);

                    let attempts = 0;
                    // Try to complete the set of 4
                    while (newNumbers.length < 4 && attempts < 100) {
                        const candidate = Math.floor(Math.random() * 10000);
                        const candidateCentena = candidate % 1000;

                        if (!soldNumbers.has(candidate) &&
                            !selectedSet.has(candidate) &&
                            !excludedCentenas.has(candidateCentena)) {

                            newNumbers.push(candidate);
                            selectedSet.add(candidate);
                            excludedCentenas.add(candidateCentena);
                        }
                        attempts++;
                    }

                    if (newNumbers.length < 4) {
                        showAlert("Indisponível", "Não foi possível encontrar milhares automáticas disponíveis com finais diferentes.", "error");
                        return;
                    }

                    setSelectedNumbers(newNumbers);

                } else if (selectedNumbers.length !== 4) {
                    showAlert("Incompleto", "No modo restrito, selecione 1 número (para completar) ou 4 números.", "warning");
                    return;
                }
            } else {
                // Strict mode
                if (selectedNumbers.length !== 4) {
                    showAlert("Incompleto", "Selecione 4 milhares ou use a Surpresinha.", "warning");
                    return;
                }
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
                gameType: "2x1000",
                numbers: selectedNumbers, // Always use selected numbers (explicit)
                amount: gamePrice,
                game: { connect: { id: gameId } } // Backend expects gameId logic? No, check my backend fix.
                // Wait, I fixed backend to use `gameId` directly in Prisma.
                // Payload sent to Controller -> Service. 
                // Service: `...(data.game?.connect?.id ? { gameId: data.game.connect.id } : {})`
                // So I MUST send `game: { connect: { id: ... } }` for logic to work.
                // OR I can update payload here if I wanted, but Service fix handles it.
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

            const res = await fetch(`${API_URL}/tickets`, {
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
            fetchSoldNumbers(gameId);

            // Prepare Unified Ticket Data
            const fullTicket: TicketData = {
                gameName: "2x1000",
                numbers: finalNumbers,
                price: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gamePrice),
                ticketId: ticketData.id,
                hash: ticketData.hash,
                date: new Date(ticketData.createdAt).toLocaleString('pt-BR'),
                drawDate: ticketData.drawDate ? new Date(ticketData.drawDate).toLocaleString('pt-BR') : undefined,
                series: drawSeries?.toString(),
                ticketNumber: ticketData.ticketNumber,
                terminalId: Device.deviceName || Device.modelName || "Terminal",
                vendorName: user?.name || user?.username || "Vendedor",
                possiblePrize: ticketData.possiblePrize ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(ticketData.possiblePrize)) : undefined,
                prizes: gamePrizes || undefined,
                status: ticketData.status,
                secondChanceNumber: ticketData.secondChanceNumber,
                secondChanceDrawDate: ticketData.secondChanceDrawDate ? new Date(ticketData.secondChanceDrawDate).toLocaleString('pt-BR', { weekday: 'long', hour: '2-digit', minute: '2-digit' }) : undefined,
                secondChanceLabel: "SEGUNDA CHANCE",
                companyName: settings.companyName,
                companyLogoUrl: settings.logoUrl
            };

            setLastTicket(fullTicket);

            // 1. Show Standard Loading
            show("Imprimindo...");

            // 2. Wait for Render and Print
            setTimeout(async () => {
                try {
                    await print(fullTicket, printViewShotRef);
                } catch (err) {
                    console.error("[2x1000] Print failed", err);
                    showAlert("Aviso", "Aposta salva, mas erro na impressão.", "warning");
                } finally {
                    hide();
                    setReceiptVisible(true);
                }
            }, 800);

        } catch (error: any) {
            hide();
            setTimeout(() => {
                const isTimeout = error.name === 'AbortError';
                const errorMessage = isTimeout
                    ? "O servidor demorou muito para responder. Verifique sua conexão ou tente novamente."
                    : (error.message || "Erro desconhecido.");

                setTimeout(() => {
                    showAlert("Erro", errorMessage, "error");
                }, 300);
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

    const handleAutoPrint = async () => {
        if (!lastTicket) return;
        await print(lastTicket, printViewShotRef);
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
                    <Text style={tw`text-xl font-bold text-center text-white`}>
                        {gameName}
                    </Text>
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

                {/* Hidden Capture Area */}
                <TicketPrintManager ref={printViewShotRef} data={lastTicket} />


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
                    style={[tw`w-full p-4 rounded-xl items-center shadow-lg`, !gameId ? tw`bg-gray-700` : tw`bg-emerald-600 shadow-emerald-600/30`]}
                    onPress={handleReview}
                    disabled={!gameId || isLoadingGame}
                >
                    <Text style={[tw`font-bold text-xl uppercase tracking-wide`, !gameId ? tw`text-gray-500` : tw`text-white`]}>
                        {isLoadingGame ? "Carregando..." : (!gameId ? "Jogo Indisponível" : (isAutoPick ? "Gerar Aposta" : "Continuar"))}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Modal & Alerts */}
            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={handleBackFromModal}>
                <View style={tw`flex-1 bg-black/90`}>
                    <ScrollView
                        contentContainerStyle={tw`flex-grow justify-center items-center p-4 pb-20`}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={tw`w-full max-w-[400px]`}>
                            <Text style={tw`text-white font-bold text-xl mb-4 text-center mt-4`}>CONFIRMAÇÃO</Text>

                            <View style={tw`bg-white mb-6 shadow-2xl w-full relative rounded-xl items-center`}>
                                <TicketDisplay
                                    data={{
                                        gameName: gameName,
                                        numbers: selectedNumbers,
                                        price: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gamePrice),
                                        series: drawSeries?.toString(),
                                        date: new Date().toLocaleString('pt-BR'),
                                        ticketId: "PREVIEW",
                                        prizes: gamePrizes || undefined,
                                        companyName: settings.companyName,
                                        companyLogoUrl: settings.logoUrl
                                    }}
                                    mode="preview"
                                />
                                {isAutoPick && (
                                    <View style={tw`absolute -top-3 -right-2 bg-emerald-500 px-3 py-1 rounded-full shadow-lg z-50 elevation-5`}>
                                        <Text style={tw`text-white font-bold text-xs uppercase`}>Surpresinha</Text>
                                    </View>
                                )}
                                {isRestrictedMode && selectedNumbers.length === 1 && (
                                    <View style={tw`absolute -top-3 -right-2 bg-blue-500 px-3 py-1 rounded-full shadow-lg z-50 elevation-5`}>
                                        <Text style={tw`text-white font-bold text-xs uppercase`}>+3 Auto</Text>
                                    </View>
                                )}
                            </View>

                            <TouchableOpacity
                                style={tw`bg-emerald-600 p-4 rounded-2xl items-center mb-3 shadow-lg shadow-emerald-600/20 active:scale-95 w-full`}
                                onPress={handlePrint}
                            >
                                <View style={tw`flex-row items-center`}>
                                    <Ionicons name="print" size={24} color="white" style={tw`mr-3`} />
                                    <Text style={tw`text-white font-bold text-lg uppercase tracking-wide`}>Confirmar</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={tw`bg-gray-800 p-4 rounded-2xl items-center active:scale-95 w-full mb-4`}
                                onPress={handleBackFromModal}
                            >
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
                showCancel={alertConfig.showCancel}
                onConfirm={alertConfig.onConfirm}
                confirmText={alertConfig.confirmText}
                cancelText={alertConfig.cancelText}
            />
        </SafeAreaView>
    );
}
