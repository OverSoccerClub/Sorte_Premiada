import { AppConfig } from "../constants/AppConfig";

export interface Announcement {
    id: string;
    title: string;
    content: string;
    type: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
    createdAt: string;
}

export const AnnouncementService = {
    async getActive(token: string): Promise<Announcement[]> {
        try {
            const response = await fetch(`${AppConfig.api.baseUrl}/announcements/active`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch announcements');
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch announcements', error);
            return [];
        }
    }
};
