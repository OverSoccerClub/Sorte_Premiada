import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import tw from "../../lib/tailwind";
import { useAuth } from "../../context/AuthContext";
import { StatusBar } from "expo-status-bar";
import { useState, useCallback } from "react";
import { FinanceService, FinanceSummary } from "../../services/finance.service";
import { CustomAlert } from "../../components/CustomAlert";

export default function CashierScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const [summary, setSummary] = useState<FinanceSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [closing, setClosing] = useState(false);

    // Alert State
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type: 'success' | 'error' | 'warning' | 'info';
        showCancel?: boolean;
        onConfirm?: () => void;
    }>({
        visible: false,
        title: "",
        message: "",
        type: "info",
    });

    useFocusEffect(
        useCallback(() => {
            loadSummary();
        }, [token])
    );

    const loadSummary = async () => {
        if (!token) return;
        setLoading(true);
        const data = await FinanceService.getSummary(token);
        setSummary(data);
        setLoading(false);
    };

    const handleCloseBox = () => {
        setAlertConfig({
            visible: true,
            title: "Fechar Caixa",
            message: "Tem certeza que deseja fechar o caixa de hoje? Você não poderá realizar mais vendas até que o supervisor verifique.",
            type: "warning",
            showCancel: true,
            onConfirm: performCloseBox
        });
    };

    const performCloseBox = async () => {
        if (!token) return;
        setClosing(true);
        const res = await FinanceService.closeDay(token);
        setClosing(false);

        if (res) {
            setAlertConfig({
                visible: true,
                title: "Sucesso",
                message: "Caixa fechado com sucesso! Aguarde verificação do supervisor.",
                type: "success",
                onConfirm: () => {
                    loadSummary(); // Reload to show closed state
                }
            });
        } else {
            setAlertConfig({
                visible: true,
                title: "Erro",
                message: "Não foi possível fechar o caixa. Tente novamente.",
                type: "error",
                onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
            });
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={tw`flex-1 bg-background justify-center items-center`}>
                <ActivityIndicator size="large" color="#50C878" />
            </SafeAreaView>
        );
    }

    const salesLimit = summary?.salesLimit || 1000;
    const totalSales = summary?.totalSales || 0;
    const percentUsed = Math.min((totalSales / salesLimit) * 100, 100);
    const isLimitReached = totalSales >= salesLimit;

    return (
        <SafeAreaView style={tw`flex-1 bg-background`}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={tw`flex-row items-center p-4 border-b border-gray-800`}>
                <TouchableOpacity onPress={() => router.back()} style={tw`p-2`}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={tw`text-xl font-bold text-white ml-2`}>Prestação de Contas</Text>
            </View>

            <ScrollView contentContainerStyle={tw`p-4 pb-20`}>

                {/* Status Cards */}
                {summary?.isClosed ? (
                    <View style={tw`bg-orange-900/20 border border-orange-500/50 p-4 rounded-xl mb-6 flex-row items-center`}>
                        <Ionicons name="lock-closed" size={32} color="#f97316" style={tw`mr-4`} />
                        <View style={tw`flex-1`}>
                            <Text style={tw`text-orange-500 font-bold text-lg`}>Caixa Fechado</Text>
                            <Text style={tw`text-gray-300`}>Aguardando verificação do supervisor.</Text>
                        </View>
                    </View>
                ) : (
                    <View style={tw`bg-emerald-900/20 border border-emerald-500/50 p-4 rounded-xl mb-6 flex-row items-center`}>
                        <Ionicons name="lock-open" size={32} color="#10b981" style={tw`mr-4`} />
                        <View style={tw`flex-1`}>
                            <Text style={tw`text-emerald-500 font-bold text-lg`}>Caixa Aberto</Text>
                            <Text style={tw`text-gray-300`}>Vendas permitidas até {salesLimit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
                        </View>
                    </View>
                )}

                {/* Sales Limit Progress */}
                <View style={tw`bg-surface p-4 rounded-xl mb-6 shadow-lg border border-gray-800`}>
                    <Text style={tw`text-gray-400 text-xs font-bold uppercase mb-2`}>Limite Diário de Vendas</Text>
                    <View style={tw`h-4 bg-gray-700 rounded-full overflow-hidden mb-2`}>
                        <View style={{ ...tw`h-full rounded-full ${isLimitReached ? 'bg-red-500' : 'bg-primary'}`, width: `${percentUsed}%` }} />
                    </View>
                    <View style={tw`flex-row justify-between`}>
                        <Text style={tw`text-white font-bold`}>{totalSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
                        <Text style={tw`text-gray-400`}>{salesLimit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
                    </View>
                    {isLimitReached && !summary?.limitOverrideExpiresAt && (
                        <Text style={tw`text-red-400 text-xs mt-2 font-bold`}>LIMITE ATINGIDO! Contate seu supervisor.</Text>
                    )}
                </View>

                {/* Financial Summary */}
                <View style={tw`flex-row flex-wrap justify-between`}>
                    <View style={tw`w-[48%] bg-surface p-4 rounded-xl mb-4 border border-gray-800`}>
                        <Text style={tw`text-gray-400 text-xs uppercase`}>Total Vendas</Text>
                        <Text style={tw`text-emerald-400 text-xl font-bold mt-1`}>
                            {summary?.totalSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </Text>
                    </View>
                    <View style={tw`w-[48%] bg-surface p-4 rounded-xl mb-4 border border-gray-800`}>
                        <Text style={tw`text-gray-400 text-xs uppercase`}>Total Créditos</Text>
                        <Text style={tw`text-blue-400 text-xl font-bold mt-1`}>
                            {summary?.totalCredits.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </Text>
                    </View>
                    <View style={tw`w-[48%] bg-surface p-4 rounded-xl mb-4 border border-gray-800`}>
                        <Text style={tw`text-gray-400 text-xs uppercase`}>Total Débitos</Text>
                        <Text style={tw`text-red-400 text-xl font-bold mt-1`}>
                            {summary?.totalDebits.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </Text>
                    </View>
                    <View style={tw`w-[48%] bg-surface p-4 rounded-xl mb-4 border border-gray-800`}>
                        <Text style={tw`text-gray-400 text-xs uppercase`}>Saldo Final</Text>
                        <Text style={tw`text-white text-xl font-bold mt-1`}>
                            {summary?.finalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </Text>
                    </View>
                </View>

                {/* Action Button */}
                {!summary?.isClosed && (
                    <TouchableOpacity
                        style={tw`bg-red-600 p-4 rounded-xl items-center mt-4 shadow-lg active:opacity-90`}
                        onPress={handleCloseBox}
                        disabled={closing}
                    >
                        {closing ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={tw`text-white font-bold text-lg uppercase`}>Fechar Caixa do Dia</Text>
                        )}
                    </TouchableOpacity>
                )}

            </ScrollView>

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
                showCancel={alertConfig.showCancel}
                onConfirm={alertConfig.onConfirm}
            />
        </SafeAreaView>
    );
}
