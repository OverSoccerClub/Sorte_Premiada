import { useState, useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts, Roboto_400Regular, Roboto_700Bold, Roboto_900Black } from '@expo-google-fonts/roboto';
import { RobotoMono_400Regular, RobotoMono_700Bold } from '@expo-google-fonts/roboto-mono';
import { ActivityIndicator, View } from "react-native";
// import "../global.css";

import { AuthProvider } from "../context/AuthContext";
import { PrinterProvider } from "../context/PrinterContext";
import { LoadingProvider, useLoading } from "../context/LoadingContext";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { CustomAlert, AlertType } from "../components/CustomAlert";

import { usePosTracking } from "../hooks/usePosTracking";
import { UpdaterService, VersionInfo } from "../services/updater.service";

// Component responsible for Initializations (POS Tracking, Updates, etc)
function AppInit() {
    usePosTracking();
    const { show, hide } = useLoading();

    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type: AlertType;
        showCancel?: boolean;
        onConfirm?: () => void;
        confirmText?: string;
    }>({
        visible: false,
        title: "",
        message: "",
        type: "info",
    });

    useEffect(() => {
        let isMounted = true;

        const checkUpdates = async () => {
            // Delay slightly to let app render first
            await new Promise(r => setTimeout(r, 1000));

            if (!isMounted) return;

            show("Verificando atualizações...");

            try {
                const updateInfo = await UpdaterService.checkForUpdates();

                if (!isMounted) return;
                hide();

                if (updateInfo) {
                    setAlertConfig({
                        visible: true,
                        title: "Nova Versão Disponível",
                        message: `A versão ${updateInfo.version} está pronta para instalar.${updateInfo.notes ? '\n\n' + updateInfo.notes : ''}\n\nDeseja atualizar agora?`,
                        type: "success",
                        showCancel: !updateInfo.force,
                        confirmText: "ATUALIZAR",
                        onConfirm: () => {
                            UpdaterService.downloadUpdate(updateInfo.apkUrl);
                            // Keep alert open or show 'Downloading'? 
                            // Usually native browser opens, so we can close alert or keep it.
                            setAlertConfig(prev => ({ ...prev, visible: false }));
                        }
                    });
                } else {
                    // Silent success - no update needed
                }
            } catch (err) {
                hide();
                console.warn("Update check error (silent to user):", err);
            }
        };

        checkUpdates();

        return () => { isMounted = false; };
    }, []);

    return (
        <CustomAlert
            visible={alertConfig.visible}
            title={alertConfig.title}
            message={alertConfig.message}
            type={alertConfig.type}
            showCancel={alertConfig.showCancel}
            onConfirm={alertConfig.onConfirm}
            confirmText={alertConfig.confirmText}
            onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
        />
    );
}

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        Roboto_400Regular,
        Roboto_700Bold,
        Roboto_900Black,
        RobotoMono_400Regular,
        RobotoMono_700Bold,
    });

    if (!fontsLoaded) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    return (
        <LoadingProvider>
            <AuthProvider>
                <PrinterProvider>
                    <SafeAreaProvider>
                        <AppInit />
                        <Stack screenOptions={{ headerShown: false }}>
                            <Stack.Screen name="index" />
                            <Stack.Screen name="(tabs)" />
                            <Stack.Screen name="settings/printer" options={{ presentation: 'modal' }} />
                        </Stack>
                        <StatusBar style="auto" />
                        <LoadingOverlay />
                    </SafeAreaProvider>
                </PrinterProvider>
            </AuthProvider>
        </LoadingProvider>
    );
}
