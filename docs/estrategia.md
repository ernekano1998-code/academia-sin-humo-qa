# Estrategia de pruebas — Academia sin Humo

## Riesgo principal

- **Riesgo:** la sesión del estudiante no es confiable. Se detectó en reconocimiento manual que,
  tras un login exitoso (`POST /api/login` responde 200 y la UI muestra "¡Hola, Ana!"), la llamada
  `GET /api/auth/me` devuelve `{"realUser": null}` y una página protegida como `/mi-progreso`
  (REQ-S01) vuelve a pedir inicio de sesión al navegar. La sesión existe en el estado de cliente
  pero no se puede verificar ni sobrevive a una navegación real.
- **A quién afecta y cómo:** a cualquier estudiante que recargue la página, abra un link en pestaña
  nueva o vuelva más tarde — pierde acceso a su progreso sin haber cerrado sesión. Para el negocio,
  esto rompe la confianza en la plataforma (parece que el estudiante "perdió" su inscripción) y
  bloquea cualquier flujo que dependa de sesión persistente (progreso, certificados, inscripción).
  Es un riesgo de integridad de sesión, no un detalle cosmético.

## Flujos evaluados

| Flujo | Frecuencia | Valor/Riesgo | ¿Automatizo? | Capa (UI/API/integrado) | Por qué |
|---|---|---|---|---|---|
| Login + persistencia de sesión (REQ-S01, S02) | Alta (todo estudiante loguea) | Alto — bug confirmado en reconocimiento | Sí | E2E + integrado | Es el riesgo principal; ya hay evidencia de discrepancia con la spec |
| Registro con validaciones límite (REQ-R02, R04, R05) | Alta (puerta de entrada) | Medio — falla aquí bloquea altas | Sí (casos de prueba documentados) | E2E | Técnica de valores límite, bajo costo de automatizar, alto valor de regresión |
| Inscripción a curso — tabla de decisión (REQ-C02, C06) | Alta (flujo core del producto) | Alto — mezcla UI + API, es la regla estrella del proyecto | Sí | API + integrado | REQ-C06 exige paridad UI/API; es el mejor candidato para el flujo integrado |
| Rate limiting de login (REQ-L03) | Baja (solo ante ataque o error de usuario) | Medio — protege la cuenta, pero no es el camino feliz | Parcial (documentado en casos, no en el mínimo E2E) | E2E | Requiere manejar tiempo real (30s); alto costo de automatizar de forma estable para el alcance mínimo |
| Ciclo de vida del progreso (REQ-P01-P05) | Media | Alto — máquina de estados con transiciones prohibidas | Documentado en casos de prueba; no entra en el mínimo de código | — | Depende de que la sesión persista (bloqueado por el riesgo principal); se documenta pero no se codifica en este alcance |
| Catálogo — listado y cupos (REQ-C01, C04, C05) | Alta | Medio | Parcial — se verifica dentro del flujo integrado (GET /api/courses antes/después) | API | No amerita suite propia; se cubre como parte de la Fase 3 |
| Reserva (/reserva), Estudiantes (/estudiantes), Perfil/CV (/perfil) | Baja (zonas no mencionadas como prioritarias por la consigna) | Bajo para este alcance | No | — | Fuera del alcance mínimo; no hay evidencia de que sean el flujo crítico del negocio |

## Alcance elegido

- **Lo que SÍ entra:**
  - 1 flujo E2E completo: login con credenciales válidas + verificación de que la sesión persiste
    (o falla, si el bug se confirma) al navegar a una página protegida.
  - 4 tests de API sobre `POST /api/enroll` (camino feliz, sin `courseId`, `courseId` inexistente,
    body malformado) + verificación de cupo antes/después.
  - 1 flujo integrado sobre REQ-C06 (paridad de reglas UI/API en inscripción con prerequisito
    pendiente).
  - 1 suite corriendo en CI (GitHub Actions).
  - 1 reporte de bugs con el hallazgo de sesión como mínimo, más lo que surja del flujo integrado.
- **Lo que NO entra, y por qué:** rate limiting de login (REQ-L03) queda solo documentado en casos
  de prueba, no automatizado, porque depende de tiempo real (30s) y de un estado de bloqueo difícil
  de aislar de forma reproducible en 3 corridas seguidas sin `waitForTimeout` disfrazado. Tampoco
  entran /reserva, /estudiantes ni /perfil (CV): no son el flujo core (inscripción a cursos) ni el
  riesgo principal (sesión), y la consigna pide elegir alcance por riesgo, no cubrir todo el
  producto.
- **Lo que NO voy a poder demostrar con estas pruebas:** que la sesión se comporta bien en TODOS los
  escenarios (multi-pestaña, expiración natural, refresco de token) — solo demuestro el caso
  puntual reproducido. Tampoco demuestro accesibilidad (WCAG), performance bajo carga, ni el
  comportamiento de la máquina de estados de progreso (P01-P05) más allá de lo que se pueda observar
  mientras la sesión esté activa en la misma pestaña — porque el propio bug de sesión limita cuánto
  se puede navegar sin perder el contexto autenticado.
