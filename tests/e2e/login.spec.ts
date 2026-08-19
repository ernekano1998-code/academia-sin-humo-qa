import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

const CUENTA_DEMO = {
  email: 'ana.garcia@ejemplo.com',
  password: 'Segura2026!',
  nombre: 'Ana',
};

test.describe('Login y persistencia de sesión (REQ-L02, REQ-L04, REQ-S01)', () => {
  test('login exitoso muestra bienvenida con el nombre del usuario (REQ-L04)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(CUENTA_DEMO.email, CUENTA_DEMO.password);

    await loginPage.expectLoggedIn(CUENTA_DEMO.nombre);
  });

  test('la sesión debe persistir al navegar a una página protegida (REQ-S01)', async ({ page }) => {
    // BUG-03 (ver docs/reporte-de-bugs.md): tras un login exitoso, /mi-progreso vuelve a
    // pedir inicio de sesión en vez de mostrar el contenido protegido. test.fail() afirma
    // la regla real de REQ-S01 (la sesión debe persistir) — hoy esa aserción falla porque
    // el bug existe, y Playwright reporta el test como verde por el fail esperado. Si el
    // bug se corrige, la aserción empieza a pasar y Playwright reporta "unexpected pass",
    // avisando que hay que actualizar el reporte de bugs y quitar esta marca.
    test.fail();

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(CUENTA_DEMO.email, CUENTA_DEMO.password);
    await loginPage.expectLoggedIn(CUENTA_DEMO.nombre);

    await page.goto('/mi-progreso');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Inicia sesión' })).not.toBeVisible();
  });
});
