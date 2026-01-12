import React, { createContext, useState, useContext, useEffect } from "react";
import { AppConfig } from "../constants/AppConfig";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CompanySettings {
    companyName: string;
    logoUrl?: string;
    ticketTemplate: 'default' | 'alternative';
}

interface SettingsContextType {
    settings: CompanySettings;
    isLoading: boolean;
    refreshSettings: () => Promise<void>;
}

const defaultSettings: CompanySettings = {
    companyName: "A Perseverança",
    logoUrl: "",
    ticketTemplate: "default",
};

const SettingsContext = createContext<SettingsContextType>({
    settings: defaultSettings,
    isLoading: true,
    refreshSettings: async () => { },
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
    const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                console.log("[SettingsContext] No token found, using default settings");
                setIsLoading(false);
                return;
            }

            console.log("[SettingsContext] Fetching settings from API...");
            const response = await fetch(`${AppConfig.api.baseUrl}/company/settings`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log("[SettingsContext] API Response:", JSON.stringify(data, null, 2));
                console.log("[SettingsContext] ticketTemplate from API:", data.ticketTemplate);

                const newSettings = {
                    companyName: data.companyName || defaultSettings.companyName,
                    logoUrl: data.logoUrl || defaultSettings.logoUrl,
                    ticketTemplate: data.ticketTemplate || defaultSettings.ticketTemplate,
                };

                console.log("[SettingsContext] Setting ticketTemplate to:", newSettings.ticketTemplate);
                setSettings(newSettings);
            } else {
                console.error("[SettingsContext] API request failed:", response.status);
            }
        } catch (error) {
            console.error("[SettingsContext] Failed to fetch settings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const refreshSettings = async () => {
        setIsLoading(true);
        await fetchSettings();
    };

    return (
        <SettingsContext.Provider value={{ settings, isLoading, refreshSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};
