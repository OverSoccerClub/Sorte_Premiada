import { AppConfig } from "../constants/AppConfig";
import { ApiClient } from "./api.client";

export const UserService = {
    async updatePushToken(token: string, pushToken: string): Promise<boolean> {
        try {
            const response = await ApiClient.fetch(`${AppConfig.api.baseUrl}/users/push-token`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ pushToken })
            });

            if (!response.ok) {
                console.error('Failed to update push token', await response.text());
                return false;
            }
            console.log('Push token updated successfully');
            return true;
        } catch (error) {
            console.error('Error updating push token', error);
            return false;
        }
    }
};
