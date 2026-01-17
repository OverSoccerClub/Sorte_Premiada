import React, { useState } from "react";
import * as Application from 'expo-application';
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import tw from "../lib/tailwind";
import { AppConfig } from "../constants/AppConfig";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { UpdatesService } from "../services/updates.service";
import { UpdaterService } from "../services/updater.service";
import { CustomAlert, AlertType } from "./CustomAlert";
import { useCompany } from "../context/CompanyContext";

export function VersionFooter() {
    const insets = useSafeAreaInsets();
    const { settings } = useCompany();
    const [isChecking, setIsChecking] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean; title: string; message: string; type: AlertType;
        showCancel?: boolean; onConfirm?: () => void; confirmText?: string; cancelText?: string;
        useAppIcon?: boolean;
    }>({ visible: false, title: "", message: "", type: "info" });

    const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

    const handleCheckUpdate = async () => {
        if (isChecking) return;
        setIsChecking(true);

        // Min loading time for UX
        const minLoadPromise = new Promise(resolve => setTimeout(resolve, 1000));

        try {
            // 1. Check for NATIVE APK update first
            const nativeUpdate = await UpdaterService.checkForUpdates(settings.updateUrl);

            if (nativeUpdate) {
                setAlertConfig({
                    visible: true,
                    title: "Nova Versão Disponível",
                    message: `Versão ${nativeUpdate.version} disponível (Sua: ${Application.nativeApplicationVersion}). Deseja atualizar?\n\n${nativeUpdate.notes || ''}`,
                    type: "success",
                    showCancel: !nativeUpdate.force,
                    confirmText: "Baixar Agora",
                    cancelText: "Depois",
                    onConfirm: async () => {
                        // DO NOT close alert immediately. Transition directly to Downloading state.

                        // 1. Show downloading state
                        setAlertConfig({
                            visible: true,
                            title: "Baixando...",
                            message: "Iniciando download... 0%",
                            type: "info",
                            showCancel: false,
                            useAppIcon: true
                        });

                        try {
                            await UpdaterService.downloadUpdate(nativeUpdate.apkUrl, settings.updateUrl, (progress) => {
                                const percent = Math.round(progress * 100);
                                setAlertConfig(prev => ({
                                    ...prev,
                                    title: "Baixando...",
                                    message: `Baixando atualização... ${percent}%`,
                                    type: "info",
                                    showCancel: false,
                                    useAppIcon: true
                                }));
                            });

                            setAlertConfig({
                                visible: true,
                                title: "Instalação",
                                message: "O instalador será aberto agora. Siga as instruções na tela.",
                                type: "success",
                                confirmText: "OK",
                                onConfirm: hideAlert
                            });
                        } catch (err: any) {
                            setAlertConfig({
                                visible: true,
                                title: "Falha na Atualização",
                                message: err.message || "Erro desconhecido ao baixar.",
                                type: "error",
                                showCancel: false,
                                confirmText: "OK",
                                onConfirm: hideAlert
                            });
                        }
                    }
                });
                return;
            }

            // 2. If no native update, check for OTA (Code) update
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
                        setAlertConfig(prev => ({ ...prev, visible: false })); // Close confirm
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
                            console.error(e);
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
            setAlertConfig({ visible: true, title: "Erro", message: (error as any).message || "Não foi possível verificar atualizações.", type: "error" });
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
                    <MaterialCommunityIcons name="clover" size={12} color={settings.primaryColor || "#50C878"} style={tw`mr-1`} />
                    <Text style={tw`text-gray-400 font-bold text-[10px] tracking-widest`}>{settings.companyName}</Text>
                </View>

                <View style={tw`flex-row items-center gap-2`}>
                    <Text style={tw`text-gray-700 text-[10px] font-semibold`}>Versão {Application.nativeApplicationVersion}</Text>
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
                useAppIcon={alertConfig.useAppIcon}
            />
        </>
    );
}
