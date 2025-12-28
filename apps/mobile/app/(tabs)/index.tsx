import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import tw from "../../lib/tailwind";
import { useAuth } from "../../context/AuthContext";
import { useState, useCallback } from "react";
import { FinanceService } from "../../services/finance.service";
import { CustomAlert } from "../../components/CustomAlert";
import { ScreenLayout } from "../../components/ScreenLayout";

const { height } = Dimensions.get("window");

const games = [
    { id: "2x1000", name: "2x1000", color: "bg-emerald-600", icon: "cash-outline", borderColor: "border-emerald-500/30" },
    { id: "jb", name: "Jogo do Bicho", color: "bg-amber-600", icon: "paw-outline", borderColor: "border-amber-500/30" },
];

export default function Dashboard() {
    const router = useRouter();
    const { user, token } = useAuth();
    const [isDayClosed, setIsDayClosed] = useState(false);

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

    useFocusEffect(
        useCallback(() => {
            if (token) {
                checkStatus();
            }
        }, [token])
    );

    const checkStatus = async () => {
        try {
            const summary = await FinanceService.getSummary(token!);
            if (summary && summary.isClosed) {
                setIsDayClosed(true);
            } else {
                setIsDayClosed(false);
            }
        } catch (error) {
            console.error("Error checking finance status", error);
        }
    };

    const handleGamePress = (gameId: string, gameName: string) => {
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

        if (gameId === "2x1000") {
            router.push("/games/2x1000");
        } else if (gameId === "jb") {
            router.push("/games/jogo-do-bicho");
        } else {
            router.push({ pathname: "/games/placeholder", params: { title: gameName } });
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

            {isDayClosed && (
                <View style={tw`w-[90%] mt-6 p-4 bg-orange-500/10 border border-orange-500/50 rounded-xl flex-row items-center`}>
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

            <View style={tw`w-[90%] flex-row justify-center gap-4 mt-2`}>
                {games.map((game) => (
                    <TouchableOpacity
                        key={game.id}
                        style={tw`flex-1 bg-surface p-4 rounded-3xl mb-4 shadow-lg border ${game.borderColor} items-center justify-center aspect-square ${isDayClosed ? 'opacity-50' : ''} active:scale-95 transition-transform`}
                        onPress={() => handleGamePress(game.id, game.name)}
                        activeOpacity={0.8}
                    >
                        <View style={tw`w-16 h-16 ${game.color} rounded-2xl items-center justify-center mb-4 shadow-lg shadow-${game.color.replace('bg-', '')}/50 rotate-3`}>
                            <Ionicons name={game.icon as any} size={32} color="white" />
                        </View>
                        <Text style={tw`font-bold text-lg text-white text-center`}>{game.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Botão de Validação */}
            <View style={tw`w-[90%] mt-0`}>
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
        </ScreenLayout>
    );
}
