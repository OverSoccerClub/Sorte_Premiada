import { AppConfig } from "../constants/AppConfig";
import { ApiClient } from "./api.client";

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
    game?: {
        id: string;
        name: string;
        prizeMilhar?: string;
        prizeCentena?: string;
        prizeDezena?: string;
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
                // Set to start of day in Brazil (00:00 BRT = 03:00 UTC)
                // We use the Local Date selected by user to extract Y/M/D
                const local = new Date(filters.startDate);
                const start = new Date(Date.UTC(local.getFullYear(), local.getMonth(), local.getDate(), 3, 0, 0, 0));
                url += `startDate=${start.toISOString()}&`;
            }

            if (filters?.endDate) {
                // Set to end of day in Brazil (23:59:59.999 BRT = 02:59:59.999 UTC Next Day)
                const local = new Date(filters.endDate);
                const end = new Date(Date.UTC(local.getFullYear(), local.getMonth(), local.getDate(), 26, 59, 59, 999));
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
            const url = `${AppConfig.api.baseUrl}/tickets/validate/${ticketIdOrHash}`;
            console.log("[TicketsService] Validating:", url);

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
    }
};
