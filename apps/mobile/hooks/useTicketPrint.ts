import { useState } from 'react';
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
    const { printerType } = usePrinter();
    const { settings: companySettings } = useCompany();
    const { settings } = useSettings();
    const [isPrinting, setIsPrinting] = useState(false);

    const print = async (data: TicketData, viewShotRef?: React.RefObject<any>) => {
        setIsPrinting(true);
        try {
            console.log(`[useTicketPrint] Starting print job for ticket: ${data.hash || data.ticketId}`);
            console.log(`[useTicketPrint] Using template: ${settings.ticketTemplate}`);

            let uri;
            if (viewShotRef?.current?.capture) {
                try {
                    uri = await viewShotRef.current.capture();
                    console.log(`[useTicketPrint] Capture success: ${uri}`);
                } catch (captureErr) {
                    console.warn("[useTicketPrint] Capture failed, falling back to text-only print", captureErr);
                }
            } else {
                console.warn("[useTicketPrint] No ViewShot ref provided, printing text-only");
            }

            // Cleanup amount (remove R$ and format) if it's a string from game screens
            const cleanAmount = typeof data.price === 'string'
                ? data.price.replace(/[^\d,]/g, '').replace(',', '.')
                : data.price;

            const success = await printTicket(
                { ...data, companyLogoUrl: companySettings.logoUrl },
                printerType,
                uri,
                settings.ticketTemplate
            );

            return success;
        } catch (error) {
            console.error("[useTicketPrint] Print Error:", error);
            return false;
        } finally {
            setIsPrinting(false);
        }
    };

    return { print, isPrinting };
}
