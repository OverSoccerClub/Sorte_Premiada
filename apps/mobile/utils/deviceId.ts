/**
 * Stable Device ID Helper
 *
 * Generates a unique, persistent UUID per app installation stored in AsyncStorage.
 * This avoids the problem where `Application.getAndroidId()` returns null or
 * returns the SAME value across different units of the same POS brand/model
 * (e.g., Moderninha, Sunmi), which caused the backend to archive one device's
 * token when another device of the same model connected — wiping the session.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

const DEVICE_ID_STORAGE_KEY = '@stable_device_id';

/**
 * Returns or creates a stable unique device ID for this app installation.
 * Priority:
 *   1. Cached ID from AsyncStorage (most stable — survives restarts)
 *   2. Android ANDROID_ID (if valid and non-empty)
 *   3. Random UUID generated once and persisted forever
 */
export async function getStableDeviceId(): Promise<string> {
    // 1. Try to get cached ID first (fastest path after first run)
    try {
        const cached = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
        if (cached && cached.length > 8) {
            return cached;
        }
    } catch (e) {
        console.warn('[DeviceID] AsyncStorage read failed:', e);
    }

    // 2. Try native ID (Android only, may be null/empty on some POS hardware)
    let nativeId: string | null = null;
    try {
        if (Platform.OS === 'android') {
            const androidId = Application.getAndroidId();
            // Some POS devices return '0000000000000000' or very short IDs — reject those
            if (androidId && androidId.length >= 10 && androidId !== '0000000000000000') {
                nativeId = androidId;
            }
        } else if (Platform.OS === 'ios') {
            nativeId = await Application.getIosIdForVendorAsync();
        }
    } catch (e) {
        console.warn('[DeviceID] Native ID fetch failed:', e);
    }

    // 3. Fall back to a UUID if native ID is unavailable or suspicious
    const finalId = nativeId || generateUUID();

    // Persist for future calls
    try {
        await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, finalId);
    } catch (e) {
        console.warn('[DeviceID] AsyncStorage write failed:', e);
    }

    console.log('[DeviceID] Resolved stable device ID:', finalId.substring(0, 12) + '...');
    return finalId;
}

// Simple RFC4122-compliant UUID generator (no external dependencies required)
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
