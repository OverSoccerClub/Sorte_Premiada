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
            console.log(`[useTicketPrint] ========== PRINT JOB START ==========`);
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
                { ...data, companyLogoUrl: companySettings.logoUrl },
                printerType,
                uri,
                settings.ticketTemplate
            );

            console.log(`[useTicketPrint] Print result: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
            console.log(`[useTicketPrint] ========== PRINT JOB END ==========`);
            return success;
        } catch (error) {
            console.error("[useTicketPrint] ❌ Print Error:", error);
            return false;
        } finally {
            setIsPrinting(false);
        }
    };

    return { print, isPrinting };
}
