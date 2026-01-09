import React, { forwardRef } from 'react';
import { View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { TicketDisplay } from './TicketDisplay';
import { TicketData } from './TicketContent';

interface TicketPrintManagerProps {
    data: TicketData | null;
}

/**
 * TicketPrintManager
 * 
 * Hidden component that provides the capture area for high-quality ticket printing.
 * Should be placed at the bottom of the screen that needs printing capabilities.
 */
export const TicketPrintManager = forwardRef<ViewShot, TicketPrintManagerProps>(({ data }, ref) => {
    if (!data) return null;

    return (
        <View
            style={{ position: 'absolute', top: -5000, left: -5000 }}
            pointerEvents="none"
        >
            <ViewShot
                ref={ref}
                options={{ format: "png", quality: 1.0, result: "tmpfile" }}
                style={{ backgroundColor: '#ffffff', width: 384 }}
            >
                <TicketDisplay data={data} mode="capture" />
            </ViewShot>
        </View>
    );
});
