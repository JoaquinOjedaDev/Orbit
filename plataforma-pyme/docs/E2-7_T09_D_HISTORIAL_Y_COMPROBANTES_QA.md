# E2-7 · T09-D — Real sales records and proofs

**Rama:** `feature/e2-7-t09-consulta-recuperacion-ventas`. **Updated status:** T09-D approved IC and the **manual round of empty status in TEST Company A** 10/11/2026; manual routes with vouchers loaded continue **not executed** en la base local. **This archive retains historical evidence of the commit `abf70a80`; the subsequent and canonical acceptance act is [T09-D Real Sales History](E2-7_T09_D_HISTORIAL_VENTAS_REALES_QA.md).** T09-E also subsequently approved its tests with PostgreSQL disposable. **PR #42:** draft, without meriting `main`.

## Functional objective

Add confirmed sales query on the T09-C backend without modifying DEMO POS or enabling actual sales from the browser. Stock creation and debit operations continue to be unique to the backend; interface T09-D **Just read.**.

### Modules and navigation

- `RealAuthApp.tsx`: enable `/real/empresas/{business_id}/ventas`; revalidates the session as on other REAL screens, with Bearer only in memory.
- `RealBusinessesPage.tsx`: adds explicit access from the company's file to **REAL sales history · consultation**.
- `RealSalesPage.tsx`: list sales of the company with date, amount and headquarters; it supports filtering headquarters, uploading more, opening voucher by ID and recovering by `request_id` Original. Label permanently **REAL and read only**. Partial list is displayed until pages are completed.
- `realSalesReadGateway.ts`: GET `/sales?offset&limit&location_id`, GET `/sales/{sale_id}`, GET `/sales/by-request/{request_id}`. Strict parser of the summary DTO (without references or payment details) and full proof. Validate UUID, belonging to the tenant, amounts with HALF_UP, payments, snapshots and ID consistency requested; rejects invalid answers without DEMO failback.
- `auth.css`: styles for listing, voucher and responsive filters.

## Business rules preserved

1. **Holder and Administrator:** access to any company voucher.
2. **Maintainer and Worker:** sales of assigned headquarters only `ACTIVA`; no exceptions for having created them.
3. **Other person or membership revoked:** consultation denied by backend. The UI does not intend to be a source of permissions.
4. **Service sales without headquarters:** only holder/admin.
5. **Payment `MERCADO_PAGO_DECLARADO` and other means:** are historical statements, not bank accreditations or Market Payment.
6. **F5:** the token is lost in memory, you must re-enter; the receipt is checked by original ID/key without sending a new sale.
7. **Concurrent Pages:** If duplicate IDs appear between pages, error and full refresh option are displayed; it is not claimed to have an immutable snapshot of all sales.

## Automated QA matrix

| Case | Tool | Outcome |
|---|---|---|
| Get reading by ID, tenant and strict contract | `sales-real-read-api.test.mjs` (T09-A) | Approved on Windows and previous IC |
| Summaries without payment references, filters, valid/invalid pagination, duplicates, GET per request and inconsistent response | 6 new Node T09-D tests | **6/6 new tests approved**; total frontend 272/272 |
| React/TypeScript and Lint Construction | GitHub Actions frontend | **Approved** (TypeScript/Vite build y lint 0 errores) |
| F5/relogin, REAL list, detail by ID, recovery by request, zero POST from browser | `e2e/real/sales.spec.ts` with ephemeral API/PostgreSQL | **1/1 Playwright ventas aprobado**; 5/5 REAL as a whole |
| Roles, assignment changes, 2 tenants, sales without headquarters, listings 101+ | `test_sales_read_scope_integration.py`, PostgreSQL real | T09-C approved: 7 new tests |

The browser suite requires `PYME_DISPOSABLE_QA=1`, FastAPI `127.0.0.1:18001` and PostgreSQL ephemeral. **Do not run against local user installation**.

## QA manual checklist for user (without changing stock)

1. Synchronize T09 branch with `git pull --ff-only origin feature/e2-7-t09-consulta-recuperacion-ventas` y ejecutar `npm.cmd run test:sales-real-read` from `plataforma-pyme/frontend`.
2. With the Vite server and development API already available, log in REAL (not DEMO), open **My companies → the company TEST → Real sales history · consultation**.
3. Check the label "Read only" and that **does not exist** button to confirm or create a sale from this screen.
4. If the company has no confirmed sales: verify empty status, it does not invent DEMO records or offer ‘0 global’ for a partial charge.
5. If you have previous REAL vouchers: open one, check date, articles/snapshots, payments like **declared**, total exact and historical balance only when applicable. Filter a venue and return to ‘All authorised locations’.
6. If a `request_id` check that ID and check that it opens the same receipt, without new sale. Never generate a new key just by a 404.
7. Reload F5, re-Log in and check that history is checked without altering sales or stock.
8. Record date/captures, roles/headquarters, observed result and failures. **Do not record as executed what has not yet been tested manually.**

## Pending and scope

- **T09-D** includes history query; does not include actual POS or external payments, which will be made in T10.
- **T09-E (updated):** POST 201 response loss, GET recovery, Impotent replay and non-duplication **Playwright REAL certificates with temporary PostgreSQL**. Ver [act T09-E](E2-7_T09_E_RECUPERACION_VENTAS_IDEMPOTENCIA_QA.md).
- **T09-F** consolidate manual QA, final audit and academic closure before requesting PR #42 merge permission.

**This document does not authorize merger `main`.** The results of ICs that are not yet confirmed should remain outstanding, not as approved.


## T09-D automatic QA evidence — 10/11/2026

- Run #42906485675 — Inventario REAL full-stack + ventas REAL, **SUCCESS**, commit funcional `abf70a80`.
- Ephemeral PostgreSQL: **886/886 approved backend tests** (3 non-blocking warnings); **frontend 272/272 approved**including 16 of the sales gateway (10 T09-A + 6 T09-D); build and lint without errors or warnings.
- Playwright REAL: **5/5** (4 regressions T08 and 1 new T09-D sales route by ID/application after F5 and zero POST from browser). Playwright DEMO: **6/6**.
- Backend Python 3.12 and Python 3.14 in the same code version: success; Docker/liveness image: success.
- Previous failure of IC `d9045d8`: the old T09-A test required that the gateway have only `get`; when implementing `list` y `byRequest`, his expectation became obsolete. `abf70a8`; the integral suite passed again. It was no stock failure or permissions.
- **Local evidence, later update:** the capture of the user confirmed TEST Company A as administrative holder, REAL access, read only and empty list without error. It is documented in the [manual actuator T09-D](E2-7_T09_D_HISTORIAL_VENTAS_REALES_QA.md). There is no local manual evidence of opening a real voucher with lines and payments.

**Updated opinion:** T09-D **Technically approved**, with manual acceptance of empty query in the local environment. T09-E **approved in IC** and T09-F in audit. Sales routes with data and loss of response will not be marked as performed manually. Do not generate sales on the local basis to demonstrate this screen.
