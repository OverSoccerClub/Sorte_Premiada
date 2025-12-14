import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import tw from '../../lib/tailwind';
import { usePrinter } from '../../context/PrinterContext';

export default function PrinterSettingsScreen() {
    const router = useRouter();
    const {
        printers,
        isScanning,
        scanPrinters,
        connectPrinter,
        connectedPrinter,
        disconnectPrinter,
        printerType,
        setPrinterType,
        isPosDevice
    } = usePrinter();

    useEffect(() => {
        if (printerType === 'BLE') {
            scanPrinters();
        }
    }, [printerType]);

    const renderPrinter = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={tw`bg-surface p-4 rounded-xl mb-3 border ${connectedPrinter?.inner_mac_address === item.inner_mac_address ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-800'}`}
            onPress={() => connectPrinter(item)}
        >
            <View style={tw`flex-row justify-between items-center`}>
                <View style={tw`flex-row items-center gap-2`}>
                    <Text style={tw`text-white font-bold text-lg`}>{item.device_name || "Dispositivo Desconhecido"}</Text>
                    {isPosDevice(item) && (
                        <View style={tw`bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30`}>
                            <Text style={tw`text-blue-400 text-[10px] font-bold`}>POS</Text>
                        </View>
                    )}
                </View>
                <Text style={tw`text-gray-500 text-xs`}>{item.inner_mac_address}</Text>
                {connectedPrinter?.inner_mac_address === item.inner_mac_address && (
                    <View style={tw`bg-emerald-500 px-3 py-1 rounded-full`}>
                        <Text style={tw`text-white text-xs font-bold`}>Conectado</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={tw`flex-1 bg-background`}>
            {/* Header */}
            <View style={tw`p-6 border-b border-gray-800 bg-surface flex-row items-center`}>
                <TouchableOpacity onPress={() => router.back()} style={tw`mr-4 p-2 bg-gray-800 rounded-full border border-gray-700`}>
                    <Ionicons name="arrow-back" size={24} color="#94a3b8" />
                </TouchableOpacity>
                <View>
                    <Text style={tw`text-2xl font-bold text-white`}>Impressora</Text>
                    <Text style={tw`text-gray-400 text-sm`}>Configurar método de impressão</Text>
                </View>
            </View>

            <View style={tw`w-[90%] max-w-[400px] flex-1 self-center p-4`}>
                {/* Mode Selector */}
                <View style={tw`bg-surface p-4 rounded-xl mb-6 border border-gray-800`}>
                    <Text style={tw`text-gray-400 font-bold uppercase tracking-wider text-xs mb-4`}>Modo de Impressão</Text>
                    <View style={tw`flex-row justify-between items-center mb-2`}>
                        <View>
                            <Text style={tw`text-white font-bold text-lg`}>Impressão Nativa</Text>
                            <Text style={tw`text-gray-500 text-xs`}>Usar serviço de impressão do Android (POS)</Text>
                        </View>
                        <Switch
                            value={printerType === 'NATIVE'}
                            onValueChange={(val) => setPrinterType(val ? 'NATIVE' : 'BLE')}
                            trackColor={{ false: "#334155", true: "#059669" }}
                            thumbColor={printerType === 'NATIVE' ? "#10b981" : "#94a3b8"}
                        />
                    </View>
                </View>

                {printerType === 'BLE' ? (
                    <>
                        <View style={tw`flex-row justify-between items-center mb-6`}>
                            <Text style={tw`text-gray-400 font-bold uppercase tracking-wider text-xs`}>Dispositivos Bluetooth</Text>
                            <TouchableOpacity onPress={scanPrinters} disabled={isScanning}>
                                {isScanning ? (
                                    <ActivityIndicator color="#10b981" />
                                ) : (
                                    <Text style={tw`text-emerald-500 font-bold`}>Atualizar</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={printers}
                            renderItem={renderPrinter}
                            keyExtractor={(item) => item.inner_mac_address}
                            overScrollMode="never"
                            ListEmptyComponent={
                                <View style={tw`items-center justify-center py-10`}>
                                    <Text style={tw`text-gray-500`}>Nenhuma impressora encontrada.</Text>
                                    <Text style={tw`text-gray-600 text-xs mt-2 text-center`}>Certifique-se que a impressora está ligada e pareada nas configurações do Bluetooth do Android.</Text>
                                </View>
                            }
                        />

                        {connectedPrinter && (
                            <TouchableOpacity
                                style={tw`mt-4 bg-red-500/10 border border-red-500/50 p-4 rounded-xl items-center`}
                                onPress={disconnectPrinter}
                            >
                                <Text style={tw`text-red-500 font-bold`}>Desconectar Impressora</Text>
                            </TouchableOpacity>
                        )}
                    </>
                ) : (
                    <View style={tw`items-center justify-center py-10 opacity-50`}>
                        <Ionicons name="print-outline" size={64} color="#94a3b8" />
                        <Text style={tw`text-gray-400 mt-4 text-center px-6`}>O modo nativo utiliza o serviço de impressão padrão do sistema Android. Nenhuma configuração adicional é necessária se o driver da impressora POS estiver instalado.</Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}
