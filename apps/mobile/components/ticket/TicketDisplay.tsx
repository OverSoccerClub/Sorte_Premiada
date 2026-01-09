import React from 'react';
import { View } from 'react-native';
import tw from '../../lib/tailwind';
import { TicketContent, TicketData } from './TicketContent';

interface TicketDisplayProps {
    data: TicketData;
    mode: 'preview' | 'capture';
    scale?: number;
}

export function TicketDisplay({ data, mode, scale = 0.80 }: TicketDisplayProps) {
    const isCapture = mode === 'capture';

    if (isCapture) {
        return <TicketContent data={data} isCapture={true} />;
    }

    // Modal/Screen Preview Mode
    return (
        <View style={tw`bg-gray-100 items-center justify-center p-1 rounded-xl`}>
            {/* Wrapper to simulate paper background */}
            <View style={[tw`overflow-hidden bg-white shadow-lg`, { width: 384, transform: [{ scale }] }]}>
                <TicketContent data={data} isCapture={false} />
            </View>
        </View>
    );
}
