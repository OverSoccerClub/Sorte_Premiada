import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
    const insets = useSafeAreaInsets();
    const TAB_BAR_HEIGHT = 70 + insets.bottom;

    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: "#50C878", // Primary Emerald Green
            tabBarInactiveTintColor: "#94a3b8", // Gray 400
            tabBarStyle: {
                backgroundColor: "#1e293b", // Surface (Slate 800)
                borderTopColor: "#1f2937", // Gray 800
                height: TAB_BAR_HEIGHT,
                paddingBottom: insets.bottom + 10, // Ensure content clears the home indicator/nav bar
                paddingTop: 8,
            },
            headerShown: false
        }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: "Jogos",
                    tabBarIcon: ({ color }) => <Ionicons name="game-controller" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: "Histórico",
                    tabBarIcon: ({ color }) => <Ionicons name="list" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="finance"
                options={{
                    title: "Financeiro",
                    tabBarIcon: ({ color }) => <Ionicons name="wallet-outline" size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}
