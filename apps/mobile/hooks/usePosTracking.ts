import { useEffect, useRef } from 'react';
import * as Application from 'expo-application';
import * as Location from 'expo-location';
import { DevicesService } from '../services/devices.service';
import { useAuth } from '../context/AuthContext';
import { getStableDeviceId } from '../utils/deviceId';

export function usePosTracking() {
    const { user } = useAuth();
    const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
    const deviceIdRef = useRef<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            // 1. Get Device ID (stable, persistent UUID per installation)
            const deviceId = await getStableDeviceId();
            deviceIdRef.current = deviceId;

            // 2. Register Device on Mount (Once)
            // Get Model
            const model = Application.nativeApplicationVersion ? 'Mobile Device' : 'Unknown Device';
            // Actually expo-device is better for model name, but let's stick to simple or use "Platform.constants.Model" if available? 
            // Or just pass generic info. Application.nativeApplicationVersion

            await DevicesService.register({
                deviceId,
                model,
                appVersion: `${Application.nativeApplicationVersion} (${Application.nativeBuildVersion})`
            });

            // 3. Start Heartbeat Loop
            const sendHeartbeat = async () => {
                if (!isMounted) return;

                // Get Location (if permitted)
                let lat, lon;
                try {
                    const { status } = await Location.getForegroundPermissionsAsync();
                    if (status === 'granted') {
                        // Use getLastKnownPositionAsync for speed/battery, or getCurrentPositionAsync for accuracy
                        const loc = await Location.getLastKnownPositionAsync({});
                        if (loc) {
                            lat = loc.coords.latitude;
                            lon = loc.coords.longitude;
                        } else {
                            // Fallback if no last known, try current (light)
                            console.log('[POS Tracking] Last known location null, requesting current position...');
                            const cur = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                            if (cur) {
                                lat = cur.coords.latitude;
                                lon = cur.coords.longitude;
                            }
                        }
                    } else {
                        // Request permission? Maybe not forcefully every loop. 
                        // Ideally request once. usePosTracking should request once.
                    }
                } catch (e) {
                    console.warn("Location error", e);
                }

                console.log(`[POS Tracking] Sending Heartbeat. Device: ${deviceId}, User: ${user?.username} (${user?.id})`);

                await DevicesService.heartbeat({
                    deviceId,
                    latitude: lat,
                    longitude: lon,
                    currentUserId: user?.id || null
                });
            };

            // Request Perms Once
            try {
                await Location.requestForegroundPermissionsAsync();
            } catch (e) {
                console.warn("Perm req failed", e);
            }

            // Initial Heartbeat
            sendHeartbeat();

            // Loop
            heartbeatInterval.current = setInterval(sendHeartbeat, 60000); // 60s
        };

        init();

        return () => {
            isMounted = false;
            if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);

            // Try to set offline on unmount (best effort)
            if (deviceIdRef.current) {
                console.log('[POS Tracking] Cleanup: Sending OFFLINE status');
                DevicesService.heartbeat({
                    deviceId: deviceIdRef.current,
                    status: 'OFFLINE'
                }).catch(e => console.warn("Failed to set offline", e));
            }
        };
    }, [user]); // Re-run if user changes? Yes to update currentUserId immediately on login/logout?
    // Actually if we re-run verify, we register again. Register is idempotent (upsert). 
    // It ensures heartbeat sends new user ID instantly.
}
