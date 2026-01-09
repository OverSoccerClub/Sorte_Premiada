import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppConfig } from '../constants/AppConfig';

const DEVICE_TOKEN_KEY = '@device_token';

/**
 * Helper para fazer requisições HTTP com injeção automática do deviceToken
 */
export class ApiClient {
    /**
     * Faz uma requisição HTTP com deviceToken injetado automaticamente
     */
    static async fetch(url: string, options: RequestInit = {}): Promise<Response> {
        try {
            // Obter deviceToken e companyId do AsyncStorage
            const [deviceToken, companyId] = await Promise.all([
                AsyncStorage.getItem(DEVICE_TOKEN_KEY),
                AsyncStorage.getItem('@company_id')
            ]);

            // Preparar headers
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                ...(options.headers as Record<string, string> || {}),
            };

            // Injetar deviceToken se existir
            if (deviceToken) {
                headers['x-device-token'] = deviceToken;
            }

            // Injetar companyId se existir
            if (companyId) {
                headers['x-company-id'] = companyId;
            }

            // Fazer requisição
            const response = await fetch(url, {
                ...options,
                headers,
            });

            // Se retornar 401 e a mensagem indicar dispositivo inválido, limpar token
            if (response.status === 401) {
                const errorData = await response.clone().json().catch(() => null);
                if (errorData?.message?.toLowerCase().includes('dispositivo')) {
                    await AsyncStorage.multiRemove([DEVICE_TOKEN_KEY, '@company_id', '@company_settings']);
                    // O CompanyContext detectará a mudança e redirecionará para ativação
                }
            }

            return response;
        } catch (error) {
            console.error('ApiClient fetch error:', error);
            throw error;
        }
    }

    /**
     * GET request
     */
    static async get(endpoint: string, options: RequestInit = {}): Promise<Response> {
        const url = `${AppConfig.api.baseUrl}${endpoint}`;
        return this.fetch(url, {
            ...options,
            method: 'GET',
        });
    }

    /**
     * POST request
     */
    static async post(endpoint: string, body?: any, options: RequestInit = {}): Promise<Response> {
        const url = `${AppConfig.api.baseUrl}${endpoint}`;
        return this.fetch(url, {
            ...options,
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    /**
     * PUT request
     */
    static async put(endpoint: string, body?: any, options: RequestInit = {}): Promise<Response> {
        const url = `${AppConfig.api.baseUrl}${endpoint}`;
        return this.fetch(url, {
            ...options,
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    /**
     * DELETE request
     */
    static async delete(endpoint: string, options: RequestInit = {}): Promise<Response> {
        const url = `${AppConfig.api.baseUrl}${endpoint}`;
        return this.fetch(url, {
            ...options,
            method: 'DELETE',
        });
    }
}
