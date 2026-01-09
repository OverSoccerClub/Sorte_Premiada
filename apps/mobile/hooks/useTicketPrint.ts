import { useState } from 'react';
import { printTicket } from '../services/printing.service';
import { TicketData } from '../components/ticket/TicketContent';
import { usePrinter } from '../context/PrinterContext';
import { useCompany } from '../context/CompanyContext';

/**
 * useTicketPrint
 * 
 * Custom hook to handle the "Capture -> Print" workflow for tickets.
 */
export function useTicketPrint() {
    const { printerType } = usePrinter();
    const { settings } = useCompany();
    const [isPrinting, setIsPrinting] = useState(false);

    const print = async (data: TicketData, viewShotRef?: React.RefObject<any>) => {
        setIsPrinting(true);
        try {
            console.log(`[useTicketPrint] Starting print job for ticket: ${data.hash || data.ticketId}`);

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
                { ...data, companyLogoUrl: settings.logoUrl },
                printerType,
                uri
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
