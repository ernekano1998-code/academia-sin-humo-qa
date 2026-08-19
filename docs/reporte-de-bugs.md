# Reporte de bugs — Academia sin Humo

Hallazgos encontrados comparando el comportamiento real del producto contra `/documentacion`
durante el reconocimiento manual (Fase 0) y el diseño de casos de prueba (Fase 1).

---

### BUG-01 · El cupo disponible no decrementa al inscribirse

- **REQ violado:** REQ-C04 — "Al inscribirse exitosamente, el número de cupos disponibles debe
  reducirse en 1."
- **Comportamiento esperado:** tras inscribirse a "Fundamentos de Testing" (cupos: 6 disponibles,
  `enrolled: 24` de `maxStudents: 30`), el contador debía pasar a 5 disponibles (`enrolled: 25`).
- **Comportamiento real:** la inscripción se confirma ("Inscripción exitosa a 'Fundamentos de
  Testing'", badge "Inscrito"), pero tanto la UI como `GET /api/courses` siguen mostrando
  `enrolled: 24` / "6 disponibles" después de la inscripción.
- **Pasos para reproducir:**
  1. Login con `ana.garcia@ejemplo.com` / `Segura2026!`.
  2. Ir a `/cursos` (vía link "Ver cursos", no reload).
  3. Anotar cupos de "Fundamentos de Testing" (6 disponibles / `enrolled: 24`).
  4. Click en "Inscribirse".
  5. Comparar el contador antes/después, o llamar `GET /api/courses` antes/después.
- **Evidencia:**
  ```json
  // GET /api/courses — ANTES y DESPUÉS de inscribirse (idéntico)
  { "id": "fundamentos", "maxStudents": 30, "enrolled": 24 }
  ```
  UI: badge "Inscrito" visible, pero "Cupos: 6 disponibles" sin cambios.
- **Severidad y por qué:** Media-Alta. No bloquea al estudiante individual, pero rompe la
  consistencia del catálogo: con inscripciones repetidas el cupo real (`maxStudents`) se agotaría
  sin que el contador lo refleje nunca, permitiendo sobre-inscripción indefinida.
- **Capa donde se detecta:** UI + API (ambas muestran el mismo dato inconsistente, indica que el
  problema está en el backend, no en el render).

---

### BUG-02 · La API de inscripción no valida el prerequisito (viola la regla estrella REQ-C06)

- **REQ violado:** REQ-C06 — *"La API de inscripción debe aplicar las mismas reglas de validación
  que la UI. Un curso con prerequisito pendiente debe ser rechazado tanto en la UI como en la API."*
  También viola REQ-C02 (fila 3: prerequisito no completado + cupo disponible → "Rechazado") y
  REQ-A03 (403 esperado cuando el prerequisito no está completado).
- **Comportamiento esperado:** `POST /api/enroll` con `{"courseId": "playwright-cero"}`, estando el
  prerequisito `fundamentos` solo "Inscrito" (no completado), debía devolver `403`.
- **Comportamiento real:** devuelve `200` y confirma la inscripción (`"status": "inscrito",
  "spotsLeft": 3`), exactamente lo que la UI rechaza mostrando el botón "Bloqueado" con el mensaje
  "🔒 Completa primero 'Fundamentos de Testing' para desbloquear este curso".
- **Pasos para reproducir:**
  1. Login con `ana.garcia@ejemplo.com` / `Segura2026!`.
  2. Inscribirse (por UI o API) a `fundamentos`, sin completarlo.
  3. Llamar `POST /api/enroll` con body `{"courseId": "playwright-cero"}` y las cookies de sesión.
  4. Observar que responde `200`, no `403`.
- **Evidencia:**
  ```json
  // Request
  POST /api/enroll
  { "courseId": "playwright-cero" }

  // Response — 200 (se esperaba 403)
  {
    "courseId": "playwright-cero",
    "status": "inscrito",
    "displayStatus": "inscrito",
    "progress": 0,
    "certificates": 0,
    "spotsLeft": 3,
    "message": "Inscripción exitosa a \"Playwright desde cero\""
  }
  ```
  Contraste con la UI, que en el mismo estado del estudiante muestra el botón deshabilitado
  "Bloqueado" con candado para ese mismo curso.
- **Severidad y por qué:** **Crítica.** Es el hallazgo estrella que la propia consigna del proyecto
  señala como el ejercicio de mayor valor. Cualquier cliente de la API (no solo la UI oficial) puede
  saltarse por completo la cadena de prerequisitos del catálogo, invalidando la progresión
  pedagógica que el negocio quiere garantizar.
- **Capa donde se detecta:** integrado (UI rechaza, API acepta el mismo caso) — ver
  `tests/integrado/` para el test que reproduce esta discrepancia de forma automatizada.

---

### BUG-03 · La sesión no sobrevive una recarga de página

- **REQ violado:** REQ-S01 — las páginas protegidas deben reconocer a un usuario ya autenticado.
  (También compromete la premisa implícita de REQ-S02: si la sesión no persiste ni con reload, es
  indistinguible de un cierre de sesión no solicitado.)
- **Comportamiento esperado:** tras un login exitoso, `/mi-progreso` y `/cursos` deben reconocer al
  usuario autenticado incluso si la página se recarga por completo (navegación directa, refresh,
  compartir un link).
- **Comportamiento real:**
  - `POST /api/login` responde 200 y la UI (estado de cliente) muestra "¡Hola, Ana!" y navegación
    autenticada.
  - Inmediatamente después, `GET /api/auth/me` devuelve `{"realUser": null}`.
  - Al navegar a `/mi-progreso` con una carga completa de página (`page.goto`, equivalente a
    recarga o link externo), la app vuelve a pedir "Inicia sesión" como si no hubiera sesión.
  - **Caracterización adicional:** si la navegación es client-side (click en un `<Link>` de la SPA,
    sin full reload), la sesión SÍ se mantiene y `/cursos` reconoce al usuario. El problema está
    acotado a la hidratación/verificación de sesión en carga completa de página, no a la existencia
    de la sesión en sí.
- **Pasos para reproducir:**
  1. Login con `ana.garcia@ejemplo.com` / `Segura2026!` en `/login`.
  2. Confirmar visualmente "¡Hola, Ana!".
  3. En la misma pestaña, ejecutar `fetch('/api/auth/me', {credentials:'include'})` → devuelve
     `{"realUser": null}`.
  4. Navegar a `/mi-progreso` con `page.goto()` (o F5) → pide login de nuevo.
  5. Repetir el login y esta vez navegar hacia `/cursos` con click en el link "Ver cursos" (sin
     reload) → la sesión persiste correctamente.
- **Evidencia:**
  ```json
  // Inmediatamente después de login exitoso
  GET /api/auth/me → 200 { "realUser": null }
  ```
  Snapshot de `/mi-progreso` tras `page.goto()` post-login: "🔒 Inicia sesión — Necesitas iniciar
  sesión para acceder a esta página."
- **Severidad y por qué:** Alta. Es el riesgo principal declarado en `docs/estrategia.md`: cualquier
  recarga, link compartido o vuelta a la app en otro momento hace que el estudiante "pierda" su
  sesión y su progreso visible, aunque el registro subyacente pueda seguir existiendo.
- **Capa donde se detecta:** API (`/api/auth/me`) + UI (páginas protegidas tras reload).

---

## Resumen

| Bug | Severidad | REQ | Capa |
|---|---|---|---|
| BUG-01 — cupo no decrementa | Media-Alta | REQ-C04 | UI + API |
| BUG-02 — API no valida prerequisito | **Crítica** | REQ-C06, C02, A03 | Integrado |
| BUG-03 — sesión no persiste en reload | Alta | REQ-S01, S02 | API + UI |

Los tres hallazgos están respaldados por evidencia de request/response real, no por sospecha o
lectura de código. BUG-02 es el que mejor demuestra el patrón de integración UI+API pedido en la
Fase 4 y está automatizado en `tests/integrado/`.
