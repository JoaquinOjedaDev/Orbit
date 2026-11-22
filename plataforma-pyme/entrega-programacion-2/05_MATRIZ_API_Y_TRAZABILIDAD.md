# 05 — API matrix, permissions and traceability

**Current version of query:** E2-7/T12-B, 11/11/2026. **Audited code:** `main` `c6a77137cf82dcb9aad225645e84b1265b1da3ec` (PR #45).  
**Status:** Real API v1 + REAL React for RF-01 to RF-07, with **46 endpoints declarados en routers** and 12 nuclear CU. RF-08–RF-10 remain exclusively DEMO/deferred.  
**Scope of the review:** reconcile concrete FastAPI paths, React screen and reproducible test. This matrix **does not authorise** banking functionalities or changes in permits.

> **Documentary Precedence:** the inventory and the following matrices are the view **AS-IMPLEMENTED** from T12-B. The complete original material is later shown as **historical E2-1 to E2-5**, even when using "current", "RF-07" or "React follows DEMO" expressions or TO-BE tables: these statements were correct * at their cut-off date*, but no longer represent the status of `main` post-T11. Conceptual map ↔ ORM ★ SQL was reconciled in the [Document 03 v2.1](03_MODELO_DE_DOMINIO_Y_UML.md) and in 03A/03B/03C (T12-C). The scope of this matrix remains RF/CU→API→UI→test; it does not amount to additional testing.

## 1. Current master table — RF → CU → API → UI → test

Convention: `B` = `/api/v1/businesses/{business_id}`; `E` = `/real/empresas/{business_id}`. The paths in the API column are **representative**: the comprehensive inventory of methods and routes is in section 2.

| RF | CU/verifiable result | API and effective authorization | React REAL | Main evidence |
|---|---|---|---|---|
| **RF-01** | **CU-01** identity registration | `POST /api/v1/auth/register`; public validation, single email | `/real/registro`, `RealAuthApp.tsx` | `auth-registration-ui.spec.ts`; tests de registro |
| **RF-01** | **CU-02** login, identity, logout | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`; Revocable Bearer | `/real/login`, `/real/perfil` | `auth-registration-ui.spec.ts`, `security-navigation.spec.ts` |
| **RF-02** | **CU-03** create/consult/edit company | `POST/GET /businesses`, `GET/PATCH B`; membership/tenant/rol, creation of the idempotent | `/real/empresas`, `/real/empresas/nueva`, `E` | `security-navigation.spec.ts`, backend of companies |
| **RF-02** | **CU-12** invitations, acceptance, equipment | `POST B/invitations`, `POST /invitations/accept`, `GET/PATCH B/memberships...`, `GET/PUT B/locations/{location_id}/assignments...`; protected roles | `E/equipo`, `/real/invitaciones/aceptar` | `test_business_acceptance_*.py`, `test_business_team_*.py`, manual T11 |
| **RF-03** | **CU-04** headquarters, states, principal, assignment | `B/locations` (GET/POST/PATCH/PUT according to route); SELL/STORE and own allocations | `E/ubicaciones`, `RealLocationsPage.tsx` | `business-crud-persistence.spec.ts`, `assigned-location-visibility.spec.ts` |
| **RF-04** | **CU-05** catalogue goods/services with status and price | `B/catalog` (GET/POST/PATCH); name/SKU by company, roles and pagination | `E/catalogo`, `RealCatalogPage.tsx` | `business-crud-persistence.spec.ts`, `pos-draft.spec.ts` |
| **RF-05** | **CU-06** supplier and purchase without stock | `B/suppliers` (Credit and status), `B/purchases` (POST/GET); proveedor y snapshots | `E/proveedores`, `E/compras` | `purchase-ui-persistence.spec.ts`, `business-crud-persistence.spec.ts` |
| **RF-05+RF-06** | **CU-07** Full physical reception | `POST B/purchases/{purchase_id}/receive`, `GET .../receipt`; sede STORE y replay | `E/compras`, `RealReceiptDetail.tsx` | `flow-purchase-to-sale.spec.ts`, `purchase-ui-persistence.spec.ts` |
| **RF-06** | **CU-08** saldo/version/ledger | `GET B/inventory/balances`, `GET B/inventory/movements` | `E/inventario`, `RealInventoryPage.tsx` | `inventory.spec.ts`; manual reconciliation T11 |
| **RF-06** | **CU-09** atomic transfer | `POST B/inventory/transfers`, `GET .../{transfer_id}`; STORY at origin and destination | `E/inventario`, `RealTransferPanel.tsx` | `inventory.spec.ts`, `assigned-location-visibility.spec.ts` |
| **RF-06** | **CU-11** adjustment with version and initial stock | `POST B/inventory/adjustments`, `GET .../{adjustment_id}`; STORE, ROLE, `expected_version` | `E/inventario`, `RealAdjustmentPanel.tsx` | `inventory.spec.ts`, `security-errors.spec.ts` |
| **RF-07** | **CU-10** POS, sale, voucher and recovery | `POST/GET B/sales`, `GET B/sales/{sale_id}`, `GET B/sales/by-request/{request_id}`; SELL, role/price and key idempotent | `E/pos`, `E/ventas`, `RealPosPage.tsx`, `RealSalesPage.tsx` | `pos-draft.spec.ts`, `flow-purchase-to-sale.spec.ts`, `sales-recovery.spec.ts`, `sales-invalid-payment-policy.spec.ts` |
| **RF-08** | Cash and cash-flows | **Sin router real equivalente** | `/b/{demoId}/gastos`, `/b/{demoId}/jornadas` | `demo-money-isolation.spec.ts`; DEMO |
| **RF-09** | Reference financial accounts | **Sin router real equivalente** | `/b/{demoId}/cuentas` | `demo-money-isolation.spec.ts`; DEMO |
| **RF-10** | Illustrative QR attempts | **Sin cobro REAL ni endpoints OAuth/webhook MP** | `/b/{demoId}/ventas`, `QrDemoPanel.tsx` | `demo-money-isolation.spec.ts`; DEMO |

**UC precisions:** CU-11 corresponds to **RF-06** (No RF-07); CU-07 supports RF-05+RF-06, but does not involve second partial reception; CU-12 encompasses invitation, acceptance and management of equipment, not public discharge by QR. In worker SELL/STORE operations, **active assignment to each headquarters** is additional to the role: a worker who only operates at one headquarters cannot make transfer with another. General consultation of balance sheets per company

## 2. Complete inventory of FastAPI v1 routes implemented

**Source of truth:** los `APIRouter(prefix=...)` and decorators `@router.get/post/patch/put` in the **13 routers really mounted** por [`backend/app/api/v1/router.py`](../backend/app/api/v1/router.py). The following routes are **relativas a `/api/v1`**. For example, `GET /businesses` means `GET /api/v1/businesses`. Included **46 operations**; different methods in the same URL count as distinct operations. Outside this business map they are `GET /health` (liveness) y `GET /ready` (BD re-admission), not prefixed with `/api/v1`.

| Method | Low path `/api/v1` | RF / CU | Definition file |
|---|---|---|---|
| `POST` | `/auth/register` | RF-01; CU-01/02 | [`auth/router.py`](../backend/app/modules/auth/router.py) |
| `POST` | `/auth/login` | RF-01; CU-01/02 | [`auth/router.py`](../backend/app/modules/auth/router.py) |
| `GET` | `/auth/me` | RF-01; CU-01/02 | [`auth/router.py`](../backend/app/modules/auth/router.py) |
| `POST` | `/auth/logout` | RF-01; CU-01/02 | [`auth/router.py`](../backend/app/modules/auth/router.py) |
| `POST` | `/businesses` | RF-02; CU-03/12 | [`businesses/router.py`](../backend/app/modules/businesses/router.py) |
| `GET` | `/businesses` | RF-02; CU-03/12 | [`businesses/router.py`](../backend/app/modules/businesses/router.py) |
| `GET` | `/businesses/{business_id}` | RF-02; CU-03/12 | [`businesses/router.py`](../backend/app/modules/businesses/router.py) |
| `PATCH` | `/businesses/{business_id}` | RF-02; CU-03/12 | [`businesses/router.py`](../backend/app/modules/businesses/router.py) |
| `POST` | `/businesses/{business_id}/invitations` | RF-02; CU-03/12 | [`businesses/router.py`](../backend/app/modules/businesses/router.py) |
| `GET` | `/businesses/{business_id}/memberships` | RF-02; CU-03/12 | [`businesses/router.py`](../backend/app/modules/businesses/router.py) |
| `PATCH` | `/businesses/{business_id}/memberships/{membership_id}` | RF-02; CU-03/12 | [`businesses/router.py`](../backend/app/modules/businesses/router.py) |
| `POST` | `/invitations/accept` | RF-02; CU-12 | [`businesses/invitations_router.py`](../backend/app/modules/businesses/invitations_router.py) |
| `GET` | `/businesses/{business_id}/locations` | RF-03; CU-04 | [`locations/router.py`](../backend/app/modules/locations/router.py) |
| `GET` | `/businesses/{business_id}/locations/my-assignments` | RF-03; CU-04 | [`locations/router.py`](../backend/app/modules/locations/router.py) |
| `GET` | `/businesses/{business_id}/locations/{location_id}` | RF-03; CU-04 | [`locations/router.py`](../backend/app/modules/locations/router.py) |
| `POST` | `/businesses/{business_id}/locations` | RF-03; CU-04 | [`locations/router.py`](../backend/app/modules/locations/router.py) |
| `PATCH` | `/businesses/{business_id}/locations/{location_id}` | RF-03; CU-04 | [`locations/router.py`](../backend/app/modules/locations/router.py) |
| `PATCH` | `/businesses/{business_id}/locations/{location_id}/status` | RF-03; CU-04 | [`locations/router.py`](../backend/app/modules/locations/router.py) |
| `PUT` | `/businesses/{business_id}/locations/{location_id}/primary` | RF-03; CU-04 | [`locations/router.py`](../backend/app/modules/locations/router.py) |
| `GET` | `/businesses/{business_id}/locations/{location_id}/assignments` | RF-02/03; CU-04/12 | [`locations/assignment_router.py`](../backend/app/modules/locations/assignment_router.py) |
| `PUT` | `/businesses/{business_id}/locations/{location_id}/assignments/{membership_id}` | RF-02/03; CU-04/12 | [`locations/assignment_router.py`](../backend/app/modules/locations/assignment_router.py) |
| `GET` | `/businesses/{business_id}/catalog` | RF-04; CU-05 | [`catalog/router.py`](../backend/app/modules/catalog/router.py) |
| `GET` | `/businesses/{business_id}/catalog/{item_id}` | RF-04; CU-05 | [`catalog/router.py`](../backend/app/modules/catalog/router.py) |
| `POST` | `/businesses/{business_id}/catalog` | RF-04; CU-05 | [`catalog/router.py`](../backend/app/modules/catalog/router.py) |
| `PATCH` | `/businesses/{business_id}/catalog/{item_id}` | RF-04; CU-05 | [`catalog/router.py`](../backend/app/modules/catalog/router.py) |
| `PATCH` | `/businesses/{business_id}/catalog/{item_id}/status` | RF-04; CU-05 | [`catalog/router.py`](../backend/app/modules/catalog/router.py) |
| `GET` | `/businesses/{business_id}/suppliers` | RF-05; CU-06 | [`suppliers/router.py`](../backend/app/modules/suppliers/router.py) |
| `GET` | `/businesses/{business_id}/suppliers/{supplier_id}` | RF-05; CU-06 | [`suppliers/router.py`](../backend/app/modules/suppliers/router.py) |
| `POST` | `/businesses/{business_id}/suppliers` | RF-05; CU-06 | [`suppliers/router.py`](../backend/app/modules/suppliers/router.py) |
| `PATCH` | `/businesses/{business_id}/suppliers/{supplier_id}` | RF-05; CU-06 | [`suppliers/router.py`](../backend/app/modules/suppliers/router.py) |
| `PATCH` | `/businesses/{business_id}/suppliers/{supplier_id}/status` | RF-05; CU-06 | [`suppliers/router.py`](../backend/app/modules/suppliers/router.py) |
| `POST` | `/businesses/{business_id}/purchases` | RF-05; CU-06 | [`purchases/router.py`](../backend/app/modules/purchases/router.py) |
| `GET` | `/businesses/{business_id}/purchases` | RF-05; CU-06 | [`purchases/router.py`](../backend/app/modules/purchases/router.py) |
| `GET` | `/businesses/{business_id}/purchases/{purchase_id}` | RF-05; CU-06 | [`purchases/router.py`](../backend/app/modules/purchases/router.py) |
| `POST` | `/businesses/{business_id}/purchases/{purchase_id}/receive` | RF-05/06; CU-07 | [`purchases/receipt_router.py`](../backend/app/modules/purchases/receipt_router.py) |
| `GET` | `/businesses/{business_id}/purchases/{purchase_id}/receipt` | RF-05/06; CU-07 | [`purchases/receipt_router.py`](../backend/app/modules/purchases/receipt_router.py) |
| `GET` | `/businesses/{business_id}/inventory/balances` | RF-06; CU-08 | [`purchases/inventory_router.py`](../backend/app/modules/purchases/inventory_router.py) |
| `GET` | `/businesses/{business_id}/inventory/movements` | RF-06; CU-08 | [`purchases/inventory_router.py`](../backend/app/modules/purchases/inventory_router.py) |
| `POST` | `/businesses/{business_id}/inventory/transfers` | RF-06; CU-09 | [`purchases/transfer_router.py`](../backend/app/modules/purchases/transfer_router.py) |
| `GET` | `/businesses/{business_id}/inventory/transfers/{transfer_id}` | RF-06; CU-09 | [`purchases/transfer_router.py`](../backend/app/modules/purchases/transfer_router.py) |
| `POST` | `/businesses/{business_id}/inventory/adjustments` | RF-06; CU-11 | [`purchases/adjustment_router.py`](../backend/app/modules/purchases/adjustment_router.py) |
| `GET` | `/businesses/{business_id}/inventory/adjustments/{adjustment_id}` | RF-06; CU-11 | [`purchases/adjustment_router.py`](../backend/app/modules/purchases/adjustment_router.py) |
| `POST` | `/businesses/{business_id}/sales` | RF-07; CU-10 | [`sales/router.py`](../backend/app/modules/sales/router.py) |
| `GET` | `/businesses/{business_id}/sales` | RF-07; CU-10 | [`sales/router.py`](../backend/app/modules/sales/router.py) |
| `GET` | `/businesses/{business_id}/sales/by-request/{request_id}` | RF-07; CU-10 | [`sales/router.py`](../backend/app/modules/sales/router.py) |
| `GET` | `/businesses/{business_id}/sales/{sale_id}` | RF-07; CU-10 | [`sales/router.py`](../backend/app/modules/sales/router.py) |

### Safety and consistency contract (transverse)

- **Identity:** `/auth/register` public; `/auth/login` returns token opaque; `/auth/me` y `/auth/logout` require valid session. React maintains token **en memoria**, without keeping it after F5. No verified mail or refresh token is presumed.
- **Tenant:** UUIDs do not grant access. Each real operation verifies the company and membership, protects states and actor. `404` may conceal another's resource; `403` denies a role/permit action; `401` invalid credentials. A GET query on seat balances of the same tenant may be global by MVP policy, without allowing unallocated operations.
- **Locations:** `can_sell` y `can_store` are independent capabilities. `GET /businesses/{business_id}/locations/my-assignments` only consults IDs assigned to the actor, does not allow to manage equipment; `GET/PUT .../{location_id}/assignments` remains restricted by administrative privileges.
- **Purchases:** `POST /purchases` save snapshots; do not choose reception or alter inventory. `POST /receive` confirms **a full reception** The service is not artificially transformed into stock and there is no empty reception.
- **Stock:** atomic balance + ledger is maintained signed, quantity in thousandths and versioned. The transfers debit and credit in a single commit; adjustments with obsolete version, insufficient stock or repeated initial stock respond conflict without false movement.
- **Sales:** REAL POS requires SELL headquarters authorized for goods. Prices/discounts are also verified in FastAPI; stated payments add up to exactly the total. Money is stored in whole and total cents per line HALF_UP; **no automatic bank accreditation**.
- **Idempotency and recovery:** `Idempotency-Key` UUID4 for high/transactional commands requiring it; same key and body recovers result `200`initial operation `201`; re-used key with other content or actor is rejected. Loss of response/timeout: check proof by `request_id`never forward a command automatically with another key.
- **Expected errors according to operation:** `401` session, `403` authorisation, `404` out of reach, `409` conflict transactional/idempotency/stock/version, `422` scheme/fields; and `5xx`/red as uncertain failure. This list is **cross-sectional**: does not state that each endpoint produces all these codes.
- **DEMO:** routes `/b/{demoId}/...` preserve local storage and QR intentions **illustrative**, without paying or consulting the REAL API. Do not perform fictional migration of DEMO IDs to UUID FastAPI.

## 3. Capability traceable test matrix

| Coverage | Files / Evidence | Accredited result |
|---|---|---|
| Identity, registration, session, logout, F5 | `frontend/e2e/real/auth-registration-ui.spec.ts`, `security-navigation.spec.ts`, `responsive-keyboard.spec.ts` | REAL browser → API/BD, tokens in memory |
| Tenancy, late responses, 401/403/404, roles and venues | `security-navigation.spec.ts`, `security-errors.spec.ts`, `assigned-location-visibility.spec.ts` | Change A/B without leak, denied access by others, filtered SELL/STORE headquarters |
| Headquarters, catalog, CRUD supplier and persistence | `business-crud-persistence.spec.ts`, `mobile-core-navigation.spec.ts` | High/states and F5 in REAL; mobile smoke |
| Buy well+free concept, reception and power | `purchase-ui-persistence.spec.ts`, `flow-purchase-to-sale.spec.ts` | No stock previous, reception once, physical leader |
| Balances, transfer, counting, adjustment and attendance | `inventory.spec.ts`; `backend/tests/test_*concurrency_integration.py` | Par signed, version, rollback, one effect |
| Physical and mixed sale, two payments, price/discount, replay 201 lost | `pos-draft.spec.ts`, `sales-recovery.spec.ts`, `sales-invalid-payment-policy.spec.ts`, `flow-purchase-to-sale.spec.ts` | Checker, physical debit, 409 and 422, recovery without duplication |
| DEMO QR/box/accounts isolation | `demo-money-isolation.spec.ts`DEMO tests | Zero actual operations from IU DEMO |
| Owner/worker manual and headquarters retest | [39 steps Minutes](../docs/E2-7_T11_D2_ACTA_PRUEBA_MANUAL_REAL.md) y [T11-E fix](../docs/E2-7_T11_E_FIX_SEDES_ASIGNADAS_QA.md) | Two corrected permissions defects; revised conversational captures, not reversed |

**Reference regression:** PR #45 fusionado, full-stack #43015544889 — **892 Pytest, 38 Playwright REAL, 6 Playwright DEMO PASS**. CI frontend #43015544947 y backend #43015544819 SUCCESS. Matriz de [26 scenarios E27](../docs/E2-7_T11_E_AUDITORIA_FINAL_PREMERGE.md) Approved **in its functional scope/smoke**, not universal security guarantee/WCAG. Manual QA captures were observed in conversation; they were not attached to the repository.

## 4. Risks, declarations of scope and continuity T12

1. **RF-01 a RF-07** are REAL academic core; **RF-08 a RF-10** DEMO/deferred; transfer with asynchronous logistics reception, returns, prescription production, bookings and MP payments webhooks remain outside the MVP.
2. Local REAL POS remains disabled for recording default sales except `VITE_PYME_ENABLE_REAL_SALES` in explicitly authorized environment. Tests with writing ran on PostgreSQL **disposable**, not on the persistent basis `TEST Empresa A`.
3. REAL payments are **declared**IndexedDB retains some pending business intentions without encryption; do not store tokens there; avoid shared devices. Pydatic warnings remain `UnsupportedFieldAttributeWarning` not blocking.
4. Do not infer UML parity from conceptual names. **T12-C** confront 03A/03B/03C with SQLAlchemy/Allembic tables and their graphic representation; **T12-D** update README, architecture and reproducible procedures; **T12-E** shall verify that the documents do not contradict the last `main`.

---

## History file — incremental matrix prior to closure T12 (preserved)

The next matrix is the **full pre-document**, including additions and tables by cut E2-1..E2-5. It is preserved for an audit of evolution; ‘pending’ or ‘existing status’ in its paragraphs refers **only** the specified time cut and does not replace the current sections of T12-B above.

> **ADENDA VIGENTE E2-5 (09/11/2026; prevails over historical states of this matrix):** RF-06/CU-08 (balances y ledger), **CU-09 (transfers)** y **CU-11 (ajustes y stock inicial)** are implemented in backend and tested in the cut `main` `748e69319d8d04900c009d5184168a264a9deeac` (PR #21–#23), `e25a_inventory_ops`, CI 816/826/840 tests per cut in Python3.12./3.14 and Windows E2-5 C 840 tests reported. **CU-11 belongs to RF-06**, not to RF-07: any historical row of this matrix that labels CU-11 under RF-07 is outdated. **RF-07/CU-10 Real sales continue DIFFERENT**. The E2-5 endpoints added are `GET /inventory/balances`, `GET /inventory/movements`, `POST/GET /inventory/transfers` y `POST/GET /inventory/adjustments` low `/api/v1/businesses/{business_id}`. Esta adenda **does not rewrite historical tables** previous versions; consult the [closure E2-5](../docs/revisiones/E2-5_CIERRE/00_LEEME.md) y el [audit commission pending implementation](../docs/revisiones/E2-5_ENTREGA_PARA_REVISION.md). **React ↔ backend integration, production hardening and independent auditing are not completed**.

### 05 — API matrix, permissions and traceability (historical version)

**Project:** Orbit — Programming 2  
**Version:** 1.5 — E2-3 E, real catalogue and 580 Windows tests
**Date:** 8 November 2026  
**Status:** incremental technical publication; academic approval of pending equipment  
**Reference:** `main` repository, exclusive folder `plataforma-pyme/`.

> **State in force E2-2 (08/11/2026):** RF-03/CU-04 and E2-2 A/A.1/B/C/D implemented, with locations, partner assignments, tenant authorization and reusable operational policy. **371/371 tests on Windows (47.57s)**; `e22d_assignments (head)`; Alembic without pending operations; Docker FastAPI/PostgreSQL `healthy` y `/ready` = `ready/ok`. IC code E2-2 D: 3/3 and 371 tests in Python 3.12 and 3.14. **No** React–API integration and commercial purchases/stock/sales transactions that consume the policy are still in place; they correspond to later blocks. The previous cut-off paragraphs that mention validations or "pending" functions are retained as **history**, not as current state. The integral TP is not declared finished.


## 1. Purpose and vocabulary of evidence

This file combines requirements (01), use cases (02), models/UML (03), architecture decisions (04), endpoints, access controls and actual tests. **IMPLEMENTED** (code in Git), **LOCALLY VALUE** (Developer evidence), **CITIZENED** (GitHub Actions checked in a specific execution) and **PLANNING** (TO-BE). The Frontend React continues as DEMO independent of the backend. WALOS is just an example client.

**Closing E2-1 / C.5 — 08/11/2026:** C.1 (98), C.2 (125), C.3 (147), C.4a (171) y **C.4b (195/195 approved local tests; `195 passed in 23.86s`)**. Alembic `e213c4_acceptance (head)`, `No new upgrade operations detected.`; Docker FastAPI/PostgreSQL `healthy` y `/ready` = `ready`/`ok`. GitHub Actions **3/3** corresponde al commit funcional `8cd1674`. C.5 es **documentary only**; no re-execution of evidence or change of endpoints, SQL models or migrations. React follows DEMO; RF-03–RF-07 has no backend; title transfer, mail verification and hardening for production remain pending.

## 2. State by request and case of use

| RF | CU | API Status | Verifiable scope/outstanding |
|---|---|---|---|
| RF-01 | CU-01 | Implemented; locally validated | `POST /api/v1/auth/register`; hash Argon2id, single email, 201/409/422 |
| RF-01 | CU-02 | Implemented; locally validated | `POST /api/v1/auth/login`, `GET /me`, `POST /logout`; revocable meetings, 401 |
| RF-02 | CU-03 | Locally validated high, reading and PATCH | Company with initial holder, idempotency and editing authorized by tenant/rol |
| RF-02 | CU-12a / CU-12b and management | Locally validated emission/acceptance; **C.4b locally validated with 195 tests and CI 3/3** | Issue, accept, consult equipment and edit protected title roles/states |
| RF-03 | CU-04 | **E2-2 B/C/D: location and assignments by headquarters with 371 CI tests** | Six location routes + GET/PUT allocations; FK composed by company; commercial use of policy still pending |
| RF-04 | CU-05 | **E2-3 B: four initial CRUD routes, CI 498 approved tests; Windows pending** | Business catalogue, RBAC, unique name/SKU, goods/services and nullable price; enable/disable pending C |
| RF-05 | CU-06, CU-07 | Planned | Separate purchase from full physical reception |
| RF-06 | CU-08, CU-09 | Planned | Balances, movements, non-negative stock, concurring |
| RF-07 | CU-10, CU-11 | Planned | Sales, declared payments and monetary restrictions |
| RF-08–10 | Out first MVP backend | Deferred | Expenditure/box, accounts and QR DEMO |

## 3. Actually existing HTTP contracts

| Method | Path | Actual security in force | Main response | Test |
|---|---|---|---|---|
| GET | `/health` | Public, livingness | 200 `status=ok` | `test_health.py` |
| GET | `/ready` | Local public, PostgreSQL connectivity | 200/503 | `test_readiness.py` |
| POST | `/api/v1/auth/register` | Public, Pydatic/SQL validation | 201, 409, 422 | `test_auth_registration_integration.py` |
| POST | `/api/v1/auth/login` | Credentials, Argon2id | 200 bearer/401 | `test_auth_session_integration.py` |
| GET | `/api/v1/auth/me` | Current Bearer and active account | 200/401 | `test_auth_session_integration.py` |
| POST | `/api/v1/auth/logout` | Bearer in force | 204/401 | `test_auth_session_integration.py` |
| POST | `/api/v1/businesses` | Current global active user Bearer; **no previous membership** | 201 new; 200 retry; 409 different payload | `test_business_creation_integration.py` |
| GET | `/api/v1/businesses` | Bearer + membership filter `ACTIVA` | 200 own list | `test_business_creation_integration.py` |
| GET | `/api/v1/businesses/{business_id}` | Bearer + active membership in that tenant | 200 of its own; 404 of its own | `test_business_creation_integration.py` |
| PATCH | `/api/v1/businesses/{business_id}` | Bearer + session and membership transactional revalidation + `business.profile.edit` | 200; 401/403/404/409/422 | `test_business_update_*.py`, **125 local tests approved in C.2** |
| POST | `/api/v1/businesses/{business_id}/invitations` | Bearer + Active membership/licensed roll + active company + mail/rol validated in transaction | 201; 401/403/404/409/422 | `test_business_invitation_schemas.py` y `test_business_invitation_integration.py`; **147 local tests approved in C.3** |
| POST | `/api/v1/invitations/accept` | Bearer + recipient account matches guest mail + current PENDENT invitation + active company; commit unique | 200; 401/404/409/422 | `test_business_acceptance_*.py`, **171 local tests in C.4a** |
| GET | `/api/v1/businesses/{business_id}/memberships` | Bearer + active own membership; permission `members.read` (holder/manager); active undertaking | 200; 401/403/404/409 | `test_business_team_schemas.py`, `test_business_team_integration.py` **(195 local tests; CI 3/3)** |
| PATCH | `/api/v1/businesses/{business_id}/memberships/{membership_id}` | Bearer + current title role; objective member of the same non-holder tenant; permission `members.manage`; transaction with lockdown | 200; 401/403/404/409/422 | `test_business_team_schemas.py`, `test_business_team_integration.py` **(195 local tests; CI 3/3)** |
| POST | `/api/v1/businesses/{business_id}/locations` | Bearer + membership `ACTIVA` and role holder/manager + company `ACTIVA` + DTO estricto | 201; 401/403/404/409/422 | `test_location_schemas.py`, `test_location_http.py`, `test_location_api_integration.py` **(277 CI tests; pending premises)** |
| GET | `/api/v1/businesses/{business_id}/locations` | Bearer + own active membership; company `ACTIVA`/`SUSPENDIDA` (reading) | 200 own list; 401/403/404 | `test_location_http.py`, `test_location_api_integration.py` |
| GET | `/api/v1/businesses/{business_id}/locations/{location_id}` | Bearer + Active membership and simultaneous company and location filter | 200 of its own; 401/403/404 | `test_location_http.py`, `test_location_api_integration.py` |
| PATCH | `/api/v1/businesses/{business_id}/locations/{location_id}` | Bearer + holder/manager role, active company; partial DTO without protected fields | 200; 401/403/404/409/422 | `test_location_schemas.py`, `test_location_http.py`, `test_location_api_integration.py` |
| PATCH | `/api/v1/businesses/{business_id}/locations/{location_id}/status` | Bearer + authorized role; `ACTIVA/PAUSADA`; pause main recall | 200; 401/403/404/409/422 | `test_location_schemas.py`, `test_location_api_integration.py` |
| PUT | `/api/v1/businesses/{business_id}/locations/{location_id}/primary` | Bearer + Authorized Role; Active Location; Transfer within a Tenant and Transaction | 200; 401/403/404/409 | `test_location_http.py`, `test_location_api_integration.py` |
| GET | `/api/v1/businesses/{business_id}/locations/{location_id}/assignments` | Bearer + holder/manager; seat of same tenant | 200; 401/403/404 | `test_location_assignment_http.py`, `test_location_assignment_integration.py` |
| PUT | `/api/v1/businesses/{business_id}/locations/{location_id}/assignments/{membership_id}` | Bearer + holder/manager; `status` ACTIVA/REVOCADA; objective of the same tenant | 200; 401/403/404/409/422 | `test_location_assignment_schemas.py`, `test_location_assignment_integration.py` |
| POST | `/api/v1/businesses/{business_id}/catalog` | Bearer + holder/manager + ACTIVA company; SKU/standard name | 201; 401/403/404/409/422 | `test_catalog_schemas.py`, `test_catalog_http.py`, `test_catalog_api_integration.py` |
| GET | `/api/v1/businesses/{business_id}/catalog` | Bearer + Active membership; own company, allows suspended | 200; 401/403/404/422 | `test_catalog_http.py`, `test_catalog_api_integration.py` |
| GET | `/api/v1/businesses/{business_id}/catalog/{item_id}` | Bearer + Active Membership, UUID article within the company | 200; 401/403/404 | `test_catalog_api_integration.py` |
| PATCH | `/api/v1/businesses/{business_id}/catalog/{item_id}` | Bearer + holder/manager, active company; partial DTO without state or tenant | 200; 401/403/404/409/422 | `test_catalog_schemas.py`, `test_catalog_api_integration.py` |
| PATCH | `/api/v1/businesses/{business_id}/catalog/{item_id}/status` | Bearer + holder/manager, tenant ASSETS, exclusive ASSETS/INACTIVA | 200; 401/403/404/409/422 | `test_catalog_schemas.py`, `test_catalog_http.py`, `test_catalog_api_integration.py` |

**Idempotency CU-03:** `Idempotency-Key` UUID4, scope `actor_user_id` + clave; `business_creation_requests` preserves canonical hash and `business_id`. La **Composite PK** maintain the uniqueness even with concurring. Reusing the key with other content returns 409; recovery was corrected after concurrent conflicts over `pk_business_creation_requests` en E2-1.3C.1.

**Sesiones:** The token Bearer is a secret; only the SHA-256 footprint is kept to search for/remove sessions. The disabled account or expired session cannot read or create businesses.

## 4. RBAC E2-1.3C.1 policy and first actual implementation E2-1.3C.2

| Capacity | ADMINISTRATIVE SERVICE | ADMINISTRATOR | MANAGER | STAFF MEMBER | HTTP status |
|---|---|---|---|---|---|
| `business.view` | Yes | Yes | Yes | Yes | Current reading filters by active membership; pure policy integration in C.2 |
| `business.profile.edit` | Yes | Yes | No | No | **Implemented/validated C.2 (125 tests)** |
| `members.invite` | Yes | Yes | No | No | **Implemented/validated C.3 (147 tests)** |
| `members.read` | Yes | Yes | No | No | **C.4b GET validated (195 tests and CI 3/3)** |
| `members.manage` | Yes | No | No | No | **C.4b Validated PATCH (195 tests and CI 3/3)** |

**States:** membership `INACTIVA` never authorizes; an unknown role or new permission is denied by default (*fail closed*). `SUSPENDIDA` allows only information reading to active members; no modifications, invitations or member administration. **does not replace** check the exact company in SQL or the validity of the token. A holder of Company A does not acquire permits in Company B by name of its role.

**MVP decision:** el rol `ENCARGADO` future capabilities of catalog, inventory, purchases and sales should have specific permissions of their own, with tests and documentation by CU; they are not automatically deduced from this table.

### HTTP behavior implemented and validated from C.2

| Case | HTTP expected | Reason |
|---|---|---|
| No session, token expired/revocated | 401 | Not authenticated |
| Non-existent or non-active member company | 404 | Do not expose foreign companies |
| Active Member without editing permission | 403 | Own company, action refused |
| Active member with permission, company `SUSPENDIDA` | 409 | Non-editable status |
| Holder/Manager, Active Company, Valid Changes | 200 | Atomic update |
| Invalid data / empty body | 422 | Validation of contract |

The above codes are defined in the C.2 router and have written proofs; **were validated in C.2 (125 tests) and subsequent regressions up to 195**. 403 requires active membership without permission; 409 requires apt role but company `SUSPENDIDA`.

## 5. Entities, migrations and rules of integrity

| Review | Tables/Restriction | Status |
|---|---|---|
| `e2003_baseline` | `alembic_version`, sin dominio | Validate |
| `e2101_users` | `users`, email UNIQUE, hash and states | Validate |
| `e212b_sessions` | `auth_sessions`, token hash UNIQUE, FK and expiration | Validate |
| `e213a_business_members` | `businesses`, `memberships`, UNIQUE company/user, single active index | Validate |
| `e213b_business_creation` | `business_creation_requests`, PK composed actor/key, digest SHA-256 and single business by command | Validate |
| `e213c3_invitations` | `business_invitations`, unique token SHA-256, FK company/inviter, states, expiration and partial index mail pending per tenant | Locally valid C.3 |
| `e213c4_acceptance` | Columns `accepted_by_user_id`, `accepted_at`, FK user and consistent audit CHECK | Locally validated C.4a; C.4b without migration |
| `e22a_locations` | Tabla `locations`, FK to company, CHECK of states/types/main, single partial index of principal per company | E2-2 A: 212 approved local tests, CI 3/3 |
| `e22b_location_casa` | Type-enhanced CHECK to support `CASA` without modifying previous outline | E2-2 A.1: 217 CI backend tests; frontend 2/2; Windows pending |
| `e22d_assignments` | Tabla `location_assignments`, FK composites, UNIQUE auxiliary in `locations` and CHECK of revocation | 371 CI / Windows tests to be checked |

En E2-1.3C.1 y C.2 **no tables or migrations added**; C.3 incorporates new table `business_invitations` The UML 03A represents conceptual links; politics should not be drawn as a persistent entity or regenerate 03B at this stage.

## 6. Academic testing and compliance strategy

- **Pure unitary:** permission policies with the four combinations of roles and states, standardization and cryptography where applicable. PK conflict mapping tests for the race of idempotence.
- **HTTP/PostgreSQL integration:** authentication, business idempotent, isolation between companies, session protection and rollback. Existing real tests use `RUN_DB_INTEGRATION=1` and reverse external transactions.
- **Migration:** `alembic upgrade head`, `alembic current` y `alembic check`; not to use `stamp` nor destructive downgrades to silence errors.
- **CI:** workflow `.github/workflows/plataforma-pyme-backend.yml`, jobs Python and Docker with PostgreSQL ephemeral. A published commit does not amount to green CI; verify the execution of that SHA.
- **TP:** having more than ten infrastructure/identity tests does not replace building, testing and deploying the set of **at least five full high-level RF**RF-03–07 are still pending in the API.
- **Public Deploy:** pending, with secure protection and configuration measures before displaying auth and data.

## 7. Documentary Update Protocol by Delivery

| Event | Documents to be updated |
|---|---|
| Behavioral change, RF or CU | 01, 02 y 05 |
| New table, FK, status or cardinality | 03 and UML 03A sources when changing concept, migration, 05 |
| Change of architecture, transaction, pattern or authorization | 04, 05 and Technical README |
| Nuevo endpoint o error | 05 with method/path, contract, permission, tests, real status |
| New test, IC or deploy | 05 and 06 when published, with verifiable evidence |
| Each stage validated by the developer | Update real status without inventing tests or advancing functionalities |

### Next closed steps

1. **C.1 — published and locally validated:** pure RBAC policy, regression of idempotency, 98 approved tests.
2. **C.2 — Locally validated and by IC:** Business profile PATCH, role/tenant permissions and tests; 125 approved cases, healthy Docker/DB.
3. **C.3 — locally validated:** directed broadcast without creating member, safe role, 7 days and 147 tests approved.
4. **C.4a — locally validated (171 tests):** Authenticated and atomic acceptance. **C.4b — locally validated with 195 tests and CI 3/3:** team query and update operational/state roles with protected title.
5. **Closing of RF-02:** update contracts and diagrams 03A on confirmed implementation; then address RF-03 Locations and RF-04 Catalogue.

This document is alive: maintain entity names, UUIDs, routes and tests exactly as they are in `main` to the cut date. Do not extrapolate DEMO frontend functions to non-existent endpoints.

## 8. Specific evidence for verification E2-1.3C.2

**Subject matter of test:** `PATCH /api/v1/businesses/{business_id}` with JSON of one or more keys (`name`, `category`, `activity_kind`) All other fields, `null`, and the empty object returns 422. The actor of the Bearer is derived; no request allows assigning role/founder/state. `BusinessView` with the membership that enabled editing.

**Evidence of authorisation:** `test_business_update_integration.py` host and administrator with persistent writing, maintainer/worker with 403, non-member company with 404, inactive membership with 404, company suspended with 409, session revoked and user disabled with 401, invalid DTO with 422 and rollback if response fails after the `flush`. Test data are reversed with an external transaction. It is complemented by `test_business_update_schemas.py` y `test_business_update_http.py`.

**Status updated in C.5:** C.2 tests were executed and **125 passed locally**; subsequent regressions culminated in **195 approved** when closing C.4b, with functional CI 3/3. C.2 did not require migration. `GET` Business Filters by Active Membership and `PATCH` The old reference to 98 cases was made by historical court C.1.

**Units:** C.3 issuing invitations and C.4 accepting/management memberships will use policies `members.invite` / `members.manage`The React code is followed exclusively by DEMO.

## 9. Contract for actual C.3 invitations and evidence

**Path:** `POST /api/v1/businesses/{business_id}/invitations`. Requires Bearer, belonging to the active tenant, permission `members.invite` (holder or administrator), body `{"email":"persona@example.com","role":"ENCARGADO"}` o `TRABAJADOR`. **No** admite `ADMINISTRADOR`, `TITULAR_ADMINISTRATIVO`other states, `business_id` within the body or extra fields. The recipient may not hold an account when issuing the invitation.

**Answer 201:** `id`, `business_id`, `email` standard, `role`, `status=PENDIENTE`, `expires_at` y `invitation_token` (only available in this answer).The token is random and confidential; the base retains `token_hash` SHA-256, not clear text. **There is no invitation GET; the acceptance endpoint was implemented later, in C.4a (`POST /api/v1/invitations/accept`).**

**Errors:** 401 invalid session token, 404 non-existent/non-existent/inactive membership, 403 role of unauthorized member, 409 suspended company, already active recipient or duplicate invitation, 422 mail/rol/incorrect body. Repeated sending of the same invitation **no** recovers token: responds 409, avoiding creating a second. A expired invitation can be replaced, dialing `EXPIRADA` the prior registration within the same transaction.

**New migration:** `20261108_0006_business_invitations.py` → `e213c3_invitations`; new entity `BusinessInvitation`, partial index `uq_business_invitations_pending_email` and FK to invite/company. No changes to memberships or UML 03B.

**Tests:** `tests/test_business_invitation_schemas.py` y `tests/test_business_invitation_integration.py` verify normalization, roles, security, belonging, duplicates, expiration, hash persistence, not high membership and rollback. In CI they approved Pytest with real PostgreSQL, `alembic upgrade head` y `alembic check` in Python 3.12/3.14, plus Docker. **The amount of tests and local migration should be confirmed by the developer** after `git pull`.

**Pending C.4:** validate secret by comparing hash, authenticated account mail hearing, status/date, transactional acceptance exactly once, unique membership, inactive membership activation and concurrent protection. Automatic sending, forwarding/cancellation and spam protection for production remain unbuilt.

## 10. Acceptance contract C.4a: invite

**POST `/api/v1/invitations/accept`** — required `Authorization: Bearer` global and body only `{"invitation_token":"<token-opaco>"}`. The account must have exactly the standard mail for which the invitation was issued. The server searches **SHA-256 from token**, not the clear text, blocks the invitation, checks `PENDIENTE` and expiration, blocks company `ACTIVA`, and creates or reactivates a single Membership to `(business_id,user_id)` with the operational role that was proposed when issuing. `ACEPTADA` y `accepted_by_user_id/accepted_at` in the same commit; replies `200 BusinessView`without token or private data from other companies.

**Errors:** 401 invalid account/session, 404 unknown token or foreign to email (same answer), 409 token expired or consumed, business suspended, membership already active or historical role of inactive administrative holder incompatible, 422 format invalid token/extra camps. The operation does not grant permissions before confirming acceptance. `ADMINISTRADOR` ni `TITULAR_ADMINISTRATIVO` by basic invitation. `flush` the re-entry of membership and acceptance. Token re-tryment consumed gives 409, without duplication.

**Entity and Alembic:** `business_invitations` sum `accepted_by_user_id` (FK to user, nullable), `accepted_at` (nullable) and CHECK `ck_business_invitation_acceptance_audit` that both columns require when `status=ACEPTADA` and prohibits the recording of them in another state. `e213c4_acceptance` (without editing previous migrations).

**Evidence:** C.4a was tested locally with **171 tests** and in IC with PostgreSQL/Alembic (Python 3.12/3.14, Docker); C.4b extended local validation to **195 tests**, Functional CI **3/3** and healthy Docker, without new migration. The basic consultation and management of the team **are implemented** from C.4b. Cancellation/rejection/return of invitations, automatic mail/QR, email verification, internet rate limiting and title transfer are pending. UML 03A has already been updated in C.5; the sheet for the companion will be written later, separately.

## 11. C.4b — Equipment contract and authorization decisions

**GET `/api/v1/businesses/{business_id}/memberships`:** directory limited to active owner/manager of the company ACTIVA; lists active and inactive members of **That tenant**, con `id`, `user_id`, `email`, `display_name`, `role`, `status`, `job_title`. Does not expose password_hash, telephone contact or tokens. 401 session invalid; 403 manager/worker; 404 company external/non-existent or member of the inactive actor; 409 company suspended. The role of another company does not grant reading. `members.read` is new and different from `business.view`.

**PATCH `/api/v1/businesses/{business_id}/memberships/{membership_id}`:** only current administrative holder, company ACTIVA, existing target of that same company with role **other than AMINISTRATIVE VEHICLE**. Partial body requires at least one field `role: ADMINISTRADOR|ENCARGADO|TRABAJADOR` o `status: ACTIVA|INACTIVA`, without additional nulls or fields. An edition can be promoted by a contributor to ADMINISTRATOR; an administrator cannot run PATCH on computer. The holder cannot self-deactivate/degrade or modify an inactive historic membership. 200 returns `BusinessTeamMemberView` Target; 401 auth, 403 permission, 404 tenant/target unknown, 409 state suspended or protected holder, 422 invalid body. The server blocks identity/session, company/membership of the actor and target in a single transaction and reverses when error occurs.

**Evidence:** `tests/test_business_team_schemas.py`, `tests/test_business_team_integration.py` and matrix update in `test_business_permissions.py`GitHub Actions in C.4b code approved Python PostgreSQL Python 3.12 and 3.14, and Docker. **Windows Validation: `195 passed in 23.86s`; Alembic `e213c4_acceptance (head)` sin deriva y Docker saludable.** No new table or migration; `e213c4_acceptance` Keep it going.

**Earrings consciously outside this court:** transfer/revocation of title (separate sensitive case), historical audit of role changes, editing of `job_title`, physical removal, listing/rejection/cancellation/re forwarding of invitations, email confirmation and frontend React connected. The documentary closing and revision of 03A correspond to C.5, after validating C.4b. Commercial functions RF-03–RF-07 are not attributed to this block.

## 12. C.5 evidence-closure matrix (08/11/2026)

| RF / CU | Actual operation | Evidence at closure | Status |
|---|---|---|---|
| RF-01 / CU-01–02 | Log, login, `/me`, logout | PostgreSQL regression 195/195 | Implemented in API |
| RF-02 / CU-03 | Companies: High, Consultation and PATCH | PostgreSQL regression 195/195 | Implemented in API |
| RF-02 / CU-12 | Invitation, acceptance and equipment (`GET`/`PATCH` of membership) | Regression 195/195; CI 3/3 of the commit `8cd1674` | Implemented, protected holder |
| Infrastructure | Alembic, API/PostgreSQL Docker, `/ready` | `e213c4_acceptance (head)`, no drift; both `healthy`; `ready`/`ok` | Locally verified |
| RF-03–RF-07 | Locations, catalog, purchases, stock and sales | No hay endpoints ni pruebas backend | TO-BE |

**Precision:** the exit `195 passed in 23.86s` corresponds to the functional code `8cd1674`, **No post-commitment execution C.5**. Frontend React, transfer of title, email verification, historical role audit, production security and public deployment are still pending. The peer review sheet will be written later, before RF-03.

## 13. E2-2 A — Tracer matrix for persistence RF-03

| RF/CU | Implementation | Evidence | Status |
|---|---|---|---|
| RF-03 / CU-04, tabla | `models/location.py`, migration `20261108_0008_business_locations.py` | `test_location_model.py`, `test_location_integration.py` | **Persistence implemented; IC validated** |
| RF-03 / CU-04, HTTP | CRUD and main / pause changes | HTTP and RBAC tests still missing | **E2-2 B/C pending** |
| RF-03, permissions by location | Tenant controls + membership + specific capacity | Future approval tests | **E2-2 C earring** |
| RF-05/06/07, commercial use | Stock validations, reception and sale with active location | Future commercial testing | **Out of this cut.** |

**E2-2 A — Persistence of Locations (08/11/2026):** Published `Location`/`locations` with FK required `business_id → businesses.id` (`RESTRICT`), six types, `can_sell`/`can_store` independent, optional reference fields, `ACTIVA/PAUSADA`, `is_primary`, partial index that allows at most a main active per tenant and CHECK that prevents main paused. Additive migration `20261108_0008_business_locations.py` (`e22a_locations`, descendant of `e213c4_acceptance`) The company continues to start **no locations**. **No HTTP Location Routes yet**, no inventory/purchase/connected sale, no location permits; these changes belong to E2-2 B/C and subsequent blocks. The IC of the cut code was verified in `300fa6f` (GitHub Actions run 42491816481): result `success`. Local Windows validation of the new cut is still required; the previous 195 tests corresponded to E2-1.

**Comment:** the old line of closure E2-1 describing `e213c4_acceptance (head)` is historical evidence of E2-1 and not the new head. Original head E2-2 A was `e22a_locations`but after incorporating CASA the new head is `e22b_location_casa`; the backend still does not expose new paths. Do not present IC results as local Windows tests.


### E2-2 A.1 — CASA and new head (08/11/2026)

`CASA` is added to the rates accepted; `can_sell`/`can_store` still independent. Additive migration `e22b_location_casa` after `e22a_locations`, no changes to previous data, and protected reversal when CASA locations exist. **CI backend** (run): **217 tests approved, Python 3.12.3.14, Alembic `e22b_location_casa (head)` sin deriva, Docker 3/3**. **CI frontend** (run): **2/2 successful jobs including build/lint and E2E**. Previous Windows result of E2-2 A: 212 tests; **Additional migration CASA and 217 tests must still be replicated locally**. No location endpoints up to E2-2 B/C and no React–API connection.

## 14. E2-2 B — Contracts and evidence of partial RF-03

**State E2-2 B (08/11/2026):** Three real routes were published for low locations `/api/v1/businesses/{business_id}/locations` (`POST` 201, `GET` ready 200, `GET /{location_id}` 200). The creation valid DTO without protected fields, revalidates identity/session, blocks the company and membership of the actor, demands tenant `ACTIVA` y rol `TITULAR_ADMINISTRATIVO` o `ADMINISTRADOR`, and confirms a single transaction. A first location receives `is_primary=true`; the subsequent ones do not replace it. Active members of any recognized role can consult their own locations, even with suspended company; a suspended company does not allow to create. A third party or inactive membership returns 404; role without permission 403; invalid session 401; company suspended when creating 409; incorrect body 422. `CASA` and Google Maps HTTPS validated are included. **There is no PATCH/DELETE, no pause/reactivation, change of principal, individual staff assignment or commercial consumption of locations yet.** DEMO remains independent. Backend without new migration from `e22b_location_casa`.

**Cutting capacity matrix:** read locations (any recognized business role with active membership); create (holder and administrator); suspend company only allows reading. No authorization is implemented by assigned location or editing/pause. Endpoint names are defined in the HTTP contract table. **Geths are not inventory or enable to operate stock**and an unlocated company returns empty list.

**Evidence of IC:** commit funcional `bdd2c84653dafb976c8cd6b49d8c2d577cc345de`; GitHub Actions E2-2 B **3/3** (Python 3.12 y 3.14 con PostgreSQL, Docker), **277 approved tests**, `e22b_location_casa (head)` and Alembic without drift. The local Windows output provided previously for **E2-2 A.1** fue **217 passed in 23.90s**. Posteriormente E2-2 B **was validated in Windows with `277 passed in 31.22s`**, Alembic without drift and healthy Docker; E2-2 C adds new tests to be verified locally. The peer review of E2-1 remains anchored in the commit delivered.

## 15. E2-2 C — Editor, states and principal matrix

**E2-2 C (08/11/2026) — actual location operations:** `PATCH /api/v1/businesses/{business_id}/locations/{location_id}` allows editing only `name`, `kind`, `address`, `map_url`, `can_sell` y `can_store` (optional fields in the body, but rejected `null`, empty bodies, invalid values and protected fields). `PATCH /{location_id}/status` receive only `ACTIVA` o `PAUSADA`: pause revoke `is_primary` in the same transaction and reactivate **no** recovers location ownership automatically. `PUT /{location_id}/primary` designates a location `ACTIVA`, unmarks the previous one and marks the one chosen within the **and a single transaction**, serialized by company lock and protected with the SQL index `uq_locations_one_active_primary`. The operation on an already main location does not make any additional changes. Owner/Manager with Active Membership can manage; maintainer/worker only consult. `SUSPENDIDA` read but no change; other/non-existent resource 404, role without permission 403, invalid session 401, incompatible status 409 and invalid body 422. DELETE was not enabled nor new tables were created.

| Capacity | ADMINISTRATIVE SERVICE | ADMINISTRATOR | MANAGER | STAFF MEMBER |
|---|---|---|---|---|
| Read your own locations | Yes | Yes | Yes | Yes |
| Create Location | Yes | Yes | No | No |
| Edit Data/Capabilities | Yes | Yes | No | No |
| Pause/reactivate | Yes | Yes | No | No |
| Main designator | Yes | Yes | No | No |

**Evidence:** functional code `7abafd8208965cd99b0116e02ffc5240d23f218f`, GitHub Actions E2-2 C **3/3 successful**, 325/225 Python 3.12 and 3.14 tests with PostgreSQL, Alembic `e22b_location_casa (head)` no drift and correct Docker. Windows had previously validated E2-2 B (`277 passed in 31.22s`, `/ready` = `ready`/`ok`). **The 325 tests must still be played on Windows to close locally E2-2 C.** React/API integration, individual assignment of members to locations, inventory control when removing `can_store`, receptions/sales and operating fund management are future works; they are not attributed to this increase. E2-1 and UML 03B/03C were not modified.

## 16. E2-2 D — Location mapping

**E2-2 D AS-IMPLEMENTED:** `LocationAssignment` con clave `(business_id,location_id,user_id)` and FK composed towards `Location` y `Membership` of the same tenant. Additive migration `e22d_assignments`, single location index `(business_id,id)`. Administrative States `ACTIVA`/`REVOCADA`; date `revoked_at`No physical deletion. `GET /api/v1/businesses/{business_id}/locations/{location_id}/assignments` list of assignments from a headquarters (holder/manager); `PUT /api/v1/businesses/{business_id}/locations/{location_id}/assignments/{membership_id}` receive JSON `{"status":"ACTIVA"}` o `{"status":"REVOCADA"}` and actively/revolves. Only one member is activated ENTRY/TRAWER active towards the active location; revoke allows for paused headquarters or inactive member. Company SUSPENDED read only. Pure policy `can_operate_at_location` obliging tenant, membership, headquarters and capacity `SELL/STORE` in force, besides the active assignment to managers/workers. **The policy is not yet consumed in purchases, inventory or sales**, outside this cut. No new E2-1 functions or frontend connection.

**IC checked for functional code `3cd7bce71d951218e8c77da58d147e78fb0d426e`:** run 42497556047, **371/371 tests Python 3.12 and 3.14, 3/3 jobs approved**, Alembic `e22d_assignments (head)` sin deriva y Docker saludable. **Local Windows E2-2 D is pending:** the last execution contributed corresponds to E2-2 C, 325 passed. Do not attribute to the last commit documentary own execution of tests.

## 17. E2-3 A — Catalog Scheme Traceability (RF-04)

| Layer | Artifact | Test | Status |
|---|---|---|---|
| SQL and ORM | `models/catalog_item.py`, `alembic/versions/20261108_0011_catalog_items.py` | `test_catalog_item_model.py`, `test_catalog_item_integration.py` | **407 IC tests approved, premises pending** |
| SKU/name per company | Indices/UNIQUE, later standardisation by service | Duplicates of the same tent/inactive and reuse in another tenant | **Implemented SQL restriction; pending API** |
| Type/unit | CHECK for DEMO and exclusivity classes `SERVICIO` | Valid and invalid combinations in PostgreSQL | **Implemented** |
| API, RBAC y CRUD | Endpoints bajo `/businesses/{business_id}/items` (pre-proposal) | HTTP tests, sessions, attendance and errors | **E2-3 B/C pending** |
| Inventory/purchases/sales | Future composite FK and historical snapshots | Future commercial tests | **Outside E2-3 A** |

**Cut E2-3 A (08/11/2026), partial persistence of RF-04/CU-05:** clase SQLAlchemy `CatalogItem` y tabla `catalog_items` con `business_id` Compulsory, FK to Company (`RESTRICT`) y par UNIQUE `(business_id,id)` for future commercial FK of the same tenant. Four kinds of tab according to DEMO: `ELABORADO`, `REVENTA`, `INSUMO` (physical property) and `SERVICIO` (conceptually a service). `SERVICIO`; physical property prohibits it. `UNIDAD`, `GRAMO`, `KILOGRAMO`, `MILILITRO`, `LITRO`, `PAQUETE`, `CAJA`. Name, standardized key is stored `name_key`, category, optional SKU, description, internal observations, status `ACTIVO`/`INACTIVO`, condition `sellable`, `price_cents` y `reference_cost_cents` optional. Whole amounts BIGINT between 0 and 99,999,999.999 cents, without Float. Two independent restrictions prevent repeat `name_key` and SKU not null **within the company**, also in inactive chips; different tenants can reuse them. In E2-3 B the service must calculate `name_key` canonically (NFKC, collapsed spaces, capital equivalence) and normalize SKU to uppercase **before inserting/editing**: SQL imposes the uniqueness of saved keys and SKU format, but does not derive `name_key` Create tab does not create location, stock, purchases, sales or movements.

**Evidence:** code/test cut `79c2071f4e5192be95d75c78d5b1e9a75492a645`; GitHub Actions E2-3 A **3/3**, **407 approved tests** en Python 3.12 y Python 3.14 con PostgreSQL 16, Docker liveness aprobado y `e23a_catalog (head)` no pending changes from Alembic. **Local Windows Validation Pending for E2-3 A**; the above 371 tests correspond to the closure of E2-2. **No HTTP Catalog paths** in this cut; CRUD, catalog RBAC, SKU/name standardization of entry and protection of business stories will be implemented in E2-3 B/C/D. No React API integration or independent review of E2-3 yet. No change to E2-1 or E2-2 or DEMO frontend.

## 18. E2-3 B — HTTP Traceability Catalogue

**E2-3 B — Real Catalogue API (RF-04/CU-05, 08/11/2026):** four low routes `/api/v1/businesses/{business_id}/catalog`: `POST /catalog` (201 high), `GET /catalog` (200 list with `offset>=0`, `1<=limit<=500`; default `limit=100`), `GET /catalog/{item_id}` (200 detalle) y `PATCH /catalog/{item_id}` (200 part edition). Each operation requires valid Bearer, session revalidation, user and membership of the requested company. Owner/manager can read and write; maintainer/worker with active membership only read; company SUSPENDED read only; enterprise or article other/non-existent 404. The server normalizes Unicode NFKC names, collapses spaces and generates `name_key` con `casefold`; normalizes SKU to ASCII capital letters and converts empty SKU into NULL. PostgreSQL retains the uniqueness per company of `name_key`/SKU even with INACTIVE tabs, and the API translates that collision to 409. Invalid data or protected fields (id, tenant, status, derivative key) receive 422. SERVICE type requires SERVICE unit; no other classification can use it. They are valid `price_cents` y `reference_cost_cents` NULL or integers from 0 to 99.999.999.999. The PATCH allows you to remove SKU/price/cost with NULL, but do not edit status. `status` and timestamps SQL. Creation does not create location, stock balance, purchases, sales or movements.

| Capacity | Owner | Administrator | Manager | Staff member |
|---|---|---|---|---|
| Create / edit tab | Yes | Yes | No | No |
| List / consult own tab | Yes | Yes | Yes | Yes |
| Edit ASSETS/INACTIVE Status | **E2-3 C earring** | **E2-3 C earring** | No | No |

**Explicit limits:** E2-3 B not yet exposed `PATCH /status` No integration of frontend React with this API; no reception, sales, commercial snapshots or history unit editing protection are implemented as these modules are later. New tests check permissions, duplicate rollbacks, SKU/standard names, multi-company isolation, suspended reading and fault 401/403/404/409/422. **Evidence CI E2-3 B:** GitHub Actions 42506409757 finished **3/3 successful jobs**, **498 approved tests** both in Python 3.12 (53.96s) and Python 3.14 (50.12s), PostgreSQL 16, `e23a_catalog (head)` y `alembic check` No operations, Docker/liveness image approved. Validated functional code: `35ff901855397c024cee50fa590c6c05a7f04cfe`. Previous IQ `42506050141` had detected two HTTP mapping failures in PATCH with incompatible type/unit; they were corrected and both cases are now happening. **Local Windows validation of E2-3 B is still pending**; the last confirmed local result is 407/407 of E2-3 A.

## 19. E2-3 C — HTTP status matrix

**E2-3 C (08/11/2026):** implemented `PATCH /api/v1/businesses/{business_id}/catalog/{item_id}/status` with exclusive body `{"status":"ACTIVO"}` o `{"status":"INACTIVO"}`, strict validation and rejection of extra attributes (422). The path revalidates session and membership and requires an ACTIVA company owner/manager to write (401/403/404/409 as the case may be).The article is blocked inside the tenant and changed status in a single transaction.The repeated change is idepotent, without altering `updated_at`. The inactive article remains visible on GET/listed, with UUID, name and SKU reserved even for duplicate highs; there is no DELETE or fictitious stock. Generic PATCH maintains `status` This functionality also does not modify the independent field `sellable`.

**Units:** future purchases/sales must prohibit new movements with INACTIVE chips and keep real historical snapshots. There are still no commercial operations or integrated frontend; therefore, there is no real restriction on unit change for previous transactions either. No new migration: CHECK reused `ACTIVO/INACTIVO` de `e23a_catalog`.

**Tests:** CI E2-3 C **3/3 work adopted**, **527 passed** in Python 3.12 and 3.14 with PostgreSQL, `e23a_catalog (head)`, `alembic check` no operations and correct Docker; code `c2153ab9b65b265eb46b3081079e0f3f15002215`. E2-3 B: **498 passed en Windows (55.79s)**, Docker/API/DB saludables. **E2-3 C: Windows pending**. The subsequent documentary committ is not equivalent to another IC execution.

## 20. E2-3 D — Covering, Limits and Monitoring Matrix

**E2-3 D (08/11/2026):** the existing Catalogue was strengthened, **without adding tables or migrations**. New tests verify Unicode NFKC+ equivalences `casefold` in names, SKU NFKC and ASCII capitals, rejection of invalid controls and forms, overflowing `name_key` per Unicode expansion, strict integer amounts (no booleans or decimals), differentiation between `PATCH` field and with `null` Explicit, incompatibility SERVICE/physical unit, protected fields of `/status`, name/SKU collisions even in INACTIVE chips, independence between two companies of the same user, session recovery after 409, and rollback provoked after `flush` both in high and in edition. A ceiling was added to `offset` catalogue (`9_223_372_036_854_775_807`, BIGINT PostgreSQL): exceed it produces 422 before running SQL, maintaining `limit` de 1 a 500 y `offset` The five Catalog endpoints retain their contracts and business permits; no stock is created.

**Scope and limits:** NICK `(business_id,name_key)` y `(business_id,sku)` and existing transactions/blocks protect against collisions; tests exercise actual duplicates and recoveries in PostgreSQL, **but are not simultaneous load/concurrence testing with multiple independent connections**. The latter is registered as future verification before production. There are not yet purchases, sales, movements or snapshots, so you cannot check a unit/state change rule with real business history. `sellable` does not replace `status`. Do not connect frontend DEMO or E2-1/E2-2 for this cut.

**IC evidence of code D:** commit `bf4fd3fa809c9f4e6afdeb064a155acf233b1722`, GitHub Actions run 42508771222: **3/3 work adopted**, **580 passed** en Python 3.12 y Python 3.14 con PostgreSQL, Docker build/liveness aprobado, `e23a_catalog (head)` y `alembic check` No difference. **Local Validation Windows E2-3 C:** 527 passed in 59.60s, healthy containers and `/ready` Right. **Local Validation Windows E2-3 D:** Do not confuse remote IC with tests performed on the author's computer.

## E2-3 E — Final Traceability of the Catalogue: model, tests and bounds reconciled

**E2-3 E (08/11/2026) — functional closure:** E2-3 A/B/C/D implemented `CatalogItem`/`catalog_items`, migration `e23a_catalog`, five REST operations (GET/POST collection, GET/PATCH detail, PATCH status), permissions for tenant and role, canonical name and SKU unique within the company, four classes ELABORATED/REVENT/INSUMO/SERVICE, type GOOD/SERVICE derivative without duplicate column, optional amounts in cents and reversible deactivation without erasing chips or releasing keys. No stock is created when registering an item. **PlantUML 03A v0.7 source and its editorial SVG have already been reconciled** with the actual Catalogue; `Proveedor` Go on, TO-BE.

**Windows D checked by the developer:** 580 passed in 66.45 s, `e23a_catalog (head)`, `No new upgrade operations detected.`, API y PostgreSQL Docker `healthy`, `/ready` → `ready/ok`. **CI D:** run 42508771222, SHA `bf4fd3fa809c9f4e6afdeb064a155acf233b1722`, 580 Python tests 3.12 and 3.14, 3/3 jobs approved. Subsequent changes only of UML/documents do not constitute new IC execution.

**Explicit pending:** no double-high test was performed at the same time with two independent connections and no sustained load. There are still no purchases, stock, sales, commercial snapshots or use of SELL/STORE permissions in real operations. The rules on type/unit changes with business history should be applied when these modules exist. React continues DEMO without HTTP integration. E2-1/E2-2 and diagrams 03B/03C remain out of reach. The block is prepared for **independent audit** and is not declared audited or ready for production.

| Actual action | HTTP Path | Authorisation |
|---|---|---|
| Listing files, including INACTIVE | `GET /api/v1/businesses/{business_id}/catalog` | Active member with reading |
| Crear ficha sin stock | `POST /api/v1/businesses/{business_id}/catalog` | Holder/Manager, Active Company |
| See details of your own | `GET /api/v1/businesses/{business_id}/catalog/{item_id}` | Active member with reading |
| Modify Valid Fields | `PATCH /api/v1/businesses/{business_id}/catalog/{item_id}` | Holder/Manager, Active Company |
| Disable/reactivate | `PATCH /api/v1/businesses/{business_id}/catalog/{item_id}/status` | Holder/Manager, Active Company |

**Actual source:** `backend/app/infrastructure/models/catalog_item.py`, `backend/alembic/versions/20261108_0011_catalog_items.py`, `backend/app/modules/catalog/{schemas,repository,service,router}.py` y `backend/tests/test_catalog*.py`. Shopping/Stock/Sales trade routes are later goals, not implementations.

## 21. E2-4 — AS-IMPLEMENTED traceability update (closure 08/11/2026)

> **Precedence:** This section documents the operations that exist after PR #18. `pendiente E2-4` E2-3 and previous blocks are preserved as **history** of those cuts, not as current state. Closing code: `4f88416141c09a82e744990b1aee8c00b9f31dfd`. Complete closure with 17 manual cases, IC and backlog: [docs/revisions/E2-4_CLOSURE](../docs/revisiones/E2-4_CIERRE/00_LEEME.md).

| RF / CU | Endpoint real (bajo `/api/v1/businesses/{business_id}`) | Roles/conditions | Evidence |
|---|---|---|---|
| RF-05 / CU-06, Supplier | `GET/POST /suppliers`; `GET/PATCH /suppliers/{supplier_id}`; `PATCH /suppliers/{supplier_id}/status` | Active member reads; holder/admin writes in company ACTIVA | CI E2-4 B, 693 tests |
| RF-05 / CU-06, Shopping | `POST/GET /purchases`; `GET /purchases/{purchase_id}` | Purchase: holder/admin, company ACTIVA, key idempotente; active membership reading | CI E2-4 D, 772 tests; U-01–U-07 log |
| RF-05 / CU-07, Reception | `POST /purchases/{purchase_id}/receive`; `GET /purchases/{purchase_id}/receipt` | Valid session, purchase REGISTRADA, active destination/`can_store`; permission `STORE` and one reception | CI E2-4 E, 796 tests; U-08–U-14 |
| RF-06 / CU-08 (partial) | `GET /inventory/balances`, `GET /inventory/movements` | Reading by company, filters and pagination | U-15–U-17; balance 10000, leader one entry |
| RF-03/RF-04 (units) | `GET/POST /locations`, `POST /catalog`; valid historical type/unit catalogue | Roles and tenant; location `can_store`, active article | U-06 y U-08–U-11 |
| Technical quality | No new endpoints in PR #18; correction `test_purchase_integration.py` | Tests do not mean empty DB | Final CI, **797/797**; Windows 797/797 |

**Implemented:** stockless purchase, whole cents/thousandths, snapshots, full physical reception 1:1, UPSERT balance, historical movement and tenant/STORE permissions. **Pending:** partial reception 1:N, HTTP cancellation, offsets, transfers, adjustments, multicurrency, sales, Payment Market, integrated frontend, DB hardening and load testing. Tests were executed correctly with local QA data after PR #18, **but local testing DB continues to share an environment with development** until isolated by dedicated infrastructure.

**Academic criterion:** block E2-4 closure for agreed range, **no** Complete RF-06 completion, complete TP or productive certification.

## E2-5 A — Preparation of RF-06/CU-09 and CU-11: implemented model, deferred API

**Cut:** 09/11/2026; validated E2-4 base (`797/797` Windows and IC, migration `e24e_receipt_stock`). Added `inventory_operations` with FK composed of tenant (art, origin/destiny, actor), motive, quantity and footprint/idempotence. `stock_movements` supports signed types for shipments, adjustments and initial stock, with FK composed of origin and new sign CHECK and exclusion; `stock_balances` y `purchase_receipts` remain intact. `e25a_inventory_ops` on historical E2-4.

| RF / CU | Contract implemented in E2-5 A | Endpoint HTTP | Status |
|---|---|---|---|
| RF-05 / CU-07, historical reception | `COMPRA_RECEPCION` and compatible E2-4 snapshots; FK and preserved sign | `POST /purchases/{id}/receive`, `GET /purchases/{id}/receipt` | **Implemented E2-4; regression required E2-5 A** |
| RF-06 / CU-08, reading | `stock_balances` no change; current check-in by reception | `GET /inventory/balances`, `GET /inventory/movements` | **Partial E2-4** |
| RF-06 / CU-09, transfer | Header `TRASLADO` and deltas `TRASLADO_SALIDA/ENTRADA` with SQL integrity | **Not yet available** | **E2-5 A: model; E2-5 B: transactional command and tests** |
| RF-06 / CU-11, adjustments and initial | Headers `AJUSTE_ENTRADA`, `AJUSTE_SALIDA`, `STOCK_INICIAL`; mandatory reason and signs | **Not yet available** | **E2-5 A: model; E2-5 C: transactional command and tests** |

Migration does not execute transfers by itself: the balance must be updated atomically along with both movements and check non-negativity in E2-5 B/C. The future move GET will require responses compatible with optional origins before registering new manual operations. The revision of dedicated DB for local testing, ledger handing and balance reconciliation are left as controlled debt before production.

**Technical source:** [E2-5 A — Inventory operations model](../docs/E2-5_A_MODELO_OPERACIONES_INVENTARIO.md) y `backend/tests/test_inventory_operation_{model,integration}.py`. **CI E2-5 A verified:** run 42599668128, **3/3 successful jobs**, **816 tests in both Python 3.12 and 3.14** with PostgreSQL 16, migration `e25a_inventory_ops (head)` y `alembic check` No difference. **Local validation Windows pending**Not to equate it with IQ.

## E2-5 B — CU-09: transfer of stocks with double movements

The new endpoint `POST /api/v1/businesses/{business_id}/inventory/transfers` requires session, membership, permission STORE in both locations of single tenant, active physical item, amount in thousandths and `Idempotency-Key` UUID4. Unaccounted for conditionally and credited destination through UPSERT, records header and two signed moves and confirms everything in a transaction. Same key/actor/load returns 200 and historical operation, without double stock. `GET /inventory/transfers/{transfer_id}` allows for consultation of this operation; `GET /inventory/movements` read both E2-4 receptions and transfers.

**Limits:** RF-06/CU-09 now has basic transfer API. It does not equal CU-11 (adjustments), initial stock, multi-purpose transfers, integrated frontend or complete productive inventory. Migration does not change with respect to E2-5 A (`e25a_inventory_ops`). HTTP/PostgreSQL cutting tests: `backend/tests/test_transfer_api_integration.py`; **CI E2-5 B verified:** run #42602232103, 3/3 successful jobs, **826 tests en Python 3.12 y 3.14**, PostgreSQL 16, Alembic `e25a_inventory_ops (head)` no drift and approved Docker. SQL/HTTP tests and three concurrent runs in independent sessions; **Windows Pending Validation**, not to be confused with IC. Contract: [docs/E2-5_B_TRASLADOS_ATOMICOS.md](../docs/E2-5_B_TRASLADOS_ATOMICOS.md).


## E2-5 C — RF-06 / CU-11: justified adjustment API and initial stock

They add up. **`POST /api/v1/businesses/{business_id}/inventory/adjustments`** (new event `AJUSTE_ENTRADA`, `AJUSTE_SALIDA`, `STOCK_INICIAL`) y **`GET /api/v1/businesses/{business_id}/inventory/adjustments/{adjustment_id}`**. They demand Bearer, active membership, STORE permission, mandatory motive, physical item, enterprise-specific and `expected_version` starting stock: only holder/admin and only pair location/article never used; a zero balance with history does not enable second initial charge. Output adjustment: insufficient balance → 409 and rollback; obsolete version → 409. The signed movements are integrated into the already available general ledger.

**Model and Alembic:** reuse `InventoryOperation`, `StockMovement`, `StockBalance` y `e25a_inventory_ops`, without altering history E2-4/E2-5 B. **Limitation:** absolute count of observed quantity, double approval and automated reconciliation will differ; here the variation sent is signed by type, not recalculated from an absolute count. E2-5 C tests: `backend/tests/test_adjustment_api_integration.py` y `test_adjustment_concurrency_integration.py`. **CI E2-5 C:** run #42616213215, 3/3 successful jobs, **840 tests in Python 3.12 and 3.14** about PostgreSQL 16, `e25a_inventory_ops (head)`, `alembic check` sin deriva, Docker saludable. **QA local Windows pending**Not presented as executed. [Contract details](../docs/E2-5_C_AJUSTES_Y_STOCK_INICIAL.md).
