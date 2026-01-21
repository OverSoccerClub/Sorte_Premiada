import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppConfig } from '../constants/AppConfig';
import { Platform } from 'react-native';
import * as Application from 'expo-application';
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
    qrcodeWidth?: number;
    qrcodeHeight?: number;
    // Alternative Template Params
    alternativeLogoWidth?: number;
    alternativeLogoHeight?: number;
    alternativeQrWidth?: number;
    alternativeQrHeight?: number;
}

const defaultSettings: CompanySettings = {
    companyName: 'InnoBet',
    slogan: 'Cambista Edition',
    primaryColor: '#50C878',
    updateUrl: 'https://www.inforcomputer.com/Atualizacoes/InnoBet',
};

const CACHE_KEY = '@company_settings';
const DEVICE_TOKEN_KEY = '@device_token';
const COMPANY_ID_KEY = '@company_id';
const ACTIVATION_CODE_KEY = '@activation_code';
const CACHE_EXPIRY_MS = 1000 * 60 * 60; // 1 hour

interface CompanyContextType {
    settings: CompanySettings;
    isLoading: boolean;
    isActivated: boolean;
    deviceToken: string | null;
    companyId: string | null;
    activationCode: string | null;
    verificationStatus: 'verified' | 'offline' | 'failed' | 'checking';
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
    activationCode: null,
    verificationStatus: 'checking',
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
    const [activationCode, setActivationCode] = useState<string | null>(null);
    const [verificationStatus, setVerificationStatus] = useState<'verified' | 'offline' | 'failed' | 'checking'>('checking');
    const [isActivated, setIsActivated] = useState(false);

    // Carrega token e settings salvos
    const loadStoredData = useCallback(async () => {
        try {
            const [storedToken, storedCompanyId, storedActivationCode, cached] = await Promise.all([
                AsyncStorage.getItem(DEVICE_TOKEN_KEY),
                AsyncStorage.getItem(COMPANY_ID_KEY),
                AsyncStorage.getItem(ACTIVATION_CODE_KEY),
                AsyncStorage.getItem(CACHE_KEY),
            ]);

            // Only update state if changed to prevent effects loop
            setDeviceToken(prev => (prev !== storedToken ? storedToken : prev));
            setCompanyId(prev => (prev !== storedCompanyId ? storedCompanyId : prev));
            setActivationCode(prev => (prev !== storedActivationCode ? storedActivationCode : prev));

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

            setVerificationStatus('checking');

            const response = await fetch(`${AppConfig.api.baseUrl}/company/settings`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-device-token': deviceToken,
                },
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (response.status === 400 || response.status === 401 || response.status === 403 || response.status === 404) {
                console.warn(`Device token invalid or expired (Status: ${response.status}). Marking as failed but keeping local activation.`);
                setVerificationStatus('failed');
                // await clearActivation(); // Removed to prevent forced logout on updates/glitches
                return;
            }

            if (response.ok) {
                setVerificationStatus('verified');
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
            // If we have a token but fetch failed, we are efficiently "Offline" but Activated
            if (deviceToken) {
                setVerificationStatus('offline');
            } else {
                setVerificationStatus('failed');
            }
        } finally {
            setIsLoading(false);
        }
    }, [deviceToken]);

    const activateDevice = useCallback(async (activationCode: string) => {
        try {
            // Obter ID único do dispositivo real (Android ID ou iOS Vendor ID)
            let deviceId = 'unknown-device';
            if (Platform.OS === 'android') {
                deviceId = Application.getAndroidId() || 'ANDROID-NO-ID';
            } else if (Platform.OS === 'ios') {
                const iosId = await Application.getIosIdForVendorAsync();
                deviceId = iosId || 'IOS-NO-ID';
            }
            // Fallback para dev/test se necessário, mas evitar osBuildId que repete por versão
            if (deviceId === 'unknown-device' || deviceId.includes('NO-ID')) {
                deviceId = Device.modelId || 'unknown-device-' + Math.random().toString(36).substring(7);
            }

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
                AsyncStorage.setItem(ACTIVATION_CODE_KEY, activationCode),
                AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
                    data: data.companySettings,
                    timestamp: Date.now(),
                })),
            ]);

            // Atualizar estado
            setDeviceToken(data.deviceToken);
            setCompanyId(data.companyId);
            setActivationCode(activationCode);
            setSettings({ ...defaultSettings, ...data.companySettings });
            setIsActivated(true);
            setVerificationStatus('verified');
        } catch (error) {
            console.error('Erro ao ativar dispositivo:', error);
            throw error;
        }
    }, []);

    const clearActivation = useCallback(async () => {
        await Promise.all([
            AsyncStorage.removeItem(DEVICE_TOKEN_KEY),
            AsyncStorage.removeItem(COMPANY_ID_KEY),
            AsyncStorage.removeItem(ACTIVATION_CODE_KEY),
            AsyncStorage.removeItem(CACHE_KEY),
        ]);
        setDeviceToken(null);
        setCompanyId(null);
        setActivationCode(null);
        setSettings(defaultSettings);
        setIsActivated(false);
        setVerificationStatus('failed'); // or checking/idle
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
            activationCode,
            verificationStatus,
            refresh,
            activateDevice,
            clearActivation,
        }}>
            {children}
        </CompanyContext.Provider>
    );
};
