import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppConfig } from '../constants/AppConfig';

export interface CompanySettings {
    companyName: string;
    slogan: string;
    logoUrl?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    primaryColor: string;
    updateUrl?: string;
}

const defaultSettings: CompanySettings = {
    companyName: 'A Perseverança',
    slogan: 'Cambista Edition',
    primaryColor: '#50C878',
    updateUrl: 'https://www.inforcomputer.com/Atualizacoes/A_Perseveranca',
};

const CACHE_KEY = '@company_settings';
const CACHE_EXPIRY_MS = 1000 * 60 * 60; // 1 hour

interface CompanyContextType {
    settings: CompanySettings;
    isLoading: boolean;
    refresh: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType>({
    settings: defaultSettings,
    isLoading: true,
    refresh: async () => { },
});

export const useCompany = () => useContext(CompanyContext);

export const CompanyProvider = ({ children }: { children: React.ReactNode }) => {
    const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSettings = useCallback(async () => {
        try {
            // Try to load from cache first
            const cached = await AsyncStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                const isExpired = Date.now() - timestamp > CACHE_EXPIRY_MS;

                if (!isExpired) {
                    setSettings({ ...defaultSettings, ...data });
                    setIsLoading(false);
                    return;
                }
            }

            // Fetch from API
            const response = await fetch(`${AppConfig.api.baseUrl}/company/settings`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const data = await response.json();
                const newSettings = { ...defaultSettings, ...data };
                setSettings(newSettings);

                // Cache the settings
                await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
                    data: newSettings,
                    timestamp: Date.now(),
                }));
            }
        } catch (error) {
            console.warn('Failed to fetch company settings, using defaults:', error);
            // Continue with defaults or cached data
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refresh = useCallback(async () => {
        // Clear cache and refetch
        await AsyncStorage.removeItem(CACHE_KEY);
        setIsLoading(true);
        await fetchSettings();
    }, [fetchSettings]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    return (
        <CompanyContext.Provider value={{ settings, isLoading, refresh }}>
            {children}
        </CompanyContext.Provider>
    );
};
