# Expensia — Descripción del proyecto y contrato de API

> Este documento está pensado para que otro agente (o desarrollador) pueda construir el **frontend**
> de esta aplicación usando **únicamente** la información de este archivo, sin necesidad de leer el
> código backend.

## 1. Qué es Expensia

Expensia es una API REST de **gestión de gastos personales** (finanzas personales). Cada usuario
registrado puede:

- Registrar **gastos manuales** puntuales (con moneda, fecha, descripción, tags, método de pago y,
  opcionalmente, un monto/moneda de liquidación distinto al de facturación — útil por ejemplo para
  un gasto en USD que en verdad se pagó/liquidó en otra moneda).
- Definir **gastos recurrentes** (ej. "Netflix", "Alquiler") que generan automáticamente una
  ocurrencia (un gasto) cada mes mientras estén activos, con historial de cambios de precio.
- Definir un **presupuesto mensual** (`budget`) por moneda, y consultar en cualquier momento cuánto
  le queda disponible y cuánto puede gastar por día durante el mes en curso.
- Administrar catálogos personales de referencia: **monedas** (`currencies`), **tags** y **métodos
  de pago** (`payment methods`), todos scoped al usuario (cada usuario tiene su propio catálogo, no
  se comparte entre usuarios).

Todo el dominio es **multi-tenant por usuario**: cada usuario ve y modifica exclusivamente sus
propios datos. No existe un rol admin ni datos compartidos entre usuarios.

Los montos de dinero se manejan siempre como **strings decimales exactos** (nunca floats) tanto en
requests como en responses, para evitar errores de redondeo. Cada moneda define una **escala**
(cantidad de decimales permitidos, 0–18) y todo monto en esa moneda debe respetarla.

## 2. Stack y aspectos generales para el frontend

- **Base URL**: no hay un path prefijo fuera de `/api`; en desarrollo corre en `http://localhost:8080`
  (puerto por defecto de Spring Boot, sin override de `server.port`).
- **Formato de body**: JSON (`Content-Type: application/json`) en todos los requests con body.
- **Autenticación**: JWT Bearer, stateless (no hay sesiones ni cookies). Ver sección 3.
- **Zona horaria**: cada usuario tiene una zona horaria IANA (ej. `America/Argentina/Buenos_Aires`)
  guardada en su perfil. Todo concepto de "hoy", "mes actual", etc. en el backend se calcula con esa
  zona horaria, nunca con el reloj del servidor. El frontend no necesita enviar la timezone en cada
  request — solo una vez, al registrarse.
- **Errores**: todas las respuestas de error siguen **RFC 9457 `application/problem+json`**. El
  shape típico es:
  ```json
  {
    "type": "about:blank",
    "title": "Bad Request",
    "status": 400,
    "detail": "amount must be a positive amount"
  }
  ```
  El campo relevante para mostrarle al usuario es `detail`. Los códigos de status usados por la API
  son: `400` (Bad Request — validación de forma o de reglas de negocio simples), `401`
  (Unauthorized — token ausente/ inválido/vencido, o credenciales de login incorrectas), `404` (Not
  Found — el recurso no existe o pertenece a otro usuario; ambos casos son indistinguibles a
  propósito, por seguridad), `409` (Conflict — la operación viola un estado del recurso, ej. borrar
  algo que está en uso), `422` (Unprocessable Content — el body referencia un dato de catálogo
  —moneda, tag, método de pago— que no existe para ese usuario).
- **Montos en respuestas**: siempre vienen como `string` (ej. `"1234.50"`), ya normalizados a la
  escala de la moneda correspondiente. Al enviar un monto en un request, puede mandarse como número
  JSON (ej. `1234.5`); el backend lo valida contra la escala de la moneda elegida.
- **Fechas**: `expenseDate`, `startMonth`, `endMonth` son fechas civiles `LocalDate` en formato
  `YYYY-MM-DD` (sin hora ni timezone). `month` (en budgets y en el listado de gastos) es
  `YYYY-MM`. `createdAt` / `expiresAt` son instantes UTC en formato ISO-8601
  (ej. `2026-09-05T12:34:56.789Z`).

## 3. Autenticación (`/api/auth`)

Público (no requiere token). Estos son los únicos dos endpoints accesibles sin JWT.

### `POST /api/auth/register`

Crea una cuenta nueva.

**Request body**
| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `email` | string | sí | Debe tener formato de email válido. Se guarda en minúsculas; la unicidad es case-insensitive. |
| `password` | string | sí | Mínimo 8 caracteres, sin reglas de composición adicionales. |
| `timezone` | string | sí | Identificador IANA válido (ej. `"America/Argentina/Buenos_Aires"`, `"UTC"`). Se valida contra `ZoneId`. |

**Response `201 Created`** (`UserResponse`)
```json
{ "id": 1, "email": "user@example.com", "timezone": "America/Argentina/Buenos_Aires" }
```
Nunca se devuelve la password ni su hash.

**Errores**: `400` si falla validación de forma o timezone inválida · `409` (`DuplicateEmailException`)
si el email ya está registrado.

### `POST /api/auth/login`

**Request body**
| Campo | Tipo | Requerido |
|---|---|---|
| `email` | string | sí |
| `password` | string | sí |

**Response `200 OK`** (`TokenResponse`)
```json
{ "token": "eyJhbGciOi...", "expiresAt": "2026-09-06T12:00:00Z" }
```
El token es un JWT firmado (HS256) con `sub` = id del usuario, válido por **24 horas**.

**Errores**: `401` (`InvalidCredentialsException`) si el email no existe o la password no
coincide (mismo mensaje/status para ambos casos, por seguridad) · `400` si falta algún campo.

### Uso del token

Todos los demás endpoints bajo `/api/**` requieren el header:
```
Authorization: Bearer <token>
```
Sin este header (o con un token inválido/expirado) la respuesta es `401`. El usuario "actuante"
(dueño de los datos que se leen/escriben) se deriva **siempre** del token — nunca hay que (ni se
puede) mandar un `userId` en el body o la URL.

## 4. Gastos manuales — `/api/expenses`

Un "gasto" (`Expense`) puede ser **manual** (creado directamente por el usuario) o
**auto-generado** por un gasto recurrente (`recurringExpenseId != null`). Editar/borrar por estos
endpoints **solo funciona sobre gastos manuales**; para modificar una ocurrencia generada hay que
editar/cancelar el gasto recurrente que la generó (ver sección 5).

### `ExpenseResponse` (shape común de todas las respuestas de este recurso)
```json
{
  "id": 42,
  "amount": "1234.50",
  "currencyCode": "USD",
  "expenseDate": "2026-09-05",
  "description": "Supermercado",
  "tags": ["comida", "hogar"],
  "paymentMethod": "Tarjeta Visa",
  "settlementAmount": "1300000.00",
  "settlementCurrencyCode": "ARS",
  "recurringExpenseId": null,
  "createdAt": "2026-09-05T15:04:00Z"
}
```
- `tags`: array de strings (nombres), ordenados alfabéticamente. Vacío `[]` si no tiene tags.
- `paymentMethod`: nombre del método de pago, o `null` si no se asignó ninguno.
- `settlementAmount` / `settlementCurrencyCode`: ambos `null` si el gasto no tiene liquidación en
  otra moneda; si uno está presente, el otro también.
- `recurringExpenseId`: `null` para un gasto manual; el id del gasto recurrente que lo generó en
  caso contrario. **El frontend debe usar este campo para decidir si mostrar los botones de
  editar/eliminar** (deshabilitarlos, o redirigir a la edición del recurrente, cuando no es `null`).
- `createdAt`: instante de creación (UTC), no cambia al editar.

### `POST /api/expenses` — crear un gasto manual

**Request body** (`CreateExpenseRequest`)
| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `amount` | number | sí | Positivo, respetando la escala de `currencyCode`. |
| `currencyCode` | string | sí | Debe existir en el catálogo de monedas del usuario. |
| `expenseDate` | string (`YYYY-MM-DD`) | no | Si se omite, se usa "hoy" en la timezone del usuario. |
| `description` | string (máx. 500) | no | |
| `tagNames` | string[] | no | Cada nombre debe existir como tag del usuario. |
| `paymentMethodName` | string | no | Debe existir como método de pago del usuario. |
| `settlementAmount` | number | no | Ver regla abajo. |
| `settlementCurrencyCode` | string | no | Ver regla abajo. |

Regla de liquidación: `settlementAmount` y `settlementCurrencyCode` deben enviarse **juntos o
ninguno** (400 si solo uno está presente), y `settlementCurrencyCode` debe ser **distinta** de
`currencyCode` (400 si es igual).

**Response**: `201 Created` con el `ExpenseResponse` creado.

**Errores**: `400` monto no positivo / excede la escala de la moneda / liquidación incompleta o
igual a la moneda principal · `422` si `currencyCode`, algún `tagNames[i]`, `paymentMethodName` o
`settlementCurrencyCode` no existen para el usuario.

### `PUT /api/expenses/{id}` — reemplazo completo de un gasto manual

**⚠️ Importante para el frontend**: este endpoint es un **reemplazo total, no un merge/patch**.
Cualquier campo opcional que no se incluya en el body **se borra** en el gasto guardado (tags →
vacío, método de pago → `null`, liquidación → `null`). El formulario de edición debe **precargar
todos los valores actuales** del gasto (vía `GET`/listado previo) y reenviarlos todos, salvo que el
usuario quiera efectivamente limpiarlos.

**Request body**: mismo shape que `CreateExpenseRequest` (`UpdateExpenseRequest`, campos
idénticos). `amount` y `currencyCode` siguen siendo requeridos.

`expenseDate` omitido también aquí cae a "hoy" en la timezone del usuario (no se conserva la fecha
anterior).

**Response**: `200 OK` con el `ExpenseResponse` actualizado (`createdAt` no cambia).

**Errores**:
- `404` si el `id` no existe o pertenece a otro usuario.
- `409` (`ManualExpenseOnlyException`) si el gasto es una ocurrencia auto-generada — mensaje:
  *"Cannot edit an auto-generated occurrence; edit the recurring expense instead."*
- `400` / `422` mismas reglas que en creación.

### `DELETE /api/expenses/{id}` — eliminar un gasto manual

**Response**: `204 No Content`.

**Errores**:
- `404` si el `id` no existe o pertenece a otro usuario.
- `409` (`ManualExpenseOnlyException`) si es una ocurrencia auto-generada — mensaje:
  *"Cannot delete an auto-generated occurrence; cancel the recurring expense instead."*

### `GET /api/expenses?month=YYYY-MM` — listar gastos de un mes

Query param **requerido**: `month` (ej. `?month=2026-09`).

**Response**: `200 OK` con `ExpenseResponse[]`, ordenado por `expenseDate` descendente (y
`createdAt`/`id` descendente como desempate) — es decir, los más recientes primero.

**Errores**: `400` si `month` falta o no tiene formato `YYYY-MM` válido.

## 5. Gastos recurrentes — `/api/recurring-expenses`

Un gasto recurrente representa algo como una suscripción o un alquiler: tiene una identidad estable
(nombre, descripción, tags) y una o más "reglas" de precio (`RecurringRule`) a lo largo del tiempo.
Cada mes, mientras haya una regla activa, se genera automáticamente un `Expense` (ver sección 4)
con `recurringExpenseId` apuntando a este recurso — ese gasto generado **no** se edita/borra por
`/api/expenses`, sino gestionando el recurrente.

No tiene endpoint de borrado directo: para desactivarlo se usa **cancelación** (`/cancellation`).

### `RecurringRuleResponse` (una versión de precio)
```json
{
  "id": 5,
  "amount": "15.99",
  "currencyCode": "USD",
  "paymentMethod": "Tarjeta Visa",
  "startMonth": "2026-09-01",
  "endMonth": null
}
```
`endMonth == null` marca la regla actualmente activa ("open rule"); si tiene fecha, es una regla
histórica que dejó de aplicar desde ese mes (inclusive).

### `RecurringExpenseResponse` (shape común)
```json
{
  "id": 7,
  "name": "Netflix",
  "description": "Plan familiar",
  "tags": ["streaming"],
  "currentRule": { "...": "RecurringRuleResponse, o null si está cancelado" },
  "ruleHistory": [ "...RecurringRuleResponse[], orden cronológico ascendente" ],
  "createdAt": "2026-01-01T10:00:00Z"
}
```
`currentRule: null` significa que el recurrente está **cancelado** (ya no genera más gastos). El
frontend puede usar esto para mostrar un badge "Cancelado" y ocultar las acciones de "cambiar
precio"/"cancelar".

### `POST /api/recurring-expenses` — crear

**Request body** (`CreateRecurringExpenseRequest`)
| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `name` | string (máx. 255) | sí | |
| `amount` | number | sí | Positivo, según escala de `currencyCode`. |
| `currencyCode` | string | sí | Debe existir en el catálogo del usuario. |
| `startMonth` | string (`YYYY-MM-DD`) | sí | Debe ser el **día 1** de un mes, y ese mes debe ser el mes actual del usuario o uno futuro (nunca pasado). |
| `description` | string (máx. 500) | no | |
| `paymentMethodName` | string | no | Debe existir para el usuario. |
| `tagNames` | string[] | no | Cada uno debe existir para el usuario. |

No existen campos de liquidación acá — la liquidación es por-ocurrencia y se agrega editando el
gasto generado individual desde `/api/expenses/{id}`.

Si `startMonth` es el mes actual, se genera **inmediatamente** la ocurrencia de este mes (visible al
instante en `GET /api/expenses?month=...`); si es un mes futuro, todavía no se genera nada.

**Response**: `201 Created` con el `RecurringExpenseResponse`.

**Errores**: `400` si `startMonth` no es día 1 de mes o está en el pasado, o monto inválido · `422`
si `currencyCode`/`paymentMethodName`/algún tag no existen para el usuario.

### `GET /api/recurring-expenses` — listar

**Response**: `200 OK` con `RecurringExpenseResponse[]`, ordenado alfabéticamente por `name`.

### `GET /api/recurring-expenses/{id}` — detalle

**Response**: `200 OK` con `RecurringExpenseResponse`. **Errores**: `404` si no existe / no es del
usuario.

### `PUT /api/recurring-expenses/{id}` — editar identidad (nombre/descripción/tags)

**No afecta precio, moneda, método de pago ni ocurrencias pasadas** — solo la parte "descriptiva".
Para cambiar el monto/moneda/método de pago hay que usar el endpoint de cambio de precio.

**Request body** (`UpdateRecurringExpenseRequest`)
| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `name` | string (máx. 255) | sí | |
| `description` | string (máx. 500) | no | |
| `tagNames` | string[] | no | **Reemplaza** el set completo de tags (igual que en expenses: omitirlo lo vacía). |

**Response**: `200 OK` con el `RecurringExpenseResponse` actualizado.

**Errores**: `404` si no existe/no es del usuario · `422` si algún tag no existe para el usuario.

### `POST /api/recurring-expenses/{id}/price-changes` — cambiar precio

Registra un cambio de monto/moneda/método de pago **a partir del próximo mes**; el mes en curso
(la ocurrencia ya generada, si existe) **no se modifica retroactivamente**.

**Request body** (`PriceChangeRequest`)
| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `amount` | number | sí | Positivo. |
| `currencyCode` | string | no | Si se omite, se mantiene la moneda de la regla actual. |
| `paymentMethodName` | string | no | Si se omite, se mantiene el método de pago actual. |

**Response**: `200 OK` con el `RecurringExpenseResponse` (ver `ruleHistory` actualizado — se cierra
la regla vieja con `endMonth` = primer día del próximo mes, y se abre una nueva regla abierta desde
ese mes; si ya se había hecho un cambio de precio este mes para un mes aún no iniciado, se enmienda
esa regla futura en vez de crear una tercera).

**Errores**: `404` si no existe/no es del usuario · `409` (`RecurringExpenseStateException`,
mensaje *"Cannot change the price of a cancelled recurring expense"*) si ya está cancelado · `400`
monto inválido · `422` moneda/método de pago inexistentes.

### `POST /api/recurring-expenses/{id}/cancellation` — cancelar

No lleva body. Detiene la generación de futuras ocurrencias **a partir del próximo mes**; la
ocurrencia del mes en curso (si ya se generó) se conserva. Si la regla activa todavía no había
empezado a generar nada (era un `startMonth` futuro), se elimina directamente sin dejar rastro.

**Response**: `200 OK` con el `RecurringExpenseResponse` (`currentRule` pasa a `null` si no queda
ninguna regla abierta).

**Errores**: `404` si no existe/no es del usuario · `409` (`RecurringExpenseStateException`,
mensaje *"Recurring expense is already cancelled"*) si ya estaba cancelado.

## 6. Presupuesto mensual — `/api/budgets`

Un `Budget` es **inmutable** una vez creado: no hay endpoints de edición ni borrado. Es único por
combinación (usuario, mes).

### `POST /api/budgets` — crear el presupuesto de un mes

**Request body** (`CreateBudgetRequest`)
| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `amount` | number | sí | Positivo, según escala de `currencyCode`. |
| `currencyCode` | string | sí | Debe existir en el catálogo del usuario. |
| `month` | string (`YYYY-MM`) | sí | Debe ser el **mes actual o el próximo** (en la timezone del usuario) — no se puede crear un presupuesto para meses pasados ni para más de un mes en el futuro. |

**Response `201 Created`** (`BudgetResponse`)
```json
{
  "id": 3,
  "month": "2026-09",
  "amount": "50000.00",
  "currencyCode": "ARS",
  "createdAt": "2026-09-01T00:00:00Z"
}
```

**Errores**: `400` mes con formato inválido / fuera del rango permitido / monto inválido · `422`
moneda inexistente para el usuario · `409` (`DuplicateBudgetException`) si ya existe un presupuesto
para ese (usuario, mes) — mensaje: *"a budget already exists for 2026-09"*.

### `GET /api/budgets/current` — resumen del mes en curso

No recibe parámetros; siempre es relativo al mes actual del usuario (según su timezone).

**Response**:
- `200 OK` con body (`BudgetSummaryResponse`) si existe presupuesto para el mes actual:
  ```json
  {
    "month": "2026-09",
    "currencyCode": "ARS",
    "totalBudget": "50000.00",
    "remainingBudget": "32150.75",
    "dailyBudget": "1150.25"
  }
  ```
  - `remainingBudget` = `totalBudget` menos todos los gastos del mes en esa moneda (incluye los de
    hoy). Puede ser **negativo** si se gastó de más — no hay piso en cero.
  - `dailyBudget` = lo que queda para gastar dividido entre los días restantes del mes (hoy
    inclusive), calculado *antes* de descontar el gasto de hoy. También puede ser negativo.
- `200 OK` **sin body** (respuesta vacía) si el usuario no tiene presupuesto configurado para el
  mes actual. **El frontend debe tratar un 200 con body vacío como "sin presupuesto configurado"**
  y ofrecer la acción de crear uno, en vez de tratarlo como error.

Este endpoint recalcula todo en cada llamada a partir de los gastos vivos — no hace falta
refrescar nada manualmente ni existe un endpoint separado de "recompute"; después de crear, editar
o borrar un gasto, simplemente volver a pedir `GET /api/budgets/current` para ver el número
actualizado.

## 7. Catálogos de referencia — monedas, tags y métodos de pago

Estos tres recursos comparten la misma forma de CRUD y son **por usuario**: cada usuario arma su
propio catálogo antes (o mientras) carga gastos. Un formulario de "nuevo gasto" debería ofrecer
selects/autocompletes poblados desde estos endpoints (`GET` de listado), con la opción de crear uno
nuevo al vuelo si no existe.

### 7.1 Monedas — `/api/currencies`

```json
{ "id": 1, "code": "USD", "name": "US Dollar", "scale": 2 }
```
`code` se normaliza siempre a mayúsculas. `scale` es la cantidad de decimales permitidos para
montos en esa moneda (0 a 18 — permite tanto fiat como cripto de alta precisión).

- `POST /api/currencies` — body `{ code, name, scale }` (todos requeridos; `code` máx. 16
  caracteres, `name` máx. 100, `scale` entero 0–18). → `201` con el creado. `409`
  (`DuplicateCurrencyCodeException`) si el usuario ya tiene esa `code` (case-insensitive).
- `GET /api/currencies` — lista completa del usuario, ordenada por `code`.
- `GET /api/currencies/{id}` — detalle. `404` si no existe/no es del usuario.
- `PUT /api/currencies/{id}` — body igual al de creación (reemplazo completo: `code`, `name`,
  `scale` todos requeridos). `404` si no existe · `409` duplicado de código · `409`
  (`CurrencyInUseException`, *"Cannot change the scale of a currency referenced by an existing
  expense"*) si se intenta cambiar `scale` y la moneda ya está usada por algún gasto (billing o
  settlement) — cambiar solo `code`/`name` sí está permitido aunque esté en uso.
- `DELETE /api/currencies/{id}` — `204`. `404` si no existe · `409` (`CurrencyInUseException`,
  *"Cannot delete a currency referenced by an existing expense"*) si algún gasto la usa como moneda
  de facturación o de liquidación. **El frontend debería deshabilitar/advertir sobre el borrado de
  monedas en uso** en vez de dejar que falle silenciosamente.

### 7.2 Tags — `/api/tags`

```json
{ "id": 1, "name": "comida" }
```
`name` se recorta (`trim`) pero conserva el casing original al mostrarse; la unicidad por usuario es
case-insensitive.

- `POST /api/tags` — body `{ name }` (requerido, máx. 64 caracteres). → `201`. `409`
  (`DuplicateReferenceNameException`) si ya existe (case-insensitive) para el usuario.
- `GET /api/tags` — lista ordenada por `name`.
- `GET /api/tags/{id}` — detalle. `404` si no existe/no es del usuario.
- `PUT /api/tags/{id}` — body `{ name }`, renombra. `404` si no existe · `409` si el nuevo nombre
  colisiona con otro tag existente.
- `DELETE /api/tags/{id}` — `204`. **Sin restricciones de uso**: si el tag está en gastos, se
  desasocia automáticamente de todos ellos (los gastos se conservan, solo pierden ese tag) y luego
  se borra. A diferencia de monedas/métodos de pago, borrar un tag en uso **nunca falla**.

### 7.3 Métodos de pago — `/api/payment-methods`

```json
{ "id": 1, "name": "Tarjeta Visa" }
```
Mismas reglas de `trim`/unicidad case-insensitive que tags.

- `POST /api/payment-methods` — body `{ name }` (requerido, máx. 64). → `201`. `409`
  (`DuplicateReferenceNameException`) si ya existe.
- `GET /api/payment-methods` — lista ordenada por `name`.
- `GET /api/payment-methods/{id}` — detalle. `404` si no existe/no es del usuario.
- `PUT /api/payment-methods/{id}` — body `{ name }`, renombra. `404` · `409` si colisiona.
- `DELETE /api/payment-methods/{id}` — `204`. `404` si no existe · `409`
  (`PaymentMethodInUseException`, *"Cannot delete a payment method referenced by an existing
  expense"*) si algún gasto lo usa. A diferencia de tags, **sí bloquea el borrado** — el frontend
  debería advertir/deshabilitar el borrado si está en uso.

## 8. Guía rápida para armar el frontend

Flujo típico de una pantalla de "Nuevo gasto":
1. Al cargar el formulario, pedir en paralelo `GET /api/currencies`, `GET /api/tags`,
   `GET /api/payment-methods` para poblar selects/autocompletes (con opción de "crear nuevo" que
   dispare el `POST` correspondiente).
2. Enviar `POST /api/expenses` con los campos completados; si falla con `422`, el mensaje indica
   qué referencia (moneda/tag/método de pago) no existe — sugerir crearla.
3. Refrescar el listado del mes (`GET /api/expenses?month=...`) y, si hay presupuesto activo,
   refrescar `GET /api/budgets/current`.

Flujo de "Editar gasto": precargar el formulario con el `ExpenseResponse` completo del gasto (tal
como viene del listado), permitir editar, y al guardar mandar **todos** los campos vigentes (no solo
los cambiados) a `PUT /api/expenses/{id}` — recordar que es reemplazo total. Antes de mostrar el
botón "Editar"/"Eliminar", chequear `recurringExpenseId === null`; si no lo es, redirigir a la
pantalla del gasto recurrente correspondiente.

Flujo de "Gastos recurrentes": la pantalla de detalle debería mostrar `currentRule` (o "Cancelado"
si es `null`) y el `ruleHistory` como una línea de tiempo de precios. Las acciones disponibles son
editar identidad (`PUT`), cambiar precio (`POST .../price-changes`) y cancelar
(`POST .../cancellation`) — no hay "editar precio de una regla pasada" ni "eliminar" directo.

Manejo de sesión: guardar el `token` devuelto por `/api/auth/login` (ej. en memoria o storage
seguro), adjuntarlo como `Authorization: Bearer <token>` en cada request subsiguiente, y tratar
cualquier `401` como sesión expirada → redirigir a login. El token dura 24 horas; no hay endpoint de
refresh, así que al expirar el usuario debe volver a loguearse.
