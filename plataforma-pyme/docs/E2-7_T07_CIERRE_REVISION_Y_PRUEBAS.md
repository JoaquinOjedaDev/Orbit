# E2-7 T07 — Comprehensive review, testing matrix and integration decision

**Date of revision:** 10/11/2026  
**Repository:** `JoaquinOjedaDev/Orbit`  
**Revised branch:** `feature/e2-7-t07-proveedores-compras-recepcion`  
**PR:** #40  
**Closing code reference (before this document):** `279f61ab409fb33785d4fcd9d097184903815f86`  
**Base:** `main` — `fed4f8282fed964cdfb00bf96c07a5ab71e7eb75` (T06).  
**Technical Decision:** * Suitable for T07 integration, with additional QA risks listed and transferred to T08/T11*. Do not confuse this decision with closing all E2-7.

## 1. Real scope of change and traceability

Comparison `main...feature/e2-7-t07-proveedores-compras-recepcion` on the pre-report reference: **14 modified/created files, 56 commit, 0 commit overdue**, GitHub branded PR mergeable. Frontend Reaction/TypeScript, frontend tests, workflow frontend and T07 documentation were modified. **FastAPI, Alembic migrations, Docker and DEMO fixtures were not modified.**

They were integrated:
- REAL Providers by company: paged listing, initial high, change of status and visibility according to role.
- REAL purchases: optional suppliers, catalog lines or free concept, quantities in thousandths, costs in cents and historical snapshots, pagado history.
- Atomic buy-in: only physical products generate stock entry, with active headquarters and `can_store`, backend authorization, key ID and server voucher.
- Recording of pending attempts to purchase/receive in IndexedDB **by actor, company and operation** before POST, with original identity, body and key; Bearer tokens do not persist.
- Visual cost improvement: proposed `reference_cost_cents`, quantity × unit cost, explicit edition for total amount only if it is representable exactly in cents, total document and warning not blocking if cost > sale price.
- Status `REGISTRADA · RECEPCIÓN PENDIENTE` on amber and `RECIBIDA` Green.
- Reconciliation of 404 receipt: second GET of the own document before reporting that there is no proof yet; without fake permissions on purchases from others.
- "Reception Details" panel with headquarters name, backend time, responsible if session relevant, traceability identifiers, product snapshots, movements and balance after.
- Separation **REAL / DEMO** preserved: neither actual costs nor stocks are deducted from `demoStore`.

## 2. GitHub Actions automated evidence

**Workflow `Plataforma PyME · Frontend`, run #42812095691, result: SUCCESS (two jobs), SHA functional `279f61ab409fb33785d4fcd9d097184903815f86`.** The job log `frontend` credit `npm ci`compilation, compilation `tsc -b && vite build`, `oxlint` with 0 errors/0 warnings and the following suites:

| Suite | Cases | Approved | Judgements | Scope |
|---|---:|---:|---:|---|
| `test:api` | 11 | 11 | 0 | HTTP, errors, bearer, cancellation, timeout |
| `test:auth` | 6 | 6 | 0 | Log, login, profile, logout |
| `test:businesses` | 13 | 13 | 0 | Businesses, tenant, reading, creation idempotente |
| `test:operations-real` | 14 | 14 | 0 | Locations, equipment, invitations and permits |
| `test:catalog-real` | 15 | 15 | 0 | Catalogue, cents, pagination and tenant |
| `test:pending-commands` | 12 | 12 | 0 | Command Identity and IndexedDB |
| **`test:supply-real` (T07)** | **37** | **37** | **0** | Suppliers, purchases, reception, replay, amount, panel |
| `test:accounts` | 14 | 14 | 0 | DEMO Module |
| `test:sales` | 14 | 14 | 0 | DEMO Module |
| `test:cash` | 13 | 13 | 0 | DEMO Module |
| `test:qr` | 3 | 3 | 0 | DEMO Module |
| `test:inventory` | 13 | 13 | 0 | DEMO Module |
| **TOTAL** | **165** | **165** | **0** | Suites frontend de CI |

**Job Chromium:** 6/6 approved paths (3 scenarios executed on desktop and mobile): navigation and URL of others, drawer/focus/desbords, flow of service/QR **DEMO**. **Scope warning:** Current Chromium routes do NOT lift FastAPI/PostgreSQL or replace the REAL E2E provided for in T11.

**Unhidden warnings:** Vite points to a chunk JS of >500 kB (future optimization of code splitting). Runner logs provide pre-emption warnings for components Node/Action GitHub and modules `punycode`/`url.parse()`None was a job failure; keep them visible and review them when the tooling is updated, without artificially increasing limits.

## 3. REAL manual evidence in the browser — TEST data

The following results are based on messages, logs and catches shared by the responsible during development; **do not represent an independent execution of a new E2E environment**.

| ID/group | Evidence | Outcome |
|---|---|---|
| T07-01 / T07-02 | `Proveedor A T07` created, disabled and reactivated; query from PostgreSQL | **Approved** |
| T07-03 | First purchase `2 UNIDAD × $2.000,00 = $4.000,00`, `REGISTRADA` no reception | **Approved** |
| T07-04 / T07-05 | Reception at headquarters and subsequent consultation: `RECIBIDA`, 1 movement; do not forward when consulting | **Approved** |
| T07-06 | `concepto libre T07`: 5 CONCEPT × $500.00 = **$2.500,00**, without supplier; `CERRADA SIN RECEPCIÓN`, no action to receive | **Visually Approved** |
| T07-07 | TEST Company A shows supplier and purchases; TEST Company B: **0 suppliers, 0 purchases** | **Approved in Lists** |
| T07-08 | Miguel with role WORKER can read purchases/suppliers; without vendor registration; separate membership headquarters permits | **Approved in IU** |
| T07-10/11 (partial) | Recuperation intention with original key after re-entry; 404 absent recognized with second GET; no automatic POST; subsequent explicit reception | **Observed recovery**; artificial network cutting and unresponsive POST not fully reproduced |
| Reception of Miguel | Headquarters A TEST previously `NO ASIGNADO`; after assignment and explicit confirmation, purchase `Compra2 prueba E2-7 T07` of $9,200.00 went on to `RECIBIDA` | **Approved**; real authorization backed by backend |
| Detailed check | Catch `CONFIRMADA`, `Sede A TEST`, `miguel`date 10 Nov 2026 8:23 a.m., **+5 UNIT Product A TEST**, balance later **11 UNITY**; no movement service | **Visually Approved** |
| Reference cost / formula | Proposal $8,000.00, quantity and unit editable, automatic subtotal, total line and total document; warning if cost exceeds sale | **Visually Approved** |
| T07-14 | DEMO Catalogue and Inventory: Hydrolyzed Collagen, Rinse Cream, Shampoo; Filters, Cards, Locations, Proven Actions; Without Visible Mixing of REAL Data | **Approved on revised screens** |
| T07-19 | Historical purchase retains original amount to list; existing catalog reference does not replace historical cost | **Approved in Lists** |

**Accuracy:** catch of `RECIBIDA` and the voucher is evidence of the status returned by the backend; the balances and movements were not verified in an independent SQL query in this review. It is avoided to say that balance 11 amounts to a globally reconciled inventory: T08 will perform that reading.

## 4. Existing backend contracts and controls contrasted by reading

No backend changes were made to this PR. It was revised that the repository contains the following PostgreSQL integration tests:

- `test_purchase_api_integration.py`: mixed purchase and snapshots; concept/service without stock; replay 201/200/409; idempotence per actor; supplier/other person's article rejected; roles/company suspended; pagination; rollback.
- `test_receipt_api_integration.py`: atomic reception; historical balances; replay; authorization of assigned versus unallocated worker; location outside, paused and without storage; unit/type changes; rollback and DB restrictions.
- `test_receipt_concurrency_integration.py`: simultaneous reception with equal/different key; avoid duplicates, sum of concurrent entries.
- `test_supplier_api_integration.py`: roles, reactivation, enterprise uniqueness, isolation between tenants, states, pagination and rollback.
- `test_location_assignment_integration.py`: active assignment, revocation, 409 in paused location and isolation between companies.

**Pytest was not executed again for this closure.** The existence and reading of these tests validates the backend coverage design, not attributed to this closure a result of non-existent execution.

## 5. Findings, residual risks and decision

**No confirmed blocking defects were detected to integrate the T07 range.** The backend maintains authority over roles, access to business, location permits, transactions, snapshots and stock. The client does not automatically forward deeds or reuse DEMO data; the same key/body persists in idepotent operations.

| Risk / deferred QA | Current evidence | Treatment |
|---|---|---|
| T07-09: Direct URL of purchase from others as a worker | Tenant/ID backend tests and frontend mocks; no specific manual test | T11 E2E REAL against two companies, 404 without leak |
| T07-10: Loss of discharge response and recovery after F5 | Unit journal and API tests; T06 experience; non-fall controlled for purchase T07 | T11 full-stack with network cut and one purchase |
| T07-11/12: replay received after loss of response | Successful manual key recovery, GET receipt and reception; backend tests 201/200 and attendance | T11 repeat with discontinuation/observation of ledger in ephemeral DB |
| T07-13: quiet location / `can_store=false` | Tests de backend de 409, control frontend por lista de sedes activas | T11 real negative and no movement |
| T07-15: >100 records (catalogue/supplier/buyer) | Offset/limit implementation and contract/backend tests; no manual dataset 101+ | T11 synthetic dataset pagado |
| T07-18, T07-20, T07-23: extreme amounts, `null` vs 0, total impossible | Pure cent tests/HALF_UP/state, not all visually tested | T11 Expand Form Scenarios |
| IndexedDB sin cifrado, token en memoria | Documented risk and informed acceptance; no persistent credentials | Keep recommendation not to use shared devices; review UX sessions on closing |
| Performance y warnings de toolchain | Bundle JS >500 kB, Node deprecado en Actions | Optimization and dependencies after closing functional integrations |
| Real E2E in IC | Current Chromium DEMO 6/6; real T07 manual, previous integration backend | **T11** must lift FastAPI/PostgreSQL on ephemeral basis with Playwright on same SHA |

**Door T07:** the central commercial flows have been tested by real user in browser and frontend coverage in IC is green. The reception was verified with assigned collaborator, with manual idempotency and proof. The remaining evidence is not discarded: they are moved to the QA matrix of T11 as verifiable work. The above limitations are accepted **only for incremental closure of T07**; not authorised to declare complete T11 or E2-7.

## 6. Transfer and forthcoming increases

**T08 — REAL Inventory:** query of authoritative balances and pagulated movements by headquarters, use of units in thousandths and IU of balances, transfer between locations with an atomic operation, initial inventory and counting adjustment with `expected_version`, `409` with rereading and human reconfirmation. `RECIBIDA` → same balance/movement from API, without adding twice.

**T09 — Sales support:** define history/recovery contracts by `request_id` and historical replay policy when you change headquarters authorization; test permissions. Decide the pricing/discount policy per role before the POS.

**T10 — POS REAL:** physical sale/service/mixed, declared payments, stock reduction and voucher; never mix accounts/box/QR DEMO with actual collections.

**T11 — Comprehensive QA:** backend PostgreSQL + frontend + Playwright contra **the same ephemeral base**, multi-tenant tests, network failures, reversal/rollback, 101/501 elements, adverse testing of permits and ledger verification; recover manual earrings without doubling movements.

**T12 — Academic closure:** contracts, UML, documents 01–05, README, REAL/DEMO/DIFFERED matrix, diagrams, evidence of IC and known boundaries.

**Recording of visual decisions:** Editable unit costs, automatic subtotals, total amount editable only when it has exact representation, suggestion from reference without overwriting the catalog, single supplier by purchase, amber/green light, internal receipt panel without PDF: recorded in QA main document of T07.
