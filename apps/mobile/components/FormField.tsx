import React from "react";
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "../lib/tailwind";

interface FormFieldProps extends TextInputProps {
    label?: string;
    error?: string;
    isPassword?: boolean;
    rightIcon?: React.ReactNode;
    containerStyle?: any;
}

export function FormField({
    label,
    error,
    isPassword,
    rightIcon,
    containerStyle,
    style,
    ...props
}: FormFieldProps) {
    const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    const secureTextEntry = isPassword && !isPasswordVisible;

    return (
        <View style={[tw`mb-4 w-full`, containerStyle]}>
            {label && (
                <Text style={tw`text-gray-400 mb-2 font-bold text-xs uppercase tracking-wider`}>
                    {label}
                </Text>
            )}

            <View style={tw`w-full bg-background border border-gray-700 rounded-xl flex-row items-center focus:border-primary overflow-hidden ${error ? 'border-red-500' : ''}`}>
                <TextInput
                    style={[tw`flex-1 p-4 text-white placeholder-gray-600 text-base`, style]}
                    placeholderTextColor="#475569"
                    secureTextEntry={secureTextEntry}
                    {...props}
                />

                {isPassword && (
                    <TouchableOpacity onPress={togglePasswordVisibility} style={tw`p-4`}>
                        <Ionicons
                            name={isPasswordVisible ? "eye-off" : "eye"}
                            size={24}
                            color="#94a3b8"
                        />
                    </TouchableOpacity>
                )}

                {!isPassword && rightIcon && (
                    <View style={tw`pr-4`}>
                        {rightIcon}
                    </View>
                )}
            </View>

            {error && (
                <Text style={tw`text-red-500 text-xs mt-1 ml-1`}>{error}</Text>
            )}
        </View>
    );
}
