import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar variáveis de ambiente baseado no NODE_ENV
const envFile = process.env.NODE_ENV === 'production'
    ? '.env.production.test'
    : '.env.test';

dotenv.config({ path: path.resolve(__dirname, '../../', envFile) });

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,

    reporter: [
        ['html', {
            outputFolder: '../../test-reports/e2e/html',
            open: 'never'
        }],
        ['json', {
            outputFile: '../../test-reports/e2e/json/results.json'
        }],
        ['list'],
    ],

    use: {
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        actionTimeout: parseInt(process.env.TIMEOUT || '10000'),
        navigationTimeout: 30000,
        headless: process.env.HEADLESS === 'true',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    // Apenas iniciar servidor local se não estiver testando produção
    ...(process.env.NODE_ENV !== 'production' && {
        webServer: {
            command: 'npm run dev',
            url: 'http://localhost:3000',
            reuseExistingServer: !process.env.CI,
            timeout: 120000,
        },
    }),
});
