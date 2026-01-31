import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from '../context/NetworkContext';

export function NoInternetBanner() {
    const { isConnected, isInternetReachable } = useNetwork();
    const slideAnim = useRef(new Animated.Value(-100)).current;

    const hasNoInternet = !isConnected || !isInternetReachable;

    useEffect(() => {
        if (hasNoInternet) {
            // Mostrar banner com animação suave
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 7,
            }).start();
        } else {
            // Esconder banner
            Animated.timing(slideAnim, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [hasNoInternet]);

    return (
        <Animated.View
            style={[
                styles.banner,
                { transform: [{ translateY: slideAnim }] }
            ]}
            pointerEvents="none"
        >
            <Ionicons name="wifi-outline" size={20} color="#fff" style={styles.icon} />
            <Text style={styles.text}>
                Sem conexão com a internet
            </Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    banner: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#DC2626',
        paddingVertical: 12,
        paddingHorizontal: 16,
        paddingTop: 40, // Espaço para status bar
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    icon: {
        marginRight: 8,
    },
    text: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Roboto_700Bold',
    },
});
