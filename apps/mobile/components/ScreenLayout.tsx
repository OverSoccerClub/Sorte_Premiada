import React from "react";
import { View, ScrollView, ViewProps, ScrollViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import tw from "../lib/tailwind";

interface ScreenLayoutProps extends ViewProps {
    children: React.ReactNode;
    scrollable?: boolean;
    contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
    scrollRef?: React.RefObject<ScrollView>;
}

export function ScreenLayout({
    children,
    scrollable = false,
    style,
    contentContainerStyle,
    scrollRef,
    ...props
}: ScreenLayoutProps) {
    return (
        <SafeAreaView style={[tw`flex-1 bg-background`, style]} edges={['top', 'left', 'right']} {...props}>
            <StatusBar style="light" />
            {scrollable ? (
                <ScrollView
                    ref={scrollRef}
                    style={tw`flex-1`}
                    contentContainerStyle={[{ flexGrow: 1 }, contentContainerStyle]}
                    showsVerticalScrollIndicator={false}
                    overScrollMode="never"
                >
                    <View style={tw`flex-1 items-center w-full`}>
                        <View style={tw`w-full max-w-[500px] flex-1`}>
                            {children}
                        </View>
                    </View>
                </ScrollView>
            ) : (
                <View style={[tw`flex-1 items-center w-full`]}>
                    <View style={tw`w-full max-w-[500px] flex-1`}>
                        {children}
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}
