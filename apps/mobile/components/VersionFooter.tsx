import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import tw from "../lib/tailwind";
import { AppConfig } from "../constants/AppConfig";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { UpdatesService } from "../services/updates.service";
import { CustomAlert, AlertType } from "./CustomAlert";

export function VersionFooter() {
    const insets = useSafeAreaInsets();
    const [isChecking, setIsChecking] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean; title: string; message: string; type: AlertType;
        showCancel?: boolean; onConfirm?: () => void; confirmText?: string; cancelText?: string;
    }>({ visible: false, title: "", message: "", type: "info" });

    const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

    const handleCheckUpdate = async () => {
        if (isChecking) return;
        setIsChecking(true);

        // Min loading time for UX
        const minLoadPromise = new Promise(resolve => setTimeout(resolve, 1000));

        try {
            const hasUpdate = await UpdatesService.checkForUpdate();
            await minLoadPromise;

            if (hasUpdate) {
                setAlertConfig({
                    visible: true,
                    title: "Nova Versão",
                    message: "Uma nova versão do aplicativo está disponível. Deseja atualizar agora?",
                    type: "info",
                    showCancel: true,
                    confirmText: "Atualizar",
                    onConfirm: async () => {
                        hideAlert();
                        // Show downloading alert? Or just loading?
                        // Let's do a simple blocking loading or just alert.
                        // Ideally we'd show progress but expo-updates simple fetch doesn't broadcast progress easily here.
                        // We will just wait.
                        setIsChecking(true); // Keep spinner
                        try {
                            const fetched = await UpdatesService.fetchUpdate();
                            if (fetched) {
                                setAlertConfig({
                                    visible: true,
                                    title: "Sucesso",
                                    message: "Atualização baixada! O aplicativo será reiniciado.",
                                    type: "success",
                                    confirmText: "Reiniciar",
                                    onConfirm: () => {
                                        UpdatesService.reloadApp();
                                    }
                                });
                            } else {
                                setAlertConfig({ visible: true, title: "Erro", message: "Falha ao baixar atualização.", type: "error" });
                            }
                        } catch (e) {
                            setAlertConfig({ visible: true, title: "Erro", message: "Erro ao baixar.", type: "error" });
                        } finally {
                            setIsChecking(false);
                        }
                    }
                });
            } else {
                setAlertConfig({
                    visible: true,
                    title: "Tudo Certo",
                    message: "Você já está na versão mais recente.",
                    type: "success"
                });
            }
        } catch (error) {
            await minLoadPromise;
            setAlertConfig({ visible: true, title: "Erro", message: "Não foi possível verificar atualizações.", type: "error" });
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleCheckUpdate}
                style={[tw`pt-2 items-center justify-center`, { paddingBottom: 15 }]}
            >
                <View style={tw`flex-row items-center mb-1 opacity-50`}>
                    <MaterialCommunityIcons name="clover" size={12} color="#50C878" style={tw`mr-1`} />
                    <Text style={tw`text-gray-400 font-bold text-[10px] tracking-widest`}>Fezinha do Dia</Text>
                </View>

                <View style={tw`flex-row items-center gap-2`}>
                    <Text style={tw`text-gray-700 text-[8px]`}>Versão {AppConfig.version}</Text>
                    {isChecking && <ActivityIndicator size="small" color="#50C878" style={{ transform: [{ scale: 0.5 }] }} />}
                </View>
            </TouchableOpacity>

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
        </>
    );
}
