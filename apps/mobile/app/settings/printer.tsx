import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Platform, Alert, PermissionsAndroid } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import tw from "../../lib/tailwind";
import { usePrinter } from "../../context/PrinterContext";
import { BLEPrinter } from "react-native-thermal-receipt-printer-image-qr";
import { CustomAlert, AlertType } from "../../components/CustomAlert"; // Added Import

interface BluetoothDevice {
    name: string;
    macAddress: string;
}

export default function PrinterSettingsScreen() {
    const router = useRouter();
    const {
        printerType,
        setPrinterType,
        printers,           // Fixed
        scanPrinters,       // Fixed
        connectPrinter,     // Fixed
        disconnectPrinter,  // Fixed
        connectedPrinter,   // Fixed (was connectedDevice)
        isScanning,
        isPosDevice         // Added
    } = usePrinter();

    // const [devices, setDevices] = useState<BluetoothDevice[]>([]); // Removed local state, use context
    // const [scanLoading, setScanLoading] = useState(false); // Use isScanning from context

    // Alert State
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type: AlertType;
    }>({
        visible: false,
        title: "",
        message: "",
        type: "info",
    });

    const showAlert = (title: string, message: string, type: AlertType = "info") => {
        setAlertConfig({ visible: true, title, message, type });
    };

    const hideAlert = () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
    };

    useEffect(() => {
        // Initial scan if type is BLE
        if (printerType === 'BLE') {
            scanPrinters();
        }
    }, [printerType]);

    const requestPermissions = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                ]);

                return (
                    granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
                    granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
                );
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    };

    // This function is no longer needed as scanPrinters from context handles the scanning logic.
    // const scanDevices = async () => {
    //     setScanLoading(true);
    //     try {
    //         const hasPerms = await requestPermissions();
    //         if (!hasPerms) {
    //             showAlert("Permissão Negada", "O app precisa de permissão Bluetooth para encontrar impressoras.", "error"); // CustomAlert
    //             setScanLoading(false);
    //             return;
    //         }

    //         // Mock scan or library scan
    //         BLEPrinter.init();
    //         BLEPrinter.getDeviceList()
    //             .then((results: BluetoothDevice[]) => {
    //                 setDevices(results);
    //             })
    //             .catch((e: any) => {
    //                 console.warn("Scan Error", e);
    //                 showAlert("Erro", "Falha ao buscar dispositivos Bluetooth.", "error"); // CustomAlert
    //             })
    //             .finally(() => setScanLoading(false));

    //     } catch (e) {
    //         console.error(e);
    //         showAlert("Erro", "Erro ao iniciar busca.", "error"); // CustomAlert
    //         setScanLoading(false);
    //     }
    // };

    const handleConnect = async (printer: any) => {
        try {
            await connectPrinter(printer);
            showAlert("Sucesso", `Conectado a ${printer.device_name || "Impressora"}`, "success"); // CustomAlert
        } catch (e) {
            showAlert("Erro", "Falha na conexão com a impressora.", "error"); // CustomAlert
        }
    };

    const handleRefresh = async () => {
        await scanPrinters();
    };

    const togglePrinterType = (type: 'BLE' | 'NATIVE') => {
        setPrinterType(type);
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-background`}>
            {/* Header */}
            <View style={tw`p-6 border-b border-gray-800 flex-row items-center bg-surface`}>
                <TouchableOpacity onPress={() => router.back()} style={tw`mr-4 p-2 bg-gray-800 rounded-full border border-gray-700`}>
                    <Ionicons name="arrow-back" size={24} color="#94a3b8" />
                </TouchableOpacity>
                <Text style={tw`text-2xl font-bold text-white`}>Configurar Impressora</Text>
            </View>

            <View style={tw`p-6 flex-1`}>
                {/* Type Selection */}
                <Text style={tw`text-gray-400 font-bold mb-4 uppercase text-xs tracking-wider`}>Tipo de Impressão</Text>

                <View style={tw`flex-row gap-4 mb-8`}>
                    <TouchableOpacity
                        onPress={() => togglePrinterType('BLE')}
                        style={tw`flex-1 p-4 rounded-xl border ${printerType === 'BLE' ? 'bg-primary border-primary' : 'bg-surface border-gray-700'}`}
                    >
                        <Ionicons name="bluetooth" size={24} color={printerType === 'BLE' ? 'white' : '#94a3b8'} style={tw`mb-2`} />
                        <Text style={tw`font-bold ${printerType === 'BLE' ? 'text-white' : 'text-gray-400'}`}>Bluetooth (Térmica)</Text>
                        <Text style={tw`text-[10px] mt-1 ${printerType === 'BLE' ? 'text-white/80' : 'text-gray-600'}`}>Impressoras portáteis 58mm</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => togglePrinterType('NATIVE')}
                        style={tw`flex-1 p-4 rounded-xl border ${printerType === 'NATIVE' ? 'bg-primary border-primary' : 'bg-surface border-gray-700'}`}
                    >
                        <Ionicons name="print" size={24} color={printerType === 'NATIVE' ? 'white' : '#94a3b8'} style={tw`mb-2`} />
                        <Text style={tw`font-bold ${printerType === 'NATIVE' ? 'text-white' : 'text-gray-400'}`}>Nativa (Sistema)</Text>
                        <Text style={tw`text-[10px] mt-1 ${printerType === 'NATIVE' ? 'text-white/80' : 'text-gray-600'}`}>USB / WiFi / PDF</Text>
                    </TouchableOpacity>
                </View>

                {/* Bluetooth Device List */}
                {printerType === 'BLE' && (
                    <>
                        <View style={tw`flex-row justify-between items-center mb-4`}>
                            <Text style={tw`text-gray-400 font-bold uppercase text-xs tracking-wider`}>Dispositivos Encontrados</Text>
                            <TouchableOpacity onPress={handleRefresh} disabled={isScanning}>
                                {isScanning ? <ActivityIndicator size="small" color="#10b981" /> : <Ionicons name="refresh" size={20} color="#10b981" />}
                            </TouchableOpacity>
                        </View>

                        <View style={tw`bg-surface rounded-xl border border-gray-700 overflow-hidden flex-1`}>
                            <FlatList
                                data={printers} // Use context printers
                                keyExtractor={(item) => item.inner_mac_address}
                                ListEmptyComponent={
                                    <View style={tw`p-8 items-center`}>
                                        <Ionicons name="bluetooth" size={40} color="#334155" style={tw`mb-4`} />
                                        <Text style={tw`text-gray-500 text-center`}>Nenhuma impressora encontrada.{'\n'}Toque em atualizar.</Text>
                                    </View>
                                }
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={tw`p-4 border-b border-gray-800 flex-row justify-between items-center active:bg-gray-800`}
                                        onPress={() => handleConnect(item)}
                                    >
                                        <View>
                                            <Text style={tw`text-white font-bold`}>{item.device_name || "Desconhecido"}</Text>
                                            <Text style={tw`text-gray-500 text-xs`}>{item.inner_mac_address}</Text>
                                        </View>
                                        {connectedPrinter?.inner_mac_address === item.inner_mac_address && (
                                            <View style={tw`bg-emerald-500/20 px-2 py-1 rounded`}>
                                                <Text style={tw`text-emerald-500 text-xs font-bold`}>Conectado</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                )}
                            />
                        </View>

                        <Text style={tw`text-gray-500 text-xs mt-4 text-center leading-5 mb-4`}>
                            Certifique-se de que a impressora está ligada ou pareada nas configurações do Android caso não apareça na lista.
                        </Text>
                    </>
                )}
            </View>
            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={hideAlert}
            />
        </SafeAreaView>
    );
}
