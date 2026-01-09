import { API_URL } from '@/lib/api';

export interface Plan {
    id: string;
    name: string;
    description?: string;
    price: number;
    maxUsers: number;
    maxTicketsPerMonth: number;
    maxGames: number;
    maxActiveDevices: number;
    features: string[];
    isActive: boolean;
    isDefault: boolean;
    _count?: {
        companies: number;
    };
}

export interface CreatePlanData {
    name: string;
    description?: string;
    price: number;
    maxUsers: number;
    maxTicketsPerMonth: number;
    maxGames: number;
    maxActiveDevices: number;
    features?: string[];
    isActive?: boolean;
    isDefault?: boolean;
}

export interface UpdatePlanData extends Partial<CreatePlanData> { }

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const plansService = {
    getAll: async (includeInactive = false) => {
        console.log(`[PlansService] Fetching all plans (includeInactive: ${includeInactive})`);
        try {
            const url = `${API_URL}/plans${includeInactive ? '?all=true' : ''}`;
            const response = await fetch(url, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao buscar planos');
            }

            const data = await response.json();
            console.log(`[PlansService] Fetched ${data.length} plans`);
            return data as Plan[];
        } catch (error: any) {
            console.error('[PlansService] Error fetching plans:', error);
            throw error;
        }
    },

    getById: async (id: string) => {
        console.log(`[PlansService] Fetching plan by id: ${id}`);
        try {
            const response = await fetch(`${API_URL}/plans/${id}`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao buscar plano');
            }

            const data = await response.json();
            console.log(`[PlansService] Fetched plan:`, data);
            return data as Plan;
        } catch (error: any) {
            console.error(`[PlansService] Error fetching plan ${id}:`, error);
            throw error;
        }
    },

    create: async (data: CreatePlanData) => {
        console.log('[PlansService] Creating plan:', data);
        try {
            const response = await fetch(`${API_URL}/plans`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao criar plano');
            }

            const result = await response.json();
            console.log('[PlansService] Plan created:', result);
            return result as Plan;
        } catch (error: any) {
            console.error('[PlansService] Error creating plan:', error);
            throw error;
        }
    },

    update: async (id: string, data: UpdatePlanData) => {
        console.log(`[PlansService] Updating plan ${id}:`, data);
        try {
            const response = await fetch(`${API_URL}/plans/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao atualizar plano');
            }

            const result = await response.json();
            console.log('[PlansService] Plan updated:', result);
            return result as Plan;
        } catch (error: any) {
            console.error(`[PlansService] Error updating plan ${id}:`, error);
            throw error;
        }
    },

    delete: async (id: string) => {
        console.log(`[PlansService] Deleting plan: ${id}`);
        try {
            const response = await fetch(`${API_URL}/plans/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao deletar plano');
            }

            console.log(`[PlansService] Plan deleted: ${id}`);
        } catch (error: any) {
            console.error(`[PlansService] Error deleting plan ${id}:`, error);
            throw error;
        }
    },

    applyToCompany: async (planId: string, companyId: string) => {
        console.log(`[PlansService] Applying plan ${planId} to company ${companyId}`);
        try {
            const response = await fetch(`${API_URL}/plans/${planId}/apply/${companyId}`, {
                method: 'POST',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao aplicar plano');
            }

            console.log(`[PlansService] Plan applied successfully`);
        } catch (error: any) {
            console.error(`[PlansService] Error applying plan:`, error);
            throw error;
        }
    }
};
