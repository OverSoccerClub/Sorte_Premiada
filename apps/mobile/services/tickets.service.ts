import { AppConfig } from "../constants/AppConfig";
import { ApiClient } from "./api.client";
import { getBrazilStartOfDay, getBrazilEndOfDay } from "../lib/date-utils";

/**
 * Tickets Service (Mobile)
 * 
 * MULTI-TENANT: Todas as requisições são automaticamente filtradas pela empresa do usuário.
 * O backend extrai o companyId do JWT e aplica filtros automaticamente via Prisma Extension.
 * Não é necessário passar companyId manualmente - o token de autenticação é suficiente.
 */


export interface Ticket {
    id: string;
    gameType: string;
    numbers: number[];
    amount: string;
    status: 'PENDING' | 'PAID' | 'CANCELLED' | 'WON' | 'LOST' | 'EXPIRED' | 'CANCEL_REQUESTED';
    drawDate?: string;
    hash?: string;
    series?: string; // Added series field
    createdAt: string;
    possiblePrize?: string;
    secondChanceNumber?: number;
    secondChanceDrawDate?: string;
    secondChanceStatus?: string;
    terminalId?: string;
    user?: {
        id: string;
        name?: string;
        username?: string;
    };
    area?: {
        name: string;
        city: string;
    };
    game?: {
        id: string;
        name: string;
        prizeMilhar?: string;
        prizeCentena?: string;
        prizeDezena?: string;
        secondChanceLabel?: string;
        promptMessage?: string;
        mainMatchMessage?: string;
    };
}

export interface TicketFilters {
    status?: string;
    gameType?: string;
    startDate?: Date;
    endDate?: Date;
}

export const TicketsService = {
    getAll: async (token: string, filters?: TicketFilters): Promise<Ticket[]> => {
        try {
            let url = `${AppConfig.api.baseUrl}/tickets?`;

            if (filters?.status && filters.status !== 'ALL') {
                url += `status=${filters.status}&`;
            }

            if (filters?.gameType && filters.gameType !== 'ALL') {
                url += `gameType=${encodeURIComponent(filters.gameType)}&`;
            }

            if (filters?.startDate) {
                const start = getBrazilStartOfDay(filters.startDate);
                url += `startDate=${start.toISOString()}&`;
            }

            if (filters?.endDate) {
                const end = getBrazilEndOfDay(filters.endDate);
                url += `endDate=${end.toISOString()}&`;
            }

            console.log("[TicketsService] Fetching:", url);

            console.log("[TicketsService] Fetching:", url);

            const res = await ApiClient.fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                console.warn('[TicketsService] Failed to fetch tickets:', res.status);
                return [];
            }

            const data = await res.json();
            if (!Array.isArray(data)) return [];

            return data;
        } catch (error) {
            console.error("[TicketsService] Error:", error);
            return [];
        }
    },

    validate: async (token: string, ticketIdOrHash: string): Promise<{ success: boolean; data?: any; message?: string }> => {
        try {
            let url = `${AppConfig.api.baseUrl}/tickets/validate/${ticketIdOrHash}`;
            console.log("[TicketsService] Validating:", url);

            const res = await ApiClient.fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const json = await res.json();

            if (!res.ok) {
                return { success: false, message: json.message || "Erro ao validar bilhete" };
            }

            return { success: true, data: json };
        } catch (error) {
            console.error("[TicketsService] Validate Error:", error);
            return { success: false, message: "Erro de conexão" };
        }
    },

    requestCancel: async (token: string, ticketId: string, reason: string): Promise<{ success: boolean; message?: string }> => {
        try {
            const url = `${AppConfig.api.baseUrl}/tickets/${ticketId}/request-cancel`;
            const res = await ApiClient.post(url.replace(AppConfig.api.baseUrl, ''), { reason }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const json = await res.json();
            if (!res.ok) {
                return { success: false, message: json.message || "Erro ao solicitar cancelamento" };
            }
            return { success: true, message: json.message || "Solicitação enviada com sucesso" };
        } catch (error) {
            console.error("[TicketsService] Request Cancel Error:", error);
            return { success: false, message: "Erro de conexão" };
        }
    },

    cashout: async (token: string, ticketIdOrHash: string): Promise<{ success: boolean; data?: any; message?: string }> => {
        try {
            let url = `${AppConfig.api.baseUrl}/tickets/${ticketIdOrHash}/redeem`;

            console.log("[TicketsService] Cashout:", url);

            const res = await ApiClient.post(url.replace(AppConfig.api.baseUrl, ''), {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const json = await res.json();

            if (!res.ok) {
                return { success: false, message: json.message || "Erro ao pagar prêmio" };
            }

            return { success: true, data: json, message: json.message || "Prêmio pago com sucesso!" };
        } catch (error) {
            console.error("[TicketsService] Cashout Error:", error);
            return { success: false, message: "Erro de conexão" };
        }
    }
};
