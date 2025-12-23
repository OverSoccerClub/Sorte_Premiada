import React, { useState } from 'react';
import { View, Text, Modal, ActivityIndicator, TouchableOpacity, Button } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import tw from '../../lib/tailwind';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TicketsService } from '../../services/tickets.service';
import { useAuth } from '../../context/AuthContext';

export default function ValidateTicketScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const router = useRouter();
    const { token } = useAuth();

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View style={tw`flex-1 justify-center items-center p-4`}>
                <Text style={tw`text-center mb-4 text-lg`}>Precisamos de acesso à câmera para validar bilhetes.</Text>
                <Button onPress={requestPermission} title="Conceder Permissão" />
            </View>
        );
    }

    const handleBarCodeScanned = async ({ type, data }: { type: string, data: string }) => {
        // Prevent multiple scans
        if (scanned || loading) return;

        setScanned(true);
        setLoading(true);

        try {
            console.log(`[Scanner] Type: ${type}, Data: ${data}`);

            // Extract ID if URL
            let ticketId = data;
            if (data.includes('sorteio/')) {
                const parts = data.split('sorteio/');
                if (parts.length > 1) {
                    ticketId = parts[1];
                }
            }

            // Call API
            const validation = await TicketsService.validate(token!, ticketId);

            if (validation.success) {
                setResult(validation.data);
            } else {
                setResult({ error: true, message: validation.message });
            }
        } catch (error) {
            console.error(error);
            setResult({ error: true, message: 'Erro ao processar bilhete.' });
        } finally {
            setLoading(false);
        }
    };

    const resetScan = () => {
        setScanned(false);
        setResult(null);
    };

    return (
        <View style={tw`flex-1 bg-black`}>
            <CameraView
                style={tw`flex-1`}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["code128", "code39", "qr"],
                }}
            >
                <View style={tw`flex-1 bg-transparent flex-row relative`}>

                    {/* Overlay Visual */}
                    <View style={tw`absolute top-0 bottom-0 left-0 right-0 justify-center items-center`}>
                        <View style={tw`w-64 h-40 border-2 border-green-500 rounded-lg bg-transparent`} />
                        <Text style={tw`text-white mt-4 font-bold bg-black/50 px-4 py-1 rounded`}>
                            Posicione o código de barras aqui
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={tw`absolute top-10 left-4 p-2 bg-black/50 rounded-full`}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>

                </View>
            </CameraView>

            {/* Result Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={scanned}
                onRequestClose={resetScan}
            >
                <View style={tw`flex-1 justify-end bg-black/50`}>
                    <View style={tw`bg-white rounded-t-3xl p-6 min-h-[300px]`}>
                        {loading ? (
                            <View style={tw`items-center justify-center flex-1`}>
                                <ActivityIndicator size="large" color="#10b981" />
                                <Text style={tw`mt-4 text-gray-500`}>Validando bilhete...</Text>
                            </View>
                        ) : result ? (
                            <View style={tw`items-center`}>
                                <Ionicons
                                    name={result.error ? "alert-circle" : "checkmark-circle"}
                                    size={64}
                                    color={result.error ? "red" : "#10b981"}
                                />
                                <Text style={tw`text-2xl font-bold mt-2 text-center`}>
                                    {result.error ? "Erro" : result.status === 'WON' ? "Premiado!" : "Resultado"}
                                </Text>
                                <Text style={tw`text-lg text-gray-600 mt-2 text-center`}>
                                    {result.message}
                                </Text>

                                <TouchableOpacity
                                    style={tw`bg-emerald-600 w-full py-3 rounded-lg mt-8`}
                                    onPress={resetScan}
                                >
                                    <Text style={tw`text-white text-center font-bold`}>Ler Outro Bilhete</Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    </View>
                </View>
            </Modal>
        </View>
    );
}
