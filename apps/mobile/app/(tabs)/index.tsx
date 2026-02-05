import { View, Text, TouchableOpacity, Dimensions, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import tw from "../../lib/tailwind";
import { useAuth } from "../../context/AuthContext";
import { usePrinter } from "../../context/PrinterContext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useCallback, useEffect } from "react";
import { FinanceService } from "../../services/finance.service";
import { CustomAlert } from "../../components/CustomAlert";
import { ScreenLayout } from "../../components/ScreenLayout";
import { AnnouncementService, Announcement } from "../../services/announcements.service";
import { AnnouncementCard } from "../../components/AnnouncementCard";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { UserService } from "../../services/users.service";
import { GamesService, GameConfig } from "../../services/games.service";

const { height } = Dimensions.get("window");

export default function Dashboard() {
    const router = useRouter();
    const { user, token } = useAuth();
    const [isDayClosed, setIsDayClosed] = useState(false);
    const [salesGoalInfo, setSalesGoalInfo] = useState<{
        threshold: number;
        current: number;
        remaining: number;
        type: 'CURRENCY' | 'TICKET_COUNT';
    } | null>(null);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [dismissedIds, setDismissedIds] = useState<string[]>([]);

    // Dynamic Games State
    const [games, setGames] = useState<GameConfig[]>([]);
    const [loadingGames, setLoadingGames] = useState(true);

    // Alert State
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type: 'success' | 'error' | 'warning' | 'info';
        onConfirm?: () => void;
    }>({
        visible: false,
        title: "",
        message: "",
        type: "info",
    });

    const insets = useSafeAreaInsets();
    const BOTTOM_PADDING = insets.bottom + 120;

    // Push Notifications
    const { expoPushToken, notification } = usePushNotifications();

    // Auto-refresh when notification arrives
    useEffect(() => {
        if (notification) {
            fetchAnnouncements();
        }
    }, [notification]);

    useFocusEffect(
        useCallback(() => {
            if (token) {
                checkStatus();
                fetchAnnouncements();
                fetchAnnouncements();
                fetchGames();
            }
        }, [token])
    );

    // Update Push Token on Server
    useFocusEffect(
        useCallback(() => {
            if (token && expoPushToken) {
                console.log("Updating push token on server:", expoPushToken);
                UserService.updatePushToken(token, expoPushToken);
            }
        }, [token, expoPushToken])
    );

    const fetchAnnouncements = async () => {
        try {
            const data = await AnnouncementService.getActive(token!);
            setAnnouncements(data);
        } catch (error) {
            console.error("Error fetching announcements", error);
        }
    };

    const fetchGames = async () => {
        setLoadingGames(true);
        try {
            const data = await GamesService.getActiveGames(token!);
            setGames(data);
        } catch (error) {
            console.error("Error fetching games", error);
            // Fallback to empty array if fetch fails
            setGames([]);
        } finally {
            setLoadingGames(false);
        }
    };

    const checkStatus = async () => {
        try {
            const summary = await FinanceService.getSummary(token!);
            if (summary) {
                setIsDayClosed(summary.isClosed);

                // Sales Goal Monitoring
                const goalType = summary.commissionGoalType || 'CURRENCY';
                const threshold = summary.minSalesThreshold || 200;

                let current = 0;
                if (goalType === 'TICKET_COUNT') {
                    current = summary.totalTickets || 0;
                } else {
                    current = summary.totalSales || 0;
                }

                if (current < threshold) {
                    setSalesGoalInfo({
                        threshold: threshold,
                        current: current,
                        remaining: threshold - current,
                        type: goalType
                    });
                } else {
                    setSalesGoalInfo(null);
                }
            } else {
                setIsDayClosed(false);
                setSalesGoalInfo(null);
            }
        } catch (error) {
            console.error("Error checking finance status", error);
        }
    };

    const { printerType } = usePrinter();

    const handleGamePress = async (game: GameConfig) => {
        if (isDayClosed) {
            setAlertConfig({
                visible: true,
                title: "Caixa Fechado",
                message: "O caixa do dia já foi encerrado. Não é possível realizar novas vendas hoje.",
                type: "warning",
                onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
            });
            return;
        }

        // Check Printer Configuration
        if (printerType === 'BLE') {
            const savedMac = await AsyncStorage.getItem('@printer_mac_address');
            if (!savedMac) {
                setAlertConfig({
                    visible: true,
                    title: "Impressora Não Configurada",
                    message: "É necessário configurar uma impressora Bluetooth antes de iniciar as vendas.",
                    type: "warning",
                    onConfirm: () => {
                        setAlertConfig(prev => ({ ...prev, visible: false }));
                        router.push("/settings/printer"); // Redirect to printer settings if available, or just close
                    }
                });
                return;
            }
        }

        if (!game || !game.name) {
            console.warn("Attempted to open invalid game");
            return;
        }

        // Dynamic routing based on game name
        const gameName = game.name.toLowerCase();
        if (gameName.includes("2x") || gameName.includes("milhar")) {
            router.push("/games/2x1000");
        } else if (gameName === "jb" || gameName.includes("bicho") || gameName.includes("loteria") || gameName.includes("tradicional")) {
            router.push("/games/loteria-tradicional");
        } else if (game.type === 'PAIPITA_AI' || gameName.includes("paipita")) {
            router.push("/games/paipita-ai");
        } else {
            // Future games - use placeholder with game name
            router.push({ pathname: "/games/placeholder", params: { title: game.displayName || game.name } });
        }
    };

    return (
        <ScreenLayout scrollable contentContainerStyle={{ paddingBottom: BOTTOM_PADDING }}>

            {/* Header com Perfil */}
            <View style={tw`w-full p-4 bg-surface border-b border-gray-800 flex-row justify-between items-center shadow-md`}>
                <View>
                    <Text style={tw`text-2xl font-bold text-white mb-1`}>Olá, <Text style={tw`text-primary`}>{user?.name || user?.username || "Cambista"}</Text></Text>
                    <View style={tw`flex-row items-center`}>
                        <Ionicons name="mail-outline" size={14} color="#9ca3af" style={tw`mr-1.5`} />
                        <Text style={tw`text-gray-400 text-sm`}>{user?.email || "email@exemplo.com"}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={tw`bg-gray-800 p-3 rounded-full border border-gray-700 active:bg-gray-700`}
                    onPress={() => router.push("/profile")}
                >
                    <Ionicons name="person" size={24} color="#94a3b8" />
                </TouchableOpacity>
            </View>

            {announcements
                .filter(a => !dismissedIds.includes(a.id))
                .map(a => (
                    <AnnouncementCard
                        key={a.id}
                        announcement={a}
                        onClose={(id) => setDismissedIds(prev => [...prev, id])}
                    />
                ))}

            {/* Sales Goal Monitoring Banner */}
            {salesGoalInfo && (
                <View style={tw`w-[90%] mt-4 p-4 bg-emerald-500/10 border border-emerald-500/40 rounded-xl self-center`}>
                    <View style={tw`flex-row items-center mb-3`}>
                        <View style={tw`bg-emerald-500/20 p-2 rounded-full mr-3`}>
                            <Ionicons name="trending-up" size={20} color="#10b981" />
                        </View>
                        <View style={tw`flex-1`}>
                            <Text style={tw`text-emerald-400 font-bold text-base`}>Meta do Dia</Text>
                            <Text style={tw`text-emerald-300/70 text-xs`}>Atinja a meta para ganhar comissão por %</Text>
                        </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={tw`h-2 bg-gray-700 rounded-full mb-3 overflow-hidden`}>
                        <View
                            style={[
                                tw`h-full bg-emerald-500 rounded-full`,
                                { width: `${Math.min((salesGoalInfo.current / salesGoalInfo.threshold) * 100, 100)}%` }
                            ]}
                        />
                    </View>

                    <View style={tw`flex-row justify-between items-center`}>
                        <View style={tw`items-center`}>
                            <Text style={tw`text-gray-400 text-xs`}>Vendas Atuais</Text>
                            <Text style={tw`text-white font-bold`}>
                                {salesGoalInfo.type === 'CURRENCY' ? `R$ ${salesGoalInfo.current.toFixed(2)}` : `${salesGoalInfo.current} Bilhetes`}
                            </Text>
                        </View>
                        <View style={tw`items-center px-3`}>
                            <Text style={tw`text-emerald-400 text-xs`}>Faltam</Text>
                            <Text style={tw`text-emerald-400 font-bold text-lg`}>
                                {salesGoalInfo.type === 'CURRENCY' ? `R$ ${salesGoalInfo.remaining.toFixed(2)}` : `${salesGoalInfo.remaining} Un`}
                            </Text>
                        </View>
                        <View style={tw`items-center`}>
                            <Text style={tw`text-gray-400 text-xs`}>Meta</Text>
                            <Text style={tw`text-white font-bold`}>
                                {salesGoalInfo.type === 'CURRENCY' ? `R$ ${salesGoalInfo.threshold.toFixed(2)}` : `${salesGoalInfo.threshold} Un`}
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {isDayClosed && (
                <View style={tw`w-[90%] mt-6 p-4 bg-orange-500/10 border border-orange-500/50 rounded-xl flex-row items-center self-center`}>
                    <Ionicons name="lock-closed" size={24} color="#f97316" style={tw`mr-3`} />
                    <View style={tw`flex-1`}>
                        <Text style={tw`text-orange-500 font-bold`}>Caixa Fechado</Text>
                        <Text style={tw`text-orange-400/80 text-xs`}>Vendas bloqueadas até conferência pelo supervisor.</Text>
                    </View>
                </View>
            )}

            <View style={tw`w-full px-6 pt-6 pb-2`}>
                <Text style={tw`text-lg font-bold text-white uppercase tracking-wider`}>Jogos Disponíveis</Text>
            </View>

            <View style={tw`w-[90%] flex-row flex-wrap justify-center gap-4 mt-2 self-center`}>
                {loadingGames ? (
                    <View style={tw`py-8 items-center`}>
                        <ActivityIndicator size="large" color="#10b981" />
                        <Text style={tw`text-gray-400 text-sm mt-2`}>Carregando jogos...</Text>
                    </View>
                ) : games.length === 0 ? (
                    <View style={tw`py-8 items-center`}>
                        <Ionicons name="game-controller-outline" size={48} color="#6b7280" />
                        <Text style={tw`text-gray-400 text-sm mt-2`}>Nenhum jogo disponível</Text>
                    </View>
                ) : (
                    games.map((game) => {
                        const color = game.colorClass || "bg-emerald-600";
                        const icon = (game.iconName || "game-controller-outline") as any;
                        const borderColor = color.startsWith("bg-") ? color.replace("bg-", "border-").replace("-600", "-500/30") : "border-emerald-500/30";
                        const displayName = game.displayName || game.name || "Jogo";

                        return (
                            <TouchableOpacity
                                key={game.id}
                                style={tw`flex-1 min-w-[140px] max-w-[48%] bg-surface p-4 rounded-3xl mb-4 shadow-lg border ${borderColor} items-center justify-center aspect-square ${isDayClosed ? 'opacity-50' : ''} active:scale-95 transition-transform`}
                                onPress={() => handleGamePress(game)}
                                activeOpacity={0.8}
                            >
                                <View style={tw`w-16 h-16 ${color} rounded-2xl items-center justify-center mb-4 shadow-lg rotate-3`}>
                                    <Ionicons name={icon} size={32} color="white" />
                                </View>
                                <Text style={tw`font-bold text-lg text-white text-center`}>{displayName}</Text>
                            </TouchableOpacity>
                        );
                    })
                )}
            </View>

            {/* Botão de Validação */}
            <View style={tw`w-[90%] mt-0 self-center`}>
                <TouchableOpacity
                    style={tw`w-full bg-slate-800 p-4 rounded-2xl mb-4 shadow-lg border border-slate-700 flex-row items-center justify-center gap-3 active:bg-slate-700`}
                    onPress={() => router.push("/validate")}
                    activeOpacity={0.8}
                >
                    <View style={tw`bg-emerald-500/20 p-2 rounded-full`}>
                        <Ionicons name="scan-outline" size={24} color="#10b981" />
                    </View>
                    <View>
                        <Text style={tw`font-bold text-lg text-white`}>Conferir Bilhete</Text>
                        <Text style={tw`text-xs text-gray-400`}>Use a câmera para validar premiações</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                showCancel={false}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
                onConfirm={alertConfig.onConfirm}
            />
        </ScreenLayout >
    );
}
