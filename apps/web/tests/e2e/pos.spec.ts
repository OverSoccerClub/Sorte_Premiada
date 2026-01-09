import { test, expect, Page } from '@playwright/test';

async function login(page: Page, username: string, password: string) {
    await page.goto('/');
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
}

test.describe('POS Management E2E', () => {
    test.beforeEach(async ({ page }) => {
        // Login antes de cada teste
        await login(page, 'admin', 'admin123');
    });

    test('should navigate to POS page', async ({ page }) => {
        // Clicar no menu "Dispositivos POS"
        await page.click('text=Dispositivos POS');

        // Verificar URL
        await expect(page).toHaveURL('/dashboard/pos');

        // Verificar título
        await expect(page.locator('h2:has-text("Gestão de Dispositivos POS")')).toBeVisible();
    });

    test('should show monitoring tab by default', async ({ page }) => {
        await page.goto('/dashboard/pos');

        // Verificar que aba Monitoramento está ativa
        await expect(page.locator('[role="tab"]:has-text("Monitoramento")[aria-selected="true"]')).toBeVisible();
    });

    test('should switch to activation tab', async ({ page }) => {
        await page.goto('/dashboard/pos');

        // Clicar na aba Ativação
        await page.click('[role="tab"]:has-text("Ativação")');

        // Verificar que formulário de ativação está visível
        await expect(page.locator('text=Ativar Novo Dispositivo')).toBeVisible();
        await expect(page.locator('input[id="deviceName"]')).toBeVisible();
    });

    test('should generate activation code', async ({ page }) => {
        await page.goto('/dashboard/pos');

        // Ir para aba Ativação
        await page.click('[role="tab"]:has-text("Ativação")');

        // Verificar que nome sugerido está preenchido
        const deviceNameInput = page.locator('input[id="deviceName"]');
        const suggestedName = await deviceNameInput.inputValue();
        expect(suggestedName).toMatch(/Terminal POS \d{3}/);

        // Preencher descrição (opcional)
        await page.fill('input[id="deviceDescription"]', 'Teste E2E');

        // Clicar em gerar código
        await page.click('button:has-text("Gerar Código de Ativação")');

        // Verificar que modal apareceu
        await expect(page.locator('text=Código Gerado com Sucesso')).toBeVisible();

        // Verificar que código foi gerado (formato: AP-YYYY-XXXXXX)
        const codeElement = page.locator('code').first();
        const code = await codeElement.textContent();
        expect(code).toMatch(/AP-\d{4}-[A-Z0-9]{6}/);
    });

    test('should copy activation code', async ({ page }) => {
        await page.goto('/dashboard/pos');
        await page.click('[role="tab"]:has-text("Ativação")');

        // Gerar código
        await page.click('button:has-text("Gerar Código de Ativação")');
        await expect(page.locator('text=Código Gerado com Sucesso')).toBeVisible();

        // Clicar em copiar
        await page.click('button:has(svg)'); // Botão com ícone de copiar

        // Verificar feedback visual (ícone muda para check)
        await expect(page.locator('svg.lucide-check')).toBeVisible();
    });

    test('should show device in list after generation', async ({ page }) => {
        await page.goto('/dashboard/pos');
        await page.click('[role="tab"]:has-text("Ativação")');

        // Gerar código
        const deviceName = `Test Device ${Date.now()}`;
        await page.fill('input[id="deviceName"]', deviceName);
        await page.click('button:has-text("Gerar Código de Ativação")');

        // Fechar modal
        await page.keyboard.press('Escape');

        // Verificar que dispositivo aparece na tabela
        await expect(page.locator(`text=${deviceName}`)).toBeVisible();

        // Verificar status "Pendente"
        await expect(page.locator('text=Pendente')).toBeVisible();
    });
});
