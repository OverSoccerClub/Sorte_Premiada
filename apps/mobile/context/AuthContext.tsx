import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from "expo-router";
import { Platform } from "react-native";
import * as Application from 'expo-application';
import { AppConfig } from "../constants/AppConfig";
import { useSettings } from "./SettingsContext";
import { useLoading } from "./LoadingContext";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { useLicenseCheck } from "../hooks/useLicenseCheck";

interface User {
    id: string;
    username: string;
    name?: string;
    email: string;
    role: string;
    companyId?: string; // Multi-tenant: ID da empresa do usuário
    canResetActivation?: boolean;
    area?: { name: string; city: string };
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    signIn: (username: string, pass: string) => Promise<void>;
    signOut: () => void;
    updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const { show, hide } = useLoading(); // Global loading
    const router = useRouter();
    const segments = useSegments();

    // Access Settings to refresh on login
    const { refreshSettings } = useSettings();

    // Push Notifications
    const { expoPushToken } = usePushNotifications();

    // License Check (verifica licença após login)
    const { isLicenseValid, licenseStatus } = useLicenseCheck(token, user?.role || null);

    // Check if user is logged in
    useEffect(() => {
        const loadAuth = async () => {
            try {
                const storedToken = await AsyncStorage.getItem("user_token"); // Assuming standard key
                if (storedToken) {
                    setToken(storedToken);
                    // Refresh settings as soon as we have a token
                    refreshSettings();
                }
            } catch (e) {
                console.error("Failed to load auth token", e);
            }
        };
        loadAuth();
    }, []);

    // Sync Push Token with Backend
    useEffect(() => {
        const syncPushToken = async () => {
            if (token && expoPushToken) {
                try {
                    console.log("Enviando Push Token para o backend:", expoPushToken);
                    const API_URL = AppConfig.api.baseUrl;
                    await fetch(`${API_URL}/users/push-token`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ pushToken: expoPushToken })
                    });
                } catch (e) {
                    console.error("Erro ao sincronizar push token:", e);
                }
            }
        };
        syncPushToken();
    }, [token, expoPushToken]);

    const signIn = async (username: string, pass: string) => {
        show("Autenticando..."); // Show global loading
        try {
            // Using the IP from AppConfig
            const API_URL = AppConfig.api.baseUrl;

            // Obter Device ID para validação de licença cruzada (Cross-Company Check)
            let deviceId = null;
            try {
                // Tenta obter o ID do Android (mais estável)
                if (Platform.OS === 'android') {
                    deviceId = Application.getAndroidId();
                } else {
                    // Fallback para iOS ou outros
                    deviceId = await Application.getIosIdForVendorAsync();
                }
            } catch (e) {
                console.warn("Could not get deviceId for login", e);
            }

            // Timeout de 10 segundos
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const res = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username,
                    password: pass,
                    deviceId // Envia o ID para validação no backend
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!res.ok) {
                const errorText = await res.text();
                // Tenta parsear JSON de erro se possível para pegar mensagem amigável
                let errorMessage = `Erro no login (${res.status})`;
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.message) errorMessage = errorJson.message;
                } catch { }

                console.error(`Login failed: ${res.status} ${errorText}`);

                if (res.status === 500) throw new Error("Erro interno no servidor (500). Verifique os logs.");
                if (res.status === 401) throw new Error(errorMessage.includes("Acesso Negado") ? errorMessage : "Credenciais inválidas");

                throw new Error(errorMessage);
            }

            const data = await res.json();
            const accessToken = data.access_token;
            setToken(accessToken);

            // Fetch Profile
            const profileRes = await fetch(`${API_URL}/users/profile`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!profileRes.ok) {
                const errorText = await profileRes.text();
                console.error("Profile fetch failed:", profileRes.status, errorText);
                throw new Error(`Erro ao carregar perfil: ${profileRes.status}`);
            }

            const profileData = await profileRes.json();
            setUser(profileData);

            // Refresh settings now that we have a valid token
            await refreshSettings();

            // Navigate to dashboard
            router.replace("/(tabs)");
        } catch (error: any) {
            console.error(error);
            if (error.name === 'AbortError' || error.message.includes('Network request failed')) {
                throw new Error("Servidor indisponível. Verifique sua conexão ou se o servidor está rodando.");
            }
            throw error;
        } finally {
            hide(); // Hide global loading
        }
    };

    const signOut = () => {
        setUser(null);
        setToken(null);
        router.replace("/");
    };

    const updateUser = (data: Partial<User>) => {
        if (user) {
            setUser({ ...user, ...data });
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading: false, signIn, signOut, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};
