import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppConfig } from '../constants/AppConfig';
import * as Device from 'expo-device';

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
const DEVICE_TOKEN_KEY = '@device_token';
const COMPANY_ID_KEY = '@company_id';
const CACHE_EXPIRY_MS = 1000 * 60 * 60; // 1 hour

interface CompanyContextType {
    settings: CompanySettings;
    isLoading: boolean;
    isActivated: boolean;
    deviceToken: string | null;
    companyId: string | null;
    refresh: () => Promise<void>;
    activateDevice: (activationCode: string) => Promise<void>;
    clearActivation: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType>({
    settings: defaultSettings,
    isLoading: true,
    isActivated: false,
    deviceToken: null,
    companyId: null,
    refresh: async () => { },
    activateDevice: async () => { },
    clearActivation: async () => { },
});

export const useCompany = () => useContext(CompanyContext);

export const CompanyProvider = ({ children }: { children: React.ReactNode }) => {
    const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);
    const [deviceToken, setDeviceToken] = useState<string | null>(null);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [isActivated, setIsActivated] = useState(false);

    // Carrega token e settings salvos
    const loadStoredData = useCallback(async () => {
        try {
            const [storedToken, storedCompanyId, cached] = await Promise.all([
                AsyncStorage.getItem(DEVICE_TOKEN_KEY),
                AsyncStorage.getItem(COMPANY_ID_KEY),
                AsyncStorage.getItem(CACHE_KEY),
            ]);

            // Only update state if changed to prevent effects loop
            setDeviceToken(prev => (prev !== storedToken ? storedToken : prev));
            setCompanyId(prev => (prev !== storedCompanyId ? storedCompanyId : prev));

            const hasToken = !!storedToken;
            setIsActivated(prev => (prev !== hasToken ? hasToken : prev));

            // Carregar settings do cache se existir
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                const isExpired = Date.now() - timestamp > CACHE_EXPIRY_MS;

                if (!isExpired) {
                    setSettings(prev => JSON.stringify(prev) !== JSON.stringify(data) ? { ...defaultSettings, ...data } : prev);
                }
            }
        } catch (error) {
            console.error('Erro ao carregar dados armazenados:', error);
        }
    }, []);

    const fetchSettings = useCallback(async () => {
        try {
            // Se não está ativado, usa defaults
            if (!deviceToken) {
                setSettings(defaultSettings);
                setIsLoading(false);
                return;
            }

            // Fetch from API with device token
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

            const response = await fetch(`${AppConfig.api.baseUrl}/company/settings`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-device-token': deviceToken,
                },
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

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
        } finally {
            setIsLoading(false);
        }
    }, [deviceToken]);

    const activateDevice = useCallback(async (activationCode: string) => {
        try {
            // Obter ID único do dispositivo
            const deviceId = Device.osBuildId || Device.modelId || 'unknown-device';

            const response = await fetch(`${AppConfig.api.baseUrl}/devices/activate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    activationCode,
                    deviceId,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Código de ativação inválido');
            }

            const data = await response.json();

            // Salvar token, companyId e settings
            await Promise.all([
                AsyncStorage.setItem(DEVICE_TOKEN_KEY, data.deviceToken),
                AsyncStorage.setItem(COMPANY_ID_KEY, data.companyId),
                AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
                    data: data.companySettings,
                    timestamp: Date.now(),
                })),
            ]);

            // Atualizar estado
            setDeviceToken(data.deviceToken);
            setCompanyId(data.companyId);
            setSettings({ ...defaultSettings, ...data.companySettings });
            setIsActivated(true);
        } catch (error) {
            console.error('Erro ao ativar dispositivo:', error);
            throw error;
        }
    }, []);

    const clearActivation = useCallback(async () => {
        await Promise.all([
            AsyncStorage.removeItem(DEVICE_TOKEN_KEY),
            AsyncStorage.removeItem(COMPANY_ID_KEY),
            AsyncStorage.removeItem(CACHE_KEY),
        ]);
        setDeviceToken(null);
        setCompanyId(null);
        setSettings(defaultSettings);
        setIsActivated(false);
    }, []);

    const refresh = useCallback(async () => {
        await AsyncStorage.removeItem(CACHE_KEY);
        setIsLoading(true);
        await fetchSettings();
    }, [fetchSettings]);

    useEffect(() => {
        const init = async () => {
            await loadStoredData();
            await fetchSettings();
        };
        init();
    }, [loadStoredData, fetchSettings]);

    return (
        <CompanyContext.Provider value={{
            settings,
            isLoading,
            isActivated,
            deviceToken,
            companyId,
            refresh,
            activateDevice,
            clearActivation,
        }}>
            {children}
        </CompanyContext.Provider>
    );
};
