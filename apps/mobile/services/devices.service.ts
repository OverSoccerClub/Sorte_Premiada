import { AppConfig } from "../constants/AppConfig";
import * as Application from 'expo-application';
import { Platform } from "react-native";

export const DevicesService = {
    async register(data: { deviceId: string; model?: string; appVersion?: string }) {
        try {
            // No auth required for registration usually, or maybe basic auth?
            // Assuming public endpoint for initial registration or simple protection.
            // If endpoint is protected by JWT, we might have issue on first start before login?
            // Re-reading plan: "Auto-cadastra assim que for instalado". user might not be logged in.
            // Register usually public or apiKey protected. Ideally public for this pos specific logic 
            // where device identity matters more than user.

            const res = await fetch(`${AppConfig.api.baseUrl}/devices/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            return res.ok;
        } catch (e) {
            console.error("Device Register Error", e);
            return false;
        }
    },

    async heartbeat(data: { deviceId: string; latitude?: number; longitude?: number; currentUserId?: string | null; status?: string }) {
        try {
            const res = await fetch(`${AppConfig.api.baseUrl}/devices/heartbeat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            return res.ok;
        } catch (e) {
            console.error("Heartbeat Error", e);
            return false;
        }
    }
};
