
import React, { createContext, useContext, useState, ReactNode } from 'react';

type LoadingContextType = {
    isLoading: boolean;
    message: string | null;
    show: (msg?: string) => void;
    hide: () => void;
};

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const show = (msg?: string) => {
        setMessage(msg || null);
        setIsLoading(true);
    };

    const hide = () => {
        setIsLoading(false);
        setMessage(null);
    };

    return (
        <LoadingContext.Provider value={{ isLoading, message, show, hide }}>
            {children}
        </LoadingContext.Provider>
    );
};

export const useLoading = () => {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
};
