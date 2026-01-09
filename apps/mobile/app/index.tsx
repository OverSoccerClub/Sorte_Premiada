import { useState, useEffect } from "react";
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
import { useCompany } from "../context/CompanyContext";
import { Image } from "react-native";

export default function LoginScreen() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();
    const { signIn, isLoading } = useAuth();
    const { settings: company, isActivated, isLoading: companyLoading, activationCode, verificationStatus, clearActivation } = useCompany();
    const insets = useSafeAreaInsets();

    // Redirecionar para ativação se dispositivo não estiver ativado
    useEffect(() => {
        if (!companyLoading && !isActivated) {
            router.replace("/activation");
        }
    }, [isActivated, companyLoading, router]);

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
                const message = `Olá, estou precisando recuperar minha senha no app ${company.companyName}.`;
                const whatsappNumber = company.whatsapp || '';
                const url = whatsappNumber
                    ? `whatsapp://send?phone=${whatsappNumber}&text=${encodeURIComponent(message)}`
                    : `whatsapp://send?text=${encodeURIComponent(message)}`;

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
                    <View style={tw`w-full max-w-[400px] items-center mb-6`}>
                        <View style={tw`w-20 h-20 bg-surface rounded-2xl justify-center items-center shadow-lg border border-primary mb-3`}>
                            {company.logoUrl ? (
                                <Image
                                    source={{ uri: company.logoUrl }}
                                    style={tw`w-16 h-16`}
                                    resizeMode="contain"
                                />
                            ) : (
                                <MaterialCommunityIcons name="clover" size={40} color={company.primaryColor || '#50C878'} />
                            )}
                        </View>
                        <Text style={tw`text-3xl font-extrabold text-white tracking-tighter`}>
                            {company.companyName.split(' ').slice(0, -1).join(' ')} <Text style={[tw`text-primary`, { color: company.primaryColor }]}>{company.companyName.split(' ').slice(-1)[0]}</Text>
                        </Text>
                        {company.slogan && (
                            <Text style={tw`text-gray-400 text-xs tracking-widest uppercase mt-1`}>{company.slogan}</Text>
                        )}
                    </View>

                    <View style={tw`w-full max-w-[360px] bg-surface p-6 rounded-2xl shadow-2xl border border-gray-800`}>
                        <FormField
                            label="Usuário"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            placeholder="Digite seu usuário"
                            containerStyle={tw`mb-4`}
                            style={tw`h-12 text-sm`}
                        />

                        <FormField
                            label="Senha"
                            value={password}
                            onChangeText={setPassword}
                            isPassword
                            placeholder="Digite sua senha"
                            containerStyle={tw`mb-6`}
                            style={tw`h-12 text-sm`}
                        />

                        <TouchableOpacity
                            style={tw`w-full bg-primary p-3 rounded-xl items-center shadow-lg shadow-primary/50 active:scale-95 transition-transform`}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            <Text style={tw`text-white font-bold text-base uppercase tracking-wide`}>
                                {isLoading ? "Entrando..." : "Acessar Sistema"}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={tw`mt-4 items-center`}
                            onPress={handleForgotPassword}
                        >
                            <Text style={tw`text-gray-500 text-xs font-semibold hover:text-primary`}>
                                Esqueceu a senha?
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer Content inside ScrollView to avoid overlap */}
                    <View style={tw`mt-8 items-center w-full max-w-[360px]`}>
                        <View style={tw`mb-4 w-full px-4 py-3 bg-gray-900/50 rounded-xl border border-gray-800/50 items-center`}>
                            <Text style={tw`text-gray-500 text-[10px] font-mono mb-1.5 uppercase tracking-widest`}>Dispositivo</Text>
                            <View style={tw`flex-row items-center`}>
                                <View style={tw`w-2 h-2 rounded-full ${isActivated
                                    ? (verificationStatus === 'verified' ? 'bg-green-400' : 'bg-yellow-400')
                                    : 'bg-red-400'
                                    } mr-2`} />
                                <Text style={tw`text-gray-300 text-xs font-bold uppercase`}>
                                    {isActivated
                                        ? (verificationStatus === 'verified' ? 'Validado' : 'Offline (Cache)')
                                        : 'Não Ativado'
                                    }
                                    {isActivated && activationCode ? ` • ${activationCode}` : ''}
                                </Text>
                            </View>
                        </View>
                        <VersionFooter />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

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
        </ScreenLayout >
    );
}
