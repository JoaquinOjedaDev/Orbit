# E2-4 — Automated testing, IC and local incident

**Cut of evidence:** 2026-11-08 · **Commit de cierre:** `4f88416141c09a82e744990b1aee8c00b9f31dfd`.
The results of IC were consulted in GitHub Actions; the results Windows and Swagger were provided by the developer. Do not attribute a local execution to IC or vice versa.

## 1. Verifiable evolution by PR

| Cut | PR | Merge | Current migration | CI Python 3.12 | CI Python 3.14 | Run |
|---|---|---|---|---|---|---|
| E2-4 A: ORM suppliers | #12 | `e322cd627ca199516c52c2e230412c0da4e3cbe6` | `e24a_suppliers` | 598 passed | 598 passed | 42511812005 |
| E2-4 B: API suppliers | #13 | `be37d7b22ec6ac0b7ef4db76d2c5eee81412af88` | `e24a_suppliers` | 693 passed | 693 passed | 42514595377 |
| E2-4 C: ORM purchases | #14 | `170d9803943392f085de5a984af142364d2865b5` | `e24c_purchases` | 717 passed | 717 passed | 42520791923 |
| E2-4 D: API purchases | #15 | `3c75ecadd20f3efffba55fadd9037f480c62417b` | `e24d_purchase_hash` | 772 passed | 772 passed | 42523855898 |
| E2-4 E: reception/stock | #17 | `782999f3783a0916faf1fc07f3154902012194c4` | `e24e_receipt_stock` | 796 passed | 796 passed | 42528940012 |
| Correction QA tests | #18 | `4f88416141c09a82e744990b1aee8c00b9f31dfd` | `e24e_receipt_stock` | **797 passed** | **797 passed** | 42530739959 |

**IC last cut:** the three works have concluded `success`: tests and PostgreSQL 16 with Python 3.12, the same with Python 3.14, and Docker construction/liveness. `alembic current` printed `e24e_receipt_stock (head)`; `alembic check`: `No new upgrade operations detected.`GitHub reported **797 passed, 1 warning** in each version; the warning does not amount to a test failure.

## 2. Windows Validation provided by the developer

After the #17 Merge, Migration `e24e_receipt_stock` and local testing with two pre-existing QA purchases:
- Primera suite: **781 passed, 15 failed** en `tests/test_purchase_integration.py` (102.35 seconds).
- Alembic: `e24e_receipt_stock (head)` y `No new upgrade operations detected.`.
- API y PostgreSQL Docker: `healthy`; `GET /ready` = `{"status":"ready","database":"ok"}`.

After the Merge #18 on commit `4f88416141c09a82e744990b1aee8c00b9f31dfd`:
- `pytest -q tests/test_purchase_integration.py`: **20 passed in 6.54s**.
- `pytest -q`: **797 passed in 95.24s**.
- Local base preserved; no purchases, users or volumes were deleted. Catches and log of origin are outside Git and do not include secrets in this closure.

## 3. Incident E2-4 — 15 local faults, root and solution

**Symptoms:** `SELECT purchase_lines.id` Without WHERE returned **three** records where the test was expected **uno**. Other tests used `scalar_one()` and found more than one row; global queries to `purchases` The first batch included two historical QA lines: one of free concept and one of physics.

**Confirmed case:** old SQL restrictions tests implicitly constituted an empty basis, although their fixture reversed the inserts of each test. They were executed against local PostgreSQL containing persistent use testing data.

**Corrigendum #18:** the assertions were limited by `business_id`, `purchase_id` y/o `request_id` of the case itself, and a regression was added with more than one tenant. **No** APIs, business rules, tables and migrations were altered to silence the bugs.

**Additional debt not resolved:** the local runner test can still aim at the development base. Filtering assertions solves contamination of results, but **does not amount to a physically separate environment**. It is recommended base `pyme_test_db` or ephemeral container, with independent URL/test credentials and fail-closed check to prevent execution against production. It must be implemented in a later block with tests, without erasing the existing base or altering `conftest.py` blind.

## 4. E2-4 test coverage — what was verified

| Component | Representative families | What they guarantee within reach |
|---|---|---|
| Suppliers | `test_supplier_model.py`, `test_supplier_integration.py`, `test_supplier_schemas.py`, `test_supplier_http.py`, `test_supplier_api_integration.py` | restrictions, canonical name by tenant, RBAC, REST responses, 401/403/404/409/422 and rollback |
| Purchases | `test_purchase_model.py`, `test_purchase_integration.py`, `test_purchase_http.py`, `test_purchase_api_integration.py` | snapshots, optional supplier, whole figures, HALF_UP calculation, idempotency, tenant integrity, stock absence when registering |
| Receipt | `test_receipt_models.py`, `test_receipt_http.py`, `test_receipt_api_integration.py` | single physical purchase, suitable destination, STORE permissions, states, duplicate rejection, rollback, historical input and balance |
| Concurrence | `test_receipt_concurrency_integration.py` | two purchases entering in balance initially absent; two requests for one purchase; simultaneous retry |
| Scheme | `test_postgres_integration.py` y `alembic check` | current migration, real connection and driftless scheme |

Concurrent tests are functional in PostgreSQL, **no** load benchmarks or resilience tests for infrastructure failures. Numerical coverage of type code `coverage.py` **was not measured**: 797/797 is number of approved cases, not percentage of covered lines.

## 5. Used Commands and Re-Implementation

From `plataforma-pyme/backend/` in PowerShell, based on a micro- and **never production**:

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check
$env:RUN_DB_INTEGRATION = "1"
try {
    .\.venv\Scripts\python.exe -m pytest -q tests/test_purchase_integration.py
    .\.venv\Scripts\python.exe -m pytest -q
} finally {
    Remove-Item Env:\RUN_DB_INTEGRATION -ErrorAction SilentlyContinue
}
```

From `plataforma-pyme/`: `docker compose --profile api up -d --build --wait api`, `docker compose ps` y `Invoke-RestMethod http://127.0.0.1:18000/ready`.

**No ejecutar:** `docker compose down -v`, `TRUNCATE`, `DROP`, `alembic downgrade`, `alembic stamp` nor clean QA records to achieve green.

## 6. Manual evidence and pending

The detailed logbook is in [02_BITACORA_PRUEBAS_SWAGGER.md](02_BITACORA_PRUEBAS_SWAGGER.md) and the QA resource catalogue in [06_FIGHT_Data_QA.md](06_FICHA_DATOS_QA.md). Complete manual verification of CRUD Suppliers **does not have comprehensive HTTP transcription**; do not claim that there was. Covered by automatic tests and IQ, but pending a specific manual log if the teacher demands it.
