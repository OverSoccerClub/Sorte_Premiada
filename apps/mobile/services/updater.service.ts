import * as Application from 'expo-application';
import * as Linking from 'expo-linking';
import { Alert, Platform } from 'react-native';

const UPDATE_URL = 'https://www.inforcomputer.com/Atualizacoes/SORTE_PREMIADA';
const VERSION_FILE_URL = `${UPDATE_URL}/version.json`;

export interface VersionInfo {
    version: string;
    build: string;
    apkUrl: string;
    force: boolean;
    notes?: string;
}

export const UpdaterService = {
    async checkForUpdates(): Promise<VersionInfo | null> {
        if (Platform.OS !== 'android') return null;

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
                // Silent fail
                console.warn(`Update check failed with status: ${response.status}`);
                return null;
            }

            const remoteData: VersionInfo = await response.json();

            const currentVersion = Application.nativeApplicationVersion || '1.0.0';
            const currentBuild = Application.nativeBuildVersion || '1';

            console.log(`Current: ${currentVersion} (${currentBuild}) | Remote: ${remoteData.version} (${remoteData.build})`);

            const hasUpdate = this.compareVersions(remoteData.version, currentVersion, remoteData.build, currentBuild);

            if (hasUpdate) {
                return remoteData;
            }

            return null;
        } catch (error) {
            console.error('Update check failed:', error);
            return null;
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
        // 1. Compare semantic version strings
        if (remoteVer !== localVer) {
            return remoteVer > localVer;
        }
        // 2. If versions equal, compare build numbers
        return parseInt(remoteBuild) > parseInt(localBuild);
    }
};
