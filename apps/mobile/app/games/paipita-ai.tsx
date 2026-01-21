import { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Image } from "react-native";
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
import { ReceiptModal } from "../../components/ReceiptModal";
import { TicketPrintManager } from "../../components/ticket/TicketPrintManager";
import { TicketDisplay } from "../../components/ticket/TicketDisplay";
import { useTicketPrint } from "../../hooks/useTicketPrint";
import { TicketData } from "../../components/ticket/TicketContent";
import { AppConfig } from "../../constants/AppConfig";
import { useCompany } from "../../context/CompanyContext";
import { useSettings } from "../../context/SettingsContext";

export default function GamePaipitaScreen() {
    const router = useRouter();
    const { token, user } = useAuth();
    const { show, hide } = useLoading();
    const { printerType } = usePrinter();
    const { settings: companySettings } = useCompany();
    const { settings } = useSettings();
    const printViewShotRef = useRef<ViewShot>(null);

    // Game State
    const [gameId, setGameId] = useState<string | null>(null);
    const [gameName, setGameName] = useState<string>("Paipita Ai");
    const [isLoadingGame, setIsLoadingGame] = useState(true);
    const [gamePrice, setGamePrice] = useState<number>(2.00);
    const [activeDraw, setActiveDraw] = useState<any>(null);
    const [matches, setMatches] = useState<any[]>([]);

    // Selection State
    const [selections, setSelections] = useState<Record<number, string>>({});

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
        fetchGameAndDraws();
    }, []);

    const fetchGameAndDraws = async () => {
        show("Carregando Paipita Ai...");
        try {
            const API_URL = AppConfig.api.baseUrl;
            const res = await fetch(`${API_URL}/games`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const games = await res.json();
                const game = games.find((g: any) => g.type === 'PAIPITA_AI' || g.name.toLowerCase().includes('paipita'));

                if (game) {
                    setGameId(game.id);
                    setGameName(game.name);
                    if (game.price) setGamePrice(Number(game.price));

                    // Fetch Draws
                    const drawsRes = await fetch(`${API_URL}/draws?gameId=${game.id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (drawsRes.ok) {
                        const draws = await drawsRes.json();
                        // Find next active draw
                        const nextDraw = draws
                            .filter((d: any) => new Date(d.drawDate) > new Date())
                            .sort((a: any, b: any) => new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime())[0];

                        if (nextDraw) {
                            setActiveDraw(nextDraw);
                            if (nextDraw.matches) {
                                setMatches(nextDraw.matches.sort((a: any, b: any) => a.matchOrder - b.matchOrder));
                            }
                        } else {
                            showAlert("Aviso", "Nenhum sorteio aberto para este jogo.", "info");
                        }
                    }
                } else {
                    showAlert("Erro", "Jogo Paipita Ai não encontrado.", "error");
                }
            }
        } catch (error) {
            console.error("Error fetching game data", error);
            showAlert("Erro", "Falha de conexão.", "error");
        } finally {
            setIsLoadingGame(false);
            hide();
        }
    };

    const showAlert = (title: string, message: string, type: AlertType = "info") => {
        setAlertConfig({ visible: true, title, message, type });
    };

    const mapSelectionToText = (selection: string) => {
        switch (selection) {
            case '1': return 'CV'; // Casa Vence
            case 'X': return 'EM'; // Empate
            case '2': return 'FV'; // Fora Vence
            default: return selection;
        }
    };

    const handleSelection = (matchOrder: number, value: string) => {
        setSelections(prev => ({
            ...prev,
            [matchOrder]: value
        }));
    };

    const handleReview = () => {
        if (!printerType) {
            showAlert("Impressora", "Configure a impressora antes de vender.", "warning");
            return;
        }
        if (Object.keys(selections).length !== 14) {
            showAlert("Atenção", `Você precisa palpitar em todos os 14 jogos. Faltam ${14 - Object.keys(selections).length}.`, "warning");
            return;
        }

        setModalVisible(true);
    };

    const handlePrint = async () => {
        if (!gameId || !activeDraw) return;
        setModalVisible(false);
        show("Enviando Aposta...");

        try {
            const API_URL = AppConfig.api.baseUrl;
            // Build ordered numbers array
            const numbers = [];
            for (let i = 1; i <= 14; i++) {
                numbers.push(selections[i]);
            }

            const payload = {
                gameType: "PAIPITA_AI",
                numbers: numbers,
                amount: gamePrice,
                game: { connect: { id: gameId } },
                // Ideally backend should link drawId if passed, but usually tickets service finds active.
                // Given previous impl, we rely on service finding active draw.
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const res = await fetch(`${API_URL}/tickets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-device-id': Device.modelName || 'unknown'
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!res.ok) {
                const errText = await res.text();
                // try parse
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
            const matchDetails = matches.map(m => ({
                order: m.matchOrder,
                label: `${m.homeTeam} x ${m.awayTeam}`,
                selection: mapSelectionToText(selections[m.matchOrder])
            }));

            const fullTicket: TicketData = {
                gameName: "PAIPITA AI",
                numbers: ticketData.numbers, // unused by matches renderer
                matches: matchDetails,
                price: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gamePrice),
                ticketId: ticketData.id,
                hash: ticketData.hash,
                date: new Date(ticketData.createdAt).toLocaleString('pt-BR'),
                drawDate: ticketData.drawDate,
                ticketNumber: ticketData.ticketNumber,
                terminalId: ticketData.deviceName || "Terminal",
                deviceName: ticketData.deviceName,
                vendorName: user?.name || user?.username || "Vendedor",
                companyName: settings.companyName,
                companyLogoUrl: settings.logoUrl,
                status: ticketData.status,
                promptMessage: "BOA SORTE!",
                // Prizes could be fetched from game config
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
        setSelections({});
    };

    const handleAutoPrint = async () => {
        if (lastTicket) await print(lastTicket, printViewShotRef);
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
                    <Text style={tw`text-xl font-bold text-center text-white`}>{gameName}</Text>
                    <Text style={tw`text-center text-emerald-500 text-xs font-bold uppercase tracking-widest`}>
                        {Object.keys(selections).length}/14 Selecionados
                    </Text>
                </View>
                <View style={tw`w-10`} />
            </View>

            <TicketPrintManager ref={printViewShotRef} data={lastTicket} template={settings.ticketTemplate as 'default' | 'alternative'} />

            {!isLoadingGame && activeDraw && matches.length > 0 ? (
                <ScrollView style={tw`flex-1 px-2`} contentContainerStyle={tw`pb-20 pt-4`}>
                    {matches.map((match) => (
                        <View key={match.id} style={tw`bg-gray-800 rounded-xl mb-3 p-3 border ${selections[match.matchOrder] ? 'border-emerald-500/50' : 'border-gray-700'}`}>
                            <View style={tw`flex-row justify-between mb-2`}>
                                <Text style={tw`text-gray-400 text-xs font-bold`}>JOGO {match.matchOrder}</Text>
                                <Text style={tw`text-gray-400 text-[10px]`}>
                                    {new Date(match.matchDate).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                                </Text>
                            </View>

                            <View style={tw`flex-row items-center justify-between mb-3`}>
                                <Text style={tw`text-white font-bold flex-1 text-right text-sm`} numberOfLines={1}>{match.homeTeam}</Text>
                                <Text style={tw`text-gray-500 mx-2 text-xs font-bold`}>X</Text>
                                <Text style={tw`text-white font-bold flex-1 text-left text-sm`} numberOfLines={1}>{match.awayTeam}</Text>
                            </View>

                            <View style={tw`flex-row gap-2`}>
                                {['1', 'X', '2'].map((opt) => {
                                    const isSelected = selections[match.matchOrder] === opt;
                                    let btnColor = 'bg-gray-700';
                                    let txtColor = 'text-gray-400';

                                    if (isSelected) {
                                        if (opt === '1') { btnColor = 'bg-emerald-600'; txtColor = 'text-white'; }
                                        if (opt === 'X') { btnColor = 'bg-blue-600'; txtColor = 'text-white'; }
                                        if (opt === '2') { btnColor = 'bg-orange-600'; txtColor = 'text-white'; }
                                    }

                                    return (
                                        <TouchableOpacity
                                            key={opt}
                                            style={tw`flex-1 py-3 rounded-lg items-center ${btnColor}`}
                                            onPress={() => handleSelection(match.matchOrder, opt)}
                                        >
                                            <Text style={tw`font-black ${txtColor}`}>{opt}</Text>
                                        </TouchableOpacity>
                                    )
                                })}
                            </View>
                        </View>
                    ))}
                </ScrollView>
            ) : (
                <View style={tw`flex-1 items-center justify-center`}>
                    {isLoadingGame ? <ActivityIndicator size="large" color="#10b981" /> : (
                        <Text style={tw`text-gray-400`}>Nenhum concurso disponível.</Text>
                    )}
                </View>
            )}

            <View style={tw`p-4 border-t border-gray-800 bg-surface`}>
                <TouchableOpacity
                    style={tw`w-full bg-emerald-600 p-4 rounded-xl items-center shadow-lg shadow-emerald-600/30 ${(!activeDraw || Object.keys(selections).length !== 14) ? 'opacity-50' : ''}`}
                    onPress={handleReview}
                    disabled={!activeDraw || Object.keys(selections).length !== 14}
                >
                    <Text style={tw`text-white font-bold text-xl uppercase tracking-wide`}>
                        Apostar - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gamePrice)}
                    </Text>
                </TouchableOpacity>
            </View>

            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={tw`flex-1 bg-black/90 justify-center items-center p-4`}>
                    <View style={[tw`w-full bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 flex flex-col`, { maxHeight: '90%' }]}>
                        {/* Header */}
                        <View style={tw`p-4 border-b border-gray-800`}>
                            <Text style={tw`text-white font-bold text-xl text-center`}>CONFIRMAR APOSTA</Text>
                        </View>

                        {/* Scrollable Content */}
                        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-4`} showsVerticalScrollIndicator={true}>
                            <TicketDisplay
                                data={{
                                    gameName: "PAIPITA AI",
                                    numbers: [],
                                    matches: matches.map(m => ({
                                        order: m.matchOrder,
                                        label: `${m.homeTeam} x ${m.awayTeam}`,
                                        selection: mapSelectionToText(selections[m.matchOrder] || '-')
                                    })),
                                    price: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gamePrice),
                                    date: new Date().toLocaleString('pt-BR'),
                                    ticketId: "PREVIEW",
                                    companyName: settings.companyName,
                                    companyLogoUrl: settings.logoUrl
                                }}
                                mode="preview"
                                scale={0.75}
                            />
                        </ScrollView>

                        {/* Fixed Footer Buttons */}
                        <View style={tw`p-4 bg-gray-900 border-t border-gray-800`}>
                            <TouchableOpacity style={tw`bg-emerald-600 p-4 rounded-2xl items-center mb-3`} onPress={handlePrint}>
                                <Text style={tw`text-white font-bold text-lg`}>Confirmar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={tw`bg-gray-800 p-4 rounded-2xl items-center`} onPress={() => setModalVisible(false)}>
                                <Text style={tw`text-gray-400 font-bold`}>Voltar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <ReceiptModal
                visible={receiptVisible}
                onClose={handleCloseReceipt}
                onPrint={handleAutoPrint}
                ticketData={lastTicket}
                autoPrint={false}
                isReprint={false}
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
