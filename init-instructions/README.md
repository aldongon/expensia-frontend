# Handoff: Expensia — app de gestión de gastos personales

## Overview

Expensia es una API REST de finanzas personales (gastos manuales, gastos recurrentes, presupuesto
mensual y catálogos de monedas / tags / métodos de pago, todo multi-tenant por usuario vía JWT).
Este paquete contiene el **diseño completo del frontend** de esa app: cinco pantallas más diálogos,
en modo claro y oscuro, y el contrato de API que debe consumir.

El objetivo del trabajo es implementar estas pantallas en React siguiendo **el scaffolding que ya
usa el equipo**.

## ⚠ Primero: leer el scaffolding de referencia

El proyecto **cavix** en `/Users/aldo/code/cavix-frontend` es el patrón a seguir. Antes de escribir
una línea de código:

1. Explorar ese repo y extraer las convenciones: estructura de carpetas, `package.json` (versiones,
   scripts, librerías: router, data layer, forms, testing, linting), configuración de build, alias
   de imports, cómo se organizan features/pages/components, cómo se hace el cliente HTTP y el
   manejo de auth/token/401, cómo se manejan estilos (CSS modules / Tailwind / styled), y cómo se
   nombran los archivos.
2. Replicar esa misma estructura para Expensia. Las decisiones de stack **las dicta cavix**, no este
   documento: si cavix usa TypeScript, TanStack Query y react-router, Expensia usa lo mismo, con
   las mismas versiones y los mismos patrones de carpeta.
3. Si algo que Expensia necesita no existe en cavix (por ejemplo un componente de gráfico), seguir
   el estilo del repo para agregarlo, sin introducir librerías nuevas si se puede evitar.

No copiar el HTML de este bundle a producción. Es una **referencia de diseño**: hay que recrear
estas pantallas con los componentes y patrones del scaffolding.

## About the Design Files

`design/Expensia App.dc.html` es un prototipo HTML que corre en el navegador con datos mock. Es la
fuente de verdad **visual y de comportamiento**: layout, jerarquía, copy, estados, gráficos,
interacciones y los dos temas. Su código interno (un componente con plantilla + clase de lógica) no
es el target: se lee para entender la UI, no para portarlo.

`design/nocturne-styles.css` es el sistema de diseño (Nocturne) del que salen tokens y clases base
(`.btn`, `.input`, `.card`, `.tag`, `.table`, `.dialog`, `.seg`, `.field`). El prototipo lo carga y
lo re-tematiza a la paleta verde/crema en un bloque propio (ver "Design tokens").

## Fidelity

**High fidelity.** Colores, tipografía, escala de espaciado, radios, sombras, copy y estados están
definidos. Recrear pixel-perfect usando los componentes del scaffolding; donde cavix ya tenga un
equivalente (botón, input, modal, tabla), usar el de cavix y aplicarle estos tokens.

## Stack y decisiones abiertas

Todo lo que no esté fijado acá se resuelve mirando cavix:

| Decisión | Fuente |
|---|---|
| TS o JS, build, scripts | cavix |
| Router y forma de las rutas | cavix (una ruta por pantalla: `/`, `/gastos`, `/recurrentes`, `/presupuesto`, `/catalogos`) |
| Data layer y cache | cavix |
| Estilos | tokens de este doc, mecanismo de cavix |
| Manejo de auth y 401 | cavix; comportamiento requerido descrito abajo |
| Base URL | env var; en desarrollo `http://localhost:8080` |

## Contrato de API

`api/project-description-and-endpoints.md` es el contrato completo y manda sobre cualquier
suposición del diseño. Puntos que el frontend **debe** respetar:

- `POST /api/auth/register` y `POST /api/auth/login` son los únicos endpoints públicos. El login
  devuelve `{ token, expiresAt }`; el token dura 24 h y no hay refresh.
- Todo el resto va con `Authorization: Bearer <token>`. Nunca se manda `userId`.
- Cualquier `401` es sesión expirada → limpiar token y redirigir a login.
- Los errores son RFC 9457 `application/problem+json`: mostrar `detail` al usuario. Statuses
  posibles: 400, 401, 404, 409, 422.
- Los montos son **strings decimales exactos** en las respuestas. No parsear a `number` para
  guardar ni para mostrar: formatear desde el string y usar decimal seguro para las sumas del
  frontend (el prototipo usa `Number` sólo porque es un mock).
- Cada moneda tiene `scale` (0–18 decimales): validar el input contra la escala de la moneda
  elegida antes de enviar.
- `PUT /api/expenses/{id}` es **reemplazo total**: el formulario de edición precarga todos los
  valores actuales y los reenvía todos.
- `expenseDate` omitido cae a "hoy" en la timezone del usuario, también en el PUT.
- `settlementAmount` y `settlementCurrencyCode` viajan juntos o ninguno, y la moneda de liquidación
  debe ser distinta de la de facturación.
- Un gasto con `recurringExpenseId !== null` no se edita ni se borra por `/api/expenses`: la UI
  muestra un chip "auto" y un enlace al recurrente.
- `GET /api/budgets/current` puede devolver **200 con body vacío** = "sin presupuesto configurado".
  No es un error: mostrar el estado vacío con la acción de crear.
- El presupuesto es inmutable (sólo `POST`), único por (usuario, mes), y sólo para el mes actual o
  el próximo.
- Borrar moneda o método de pago en uso devuelve `409`: deshabilitar la acción y explicar por qué.
  Borrar un tag en uso nunca falla (se desasocia de los gastos).

## Screens / Views

Layout general: barra lateral fija de **212px** a la izquierda (fondo `--color-rail`, gradiente
vertical) y `<main>` con `padding: 22.4px 22.4px 44.8px` y `gap: 22.4px` entre secciones. Ancho del
main fluido. Tipografía Inter en todo.

### Barra lateral

- Marca: punto de 8px `border-radius:50%` en `--color-accent` con `box-shadow: 0 0 12px
  var(--color-accent)`, y "Expensia" en `--font-heading` 18px/500, `letter-spacing:-0.015em`.
- Cinco ítems de navegación (Resumen, Gastos, Recurrentes, Presupuesto, Catálogos), cada uno
  `display:flex; gap:10px; padding:7px 8.4px; border-radius:8px; font-size:14px`, ícono Phosphor de
  17px a la izquierda (`chart-donut`, `receipt`, `arrows-clockwise`, `target`, `tag`). Activo:
  `color: var(--color-accent)`. Hover: fondo `color-mix(in srgb, var(--color-text) 6%, transparent)`.
- Al pie, empujado con `margin-top:auto`: **toggle de tema** (switch de 34×18px, radio 9px, perilla
  de 14px en `--color-accent` que se desplaza 16px, `transition: transform .18s`), etiqueta "Modo
  claro"/"Modo oscuro" con ícono `ph-sun`/`ph-moon` de 15px.
- Debajo, tarjeta de usuario con `box-shadow: var(--shadow-sm)`: email (13px), timezone y "Sesión
  válida 24 h" (11px, `color-mix(text 50%)`).

### 1. Resumen (`/`)

Propósito: estado del mes en un pantallazo.

- **Header**: `<h2>` con el mes ("Septiembre 2026").
- **Banda de presupuesto**: grid `minmax(0,1fr) minmax(0,1.15fr)`, `border-radius:14px`,
  `overflow:hidden`, `box-shadow: var(--shadow-md)`.
  - Panel izquierdo: fondo `--color-band`, texto `--color-band-ink`, `padding:22.4px`. Kicker
    "DISPONIBLE ESTE MES" (10px, `letter-spacing:.1em`, uppercase, `--color-band-dim`); monto
    disponible en `--font-heading` **44px**, `line-height:1.05`, `tabular-nums`; si es negativo,
    color `--color-warn-on-band`. Barra de consumo de 5px (`--color-band-deep` de fondo, relleno
    `--color-band-dim` al `%` gastado). Pie de la barra: "Gastado X" / "de Y" (11px). Separador
    `inset 0 1px 0 var(--color-band-line)` y tres métricas (11px label + 20px valor): Por día, Días
    restantes, Ritmo ("alto" / "en línea").
  - Panel derecho: fondo `--color-surface`. `<h6>` "Acumulado del mes" en `--color-accent-ink` +
    leyenda a la derecha (real / ideal / proyección). **Gráfico SVG** `viewBox="0 0 600 168"`,
    `width:100%`: área bajo la curva en `--color-chart-area`; línea real 2.5px en `--color-accent`;
    línea ideal (0 → presupuesto al día 30) 2px `dasharray 5 5` en `--color-neutral-400`;
    proyección al cierre a ritmo actual 2px `dasharray 2 4` en `--color-accent-400`; línea vertical
    de "hoy" 1px; punto de 4px en el último valor. Debajo, etiquetas 1 / 10 / 20 / 30 sep (10px).
    Escala Y = `max(presupuesto, gastado) * 1.06`; la proyección se clampea al techo.
- **"Dónde se fue el mes"**: grid `repeat(auto-fit, minmax(240px,1fr))`, gap `11.2px 22.4px`. Por
  tag: nombre + monto (13px), barra de 6px `border-radius:3px` sobre `--color-neutral-300`, ancho
  proporcional al tag más alto, color por posición usando la rampa `--color-accent-700 → -300`. Los
  gastos sin tag caen en "sin tag"; un gasto con N tags reparte su monto entre los N.
- **Últimos gastos** (grid `1.6fr / 1fr` con la columna derecha): tabla `.table` con Fecha /
  Descripción / Monto, 5 filas, chip "auto" cuando corresponde, y botón fantasma "Ver el mes
  completo". Columna derecha: "Totales por moneda" (filas con `inset 0 -1px 0
  var(--color-neutral-300)`) y "Recurrentes activos" (nombre + monto/mes).
- **Estado sin presupuesto**: tarjeta con kicker "SIN PRESUPUESTO", explicación de que
  `GET /api/budgets/current` devolvió 200 sin cuerpo, y botón "Crear presupuesto".

### 2. Gastos (`/gastos`)

Header con `<h2>` "Gastos" y botón primario "Nuevo gasto" (ícono `ph-plus`). Debajo, control
segmentado (`.seg` / `.seg-opt`, radios nativos) con dos vistas:

**a) Por día** (default)

Lista agrupada por fecha, `gap:16.8px` entre días. Cada día:
- Cabecera con `inset 0 -1px 0 var(--color-neutral-300)`: número del día en `--font-heading` 25px
  (`--color-accent` si es hoy, si no `color-mix(text 55%)`), día de la semana en 12px ("hoy ·
  sábado" para hoy), "mes · N gastos" en 11px, y **total del día** a la derecha en `--font-heading`
  16px. Si el día mezcla monedas, muestra un total por moneda separado por " · ".
- Filas de gasto: `padding:8.4px 8.4px 8.4px 11.2px`, `border-radius:8px`, fondo
  `--color-surface`, `box-shadow: var(--shadow-sm)`, hover `--color-hover`. Contenido: descripción
  (14px) + chip "auto" + chips de tags; método de pago abajo (11px); monto a la derecha con
  `tabular-nums` y, si hay liquidación, "liq. X" en 11px; acciones a la derecha (editar / eliminar
  como `.btn.btn-secondary.btn-icon` de 36px). Si el gasto es auto-generado, en lugar de las
  acciones va un botón fantasma "Ver recurrente" que navega al recurrente correspondiente.
- Nota al pie: "Las ocurrencias generadas por un recurrente no se editan acá...".

**b) Selección**

Panel de filtros (fondo `--color-surface`, `border-radius:14px`, `padding:16.8px`):
- `<h6>` "Tags incluidos" + botones fantasma "Todos" y "Limpiar".
- Chips de tags conmutables (12px, `padding:4px 11px`, `border-radius:6px`): activo = fondo
  `--color-chip-bg`, borde `--color-accent`, texto `--color-chip-ink`; inactivo = transparente,
  borde `--color-divider`. Incluye un chip **"sin tag"** para los gastos sin tags.
- Separador y segmentado "Gastos recurrentes": **Incluir / Excluir / Sólo recurrentes**.

Métricas (grid `repeat(auto-fit,minmax(200px,1fr))`, mismo tratamiento de banda):
- Panel `--color-band`: "GASTOS INCLUIDOS", cantidad en 36px, y una línea de alcance ("todos los
  tags · con recurrentes" / "3 de 6 tags · sólo recurrentes").
- "Suma por moneda": una línea de 20px por moneda presente.
- "Promedio diario": suma / días transcurridos del mes, por moneda, con la nota "sobre N días
  transcurridos".

Debajo, la lista plana de los gastos incluidos (fecha 12px a la izquierda, descripción + chips,
monto a la derecha) y, si no entra ninguno, "Ningún gasto entra en la selección actual.".

Filtro: un gasto entra si (según el modo de recurrentes) y si **alguno** de sus tags está
seleccionado (los sin tags dependen del chip "sin tag").

### 3. Recurrentes (`/recurrentes`)

Grid `minmax(0,1fr) minmax(0,1.2fr)`.

- Izquierda: tarjetas clickeables por recurrente (orden alfabético). Título 17px, chip "Cancelado"
  cuando `currentRule === null`, monto/mes en 14px, meta con tags y "desde <mes>". La seleccionada
  lleva `box-shadow: 0 0 0 1px var(--color-accent)`; el resto `var(--shadow-sm)`.
- Derecha: detalle. Nombre `<h3>`, descripción, chips de tags. **Historial de precios** como
  timeline descendente: por regla, punto de 7px (`--color-accent` si es la regla abierta, si no
  `--color-neutral-400`), monto, rango ("desde jun 2026 · vigente" o "ene 2026 → jun 2026") y
  método de pago a la derecha. Acciones sólo si hay regla activa: "Cambiar precio" (primario) y
  "Cancelar" (secundario). Si está cancelado, la nota "Cancelado: ya no genera ocurrencias. La del
  mes en curso se conserva.".
- Diálogo "Cambiar precio": monto + moneda, con el texto "Rige desde el próximo mes. La ocurrencia
  de septiembre no cambia."

### 4. Presupuesto (`/presupuesto`)

`max-width: 900px`.

- **Anillo + métricas**: grid `minmax(0,220px) minmax(0,1fr)`, radio 14px, `--shadow-md`.
  - Izquierda, fondo `--color-band`: donut SVG `viewBox="0 0 140 140"`, 150px de lado, círculo
    r=54 con `stroke-width:14`; pista en `--color-band-deep`, arco en `--color-band-dim` con
    `stroke-linecap:round`, `stroke-dasharray = circunferencia * % / 100` y
    `transform="rotate(-90 70 70)"`. Al centro, "% CONSUMIDO" (30px + 11px). Abajo, el mes en
    uppercase 11px.
  - Derecha, fondo `--color-surface`: Total / Disponible / Por día (label 11px + valor 22px), un
    **histograma de gasto por día del mes** (barras de altura proporcional, `height:52px`, gap 2px;
    hoy en `--color-accent`, días con gasto en `--color-accent-400`, días vacíos como stub de 2%
    en `--color-neutral-300`, `title` con día y monto), y la nota "Un presupuesto no se edita ni se
    borra...".
- **Meses anteriores**: por mes, grid `88px / 1fr / 150px`: etiqueta del mes, barra de 20px
  (pista `--color-neutral-200` con borde interno `--color-neutral-300`, relleno proporcional a lo
  gastado en `--color-accent-600`, o `--color-warn` si se pasó del presupuesto) con una **marca
  vertical de 2px** en la posición del presupuesto de ese mes, y a la derecha gastado / "de
  presupuesto". Nota: "La línea vertical marca el presupuesto del mes; la barra, lo gastado.".
  → Estos datos no existen todavía en la API. Ya hay un prompt para el equipo de backend en
  `prompt-backend-historico-presupuestos.md` (endpoint de histórico: mes, presupuesto, moneda y
  gastado, en un solo request). Hasta que exista, dejar la sección detrás de un flag o derivarla
  con un `GET /api/expenses?month=` por mes.
- **Crear presupuesto del próximo mes**: monto + moneda + botón "Crear", con el mensaje de
  resultado en `--color-accent-ink`. Sólo mes actual o próximo (400 fuera de rango, 409 si ya
  existe).

### 5. Catálogos (`/catalogos`)

Grid `repeat(auto-fit, minmax(240px,1fr))`, tres paneles con `--shadow-sm` y `padding:16.8px`:

- **Monedas**: por fila "CODE · escala N" (14px) + nombre (11px); chip `.tag-outline` "en uso"
  cuando está referenciada (no se puede borrar ni cambiar la escala) o botón de eliminar cuando
  está libre. Botón fantasma "Nueva moneda".
- **Tags**: chips `.tag-accent` con una "x" para borrar; nota "Borrar un tag nunca falla: se
  desasocia de los gastos y estos se conservan.". Botón "Nuevo tag".
- **Métodos de pago**: filas con nombre, chip "en uso" (borrado → 409) o botón eliminar. Botón
  "Nuevo método".

### Diálogo de gasto (nuevo / editar)

`.dialog-backdrop` + `.dialog` de `width: min(560px, 100%)`, `border-radius:14px`, `--shadow-lg`.

- Título "Nuevo gasto" / "Editar gasto". En edición, aviso en `--color-accent-ink`: "PUT reemplaza
  el gasto completo: los campos que queden vacíos se borran."
- Grid `1fr 110px 130px`: Monto (texto, `inputmode="decimal"`), Moneda (select del catálogo), Fecha
  (date, default hoy).
- Descripción (máx. 500).
- Tags: chips conmutables (mismo tratamiento que en Selección).
- Método de pago: select con opción "— ninguno —".
- Bloque de liquidación separado por `inset 0 1px 0 var(--color-neutral-300)`: checkbox (`.radio` +
  `.dot`) "Se liquidó en otra moneda" y, si está activo, monto + moneda (excluyendo la moneda de
  facturación).
- **Banner de error**: fondo `--color-chip-bg`, borde interno `--color-chip-line`, ícono
  `ph-warning-circle` en `--color-warn`, `detail` del problem+json en 13px y, en 10px, el status +
  `application/problem+json`. Validaciones del prototipo: monto positivo (`amount must be a
  positive amount`), decimales dentro de la escala, liquidación completa.
- Acciones a la derecha: "Cancelar" (secundario) y "Guardar gasto" (primario).

## Interactions & Behavior

- Navegación lateral cambia de pantalla; el ítem activo va en `--color-accent`.
- Segmentado de Gastos alterna Por día / Selección sin perder los filtros.
- Crear, editar o borrar un gasto **refresca el listado del mes y `GET /api/budgets/current`** (el
  backend recalcula; no hay endpoint de recompute).
- Al abrir el diálogo de edición, precargar el `ExpenseResponse` completo. Al guardar, enviar todos
  los campos vigentes.
- Editar/borrar sólo si `recurringExpenseId === null`; si no, llevar al recurrente.
- Cancelar un recurrente o cambiar su precio actualiza `currentRule` / `ruleHistory` y deja de
  ofrecer las acciones cuando queda cancelado.
- Los formularios de "crear al vuelo" de catálogos deben disparar el `POST` correspondiente y
  reusar el valor en el select (el prototipo deja los botones sin implementar).
- Estados a cubrir en la implementación real y ausentes del prototipo: **loading** (skeletons con
  la forma de cada bloque), **error de red**, **listas vacías** por pantalla, y **sesión expirada**.
- Transiciones: sólo las del toggle de tema (`.18s`) y los hovers. Nada más se anima.
- Responsive: todos los grids usan `auto-fit`/`minmax` y reflowean; la barra lateral es fija en el
  diseño (definir con el equipo el colapso en mobile).

## Estados: loading, error y vacío

Los tres estados están diseñados y capturados (ver `screenshots/estado-*.png`). En el prototipo se
recorren con la tweak **uiState** (`datos` / `cargando` / `error` / `vacio`). Reemplazan el
contenido del `<main>`; la barra lateral nunca cambia.

### Loading (skeleton)

- `aria-busy="true"` en el contenedor. Sin spinners: sólo bloques con la forma del contenido real.
- Bloques en `--color-neutral-300` (dentro de la banda verde, en `--color-band-line`), radios de
  4–8px, y `animation: ex-pulse 1.4s ease-in-out infinite` con `@keyframes ex-pulse { 0%,100%
  { opacity: 1 } 50% { opacity: .45 } }`. Cada bloque arranca con un **delay escalonado** de 0.05s
  (barras) / 0.08s (filas) para que la onda recorra la pantalla.
- Composición: título (220×30) + subtítulo (320×11); banda de dos paneles con la misma grilla y
  alto (~190px) que el bloque real, con barras de altura variada a la derecha; seis filas de
  `padding:11.2px`, fondo `--color-surface` y `--shadow-sm`, cada una con tres bloques (fecha,
  descripción de ancho variable, monto de 90px).
- Al pie, "Cargando <alcance>…" en 12px, donde el alcance depende de la pantalla ("tus gastos", "el
  resumen del mes", "el presupuesto", "tus catálogos", "tus gastos recurrentes").
- Reservar el mismo alto que el contenido real para que no haya salto de layout al resolver.

### Error

- Panel de `max-width:560px`, `padding:22.4px`, radio 14px, fondo `--color-surface`,
  `--shadow-md`, `role="alert"`.
- Cabecera: círculo de 36px con fondo `--color-chip-bg` e ícono `ph-warning-circle` de 20px en
  `--color-warn`; a la derecha `<h4>` "No pudimos cargar <alcance>" y, en 12px, el status legible
  ("Error de red", "409 Conflict").
- Bloque interior con fondo `--color-chip-bg`: el **`detail` del problem+json** en 13px
  (`--color-chip-ink`) y, en 10px, `application/problem+json` en `--color-accent-ink`. El texto de
  error siempre viene del backend; no inventar copy propio.
- Acciones: "Reintentar" (primario, ícono `ph-arrows-clockwise`) y "Ir al resumen" (secundario).
- Casos a distinguir en la implementación: error de red / 5xx → este panel completo; `401` →
  no mostrar el panel, cerrar sesión y redirigir a login; `409`/`422` disparados por una acción
  del usuario → **no** reemplazar la pantalla, mostrar el `detail` en el banner del diálogo o del
  formulario (ver "Diálogo de gasto").

### Vacío

- Panel de `max-width:520px` con `--shadow-sm` (sin fondo de superficie: es un estado tranquilo,
  no una alerta).
- Marca gráfica: cuatro barras de 12px de ancho y alturas 30/55/22/70% en `--color-neutral-400`,
  la última en `--color-accent-400`, todo a `opacity:.5`. No hay ilustración.
- `<h4>` con el título, párrafo de 13px `max-width:46ch` en `color-mix(text 60%)`, y un botón
  primario con la acción principal de esa pantalla.
- Copy por pantalla (usar textual):
  - **Resumen** — "Todavía no hay nada este mes" / "Cuando cargues tu primer gasto o definas un
    presupuesto, acá vas a ver el disponible, el ritmo de gasto y a dónde se va la plata." →
    *Cargar un gasto*
  - **Gastos** — "Sin gastos en septiembre" / "Cargá un gasto manual o definí un recurrente para
    que la app genere la ocurrencia de cada mes automáticamente." → *Nuevo gasto*
  - **Recurrentes** — "Sin gastos recurrentes" / "Los recurrentes son cosas como el alquiler o una
    suscripción: se definen una vez y generan su gasto cada mes, con historial de cambios de
    precio." → *Nuevo recurrente*
  - **Presupuesto** — "Sin presupuesto para este mes" / "Definí cuánto querés gastar en septiembre
    y la app calcula el disponible y cuánto te queda por día. Una vez creado no se edita." →
    *Crear presupuesto*
  - **Catálogos** — "Catálogos vacíos" / "Antes de cargar gastos necesitás al menos una moneda. Los
    tags y los métodos de pago son opcionales y se pueden crear al vuelo desde el formulario de
    gasto." → *Nueva moneda*
- El vacío de Presupuesto es el mismo caso que `GET /api/budgets/current` devolviendo **200 sin
  body**. En Resumen ese caso ya tiene además su propia tarjeta inline (ver pantalla 1).
- La vista "Selección" de Gastos tiene su propio vacío en línea ("Ningún gasto entra en la
  selección actual.") porque es resultado de un filtro, no de falta de datos: no usar el panel.

## State Management

Servidor (vía el data layer de cavix): monedas, tags, métodos de pago, gastos del mes, recurrentes,
`budgets/current`. Cliente: mes visible, pantalla/tab activo, recurrente seleccionado, tema
(persistir en storage), filtros de la vista Selección (tags seleccionados y modo de recurrentes),
estado del diálogo (abierto/cerrado, modo nuevo/editar, form, error de API).

## Design tokens

El prototipo re-tematiza Nocturne. Los tokens base viven en `design/nocturne-styles.css`; los de
color se sobreescriben así (ver el bloque `<style>` del prototipo):

**Modo claro**

```
--color-bg #f2ede1   --color-surface #e9e2d1   --color-text #1b2620
--color-accent #2f4f3f   --color-divider color-mix(in srgb,#1b2620 16%,transparent)
neutral 100→900: #faf7ef #efe9db #ded7c6 #c3baa4 #a49a83 #837a66 #625c4d #423e35 #2b2a24
accent  100→900: #e6ede6 #d3e0d6 #b4c9bb #8fae9b #5f8871 #446a56 #2f4f3f #223b2f #16261e
--shadow-sm 0 0 0 1px #ded7c6
--shadow-md 0 0 0 1px #d3cbb8, 0 6px 18px rgba(43,38,26,.10)
--shadow-lg 0 0 0 1px #c3b9a2, 0 16px 40px rgba(43,38,26,.16)
--color-rail linear-gradient(180deg,#eae3d2,#f2ede1)   --color-hover #e2dac6
--color-band #223b2f  --color-band-ink #faf7ef  --color-band-dim #b4c9bb
--color-band-deep #16261e  --color-band-line #2f4f3f
--color-chip-bg #e6ede6  --color-chip-ink #223b2f  --color-chip-line #b4c9bb
--color-chart-area #d3e0d6  --color-accent-ink #2f4f3f
--color-warn #8a5a3c  --color-warn-on-band #e0a887
```

**Modo oscuro** (`.theme-dark`)

```
--color-bg #101512   --color-surface #1a211c   --color-text #ece3cf
--color-accent #86b09a   --color-divider color-mix(in srgb,#ece3cf 18%,transparent)
neutral 100→900: #ece3cf #222a24 #2c342e #4d5a51 #6f7d73 #8b998e #9fada3 #2f3a33 #0b0f0c
accent  100→900: #d9e7dd #1e2c24 #a9c6b4 #6f9a83 #86b09a #6f9a83 #9dc0ab #223b2f #121b16
--shadow-sm 0 0 0 1px #283029
--shadow-md 0 0 0 1px #333c34, 0 6px 18px rgba(0,0,0,.50)
--shadow-lg 0 0 0 1px #4a544b, 0 16px 40px rgba(0,0,0,.60)
--color-rail linear-gradient(180deg,#161d18,#101512)   --color-hover #232c26
--color-band #1b2a22  --color-band-ink #f2ece0  --color-band-dim #a9c6b4
--color-band-deep #121b16  --color-band-line #2f4438
--color-chip-bg #1e2b24  --color-chip-ink #cfe2d5  --color-chip-line #3c5346
--color-chart-area #1e2c24  --color-accent-ink #9dc0ab
--color-warn #c98a63  --color-warn-on-band #e0a887
```

**Espaciado** (densidad 0.70×): `2.8 / 5.6 / 8.4 / 11.2 / 16.8 / 22.4 px`.
**Radios**: `4 / 8 / 14 px`.
**Tipografía**: Inter (400/500/600/700) para headings y body; headings en **500**, nunca más
bold; `line-height:1.12`, `letter-spacing:-0.015em`. Escala: h1 42 · h2 32 · h3 25 · h4 20 · h5 16 ·
h6 13 (uppercase, `letter-spacing:.08em`). Body 15px/1.55; secundarios 13px; meta 11px; kickers
10–11px uppercase. Todos los números en `font-variant-numeric: tabular-nums`.
**Estados**: hover con tinte del acento; `:focus-visible { outline: 2px solid var(--color-accent);
outline-offset: 2px }`; disabled a 45% de opacidad. Nunca dejar el focus ring del navegador.
**Reglas del sistema**: botones primarios son **contorno**, no relleno; el acento se usa como línea
y brillo; la única superficie saturada permitida son las bandas verdes (`--color-band`).

## Assets

- Iconos: **Phosphor** (regular). En el prototipo vía CDN `@phosphor-icons/web@2.1.1`; en la app
  usar el paquete que ya use cavix (`@phosphor-icons/react` si está disponible). Íconos usados:
  `chart-donut`, `receipt`, `arrows-clockwise`, `target`, `tag`, `plus`, `pencil-simple`, `trash`,
  `x`, `calendar-blank`, `sliders-horizontal`, `warning-circle`, `sun`, `moon`.
- Tipografía: Inter (Google Fonts).
- Sin imágenes ni ilustraciones. Los gráficos son SVG generados desde los datos.

## Files

```
design/expensia-standalone.html   — LA REFERENCIA: un solo archivo, se abre en el navegador
                                    y es exactamente la app que el usuario aprobó (offline,
                                    sin dependencias). Recrear esto.
design/Expensia App.dc.html       — el fuente del prototipo (misma app, requiere support.js)
design/nocturne-styles.css        — tokens y clases del sistema de diseño
design/nocturne-readme.md         — guía del sistema (dirección, color, tipo, do/don't)
api/…endpoints.md                 — contrato de API completo (fuente de verdad)
prompt-backend-historico-…md      — prompt para el agente de backend: endpoint del histórico
                                    de presupuestos que alimenta "Meses anteriores"
screenshots/                      — cómo tiene que verse cada pantalla y cada estado
```

**Capturas** (todas a 924px de ancho, tema claro salvo donde diga):

| Archivo | Qué muestra |
|---|---|
| `01-resumen.png` | Resumen: banda de presupuesto, acumulado del mes, barras por tag |
| `02-gastos-por-dia.png` | Gastos agrupados por día con total diario |
| `03-gastos-seleccion.png` | Gastos → Selección: filtros, métricas y lista |
| `04-dialogo-nuevo-gasto.png` | Diálogo de nuevo gasto sobre el backdrop |
| `05-recurrentes.png` | Listado + detalle con historial de precios |
| `06-presupuesto.png` | Anillo de consumo, gasto por día, meses anteriores |
| `07-catalogos.png` | Monedas, tags y métodos de pago |
| `08-resumen-oscuro.png` | Resumen en modo oscuro |
| `09-gastos-oscuro.png` | Gastos en modo oscuro |
| `10-presupuesto-oscuro.png` | Presupuesto en modo oscuro |
| `estado-01-cargando.png` | Skeleton de carga |
| `estado-02-error.png` | Panel de error con el `detail` del problem+json |
| `estado-03-vacio-gastos.png` | Vacío de Gastos |
| `estado-04-vacio-presupuesto.png` | Vacío de Presupuesto |

Ante cualquier duda entre este documento y `design/expensia-standalone.html`, **manda el
archivo**: es la app tal como fue aprobada. Abrirlo, recorrer las cinco pantallas, alternar el tema
y los estados, y recrear eso.

Para ver el prototipo: abrir el `.dc.html` en un navegador. El toggle de tema está al pie de la
barra lateral; los datos son mock y las mutaciones son en memoria.
