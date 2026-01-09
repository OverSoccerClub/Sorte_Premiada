import { AppConfig } from "../constants/AppConfig";
import { ApiClient } from "./api.client";

/**
 * Finance Service (Mobile)
 * 
 * MULTI-TENANT: Todos os dados financeiros são automaticamente filtrados pela empresa do usuário.
 * Relatórios, transações e resumos são isolados por companyId via JWT.
 */


export interface CreateTransactionDto {
    description: string;
    amount: number;
    type: 'CREDIT' | 'DEBIT';
}

export interface FinanceSummary {
    date: string;
    totalSales: number;
    totalCredits: number;
    totalDebits: number;
    finalBalance: number;
    transactions: {
        id: string;
        description: string;
        amount: number; // or string if coming from Decimal
        type: 'CREDIT' | 'DEBIT';
        createdAt: string;
        userId: string;
    }[];
    tickets: {
        id: string;
        gameType: string;
        numbers: number[];
        amount: number; // or string
        createdAt: string;
    }[];
    isClosed: boolean;
    salesLimit?: number;
    limitOverrideExpiresAt?: string;
    totalCommission: number;
    netBalance: number;
    minSalesThreshold: number;
}

export const FinanceService = {
    async getSummary(token: string): Promise<FinanceSummary | null> {
        try {
            const res = await ApiClient.fetch(`${AppConfig.api.baseUrl}/finance/summary`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) return await res.json();
            console.error("Get Summary Failed", res.status);
            return null;
        } catch (e) {
            console.error("Error fetching summary", e);
            return null;
        }
    },

    async createTransaction(token: string, data: CreateTransactionDto, cobradorId?: string, pin?: string): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const payload: any = { ...data };
            if (cobradorId) {
                payload.cobradorId = cobradorId;
                payload.pin = pin;
            }

            const res = await ApiClient.post('/finance/transaction', payload, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.ok) {
                const json = await res.json();
                return { success: true, data: json };
            } else {
                const err = await res.json();
                return { success: false, error: err.message || "Erro desconhecido" };
            }
        } catch (e) {
            console.error("Error creating transaction", e);
            return { success: false, error: "Erro de conexão" };
        }
    },

    async closeDay(token: string, physicalCashReported?: number): Promise<any | null> {
        try {
            const res = await ApiClient.post('/finance/close', { physicalCashReported }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (res.ok) return await res.json();
            return null;
        } catch (e) {
            console.error("Error closing day", e);
            return null;
        }
    },

    async getDebugInfo(token: string): Promise<any> {
        try {
            const res = await ApiClient.fetch(`${AppConfig.api.baseUrl}/finance/debug-info`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) return await res.json();
            return null;
        } catch (e) {
            console.error(e);
            return null;
        }
    },

    async collectCash(token: string, data: { amount: number, cobradorId: string, securityPin: string, cambistaId?: string }): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const res = await ApiClient.post('/cash-collection/collect', data, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.ok) {
                const json = await res.json();
                return { success: true, data: json };
            } else {
                const err = await res.json();
                return { success: false, error: err.message || "Erro ao processar sangria" };
            }
        } catch (e) {
            console.error("Error collecting cash", e);
            return { success: false, error: "Erro de conexão" };
        }
    },

    async getBalance(token: string, cambistaId: string): Promise<{ totalBalance: number, totalCommission: number, netBalance: number } | null> {
        try {
            const res = await ApiClient.fetch(`${AppConfig.api.baseUrl}/cash-collection/balance/${cambistaId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) return await res.json();
            return null;
        } catch (e) {
            console.error("Error fetching balance", e);
            return null;
        }
    }
};
