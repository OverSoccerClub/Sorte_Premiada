import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { Alert, Platform, PermissionsAndroid, AppState } from 'react-native';
import { BLEPrinter } from 'react-native-thermal-receipt-printer-image-qr';
import { PrinterType } from '../services/printing.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

interface PrinterContextType {
    connectedPrinter: any;
    isScanning: boolean;
    printers: any[];
    printerType: PrinterType;
    connectionStatus: ConnectionStatus;
    setPrinterType: (type: PrinterType) => void;
    scanPrinters: () => Promise<void>;
    connectPrinter: (printer: any) => Promise<void>;
    disconnectPrinter: () => void;
    isPosDevice: (printer: any) => boolean;
    checkConnection: () => Promise<boolean>;
    reconnectPrinter: () => Promise<boolean>;
}

const PrinterContext = createContext<PrinterContextType>({} as PrinterContextType);

export const usePrinter = () => useContext(PrinterContext);

const PRINTER_STORAGE_KEY = '@printer_mac_address';
const PRINTER_TYPE_KEY = '@printer_type';

export const PrinterProvider = ({ children }: { children: React.ReactNode }) => {
    const [printers, setPrinters] = useState<any[]>([]);
    const [connectedPrinter, setConnectedPrinter] = useState<any>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [printerType, setPrinterType] = useState<PrinterType>('BLE');
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const appStateRef = useRef<string>(AppState.currentState);

    useEffect(() => {
        const init = async () => {
            if (Platform.OS === 'android') {
                try {
                    if (Platform.Version >= 31) {
                        await PermissionsAndroid.requestMultiple([
                            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                        ]);
                    } else {
                        await PermissionsAndroid.requestMultiple([
                            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                        ]);
                    }
                } catch (err) {
                    console.warn(err);
                }
            }

            try {
                // Wrap init in try-catch to prevent crash on devices without Bluetooth or permissions
                await BLEPrinter.init();
                console.log("BLE Printer initialized");
            } catch (err) {
                console.warn("BLE Printer init failed (Expected on POS):", err);
                // Fallback to Native if BLE fails completely
                setPrinterType('NATIVE');
            }

            // Load saved settings
            await loadSavedPrinter();
        };

        init();

        // Monitor app state changes
        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.remove();
            if (keepAliveIntervalRef.current) {
                clearInterval(keepAliveIntervalRef.current);
            }
        };
    }, []);

    const handleAppStateChange = async (nextAppState: string) => {
        if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
            // App has come to the foreground, check connection
            console.log('[PrinterContext] App came to foreground, checking connection...');
            if (connectedPrinter && printerType === 'BLE') {
                await checkAndReconnect();
            }
        }
        appStateRef.current = nextAppState;
    };

    const loadSavedPrinter = async () => {
        try {
            // User requested explicit/mandatory Bluetooth default
            setPrinterType('BLE');
            await AsyncStorage.setItem(PRINTER_TYPE_KEY, 'BLE');

            const savedMac = await AsyncStorage.getItem(PRINTER_STORAGE_KEY);

            if (savedMac) {
                console.log("Found saved BLE printer, attempting auto-connect:", savedMac);
                try {
                    // Tenta conectar diretamente
                    await connectPrinter({ inner_mac_address: savedMac, device_name: "Saved Printer" }, false);
                    console.log("Auto-connected to saved printer");
                } catch (e) {
                    console.log("Auto-connect failed (printer might be off or out of range)");
                    // Não limpar o savedMac, para tentar novamente depois
                }
            }
        } catch (error) {
            console.error("Failed to load printer settings", error);
        }
    };

    const updatePrinterType = async (type: PrinterType) => {
        setPrinterType(type);
        await AsyncStorage.setItem(PRINTER_TYPE_KEY, type);
    };

    const scanPrinters = async () => {
        if (printerType === 'NATIVE') {
            // Alert.alert("Modo Nativo", "A busca por impressoras Bluetooth está desativada no modo Nativo.");
            return;
        }

        setIsScanning(true);
        try {
            // Ensure initialized before scanning
            try {
                await BLEPrinter.init();
            } catch (err) {
                console.log("Re-init BLE ignored:", err);
            }

            const results = await BLEPrinter.getDeviceList();

            // Sort POS printers to top
            const sorted = results.sort((a: any, b: any) => {
                const isPosA = isPosDevice(a);
                const isPosB = isPosDevice(b);
                if (isPosA && !isPosB) return -1;
                if (!isPosA && isPosB) return 1;
                return 0;
            });

            setPrinters(sorted);

            // Auto-connect if only one POS printer found and not connected
            const posPrinters = sorted.filter(isPosDevice);
            if (posPrinters.length === 1 && !connectedPrinter) {
                console.log("POS Printer found:", posPrinters[0].device_name);
            }

        } catch (error) {
            console.error("Scan error:", error);
            // Throwing might be too aggressive for auto-scan, let's just log.
            // UI can show "retry" if list is empty.
        } finally {
            setIsScanning(false);
        }
    };

    const isPosDevice = (printer: any) => {
        const name = (printer.device_name || "").toUpperCase();
        const mac = (printer.inner_mac_address || "").toUpperCase();
        const knownNames = ['INNERPRINTER', 'AR-SP5', 'RPP02', 'MPT-II', 'POS-58', 'POS58', 'PRINTER'];
        return knownNames.some(n => name.includes(n));
    };

    const checkConnection = async (): Promise<boolean> => {
        if (printerType !== 'BLE' || !connectedPrinter) {
            return false;
        }

        try {
            // Try a simple command to verify connection
            await BLEPrinter.printText("");
            return true;
        } catch (error) {
            console.warn('[PrinterContext] Connection check failed:', error);
            return false;
        }
    };

    const reconnectPrinter = async (): Promise<boolean> => {
        if (!connectedPrinter || printerType !== 'BLE') {
            return false;
        }

        try {
            console.log('[PrinterContext] Attempting to reconnect printer...');
            setConnectionStatus('connecting');

            const mac = connectedPrinter.inner_mac_address || connectedPrinter.mac_address;
            await BLEPrinter.connectPrinter(mac);

            setConnectionStatus('connected');
            console.log('[PrinterContext] ✅ Reconnected successfully');
            return true;
        } catch (error) {
            console.error('[PrinterContext] ❌ Reconnection failed:', error);
            setConnectionStatus('disconnected');
            return false;
        }
    };

    const checkAndReconnect = async () => {
        const isConnected = await checkConnection();

        if (!isConnected) {
            console.log('[PrinterContext] Connection lost, attempting reconnect...');
            await reconnectPrinter();
        } else {
            console.log('[PrinterContext] Connection is healthy');
        }
    };

    const startKeepAlive = () => {
        // Clear any existing interval
        if (keepAliveIntervalRef.current) {
            clearInterval(keepAliveIntervalRef.current);
        }

        // Start keep-alive ping every 30 seconds
        keepAliveIntervalRef.current = setInterval(async () => {
            try {
                await BLEPrinter.printText("");
                console.log('[PrinterContext] Keep-alive ping sent');
            } catch (error) {
                console.warn('[PrinterContext] Keep-alive failed, connection may be lost');
                setConnectionStatus('disconnected');
                await checkAndReconnect();
            }
        }, 30000); // 30 seconds

        console.log('[PrinterContext] Keep-alive started (30s interval)');
    };

    const stopKeepAlive = () => {
        if (keepAliveIntervalRef.current) {
            clearInterval(keepAliveIntervalRef.current);
            keepAliveIntervalRef.current = null;
            console.log('[PrinterContext] Keep-alive stopped');
        }
    };

    const connectPrinter = async (printer: any, save = true) => {
        try {
            setConnectionStatus('connecting');
            const mac = printer.inner_mac_address || printer.mac_address;
            await BLEPrinter.connectPrinter(mac);
            setConnectedPrinter(printer);
            setConnectionStatus('connected');

            if (save) {
                await AsyncStorage.setItem(PRINTER_STORAGE_KEY, mac);
            }

            // Keep-alive removed as it causes paper waste
            // if (printerType === 'BLE') {
            //     startKeepAlive();
            // }

            console.log('[PrinterContext] ✅ Printer connected successfully');
        } catch (error) {
            console.error('[PrinterContext] ❌ Connection error:', error);
            setConnectionStatus('disconnected');
            throw error; // Rethrow to let UI handle alert
        }
    };

    const disconnectPrinter = async () => {
        if (connectedPrinter) {
            try {
                // Stop keep-alive first
                stopKeepAlive();

                await BLEPrinter.closeConn();
                setConnectedPrinter(null);
                setConnectionStatus('disconnected');

                console.log('[PrinterContext] Printer disconnected');
                // Optionally clear saved printer? The user requested "so I don't have to choose again".
                // If they explicitly disconnect, maybe they want to choose another one.
                // But typically "persistence" means "remember my last choice".
                // I will NOT clear AsyncStorage here, so if they accidentally disconnect or restart, it remembers.
                // To "Forget", they would need to connect to a different one.
            } catch (error) {
                console.error('[PrinterContext] Disconnect error:', error);
            }
        }
    };

    return (
        <PrinterContext.Provider value={{
            connectedPrinter,
            isScanning,
            printers,
            printerType,
            connectionStatus,
            setPrinterType: updatePrinterType,
            scanPrinters,
            connectPrinter,
            disconnectPrinter,
            isPosDevice,
            checkConnection,
            reconnectPrinter
        }}>
            {children}
        </PrinterContext.Provider>
    );
};
