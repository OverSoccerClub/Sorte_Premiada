import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, Linking, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import tw from "../lib/tailwind";
import { useAuth } from "../context/AuthContext";
import { CustomAlert, AlertType } from "../components/CustomAlert";
import { AppConfig } from "../constants/AppConfig";
import { VersionFooter } from "../components/VersionFooter";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function LoginScreen() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const router = useRouter();

    const { signIn, isLoading } = useAuth();

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
        type: "error",
    });

    const showAlert = (title: string, message: string, type: AlertType = "error") => {
        setAlertConfig({ visible: true, title, message, type });
    };

    const hideAlert = () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
    };

    const handleLogin = async () => {
        if (!username || !password) {
            showAlert("Campos Obrigatórios", "Por favor, preencha usuário e senha.", "warning");
            return;
        }
        try {
            await signIn(username, password);
        } catch (error: any) {
            showAlert("Erro no Login", error.message || "Ocorreu um erro ao tentar entrar.", "error");
        }
    };

    const handleForgotPassword = () => {
        // MVP: Contact Admin via WhatsApp
        // TODO: Move phone number to AppConfig if possible, but hardcoding for MVP is fine or use empty if unknown.
        // Assuming a generic placeholder or asking user to provide one if I knew it.
        // I will use a generic message without a specific number if I don't have one, or just open WhatsApp.
        // Better: Alert with "Contact Admin" and button "Open WhatsApp".

        setAlertConfig({
            visible: true,
            title: "Recuperar Senha",
            message: "Para redefinir sua senha, entre em contato com o suporte administrativo.",
            type: "info",
            showCancel: true,
            cancelText: "Fechar",
            confirmText: "Contatar Suporte",
            onConfirm: () => {
                // Open WhatsApp with pre-filled message
                const message = "Olá, estou precisando recuperar minha senha no app Fezinha de Hoje.";
                const url = `whatsapp://send?text=${encodeURIComponent(message)}`;

                Linking.openURL(url).catch(() => {
                    // Fallback if WhatsApp is not installed
                    setAlertConfig(prev => ({
                        ...prev,
                        type: 'error',
                        message: "Não foi possível abrir o WhatsApp. Por favor, entre em contato com o suporte manualmente.",
                        showCancel: false,
                        confirmText: "OK",
                        onConfirm: undefined
                    }));
                });
            }
        });
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-background`}>
            <StatusBar style="light" />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={tw`flex-1 justify-center items-center p-4`}
            >
                <ScrollView
                    style={{ width: '100%' }}
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    overScrollMode="never"
                >
                    <View style={tw`w-[90%] max-w-[400px] items-center mb-2`}>
                        <View style={tw`w-20 h-20 bg-surface rounded-3xl justify-center items-center shadow-lg border border-primary mb-2`}>
                            <MaterialCommunityIcons name="clover" size={40} color="#50C878" />
                        </View>
                        <Text style={tw`text-3xl font-extrabold text-white tracking-tighter`}>
                            Fezinha <Text style={tw`text-primary`}>do Dia</Text>
                        </Text>
                        <Text style={tw`text-gray-400 text-sm tracking-widest uppercase mt-1`}>Cambista Edition</Text>
                    </View>

                    <View style={tw`w-[90%] max-w-[400px] bg-surface p-6 rounded-3xl shadow-2xl border border-gray-800`}>
                        <Text style={tw`text-gray-400 mb-2 font-bold text-xs uppercase tracking-wider`}>Usuário</Text>
                        <TextInput
                            style={tw`w-full h-14 bg-background border border-gray-700 rounded-xl px-4 text-white focus:border-primary mb-4`}
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            placeholder="Digite seu usuário"
                            placeholderTextColor="#475569"
                        />

                        <Text style={tw`text-gray-400 mb-2 font-bold text-xs uppercase tracking-wider`}>Senha</Text>
                        <View style={tw`w-full h-14 bg-background border border-gray-700 rounded-xl mb-6 flex-row items-center focus:border-primary overflow-hidden`}>
                            <TextInput
                                style={tw`flex-1 h-full px-4 text-white`}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!isPasswordVisible}
                                placeholder="Digite sua senha"
                                placeholderTextColor="#475569"
                            />
                            <TouchableOpacity
                                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                                style={tw`h-full justify-center px-4 bg-gray-900/50`}
                            >
                                <Ionicons
                                    name={isPasswordVisible ? "eye-off" : "eye"}
                                    size={24}
                                    color="#94a3b8"
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={tw`w-full bg-primary p-4 rounded-xl items-center shadow-lg shadow-primary/50 active:opacity-90`}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            <Text style={tw`text-white font-bold text-lg uppercase tracking-wide`}>
                                {isLoading ? "Entrando..." : "Acessar Sistema"}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={tw`mt-4`}
                            onPress={handleForgotPassword}
                        >
                            <Text style={tw`text-gray-500 text-sm font-semibold underline`}>
                                Esqueceu a senha?
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

            </KeyboardAvoidingView>
            <VersionFooter />

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
