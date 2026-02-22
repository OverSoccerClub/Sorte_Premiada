import React from 'react';
import { View } from 'react-native';
import tw from '../../lib/tailwind';
import { TicketContent, TicketData } from './TicketContent';
import { TicketContentAlternative } from './TicketContentAlternative';
import { TicketContentMilhar } from './TicketContentMilhar';

interface TicketDisplayProps {
    data: TicketData;
    mode: 'preview' | 'capture';
    scale?: number;
    template?: 'default' | 'alternative' | 'milhar';
}

export function TicketDisplay({ data, mode, scale = 0.80, template = 'default' }: TicketDisplayProps) {
    const isCapture = mode === 'capture';
    const TemplateComponent = template === 'milhar' ? TicketContentMilhar : (template === 'alternative' ? TicketContentAlternative : TicketContent);

    console.log(`[TicketDisplay] Mode: ${mode}, Template: ${template}, Component: ${TemplateComponent.name}`);

    if (isCapture) {
        return <TemplateComponent data={data} isCapture={true} />;
    }

    // Modal/Screen Preview Mode
    return (
        <View style={tw`bg-gray-100 items-center justify-center p-1 rounded-xl`}>
            {/* Wrapper to simulate paper background */}
            <View style={[tw`overflow-hidden bg-white shadow-lg`, { width: 384, transform: [{ scale }] }]}>
                <TemplateComponent data={data} isCapture={false} />
            </View>
        </View>
    );
}
