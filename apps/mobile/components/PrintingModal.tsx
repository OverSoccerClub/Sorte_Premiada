
import React from 'react';
import { Modal, View, Text, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';

interface PrintingModalProps {
    visible: boolean;
}

export function PrintingModal({ visible }: PrintingModalProps) {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            statusBarTranslucent
        >
            <View style={tw`flex-1 justify-center items-center bg-black/80`}>
                <View style={tw`bg-white p-8 rounded-2xl items-center shadow-xl w-[80%] max-w-[300px]`}>
                    <View style={tw`bg-emerald-100 p-4 rounded-full mb-4`}>
                        <Ionicons name="print" size={40} color="#059669" />
                    </View>
                    <Text style={tw`text-xl font-bold text-gray-800 mb-2`}>Imprimindo...</Text>
                    <Text style={tw`text-center text-gray-500 mb-6`}>Aguarde enquanto o bilhete é impresso.</Text>
                    <ActivityIndicator size="large" color="#059669" />
                </View>
            </View>
        </Modal>
    );
}
