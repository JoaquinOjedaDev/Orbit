# E2-6 — Integrated Sales Comprehensive Documentation

**Project:** Platform PyME — Final Practical Work, Programming 2, UNSAM 2C2026  
**Date of cut:** 2026-11-09  
**Scope:** `plataforma-pyme/`; generalist multi-company product (WALOS is an example company, not the scope of the product).  
**Rama:** `feature/e2-6-ventas-integradas`  
**Destination:** `main`, using a single Pull Request after independent review and audit.  
**Status:** E2-6 A-D implemented; E completed documentary and manual validation; independent audit and pending merger.  
**Validated executable code reference:** `a66c180d02bfb5decc583a90a07efcc48d0a2783`. The commissions after this revision until the preparation of this document are documentary.

> **Nature of the document.** This is the descriptive specification and technical memory of the functionality actually implemented from E2-6, not a security audit report or payment certification. In the event of discrepancies, the models, routes and tests of the commit cited prevail; any improvements will be assessed separately in the audit.

## 1. Objective and outcome

E2-6 incorporates the possibility of registering and consulting confirmed sales of **services**, **physical property** and operations **mixed** The same voucher groups together its declared lines and payments; when it includes physical goods, it consumes stock from an authorized location and records historical movements linked to each line.

The design prioritizes five invariants: (1) isolation by company; (2) real access control according to membership and location; (3) entire monetary accuracy; (4) atomization of vouchers–payments–movements–salds; and (5) protection against repeated requests.

**It does not imply:** bank accreditation, closing or cash arching, creation of Market Pago preferences, payment by QR, webhooks, confirmed real collections, tax issuance, refund, cancellation or React interface connected. Those flows require later modules.

## 2. Status of the verified repository

GitHub Comparison `main...feature/e2-6-ventas-integradas` consulted on 2026-11-09, **before the submission of this documentation**:

| Field | Verification |
|---|---|
| Base `main` | `9516633d8fe5ce69c7f8f6ed0af4c87c40e6e460` |
| Relationship | `ahead`: 26 commit ahead, 0 behind |
| Comparison Files | 14: 4 backend code (including router log), 7 tests, 3 documents |
| Last proven code commit | `a66c180d02bfb5decc583a90a07efcc48d0a2783` |
| Last previous documentary evidence | `a15b84a6d78c1471b53f2aac4133afccf77f0798` |
| Migration required | `e26a_sales_foundation`, already present in the baseline of `main` |
| PR y merge | Not done at this stage |

**Important:** the comparison will vary in a commit and a file when incorporating this document. The number of commits does not represent pending versions of database migration. E2-6 A (Persistence/migration) is already in `main`; this branch integrates B-D, hardening, tests and documentation.

### 2.1 Deliverables by phase

| Fase | Content implemented | Outcome |
|---|---|---|
| **A — Model** | Tables `sales`, `sale_lines`, `sale_payments`, multi-tenant FK, origin `VENTA_SALIDA`, Alembic, integrity tests | Available in `main`; additive migration |
| **B — Sales of services** | POST/GET API, strict validation, declared payments, snapshots, authorization, idempotency; services without location | Valid, no physical debit |
| **C — Physical and mixed sales** | Location SELL/STORE, locks, CAS balances, ledger per physical line, integration with inventory | Validated with PostgreSQL and attendance |
| **D — Hardening** | Cross regression tests, membership and session revoked, rollback due to late failures and insufficient stock, historical replay | Validate |
| **E — Documentary closure** | Contract, technical delivery, IC evidence, Swagger manual testing and this comprehensive memory | Documentation in force; external audit pending |

## 3. Implemented architecture

```text
Cliente HTTP autenticado
       |
       v
POST /api/v1/businesses/{business_id}/sales
GET  /api/v1/businesses/{business_id}/sales/{sale_id}
       |  AuthContext / get_db
       v
app/modules/sales/router.py
       | validación Pydantic + errores HTTP
       v
app/modules/sales/service.py
       | permisos, transacción y replay
       +-- Businesses / Membership / Session (autorización)
       +-- Locations / LocationAssignment (SELL y STORE)
       +-- CatalogItem (artículo vigente, snapshots)
       +-- Sale + SaleLine + SalePayment
       +-- StockBalance (débito condicional y versión)
       +-- StockMovement (VENTA_SALIDA)
       |
       v
PostgreSQL 16 — commit único o rollback íntegro
```

**Relevant technologies:** Python, FastAPI, Pydatic v2, SQLAlchemy, PostgreSQL, Alembic and pytest. API v1 mounts the sales router on `app/api/v1/router.py`. The existing frontend E1 is independent of this backend transactional operation.

### 3.1 Main Archives

| Archive for `plataforma-pyme/` | Function |
|---|---|
| `backend/app/modules/sales/router.py` | Two endpoints, session dependency, idempower header, HTTP mapping |
| `backend/app/modules/sales/schemas.py` | Requests/responses, limits, digest SHA-256, monetary validation |
| `backend/app/modules/sales/service.py` | Logic transactional, catalog, permissions, replay, balance and movements |
| `backend/app/api/v1/router.py` | Module registration in API |
| `backend/app/infrastructure/models/sale.py` | Sales header and balance snapshot |
| `backend/app/infrastructure/models/sale_line.py` | Renglones y snapshots comerciales |
| `backend/app/infrastructure/models/sale_payment.py` | Declared payments |
| `backend/app/infrastructure/models/stock_movement.py` | Historical Ledger Extended with Origin of Sale |
| `backend/alembic/versions/20261109_0017_sales_foundation.py` | Migration `e26a_sales_foundation` |
| `backend/tests/test_sales_*.py` | Seven API test and service suites |

## 4. Persistent model and relationships

### 4.1 `Sale` / tabla `sales`

Each voucher contains `id`, `business_id`, `location_id` optional, `request_id` (UID per company), `request_sha256`, `status='CONFIRMADA'`, `subtotal_cents`, `discount_cents`, `total_cents`, `notes`, `created_by_id`, `created_at` y `balances_after` (JSONB).

The base requires subtotal and total positive, `total = subtotal - discount`, 64-length digest, confirmed status, JSONB array type and uniqueness of `(business_id, request_id)`. The location, if any, is linked by foreign key composed of the same tenant; the actor refers to the membership of the business.

`balances_after` retains one **historical photography** by physical article with `catalog_item_id`, `quantity_milli` y `version`. It is not a living projection nor should it be used to calculate the current inventory.

### 4.2 `SaleLine` / tabla `sale_lines`

Each line has `line_number` (1.30), article and business, `description_snapshot`, `kind_snapshot` (`BIEN` o `SERVICIO`), `unit_snapshot`, `sku_snapshot`, `quantity_milli`, `unit_price_cents` y `line_total_cents`. FK links the sale and catalog of the same business.

The snapshot protects historical interpretation against subsequent changes in the catalog. The database controls compatible type/unit, discrete quantity in discrete units, non-negative price and calculation of total per line with HALF_UP rounding. The number of lines per voucher is limited in API.

### 4.3 `SalePayment` / tabla `sale_payments`

Each payment saves `payment_number` (1..6), `method`, `amount_cents` (positive) and `reference`. Values allowed `EFECTIVO`, `TRANSFERENCIA`, `CUENTA_DNI`, `TARJETA` y `MERCADO_PAGO_DECLARADO`There's no `payment_id` external provider, capture status, account cleared or webhook confirmation.

### 4.4 `StockMovement` / `StockBalance`

El ledger incorpora `event_type='VENTA_SALIDA'` con `delta_milli < 0`, `sale_id` y `sale_line_id`. Triple FK guarantees reference to a line of the same sale/company; uniqueness `(business_id,sale_id,sale_line_id)` protects against duplicate movement of that line. The exclusionary CHECK rule separates sales from receipt of purchases and inventory operations.

`StockBalance` is the source of current stock, identified by company, location and item, and maintains `quantity_milli` non-negative and `version` incremental. For each physical item, amounts are accumulated between lines of the same voucher and a single balance row is updated.

### 4.5 Limits of SQL restrictions

CHECK/FK per row does not by itself demonstrate that the sum of all payments is equal to the total, that lines add up to the subtotal or that there are 1..30 lines and 1.6 payments. Such invariants are validations of Pydantic and transactional service, and should be preserved through endpoints; do not create sales with INSERT manual direct.

## 5. HTTP contracts

### 5.1 Crear venta

**`POST /api/v1/businesses/{business_id}/sales`**

- Requires authenticated session using the current authentication mechanism.
- Required header: `Idempotency-Key` con UUID **v4**.
- `location_id`: UUID o `null`/absent; omission only admits sale of services by owner/manager.
- `discount_cents`: integer, 0 by default.
- `notes`: Standard text, maximum effective 500 characters.
- `lines`: between 1 and 30, each with item, thousandth positive quantity and price in non-negative cents.
- `payments`: 1 to 6, medium allowed, positive amount and optional standard reference.
- Extra fields and floating numbers in strict integer fields are rejected.

**Concrete example, mixed sale:** UUIDs correspond to the *discardable* company used in manual tests of 2026-11-09. They are verifiable examples, not values for reuse in another environment.

```http
POST /api/v1/businesses/fc37e4ff-9e26-423b-946e-a9cc0b662360/sales
Idempotency-Key: <UUID-v4-nuevo>
Content-Type: application/json
```

```json
{
  "location_id": "013860da-e39b-4028-a080-1ae0638ae482",
  "discount_cents": 0,
  "notes": "Prueba de venta mixta E2-6",
  "lines": [
    {
      "catalog_item_id": "dfbef980-9d7b-4810-9d04-ab0e4f51c86f",
      "quantity_milli": 1000,
      "unit_price_cents": 500000
    },
    {
      "catalog_item_id": "740f0ed2-4371-4de3-bd0d-d218f9b53c34",
      "quantity_milli": 1000,
      "unit_price_cents": 150000
    }
  ],
  "payments": [
    {"method": "EFECTIVO", "amount_cents": 300000, "reference": ""},
    {"method": "TRANSFERENCIA", "amount_cents": 350000,
     "reference": "TRANSFERENCIA-PRUEBA-E26"}
  ]
}
```

**Creation response `201`:** `SaleView` with header, `lines`, `payments` y `balances_after`. In documented execution, total `650000` cents and balance after `7000` thousandths, version 3. The server determines the text/type/SKU snapshots of the catalog, but the unit price is received in the command and saved in the voucher.

### 5.2 Consult sale

**`GET /api/v1/businesses/{business_id}/sales/{sale_id}`**

Devuelve `SaleView` history for an authorized session and membership, without stock modification. If it does not exist within the indicated tenant, respond 404. There is no general sales list endpoint or cancellation transaction in this court.

### 5.3 Codes and semantics

| HTTP | Case |
|---|---|
| **201** | Confirmed checker and operation |
| **200** | identical repetition of POST (same actor, company, key and content) or successful GET |
| **401** | Absent or invalid session |
| **403** | Role, membership or assignment without operational permission |
| **404** | Not accessible company or voucher not found within the tenant |
| **409** | Idepotent key incompatible, undertaking/non-operational location or insufficient stock |
| **422** | JSON/ invalid fields, reference to unfit article, quantitative rules or amounts not covered |

The error categories describe the actual API; the exact texts may depend on the case. The contract does not guarantee that a rejected sale has a historical proof.

## 6. Verifiable rules of control

### 6.1 Types of sale and location

| Modality | Location | Stock | Permissions |
|---|---|---|---|
| Services only, administrative | Ausente/null | No moves | Holder or administrator only |
| Services only, in location | Enabled, enabled for sale | No moves | SELL at location |
| Well, physically. | Mandatory, active, `can_sell` y `can_store` | Atomic Debit, Line Motion | SELL + STORE |
| Mixta | Mandatory, active, `can_sell` y `can_store` | They only dib the lines. | SELL + STORE |

In cases with location applies `can_operate_at_location` The catalogue must be of the tenant, active and sellable. An item without sufficient stock cannot be sold as a physicist. It is not available in the same way as the product or product.

### 6.2 Quantities and money

- `quantity_milli = 1000` equals one whole unit of the article unit; 10000 equals 10. Positive quantities up to 999999999 thousandths per line are accepted.
- Discreet units `UNIDAD`, `PAQUETE`, `CAJA` y `SERVICIO` require multiples of 1000.
- `unit_price_cents`, `discount_cents` and payment amounts are represented as **whole**; no float is used for commercial calculation.
- Total per line: `floor((quantity_milli * unit_price_cents + 500) / 1000)` for non-negative quantities/prices (HALF_UP).
- `subtotal_cents = sum(line_total_cents)`; `total_cents = subtotal_cents - discount_cents` and it must be strictly positive.
- `sum(payment.amount_cents) == total_cents`; each amount declared is positive.
- General monetary limit: `99999999999` cents per field and for subtotal/total.
- If the same article is repeated in several lines, **Each line keeps its rounding and price**; only the physical amounts for debit balance are added.

### 6.3 Authorisation and isolation

The transaction checks identity/session, belonging to the company and role; selects location and articles by `business_id`, not just by global ID. Composite FKs reinforce that separation. Unauthorized roles, inactive assignments, revoked sessions and revoked memberships are scenarios included in automated testing.

The replay revalidates authorization before returning the voucher; by current design it also evaluates the fitness of the requested location. **This document describes this behaviour, without necessarily declaring it to be the ultimate policy for historical**: any change in location between the original sale and its replay requires specific evaluation in the audit, not an implicit modification of E2-6.

### 6.4 Idempotency

The command identity is `(business_id, request_id)`. It is calculated SHA-256 of canonical JSON of the body validated and normalized. For the same actor/company/key/content: `200` with historical sales and snapshots (no second discount); if the actor or digest changes: `409`. The unique PostgreSQL index and a specific management of `IntegrityError` defend against concurrent re-attempts.

A new application needs another UUID v4 key. The contract does not offer a re-try of *a different sale* by reusing a previous key.

## 7. Creation transactional flow

1. Validate Pydatic (fields, quantities, discounts, sum of payments) and calculate command digest.
2. Check session/membership and get company with existing transactional protections.
3. When location is indicated, block it for writing, consult assignment and check SELL permission.
4. Search existing sale by key; if content/actor matches, respond historical replay 200 without new writing.
5. For new sale, demand active company and load tenant items in deterministic order, with reading block on catalog.
6. Check active/sellable items and discrete quantities; if there are goods, require location with storage capacity and permission STORE.
7. Create `Sale`, `SaleLine` y `SalePayment`; persist in the SQL session.
8. Add physical quantities per item; execute, in order of UUID, `UPDATE stock_balances SET quantity_milli = quantity_milli - requerido, version = version + 1 ... WHERE quantity_milli >= requerido RETURNING quantity_milli, version`.
9. If balance is missing or not enough: launch error and **rollback** of vouchers, lines, payments and any prior discount of the same transaction.
10. Create a movement `VENTA_SALIDA` negative for each physical line, with `sale_id` y `sale_line_id`.
11. Save `balances_after`, build response and realize **un solo commit**.
12. SQL or application failure before commit, rollback; in case of specific collision of key idempotente, check again the enabled replay.

**Important properties:** there are no confirmed partial discounts on a failed sale; the service does not create a move for a line of services; the balance version grows once per item discounted on each sale.

## 8. Compatibility, migration and deployment

### 8.1 Functional units

- **E2-1/E2-2:** user, session, company, membership, location and role assignments.
- **E2-3:** multi-tenant catalog, type of item, reference price, status and unit.
- **E2-4:** purchases and receptions, which incorporate stocks into stock through their own historical origin.
- **E2-5:** adjustments, initial stock and transfers, with the same versioned balance and history.
- **E2-6:** accounts against existing projections; does not reintroduce receipt or adjustments or reinterpret your events.

### 8.2 Accurate migration

`20261109_0017_sales_foundation.py` defines revision `e26a_sales_foundation`, descendant of `e25a_inventory_ops`. Create three tables and add `sale_id` y `sale_line_id` optional to `stock_movements`, its FK/index/unity and extended CHECK of origin/sign. It does not modify historical quantities of E2-4/E2-5.

**Deliberately protected downgrade:** migration prevents reversal when there are sales in `sales`. No probar `downgrade` in the testing company or on bases that you want to keep. No other SQL migration is necessary for B/C/D.

### 8.3 Secure local development (Windows PowerShell)

From `plataforma-pyme/`, to validate **only** the existing evidence base:

```powershell
git switch feature/e2-6-ventas-integradas
git pull --ff-only origin feature/e2-6-ventas-integradas

Push-Location backend
$env:DB_NAME = "asistente_pyme_e26b_test_20261109_134652"
$env:RUN_DB_INTEGRATION = "1"
try {
    .\.venv\Scripts\python.exe -m alembic current
    if ($LASTEXITCODE -ne 0) { throw "Alembic current falló" }
    .\.venv\Scripts\python.exe -m alembic check
    if ($LASTEXITCODE -ne 0) { throw "Alembic check falló" }
    .\.venv\Scripts\python.exe -m pytest -q
    if ($LASTEXITCODE -ne 0) { throw "Regresión fallida" }
} finally {
    Remove-Item Env:\DB_NAME -ErrorAction SilentlyContinue
    Remove-Item Env:\RUN_DB_INTEGRATION -ErrorAction SilentlyContinue
    Pop-Location
}
```

Do not create or destroy Docker volumes, do not reset QA data, do not run `alembic downgrade` the API container of the `compose.yaml` use, by default, the base `asistente_pyme` in HTTP port 18000: **no** confuse that environment with local Swagger, explicitly configured for the time base.

For local Swagger, from `plataforma-pyme/backend`, on another dedicated console, set `$env:DB_NAME` to the time base and start `uvicorn app.main:app --host 127.0.0.1 --port 8000`Interface: `http://127.0.0.1:8000/docs`.

## 9. Inventory of implemented tests

The seven modules incorporated into the branch include the following main scenarios:

| File | Tests/focus |
|---|---|
| `test_sales_schemas.py` | 7 tests: split/discount, invalid amounts, zeros, strict types, HALF_UP, digest, limits |
| `test_sales_http.py` | 3 tests: route exposure, authentication and server owned fields |
| `test_sales_api_integration.py` | 7 tests: service and replay, physical tenant/stock, split, invalidation, mixed, rollback missing, SELL/STORE |
| `test_sales_atomicity_integration.py` | 2 tests: previous debit reversed by second item insufficient; late failure with full rollback |
| `test_sales_concurrency_integration.py` | 3 tests: last unit in parallel, same simultaneous request and two valid concurrent sales |
| `test_sales_inventory_interop_integration.py` | 3 tests: sale–reception–transfer–adjustment, non-existent balance and snapshot replay after reception |
| `test_sales_permissions_integration.py` | 3 tests: Active assignment, revoked membership and revoked session |

**Total functions `test_` of these seven files:** 28. This account does not amount to the total number of tests for the entire application and does not include model testing and migration of E2-6 A.

### 9.1 Operator confirmed regressions

| Stage | Local evidence provided |
|---|---|
| B | 14 targeted tests; regression `864 passed, 1 warning` |
| C | 17 targeted; 10 of attendance/API; 22 of interoperability; regression `872 passed, 1 warning` |
| Security and D | 16 safety; 9 focused hardening |
| **Last code regression** | **879 passed in 132.08s**, no warnings |
| Migration | `e26a_sales_foundation (head)`; `alembic check`: no new operations |

Validation time base: `asistente_pyme_e26b_test_20261109_134652`.

**GitHub Actions:** successful execution of the branch for code SHA `a66c180`: historical CI run 42684413403 The history consulted does not exhibit a subsequent execution for exclusively documentaries.The green record should not be presented as IC of a future commit not yet executed.

### 9.2 Proven manual Swagger tests (2026-11-09)

Company `fc37e4ff-9e26-423b-946e-a9cc0b662360`; local `013860da-e39b-4028-a080-1ae0638ae482`; product `dfbef980-9d7b-4810-9d04-ab0e4f51c86f`; service `740f0ed2-4371-4de3-bd0d-d218f9b53c34`.

| Scenario | Observed HTTP | Evidence |
|---|---|---|
| Register user/company; create good, service and location | 201 in each creation | Company and premises; SELL/STORE |
| Initial stock | 201 | `STOCK_INICIAL +10000`; balance 10000, version 1 |
| Initial inventory | 200 | `quantity_milli=10000`, `version=1` |
| Physical sale 2 units | 201 | `sale_id=def970fc-6b45-48cb-ba65-a5ca994c3fdd`; balance 8000, version 2 |
| Mixed sale well + service | 201 | `sale_id=61108b12-df7e-4da6-8046-ddde75eedba4`; total 650000, payments 300000+350000; balance 7000, version 3 |
| Identical Replay | 200 | Mismo sale_id, lines, payments, created_at y snapshot |
| Sale of 10 units with 7 available | 409 | Insufficient stock message; balance 7000/version 3 |
| Lectura de ledger | 200 | **3 exact events**: +10000, −2000, −1000; two sales linked to their lines |

Conciliation: `10000 - 2000 - 1000 = 7000`. The service did not generate physical movement. The failed attempt and replay did not add movements. The query ledger showed events in reverse chronological order (the two sales and then the initial stock).

**Delimited coverage:** This is a credit to the main creation/replay/stock circuit and does not replace manual clearance tests with multiple users, external payment testing, independent audit or long-term load testing.

## 10. Decisions and non-objectives

1. **Declarative payments, not settled.** No card, bank, wallet, cash or monetary account receives a confirmed financial effect on this block.
2. **No implicit inventory authorization.** Physical sale requires SELL and STORE, and consumes the balance of the actual selling location, not a chosen deposit automatically.
3. **Historical preserved.** A confirmed voucher is not edited in this module; snapshots and movements record the event.
4. **No negative stock.** Conditional debit avoids confirming a sale without availability; subsequent failures reverse everything.
5. **Explicit willpower.** `Idempotency-Key` mandatory, per company; valid replay does not create new moves.
6. **No sale of catalog from another or inactive.** Tenant, condition, sales fitness and unit are verified.
7. **No sales screen connected to this backend on E2-6.** The frontend previous demo does not replace this real API.
8. **No refund/cancellation.** Future sales reversal requires explicit operation, authorisation and compensatory leadger, not retroactive editing.
9. **No QR operational collection.** The future Pago Market architecture must maintain a connected account per company, differentiate QR from the QR item of collection and process verified webhooks accreditation.
10. **Do not modify historical functionalities as shortcut.** Integrations with purchases, receptions and transfers retain their contracts and motives of movement.

## 11. Known limits and maintenance considerations

- Automated sequential intercalation sales tests were observed with receipt/transfer/adjustment and concurrent testing between sales. This does not amount to verifying all intermodule sequences under simultaneous load.
- `SaleView.balances_after` is exposed as `list` generic in the Pydatic scheme: the documented JSON form comes from the service, but Swagger could display generic elements instead of a typical structure. It is a descriptive limitation of the contract, not evidence of inconsistency of balance.
- Replay control occurs after checking the location. If a location's status/capacity changes after the original sale, the ability to recover the idempotent response requires a formal decision of historical authorization policy. That policy is not altered here.
- The sales session implements location blocking and cataloging and conditional balance transactions. No absolute absence of deadlocks or all race conditions under any client or isolation is stated; these conclusions require specific review.
- The discount is an aggregate amount per item. The ledger retains one movement per line; both representations must maintain accounting equality.
- The response of a sale contains price requested by the customer, does not automatically replace that amount by `CatalogItem.price_cents`. Price/discount authorization and future business policy should be defined outside this court if the application evolves.
- There is no general mechanism for the reserved inventory or discount of recipes or inputs by sale of a product produced.
- Cases of 401/403/404/409/422 should be kept safe against third party tenants and not filter sensitive business details from third parties.

These are **operational conditions and verifiable limits**, not a list of proven failures or an audit report. The independent review should distinguish plausible risk, reproducible scenario and confirmed defect before proposing changes.

## 12. Closing criteria and next cycle

| Criterion | Status at 2026-11-09 |
|---|---|
| E2-6 A persistence and migration | **Completed**; incorporated into `main` |
| B/C/D branch sales API | **Implemented** |
| Local automated testing | **Approved in code `a66c180`** |
| IC on validated code | **Success** |
| Swagger main circuit | **Approved** and reconciled |
| Comprehensive technical memory and traceability | **Completed with this document** |
| Independent audit | **Pending**, separate document |
| Decisions on accepted findings | **Earrings** |
| Final regression after possible corrections | **Pending if code changes** |
| Single PR to `main` | **Not open for this delivery** |
| Merge final | **Pending approval and IC** |

**Order set:** (1) document E2-6; (2) issue separate independent audit report; (3) accept/reject each finding with evidence and apply only what is accepted; (4) execute regression and verify IQ in the definitive SHA; (5) review diff and open a single PR; (6) merge once if the review is satisfactory. Do not reinterpret Swagger's approval as merge authorization.

## 13. Repository references

- [Database contract, E2-6 A](E2-6_A_MODELO_VENTAS_Y_PAGOS.md) — historical design document A; some 'pending' notes describe the time of its drafting.
- [Physical implementation contract, E2-6 C](E2-6_C_CONTRATO_VENTAS_STOCK.md) — invariants planned before C, subsequently implemented.
- [Technical delivery and evidence of E2-6 E](E2-6_E_ENTREGA_TECNICA_Y_VALIDACION.md) — test results, IC and Swagger.
- [Independent audit protocol](E2-6_AUDITORIA_SELECTIVA_PROTOCOLO.md) — **future procedure other than this documentation**.
- `docs/ADR/ADR-004-stock-unidades-sku.md` — units, quantities and catalogues.
- `docs/ADR/ADR-006-ventas-pagos-qr.md` — sales, payments and QR decisions.
- `docs/20_E1_C1_VENTAS_DEMO.md` — historical visual design of demo sales.
- `entrega-programacion-2/` — academic record and general technical documents.
