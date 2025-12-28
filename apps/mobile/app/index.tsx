import { useState } from "react";
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, Linking, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import tw from "../lib/tailwind";
import { useAuth } from "../context/AuthContext";
import { CustomAlert, AlertType } from "../components/CustomAlert";
import { VersionFooter } from "../components/VersionFooter";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { ScreenLayout } from "../components/ScreenLayout";
import { FormField } from "../components/FormField";

export default function LoginScreen() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();
    const { signIn, isLoading } = useAuth();
    const insets = useSafeAreaInsets();

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
        useAppIcon?: boolean;
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
        setAlertConfig({
            visible: true,
            title: "Recuperar Senha",
            message: "Para redefinir sua senha, entre em contato com o suporte administrativo.",
            type: "info",
            showCancel: true,
            cancelText: "Fechar",
            confirmText: "Contatar Suporte",
            useAppIcon: true,
            onConfirm: () => {
                const message = "Olá, estou precisando recuperar minha senha no app Fezinha de Hoje.";
                const url = `whatsapp://send?text=${encodeURIComponent(message)}`;

                Linking.openURL(url).catch(() => {
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
                    <View style={tw`w-full max-w-[400px] items-center mb-8`}>
                        <View style={tw`w-24 h-24 bg-surface rounded-3xl justify-center items-center shadow-lg border border-primary mb-4`}>
                            <MaterialCommunityIcons name="clover" size={48} color="#50C878" />
                        </View>
                        <Text style={tw`text-4xl font-extrabold text-white tracking-tighter`}>
                            Fezinha <Text style={tw`text-primary`}>de Hoje</Text>
                        </Text>
                        <Text style={tw`text-gray-400 text-sm tracking-widest uppercase mt-1`}>Cambista Edition</Text>
                    </View>

                    <View style={tw`w-full max-w-[400px] bg-surface p-8 rounded-3xl shadow-2xl border border-gray-800`}>
                        <FormField
                            label="Usuário"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            placeholder="Digite seu usuário"
                            containerStyle={tw`mb-6`}
                            style={tw`h-14`}
                        />

                        <FormField
                            label="Senha"
                            value={password}
                            onChangeText={setPassword}
                            isPassword
                            placeholder="Digite sua senha"
                            containerStyle={tw`mb-8`}
                            style={tw`h-14`}
                        />

                        <TouchableOpacity
                            style={tw`w-full bg-primary p-4 rounded-xl items-center shadow-lg shadow-primary/50 active:scale-95 transition-transform`}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            <Text style={tw`text-white font-bold text-lg uppercase tracking-wide`}>
                                {isLoading ? "Entrando..." : "Acessar Sistema"}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={tw`mt-6 items-center`}
                            onPress={handleForgotPassword}
                        >
                            <Text style={tw`text-gray-500 text-sm font-semibold hover:text-primary`}>
                                Esqueceu a senha?
                            </Text>
                        </TouchableOpacity>
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
                showCancel={alertConfig.showCancel}
                onConfirm={alertConfig.onConfirm}
                confirmText={alertConfig.confirmText}
                cancelText={alertConfig.cancelText}
                useAppIcon={alertConfig.useAppIcon}
            />
        </ScreenLayout>
    );
}
