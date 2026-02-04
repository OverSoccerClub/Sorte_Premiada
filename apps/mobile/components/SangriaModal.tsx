import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppConfig } from '../constants/AppConfig';
import { useAuth } from '../context/AuthContext';
import { FinanceService } from '../services/finance.service';
import { usePrinter } from '../context/PrinterContext';
import { printSangriaReceipt } from '../services/printing.service';
import ViewShot from 'react-native-view-shot';
import { SangriaReceipt } from './SangriaReceipt';
import tw from '../lib/tailwind';
import { useCompany } from '../context/CompanyContext';
import { CustomAlert, AlertType } from './CustomAlert';
import { formatBrazilDate, getBrazilNowDate } from '../lib/date-utils';

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
    const { settings } = useCompany();
    const { printerType } = usePrinter();

    // Steps: 0 = Amount/Cobrador, 1 = PIN
    const [step, setStep] = useState(0);
    const viewShotRef = React.useRef<ViewShot>(null);

    const [amount, setAmount] = useState("");
    const [cobradorUsername, setCobradorUsername] = useState(""); // Input
    const [selectedCobrador, setSelectedCobrador] = useState<Cobrador | null>(null);
    const [pin, setPin] = useState("");

    const [loading, setLoading] = useState(false);
    const [verifyingCobrador, setVerifyingCobrador] = useState(false);

    // Receipt Data for Capture
    const [receiptData, setReceiptData] = useState<{
        date: string;
        amount: string;
        cambistaName: string;
        cobradorName: string;
        id: string;
    } | null>(null);

    // Custom Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        title: "",
        message: "",
        type: "info" as AlertType,
        onConfirm: () => { }
    });

    const showAlert = (title: string, message: string, type: AlertType = 'info', onConfirm?: () => void) => {
        setAlertConfig({
            title,
            message,
            type,
            onConfirm: onConfirm || (() => setAlertVisible(false))
        });
        setAlertVisible(true);
    };

    useEffect(() => {
        if (visible) {
            resetForm();
        }
    }, [visible]);

    const resetForm = () => {
        setStep(0);
        setAmount("");
        setCobradorUsername("");
        setSelectedCobrador(null);
        setPin("");
        setReceiptData(null);
    };

    const handleNext = async () => {
        if (!amount || parseFloat(amount.replace(',', '.')) <= 0) {
            showAlert("Erro", "Digite um valor válido.", "error");
            return;
        }
        if (!cobradorUsername.trim()) {
            showAlert("Erro", "Digite a matrícula (usuário) do cobrador.", "error");
            return;
        }

        // Verify Cobrador
        setVerifyingCobrador(true);
        try {
            const res = await fetch(`${AppConfig.api.baseUrl}/users?username=${cobradorUsername.trim()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                // Expecting array
                if (Array.isArray(data) && data.length > 0) {
                    const foundUser = data[0];
                    if (foundUser.role === 'COBRADOR') {
                        setSelectedCobrador(foundUser);
                        setStep(1); // Proceed
                    } else {
                        showAlert("Erro", "Este usuário não é um Cobrador.", "error");
                    }
                } else {
                    showAlert("Erro", "Cobrador não encontrado.", "error");
                }
            } else {
                showAlert("Erro", "Falha ao verificar cobrador.", "error");
            }
        } catch (e) {
            console.error(e);
            showAlert("Erro", "Erro desconhecido.", "error");
        } finally {
            setVerifyingCobrador(false);
        }
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
            showAlert("Erro", "O PIN deve ter 4 dígitos.", "error");
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

            // 1. Create Transaction via Specialized Cash Collection Endpoint
            const result = await FinanceService.collectCash(
                token || '',
                {
                    amount: val,
                    cobradorId: selectedCobrador?.id || '',
                    securityPin: pin,
                    cambistaId: user?.id
                }
            );

            if (result.success) {
                // Set Data for ViewShot to render
                const rData = {
                    date: formatBrazilDate(new Date(), { dateStyle: 'short', timeStyle: 'medium' }),
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
                        date: getBrazilNowDate(),
                        amount: val,
                        cambistaName: rData.cambistaName,
                        cobradorName: rData.cobradorName,
                        transactionId: rData.id,
                        companyName: settings.companyName,
                        companyLogoUrl: settings.logoUrl
                    }, printerType, imageUri);

                    showAlert("Sucesso", "Sangria realizada e registrada!", "success", () => {
                        setAlertVisible(false);
                        onSuccess();
                    });
                }, 500);

            } else {
                showAlert("Erro", result.error || "PIN Incorreto ou Falha ao registrar.", "error");
            }
        } catch (e) {
            console.error(e);
            showAlert("Erro", "Erro desconhecido.", "error");
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

                            <Text style={styles.label}>Matrícula do Cobrador (Usuário)</Text>
                            <TextInput
                                style={styles.input}
                                value={cobradorUsername}
                                onChangeText={setCobradorUsername}
                                autoCapitalize="none"
                                placeholder="ex: cobrador01"
                            />

                            <TouchableOpacity
                                style={[styles.button, verifyingCobrador && { opacity: 0.7 }]}
                                onPress={handleNext}
                                disabled={verifyingCobrador}
                            >
                                {verifyingCobrador ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.buttonText}>Verificar e Continuar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.content}>
                            <Text style={styles.pinInstructions}>
                                Confirmado: <Text style={{ fontWeight: 'bold', color: '#059669' }}>{selectedCobrador?.name}</Text>
                                {"\n"}
                                Passe o celular para o Cobrador digitar a senha.
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
                            companyName={settings.companyName}
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
                            companyName={settings.companyName}
                        />
                        <View style={tw`h-8`} />
                    </ViewShot>
                )}
            </View>
            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertVisible(false)}
                onConfirm={alertConfig.onConfirm}
            />
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
