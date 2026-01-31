import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkContextType {
    isConnected: boolean;
    isInternetReachable: boolean;
}

const NetworkContext = createContext<NetworkContextType>({
    isConnected: true,
    isInternetReachable: true
});

export function NetworkProvider({ children }: { children: React.ReactNode }) {
    const [isConnected, setIsConnected] = useState(true);
    const [isInternetReachable, setIsInternetReachable] = useState(true);

    useEffect(() => {
        // Verificar estado inicial
        NetInfo.fetch().then((state: NetInfoState) => {
            setIsConnected(state.isConnected ?? false);
            setIsInternetReachable(state.isInternetReachable ?? false);
        });


        // Monitorar mudanças de conexão
        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            setIsConnected(state.isConnected ?? false);
            setIsInternetReachable(state.isInternetReachable ?? false);

            console.log('[Network] Connection changed:', {
                isConnected: state.isConnected,
                isInternetReachable: state.isInternetReachable,
                type: state.type
            });
        });


        return () => unsubscribe();
    }, []);

    return (
        <NetworkContext.Provider value={{ isConnected, isInternetReachable }}>
            {children}
        </NetworkContext.Provider>
    );
}

export const useNetwork = () => useContext(NetworkContext);
