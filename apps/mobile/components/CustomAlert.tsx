import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Modal, Animated, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "../lib/tailwind";

export type AlertType = "success" | "error" | "warning" | "info";

export interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    type: AlertType;
    onClose: () => void;
    showCancel?: boolean;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    useAppIcon?: boolean;
}

export const CustomAlert = ({
    visible,
    title,
    message,
    type,
    onClose,
    showCancel = false,
    onConfirm,
    confirmText = "Entendido",
    cancelText = "Cancelar",
    useAppIcon = false
}: CustomAlertProps) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 5,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    if (!visible) return null;

    let iconName: keyof typeof Ionicons.glyphMap = "checkmark-circle";
    let colorClass = "bg-emerald-500";
    let iconColor = "#10b981"; // emerald-500
    let borderColor = "border-emerald-500";

    if (type === "error") {
        iconName = "alert-circle";
        colorClass = "bg-red-500";
        iconColor = "#ef4444";
        borderColor = "border-red-500";
    } else if (type === "warning") {
        iconName = "warning";
        colorClass = "bg-amber-500";
        iconColor = "#f59e0b";
        borderColor = "border-amber-500";
    } else if (type === "info") {
        iconName = "information-circle";
        colorClass = "bg-blue-500";
        iconColor = "#3b82f6";
        borderColor = "border-blue-500";
    }

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        } else {
            onClose();
        }
    };

    return (
        <Modal transparent visible={visible} animationType="none">
            <View style={tw`flex-1 justify-center items-center bg-black/80 px-4`}>
                <Animated.View
                    style={[
                        tw`bg-surface w-full max-w-sm rounded-3xl p-5 items-center shadow-2xl border border-gray-700`,
                        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
                    ]}
                >
                    <View style={tw`w-16 h-16 ${colorClass} rounded-full justify-center items-center mb-4 shadow-lg shadow-${colorClass.replace('bg-', '')}/50 border-4 border-surface -mt-10 overflow-hidden`}>
                        {useAppIcon ? (
                            <Image
                                source={require('../assets/nova_logo_final.png')}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="cover"
                            />
                        ) : (
                            <Ionicons name={iconName} size={32} color="white" />
                        )}
                    </View>
                    <Text style={tw`text-lg font-bold text-white text-center mb-2`}>{title}</Text>
                    <Text style={tw`text-gray-400 text-center mb-6 leading-5 text-sm`}>{message}</Text>

                    <View style={tw`w-full flex-row gap-3`}>
                        {showCancel && (
                            <TouchableOpacity
                                style={tw`flex-1 bg-gray-700 py-3 rounded-xl items-center active:opacity-90 border border-gray-600`}
                                onPress={onClose}
                            >
                                <Text style={tw`text-gray-300 font-bold text-base uppercase tracking-wide`}>{cancelText}</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={tw`flex-1 ${colorClass} py-3 rounded-xl items-center active:opacity-90 shadow-lg`}
                            onPress={handleConfirm}
                        >
                            <Text style={tw`text-white font-bold text-base uppercase tracking-wide`}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};
