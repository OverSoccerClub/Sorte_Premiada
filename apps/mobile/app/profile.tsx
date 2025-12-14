import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import tw from "../lib/tailwind";
import { useAuth } from "../context/AuthContext";
import { StatusBar } from "expo-status-bar";
import { CustomAlert, AlertType } from "../components/CustomAlert";
import { VersionFooter } from "../components/VersionFooter";

export default function ProfileScreen() {
    const router = useRouter();
    const { user, updateUser, signOut, token } = useAuth();
    const insets = useSafeAreaInsets();
    const BOTTOM_PADDING = 70 + insets.bottom + 50;

    const [email, setEmail] = useState(user?.email || "");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
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
        <SafeAreaView style={tw`flex-1 bg-background`}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={tw`p-4 border-b border-gray-800 flex-row items-center bg-surface`}>
                <TouchableOpacity onPress={() => router.back()} style={tw`p-2 bg-gray-800 rounded-full`}>
                    <Ionicons name="arrow-back" size={24} color="#94a3b8" />
                </TouchableOpacity>
                <Text style={tw`text-xl font-bold ml-4 text-white`}>Meu Perfil</Text>
            </View>

            <ScrollView
                style={tw`flex-1`}
                overScrollMode="never"
                contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingVertical: 24, paddingBottom: BOTTOM_PADDING }}
            >
                <View style={tw`w-[90%] max-w-[400px]`}>
                    <View style={tw`items-center mb-8`}>
                        <View style={tw`w-24 h-24 bg-surface rounded-full justify-center items-center mb-4 border-2 border-primary shadow-lg shadow-primary/30`}>
                            <Text style={tw`text-4xl font-bold text-primary`}>
                                {user?.username?.charAt(0).toUpperCase() || "U"}
                            </Text>
                        </View>
                        <Text style={tw`text-2xl font-bold text-white`}>{user?.username}</Text>
                        <Text style={tw`text-gray-400 uppercase tracking-widest text-xs mt-1`}>Cambista</Text>
                    </View>

                    <View style={tw`bg-surface p-6 rounded-3xl shadow-lg border border-gray-800`}>
                        <Text style={tw`text-lg font-bold text-white mb-6 border-b border-gray-700 pb-2`}>Dados Pessoais</Text>

                        <Text style={tw`mb-2 text-gray-400 text-xs font-bold uppercase`}>Email</Text>
                        <TextInput
                            style={tw`w-full bg-surface border border-gray-700 rounded-xl p-4 mb-6 text-gray-500`}
                            value={email}
                            editable={false}
                            selectTextOnFocus={false}
                        />

                        <Text style={tw`text-lg font-bold text-white mb-6 mt-2 border-b border-gray-700 pb-2`}>Configurações</Text>

                        <TouchableOpacity
                            style={tw`w-full bg-gray-800 p-4 rounded-xl items-center border border-gray-700 mb-6 flex-row justify-between`}
                            onPress={() => router.push("/settings/printer")}
                        >
                            <View style={tw`flex-row items-center`}>
                                <Ionicons name="print-outline" size={24} color="#94a3b8" style={tw`mr-3`} />
                                <Text style={tw`text-gray-300 font-bold text-base`}>Configurar Impressora</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="#475569" />
                        </TouchableOpacity>

                        <Text style={tw`text-lg font-bold text-white mb-6 mt-2 border-b border-gray-700 pb-2`}>Segurança</Text>

                        <Text style={tw`mb-2 text-gray-400 text-xs font-bold uppercase`}>Nova Senha</Text>
                        <View style={tw`w-full bg-background border border-gray-700 rounded-xl mb-4 flex-row items-center focus:border-primary`}>
                            <TextInput
                                style={tw`flex-1 p-4 text-white placeholder-gray-600`}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!isPasswordVisible}
                                placeholder="Deixe em branco para manter"
                                placeholderTextColor="#475569"
                            />
                            <TouchableOpacity
                                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                                style={tw`p-4`}
                            >
                                <Ionicons
                                    name={isPasswordVisible ? "eye-off" : "eye"}
                                    size={24}
                                    color="#94a3b8"
                                />
                            </TouchableOpacity>
                        </View>

                        <Text style={tw`mb-2 text-gray-400 text-xs font-bold uppercase`}>Confirmar Senha</Text>
                        <View style={tw`w-full bg-background border border-gray-700 rounded-xl mb-8 flex-row items-center focus:border-primary`}>
                            <TextInput
                                style={tw`flex-1 p-4 text-white placeholder-gray-600`}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!isConfirmPasswordVisible}
                                placeholder="Repita a nova senha"
                                placeholderTextColor="#475569"
                            />
                            <TouchableOpacity
                                onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                                style={tw`p-4`}
                            >
                                <Ionicons
                                    name={isConfirmPasswordVisible ? "eye-off" : "eye"}
                                    size={24}
                                    color="#94a3b8"
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={tw`w-full bg-primary p-4 rounded-xl items-center shadow-lg shadow-primary/40 ${isLoading ? "opacity-70" : ""} mb-4`}
                            onPress={handleSave}
                            disabled={isLoading}
                        >
                            <Text style={tw`text-white font-bold text-lg uppercase tracking-wide`}>
                                {isLoading ? "Salvando..." : "Salvar Alterações"}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={tw`w-full bg-red-500/10 p-4 rounded-xl items-center border border-red-500/50`}
                            onPress={signOut}
                        >
                            <Text style={tw`text-red-500 font-bold text-lg uppercase tracking-wide`}>Sair do App</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
            <VersionFooter />
            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={hideAlert}
            />
        </SafeAreaView>
    );
}
