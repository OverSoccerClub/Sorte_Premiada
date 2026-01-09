
import { API_URL } from '@/lib/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export interface UsageStats {
    current: number;
    max: number;
    available: number;
    exceeded: boolean;
    percentage: number;
}

export interface UsageReport {
    limits: {
        users: UsageStats;
        tickets: UsageStats;
        games: UsageStats;
        devices: UsageStats;
    };
    currentMonth: any;
}

export const licenseService = {
    getMyUsage: async (): Promise<UsageReport> => {
        try {
            const response = await fetch(`${API_URL}/company/license/usage`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Erro ao buscar dados de uso');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar uso da licença:', error);
            throw error;
        }
    },

    requestUpgrade: async (planId: string) => {
        try {
            const response = await fetch(`${API_URL}/company/license/upgrade`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ planId })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao solicitar upgrade');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao solicitar upgrade:', error);
            throw error;
        }
    }
};
