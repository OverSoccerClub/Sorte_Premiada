import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { AppConfig } from '../constants/AppConfig';

interface LicenseStatus {
    isValid: boolean;
    status: string;
    daysRemaining: number | null;
    warnings: string[];
    companyName: string;
}

/**
 * Hook para verificar status da licença da empresa
 * Usado no mobile para bloquear acesso se licença expirada
 */
export function useLicenseCheck(token: string | null, userRole: string | null) {
    const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        // Apenas verificar para ADMIN (MASTER não precisa)
        if (token && userRole === 'ADMIN') {
            checkLicense();
        }
    }, [token, userRole]);

    const checkLicense = async () => {
        setIsChecking(true);
        try {
            const response = await fetch(`${AppConfig.api.baseUrl}/company/license`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setLicenseStatus(data);

                // Se licença não é válida, mostrar alerta e bloquear
                if (!data.isValid) {
                    handleInvalidLicense(data);
                }
                // Se tem avisos (próximo do vencimento), mostrar alerta
                else if (data.warnings && data.warnings.length > 0) {
                    handleWarnings(data.warnings);
                }
            }
        } catch (error) {
            console.error('Erro ao verificar licença:', error);
        } finally {
            setIsChecking(false);
        }
    };

    const handleInvalidLicense = (data: LicenseStatus) => {
        let message = '';

        if (data.status === 'EXPIRED') {
            message = `A licença da empresa ${data.companyName} expirou!\n\nEntre em contato com o administrador para renovar o acesso.`;
        } else if (data.status === 'SUSPENDED') {
            message = `A empresa ${data.companyName} está suspensa.\n\nEntre em contato com o suporte.`;
        } else if (data.status === 'TRIAL' && data.daysRemaining !== null && data.daysRemaining <= 0) {
            message = `O período de teste da empresa ${data.companyName} expirou!\n\nAtive sua licença para continuar usando o sistema.`;
        } else {
            message = `Acesso bloqueado.\n\nLicença inválida (${data.status}).`;
        }

        Alert.alert(
            '⚠️ Acesso Bloqueado',
            message,
            [
                {
                    text: 'OK',
                    style: 'cancel',
                },
            ],
            { cancelable: false }
        );
    };

    const handleWarnings = (warnings: string[]) => {
        // Mostrar apenas se for urgente (3 dias ou menos)
        const urgentWarning = warnings.find(w =>
            w.includes('3 dia') || w.includes('1 dia') || w.includes('AMANHÃ')
        );

        if (urgentWarning) {
            Alert.alert(
                '⚠️ Atenção',
                urgentWarning,
                [{ text: 'OK' }]
            );
        }
    };

    return {
        licenseStatus,
        isChecking,
        isLicenseValid: licenseStatus?.isValid ?? true, // Default true para não bloquear se não conseguir verificar
        recheckLicense: checkLicense,
    };
}
