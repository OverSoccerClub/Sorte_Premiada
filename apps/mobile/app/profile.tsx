import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import tw from "../lib/tailwind";
import { useAuth } from "../context/AuthContext";
import { CustomAlert, AlertType } from "../components/CustomAlert";
import { VersionFooter } from "../components/VersionFooter";
import { ScreenLayout } from "../components/ScreenLayout";
import { ScreenHeader } from "../components/ScreenHeader";
import { FormField } from "../components/FormField";

export default function ProfileScreen() {
    const router = useRouter();
    const { user, updateUser, signOut, token } = useAuth();
    const insets = useSafeAreaInsets();
    const BOTTOM_PADDING = 70 + insets.bottom + 50;

    const [email, setEmail] = useState(user?.email || "");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Alert State
    const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title: string; message: string; type: AlertType }>({
        visible: false,
        title: "",
        message: "",
        type: "success",
    });

    const showAlert = (title: string, message: string, type: AlertType = "success") => {
        setAlertConfig({ visible: true, title, message, type });
    };

    const hideAlert = () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
    };

    const handleSave = async () => {
        if (password && password !== confirmPassword) {
            showAlert("Erro", "As senhas não coincidem.", "error");
            return;
        }

        setIsLoading(true);
        try {
            const body: any = {};
            if (password) body.password = password;

            if (Object.keys(body).length === 0) {
                showAlert("Aviso", "Nenhuma alteração realizada.", "warning");
                setIsLoading(false);
                return;
            }

            const API_URL = "http://192.168.20.102:3000";
            const res = await fetch(`${API_URL}/users/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || "Falha ao atualizar perfil");
            }

            const updatedUser = await res.json();
            updateUser(updatedUser);

            showAlert("Sucesso", "Perfil atualizado com sucesso!", "success");
            setPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            console.error(error);
            showAlert("Erro", "Não foi possível atualizar o perfil.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScreenLayout scrollable contentContainerStyle={{ paddingBottom: BOTTOM_PADDING }}>
            <ScreenHeader title="Meu Perfil" />

            <View style={tw`w-full px-6 py-8`}>
                {/* Profile Avatar & Info */}
                <View style={tw`items-center mb-8`}>
                    <View style={tw`w-28 h-28 bg-surface rounded-full justify-center items-center mb-4 border-4 border-surface shadow-2xl shadow-black/50 relative`}>
                        <View style={tw`absolute inset-0 rounded-full border-2 border-primary/30`} />
                        <Text style={tw`text-5xl font-bold text-primary`}>
                            {user?.username?.charAt(0).toUpperCase() || "U"}
                        </Text>
                    </View>
                    <Text style={tw`text-2xl font-bold text-white mb-1`}>{user?.username}</Text>
                    <View style={tw`bg-primary/20 px-3 py-1 rounded-full border border-primary/30`}>
                        <Text style={tw`text-primary font-bold text-xs uppercase tracking-widest`}>Cambista</Text>
                    </View>
                </View>

                {/* Main Card */}
                <View style={tw`bg-surface p-6 rounded-3xl shadow-xl border border-gray-800 w-full`}>

                    {/* Section: Personal Data */}
                    <View style={tw`mb-8`}>
                        <Text style={tw`text-lg font-bold text-white mb-4 flex-row items-center border-l-4 border-primary pl-3`}>
                            Dados Pessoais
                        </Text>
                        <FormField
                            label="Email"
                            value={email}
                            editable={false}
                            selectTextOnFocus={false}
                            style={tw`text-gray-500`}
                        />
                    </View>

                    {/* Section: Settings */}
                    <View style={tw`mb-6`}>
                        <Text style={tw`text-lg font-bold text-white mb-4 flex-row items-center border-l-4 border-primary pl-3`}>
                            Configurações
                        </Text>
                        <TouchableOpacity
                            style={tw`w-full bg-background p-4 rounded-xl items-center border border-gray-700 mb-2 flex-row justify-between active:bg-gray-800/50`}
                            onPress={() => router.push("/settings/printer")}
                        >
                            <View style={tw`flex-row items-center`}>
                                <View style={tw`w-10 h-10 rounded-full bg-gray-800 items-center justify-center mr-3 border border-gray-700`}>
                                    <Ionicons name="print-outline" size={20} color="#94a3b8" />
                                </View>
                                <Text style={tw`text-gray-200 font-bold text-base`}>Configurar Impressora</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#475569" />
                        </TouchableOpacity>
                    </View>

                    {/* Section: Security */}
                    <View style={tw`mb-8`}>
                        <Text style={tw`text-lg font-bold text-white mb-4 flex-row items-center border-l-4 border-primary pl-3`}>
                            Segurança
                        </Text>

                        <FormField
                            label="Nova Senha"
                            value={password}
                            onChangeText={setPassword}
                            isPassword
                            placeholder="Deixe em branco para manter"
                        />

                        <FormField
                            label="Confirmar Senha"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            isPassword
                            placeholder="Repita a nova senha"
                        />
                    </View>

                    {/* Actions */}
                    <TouchableOpacity
                        style={tw`w-full bg-primary p-4 rounded-xl items-center shadow-lg shadow-primary/30 ${isLoading ? "opacity-70" : ""} mb-4 border-b-4 border-emerald-600 active:border-b-0 active:mt-1`}
                        onPress={handleSave}
                        disabled={isLoading}
                    >
                        <Text style={tw`text-white font-bold text-lg uppercase tracking-wide`}>
                            {isLoading ? "Salvando..." : "Salvar Alterações"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={tw`w-full bg-red-500/10 p-4 rounded-xl items-center border border-red-500/30 active:bg-red-500/20`}
                        onPress={signOut}
                    >
                        <Text style={tw`text-red-500 font-bold text-lg uppercase tracking-wide`}>Sair do App</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={tw`mt-4 mb-8`}>
                <VersionFooter />
            </View>

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={hideAlert}
            />
        </ScreenLayout>
    );
}
