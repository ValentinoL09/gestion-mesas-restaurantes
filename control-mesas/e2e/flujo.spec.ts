import { test, expect } from '@playwright/test';

const email = process.env.E2E_EMAIL || '';
const password = process.env.E2E_PASSWORD || '';

test.describe('Flujo real del comensal', () => {
  test.skip(!email || !password, 'Configurar E2E_EMAIL y E2E_PASSWORD para ejecutar la prueba e2e');

  test('login -> crear mesa -> ocupar -> llamar mozo -> atender -> liberar -> bloqueo', async ({ page }) => {
    // 1. Login del dueño
    await page.goto('/login');
    await page.getByLabel('Correo Electrónico').fill(email);
    await page.getByLabel('Contraseña').fill(password);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    await page.waitForURL(/\/dashboard\//);
    const urlDashboard = page.url();

    // 2. Crear una mesa nueva y tomar su URL de QR
    await page.goto(`${urlDashboard}/qrs`);
    await page.getByRole('button', { name: /Agregar Mesa/ }).last().click();
    await page.locator('p[title*="/m/"]').last().waitFor();

    const urlsQR = page.locator('p[title*="/m/"]');
    const qrUrl = await urlsQR.last().getAttribute('title');
    expect(qrUrl).toMatch(/\/m\//);

    const tarjeta = urlsQR.last().locator('..');
    const h2 = await tarjeta.locator('h2').textContent();
    const numero = h2?.match(/\d+/)?.[0];
    expect(numero).toBeTruthy();

    // 3. El comensal escanea el QR y ocupa la mesa
    const paginaComensal = await page.context().newPage();
    await paginaComensal.goto(qrUrl!);
    await paginaComensal.getByRole('heading', { name: `Mesa ${numero}` }).waitFor();

    // 4. Llama al mozo (anti-spam: el botón se deshabilita)
    await paginaComensal.getByRole('button', { name: /Llamar al Mozo/ }).click();
    await paginaComensal.getByText(/mozo está en camino/).waitFor();
    await paginaComensal.getByRole('button', { name: /Mozo avisado/ }).waitFor();

    // 5. El dashboard ve la petición en tiempo real
    await page.goto(urlDashboard);
    await page.getByText(`Mesa ${numero}`).waitFor();
    await page.getByText(/Llama al mozo/i).waitFor();

    // 6. El mozo la atiende
    await page.getByRole('button', { name: 'Marcar Atendido' }).click();
    await page.getByRole('button', { name: 'Liberar' }).waitFor();

    // 7. Se libera la mesa atómicamente
    await page.getByRole('button', { name: 'Liberar' }).click();

    // 8. El comensal queda bloqueado en vivo
    await paginaComensal.getByRole('heading', { name: 'Mesa en Uso' }).waitFor();
  });
});