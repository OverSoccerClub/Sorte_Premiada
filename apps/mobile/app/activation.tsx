import { useState } from "react";
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import tw from "../lib/tailwind";
import { useCompany } from "../context/CompanyContext";
import { CustomAlert, AlertType } from "../components/CustomAlert";
import { VersionFooter } from "../components/VersionFooter";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScreenLayout } from "../components/ScreenLayout";
import { FormField } from "../components/FormField";

export default function ActivationScreen() {
    const [activationCode, setActivationCode] = useState("");
    const [isActivating, setIsActivating] = useState(false);
    const router = useRouter();
    const { activateDevice } = useCompany();

    // Alert State
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type: AlertType;
    }>({
        visible: false,
        title: "",
        message: "",
        type: "error",
    });

    const showAlert = (title: string, message: string, type: AlertType = "error") => {
        setAlertConfig({ visible: true, title, message, type });
    };

    const hideAlert = () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
    };

    const validateCodeFormat = (code: string): boolean => {
        // Formato esperado: XX-XXXX-XXXXXX (ex: AP-A3B9-K7M2N5)
        const regex = /^[A-Z]{2}-\d{4}-[A-Z0-9]{6}$/i;
        return regex.test(code);
    }

    const handleActivate = async () => {
        const code = activationCode.trim().toUpperCase();

        if (!code) {
            showAlert("Campo Obrigatório", "Por favor, digite o código de ativação.", "warning");
            return;
        }

        if (!validateCodeFormat(code)) {
            showAlert(
                "Código Inválido",
                "O código deve estar no formato: XX-YYYY-XXXXXX\nExemplo: AP-2026-ABC123",
                "warning"
            );
            return;
        }

        setIsActivating(true);
        try {
            await activateDevice(code);

            // Sucesso! Mostrar mensagem e redirecionar
            showAlert(
                "Dispositivo Ativado!",
                "Seu dispositivo foi ativado com sucesso. Você será redirecionado para a tela de login.",
                "success"
            );

            // Redirecionar após 2 segundos
            setTimeout(() => {
                router.replace("/");
            }, 2000);
        } catch (error: any) {
            showAlert(
                "Erro na Ativação",
                error.message || "Não foi possível ativar o dispositivo. Verifique o código e tente novamente.",
                "error"
            );
        } finally {
            setIsActivating(false);
        }
    };

    const formatCodeInput = (text: string) => {
        // Remove caracteres não permitidos e converte para maiúsculas
        let cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '');

        // Adiciona hífens automaticamente
        if (cleaned.length > 2) {
            cleaned = cleaned.slice(0, 2) + '-' + cleaned.slice(2);
        }
        if (cleaned.length > 7) {
            cleaned = cleaned.slice(0, 7) + '-' + cleaned.slice(7);
        }

        // Limita ao tamanho máximo (XX-XXXX-XXXXXX = 14 caracteres com hífens)
        return cleaned.slice(0, 14);
    };

    return (
        <ScreenLayout>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={tw`flex-1 w-full justify-center items-center p-4`}
            >
                <ScrollView
                    style={{ width: '100%' }}
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    overScrollMode="never"
                >
                    {/* Header */}
                    <View style={tw`w-full max-w-[400px] items-center mb-8`}>
                        <View style={tw`w-24 h-24 bg-surface rounded-3xl justify-center items-center shadow-lg border-2 border-primary mb-4`}>
                            <MaterialCommunityIcons name="shield-lock" size={48} color="#50C878" />
                        </View>
                        <Text style={tw`text-3xl font-extrabold text-white tracking-tight text-center`}>
                            Ativar Dispositivo
                        </Text>
                        <Text style={tw`text-gray-400 text-sm text-center mt-2 px-4`}>
                            Digite o código de ativação fornecido pelo administrador
                        </Text>
                    </View>

                    {/* Form Card */}
                    <View style={tw`w-full max-w-[360px] bg-surface p-6 rounded-2xl shadow-2xl border border-gray-800`}>
                        <FormField
                            label="Código de Ativação"
                            value={activationCode}
                            onChangeText={(text) => setActivationCode(formatCodeInput(text))}
                            autoCapitalize="characters"
                            placeholder="XX-XXXX-XXXXXX"
                            containerStyle={tw`mb-6`}
                            style={tw`h-14 text-lg font-mono text-center tracking-widest`}
                            maxLength={14}
                        />

                        {/* Instruções */}
                        <View style={tw`mb-6 p-4 bg-blue-900/20 border border-blue-700/30 rounded-xl`}>
                            <Text style={tw`text-blue-300 text-xs font-semibold mb-2`}>
                                📋 INSTRUÇÕES:
                            </Text>
                            <Text style={tw`text-blue-200 text-xs leading-5`}>
                                1. Solicite o código ao administrador{'\n'}
                                2. Digite o código no formato: XX-XXXX-XXXXXX{'\n'}
                                3. Aguarde a validação{'\n'}
                                4. Após ativação, faça login normalmente
                            </Text>
                        </View>

                        {/* Botão de Ativação */}
                        <TouchableOpacity
                            style={tw`w-full bg-primary p-4 rounded-xl items-center shadow-lg shadow-primary/50 ${isActivating ? 'opacity-70' : 'active:scale-95'
                                } transition-transform`}
                            onPress={handleActivate}
                            disabled={isActivating}
                        >
                            {isActivating ? (
                                <View style={tw`flex-row items-center`}>
                                    <ActivityIndicator color="#fff" size="small" />
                                    <Text style={tw`text-white font-bold text-base uppercase tracking-wide ml-2`}>
                                        Ativando...
                                    </Text>
                                </View>
                            ) : (
                                <Text style={tw`text-white font-bold text-base uppercase tracking-wide`}>
                                    Ativar Dispositivo
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Exemplo de Código */}
                        <View style={tw`mt-4 items-center`}>
                            <Text style={tw`text-gray-500 text-xs`}>
                                Exemplo: <Text style={tw`font-mono text-gray-400`}>AP-A3B9-K7M2N5</Text>
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <View style={tw`pb-4`}>
                <VersionFooter />
            </View>

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={hideAlert}
            />

            <StatusBar style="light" />
        </ScreenLayout>
    );
}
