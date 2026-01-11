import { useState, useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts, Roboto_400Regular, Roboto_700Bold, Roboto_900Black } from '@expo-google-fonts/roboto';
import { RobotoMono_400Regular, RobotoMono_700Bold } from '@expo-google-fonts/roboto-mono';
import { ActivityIndicator, View } from "react-native";
import * as SplashScreen from 'expo-splash-screen';

// Prevent auto hiding
SplashScreen.preventAutoHideAsync().catch(() => { });

import { AuthProvider } from "../context/AuthContext";
import { PrinterProvider } from "../context/PrinterContext";
import { LoadingProvider, useLoading } from "../context/LoadingContext";
import { CompanyProvider, useCompany } from "../context/CompanyContext";
import { SettingsProvider } from "../context/SettingsContext";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { CustomAlert, AlertType } from "../components/CustomAlert";

import { usePosTracking } from "../hooks/usePosTracking";
import { UpdaterService, VersionInfo } from "../services/updater.service";

// Component responsible for Initializations (POS Tracking, Updates, etc)
function AppInit() {
    usePosTracking();
    const { settings, isActivated } = useCompany();
    const { show, hide } = useLoading();

    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type: AlertType;
        showCancel?: boolean;
        onConfirm?: () => void;
        confirmText?: string;
        useAppIcon?: boolean;
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

            show("Verificando Atualizações...");

            try {
                const updateInfo = await UpdaterService.checkForUpdates(settings.updateUrl);

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
                        useAppIcon: true,
                        onConfirm: async () => {
                            // Show initial download state
                            setAlertConfig({
                                visible: true,
                                title: "Baixando Atualização",
                                message: "Iniciando download... 0%",
                                type: "info",
                                showCancel: false,
                                useAppIcon: true
                            });

                            try {
                                await UpdaterService.downloadUpdate(updateInfo.apkUrl, settings.updateUrl, (progress) => {
                                    const percent = Math.round(progress * 100);
                                    setAlertConfig(prev => ({
                                        ...prev,
                                        message: `Baixando atualização... ${percent}%`
                                    }));
                                });
                                // Close alert once download is done and installer is opened
                                setAlertConfig(prev => ({ ...prev, visible: false }));
                            } catch (err: any) {
                                setAlertConfig({
                                    visible: true,
                                    title: "Erro no Download",
                                    message: err.message || "Não foi possível baixar a atualização.",
                                    type: "error",
                                    confirmText: "OK",
                                    onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
                                });
                            }
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
    }, [isActivated, settings.updateUrl]);


    return (
        <CustomAlert
            visible={alertConfig.visible}
            title={alertConfig.title}
            message={alertConfig.message}
            type={alertConfig.type}
            showCancel={alertConfig.showCancel}
            onConfirm={alertConfig.onConfirm}
            confirmText={alertConfig.confirmText}
            useAppIcon={alertConfig.useAppIcon}
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

    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const prepare = async () => {
            if (fontsLoaded) {
                setIsReady(true);
                await SplashScreen.hideAsync().catch(() => { });
            }
        };
        prepare();
    }, [fontsLoaded]);

    // Safety Timeout: Force app load after 4 seconds if fonts hang
    useEffect(() => {
        const timeout = setTimeout(async () => {
            if (!isReady) {
                console.warn("Splash screen timeout: Forcing app load");
                setIsReady(true);
                await SplashScreen.hideAsync().catch(() => { });
            }
        }, 4000);
        return () => clearTimeout(timeout);
    }, [isReady]);

    if (!isReady) {
        return null;
    }

    return (
        <LoadingProvider>
            <CompanyProvider>
                <SettingsProvider>
                    <AuthProvider>
                        <PrinterProvider>
                            <SafeAreaProvider>
                                <AppInit />
                                <Stack screenOptions={{ headerShown: false }}>
                                    <Stack.Screen name="activation" />
                                    <Stack.Screen name="index" />
                                    <Stack.Screen name="(tabs)" />
                                    <Stack.Screen name="settings/printer" options={{ presentation: 'modal' }} />
                                </Stack>
                                <StatusBar style="auto" />
                                <LoadingOverlay />
                            </SafeAreaProvider>
                        </PrinterProvider>
                    </AuthProvider>
                </SettingsProvider>
            </CompanyProvider>
        </LoadingProvider>
    );
}
