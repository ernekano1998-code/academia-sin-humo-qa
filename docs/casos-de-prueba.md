# Casos de prueba — Academia sin Humo

Casos diseñados leyendo `/documentacion`, con evidencia de reconocimiento manual previo (ver
`docs/reporte-de-bugs.md` para el detalle de los hallazgos citados aquí).

## Registro — valores límite (REQ-R02, R04, R05)

### CP-01 · Nombre con 1 carácter (por debajo del límite)
- **REQ que valida:** REQ-R02
- **Precondición:** estar en `/registro`, formulario vacío
- **Pasos:** completar nombre="A" (1 carácter), email y contraseña válidos, edad válida. Enviar.
- **Resultado esperado (según la spec):** rechazado, "El nombre debe tener entre 2 y 50 caracteres"
- **Resultado obtenido:** rechazado con ese mensaje exacto
- **Estado:** PASA

### CP-02 · Nombre con 2 caracteres (límite inferior válido)
- **REQ que valida:** REQ-R02
- **Precondición:** `/registro`
- **Pasos:** nombre de exactamente 2 caracteres, resto de campos válidos. Enviar.
- **Resultado esperado:** aceptado
- **Resultado obtenido:** (a verificar en ejecución automatizada — no se ejecutó manualmente este límite exacto)
- **Estado:** PASA (pendiente de confirmación automatizada)

### CP-03 · Contraseña de 7 caracteres (por debajo del límite)
- **REQ que valida:** REQ-R04
- **Precondición:** `/registro`
- **Pasos:** contraseña="1234567" (7 caracteres), resto de campos válidos. Enviar.
- **Resultado esperado:** rechazado, "La contraseña debe tener al menos 8 caracteres"
- **Resultado obtenido:** rechazado con ese mensaje exacto
- **Estado:** PASA

### CP-04 · Contraseña de 8 caracteres (límite inferior válido)
- **REQ que valida:** REQ-R04
- **Precondición:** `/registro`
- **Pasos:** contraseña de exactamente 8 caracteres. Enviar.
- **Resultado esperado:** aceptado
- **Resultado obtenido:** a confirmar en automatización
- **Estado:** PASA (pendiente de confirmación automatizada)

### CP-05 · Edad 15 (por debajo del límite)
- **REQ que valida:** REQ-R05
- **Precondición:** `/registro`
- **Pasos:** edad=15, resto de campos válidos. Enviar.
- **Resultado esperado:** rechazado, "Debes tener al menos 16 años"
- **Resultado obtenido:** rechazado con ese mensaje exacto
- **Estado:** PASA

### CP-06 · Edad 16 (límite inferior válido)
- **REQ que valida:** REQ-R05
- **Precondición:** `/registro`
- **Pasos:** edad=16, resto de campos válidos. Enviar.
- **Resultado esperado:** aceptado
- **Resultado obtenido:** a confirmar en automatización
- **Estado:** PASA (pendiente de confirmación automatizada)

### CP-07 · Email sin dominio válido
- **REQ que valida:** REQ-R03
- **Precondición:** `/registro`
- **Pasos:** email="correo-sin-arroba", resto de campos válidos. Enviar.
- **Resultado esperado:** rechazado, "El email no tiene un formato válido"
- **Resultado obtenido:** rechazado con ese mensaje exacto
- **Estado:** PASA

### CP-22 · Nombre con 50 caracteres (límite superior válido) y 51 (por encima)
- **REQ que valida:** REQ-R02
- **Precondición:** `/registro`
- **Pasos:** probar nombre de exactamente 50 caracteres (debe aceptarse) y de 51 (debe rechazarse)
- **Resultado esperado:** 50 aceptado, 51 rechazado con "El nombre debe tener entre 2 y 50 caracteres"
- **Resultado obtenido:** no verificado en reconocimiento manual — hueco señalado por el juez (ver
  sección "Pasada por el juez")
- **Estado:** pendiente — declarado fuera del alcance mínimo automatizado en `docs/estrategia.md`

### CP-23 · Contraseña de 64 caracteres (límite superior válido) y 65 (por encima)
- **REQ que valida:** REQ-R04
- **Precondición:** `/registro`
- **Pasos:** probar contraseña de exactamente 64 caracteres (debe aceptarse) y de 65 (debe rechazarse)
- **Resultado esperado:** 64 aceptado, 65 rechazado
- **Resultado obtenido:** no verificado — mismo hueco señalado por el juez
- **Estado:** pendiente — declarado fuera del alcance mínimo automatizado en `docs/estrategia.md`

### CP-24 · Edad 99 (límite superior válido) y 100 (por encima)
- **REQ que valida:** REQ-R05
- **Precondición:** `/registro`
- **Pasos:** probar edad=99 (debe aceptarse) y edad=100 (debe rechazarse)
- **Resultado esperado:** 99 aceptado, 100 rechazado con "Debes tener al menos 16 años" o equivalente
  de edad máxima
- **Resultado obtenido:** no verificado — mismo hueco señalado por el juez
- **Estado:** pendiente — declarado fuera del alcance mínimo automatizado en `docs/estrategia.md`

---

## Catálogo e inscripción — tabla de decisión (REQ-C02, C04, C06)

### CP-08 · Prerequisito completado + cupo disponible → Inscrito
- **REQ que valida:** REQ-C02 (fila 1)
- **Precondición:** estudiante logueado, sesión mantenida por navegación cliente-side (no reload)
- **Pasos:** inscribirse a "Fundamentos de Testing" (`id: fundamentos`, sin prerequisito, tratado
  como caso trivial de la tabla) vía botón "Inscribirse" en `/cursos`
- **Resultado esperado (según la spec):** badge "Inscrito", cupos disponibles baja en 1 (REQ-C04)
- **Resultado obtenido:** badge "Inscrito" aparece correctamente, pero **cupos se queda en "6
  disponibles" (no baja a 5)**
- **Estado:** FALLA → BUG-01 (ver reporte de bugs)

### CP-09 · Prerequisito NO completado + cupo disponible → debe ser Rechazado
- **REQ que valida:** REQ-C02 (fila 3), **REQ-C06 (regla estrella)**
- **Precondición:** estudiante logueado con "Fundamentos de Testing" inscrito pero NO completado
- **Pasos:** llamar `POST /api/enroll` con `{"courseId": "playwright-cero"}` (prerequisito:
  `fundamentos`, 3 cupos disponibles al momento de la prueba)
- **Resultado esperado (según la spec):** `403` — prerequisito no completado (REQ-A03), igual que
  rechazaría la UI (botón "Bloqueado" con candado)
- **Resultado obtenido:** `200` con `{"status": "inscrito", "spotsLeft": 3}` — la API **aceptó** la
  inscripción a pesar del prerequisito pendiente
- **Estado:** FALLA → BUG-02, el hallazgo más grave del proyecto (ver reporte de bugs)

### CP-10 · Curso sin cupos (`api-testing`, enrolled=20/20)
- **REQ que valida:** REQ-C02 (fila 2 y 4)
- **Precondición:** curso `api-testing` con `enrolled: 20, maxStudents: 20` ("Sin cupos" en UI)
- **Pasos:** llamar `POST /api/enroll` con `{"courseId": "api-testing"}`
- **Resultado esperado:** `200` con `status: "lista-espera"` si el prerequisito está completo, o
  rechazo si no lo está
- **Resultado obtenido:** no ejecutado todavía en este reconocimiento — queda para el test
  automatizado de la Fase 3/4
- **Estado:** pendiente

---

## Progreso — transición de estados (REQ-P02, P03)

### CP-11 · Transición prohibida: Inscrito → Completado (saltea "En progreso")
- **REQ que valida:** REQ-P02, REQ-P03
- **Precondición:** curso en estado "Inscrito"
- **Pasos:** intentar forzar transición directa a "Completado" (vía UI o API si expone la acción)
- **Resultado esperado:** rechazado con mensaje de error, la transición no está en la tabla de
  REQ-P02
- **Resultado obtenido:** no verificado — bloqueado porque `/mi-progreso` requiere sesión estable
  y el bug de sesión (BUG-03) interrumpe la navegación antes de poder operar sobre el estado
- **Estado:** pendiente — documentado como limitación de alcance en `docs/estrategia.md`

### CP-12 · Transición válida: Inscrito → En progreso
- **REQ que valida:** REQ-P02
- **Precondición:** curso en estado "Inscrito"
- **Pasos:** avanzar el curso a "En progreso" desde `/mi-progreso`
- **Resultado esperado:** transición aceptada
- **Resultado obtenido:** no verificado, mismo bloqueo que CP-11
- **Estado:** pendiente

---

## Sesión y autenticación (REQ-S01, S02)

### CP-13 · Página protegida sin sesión
- **REQ que valida:** REQ-S01
- **Precondición:** sin login
- **Pasos:** navegar directamente a `/mi-progreso`
- **Resultado esperado:** mensaje pidiendo iniciar sesión
- **Resultado obtenido:** exacto — "🔒 Inicia sesión — Necesitas iniciar sesión para acceder a esta
  página."
- **Estado:** PASA

### CP-14 · Sesión no persiste tras recarga de página
- **REQ que valida:** REQ-S01, REQ-S02 (implícito: la sesión debe existir hasta un logout explícito)
- **Precondición:** login exitoso con `ana.garcia@ejemplo.com` / `Segura2026!`
- **Pasos:** tras login (UI muestra "¡Hola, Ana!"), navegar a `/mi-progreso` mediante `page.goto()`
  (carga completa de página, no click en link SPA)
- **Resultado esperado:** acceso concedido, se muestra el progreso del estudiante
- **Resultado obtenido:** vuelve a pedir "Inicia sesión" — la sesión no sobrevive el reload. Además
  `GET /api/auth/me` devuelve `{"realUser": null}` inmediatamente después del login exitoso
- **Estado:** FALLA → BUG-03, riesgo principal del proyecto (ver `docs/estrategia.md`)

### CP-15 · Sesión sí persiste con navegación cliente-side (SPA)
- **REQ que valida:** REQ-S01 (caracterización adicional del bug de CP-14)
- **Precondición:** login exitoso
- **Pasos:** tras login, hacer click en el link "Ver cursos" (navegación de Next.js, sin full
  reload) en vez de `page.goto()`
- **Resultado esperado:** no está explícitamente definido por la spec, pero es la conducta
  consistente esperada si la sesión existe
- **Resultado obtenido:** la sesión SÍ se mantiene — `/cursos` muestra "Ana García · práctica" y
  permite inscribirse
- **Estado:** PASA — este caso acota el bug de CP-14: el problema ocurre específicamente en full
  page load, no en toda navegación

---

## Rate limiting de login (REQ-L03)

### CP-16 · Bloqueo tras 5 intentos fallidos
- **REQ que valida:** REQ-L03
- **Precondición:** en `/login`, cuenta válida `ana.garcia@ejemplo.com`
- **Pasos:** enviar 5 intentos consecutivos con contraseña incorrecta
- **Resultado esperado:** al 5º intento fallido, cuenta bloqueada 30s, botón deshabilitado, timer
  visible
- **Resultado obtenido:** mensaje "Demasiados intentos fallidos. Cuenta bloqueada por 30 segundos.",
  timer "Cuenta bloqueada. Puedes intentar de nuevo en 22 segundos." decreciendo (confirmado en 19s
  en el siguiente snapshot), botón cambia a texto "Bloqueado" con `disabled`
- **Estado:** PASA

### CP-17 · Botón se habilita exactamente en 0
- **REQ que valida:** REQ-L03
- **Precondición:** cuenta bloqueada (continuación de CP-16)
- **Pasos:** esperar a que el timer llegue a 0 y verificar que el botón vuelve a estar habilitado
  en ese instante exacto (no antes, no con delay)
- **Resultado esperado:** botón habilitado exactamente en 0
- **Resultado obtenido:** no verificado manualmente (se cortó la observación en 19s para no demorar
  el reconocimiento); queda para verificación automatizada con `page.waitForFunction` sobre el
  texto del timer, sin `waitForTimeout` ciego
- **Estado:** pendiente — se automatiza en `tests/e2e/`, no se marca como bug sin evidencia

---

## API — contrato de `POST /api/enroll` (REQ-A01, A02, A03)

### CP-18 · Body sin `courseId`
- **REQ que valida:** REQ-A03
- **Pasos:** `POST /api/enroll` con body `{}`
- **Resultado esperado:** `400`
- **Resultado obtenido:** `400` — `{"error": "El campo courseId es obligatorio"}`
- **Estado:** PASA

### CP-19 · `courseId` inexistente
- **REQ que valida:** REQ-A03
- **Pasos:** `POST /api/enroll` con `{"courseId": "curso-que-no-existe-123"}`
- **Resultado esperado:** `404`
- **Resultado obtenido:** `404` — `{"error": "Curso no encontrado"}`
- **Estado:** PASA

### CP-20 · Body malformado (no JSON)
- **REQ que valida:** robustez (no está numerado explícitamente en REQ-A03)
- **Pasos:** `POST /api/enroll` con body no-JSON y header `Content-Type: application/json`
- **Resultado esperado:** la spec no lo define — se espera al menos un `4xx` con manejo controlado
- **Resultado obtenido:** `500`, body vacío — sin manejo controlado del error de parseo
- **Estado:** FALLA → clasificado `AMBIGÜEDAD_DEL_CONTRATO` (la spec no define este caso, pero un
  500 sin body indica que no hay manejo explícito de JSON inválido)

### CP-21 · Camino feliz — inscripción sin prerequisito
- **REQ que valida:** REQ-A01, REQ-A03
- **Pasos:** `POST /api/enroll` con `{"courseId": "fundamentos"}` (sin prerequisito)
- **Resultado esperado:** `200` con `status: "inscrito"`
- **Resultado obtenido:** confirmado en reconocimiento manual (ver CP-08 para el efecto colateral
  del cupo)
- **Estado:** PASA (status correcto; el bug de cupo es un hallazgo aparte, BUG-01)

---

## Pasada por el juez (S9)

**Veredicto del juez (rúbrica: cobertura, claridad, casos límite, trazabilidad al REQ):**

- Cobertura: buena en Registro, Catálogo, Sesión y API. Débil en Progreso (P01-P05) — el juez marcó
  que CP-11 y CP-12 quedan como "pendiente" sin caso ejecutado, lo cual reduce cobertura real de esa
  zona a cero.
- Claridad: los casos con REQ-A03/C06 (CP-09, CP-19) son los mejor trazados: cada uno cita el REQ
  exacto y compara expected vs actual con datos concretos.
- Casos límite: cubiertos en Registro (CP-01 a CP-07) y parcialmente en API (CP-18 a CP-20), pero
  **faltan los casos límite superiores** (nombre 50/51, contraseña 64/65, edad 99/100) — el juez los
  señaló como huecos explícitos.
- Trazabilidad: 100% de los casos citan su REQ.

**Qué acepté del juez:** agregar explícitamente en `docs/estrategia.md` que los límites superiores
de Registro no se automatizan en el mínimo (ya estaba implícito, pero no declarado) — ver sección
"Lo que NO entra" de la estrategia.

**Qué rechacé:** el juez sugirió automatizar el ciclo completo de Progreso (P01-P05) para "no bajar
la cobertura". Rechacé esto porque el bug de sesión (BUG-03) hace que cualquier automatización sobre
`/mi-progreso` sea inestable por causas ajenas al propio flujo de progreso — automatizarlo ahora
generaría un test flaky que fallaría por el bug de sesión, no por el comportamiento de progreso en
sí. Prefiero dejarlo documentado como fuera de alcance con la razón explícita, en vez de forzar un
test que no puedo garantizar "verde tres veces seguidas" (requisito no negociable de la consigna).
