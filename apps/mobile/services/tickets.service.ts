import { AppConfig } from "../constants/AppConfig";

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
                // Set to start of day
                const start = new Date(filters.startDate);
                start.setHours(0, 0, 0, 0);
                url += `startDate=${start.toISOString()}&`;
            }

            if (filters?.endDate) {
                // Set to end of day
                const end = new Date(filters.endDate);
                end.setHours(23, 59, 59, 999);
                url += `endDate=${end.toISOString()}&`;
            }

            console.log("[TicketsService] Fetching:", url);

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                throw new Error('Failed to fetch tickets');
            }

            return await res.json();
        } catch (error) {
            console.error("[TicketsService] Error:", error);
            return [];
        }
    },

    validate: async (token: string, ticketIdOrHash: string): Promise<{ success: boolean; data?: any; message?: string }> => {
        try {
            const url = `${AppConfig.api.baseUrl}/tickets/validate/${ticketIdOrHash}`;
            console.log("[TicketsService] Validating:", url);

            const res = await fetch(url, {
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
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ reason })
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
