# E2-4 B — Real Provider REST API (RF-05)

**Date:** 2026-11-08.
**Rama:** `feature/e2-4b-proveedores-api`.
**Base:** E2-4 A validated in Windows: `e24a_suppliers (head)`, 598/598 pruebas y Docker/API healthy.
**Status:** Proposed code for IC and revision; no Windows merge or validation yet.

## Scope

Five low HTTP routes are incorporated `/api/v1/businesses/{business_id}/suppliers`:

| Method | Relative path | Semantics |
|---|---|---|
| GET | `/suppliers?offset=0&limit=100` | List assets and inactive, stable order `name_key,id`, limit 1–500, offset between zero and BIGINT |
| POST | `/suppliers` | Create ASSETS, with only mandatory name, without purchase or stock (201) |
| GET | `/suppliers/{supplier_id}` | Tenant-scoped detail (200) |
| PATCH | `/suppliers/{supplier_id}` | Partial contact edition and information fields, non-editable status (200) |
| PATCH | `/suppliers/{supplier_id}/status` | ACTIVATE/DESACTIVE; repeated idempotent state, no name release (200) |

There is no physical DELETE, global supplier, purchase/reception or React-API integration. The E2-4 A model fields are preserved.

### Safety and errors

- Requires valid bearer; revalidates user, session, company and membership within the transaction.
- Reading: any Active member with VIEW business permit, even if the company is SUSPENDED.
- Scripture: only ENTRY/Manager within an active company.
- Expected errors: **401** session/token; **403** role without permission; **404** other person/non-existent resource or inactive membership; **409** duplicate canonical name or suspended company; **422** payload/ invalid fields/pageination.
- Each supplier consultation includes `business_id`; the foreign IDUID does not display data from other businesses.
- Repositories do not confirm transactions. Create/Edit/Change status makes a single commit, recovering rollback if an error appears after flush.
- El UNIQUE PostgreSQL `(business_id,name_key)` even protects INACTIVE providers. API normalizes with NFKC, collapsed spaces and `casefold` and converts SQL violation of that index to HTTP 409.
- `status`, `id`, `business_id`, `name_key`, timestamps are protected attributes both in POST and in PATCH general.

### Fields and validations

- Name 2–90 after normalizing NFKC; key expansion exceeding 90, Unicode controls etc. is rejected.
- Texts and contacts limited to the length of the schema; optional with empty strings and empty arrangements, never null in PATCH.
- Syntactic email, WhatsApp with international prefix, restricted phone, Instagram as user.
- Only HTTPS public domain website without userinfo or port; map link only to recognized Google Maps host/path.
- Up to seven payment means between EFFECTIVE, TRANSFER, MARKET_PAYMENT, ACCOUNT_DNI, CARJET, CHECK AND COURSE ACCOUNT, without duplicates.
- Up to eight promotions **information**, each with ID UUID, days 0–6 without duplicates, optional medium and descriptive benefit; complete arrangement is replaced when editing, without JSONB mutations in-place.
- **No discounts or actual payments are applied**. No operation in the module generates stock, invoice, purchase or balance.

API uses **snake_case** for fields such as `contact_person`, `payment_methods`, `maps_url` y `payment_method`; the future gateway React will explicitly translate the camelCase names and preset DEMO IDs, instead of copying their local storage.

### Cut Files

- `backend/app/modules/suppliers/{__init__,schemas,repository,service,router}.py`.
- `backend/app/api/v1/router.py` (mounting of routes, without touching previous modules).
- `backend/tests/test_supplier_schemas.py`.
- `backend/tests/test_supplier_http.py`.
- `backend/tests/test_supplier_api_integration.py`.
- This document.

Reuse `e24a_suppliers`. **Without new migrations or modification of the E2-4 A scheme.**

## Validation

Check GitHub Actions (Python 3.12 and 3.14 with PostgreSQL 16, Alembic scheme and Docker). After the merge approved, in `plataforma-pyme/backend`:

~~~powershell
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check
$env:RUN_DB_INTEGRATION = "1"
try {
    .\.venv\Scripts\python.exe -m pytest -q
} finally {
    Remove-Item Env:\RUN_DB_INTEGRATION -ErrorAction SilentlyContinue
}
~~~

Construir API Docker y consultar `/ready`. In E2-4 B you can test Swagger for real routes with fictitious development data; the high manuals persist outside of tests. Do not paste tokens, passwords or third party data into messages.

## Deferred

Purchase with optional supplier, historical snapshots, full reception idempotente, stock, payments, integrated frontend, load tests and simultaneous high-name runs with independent connections. Also deferred are advanced filtering/search by contact and granular edition of promotions. Separate lane E2-3 audit.
