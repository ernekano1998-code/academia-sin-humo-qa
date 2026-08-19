# QA Automation — Academia sin Humo

Suite de pruebas automatizadas sobre [Academia sin Humo](https://playground.calidadsinhumo.com),
construida con Playwright y TypeScript como proyecto final de la Ruta QA Automation con IA.

## Qué prueba y por qué

El riesgo principal identificado es la **integridad de la sesión y de la regla de prerequisitos de
inscripción**: un estudiante puede perder su sesión al recargar la página, y la API de inscripción
permite saltarse el orden pedagógico de los cursos. El alcance mínimo cubre: login con verificación
de persistencia de sesión (E2E), el contrato de `POST /api/enroll` (API), y el flujo integrado que
verifica la regla estrella REQ-C06 (paridad de validación entre UI y API). Ver el detalle completo
en [`docs/estrategia.md`](docs/estrategia.md).

## Qué NO prueba

Quedan fuera del alcance: el rate limiting de login (REQ-L03, comportamiento temporal de bajo costo
de automatizar de forma estable), la máquina de estados de progreso (REQ-P01-P05, bloqueada por el
bug de sesión), y las zonas de menor riesgo de negocio (`/reserva`, `/estudiantes`, `/perfil`). El
detalle completo de qué no se demuestra está en la última sección de `docs/estrategia.md`.

## Arquitectura

- **Page Object Model** (`pages/`) — `LoginPage`, `CursosPage`, `RegistroPage`.
- **Tests de UI, de API y un flujo integrado** (`tests/e2e/`, `tests/api/`, `tests/integrado/`).
- **CI en GitHub Actions** (`.github/workflows/playwright.yml`), corre en cada push/PR a `main` y
  publica el artifact `playwright-report`.

Los tests que documentan un bug confirmado usan `test.fail()` de Playwright: la aserción refleja la
regla real de la especificación (lo que debería pasar), y como el bug hace que esa aserción falle
hoy, Playwright reporta el test como verde por el fallo esperado. Si el producto se corrige, la
aserción empieza a pasar y Playwright avisa con "unexpected pass" — la señal de que hay que
actualizar `docs/reporte-de-bugs.md` y quitar la marca.

## Hallazgos

Tres bugs confirmados con evidencia de request/response real contra `/documentacion`. Detalle
completo en [`docs/reporte-de-bugs.md`](docs/reporte-de-bugs.md):

- **BUG-02 (crítico)** — la API de inscripción no valida el prerequisito: viola REQ-C06, la regla
  estrella del proyecto. `POST /api/enroll` acepta un curso con prerequisito pendiente en vez de
  rechazarlo con `403`.
- **BUG-03 (alto)** — la sesión no persiste tras una recarga completa de página: viola REQ-S01.
  `GET /api/auth/me` devuelve `realUser: null` inmediatamente después de un login exitoso.
- **BUG-01 (medio-alto)** — el cupo disponible no decrementa al inscribirse: viola REQ-C04.

## Cómo correrlo

```bash
npm install
npx playwright install chromium
npm test              # toda la suite
npm run test:e2e      # solo E2E
npm run test:api      # solo API
npm run test:integrado # solo el flujo integrado
npm run report         # ver el último reporte HTML
```

La suite corre con `workers: 1` porque todos los tests comparten la misma cuenta demo
(`ana.garcia@ejemplo.com`) contra el backend real del playground, sin aislamiento de datos por
test — correr en paralelo genera contaminación entre casos.

## Herramientas de IA que construí durante la ruta

- **`@pom-agent`** — genera Page Objects a partir de la exploración de una página.
- **`@api-project-agent`** — inicia o continúa proyectos de test de API.
- **Juez con rúbrica** — evalúa casos de prueba contra criterios de cobertura, claridad, casos
  límite y trazabilidad al REQ. El veredicto sobre `docs/casos-de-prueba.md` (qué se aceptó y qué se
  rechazó de su evaluación) está documentado al final de ese archivo.
