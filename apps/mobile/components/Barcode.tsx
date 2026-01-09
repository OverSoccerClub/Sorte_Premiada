import React from 'react';
import { View, ViewProps } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { encodeCode128B } from '../lib/code128';

interface BarcodeProps extends ViewProps {
    value: string;
    width?: number; // Total width to fit
    height?: number;
    color?: string;
    backgroundColor?: string;
}

export const Barcode = ({
    value,
    width = 300,
    height = 50,
    color = "black",
    backgroundColor = "transparent",
    style,
    ...props
}: BarcodeProps) => {
    const encoded = encodeCode128B(value || "");
    const totalModules = encoded.length;

    // Width of a single module (bar or space)
    const singleBarWidth = width / totalModules;

    // Generate Rects
    const bars: React.ReactNode[] = [];
    let currentX = 0;

    for (let i = 0; i < encoded.length; i++) {
        if (encoded[i] === '1') {
            bars.push(
                <Rect
                    key={i}
                    x={currentX}
                    y={0}
                    width={singleBarWidth}
                    height={height}
                    fill={color}
                />
            );
        }
        currentX += singleBarWidth;
    }

    return (
        <View style={style} {...props}>
            <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                {/* Background if needed */}
                {backgroundColor !== "transparent" && (
                    <Rect x={0} y={0} width={width} height={height} fill={backgroundColor} />
                )}
                {bars}
            </Svg>
        </View>
    );
};
