import { test, expect } from '@playwright/test';

const CUENTA_DEMO = { email: 'ana.garcia@ejemplo.com', password: 'Segura2026!' };

/**
 * Precondición de todos los tests: iniciar sesión vía API para obtener la cookie de sesión
 * que exige POST /api/enroll. No se usa la cuenta de UI para no interferir con Fase 2.
 */
test.describe('API — contrato de POST /api/enroll (REQ-A01, A02, A03)', () => {
  test.beforeEach(async ({ request }) => {
    const res = await request.post('/api/login', { data: CUENTA_DEMO });
    expect(res.status()).toBe(200);
  });

  test('camino feliz — inscripción a un curso sin prerequisito responde 200 "inscrito"', async ({ request }) => {
    const res = await request.post('/api/enroll', { data: { courseId: 'fundamentos' } });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('inscrito');
    expect(typeof body.spotsLeft).toBe('number');
  });

  test('contrato — body sin courseId responde 400', async ({ request }) => {
    const res = await request.post('/api/enroll', { data: {} });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(typeof body.error).toBe('string');
  });

  test('contrato — courseId que no existe responde 404', async ({ request }) => {
    const res = await request.post('/api/enroll', {
      data: { courseId: 'curso-que-no-existe-123' },
    });

    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(typeof body.error).toBe('string');
  });

  test('robustez — body malformado no debe romper el servidor (DEFECTO conocido: responde 500)', async ({ request }) => {
    const res = await request.post('/api/enroll', {
      headers: { 'Content-Type': 'application/json' },
      data: 'esto-no-es-json',
    });

    // La spec (REQ-A03) no define este caso explícitamente. Clasificación:
    // AMBIGÜEDAD_DEL_CONTRATO — se documenta el mínimo aceptable (ningún 5xx) y se
    // deja registrado en docs/reporte-de-bugs.md que hoy responde 500.
    expect(res.status()).toBeLessThan(500);
  });

  test('REQ-C04 — el cupo de un curso baja en 1 tras una inscripción exitosa', async ({ request }) => {
    // BUG-01 (ver docs/reporte-de-bugs.md): el backend no incrementa `enrolled` al
    // inscribir. test.fail() deja el test corriendo de verdad — si el bug se corrige,
    // Playwright reporta "unexpected pass" y avisa que hay que actualizar el reporte.
    test.fail();

    const antes = await request.get('/api/courses');
    const cursosAntes = (await antes.json()).courses;
    const fundamentosAntes = cursosAntes.find((c: { id: string }) => c.id === 'fundamentos');

    await request.post('/api/enroll', { data: { courseId: 'fundamentos' } });

    const despues = await request.get('/api/courses');
    const cursosDespues = (await despues.json()).courses;
    const fundamentosDespues = cursosDespues.find((c: { id: string }) => c.id === 'fundamentos');

    expect(fundamentosDespues.enrolled).toBe(fundamentosAntes.enrolled + 1);
  });
});
