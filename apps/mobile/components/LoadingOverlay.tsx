
import React from 'react';
import { View, Text, ActivityIndicator, Image, Modal } from 'react-native';
import { useLoading } from '../context/LoadingContext';
import tw from 'twrnc';

export const LoadingOverlay = () => {
    const { isLoading, message } = useLoading();

    if (!isLoading) return null;

    return (
        <Modal transparent animationType="fade" visible={isLoading}>
            <View style={tw`flex-1 bg-black/80 justify-center items-center z-50`}>
                <View style={tw`bg-zinc-900 p-8 rounded-2xl items-center border border-emerald-600/30 shadow-2xl w-3/4 max-w-sm`}>

                    {/* Logo / Icon */}
                    <View style={tw`bg-white/5 p-4 rounded-full mb-6`}>
                        <Image
                            source={require('../assets/nova_logo_final.png')}
                            style={{ width: 180, height: 180 }}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Premium Spinner */}
                    <ActivityIndicator size="large" color="#10b981" style={tw`mb-4 transform scale-125`} />

                    {/* Message */}
                    <Text style={tw`text-emerald-500 text-lg font-bold text-center mb-1`}>
                        {message || 'Carregando...'}
                    </Text>
                    <Text style={tw`text-zinc-500 text-sm text-center`}>
                        Aguarde um momento
                    </Text>

                </View>
            </View>
        </Modal>
    );
};
