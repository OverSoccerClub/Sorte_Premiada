import * as Application from 'expo-application';
import * as Linking from 'expo-linking';
import { Alert, Platform } from 'react-native';

const UPDATE_URL = 'https://www.inforcomputer.com/Atualizacoes/SORTE_PREMIADA';
const VERSION_FILE_URL = `${UPDATE_URL}/version.json`;

interface VersionInfo {
    version: string;
    build: string;
    apkUrl: string;
    force: boolean;
    notes?: string;
}

export const UpdaterService = {
    async checkForUpdates(isManualCheck = false) {
        if (Platform.OS !== 'android') return;

        try {
            console.log('Checking for updates at:', VERSION_FILE_URL);
            const response = await fetch(VERSION_FILE_URL, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch version info: ${response.status}`);
            }

            const remoteData: VersionInfo = await response.json();

            const currentVersion = Application.nativeApplicationVersion || '1.0.0';
            const currentBuild = Application.nativeBuildVersion || '1';

            console.log(`Current: ${currentVersion} (${currentBuild}) | Remote: ${remoteData.version} (${remoteData.build})`);

            const hasUpdate = this.compareVersions(remoteData.version, currentVersion, remoteData.build, currentBuild);

            if (hasUpdate) {
                Alert.alert(
                    'Nova Versão Disponível',
                    `A versão ${remoteData.version} está disponível.${remoteData.notes ? '\n\n' + remoteData.notes : ''}\n\nDeseja atualizar agora?`,
                    [
                        {
                            text: 'Cancelar',
                            style: 'cancel',
                            onPress: () => {
                                if (remoteData.force) {
                                    // If forced, maybe exit app or preventing usage? 
                                    // For now just close alert.
                                }
                            }
                        },
                        {
                            text: 'Atualizar',
                            onPress: () => this.downloadUpdate(remoteData.apkUrl)
                        },
                    ],
                    { cancelable: !remoteData.force }
                );
            } else if (isManualCheck) {
                Alert.alert('Tudo Certo', 'Você já está usando a versão mais recente.');
            }
        } catch (error) {
            console.error('Update check failed:', error);
            if (isManualCheck) {
                Alert.alert('Erro', 'Não foi possível verificar atualizações.');
            }
        }
    },

    downloadUpdate(apkUrl: string) {
        // If URL is relative, prepend base path
        const fullUrl = apkUrl.startsWith('http') ? apkUrl : `${UPDATE_URL}/${apkUrl}`;

        Linking.openURL(fullUrl).catch(err => {
            console.error('Failed to open update URL:', err);
            Alert.alert('Erro', 'Não foi possível abrir o link de download.');
        });
    },

    compareVersions(remoteVer: string, localVer: string, remoteBuild: string, localBuild: string): boolean {
        // Simple comparison logic
        // 1. Compare semantic version strings
        if (remoteVer !== localVer) {
            return remoteVer > localVer; // Very basic string comparison (works for '1.0.1' > '1.0.0' but careful with '1.10' vs '1.2')
            // In reality, stick to build numbers for absolute certainty
        }

        // 2. If versions equal, compare build numbers
        return parseInt(remoteBuild) > parseInt(localBuild);
    }
};
