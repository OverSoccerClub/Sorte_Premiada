import { useState, useCallback, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions, Share, Alert, Modal, TextInput } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import tw from "../../lib/tailwind";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuth } from "../../context/AuthContext";


const { height } = Dimensions.get("window");
import { usePrinter } from "../../context/PrinterContext";
import { FinanceService, FinanceSummary } from "../../services/finance.service";
import { printDailyReport, formatDailyReport } from "../../services/printing.service";
import { CustomAlert } from "../../components/CustomAlert";
import { ReportPreview } from "../../components/ReportPreview";
import { SangriaModal } from "../../components/SangriaModal"; // Added import
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";

export default function FinanceScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const { printerType } = usePrinter();
    const insets = useSafeAreaInsets();
    // 70 (base tab height) + insets.bottom (safe area) + 50 (extra spacing)
    const BOTTOM_PADDING = 70 + insets.bottom + 50;

    const [summary, setSummary] = useState<FinanceSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [sangriaModalVisible, setSangriaModalVisible] = useState(false); // Added state

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

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [transactionType, setTransactionType] = useState<'CREDIT' | 'DEBIT'>('DEBIT');
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Details Modal State
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);

    // Report Preview State
    const [reportModalVisible, setReportModalVisible] = useState(false);
    const viewShotRef = useRef<ViewShot>(null);

    const loadData = useCallback(async () => {
        if (!token) return;
        try {
            const data = await FinanceService.getSummary(token);
            setSummary(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    useFocusEffect(
        useCallback(() => {
            setIsLoading(true);
            loadData();
        }, [loadData])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleOpenModal = (type: 'CREDIT' | 'DEBIT') => {
        setTransactionType(type);
        setDescription("");
        setAmount("");
        setModalVisible(true);
    };

    const handleOpenDetails = () => {
        if (summary?.tickets && summary.tickets.length > 0) {
            setDetailsModalVisible(true);
        } else {
            showAlert("Analítico", "Não há vendas registradas hoje.", "info");
        }
    };

    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
        setAlertConfig({ visible: true, title, message, type, showCancel: false, onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false })) });
    };

    const handleSubmitTransaction = async () => {
        if (!description || !amount) {
            showAlert("Erro", "Preencha todos os campos.", "error");
            return;
        }
        setIsSubmitting(true);
        const success = await FinanceService.createTransaction(token!, {
            description,
            amount: parseFloat(amount.replace(',', '.')),
            type: transactionType
        });
        setIsSubmitting(false);
        if (success) {
            setModalVisible(false);
            loadData();
            showAlert("Sucesso", "Transação salva com sucesso!", "success");
        } else {
            showAlert("Erro", "Falha ao salvar transação.", "error");
        }
    };

    const handleShareReport = async () => {
        try {
            // Need to wait a bit for render if just opened, but usually it's open already
            if (viewShotRef.current && (viewShotRef.current as any).capture) {
                const uri = await (viewShotRef.current as any).capture();
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri);
                } else {
                    showAlert("Erro", "Compartilhamento não suportado neste dispositivo.", "error");
                }
            } else {
                showAlert("Erro", "Não foi possível capturar a imagem do relatório.", "error");
            }
        } catch (error) {
            console.error("Share error", error);
            showAlert("Erro", "Falha ao compartilhar imagem.", "error");
        }
    };

    const handlePrintReport = async () => {
        if (!summary) return;

        let imageUri = undefined;
        try {
            if (viewShotRef.current && (viewShotRef.current as any).capture) {
                imageUri = await (viewShotRef.current as any).capture();
                console.log("Captured Report URI for Printing:", imageUri);
            }
        } catch (e) {
            console.warn("Failed to capture report view for printing, falling back to text", e);
        }

        const printed = await printDailyReport({
            ...summary,
            date: new Date()
        }, printerType, imageUri);

        if (printed) showAlert("Sucesso", "Enviado para impressora.", "success");
        else showAlert("Erro", "Falha na impressão.", "error");
    };

    const handleOpenPreview = () => {
        // Shows the report preview (Pre-Close)
        setReportModalVisible(true);
    };

    const handleConfirmClose = () => {
        setAlertConfig({
            visible: true,
            title: "ATENÇÃO: ENCERRAR DIA",
            message: "Você está prestes a bloquear o caixa. \n\n⚠️ Ao confirmar, você NÃO poderá mais vender bilhetes ou lançar movimentações hoje.\n\nCertifique-se de que já conferiu, imprimiu ou enviou o relatório.",
            type: "warning",
            showCancel: true,
            onConfirm: performCloseDay
        });
    };

    const performCloseDay = async () => {
        setAlertConfig(prev => ({ ...prev, visible: false })); // Close confirmation
        if (!summary) return;
        setIsLoading(true);

        // 1. Close in Backend
        const result = await FinanceService.closeDay(token!);
        setIsLoading(false);

        if (result) {
            // Refresh Data to show closed state
            loadData();
            // We can keep the modal open or close it. 
            // Maybe show a success inside the modal or just refresh.
            // Let's Refresh and show updated state.
            showAlert("Sucesso", "Caixa encerrado com sucesso!", "success");
        } else {
            showAlert("Erro", "Falha ao fechar caixa.", "error");
        }
    };

    const formatCurrency = (val: number | string) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return `R$ ${num.toFixed(2).replace('.', ',')}`;
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-background`}>
            {/* Header */}
            <View style={tw`p-6 border-b border-gray-800 bg-surface flex-row items-center`}>
                <TouchableOpacity onPress={() => router.push("/(tabs)")} style={tw`mr-4 p-2 bg-gray-800 rounded-full border border-gray-700`}>
                    <Ionicons name="arrow-back" size={24} color="#94a3b8" />
                </TouchableOpacity>
                <View>
                    <TouchableOpacity onLongPress={async () => {
                        const info = await FinanceService.getDebugInfo(token!);
                        if (info) {
                            Alert.alert("Debug Info", JSON.stringify(info, null, 2));
                        } else {
                            Alert.alert("Debug", "Falha ao obter info.");
                        }
                    }}>
                        <Text style={tw`text-2xl font-bold text-white`}>Financeiro</Text>
                    </TouchableOpacity>
                    <Text style={tw`text-gray-400 text-sm`}>Gestão de caixa diário</Text>
                </View>
            </View>

            <ScrollView
                overScrollMode="never"
                contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingVertical: 16, paddingBottom: BOTTOM_PADDING }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#50C878" />}
            >
                <View style={tw`w-[90%] max-w-[400px]`}>
                    {/* Sales Limit Progress */}
                    <View style={tw`bg-surface p-4 rounded-xl border border-gray-800 mb-6`}>
                        <View style={tw`flex-row justify-between mb-2`}>
                            <Text style={tw`text-gray-400 text-xs uppercase`}>Limite de Vendas Diário</Text>
                            <Text style={tw`text-gray-400 text-xs`}>
                                {Math.min(((summary?.totalSales || 0) / (summary?.salesLimit || 1000)) * 100, 100).toFixed(1)}%
                            </Text>
                        </View>
                        <View style={tw`h-2 bg-gray-700 rounded-full overflow-hidden mb-2`}>
                            <View
                                style={[
                                    tw`h-full rounded-full`,
                                    {
                                        width: `${Math.min(((summary?.totalSales || 0) / (summary?.salesLimit || 1000)) * 100, 100)}%`,
                                        backgroundColor: (summary?.totalSales || 0) >= (summary?.salesLimit || 1000) ? '#ef4444' : '#10b981'
                                    }
                                ]}
                            />
                        </View>
                        <View style={tw`flex-row justify-between`}>
                            <Text style={tw`text-white font-bold`}>{formatCurrency(summary?.totalSales || 0)}</Text>
                            <Text style={tw`text-gray-400`}>de {formatCurrency(summary?.salesLimit || 1000)}</Text>
                        </View>
                    </View>

                    {/* Summary Cards */}
                    <View style={tw`flex-row flex-wrap justify-between gap-y-3 mb-6`}>
                        <TouchableOpacity
                            onPress={handleOpenDetails}
                            style={tw`w-[48%] bg-surface p-4 rounded-xl border border-gray-800`}
                        >
                            <Text style={tw`text-gray-400 text-xs uppercase`}>Vendas do Dia</Text>
                            <Text style={tw`text-emerald-500 text-xl font-bold mt-1`}>
                                {summary ? formatCurrency(summary.totalSales) : "..."}
                            </Text>
                            <Text style={tw`text-emerald-500/50 text-[10px] mt-1`}>Toque para detalhar</Text>
                        </TouchableOpacity>
                        <View style={tw`w-[48%] bg-surface p-4 rounded-xl border border-gray-800`}>
                            <Text style={tw`text-gray-400 text-xs uppercase`}>Saldo Final</Text>
                            <Text style={tw`text-white text-xl font-bold mt-1`}>
                                {summary ? formatCurrency(summary.finalBalance) : "..."}
                            </Text>
                        </View>
                        <View style={tw`w-[48%] bg-surface p-4 rounded-xl border border-gray-800`}>
                            <Text style={tw`text-gray-400 text-xs uppercase`}>Créditos</Text>
                            <Text style={tw`text-blue-400 text-lg font-bold mt-1`}>
                                {summary ? formatCurrency(summary.totalCredits) : "..."}
                            </Text>
                        </View>
                        <View style={tw`w-[48%] bg-surface p-4 rounded-xl border border-gray-800`}>
                            <Text style={tw`text-gray-400 text-xs uppercase`}>Débitos</Text>
                            <Text style={tw`text-red-400 text-lg font-bold mt-1`}>
                                {summary ? formatCurrency(summary.totalDebits) : "..."}
                            </Text>
                        </View>
                    </View>

                    {/* Actions */}
                    <View style={tw`mb-6`}>
                        <View style={tw`flex-row gap-3 mb-3`}>
                            <TouchableOpacity
                                onPress={() => handleOpenModal('CREDIT')}
                                disabled={summary?.isClosed}
                                style={tw`flex-1 bg-blue-500/10 border border-blue-500/30 p-3 rounded-xl items-center flex-row justify-center ${summary?.isClosed ? 'opacity-50' : ''}`}
                            >
                                <Ionicons name="add-circle" size={20} color="#60a5fa" style={tw`mr-2`} />
                                <Text style={tw`text-blue-400 font-bold`}>Crédito</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleOpenModal('DEBIT')}
                                disabled={summary?.isClosed}
                                style={tw`flex-1 bg-red-500/10 border border-red-500/30 p-3 rounded-xl items-center flex-row justify-center ${summary?.isClosed ? 'opacity-50' : ''}`}
                            >
                                <Ionicons name="remove-circle" size={20} color="#f87171" style={tw`mr-2`} />
                                <Text style={tw`text-red-400 font-bold`}>Débito</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={() => setSangriaModalVisible(true)}
                            disabled={summary?.isClosed}
                            style={tw`w-full bg-indigo-500/10 border border-indigo-500/30 p-3 rounded-xl items-center flex-row justify-center ${summary?.isClosed ? 'opacity-50' : ''}`}
                        >
                            <Ionicons name="cash-outline" size={20} color="#818cf8" style={tw`mr-2`} />
                            <Text style={tw`text-indigo-400 font-bold uppercase`}>Sangria / Recolhimento</Text>
                        </TouchableOpacity>
                    </View>

                    {summary?.isClosed && (
                        <View style={tw`mb-6 p-4 bg-orange-500/10 border border-orange-500/50 rounded-xl flex-row items-center`}>
                            <Ionicons name="lock-closed" size={24} color="#f97316" style={tw`mr-3`} />
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-orange-500 font-bold`}>Caixa Fechado</Text>
                                <Text style={tw`text-orange-400/80 text-xs`}>Movimentações bloqueadas.</Text>
                            </View>
                        </View>
                    )}

                    {/* Transitions List */}
                    <Text style={tw`text-white font-bold text-lg mb-3`}>Movimentações</Text>
                    {summary?.transactions && summary.transactions.length > 0 ? (
                        summary.transactions.map((t) => (
                            <View key={t.id} style={tw`bg-surface p-3 rounded-xl border border-gray-800 mb-2 flex-row justify-between items-center`}>
                                <View>
                                    <Text style={tw`text-white font-bold`}>{t.description}</Text>
                                    <Text style={tw`text-gray-500 text-xs`}>{new Date(t.createdAt).toLocaleTimeString()}</Text>
                                </View>
                                <Text style={tw`font-bold ${t.type === 'CREDIT' ? 'text-blue-400' : 'text-red-400'}`}>
                                    {t.type === 'CREDIT' ? '+' : '-'} {formatCurrency(t.amount)}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <Text style={tw`text-gray-500 text-center py-4`}>Nenhuma movimentação hoje.</Text>
                    )}

                    <TouchableOpacity
                        onPress={handleOpenPreview} // Changed from handleCloseDay
                        disabled={summary?.isClosed}
                        style={tw`mt-8 bg-emerald-600 p-4 rounded-xl items-center flex-row justify-center ${summary?.isClosed ? 'opacity-50' : ''}`}
                    >
                        <Ionicons name="receipt" size={24} color="white" style={tw`mr-2`} />
                        <Text style={tw`text-white font-bold text-lg`}>{summary?.isClosed ? "Caixa Fechado" : "Conferir Fechamento"}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Modal Transaction */}
            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={tw`flex-1 justify-end bg-black/50`}>
                    <View style={tw`bg-surface rounded-t-3xl p-6 border-t border-gray-800`}>
                        <View style={tw`flex-row justify-between items-center mb-6`}>
                            <Text style={tw`text-xl font-bold text-white`}>
                                {transactionType === 'CREDIT' ? 'Adicionar Crédito' : 'Adicionar Débito'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>

                        <Text style={tw`text-gray-400 mb-2`}>Descrição</Text>
                        <TextInput
                            style={tw`bg-background text-white p-4 rounded-xl border border-gray-700 mb-4`}
                            placeholder="Ex: Pagamento, Troco..."
                            placeholderTextColor="#64748b"
                            value={description}
                            onChangeText={setDescription}
                        />

                        <Text style={tw`text-gray-400 mb-2`}>Valor (R$)</Text>
                        <TextInput
                            style={tw`bg-background text-white p-4 rounded-xl border border-gray-700 mb-6`}
                            placeholder="0,00"
                            placeholderTextColor="#64748b"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                        />

                        <TouchableOpacity
                            onPress={handleSubmitTransaction}
                            disabled={isSubmitting}
                            style={tw`bg-emerald-600 p-4 rounded-xl items-center`}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={tw`text-white font-bold text-lg`}>Salvar</Text>
                            )}
                        </TouchableOpacity>
                        <View style={tw`h-8`} />
                    </View>
                </View>
            </Modal>

            {/* Details Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={detailsModalVisible}
                onRequestClose={() => setDetailsModalVisible(false)}
            >
                <View style={tw`flex-1 justify-end bg-black/50`}>
                    <View style={tw`bg-surface rounded-t-3xl p-6 border-t border-gray-800 h-[80%]`}>
                        <View style={tw`flex-row justify-between items-center mb-6`}>
                            <Text style={tw`text-xl font-bold text-white`}>Detalhamento de Vendas</Text>
                            <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={tw`pb-8`}>
                            {summary?.tickets && summary.tickets.map((ticket, index) => (
                                <View key={ticket.id} style={tw`bg-background p-4 rounded-xl border border-gray-700 mb-3`}>
                                    <View style={tw`flex-row justify-between items-start mb-2`}>
                                        <Text style={tw`text-emerald-400 font-bold text-lg`}>{ticket.gameType}</Text>
                                        <Text style={tw`text-white font-bold`}>{formatCurrency(ticket.amount)}</Text>
                                    </View>
                                    <Text style={tw`text-gray-400 text-xs mb-2`}>
                                        {new Date(ticket.createdAt).toLocaleTimeString()} - ID: {ticket.id.split('-')[0]}
                                    </Text>
                                    <View style={tw`flex-row flex-wrap gap-1`}>
                                        {ticket.numbers.map((num, i) => (
                                            <View key={i} style={tw`bg-emerald-500/20 px-2 py-1 rounded`}>
                                                <Text style={tw`text-emerald-400 text-xs font-bold`}>{String(num).padStart(2, '0')}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Report Preview Modal */}
            <Modal
                transparent={true}
                visible={reportModalVisible}
                animationType="slide"
                onRequestClose={() => setReportModalVisible(false)}
            >
                <View style={tw`flex-1 justify-center items-center bg-black/80`}>
                    <View style={tw`w-full h-full bg-transparent justify-center my-4 px-1`}>
                        {/* Close Button Row */}
                        <View style={tw`flex-row justify-end mb-2 mr-2`}>
                            <TouchableOpacity onPress={() => setReportModalVisible(false)} style={tw`bg-gray-800 rounded-full p-2 border border-gray-600`}>
                                <Ionicons name="close" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={tw`bg-transparent flex-1`}
                            contentContainerStyle={tw`pb-8 items-center justify-center`}
                            showsVerticalScrollIndicator={false}
                        >
                            {summary && (
                                <ViewShot
                                    ref={viewShotRef}
                                    options={{ format: "jpg", quality: 0.9 }}
                                    style={{ backgroundColor: '#ffffff' }} // Force white background
                                >
                                    <ReportPreview
                                        data={summary}
                                        date={new Date()}
                                        isCapture={true}
                                    />
                                </ViewShot>
                            )}

                            {/* Action Buttons Container */}
                            <View style={tw`w-full mt-6 gap-3`}>
                                <View style={tw`flex-row gap-3`}>
                                    <TouchableOpacity
                                        onPress={handlePrintReport}
                                        style={tw`flex-1 bg-gray-900 p-4 rounded-xl items-center flex-row justify-center border border-gray-700`}
                                    >
                                        <Ionicons name="print" size={20} color="white" style={tw`mr-2`} />
                                        <Text style={tw`text-white font-bold`}>Imprimir</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={handleShareReport}
                                        style={tw`flex-1 bg-green-500 p-4 rounded-xl items-center flex-row justify-center`}
                                    >
                                        <Ionicons name="logo-whatsapp" size={20} color="white" style={tw`mr-2`} />
                                        <Text style={tw`text-white font-bold`}>WhatsApp</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Final Close Button inside Preview */}
                                {!summary?.isClosed && (
                                    <TouchableOpacity
                                        onPress={handleConfirmClose}
                                        style={tw`bg-red-600 p-4 rounded-xl items-center flex-row justify-center`}
                                    >
                                        <Ionicons name="lock-closed" size={20} color="white" style={tw`mr-2`} />
                                        <Text style={tw`text-white font-bold uppercase`}>Encerrar Dia (Definitivo)</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* ... Custom Alert ... */}

            <SangriaModal
                visible={sangriaModalVisible}
                onClose={() => setSangriaModalVisible(false)}
                onSuccess={() => {
                    setSangriaModalVisible(false); // Close Sangria Modal
                    loadData(); // Refresh data
                    // Alert is already shown inside SangriaModal for success, but maybe refresh summary is enough?
                    // Actually SangriaModal shows success.
                }}
            />

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                showCancel={alertConfig.showCancel}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
                onConfirm={alertConfig.onConfirm}
            />
        </SafeAreaView>
    );
}
