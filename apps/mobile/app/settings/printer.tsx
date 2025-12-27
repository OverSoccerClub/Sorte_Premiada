import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Platform, Alert, PermissionsAndroid } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import tw from "../../lib/tailwind";
import { usePrinter } from "../../context/PrinterContext";
import { CustomAlert, AlertType } from "../../components/CustomAlert";
import { ScreenLayout } from "../../components/ScreenLayout";
import { ScreenHeader } from "../../components/ScreenHeader";

export default function PrinterSettingsScreen() {
    const router = useRouter();
    const {
        printerType,
        setPrinterType,
        printers,
        scanPrinters,
        connectPrinter,
        disconnectPrinter,
        connectedPrinter,
        isScanning,
    } = usePrinter();

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
        <ScreenLayout>
            <ScreenHeader title="Configurar Impressora" />

            <View style={tw`w-full max-w-[500px] p-6 flex-1`}>
                {/* Type Selection */}
                <Text style={tw`text-gray-400 font-bold mb-4 uppercase text-xs tracking-wider`}>Tipo de Impressão</Text>

                <View style={tw`flex-row gap-4 mb-8`}>
                    <TouchableOpacity
                        onPress={() => togglePrinterType('BLE')}
                        style={tw`flex-1 p-4 rounded-xl border ${printerType === 'BLE' ? 'bg-primary border-primary' : 'bg-surface border-gray-700'} items-center`}
                    >
                        <Ionicons name="bluetooth" size={32} color={printerType === 'BLE' ? 'white' : '#94a3b8'} style={tw`mb-2`} />
                        <Text style={tw`font-bold ${printerType === 'BLE' ? 'text-white' : 'text-gray-400'}`}>Bluetooth</Text>
                        <Text style={tw`text-[10px] mt-1 text-center ${printerType === 'BLE' ? 'text-white/80' : 'text-gray-600'}`}>Impressoras 58mm</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => togglePrinterType('NATIVE')}
                        style={tw`flex-1 p-4 rounded-xl border ${printerType === 'NATIVE' ? 'bg-primary border-primary' : 'bg-surface border-gray-700'} items-center`}
                    >
                        <Ionicons name="print" size={32} color={printerType === 'NATIVE' ? 'white' : '#94a3b8'} style={tw`mb-2`} />
                        <Text style={tw`font-bold ${printerType === 'NATIVE' ? 'text-white' : 'text-gray-400'}`}>Nativa</Text>
                        <Text style={tw`text-[10px] mt-1 text-center ${printerType === 'NATIVE' ? 'text-white/80' : 'text-gray-600'}`}>USB / WiFi / PDF</Text>
                    </TouchableOpacity>
                </View>

                {/* Bluetooth Device List */}
                {printerType === 'BLE' && (
                    <>
                        <View style={tw`flex-row justify-between items-center mb-4`}>
                            <Text style={tw`text-gray-400 font-bold uppercase text-xs tracking-wider`}>Dispositivos Encontrados</Text>
                            <TouchableOpacity onPress={handleRefresh} disabled={isScanning} style={tw`bg-gray-800 p-2 rounded-full border border-gray-700`}>
                                {isScanning ? <ActivityIndicator size="small" color="#10b981" /> : <Ionicons name="refresh" size={20} color="#10b981" />}
                            </TouchableOpacity>
                        </View>

                        <View style={tw`bg-surface rounded-xl border border-gray-700 overflow-hidden flex-1`}>
                            <FlatList
                                data={printers}
                                keyExtractor={(item) => item.inner_mac_address}
                                contentContainerStyle={tw`pb-4`}
                                ListEmptyComponent={
                                    <View style={tw`p-8 items-center`}>
                                        <Ionicons name="bluetooth" size={40} color="#334155" style={tw`mb-4`} />
                                        <Text style={tw`text-gray-500 text-center font-bold`}>Nenhuma impressora encontrada</Text>
                                        <Text style={tw`text-gray-600 text-xs mt-2 text-center`}>Toque em atualizar para buscar.</Text>
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
                                            <View style={tw`bg-emerald-500/20 px-2 py-1 rounded border border-emerald-500/30`}>
                                                <Text style={tw`text-emerald-500 text-xs font-bold`}>Conectado</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                )}
                            />
                        </View>

                        <Text style={tw`text-gray-500 text-xs mt-4 text-center leading-5 mb-4 px-4`}>
                            Certifique-se de que a impressora está ligada e pareada nas configurações do Android.
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
        </ScreenLayout>
    );
}
