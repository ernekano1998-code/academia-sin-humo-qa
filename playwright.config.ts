import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  // fullyParallel: false — todos los tests comparten la misma cuenta demo
  // (ana.garcia@ejemplo.com) contra el backend real del playground, sin aislamiento
  // de datos por test. Correr en paralelo genera contaminación entre tests de login,
  // API e integrado (confirmado: workers>1 produce fallos intermitentes en el mismo
  // caso que en serie es 100% estable). Se prioriza reproducibilidad sobre velocidad.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: 'https://playground.calidadsinhumo.com',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
