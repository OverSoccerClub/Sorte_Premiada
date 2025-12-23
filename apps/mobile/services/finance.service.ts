import { AppConfig } from "../constants/AppConfig";

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
}

export const FinanceService = {
    async getSummary(token: string): Promise<FinanceSummary | null> {
        try {
            const res = await fetch(`${AppConfig.api.baseUrl}/finance/summary`, {
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

            const res = await fetch(`${AppConfig.api.baseUrl}/finance/transaction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
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

    async closeDay(token: string): Promise<any | null> {
        try {
            const res = await fetch(`${AppConfig.api.baseUrl}/finance/close`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) return await res.json();
            return null;
        } catch (e) {
            console.error("Error closing day", e);
            return null;
        }
    }
};
