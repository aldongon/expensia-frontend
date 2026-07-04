# Expensia API Reference

Technical reference for the Expensia backend HTTP API. Everything the frontend needs:
authentication, conventions, endpoints, request/response shapes, and error semantics.

- **Base package / service:** `com.finmgmt.expensia` (Spring Boot 4, Java 25)
- **Content type:** all request and response bodies are JSON (`application/json`).
- **API root:** every endpoint is under `/api`.
- **All timestamps** (`createdAt`, `expiresAt`) are ISO-8601 instants in UTC (e.g. `2026-07-04T12:30:00Z`).
- **All dates** (`expenseDate`, `startMonth`, `endMonth`) are ISO civil dates `YYYY-MM-DD` (no time, no zone).

---

## 1. Authentication

The API is a **stateless bearer-token** system. There are no sessions and no cookies; CSRF is
not applicable.

- `POST /api/auth/register` and `POST /api/auth/login` are **public**.
- **Every other `/api/**` endpoint requires a valid JWT** in the `Authorization` header:

  ```
  Authorization: Bearer <token>
  ```

- Missing/invalid/expired token ⇒ **401 Unauthorized** (enforced by the resource-server filter,
  before any controller runs).

### Token details (informational)

- Signed with **HS256** (HMAC-SHA256).
- `sub` claim = the user's id. The backend derives the acting user **solely from the token** — you
  never send a user id in a request body or query param. All data is automatically scoped to the
  token's user.
- **Expires 24 hours** after issuance. When a call starts returning 401, re-authenticate via
  `/api/auth/login` to obtain a fresh token. There is no refresh endpoint; log in again.

### `POST /api/auth/register`

Create an account. Public.

**Request**

```json
{
  "email": "user@example.com",
  "password": "at-least-8-chars",
  "timezone": "America/New_York"
}
```

| Field      | Type   | Rules |
|------------|--------|-------|
| `email`    | string | Required, well-formed email. Stored lowercased; uniqueness is case-insensitive. |
| `password` | string | Required, **min 8 chars** (no other composition rules). |
| `timezone` | string | Required, valid **IANA** zone id (e.g. `Europe/Madrid`). Drives all "current month" logic for this user. |

**Response `201 Created`** — never returns the password/hash:

```json
{ "id": 1, "email": "user@example.com", "timezone": "America/New_York" }
```

**Errors:** `400` invalid body/validation; `409` email already registered.

### `POST /api/auth/login`

Exchange credentials for a token. Public.

**Request**

```json
{ "email": "user@example.com", "password": "at-least-8-chars" }
```

Email is matched case-insensitively.

**Response `200 OK`**

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "expiresAt": "2026-07-05T12:30:00Z"
}
```

**Errors:** `400` invalid body; `401` invalid credentials (wrong email or password — not
distinguished, to avoid account enumeration).

---

## 2. Conventions

### Money

- Monetary **amounts are always returned as strings** (e.g. `"12.50"`, `"0.000000000000000001"`),
  rendered at the owning currency's configured **scale**, to preserve exact decimal precision. Parse
  them with a decimal/big-number type on the frontend — **never** as a JS `number`.
- In **requests**, amounts are sent as JSON numbers or numeric strings; they must be **positive** and
  their scale must not exceed the currency's scale (else `400`).
- Every amount is paired with a `currencyCode`. A currency's `scale` (0–18) defines how many decimal
  places it uses.

### Reference data by name

Expenses and recurring expenses reference **currencies**, **tags**, and **payment methods** — all
owned per-user. In request bodies:

- `currencyCode` is the currency **code** (e.g. `"USD"`, upper-cased server-side).
- `tagNames` is a list of tag **names**.
- `paymentMethodName` is a payment method **name**.

If a referenced name/code isn't owned by the acting user, the call fails **422** (see errors). Create
the reference data first via the endpoints in §5.

### Errors (RFC 9457 Problem Detail)

All error responses use `application/problem+json` with this shape:

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "amount: must be greater than 0"
}
```

Read `status` for the code and `detail` for a human-readable reason (validation errors are joined
with `; `). Status-code meanings across the API:

| Status | Meaning |
|--------|---------|
| `400 Bad Request` | Malformed body, failed bean-validation, bad path/query param, or a broken business rule (e.g. `startMonth` not first-of-month or in the past, amount scale too large). |
| `401 Unauthorized` | Missing/invalid/expired token, or bad login credentials. |
| `404 Not Found` | The id doesn't exist **or belongs to another user** (cross-user access is indistinguishable from not-found). |
| `409 Conflict` | State conflict: duplicate currency code / duplicate tag or payment-method name / deleting reference data still in use / price-change or cancel on an already-cancelled recurring expense. |
| `422 Unprocessable Content` | Body references a currency/tag/payment-method the user doesn't own. |

---

## 3. Expenses — `/api/expenses`

### `POST /api/expenses`

Record a one-off expense.

**Request**

```json
{
  "amount": 42.50,
  "currencyCode": "USD",
  "expenseDate": "2026-07-04",
  "description": "Lunch",
  "tagNames": ["food", "work"],
  "paymentMethodName": "Visa",
  "settlementAmount": 39.10,
  "settlementCurrencyCode": "EUR"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `amount` | ✅ | Positive; scale ≤ currency scale. |
| `currencyCode` | ✅ | Must be owned by the user. |
| `expenseDate` | ❌ | `YYYY-MM-DD`. Defaults to **today in the user's timezone** when omitted. |
| `description` | ❌ | Max 500 chars. |
| `tagNames` | ❌ | Each must be owned by the user. |
| `paymentMethodName` | ❌ | Must be owned by the user. |
| `settlementAmount` | ❌ | Positive. Pair with `settlementCurrencyCode`. |
| `settlementCurrencyCode` | ❌ | Owned currency; the settlement (what actually cleared, e.g. after FX). |

**Response `201 Created`** — see the expense shape below.

### `GET /api/expenses?month=YYYY-MM`

List the acting user's expenses for a calendar month. `month` is **required** and must be
`YYYY-MM` (e.g. `2026-07`), else `400`. Includes both manually recorded expenses and
auto-generated recurring occurrences.

**Response `200 OK`** — array of expense objects.

### Expense object

```json
{
  "id": 10,
  "amount": "42.50",
  "currencyCode": "USD",
  "expenseDate": "2026-07-04",
  "description": "Lunch",
  "tags": ["food", "work"],
  "paymentMethod": "Visa",
  "settlementAmount": "39.10",
  "settlementCurrencyCode": "EUR",
  "recurringExpenseId": null,
  "createdAt": "2026-07-04T12:30:00Z"
}
```

- `amount` / `settlementAmount` are strings at their currency scale. Settlement fields are `null`
  unless both were set.
- `tags` is sorted alphabetically.
- `recurringExpenseId` is `null` for manual expenses, or the parent recurring-expense id for an
  **auto-generated occurrence**. Use it to badge/group occurrences in the UI.

---

## 4. Recurring Expenses — `/api/recurring-expenses`

A **recurring expense** is a stable identity (name, description, tags) that owns a chronological
history of **rules** (versioned money). Each rule is valid over a **half-open month range**
`[startMonth, endMonth)` — both first-of-month dates. The **open rule** (`endMonth: null`) is the
currently active one. **No open rule ⇒ the recurring expense is cancelled.**

The backend automatically generates ordinary `expense` rows (**occurrences**) — one per month per
active recurring expense, stamped with the rule's amount/currency at generation time — immediately on
create (for the current month) and hourly thereafter, gap-filling any missing months up to each
user's current local month. The frontend does not trigger generation; occurrences simply appear in
`GET /api/expenses` with `recurringExpenseId` set.

### `POST /api/recurring-expenses`

Create a recurring expense plus its first (open) rule.

**Request**

```json
{
  "name": "Netflix",
  "amount": 15.99,
  "currencyCode": "USD",
  "startMonth": "2026-07-01",
  "description": "Streaming",
  "paymentMethodName": "Visa",
  "tagNames": ["subscriptions"]
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `name` | ✅ | Non-blank, max 255. |
| `amount` | ✅ | Positive; scale ≤ currency scale. |
| `currencyCode` | ✅ | Owned by the user. |
| `startMonth` | ✅ | **Must be the first day of a month** and **not before** the user's current month. Else `400`. |
| `description` | ❌ | Max 500. |
| `paymentMethodName` | ❌ | Owned by the user. |
| `tagNames` | ❌ | Each owned by the user. |

If `startMonth` is the current month, the current month's occurrence is generated immediately; a
future `startMonth` generates nothing yet.

**Response `201 Created`** — the recurring-expense object (below).

### `GET /api/recurring-expenses`

List the acting user's recurring expenses, ordered by name. **Response `200 OK`** — array.

### `GET /api/recurring-expenses/{id}`

Fetch one. `404` if not found / not owned.

### `PUT /api/recurring-expenses/{id}`

Edit the **stable identity only** — name, description, tags. Does **not** touch any rule or past
occurrence. `tagNames` **replaces** the entire tag set.

**Request**

```json
{ "name": "Netflix Premium", "description": "4K plan", "tagNames": ["subscriptions", "video"] }
```

| Field | Required | Notes |
|-------|----------|-------|
| `name` | ✅ | Non-blank, max 255. |
| `description` | ❌ | Max 500. |
| `tagNames` | ❌ | Replaces existing tags; each must be owned. |

**Response `200 OK`** — the updated object.

### `POST /api/recurring-expenses/{id}/price-changes`

Change the money going forward. **Takes effect next month; the current month is never altered.**

**Request**

```json
{ "amount": 17.99, "currencyCode": "USD", "paymentMethodName": "Amex" }
```

| Field | Required | Notes |
|-------|----------|-------|
| `amount` | ✅ | Positive; scale ≤ currency scale. |
| `currencyCode` | ❌ | Omit to keep the current rule's currency. |
| `paymentMethodName` | ❌ | Omit to keep the current rule's payment method. |

Behavior:
- Normally: closes the open rule at the first of next month and opens a new open rule from next
  month — the history then has an extra version.
- If the open rule hasn't started yet (a second change within the same month for a future rule), it
  is **amended in place** instead of spawning a third rule.

**Response `200 OK`** — the updated object. **`409`** if the recurring expense is already cancelled
(no open rule). `422` for unknown currency/payment method.

### `POST /api/recurring-expenses/{id}/cancellation`

Stop future generation. No request body.

- Closes the open rule at the first of next month; **past and current-month occurrences are
  retained**.
- If the open rule hasn't started yet, it is deleted outright.
- After cancellation there is no open rule and `currentRule` is `null`.

**Response `200 OK`** — the updated object. **`409`** if already cancelled.

### Recurring-expense object

```json
{
  "id": 3,
  "name": "Netflix",
  "description": "Streaming",
  "tags": ["subscriptions"],
  "currentRule": {
    "id": 8,
    "amount": "15.99",
    "currencyCode": "USD",
    "paymentMethod": "Visa",
    "startMonth": "2026-07-01",
    "endMonth": null
  },
  "ruleHistory": [
    {
      "id": 7,
      "amount": "14.99",
      "currencyCode": "USD",
      "paymentMethod": "Visa",
      "startMonth": "2026-05-01",
      "endMonth": "2026-07-01"
    },
    {
      "id": 8,
      "amount": "15.99",
      "currencyCode": "USD",
      "paymentMethod": "Visa",
      "startMonth": "2026-07-01",
      "endMonth": null
    }
  ],
  "createdAt": "2026-05-01T09:00:00Z"
}
```

- `currentRule` is the open rule, or **`null` when cancelled/ended**.
- `ruleHistory` is the full version history, ordered by `startMonth` ascending. Each rule is valid
  `[startMonth, endMonth)`; `endMonth: null` marks the open rule.
- `amount` is a string at the currency's scale; `paymentMethod` may be `null`.
- `tags` is sorted alphabetically.

---

## 5. Reference data

Per-user lookup data referenced by expenses and recurring expenses. All under `/api`, all require
auth, all scoped to the acting user.

### Currencies — `/api/currencies`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/currencies` | Create. `201`. |
| `GET` | `/api/currencies` | List. `200`. |
| `GET` | `/api/currencies/{id}` | Detail. `404` if not owned. |
| `PUT` | `/api/currencies/{id}` | Update (full). `200`. |
| `DELETE` | `/api/currencies/{id}` | Delete. `204`. `409` if referenced by any expense. |

**Create/Update request**

```json
{ "code": "USD", "name": "US Dollar", "scale": 2 }
```

| Field | Rules |
|-------|-------|
| `code` | Required, max 16. **Upper-cased** server-side. Unique per user (`409` on duplicate). |
| `name` | Required, max 100. |
| `scale` | Required, **0–18** decimal places. On update, `scale` may only change while the currency is **not referenced** by any expense (so recorded amounts are never reinterpreted). |

**Response object:** `{ "id": 1, "code": "USD", "name": "US Dollar", "scale": 2 }`

### Payment methods — `/api/payment-methods`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/payment-methods` | Create. `201`. |
| `GET` | `/api/payment-methods` | List. `200`. |
| `GET` | `/api/payment-methods/{id}` | Detail. `404` if not owned. |
| `PUT` | `/api/payment-methods/{id}` | Rename. `200`. |
| `DELETE` | `/api/payment-methods/{id}` | Delete. `204`. `409` if in use. |

**Create/Update request:** `{ "name": "Visa" }` — required, max 64, trimmed; unique per user (`409`
on duplicate).

**Response object:** `{ "id": 1, "name": "Visa" }`

### Tags — `/api/tags`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/tags` | Create. `201`. |
| `GET` | `/api/tags` | List. `200`. |
| `GET` | `/api/tags/{id}` | Detail. `404` if not owned. |
| `PUT` | `/api/tags/{id}` | Rename. `200`. |
| `DELETE` | `/api/tags/{id}` | Delete. `204`. |

**Create/Update request:** `{ "name": "food" }` — required, max 64, trimmed; unique per user (`409`
on duplicate).

**Response object:** `{ "id": 1, "name": "food" }`

---

## 6. Quick reference

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Get JWT |
| POST | `/api/expenses` | ✅ | Record expense |
| GET | `/api/expenses?month=YYYY-MM` | ✅ | List a month's expenses |
| POST | `/api/recurring-expenses` | ✅ | Create recurring expense |
| GET | `/api/recurring-expenses` | ✅ | List recurring expenses |
| GET | `/api/recurring-expenses/{id}` | ✅ | Recurring expense detail |
| PUT | `/api/recurring-expenses/{id}` | ✅ | Edit identity (name/desc/tags) |
| POST | `/api/recurring-expenses/{id}/price-changes` | ✅ | Change price (next month) |
| POST | `/api/recurring-expenses/{id}/cancellation` | ✅ | Cancel |
| POST/GET/PUT/DELETE | `/api/currencies[/{id}]` | ✅ | Manage currencies |
| POST/GET/PUT/DELETE | `/api/payment-methods[/{id}]` | ✅ | Manage payment methods |
| POST/GET/PUT/DELETE | `/api/tags[/{id}]` | ✅ | Manage tags |
