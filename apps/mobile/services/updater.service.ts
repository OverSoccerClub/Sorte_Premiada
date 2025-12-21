import * as Application from 'expo-application';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { Alert, Platform, Linking } from 'react-native';

const UPDATE_URL = 'https://www.inforcomputer.com/Atualizacoes/Fezinha_do_dia';
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
            // Add cache busting timestamp
            const checkUrl = `${VERSION_FILE_URL}?t=${Date.now()}`;
            console.log('Checking for updates at:', checkUrl);
            const response = await fetch(checkUrl, {
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

            // Use nativeApplicationVersion for display/compare
            // Fallback to "1.0.0" is risky if native module fails, but better than crash
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

    async downloadUpdate(apkUrl: string, onProgress?: (percentage: number) => void): Promise<void> {
        // If URL is relative, prepend base path
        const fullUrl = apkUrl.startsWith('http') ? apkUrl : `${UPDATE_URL}/${apkUrl}`;

        console.log('Starting native download:', fullUrl);

        try {
            const fileName = 'update.apk';

            // Use FileSystem namespace directly
            // Ensure directory ends with slash if it doesn't automatically (expo constants usually do)
            const dir = FileSystem.cacheDirectory || FileSystem.documentDirectory;

            if (!dir) {
                // Critical native module failure
                console.error("FileSystem constants are null", { cache: FileSystem.cacheDirectory, doc: FileSystem.documentDirectory });
                throw new Error(`Erro Crítico: Armazenamento não disponível (FS=Null).`);
            }

            // Ensure directory exists
            const dirInfo = await FileSystem.getInfoAsync(dir);
            if (!dirInfo.exists) {
                try {
                    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
                } catch (e) {
                    console.warn("Failed to create dir", e);
                }
            }

            const fileUri = `${dir}${fileName}`;

            // Check if file exists and delete it to prevent stale installs
            const fileInfo = await FileSystem.getInfoAsync(fileUri);
            if (fileInfo.exists) {
                await FileSystem.deleteAsync(fileUri, { idempotent: true });
            }

            // 1. Download File with Progress
            const downloadResumable = FileSystem.createDownloadResumable(
                fullUrl,
                fileUri,
                {},
                (downloadProgress) => {
                    const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                    if (onProgress) {
                        onProgress(progress);
                    }
                }
            );

            const downloadRes = await downloadResumable.downloadAsync();

            if (!downloadRes || downloadRes.status !== 200) {
                throw new Error(`Falha no download (Status: ${downloadRes?.status})`);
            }

            console.log('Download complete:', downloadRes.uri);

            // 2. Install using Intent
            // Note: getContentUriAsync requires file to be in strictly reachable places sometimes
            const contentUri = await FileSystem.getContentUriAsync(downloadRes.uri);

            console.log('Opening content URI:', contentUri);

            try {
                await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                    data: contentUri,
                    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
                    type: 'application/vnd.android.package-archive',
                });
            } catch (e: any) {
                console.warn('Intent failed, trying Sharing:', e);
                // Fallback isn't great for APKs, usually better to show error instruction
                throw new Error("Não foi possível iniciar o instalador. Verifique as permissões.");
            }

        } catch (error: any) {
            console.error('Download error:', error);
            throw error; // Propagate error to UI
        }
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
