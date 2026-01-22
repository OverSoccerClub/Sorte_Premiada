import { useState } from 'react';
import { Alert } from 'react-native';
import { printTicket } from '../services/printing.service';
import { TicketData } from '../components/ticket/TicketContent';
import { usePrinter } from '../context/PrinterContext';
import { useCompany } from '../context/CompanyContext';
import { useSettings } from '../context/SettingsContext';

/**
 * useTicketPrint
 * 
 * Custom hook to handle the "Capture -> Print" workflow for tickets.
 */
export function useTicketPrint() {
    const { printerType, reconnectPrinter } = usePrinter();
    const { settings: companySettings } = useCompany();
    const { settings } = useSettings();
    const [isPrinting, setIsPrinting] = useState(false);

    const print = async (data: TicketData, viewShotRef?: React.RefObject<any>) => {
        setIsPrinting(true);
        const MAX_RETRIES = 2;
        let currentAttempt = 0;

        while (currentAttempt <= MAX_RETRIES) {
            try {
                console.log(`[useTicketPrint] ========== PRINT JOB START (Attempt ${currentAttempt + 1}/${MAX_RETRIES + 1}) ==========`);
                console.log(`[useTicketPrint] Ticket: ${data.hash || data.ticketId}`);
                console.log(`[useTicketPrint] Template: ${settings.ticketTemplate}`);
                console.log(`[useTicketPrint] Printer Type: ${printerType}`);
                console.log(`[useTicketPrint] ViewShot Ref Available: ${!!viewShotRef?.current}`);

                let uri;
                if (viewShotRef?.current?.capture) {
                    try {
                        console.log(`[useTicketPrint] Attempting ViewShot capture...`);
                        uri = await viewShotRef.current.capture();
                        console.log(`[useTicketPrint] ✅ Capture SUCCESS: ${uri}`);
                    } catch (captureErr) {
                        console.error("[useTicketPrint] ❌ Capture FAILED:", captureErr);
                        console.warn("[useTicketPrint] Falling back to text-only print");
                    }
                } else {
                    console.warn("[useTicketPrint] ⚠️ No ViewShot ref provided, printing text-only");
                }

                // Cleanup amount (remove R$ and format) if it's a string from game screens
                const cleanAmount = typeof data.price === 'string'
                    ? data.price.replace(/[^\d,]/g, '').replace(',', '.')
                    : data.price;

                console.log(`[useTicketPrint] Calling printTicket with template: ${settings.ticketTemplate}, imageUri: ${uri ? 'YES' : 'NO'}`);
                const success = await printTicket(
                    {
                        ...data,
                        companyLogoUrl: companySettings.logoUrl,
                        qrcodeWidth: companySettings.qrcodeWidth,
                        qrcodeHeight: companySettings.qrcodeHeight,
                        alternativeLogoWidth: companySettings.alternativeLogoWidth,
                        alternativeLogoHeight: companySettings.alternativeLogoHeight,
                        alternativeQrWidth: companySettings.alternativeQrWidth,
                        alternativeQrHeight: companySettings.alternativeQrHeight
                    },
                    printerType,
                    uri,
                    settings.ticketTemplate
                );

                if (success) {
                    console.log(`[useTicketPrint] ✅ Print SUCCESS on attempt ${currentAttempt + 1}`);
                    console.log(`[useTicketPrint] ========== PRINT JOB END ==========`);
                    setIsPrinting(false);
                    return true;
                }

                throw new Error('Print returned false');

            } catch (error: any) {
                console.error(`[useTicketPrint] ❌ Print attempt ${currentAttempt + 1} failed:`, error);

                // Check if it's a connection error
                const isConnectionError = error.message?.includes('desconectada') ||
                    error.message?.includes('connection') ||
                    error.message?.includes('disconnect');

                if (currentAttempt < MAX_RETRIES) {
                    console.log(`[useTicketPrint] Retrying in 2 seconds... (${currentAttempt + 1}/${MAX_RETRIES})`);

                    // If connection error and BLE, try to reconnect
                    if (isConnectionError && printerType === 'BLE') {
                        console.log('[useTicketPrint] Attempting to reconnect printer...');
                        await reconnectPrinter();
                    }

                    await new Promise(r => setTimeout(r, 2000));
                    currentAttempt++;
                } else {
                    // Last attempt failed
                    console.log(`[useTicketPrint] ❌ All ${MAX_RETRIES + 1} attempts failed`);
                    console.log(`[useTicketPrint] ========== PRINT JOB END (FAILED) ==========`);
                    setIsPrinting(false);

                    // Show alert with retry option
                    return new Promise<boolean>((resolve) => {
                        Alert.alert(
                            "Erro de Impressão",
                            isConnectionError
                                ? "Não foi possível imprimir. A impressora pode estar desconectada."
                                : "Não foi possível imprimir. Verifique a impressora.",
                            [
                                {
                                    text: "Cancelar",
                                    style: "cancel",
                                    onPress: () => resolve(false)
                                },
                                {
                                    text: "Tentar Novamente",
                                    onPress: async () => {
                                        const result = await print(data, viewShotRef);
                                        resolve(result);
                                    }
                                }
                            ]
                        );
                    });
                }
            }
        }

        setIsPrinting(false);
        return false;
    };

    return { print, isPrinting };
}
