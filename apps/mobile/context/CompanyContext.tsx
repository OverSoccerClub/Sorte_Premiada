import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppConfig } from '../constants/AppConfig';
import { getStableDeviceId } from '../utils/deviceId';
import { setOnDeviceInvalidated } from '../utils/activationBridge';

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
    websiteUrl?: string;
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
    const clearActivationRef = useRef<() => Promise<void>>(() => Promise.resolve());

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
            return storedToken;
        } catch (error) {
            console.error('Erro ao carregar dados armazenados:', error);
            return null;
        }
    }, []);

    /**
     * Consulta o banco (API) para verificar se o dispositivo está ativado.
     * Só retorna false (e faz clear) quando a API disser que o dispositivo foi REVOGADO (desativado/não encontrado).
     * 401 por token expirado ou erro de rede NÃO limpa ativação.
     */
    const verifyDeviceWithBackend = useCallback(async (token: string): Promise<boolean> => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const response = await fetch(`${AppConfig.api.baseUrl}/devices/verify`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'x-device-token': token },
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (response.ok) return true;
            if (response.status === 401) {
                const body = await response.json().catch(() => ({}));
                const msg = (body?.message || '').toLowerCase();
                const isDeviceRevoked =
                    (msg.includes('desativado') && msg.includes('dispositivo')) ||
                    msg.includes('dispositivo não encontrado') ||
                    msg.includes('dispositivo desativado') ||
                    msg.includes('token do dispositivo') ||
                    msg === 'token inválido ou expirado' ||
                    msg === 'dispositivo não encontrado' ||
                    msg === 'dispositivo desativado';
                return !isDeviceRevoked;
            }
            return true;
        } catch {
            return true;
        }
    }, []);

    const fetchSettings = useCallback(async (currentTokenOverride?: string | null) => {
        const tokenToUse = currentTokenOverride !== undefined ? currentTokenOverride : deviceToken;

        try {
            if (!tokenToUse) {
                setSettings(defaultSettings);
                setIsLoading(false);
                return;
            }

            setVerificationStatus('checking');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(`${AppConfig.api.baseUrl}/company/settings`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-device-token': tokenToUse,
                },
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                setVerificationStatus('offline');
                if (response.status === 401 || response.status === 403 || response.status === 404) {
                    const errBody = await response.json().catch(() => ({}));
                    const message = (errBody?.message || '').toLowerCase();
                    // "Inválido ou inativo" genérico não deve limpar o login se for timeout,
                    // mas se for explicitamente token inválido ou desativado, deve forçar reativação.
                    const isDeviceRevoked =
                        (message.includes('desativado') && message.includes('dispositivo')) ||
                        message.includes('dispositivo não encontrado') ||
                        message.includes('dispositivo desativado') ||
                        message.includes('token do dispositivo') ||
                        message === 'token inválido ou expirado' ||
                        message === 'dispositivo não encontrado' ||
                        message === 'dispositivo desativado';

                    if (isDeviceRevoked) {
                        await clearActivation();
                        return;
                    }
                }
                return;
            }

            setVerificationStatus('verified');
            const data = await response.json();
            const newSettings = { ...defaultSettings, ...data };
            setSettings(newSettings);
            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
                data: newSettings,
                timestamp: Date.now(),
            }));
        } catch (error) {
            console.warn('Failed to fetch company settings:', error);
            if (tokenToUse) setVerificationStatus('offline');
            else setVerificationStatus('failed');
        } finally {
            setIsLoading(false);
        }
    }, [deviceToken]);

    const activateDevice = useCallback(async (activationCode: string) => {
        try {
            // Obter ID único estável da instalação (persiste no AsyncStorage)
            const deviceId = await getStableDeviceId();

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

    // Manter ref atualizada para o callback do activationBridge
    clearActivationRef.current = clearActivation;

    const refresh = useCallback(async () => {
        await AsyncStorage.removeItem(CACHE_KEY);
        setIsLoading(true);
        await fetchSettings();
    }, [fetchSettings]);

    // Ao iniciar o app: consultar o banco (API) para saber se o dispositivo está ativado.
    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            console.log('[AUDIT] CompanyContext init starting v1.5.52...');
            const token = await loadStoredData();
            if (!isMounted) return;

            if (!token) {
                setIsActivated(false);
                setVerificationStatus('failed');
                setIsLoading(false);
                return;
            }

            const isActiveInBackend = await verifyDeviceWithBackend(token);
            if (!isMounted) return;

            console.log('[AUDIT] Backend verification result:', isActiveInBackend);

            if (!isActiveInBackend) {
                console.log('[AUDIT] Clearing activation due to backend rejection');
                await clearActivation();
                setIsLoading(false);
                return;
            }

            setIsActivated(true);
            await fetchSettings(token);
        };
        init();
        return () => { isMounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Registrar callback para quando ApiClient detectar 401 (dispositivo inválido)
    // Assim o estado é atualizado imediatamente, evitando pedir ativação só no próximo reopen
    useEffect(() => {
        setOnDeviceInvalidated(() => {
            clearActivationRef.current();
        });
        return () => setOnDeviceInvalidated(null);
    }, []);

    // Recarregar dados quando o app volta do background (sincroniza com AsyncStorage)
    // Útil se o token foi limpo por ApiClient enquanto o app estava em background
    useEffect(() => {
        const handleAppStateChange = (nextState: AppStateStatus) => {
            if (nextState === 'active') {
                loadStoredData();
            }
        };
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, [loadStoredData]);

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
