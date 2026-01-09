import * as Updates from 'expo-updates';
import { Alert } from 'react-native';

export class UpdatesService {
    static async checkForUpdate(): Promise<boolean> {
        try {
            // SIMULATION MODE FOR UI TESTING
            if (__DEV__) {
                console.log("UpdatesService: SIMULATING UPDATE AVAILABLE");
                return true;
            }

            const update = await Updates.checkForUpdateAsync();
            if (update.isAvailable) {
                return true;
            }
            return false;
        } catch (error) {
            console.log("UpdatesService Error (Check):", error);
            // Return true to test error handling UI if needed, but for now false
            return false;
        }
    }

    static async fetchUpdate(): Promise<boolean> {
        try {
            // SIMULATION MODE FOR UI TESTING
            if (__DEV__) {
                await new Promise(resolve => setTimeout(resolve, 2000)); // Fake download time
                return true;
            };

            const update = await Updates.fetchUpdateAsync();
            if (update.isNew) {
                return true;
            }
            return false;
        } catch (error) {
            console.error("UpdatesService Error (Fetch):", error);
            return false;
        }
    }

    static async reloadApp() {
        try {
            if (__DEV__) {
                Alert.alert("Dev Mode", "Reloading app is not supported in dev client related to updates, but logic would trigger Updates.reloadAsync()");
                return;
            }
            await Updates.reloadAsync();
        } catch (error) {
            console.error("UpdatesService Error (Reload):", error);
        }
    }
}
