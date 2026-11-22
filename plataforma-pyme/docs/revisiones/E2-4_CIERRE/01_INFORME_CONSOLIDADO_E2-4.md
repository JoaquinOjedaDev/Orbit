---
type_document: "INFORME_DE_CLOSURE"
block: "E2-4"
status: "COMPLETED_PARA_ALCANCE_BACKEND"
project: "Platform PyME — Programming 2 UNSAM 2C2026"
date_cut_evidence: "2026-11-08"
commit_cierre: "4f88416141c09a82e744990b1aee8c00b9f31dfd"
p_functional: [12, 13, 14, 15, 17]
pr_correction_tests: 18
local_tests: "797/797"
ci_status: "SUCCESS"
ci_run: 42530739959
manual environment: "Windows + Swagger UI + PostgreSQL 16"
classification: "CI verified / local reported / Swagger reported"
---

# Consolidated closure report E2-4

**Multi-company management platform for SMEs**  
**Final Programming Work 2 · UNSAM · 2C2026**  
**Cut:** 8 November 2026 · **Rama:** `main` · **Last documented merit:** `4f88416141c09a82e744990b1aee8c00b9f31dfd`

## 1. Executive summary

The block **E2-4** built and validated the backend circuit of **suppliers → purchase registration → full physical reception → inventory balances and movement ledger**. The system maintains company isolation and explicitly separates the **commercial registration** of a purchase of its **physical effect** The business example of testing is called *QA Test Trade*; the solution is not restricted to that item or WALOS.

The A-E increments were integrated through the **PR #12, #13, #14, #15 y #17**, plus the **PR #18** to correct SQL tests that assumed an empty base. In local closing, on Windows and PostgreSQL **with pre-existing QA data**, obtained **797 approved tests of 797** en `95,24 s`. A previous execution had thrown **781 approved and 15 failed** by SQL assertions not filtered by tenant; the correction was revalidated with **20/20 tests of the affected file**, **797/797 global** y **3/3 Green jobs in IC**.

Manual functional validation used Swagger UI. A free concept purchase was created by **12.505 cents** (`CERRADA_SIN_RECEPCION`) and a purchase of **10 physical units** por **1,000,000 cents** (`REGISTRADA`). The latter was received once in *QA deposit*: observed `201 Created`status `RECIBIDA`, movement `+10000` thousandths and balance `10000` with version `1`. The same attempt with the original idempotence key returned `200 OK` without doubling the input; another key returned `409 Conflict`A leaked GET confirmed the only historical movement.

**Conclusion:** the scope committed to E2-4 is implemented and has sufficient automated and manual evidence to document the academic closure of the block. **no** is equivalent to stating that the complete TP, integrated frontend, sales or entire inventory are completed.

## 2. Block objectives and matching requirements

- **RF-05 / CU-06:** record a purchase with optional supplier, physical lines or concepts, exact amounts and snapshots. **no** modifies stock.
- **RF-05 / CU-07:** confirm a **single full reception** of a purchase with physical goods, in a valid location, with permission `STORE`, transactional changes and secure re-attempts.
- **RF-06 / CU-08, part one:** consult balances by company/location/article and consult auditable physical entries.
- **RF-03 / CU-04, dependencia:** use real locations, states and capabilities; not invent deposits when creating a company.
- **RF-04 / CU-05, dependencia:** catalog typed, active, with units of measurement and validation of history.

The full matrix appears in `05_TRAZABILIDAD_Y_PENDIENTES.md`.

## 3. Scope by increase

| Cut | Deliverable | Verifiable outcome |
|---|---|---|
| **E2-4 A** | Entity `Supplier`, PostgreSQL restrictions, migration `e24a_suppliers` y tests | Persistence isolated by company; no automatic purchases or stock |
| **E2-4 B** | Providers' REST API (high, listing, detail, editing and status) | Field validation, standard name, permits and multi-company isolation |
| **E2-4 C** | Entities `Purchase`, `PurchaseLine` migration `e24c_purchases` | Buy and lines with snapshots, cents and thousandths, without implicit reception |
| **E2-4 D** | Purchase and Migration API `e24d_purchase_hash` | `POST/GET/GET detalle`, idempotency, calculation of totals and statements |
| **E2-4 E** | `PurchaseReceipt`, `StockMovement`, `StockBalance`, migration `e24e_receipt_stock` y endpoints | Single reception, movement per line, atomic balance, GET receipt/salts/ledger |
| **PR #18** | Correction of purchase tests based on pre-existing data | Tests with tenant/document queries, without cleaning QA data |

### 3.1 Business rules effectively covered

1. A physical purchase may exist **no reception location**. Register purchase does not increase stocks.
2. Shopping without physical lines remains `CERRADA_SIN_RECEPCION`; they don't have a invented reception.
3. A purchase with at least one physical line is born `REGISTRADA`. When you receive it completely passes to `RECIBIDA`.
4. The reception is confirmed in **one active location** con `can_store=true`. Commercial sales permit (`can_sell`) is independent.
5. The reception uses **historical quantities** of the lines, not amounts forwarded by the client. A command does not accept partial or multi-destiny reception.
6. Only physical goods generate movement. Services and concepts do not alter stocks.
7. The receipt record, movements, balances updates, purchase status and idempotent response are made in the same transaction.
8. A repeated idepotent key with the same purchase, load and actor returns historical result (HTTP `200`); a different key after success does not re-enter merchandise (`409`).
9. The consultations and composite FKs restrict references to the same `business_id`.
10. An item with a purchase history or stock cannot reinterpret your **type or unit** by editing Catalogue; historical snapshots are maintained.

## 4. Technical design and integrity

**Stack:** FastAPI/Pydatic, SQLAlchemy 2, PostgreSQL 16, Alembic, Docker Compose; frontend React + Existing TypeScript/Vite, but **not connected to this API in the E2-4 cut**.

**Commercial persistence.** `suppliers` stores tokens per tenant, with unique canonical name. `purchases` saves document, date, optional provider, status, total and actor; `purchase_lines` retains line, optional item, historical description/type/unit/SKU, thousandths amount and total cost/cents. They are not rewritten retrospectively for editing a supplier or an item.

**Physical persistence.** `purchase_receipts` records proof, purchase, location, actor and a footprint for idempotency; is limited to **0.1 Reception per purchase**. `stock_movements` records a positive movement per physical line with references to receipt, line, article, location and actor. `stock_balances` project transactional balance by key `(empresa, ubicación, artículo)` and a `version` incremental.

**Atomic operation.** The reception service blocks relevant operational records, revalidates status/permission and uses `INSERT ... ON CONFLICT DO UPDATE` in PostgreSQL to increase balances, even when the stock row does not yet exist. Uniqueness in receipt and by receipt/line avoids duplication; a failure cancels the entire transaction.

**Cautela conceptual:** the leader of this cut contains only events `COMPRA_RECEPCION` and is presented as *non-editable history by the API*. The architecture behind it foresees other origins (sales and operations), but they are not implemented here. No universal guarantee of immutability is presumed against privileged SQL modifications.

Contracts and restrictions are developed in `04_ARQUITECTURA_API_Y_DATOS.md`.

## 5. Evidence of execution: automation and environment

### 5.1 GitHub Actions

Each cut had successful final execution with **Python 3.12, Python 3.14, PostgreSQL 16, Alembic and Docker construction/healthcheck revision**.

| Cut | PR | Tests by version in IC | Execution of Actions |
|---|---|---:|---|
| A | #12 | 598 | 42511812005 |
| B | #13 | 693 | 42514595377 |
| C | #14 | 717 | 42520791923 |
| D | #15 | 772 | 42523855898 |
| E | #17 | 796 | 42528940012 |
| Corrigendum | #18 | **797** | 42530739959 |

**Migration reviews by cut:** A/B `e24a_suppliers`; C `e24c_purchases`; D `e24d_purchase_hash`; E and correction `e24e_receipt_stock`.

All the work of the six executions indicated ended in **`success` (3/3 por run)**. In the last run Python 3.12 and 3.14 obtained **797 tests approved**. Observed **a non-blocking warning** in the log of that execution; there were no faults.

### 5.2 Validation in Windows with existing QA data

After integrating PR #17 to `main` and apply new migration, the developer observed:

- `e24e_receipt_stock (head)`.
- `No new upgrade operations detected.`.
- `781 passed, 15 failed` al ejecutar toda la suite: **15 old assertions failed `test_purchase_integration.py` that consulted all purchases of the base rather than limited to the tenant/document of the proof**.
- Docker FastAPI y PostgreSQL `healthy`; `GET /ready` delivered `status=ready`, `database=ok`.

On this base there were the QA purchases created manually. The test waiting for a line found three: **two pre-existing QA lines and the line created temporarily**; another proof I used `scalar_one()` no filter received `MultipleResultsFound`It was not a business violation at the reception: it was a test design error that IC, with a clean base, had not exposed.

PR #18 limited assertions to `business_id`, `purchase_id` or the application identifier, and added a regression with data from two companies. **Undelete base**, after `git pull` the developer executed:

- `pytest -q tests/test_purchase_integration.py` → **20 passed in 6.54s**.
- `pytest -q` con `RUN_DB_INTEGRATION=1` → **797 passed in 95.24s**.
- Commit de `main` observed in the merge: `4f88416141c09a82e744990b1aee8c00b9f31dfd`.

**Scope of this evidence:** local integration was verified on the existing basis; QA purchases were not eliminated, and PR #18 correction **only modifies tests**. For technical details, consult `03_PRUEBAS_AUTOMATIZADAS_Y_CI.md`.

## 6. Evidence of use tests (Swagger IU)

### 6.1 Preparation

- Used `http://127.0.0.1:18000/docs`, with Beerer authentication obtained by login. Swagger session should have been reset after re-opening the interface; **PostgreSQL data remained persistent**.
- A single company QA was operated: `bd4d4e42-4ff6-403a-8633-59cbc001487d`.
- Existing supplier and article identifiers were used. The deposit was created `Depósito QA` when the location GET showed `[]`.
- The Commands `POST` idepotent required a UUID4 header key; **values are omitted** deliberately in this delivery.

### 6.2 Administrative purchasing scenario (out of stock)

1. `POST /purchases` with a free concept *Outdoor cleaning service*: `quantity_milli=1000`, `unit_cost_cents=12505`, without supplier or catalogue, reference `QA-COMPRA-001`.
2. HTTP **201**: purchase `b6646fcd-428f-4b9b-ab80-83e7ffb14827`status `CERRADA_SIN_RECEPCION`total `12505` cents, one line `CONCEPTO`.
3. Repeat the same command and key: **200** with same `id`, `created_at` And line.
4. Reuse of the same key but with altered cost to `20000` cents: **409**, detalle **‘Reusable purchase key with different content’**No other purchase was created.
5. `GET /purchases?offset=0&limit=100`: **200**list of **a purchase** at that time; `GET /purchases/{id}`: **200** with the original data.

### 6.3 Physical purchasing and reception scenario

1. `POST /catalog`: ♪ QA balanced food ♪ `REVENTA`, type `BIEN`, SKU `ALIM-QA-001`unit `UNIDAD`, Reference cost `100000`, sales price `150000` cents → **201**Article `881fdae2-18c5-46ae-8037-44a500ca96c0`.
2. `POST /purchases` with supplier * QA distribution*, previous article, `quantity_milli=10000` (10 units), `unit_cost_cents=100000` ($1,000 per unit), reference `QA-COMPRA-002` → **201**Purchase `3e50aff2-c895-49d9-8fe5-d5843438f109`status `REGISTRADA`total `1000000` cents ($10,000), **still unstocked**.
3. `GET /locations` → **200** y `[]`: the company had no deposits.
4. `POST /locations` with #QA tank #, `kind=DEPOSITO`, `can_store=true`, `can_sell=false` → **201**location `2d6761c4-efec-4b3e-925c-a24ceab8ce9c`status `ACTIVA`, `is_primary=true`.
5. `GET /locations` → **200** and list with the deposit; `GET /purchases/{id}` → **200** confirming status `REGISTRADA` before you receive.
6. `POST /purchases/{id}/receive` with `location_id` deposit → **201**: Reception `266bd03e-763b-4f29-8f12-c19c9bc59066`, buy `RECIBIDA`, a movement `+10000` y `balances_after.quantity_milli=10000`, `version=1`.
7. A second POST with **other** key was rejected with **409** y detalle **‘Buy already received, cancelled or without physical goods receptionable’**; expected rejection, no module failure.
8. A POST of retrying with **the original key and body** returned **200**, same receipt, movement, author and date of receipt.
9. An initial set of balances with a `location_id` example incorrect returned **200, `[]`**: filter without matching, no stock loss.
10. `GET /inventory/balances` filtered by the correct deposit and article → **200**, **balance** de `10000` thousandths and `version=1`.
11. `GET /inventory/movements` with the same filters → **200**, **one single movement** `COMPRA_RECEPCION`, `delta_milli=10000`, with reference to purchase, receipt, line, location and actor.

**Business result:** the commercial purchase has recorded the obligation/document without creating existence; the subsequent receipt has added **exactly 10 units** The retry accepted and the rejection by different key did not duplicate goods.

The file `02_BITACORA_PRUEBAS_SWAGGER.md` keeps JSONs input without keys, successful responses and errors, dates and execution protocol.

## 7. Summary acceptance matrix

| Criterion | Evidence | Opinion |
|---|---|---|
| Register concept without location or stock | Buy QA-001, `201`, `CERRADA_SIN_RECEPCION` | Implemented |
| Idempotence and conflict of purchase | Retry `200` and change of load `409` | Implemented |
| Procurement enquiries | Listing and detail `200` | Implemented |
| Physical Purchase with Real QA Provider | Purchase QA-002 `201`, `REGISTRADA` | Implemented |
| Create suitable location | `POST /locations` `201`, `ACTIVA`, `can_store` | Implemented |
| Receive complete at a destination | `POST /receive` `201`, `RECIBIDA` | Implemented |
| Avoid double income | Second key `409`; same key `200` | Implemented |
| View Current Balance | `GET /balances` `200`, 10,000 thousandths | Implemented |
| See entry traceability | `GET /movements` `200`1 move | Implemented |
| Tests based on QA data | 20/20 focal and 797/797 general Windows | Implemented |
| Integrity/roles/rollback/concurrence | Suite CI + integration tests in PostgreSQL | Covered by automated testing; not comprehensive manual travel |
| API CRUD provider in Swagger | Implemented and tested in IC | No complete manual transcript attached; no manual path statement |

## 8. Limitations, risks and further work

The block does not include partial reception, multiple deposits in a single reception, cancellation by API, returns, transfers, adjustments, sales outings, billing, payments actually charged, reconciliation of accounts, Market Operating payment, React-API integration or production deployment. `GET /inventory/balances` and movements are **the first part of RF-06**Not a complete inventory module.

The authorization and concurrence were exercised by the automated suite, including evidence of two simultaneous applications against PostgreSQL; the evidence does not amount to a prolonged load test or external security audit. The non-blocking IC warning is noted, without stating a performance defect.

**Next suggested stage:** preserve this evidence, review with the partner and continue the incremental construction plan; before the next cut it is advisable to agree on the governing plan whether to expand inventory operations or advance with sales according to priorities of TP3/TP Final.

## 9. Conclusion of closure

The documented evidence shows that E2-4 introduces a **physically consistent circuit** and reproducible for purchases and receptions in the multi-company generalist backend. The observed data and responses match the rules: **purchase**, **single reception**, **stock by location**, **traceable movement** y **retrying without duplicates**The incident of 15 tests on Windows led to a concrete improvement in the isolation of the test environment, revalidated with the populated base.

It is recommended to declare **E2-4 completed in the functionally defined and validated backend range**, with explicit earrings; **no** declare the completed TP or production system.

## 10. Primary sources of this delivery

- Repositorio y commits: https://github.com/JoaquinOjedaDev/Orbit
- PR: #12, #13, #14, #15, #17, #18.
- Repo documents: `plataforma-pyme/docs/E2-4_A_PROVEEDORES_MODELO.md`, `E2-4_B_API_PROVEEDORES.md`, `E2-4_D_API_COMPRAS.md`, `E2-4_E_RECEPCION_Y_STOCK.md`.
- Requirements: `plataforma-pyme/entrega-programacion-2/02_CASOS_DE_USO.md`, `03_MODELO_DE_DOMINIO_Y_UML.md`, `05_MATRIZ_API_Y_TRAZABILIDAD.md`.
- Manual results: Swagger and PowerShell transcripts provided by the developer on 11/08/2026; the logbook `02` records them without credentials or keys.
