import { AppConfig } from "../constants/AppConfig";
import { ApiClient } from "./api.client";

/**
 * Games Service (Mobile)
 * 
 * MULTI-TENANT: Retorna apenas jogos da empresa do usuário autenticado.
 * O filtro é aplicado automaticamente pelo backend via companyId do JWT.
 */


const API_URL = AppConfig.api.baseUrl;

export interface GameConfig {
    id: string;
    name: string;
    displayName?: string | null;
    isActive: boolean;
    iconName?: string | null;
    colorClass?: string | null;
    price: number;
    prizeMilhar?: number | null;
    prizeCentena?: number | null;
    prizeDezena?: number | null;
    prizeMultiplier?: number | null;
    rules?: any;
}

export class GamesService {
    /**
     * Fetch all active games from API
     * Used by mobile dashboard to dynamically render game cards
     */
    static async getActiveGames(token: string): Promise<GameConfig[]> {
        try {
            const response = await ApiClient.fetch(`${API_URL}/games?activeOnly=true`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) {
                console.warn('Failed to fetch games:', response.status);
                return [];
            }
            const data = await response.json();
            if (!Array.isArray(data)) return [];

            // Filter out games with missing critical data to prevent crashes
            return data.filter(g => g && g.id && g.name);
        } catch (error) {
            console.error("Error in getActiveGames:", error);
            return [];
        }
    }

    /**
     * Fetch all games (including inactive) - for admin purposes
     */
    static async getAllGames(token: string): Promise<GameConfig[]> {
        const response = await ApiClient.fetch(`${API_URL}/games`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch games');
        }
        return response.json();
    }

    /**
     * Fetch a single game by ID
     */
    static async getGameById(token: string, gameId: string): Promise<GameConfig | null> {
        const response = await ApiClient.fetch(`${API_URL}/games/${gameId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
            return null;
        }
        return response.json();
    }
}
