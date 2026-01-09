import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import tw from "../../lib/tailwind";

export default function PlaceholderGame() {
    const router = useRouter();
    const { title } = useLocalSearchParams();

    return (
        <SafeAreaView style={tw`flex-1 bg-white`}>
            <View style={tw`p-4 border-b border-gray-200 flex-row items-center`}>
                <TouchableOpacity onPress={() => router.back()} style={tw`p-2`}>
                    <Ionicons name="arrow-back" size={24} color="#374151" />
                </TouchableOpacity>
                <Text style={tw`text-xl font-bold ml-4 text-gray-800`}>{title || "Jogo"}</Text>
            </View>
            <View style={tw`flex-1 justify-center items-center p-6 w-[90%] max-w-[400px] self-center`}>
                <Ionicons name="construct-outline" size={64} color="#9ca3af" />
                <Text style={tw`text-xl font-bold text-gray-800 mt-4 text-center`}>Em Breve</Text>
                <Text style={tw`text-gray-500 text-center mt-2`}>
                    O jogo {title} estará disponível nas próximas atualizações.
                </Text>
            </View>
        </SafeAreaView>
    );
}
