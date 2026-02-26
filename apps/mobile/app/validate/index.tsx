import React, { useState } from 'react';
import { View, Text, Modal, ActivityIndicator, TouchableOpacity, Button, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
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
    const [manualCode, setManualCode] = useState('');
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

    const validateTicket = async (code: string) => {
        if (loading) return;

        setLoading(true);
        setScanned(true); // Open modal

        try {
            // Extract ID if URL
            let ticketId = code;
            if (code.includes('sorteio/')) {
                const parts = code.split('sorteio/');
                if (parts.length > 1) {
                    ticketId = parts[1];
                }
            }

            console.log(`[Validation] Validating code: ${ticketId}`);

            // Call API
            const validation = await TicketsService.validate(token!, ticketId);

            if (validation.success) {
                setResult(validation.data);
            } else {
                setResult({ error: true, message: validation.message });
            }
        } catch (error: any) {
            setResult({ error: true, message: error?.response?.data?.message || 'Erro ao processar bilhete.' });
        } finally {
            setLoading(false);
        }
    };

    const handleBarCodeScanned = ({ type, data }: { type: string, data: string }) => {
        if (scanned || loading) return;
        console.log(`[Scanner] Scanned Type: ${type}, Data: ${data}`);
        validateTicket(data);
    };

    const handleManualSubmit = () => {
        if (manualCode.trim().length > 0) {
            Keyboard.dismiss();
            validateTicket(manualCode.trim());
        }
    };

    const resetScan = () => {
        setScanned(false);
        setResult(null);
        setManualCode('');
    };

    const handleCashout = async () => {
        if (!result || result.status !== 'WON') return;

        setLoading(true);
        try {
            const ticketCode = result.code || result.hash || result.ticketNumber || result.id;
            const res = await TicketsService.cashout(token!, ticketCode);
            if (res.success) {
                setResult({
                    ...result,
                    status: 'PAID',
                    message: res.message || 'Prêmio pago com sucesso.'
                });
            } else {
                setResult({
                    ...result,
                    error: true,
                    message: res.message
                });
            }
        } catch (error) {
            setResult({
                ...result,
                error: true,
                message: "Erro ao processar pagamento."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={tw`flex-1 bg-black`}>
            <CameraView
                style={tw`flex-1`}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: [
                        "qr", "code128"
                    ],
                }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={tw`flex-1`}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={tw`flex-1 bg-transparent flex-row relative`}>

                            {/* Overlay Visual - Enlarged */}
                            <View style={tw`absolute top-0 bottom-0 left-0 right-0 justify-center items-center`}>
                                <View style={tw`w-[90%] h-40 border-2 border-green-500 rounded-lg bg-transparent`} />
                                <Text style={tw`text-white mt-4 font-bold bg-black/50 px-4 py-1 rounded`}>
                                    Posicione o código de barras
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={tw`absolute top-10 left-4 p-2 bg-black/50 rounded-full z-10`}
                                onPress={() => router.back()}
                            >
                                <Ionicons name="close" size={24} color="white" />
                            </TouchableOpacity>

                            {/* Manual Entry Section */}
                            <View style={tw`absolute bottom-10 left-4 right-4 bg-white/90 p-4 rounded-xl shadow-lg`}>
                                <Text style={tw`text-gray-700 font-bold mb-2`}>Ou digite o código do bilhete:</Text>
                                <View style={tw`flex-row gap-2`}>
                                    <TextInput
                                        style={tw`flex-1 bg-white border border-gray-300 rounded px-3 py-2 text-lg`}
                                        placeholder="Ex: 123456"
                                        value={manualCode}
                                        onChangeText={setManualCode}
                                        keyboardType="default"
                                        autoCapitalize="none"
                                        returnKeyType="go"
                                        onSubmitEditing={handleManualSubmit}
                                    />
                                    <TouchableOpacity
                                        style={tw`bg-emerald-600 px-4 justify-center rounded`}
                                        onPress={handleManualSubmit}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <Ionicons name="arrow-forward" size={24} color="white" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>

                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
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
                                    {result.error ? "Erro" :
                                        result.status === 'WON' ? "Bilhete Premiado!" :
                                            result.status === 'EXPIRED' ? "Bilhete Expirado" :
                                                result.status === 'LOST' ? "Não Premiado" :
                                                    result.status === 'PENDING' ? "Aguardando Sorteio" :
                                                        "Resultado"}
                                </Text>
                                <Text style={tw`text-lg text-gray-600 mt-2 text-center`}>
                                    {result.message}
                                </Text>

                                {result.status === 'WON' && !result.error && (
                                    <TouchableOpacity
                                        style={tw`bg-green-600 w-full py-3 rounded-lg mt-4 flex-row justify-center items-center`}
                                        onPress={handleCashout}
                                    >
                                        <Ionicons name="cash-outline" size={20} color="white" style={tw`mr-2`} />
                                        <Text style={tw`text-white text-center font-bold text-lg`}>Pagar Prêmio</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={tw`bg-emerald-600 w-full py-3 rounded-lg mt-4`}
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

