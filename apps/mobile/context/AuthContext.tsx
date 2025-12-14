import React, { createContext, useState, useContext, useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { AppConfig } from "../constants/AppConfig";
import { useLoading } from "./LoadingContext";

interface User {
    id: string;
    username: string;
    name?: string;
    email: string;
    role: string;
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

    // Check if user is logged in (mock for now, or use AsyncStorage)
    useEffect(() => {
        // TODO: Load token from AsyncStorage and fetch profile
    }, []);

    const signIn = async (username: string, pass: string) => {
        show("Autenticando..."); // Show global loading
        try {
            // Using the IP from AppConfig
            const API_URL = AppConfig.api.baseUrl;

            // Timeout de 10 segundos
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const res = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password: pass }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!res.ok) throw new Error("Credenciais inválidas");

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
