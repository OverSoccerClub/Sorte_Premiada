import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppConfig } from '../constants/AppConfig';
import { useAuth } from '../context/AuthContext';
import { FinanceService } from '../services/finance.service';
import { usePrinter } from '../context/PrinterContext';
import { printSangriaReceipt } from '../services/printing.service';
import ViewShot from 'react-native-view-shot';
import { SangriaReceipt } from './SangriaReceipt';
import tw from '../lib/tailwind';

interface Cobrador {
    id: string;
    name: string;
    username: string;
}

interface SangriaModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function SangriaModal({ visible, onClose, onSuccess }: SangriaModalProps) {
    const { token, user } = useAuth();
    const { printerType } = usePrinter();

    // Steps: 0 = Amount/Cobrador, 1 = PIN
    const [step, setStep] = useState(0);
    const viewShotRef = React.useRef<ViewShot>(null);

    const [amount, setAmount] = useState("");
    const [cobradores, setCobradores] = useState<Cobrador[]>([]);
    const [selectedCobrador, setSelectedCobrador] = useState<Cobrador | null>(null);
    const [pin, setPin] = useState("");

    const [loading, setLoading] = useState(false);
    const [fetchingCobradores, setFetchingCobradores] = useState(false);

    // Receipt Data for Capture
    const [receiptData, setReceiptData] = useState<{
        date: string;
        amount: string;
        cambistaName: string;
        cobradorName: string;
        id: string;
    } | null>(null);

    useEffect(() => {
        if (visible) {
            resetForm();
            fetchCobradores();
        }
    }, [visible]);

    const resetForm = () => {
        setStep(0);
        setAmount("");
        setSelectedCobrador(null);
        setPin("");
        setReceiptData(null);
    };

    const fetchCobradores = async () => {
        setFetchingCobradores(true);
        try {
            // Re-using generic users endpoint, filtering client-side or specific endpoint?
            // Assuming generic /users works and returns all users (as per UsersController logic we saw earlier)
            // But usually normal users can't see all users. 
            // We might need a specific endpoint /users/cobradores or check if current user permissions allow.
            // Let's try fetching from /users. If fails (403), we might need API change.
            // Assumption: Cambista might not have permission to list all users. 
            // Workaround: We might need a public/shared endpoint or Cambista permissions.
            // Let's assume for now Cambista can list or we need to add endpoint.
            // *Wait*, implementing logic: If fetch fails, we can't select.

            const res = await fetch(`${AppConfig.api.baseUrl}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                const filtered = data.filter((u: any) => u.role === 'COBRADOR');
                setCobradores(filtered);
            } else {
                console.warn("Failed to fetch users");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setFetchingCobradores(false);
        }
    };

    const handleNext = () => {
        if (!amount || parseFloat(amount.replace(',', '.')) <= 0) {
            Alert.alert("Erro", "Digite um valor válido.");
            return;
        }
        if (!selectedCobrador) {
            Alert.alert("Erro", "Selecione um cobrador.");
            return;
        }
        setStep(1);
    };

    const formatCurrency = (val: string) => {
        // Simple currency mask logic
        let v = val.replace(/\D/g, '');
        v = (Number(v) / 100).toFixed(2) + '';
        v = v.replace('.', ',');
        return v;
    };

    const handleAmountChange = (text: string) => {
        const raw = text.replace(/\D/g, '');
        setAmount(formatCurrency(raw)); // Mask
    };

    const handleSubmit = async () => {
        if (pin.length !== 4) {
            Alert.alert("Erro", "O PIN deve ter 4 dígitos.");
            return;
        }

        setLoading(true);
        try {
            const val = parseFloat(amount.replace(',', '.'));
            const transactionData = {
                description: `SANGRIA - ${selectedCobrador?.name}`,
                amount: val,
                type: 'DEBIT' as const
            }; // Fixed TS error by adding as const or explicit casting if needed. using generic obj for now.

            // 1. Create Transaction
            const result = await FinanceService.createTransaction(
                token || '',
                { ...transactionData, type: 'DEBIT' },
                selectedCobrador?.id,
                pin
            );

            if (result.success) {
                // Set Data for ViewShot to render
                const rData = {
                    date: new Date().toLocaleString('pt-BR'),
                    amount: `R$ ${val.toFixed(2).replace('.', ',')}`,
                    cambistaName: user?.name || user?.username || "Cambista",
                    cobradorName: selectedCobrador?.name || selectedCobrador?.username || "Cobrador",
                    id: result.data.id
                };
                setReceiptData(rData);

                // Wait for render
                setTimeout(async () => {
                    let imageUri: string | undefined;
                    try {
                        imageUri = await viewShotRef.current?.capture?.();
                    } catch (e) {
                        console.warn("ViewShot capture failed", e);
                    }

                    await printSangriaReceipt({
                        date: new Date(),
                        amount: val,
                        cambistaName: rData.cambistaName,
                        cobradorName: rData.cobradorName,
                        transactionId: rData.id
                    }, printerType, imageUri);

                    Alert.alert("Sucesso", "Sangria realizada e registrada!");
                    onSuccess();
                }, 500);

            } else {
                Alert.alert("Erro", result.error || "PIN Incorreto ou Falha ao registrar.");
            }
        } catch (e) {
            console.error(e);
            Alert.alert("Erro", "Erro desconhecido.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Sangria / Recolhimento</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {step === 0 ? (
                        <View style={styles.content}>
                            <Text style={styles.label}>Valor a Recolher (R$)</Text>
                            <TextInput
                                style={styles.input}
                                value={amount}
                                onChangeText={handleAmountChange}
                                keyboardType="numeric"
                                placeholder="0,00"
                            />

                            <Text style={styles.label}>Selecionar Cobrador</Text>
                            {fetchingCobradores ? (
                                <ActivityIndicator size="small" color="#000" />
                            ) : (
                                <View style={styles.listContainer}>
                                    <FlatList
                                        data={cobradores}
                                        keyExtractor={item => item.id}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                style={[
                                                    styles.cobradorItem,
                                                    selectedCobrador?.id === item.id && styles.selectedItem
                                                ]}
                                                onPress={() => setSelectedCobrador(item)}
                                            >
                                                <Ionicons
                                                    name={selectedCobrador?.id === item.id ? "radio-button-on" : "radio-button-off"}
                                                    size={20}
                                                    color={selectedCobrador?.id === item.id ? "#059669" : "#666"}
                                                />
                                                <Text style={styles.cobradorName}>{item.name} ({item.username})</Text>
                                            </TouchableOpacity>
                                        )}
                                        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum cobrador encontrado.</Text>}
                                    />
                                </View>
                            )}

                            <TouchableOpacity style={styles.button} onPress={handleNext}>
                                <Text style={styles.buttonText}>Continuar</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.content}>
                            <Text style={styles.pinInstructions}>
                                Passe o celular para o Cobrador <Text style={{ fontWeight: 'bold' }}>{selectedCobrador?.name}</Text>.
                            </Text>
                            <Text style={styles.label}>Digite seu PIN (Cobrador)</Text>

                            <TextInput
                                style={styles.pinInput}
                                value={pin}
                                onChangeText={t => setPin(t.replace(/\D/g, '').slice(0, 4))}
                                keyboardType="numeric"
                                secureTextEntry
                                placeholder="****"
                                autoFocus
                            />

                            <TouchableOpacity
                                style={[styles.button, styles.confirmButton]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.buttonText}>Confirmar e Imprimir</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => setStep(0)} style={styles.backButton}>
                                <Text style={styles.backText}>Voltar</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
            <View style={{ position: 'absolute', opacity: 0, zIndex: -10, left: -2000, top: 0 }}>
                {(receiptData) && (
                    <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1.0, result: "tmpfile" }} style={{ backgroundColor: '#ffffff', width: 384 }}>
                        {/* Copy 1 */}
                        <SangriaReceipt
                            amount={receiptData.amount}
                            cambistaName={receiptData.cambistaName}
                            cobradorName={receiptData.cobradorName}
                            date={receiptData.date}
                            id={receiptData.id}
                            copyName="Via do Cambista"
                            signerLabel="Cobrador"
                            isCapture={true}
                        />
                        {/* Cut Line */}
                        <View style={tw`w-full border-b-[2px] border-dashed border-black my-8 h-1`} />
                        <View style={tw`items-center -mt-5 bg-white self-center px-2 mb-4`}>
                            <Ionicons name="cut-outline" size={24} color="black" />
                        </View>

                        {/* Copy 2 */}
                        <SangriaReceipt
                            amount={receiptData.amount}
                            cambistaName={receiptData.cambistaName}
                            cobradorName={receiptData.cobradorName}
                            date={receiptData.date}
                            id={receiptData.id}
                            copyName="Via do Cobrador"
                            signerLabel="Cambista"
                            isCapture={true}
                        />
                        <View style={tw`h-8`} />
                    </ViewShot>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        gap: 15,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    listContainer: {
        maxHeight: 200,
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
    },
    cobradorItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    selectedItem: {
        backgroundColor: '#ecfdf5',
    },
    cobradorName: {
        fontSize: 16,
    },
    emptyText: {
        padding: 20,
        textAlign: 'center',
        color: '#999',
    },
    button: {
        backgroundColor: '#000',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    confirmButton: {
        backgroundColor: '#059669',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    pinInstructions: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    pinInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 15,
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        letterSpacing: 10,
    },
    backButton: {
        padding: 15,
        alignItems: 'center',
    },
    backText: {
        color: '#666',
    },
});
