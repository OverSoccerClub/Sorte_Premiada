import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import { BLEPrinter } from 'react-native-thermal-receipt-printer-image-qr';
import { PrinterType } from '../services/printing.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PrinterContextType {
    connectedPrinter: any;
    isScanning: boolean;
    printers: any[];
    printerType: PrinterType;
    setPrinterType: (type: PrinterType) => void;
    scanPrinters: () => Promise<void>;
    connectPrinter: (printer: any) => Promise<void>;
    disconnectPrinter: () => void;
    isPosDevice: (printer: any) => boolean;
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
    }, []);

    const loadSavedPrinter = async () => {
        try {
            const savedType = await AsyncStorage.getItem(PRINTER_TYPE_KEY);
            const savedMac = await AsyncStorage.getItem(PRINTER_STORAGE_KEY);

            if (savedType) {
                setPrinterType(savedType as PrinterType);
            }

            if (savedType === 'BLE' && savedMac) {
                console.log("Found saved printer, attempting auto-connect:", savedMac);
                // We need to Connect directly. BLEPrinter supports connecting by address even without scanning first usually,
                // but sometimes scanning is needed to discover services.
                // Let's try connecting directly first.
                try {
                    await connectPrinter({ inner_mac_address: savedMac, device_name: "Saved Printer" }, false); // False = don't save again
                    console.log("Auto-connected to saved printer");
                } catch (e) {
                    console.log("Auto-connect failed, trying scan first...");
                    // If fails, maybe scan first?
                    // For now, let's leave it. If auto-connect fails, user sees disconnected state.
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

    const connectPrinter = async (printer: any, save = true) => {
        try {
            const mac = printer.inner_mac_address || printer.mac_address;
            await BLEPrinter.connectPrinter(mac);
            setConnectedPrinter(printer);

            if (save) {
                await AsyncStorage.setItem(PRINTER_STORAGE_KEY, mac);
            }
            // Alert removed here. Caller must handle success feedback.
        } catch (error) {
            console.error("Connection error:", error);
            throw error; // Rethrow to let UI handle alert
        }
    };

    const disconnectPrinter = async () => {
        if (connectedPrinter) {
            try {
                await BLEPrinter.closeConn();
                setConnectedPrinter(null);
                // Optionally clear saved printer? The user requested "so I don't have to choose again".
                // If they explicitly disconnect, maybe they want to choose another one.
                // But typically "persistence" means "remember my last choice".
                // I will NOT clear AsyncStorage here, so if they accidentally disconnect or restart, it remembers.
                // To "Forget", they would need to connect to a different one.
            } catch (error) {
                console.error("Disconnect error:", error);
            }
        }
    };

    return (
        <PrinterContext.Provider value={{
            connectedPrinter,
            isScanning,
            printers,
            printerType,
            setPrinterType: updatePrinterType,
            scanPrinters,
            connectPrinter,
            disconnectPrinter,
            isPosDevice
        }}>
            {children}
        </PrinterContext.Provider>
    );
};
