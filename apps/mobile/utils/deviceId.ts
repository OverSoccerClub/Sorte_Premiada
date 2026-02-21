/**
 * Stable Device ID Helper
 *
 * Generates a unique, persistent UUID per app installation stored in AsyncStorage.
 *
 * IMPORTANT: We intentionally do NOT use `Application.getAndroidId()` as the primary ID
 * because many POS devices (Sunmi, Moderninha, etc.) return the same AndroidId across
 * different units from the same batch/model. This caused the backend to archive one device's
 * activation when another device of the same model connected — wiping the session.
 *
 * Solution: Always generate a truly random UUID on first install and persist it in AsyncStorage.
 * The UUID never changes as long as the app data exists on the device.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_STORAGE_KEY = '@stable_device_id';

/**
 * Returns or creates a stable unique device ID for this app installation.
 * - On first run: generates a random UUID and saves it permanently
 * - On subsequent runs: reads the cached UUID from AsyncStorage
 */
export async function getStableDeviceId(): Promise<string> {
    // Always try cached ID first (fastest path and most stable)
    try {
        const cached = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
        if (cached && cached.length > 8) {
            return cached;
        }
    } catch (e) {
        console.warn('[DeviceID] AsyncStorage read failed:', e);
    }

    // Generate a new random UUID for this installation
    const newId = generateUUID();

    // Persist for all future calls
    try {
        await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, newId);
    } catch (e) {
        console.warn('[DeviceID] AsyncStorage write failed:', e);
    }

    console.log('[DeviceID] Generated new stable device ID:', newId.substring(0, 12) + '...');
    return newId;
}

// RFC4122-compliant UUID v4 generator (no external dependencies required)
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
