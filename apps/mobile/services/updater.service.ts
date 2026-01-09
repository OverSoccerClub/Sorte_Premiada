import * as Application from 'expo-application';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { Alert, Platform, Linking } from 'react-native';

// Fallback update URL - can be overridden by AppConfig if needed
const DEFAULT_UPDATE_URL = 'https://www.inforcomputer.com/Atualizacoes/InnoBet';
const VERSION_FILE_NAME = 'version.json';

export interface VersionInfo {
    version: string;
    build: string;
    apkUrl: string;
    force: boolean;
    notes?: string;
}

export const UpdaterService = {
    getUpdateUrl(overrideUrl?: string): string {
        return overrideUrl || DEFAULT_UPDATE_URL;
    },

    async checkForUpdates(updateUrl?: string): Promise<VersionInfo | null> {
        if (Platform.OS !== 'android') return null;

        try {
            const baseUrl = this.getUpdateUrl(updateUrl);
            const checkUrl = `${baseUrl}/${VERSION_FILE_NAME}?t=${Date.now()}`;

            console.log('[Updater] Checking for updates at:', checkUrl);

            const response = await fetch(checkUrl, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                },
            });

            if (!response.ok) {
                console.warn(`[Updater] Update check failed with status: ${response.status}`);
                throw new Error(`Servidor de atualizações indisponível (${response.status})`);
            }

            const text = await response.text();

            // CRITICAL: Robustly strip BOM (Byte Order Mark) and any leading/trailing whitespace
            // UTF-8 BOM is 0xEF,0xBB,0xBF. 
            const cleanText = text.replace(/^\uFEFF/, '').trim();

            let remoteData: VersionInfo;
            try {
                remoteData = JSON.parse(cleanText);
            } catch (e: any) {
                console.error('[Updater] JSON Parse Error. Raw text head:', text.substring(0, 20));
                throw new Error(`Erro ao processar dados de versão. Por favor, tente novamente mais tarde.`);
            }

            const currentVersion = Application.nativeApplicationVersion || '1.0.0';
            const currentBuild = Application.nativeBuildVersion || '1';

            console.log(`[Updater] Current: ${currentVersion} (${currentBuild}) | Remote: ${remoteData.version} (${remoteData.build})`);

            const hasUpdate = this.compareVersions(remoteData.version, currentVersion, remoteData.build, currentBuild);

            if (hasUpdate) {
                return remoteData;
            }

            return null;
        } catch (error: any) {
            console.error('[Updater] Check failed:', error.message);
            throw error;
        }
    },

    async downloadUpdate(apkUrl: string, updateUrl?: string, onProgress?: (percentage: number) => void): Promise<void> {
        const baseUrl = this.getUpdateUrl(updateUrl);
        const fullUrl = apkUrl.startsWith('http') ? apkUrl : `${baseUrl}/${apkUrl}`;

        console.log('[Updater] Starting download from:', fullUrl);

        try {
            const fileName = 'update.apk';
            // Use cacheDirectory for temporary download - it's often safer for file provider sharing
            // providing we have a provider path for it. 
            // In Expo, FileSystem.documentDirectory is usually covered by the default FileProvider.
            const dir = FileSystem.documentDirectory;

            if (!dir) {
                throw new Error(`Armazenamento não disponível para download.`);
            }

            // Ensure directory exists
            const dirInfo = await FileSystem.getInfoAsync(dir);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => { });
            }

            const fileUri = `${dir}${fileName}`;

            // Clean up old files
            const fileInfo = await FileSystem.getInfoAsync(fileUri);
            if (fileInfo.exists) {
                await FileSystem.deleteAsync(fileUri, { idempotent: true });
            }

            const downloadResumable = FileSystem.createDownloadResumable(
                fullUrl,
                fileUri,
                {},
                (downloadProgress) => {
                    const totalSafe = downloadProgress.totalBytesExpectedToWrite > 0
                        ? downloadProgress.totalBytesExpectedToWrite
                        : 15 * 1024 * 1024; // fallback estimation 15MB if header missing

                    const progress = downloadProgress.totalBytesWritten / totalSafe;
                    if (onProgress) {
                        onProgress(progress > 1 ? 1 : progress);
                    }
                }
            );

            const downloadRes = await downloadResumable.downloadAsync();

            if (!downloadRes || downloadRes.status !== 200) {
                throw new Error(`Falha ao baixar arquivo (Status: ${downloadRes?.status || 'desconhecido'})`);
            }

            // Verify file size
            const downloadedFileInfo = await FileSystem.getInfoAsync(downloadRes.uri);
            if (downloadedFileInfo.exists && 'size' in downloadedFileInfo && downloadedFileInfo.size < 1024 * 1024) { // Warning if < 1MB, likely error page
                console.warn('[Updater] Downloaded file seems too small:', downloadedFileInfo.size);
                // We don't throw here strictly unless it's 0, but it's suspicious.
                if (downloadedFileInfo.size === 0) throw new Error("Arquivo baixado está vazio.");
            }

            console.log('[Updater] Download complete:', downloadRes.uri, 'Size:', 'size' in downloadedFileInfo ? downloadedFileInfo.size : 'unknown');

            const contentUri = await FileSystem.getContentUriAsync(downloadRes.uri);
            console.log('[Updater] Content URI for installer:', contentUri);

            try {
                // Android 7.0+ requires FLAG_GRANT_READ_URI_PERMISSION (0x00000001)
                // We also use FLAG_ACTIVITY_NEW_TASK (0x10000000) for context safety
                await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                    data: contentUri,
                    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
                    type: 'application/vnd.android.package-archive',
                });
            } catch (e: any) {
                console.error('[Updater] Intent failure details:', e);
                throw new Error(`Não foi possível abrir o instalador. Detalhes: ${e.message}`);
            }

        } catch (error: any) {
            console.error('[Updater] Download/Install error:', error.message);
            throw error;
        }
    },

    compareVersions(remoteVer: string, localVer: string, remoteBuild: string, localBuild: string): boolean {
        const v1 = remoteVer.split('.').map(Number);
        const v2 = localVer.split('.').map(Number);

        for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
            const num1 = v1[i] || 0;
            const num2 = v2[i] || 0;
            if (num1 > num2) return true;
            if (num1 < num2) return false;
        }

        return parseInt(remoteBuild) > parseInt(localBuild);
    }
};

