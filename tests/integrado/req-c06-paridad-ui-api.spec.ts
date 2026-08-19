import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { CursosPage } from '../../pages/CursosPage';

const CUENTA_DEMO = { email: 'ana.garcia@ejemplo.com', password: 'Segura2026!' };

/**
 * REQ-C06 (regla estrella): "La API de inscripción debe aplicar las mismas reglas de
 * validación que la UI. Un curso con prerequisito pendiente debe ser rechazado tanto
 * en la UI como en la API."
 *
 * Patrón S16 — API prepara, UI verifica, API confirma la discrepancia:
 *   1. API prepara: inscribe al estudiante en "fundamentos" (prerequisito de "playwright-cero")
 *      SIN completarlo. El dato dinámico compartido es el estado de inscripción de
 *      "fundamentos", creado por la API y consumido por la UI en el paso 2.
 *   2. UI verifica: el catálogo debe mostrar "Playwright desde cero" bloqueado.
 *   3. API confirma: un POST /api/enroll directo al mismo curso debe ser rechazado (403)
 *      igual que lo rechaza la UI.
 *
 * Qué demuestra la API: el estado de datos (inscripción, prerequisito pendiente).
 * Qué demuestra la UI: la regla de negocio se aplica visualmente (botón bloqueado).
 * Qué NO demuestra el conjunto: no cubre el caso de prerequisito completado (ver
 * docs/estrategia.md, queda fuera del alcance mínimo por depender de BUG-03).
 */
test('REQ-C06 — un curso con prerequisito pendiente debe rechazarse igual en UI y en API', async ({
  page,
  request,
}) => {
  // BUG-02 (ver docs/reporte-de-bugs.md): la API acepta la inscripción con prerequisito
  // pendiente en vez de rechazarla. test.fail() deja el test corriendo de verdad — si el
  // bug se corrige, Playwright reporta "unexpected pass" y avisa que hay que actualizar
  // el reporte de bugs.
  test.fail();

  // 1. API prepara: login + inscripción al prerequisito, sin completarlo.
  const loginRes = await request.post('/api/login', { data: CUENTA_DEMO });
  expect(loginRes.status()).toBe(200);
  await request.post('/api/enroll', { data: { courseId: 'fundamentos' } });

  // 2. UI verifica: mismo usuario, mismo estado — el curso dependiente debe verse bloqueado.
  const login = new LoginPage(page);
  await login.goto();
  await login.login(CUENTA_DEMO.email, CUENTA_DEMO.password);
  const cursos = new CursosPage(page);
  await cursos.irDesdeBienvenida();

  const botonPlaywrightCero = cursos.botonInscribirse('Playwright desde cero');
  await expect(botonPlaywrightCero).toHaveCount(0);
  await expect(page.getByTestId('locked-playwright-cero')).toContainText(
    'Completa primero "Fundamentos de Testing"',
  );

  // 3. API confirma: la misma regla debe aplicarse al llamar la API directamente.
  const enrollRes = await request.post('/api/enroll', { data: { courseId: 'playwright-cero' } });
  expect(enrollRes.status()).toBe(403);
});
