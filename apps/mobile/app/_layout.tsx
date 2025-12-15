import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts, Roboto_400Regular, Roboto_700Bold, Roboto_900Black } from '@expo-google-fonts/roboto';
import { RobotoMono_400Regular, RobotoMono_700Bold } from '@expo-google-fonts/roboto-mono';
import { ActivityIndicator, View } from "react-native";
// import "../global.css";

import { AuthProvider } from "../context/AuthContext";
import { PrinterProvider } from "../context/PrinterContext";
import { LoadingProvider } from "../context/LoadingContext";
import { LoadingOverlay } from "../components/LoadingOverlay";

import { usePosTracking } from "../hooks/usePosTracking";

// Helper component to use hook inside provider
function PosTracker() {
    usePosTracking();
    return null;
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
                <PosTracker />
                <PrinterProvider>
                    <SafeAreaProvider>
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
