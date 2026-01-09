import { test, expect, Page } from '@playwright/test';

async function login(page: Page, username: string, password: string) {
    await page.goto('/');
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
}

test.describe('Data Isolation E2E', () => {
    test('Company A should not see Company B users', async ({ page }) => {
        // Login como admin da Company A
        await login(page, 'admin_company_a', 'password');

        // Navegar para página de usuários
        await page.goto('/dashboard/users');

        // Aguardar carregamento da tabela
        await page.waitForSelector('table');

        // Pegar todos os usuários visíveis
        const userRows = await page.locator('table tbody tr').all();

        // Verificar que há usuários
        expect(userRows.length).toBeGreaterThan(0);

        // Verificar que nenhum usuário contém "Company B" ou similar
        for (const row of userRows) {
            const rowText = await row.textContent();
            expect(rowText).not.toContain('Company B');
            expect(rowText).not.toContain('Imperial'); // Exemplo de outra empresa
        }
    });

    test('Company A should not see Company B games', async ({ page }) => {
        await login(page, 'admin_company_a', 'password');

        await page.goto('/dashboard/games');
        await page.waitForSelector('table');

        const gameRows = await page.locator('table tbody tr').all();
        expect(gameRows.length).toBeGreaterThan(0);

        for (const row of gameRows) {
            const rowText = await row.textContent();
            expect(rowText).not.toContain('Company B');
        }
    });

    test('Company A should not see Company B areas', async ({ page }) => {
        await login(page, 'admin_company_a', 'password');

        await page.goto('/dashboard/areas');
        await page.waitForSelector('table');

        const areaRows = await page.locator('table tbody tr').all();

        if (areaRows.length > 0) {
            for (const row of areaRows) {
                const rowText = await row.textContent();
                expect(rowText).not.toContain('Company B');
            }
        }
    });

    test('Non-MASTER user cannot access targetCompanyId parameter', async ({ page }) => {
        await login(page, 'admin_company_a', 'password');

        // Tentar acessar usuários de outra empresa via URL
        await page.goto('/dashboard/users?targetCompanyId=other-company-id');

        // Deve mostrar erro ou não mostrar dados de outra empresa
        const userRows = await page.locator('table tbody tr').all();

        for (const row of userRows) {
            const rowText = await row.textContent();
            // Não deve conter dados de outras empresas
            expect(rowText).not.toContain('other-company');
        }
    });
});
