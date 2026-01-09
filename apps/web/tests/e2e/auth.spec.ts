import { test, expect, Page } from '@playwright/test';

// Helper para fazer login
async function login(page: Page, username: string, password: string) {
    await page.goto('/');
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
}

test.describe('Authentication E2E', () => {
    test('should login successfully with valid credentials', async ({ page }) => {
        await page.goto('/');

        // Preencher formulário
        await page.fill('input[name="username"]', 'admin');
        await page.fill('input[name="password"]', 'admin123');

        // Submeter
        await page.click('button[type="submit"]');

        // Verificar redirecionamento
        await expect(page).toHaveURL('/dashboard');

        // Verificar que está logado (procurar por elemento do dashboard)
        await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
        await page.goto('/');

        await page.fill('input[name="username"]', 'admin');
        await page.fill('input[name="password"]', 'wrong_password');
        await page.click('button[type="submit"]');

        // Verificar mensagem de erro
        await expect(page.locator('text=/credenciais.*inválidas/i')).toBeVisible();
    });

    test('should logout successfully', async ({ page }) => {
        // Login primeiro
        await login(page, 'admin', 'admin123');

        // Clicar em logout
        await page.click('button:has-text("Sair")');

        // Verificar redirecionamento para login
        await expect(page).toHaveURL('/');
    });
});
