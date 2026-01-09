import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import tw from "../lib/tailwind";

interface ScreenHeaderProps {
    title: string;
    showBackButton?: boolean;
    rightElement?: React.ReactNode;
}

export function ScreenHeader({ title, showBackButton = true, rightElement }: ScreenHeaderProps) {
    const router = useRouter();

    return (
        <View style={tw`px-4 py-3 border-b border-gray-800 flex-row items-center bg-surface justify-between`}>
            <View style={tw`flex-row items-center flex-1`}>
                {showBackButton && (
                    <TouchableOpacity onPress={() => router.back()} style={tw`p-2 bg-gray-800 rounded-full mr-4`}>
                        <Ionicons name="arrow-back" size={24} color="#94a3b8" />
                    </TouchableOpacity>
                )}
                <Text style={tw`text-xl font-bold text-white flex-1`} numberOfLines={1}>
                    {title}
                </Text>
            </View>
            {rightElement && (
                <View>
                    {rightElement}
                </View>
            )}
        </View>
    );
}
