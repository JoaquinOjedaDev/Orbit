# E0-C — Architectural decisions, executable backlog and E1 rating

**Product:** Generalistic management platform for SMEs, multi-business and multi-rubre. **WALOS is an example fixture**.  
**Repository:** `JoaquinOjedaDev/Orbit`current work force `main`; new work restricted to `plataforma-pyme/`.  
**Date:** 2026-11-06.  
**State of delivery:** **E0-C DOCUMENTED**; **functional/technical approval pending of equipment**No application was scheduled, no tests were performed and no academic backend was changed.  
**Responsible for the document:** integration assistance; **Implementation and approval officers:** team, to be designated by issue.

## 0. Quick reading and E0-constituted files

| Delivery | File | Outcome |
|---|---|---|
| E0-A | [`00_MATRIZ_INTEGRATION_HTML.md`](00_MATRIZ_INTEGRACION_HTML.md) | 19 HTML paths / 17 different contents; Zxxx fonts, UX selection, Hxx risks |
| E0-B | [`01_ARQUITECTURE_FRONTEND.md`](01_ARQUITECTURA_FRONTEND.md) | Proposed React/TS architecture, shell, routes, scoped status, demo commands |
| **E0-C** | **this document** | ADR States, priorities, tickets for E1, exit door |
| E0-C | [`03_TRAZABILITY_E0_C.md`](03_TRAZABILIDAD_E0_C.md) | Matrix requirement → HTML/Hxx → path → command → test |
| E0-C | [`ADR/`](ADR/) | Eight records of decisions, alternatives, risks, states and tests |

**Precedence:** explicit product agreements v3/v4 > Approved ADR > documented provisional safe rule > inherited UX > legacy script. **No ADR of this package amounts to tacit approval.** E1 starts with conservative variants and narrowed cases, and the team can reject alternatives before the code that depends on them.

## 1. Registration of decisions (ADRs)

| ADR | Item | Actual status | Provisional decision and limit |
|---|---|---|---|
| [ADR-001](ADR/ADR-001-tenencia-y-membresias.md) | Tenure and membership | **PROPOSAL** | Global User, Business and Membership by tenant; server will be responsible for security |
| [ADR-002](ADR/ADR-002-titularidad-administrativa.md) | Founder/administrative holder | **PROPOSAL** | Historical Founder and Unique Initial Administrative Holder; Future Transfer Blocked |
| [ADR-003](ADR/ADR-003-invitaciones.md) | Invitation vs. Request | **PROPOSAL**; link/QR request **DIFFERENT** | Nominative email first, request for link without automatic authorization |
| [ADR-004](ADR/ADR-004-stock-unidades-sku.md) | SKU, units, ledger | **PROPOSAL** | SKU per tenant; no negative stock; movements as authority; pending scale policy |
| [ADR-005](ADR/ADR-005-jornada-cierre.md) | Jornada/cierre/snapshot | **PROPOSAL**; ‘without arching’ **DIFFERENT** | Normal counted closure, immutable snapshot; separate physical return |
| [ADR-006](ADR/ADR-006-ventas-pagos-qr.md) | Sales, payments, QR | **PROPOSAL**; real MP **DIFFERENT** | Accurate payments; DEMO-related collection QRs; future API business sellers |
| [ADR-007](ADR/ADR-007-frontend-demo-gateway.md) | Frontend and status | **PROPOSAL** | React+TS+Vite, Router, Zustand, DEMO/API gateway, unified navigation |
| [ADR-008](ADR/ADR-008-integracion-con-tp.md) | Coexistence with TP and API | **PROPOSAL**; union of backends **PENDING** | New code in `plataforma-pyme/` without modifying brother projects for now |

### 1.1 Decisions that really block the next cut

**To start E1-A1 (seaable shell):**
- Review and accept **as a provisional assumption**, or reject with written alternative, the Stack React/TypeScript/Vite + React Router and route map (ADR-007).
- Agree that the design is recreated from Z003/Z014 and E0-A, **not copying JS global or iframes**.
- Confirm that all unbuilt screens will display **‘Next’** and that data/access user will be labelled **DEMO**.

**Before finishing E1-A2 (creation and company selector):**
- Validate ADR-001 and the **initial administrative title** of ADR-002; implement consistent membership and business isolation.
- Choose UX policy of drafts: **Proposed** keep them by code scoped or discard them after visible confirmation; never migrate between companies.
- Agree fixtures: WALOS, resale trade and services without premises/deposit.

**Do not block E1-A1:** expiration of invitations, transfers of title, SKU, fractional units, manufacture, returns, closing without arching, MP integration, final UML model and decisions on current backend. Those decisions are made just before the court that uses them.

## 2. Non-regression rules of the first prototype

1. **Multi-company:** views, operations, visible permissions, queries, history and drafts carry `businessId`; there is no A→B leak or duplicated personal profiles per company.
2. **Generic ruble:** goods and services; valid services without warehouse, recipes, trade fair, stock or physical box. Do not use WALOS as a mandatory product name/item.
3. **One navigation only:** sidebar left + Start with cards generated from `navigation.ts`; real or ‘nextly’ routes, without buttons that appear to be non-existent operations.
4. **One DEMO source:** any changes in purchases, stock, sales or cash register are made by typed gateway commands; projections and views read the same events/data.
5. **Stock preciso:** single reception; atomic transfer by origin/destiny; not negative; return with explicit missing and not missing.
6. **Accurate money:** discount before total; `1..n` payments add up exactly; values in pennies or exact decimals; digital accounts and cash are not confused.
7. **Auditable closure:** full snapshot before closing, persistent actor/date/difference; without reopening or erasing evidence; return is another command.
8. **External payments:** QR of non-QR receipt card; E1 only DEMO; a person cannot claim that unstated MP was paid verified by supplier.
9. **Honest security:** authentication/roles/consistency between tabs only simulated in IU; real secure rules will arrive with API and PostgreSQL.
10. **TP-shared protected:** do not move, delete or merge ``Proyecto-3-AppAdmin-Mascotas/`` ni ``Proyecto-3-Extendido-Generico/``; do not add credentials, actual fixes or temporary files without revision.

## 3. Priority Construction Backlog

**Meaning of priorities:** **P0** enables the following delivery; **P1** required for vertical commercial demo; **P2** extension. No estimated hours without equipment assignment.  
**Type of result:** `DEMO` (interface/simulated and verifiable status), `DOC` (document), `API` (future real services). **No row E1 means completed today**.

### 3.1 E1-A — First executable prototype, first

| Ticket | Priority | Dependencia | File/expected result | Observable acceptance |
|---|---|---|---|---|
| **E1-A1-01** | P0 | E0-C + ADR-007 provisional | `plataforma-pyme/frontend/` creado con Vite/React/TS, scripts y README | `npm install` y `npm run dev` load the app; no API/credentials |
| **E1-A1-02** | P0 | 01 | `app/router.tsx`, `app/navigation.ts` y placeholders | Start, valid routes and 404; menu and cards share a definition |
| **E1-A1-03** | P0 | 02 | `AppShell`, `SideMenu`, `TopBar`, `BusinessSelector` and tokens CSS | Left side menu desktop, mobile drawer, keyboard/functional focus |
| **E1-A1-04** | P0 | 02–03 | Personal home + business dashboard with cards | Each card opens a real view or ‘Next’; without ‘M1/M2/M3’ visible |
| **E1-A1-05** | P0 | 01–04 | Vitest/Testing Library, navigation test and smoke E2E | Logs reales; `E1A-BOOT-01`, `E1A-NAV-01/02` documented failures or failures |
| **E1-A2-01** | P0 | E1-A1 + Revised ADR-001/002 | DEMO session, global profile, company creation; fixes without secret | Uncorporated user creates A; an initial admin holder; not forcing location |
| **E1-A2-02** | P0 | A2-01 | `DemoGateway` type, store by company, selector A/B and guards UX | Change A→B does not mix permissions, drafts or dashboard |
| **E1-A2-03** | P0 | A2-02 | Tests DEMO tenant, URL alien, role changes, forms scoped | `DEMO-TEN-01` y `E1A-TEN-01..03` verified, demo clearly not safe |

**Specific UX reference E1-A:** E0-A **Z003** `Modulo 1/Menu_Principal.html` y **Z014** `Modulo 1/WALOS_Modulo1_v1_2/WALOS_Modulo1_Prototipo.html`; Z001 company forms. **Do not carry** storage `walos_demo_m1_v12`.

**Definition of the first verifiable milestone:** lift a SPA with top bar, sidebar and dashboard in the browser; enter a DEMO user without an enterprise; create A, create/change B, display different roles and no A data in B. The unimplemented shopping/sales screens should be "Next".

### 3.2 E1-B — Organisation, catalogue, purchases and inventory

| Ticket | Priority | Dependencia | E0-A behaviour and reference | Minimum test |
|---|---|---|---|---|
| **E1-B1-01** | P1 | A2 | Company Z001, Locations Z004 with optional sales/store capacity | Service without deposit; DEMO permits |
| **E1-B1-02** | P1 | B1-01 | Team Z002/Z014, Nominated invitation and financial account Z042; QR application ‘Next’ | QA-INV-01 specified; does not grant unapproved access |
| **E1-B2-01** | P1 | B1, ADR-004 | Catalogue Z069/Z050: bien, servicio, imágenes, estados, SKU por negocio | QA-CAT-01; unstocked service; SKU A |
| **E1-B2-02** | P1 | B2-01 | Suppliers Z073, purchase Z070/Z050, single command reception | Purchase does not receive alone; receive 10 once, retry idempotent |
| **E1-B3-01** | P1 | B2-02 | Inventory Z050/Z072 derived from ledger, history by location | Balance 10 correct in all views |
| **E1-B3-02** | P1 | B3-01 | Z050 transfers, Z072 count, atomic errors | Move 3 from 10 → 7/3; move 11 fail unchanged |
| **E1-B3-03** | P1 | B3-02 | UI integration and motion/reception tests | Double reception does not duplicate balance; visible count adjustment |

**Restrictions:** do not mix optional product supplier with old mandatory models; stock by location and business; fractional quantities require explicit scale rule before loading measured goods. **Advanced production/return of P2 fair**.

### 3.3 E1-C — Sales, expenses, cash and closing

| Ticket | Priority | Dependencia | E0-A behaviour and reference | Minimum test |
|---|---|---|---|---|
| **E1-C1-01** | P1 | B3 + ADR-006 | POS visual Z074, reglas de checkout Z075, carrito por businessId | Good and service; form controls work |
| **E1-C1-02** | P1 | C1-01 | Discount + 1..n exact payments; single stock out | Total reconciles to penny; sale of 2 from destination 3 leaves 1 |
| **E1-C1-03** | P1 | C1-02 | Expenditures Z070/Z075, accounts Z042, single history | Explicit fund, no doubling of expenditure or contaminating cash |
| **E1-C2-01** | P1 | C1 + ADR-005 | Opening/day Z092/Z075; visual closure Z093, report Z075/Z092 | Counted, expected, differences, actor and cut |
| **E1-C2-02** | P1 | C2-01 | Unchangeable snapshot + Idepotent retry + history | Double closure does not reopen or erase evidence |
| **E1-C2-03** | P1 | C2-02 | Day tests and full commercial tour | Guion E2E 10→7/3→1, gasto y snapshot consultable |

**Not to be copied:** `commitFinalClosure` from Z093 per H06, `parseInt`/`parseARSStrict` inadequate H07/H26, or trade fair returns that leave units without H25 traceability. This is a building rule, not an approval for closure without arching.

### 3.4 E1-D — QR visual collection and comprehensive validation

| Ticket | Priority | Dependencia | Scope | Minimum test |
|---|---|---|---|---|
| **E1-D1-01** | P1 | C1 + ADR-006 | IU ‘Coupling with QR’ **DEMO**, amount of checkout and visible tenant | `PENDIENTE` never submitted as actual confirmed |
| **E1-D1-02** | P1 | D1-01 | Simulated/cancelled status change; no OAuth, no key, no money | Retry does not multiply demo attempts without control |
| **E1-D2-01** | P1 | A–D | E2E desktop/mobile, focus, errors, placeholders and change A/B | Real browser result, recorded failures |
| **E1-D2-02** | P1 | D2-01 | README, CHANGELOG, QA y capturas si se ejecutan | Reproducible commands, pending decisions |

### 3.5 Post E1 — API / TP3 / MP, not scheduled today

| Cut | Units | Outcome and conditions |
|---|---|---|
| **E2 / DOC-03/04 / TP3-01** | Functional E1 and revised ADRs | UML by domain, sequences, OpenAPI (authorization, errors, idempotency), traceability of 5 requirements of the TP3, justified pattern; inspect academic backend before reuse |
| **API-01/02** | E2 | FastAPI, SQLAlchemy 2.x, Alembic, PostgreSQL, Docker, pytest, auth and scoping; real migrations and ICs |
| **API-03/04** | API-02 | Catalog, locations, suppliers, purchase/reception/transfer, locks and concurrent tests PG |
| **API-05/06** | API-04 | Sale, declared payments, expenses, transactional closure with snapshots; tests of idempotency and race cut/sale |
| **TP3-02** | API | At least **10 unit tests carried out**, risk-based integration, GitHub Actions, README, UML, pattern defense and evidence |
| **MP-01/02/03** | API-05 + real QR research | OAuth by business, stores/POS of the seller, Orders API idempotente, webhooks signed and consulted, reconciliation, refunds and expirations |
| **FUT-01/02** | API/validation | Orders, reservations, analysis and advanced guides, without blocking the first circuit |

## 4. E1 QA matrix and auditable invariants

All the following tests are **specifications, NOT executed**.

| ID | Test | Objective approach |
|---|---|---|
| **E1A-BOOT-01** | Start in browser | `npm run dev` respond and the IU is not blank |
| **DEMO-NAV-01** | Navigation from menu + cards | Share destination; view or ‘nextly’ without inert control |
| **DEMO-TEN-01** | Change A→B + prohibited URL | Zero data/deletes/rol of A in B |
| **DEMO-CAT-01** | Crear/vender servicio sin stock | No deposit, lot or balance required |
| **DEMO-STK-01** | Retry reception of 10 | Increases only 10 |
| **DEMO-STK-02** | Valid/ Invalid transfer | 7/3 after transfer 3; 11 rejected without partial status |
| **DEMO-MON-01** | Discount and split payments | Accurate amount, strict format, unique stock discount |
| **DEMO-JOR-01** | Close/arquer and view snapshots | Keep count, expected, difference, actor and date |
| **DEMO-MP-01** | QR of payment pending/approved simulated | Indica DEMO, does not present real funds |
| **DEMO-UX-01** | Desktop/mobile/keyboard | Drawer, focus, errors and achievable actions |

**Future backend integration, not replaced by these tests:** QA-TEN-01/02, QA-STK-01/02/03, QA-MON-01/02, QA-JOR-01/02, QA-MP-01/02/03. Detalle: [`03_TRAZABILITY_E0_C.md`](03_TRAZABILIDAD_E0_C.md).

## 5. Minimum matrix of responsibilities and definition of termination

| Milestone | Ejecutor | Reviewer/approval | What constitutes ‘complete’ |
|---|---|---|---|
| E0-A/B/C | IA assistance documented | **Pending TP equipment** | Markdown Files in GitHub verified; scope and honest states |
| E1-A1/A2 | **To assign** | **To assign** | Compilable/executable code, QA browser effectively run, functional routes |
| E1-B/C/D | **To assign** | **To assign** | Complete commercial script, observable tests, consistent data per company |
| E2/E3 | **To assign** | **To assign** | Real API Code, Testing, Migrations, TP3 and IC Documentation with Evidence |
| Real MP | **To assign** | **To assign** | Secure and own credentials by seller, official payment consultation, conciliation |

**DoD of each code increment:**

- Accurate path of created/modified + commit and real responsible files.
- Accurate commands to install, run and test. Register environment, results **observed**, failures and limitations; not invent evidence.
- Tabla `requisito → fuente E0-A → componente/comando → test` updated.
- No A/B information exposure; in DEMO the restriction is explained as UX, not real security.
- No change outside `plataforma-pyme/` No tokens, passwords or real data in public GitHub.
- Accessible errors and correct empty states; mobile checked when applicable.
- Revised risks/ADRs, CHANGELOG and next ticket identified.

**Collaboration in `main`:** the team decided not to create branch now. Before incorporating changes, check `git status` and update `git pull --ff-only origin main` (if no conflict changes); add **specific files/paths**, no `git add .` The documentation does not clean or modify local files of colleagues that Git shows as untracked.

## 6. First ticket for the next session (E1-A1-01)

> **Single objective:** construir y ejecutar el esqueleto React/TypeScript/Vite en `plataforma-pyme/frontend/`, con React Router y estilos base; agregar un shell inicial **inspired by Z003/Z014**, without carrying scripts and without implementing stock/sales/API yet.

**Mandatory entries:** E0-A, E0-B, E0-C and ADR-007 (pre-stack review).  
**Expected Files:** `frontend/package.json`, `index.html`, `src/main.tsx`, `src/app/App.tsx`, `src/app/router.tsx`, `src/app/navigation.ts`, `src/app/shell/*`, `src/styles/*`, `README.md`.  
**Acceptable result:** `npm install` y `npm run dev` executed; app opens `/inicio`, the menu appears and placeholders can be navigated; not fictitiously successful operation messages.  
**Do not do:** FastAPI scheme, PostgreSQL, Real Payment Market, migrations, secure login or merge existing backend.  
**Evidence:** real commands and outputs, minimum one test/smoke if available runner, honest bugs, versioned files.  
**After the ticket:** E1-A1-02/03 (Browsing register/full shell) and E1-A2 (company/selector).

## 7. E0-C Act

### Documentaryly delivered
- [x] Eight ADRs **Explicitly stated versioning** and alternatives, consequences and evidence pending.
- [x] Prioritization E1-A to E1-D in tickets with dependencies, HTML references and acceptance.
- [x] Tracer matrix requirement→HTML/Hxx→route/command→test in separate document.
- [x] First increment script and limits to not modify academic code by mistake.
- [x] Conceptual QA, acceptance rules and verifiable term definition.

### Not done / not approved
- [ ] Review and approval of ADRs by team members.
- [ ] Establishment of `frontend/`React code, dependencies, development commands.
- [ ] Browser/unitary tests, IC results and screenshots executed.
- [ ] Backend FastAPI, migrations, PostgreSQL, updated UML, REST or real MP contracts.
- [ ] Re-use/fusion of the code `Proyecto-3-Extendido-Generico/backend/`.

**Conclusion:** E0 left **prepared in documentary form** to open E1-A1 after validating the proposed stack. Unapproved ADRs are applied only as **Explicit provisional rules** when your ticket arrives; each will have proof and review.