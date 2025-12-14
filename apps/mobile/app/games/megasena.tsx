import { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, Animated } from "react-native";
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
    const { token } = useAuth(); // Get token
    const { show, hide } = useLoading(); // Global loading
    const { printerType } = usePrinter();
    const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const viewShotRef = useRef(null);

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
        if (selectedNumbers.length !== 6) {
            showAlert("Aposta Incompleta", "Por favor, selecione exatamente 6 números para continuar.", "error");
            return;
        }
        setModalVisible(true);
    };

    const handlePrint = async () => {
        setModalVisible(false);
        show("Processando Aposta..."); // Show global loading

        try {
            const API_URL = AppConfig.api.baseUrl;

            const res = await fetch(`${API_URL}/tickets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    gameType: "Mega Sena",
                    numbers: selectedNumbers,
                    amount: 5.00
                })
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error("Failed to save bet:", res.status, errorText);
                throw new Error(`Falha ao salvar aposta: ${res.status} - ${errorText}`);
            }

            const ticketData = await res.json();

            // Notify loading status update (optional, but keep simple for now)
            // show("Imprimindo..."); 

            // Print the ticket using text
            const printSuccess = await printTicket(
                selectedNumbers,
                ticketData.id,
                new Date(ticketData.createdAt),
                5.00,
                "Mega Sena",
                printerType
            );

            hide(); // Hide before showing alert

            // Delay alert slightly to allow modal to close smoothly
            setTimeout(() => {
                const formattedNumbers = selectedNumbers
                    .sort((a, b) => a - b)
                    .map(n => n.toString().padStart(2, "0"))
                    .join(", ");

                if (printSuccess) {
                    showAlert("Sucesso!", `Aposta salva e enviada para impressão!\n\nNúmeros: ${formattedNumbers}`, "success");
                } else {
                    showAlert("Aposta Salva", `Aposta salva, mas houve um erro na impressão.\n\nNúmeros: ${formattedNumbers}`, "warning");
                }
                setSelectedNumbers([]); // Clear selection
            }, 500);

        } catch (error) {
            hide(); // Hide on error
            console.error(error);
            setTimeout(() => {
                showAlert("Erro", "Não foi possível salvar a aposta. Tente novamente.", "error");
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
                <View style={tw`flex-1 justify-center items-center bg-black/90 p-4`}>
                    <View style={tw`w-[90%] max-w-[400px] items-center`}>
                        <Text style={tw`text-white font-bold text-lg mb-6 uppercase tracking-widest`}>Confira sua Aposta</Text>

                        <View style={tw`w-full mb-8 shadow-2xl shadow-black`}>
                            <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9, result: "tmpfile" }} style={{ backgroundColor: 'white' }}>
                                <TicketPreview
                                    gameName="Mega Sena"
                                    numbers={selectedNumbers}
                                    price="R$ 5,00"
                                />
                            </ViewShot>
                        </View>

                        <View style={tw`w-full gap-3`}>
                            <TouchableOpacity
                                style={tw`w-full bg-emerald-600 p-4 rounded-xl items-center shadow-lg shadow-emerald-600/40 border border-emerald-500`}
                                onPress={handlePrint}
                            >
                                <View style={tw`flex-row items-center`}>
                                    <Ionicons name="print" size={24} color="white" style={tw`mr-2`} />
                                    <Text style={tw`text-white font-bold text-lg uppercase`}>Imprimir Bilhete</Text>
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
        </SafeAreaView>
    );
}
