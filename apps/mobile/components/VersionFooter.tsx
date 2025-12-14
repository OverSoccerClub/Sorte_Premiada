import React from "react";
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import tw from "../lib/tailwind";
import { AppConfig } from "../constants/AppConfig";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export function VersionFooter() {
    const insets = useSafeAreaInsets();

    return (
        <View style={[tw`pt-2 items-center justify-center`, { paddingBottom: 15 }]}>
            <View style={tw`flex-row items-center mb-1 opacity-50`}>
                <MaterialCommunityIcons name="clover" size={12} color="#50C878" style={tw`mr-1`} />
                <Text style={tw`text-gray-400 font-bold text-[10px] tracking-widest`}>SORTE PREMIADA</Text>
            </View>
            <Text style={tw`text-gray-700 text-[8px]`}>Versão {AppConfig.version}</Text>
        </View>
    );
}
