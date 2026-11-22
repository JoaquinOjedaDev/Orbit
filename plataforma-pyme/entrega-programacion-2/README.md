# Academic delivery — Orbit (status T12, 11/11/2026)

**REAL cutting of the product:** `main` `c6a77137cf82dcb9aad225645e84b1265b1da3ec` (T11, PR #45).  
**Documentary work:** rama `docs/e2-7-t12-cierre-academico`, PR #46. **It doesn't involve merge to `main`**.  
**Project:** multi-company/multi-rubro generalist platform; WALOS is an example company, not the product.  
**Functional status:** RF-01–RF-07 with FastAPI/PostgreSQL and React REAL; RF-08 (expenditures/box), RF-09 (financial accounts) and RF-10 (QR Market Payment) continue DEMO or deferred. Payments in REAL POS are **declared**, no verified bank charges.

## Updated Delivery Index

| Document | What it stands for today |
|---|---|
| [01 — Requirements](01_ANALISIS_DE_REQUERIMIENTOS.md) | RF-01 to RF-10; REAL/DEMO borders |
| [02 — Cases of use](02_CASOS_DE_USO.md) | CU-01 to CU-12, real actors and results |
| [03 — Domain model](03_MODELO_DE_DOMINIO_Y_UML.md) | UML and 19 contrasting persistent models |
| [03A — Identity/enterprises/catalogue](diagramas/03A_EXPLICACION_IDENTIDAD_EMPRESAS_CATALOGO.md) | PUML, SVG and explanation v2.1 |
| [03B — Purchases/inventory/sales](diagramas/03B_EXPLICACION_COMPRAS_INVENTARIO_VENTAS.md) | PUML, SVG and second [trade flow for exposure](diagramas/03B_FLUJO_COMERCIAL_EXPLICATIVO.svg) |
| [03C — Cases of use](diagramas/03C_EXPLICACION_CASOS_DE_USO.md) | PUML, SVG and guide v2.1 |
| [04 — Architecture and patterns](04_ARQUITECTURA_Y_PATRONES.md) | Current section AS-IMPLEMENTED T11 and differentiated historical archive |
| [05 — API/traceability](05_MATRIZ_API_Y_TRAZABILIDAD.md) | 46 operaciones FastAPI, 13 routers, RF/CU→UI→test |
| [Plan T12-A](../docs/E2-7_T12_A_PLAN_Y_MATRIZ_DESFASES.md) / [Conciliation T12-B](../docs/E2-7_T12_B_CONCILIACION_RF_CU_API_UI_TEST.md) | Incremental Base and Controls |
| [Frontend](../frontend/README.md) / [Backend](../backend/README.md) / [Changelog](../CHANGELOG.md) | Documented implementation and evolution |

> **How to read the historical:** all preserved sections E2-1 to E2-5 **under** They document their respective courts. Neither this block nor the "Effecting State" sections of 01, 02, 03, 04 and 05 prevail. Historical evidence does not amount to an IC executed for the last documentary commit. The T12 closure does not certify production deployment or external payments.

> **Inherited requirements TP3:** They must be mapped one by one to RF/CU and evidence or expressly left "to be verified". The evolution of the stage 2 product does not become an academic commitment because it appears in the backlog.

---

## Preserved historical record (E2-1 to E2-5)

> **STATE E2-5 A–C AL 09/11/2026 (prevalence over following historical notes):** PR #21, #22 y #23 **already merged** en `main` `748e69319d8d04900c009d5184168a264a9deeac`: signed physical inventory, atomic transfers, initial stock and versioned adjustments. CI: 816/826/840 test per Python 3.12/3.14 cut and Docker 3/3; Windows E2-5 C: **840 passed**; Alembic `e25a_inventory_ops` sin deriva. [**Closing documentary v1.2 published in main (PR #24)**](../docs/revisiones/E2-5_CIERRE/00_LEEME.md) y [critical evaluation of external observations](../docs/revisiones/E2-5_CIERRE/13_EVALUACION_OBSERVACIONES_IA.md). La [delivery for audit](../docs/revisiones/E2-5_ENTREGA_PARA_REVISION.md) y el [test plan](../docs/revisiones/E2-5_AUDITORIA/00_LEEME_Y_PRECONDICIONES.md) They're **published in `main`** with original SHA documentary `c66df2f8ddaa8179ca12e342bd3099348bc6b155`but **the independent audit was not carried out**. It does not involve certification of production; frontend React follows DEMO and RF-07 backend sales is pending. The ‘proposed’/‘merge-pending’ notes below are historical.

> **E2-5 C — Adjustments and initial inventory (09/11/2026):** new cut proposed, complements E2-5 B on the same head Alembic `e25a_inventory_ops`. API of `AJUSTE_ENTRADA`, `AJUSTE_SALIDA`, `STOCK_INICIAL` for motif/version/roles and traceability. [Contract E2-5 C](../docs/E2-5_C_AJUSTES_Y_STOCK_INICIAL.md); CI/local will be documented after execution.

> **E2-5 B — proposed new cut (09/11/2026):** physical transfers between own locations with STORE permission and non-negative stock, on model E2-5 A. [QA Specification and steps](../docs/E2-5_B_TRASLADOS_ATOMICOS.md). CI and Windows must be verified after posting the change.

> **Incremental update E2-5 A (09/11/2026):** after [validated closure of E2-4](../docs/revisiones/E2-4_CIERRE/), the SQL structure is prepared for transfers and adjustments (`inventory_operations` and signed events); **E2-5 B/C and full RF-06 are still pending**. Ver [E2-5 A](../docs/E2-5_A_MODELO_OPERACIONES_INVENTARIO.md). The tables and figures E2-2/E2-3 below describe historical cuts and do not replace this state.

# Delivery documentation — Programming 2

**Project:** Orbit — Generalistic management platform for multiple companies and sectors.  
**Location planned in the repository:** `plataforma-pyme/entrega-programacion-2/`.  
**Previous historical state (08/11/2026):** E2-1 preserved and under audit; E2-2 closed and delivered for review; **E2-3 Catalogue A/B/C/D validated in Windows (407/498/527/580 tests)** and E documentary/UML completed. Five REST routes from the Catalogue, supplier/outstanding commercial operations, React DEMO decoupled. Versions 01 v1.7, 02 v1.8, 03 v1.8, 04 v1.9, 05 v1.5; UML 03A v0.7; 03B/03C intact.

> **Historical cut E2-2 (08/11/2026):** E2-2 A/A.1/B/C/D implemented and validated: **371 Windows tests approved in 47.57s**, Alembic `e22d_assignments (head)` sin deriva, API y PostgreSQL en Docker `healthy`, `/ready` = `ready/ok`. Code IC E2-2 D: 3/3 approved, 371 Python tests 3.12/3.14 and Docker. **The headquarters policy does not yet apply to inventory/purchases/sales**, which are future blocks; frontend React remains DEMO. The partial states described in notes of A/B/C constitute historical.


> **CLOSING UPDATE E2-4 — 09/11/2026 (prevalence over subsequent historical cuts):** backend integrates Suppliers, Purchases, full physical reception, balances and movements; migration `e24e_receipt_stock`, 797/797 Windows tests with existing QA data and 3/3 jobs CI in PR #18. Cutting code `4f88416141c09a82e744990b1aee8c00b9f31dfd`. Se publican [the academic report, the Swagger blog (17 cases), tests, architecture, QA data and pending](../docs/revisiones/E2-4_CIERRE/00_LEEME.md) y la [sheet for independent review](../docs/revisiones/E2-4_ENTREGA_PARA_REVISION.md). **The frontend React is still uncoupled and the system is not certified for production.** The claims of “pending” in the previous courts are historical to their date; refer to closure E2-4 for the current state.

## Purpose

Gather the academic documents and exhibition material corresponding to the Programming project 2. The content should reflect demonstrable implementation and differentiate it from the still planned backend architecture.

The official slogan is taken as reference **«Desarrollo de una API RESTful»**: at least five high-level functional requirements covered by endpoints, documentation and use cases, FastAPI, secure registration/authentication, SQLAlchemy, Docker, testing, deployment, a useful design pattern, at least ten unit tests, GitHub Actions and a presentation with at least one UML diagram and pattern explanation.

## Index and order of work

| Document | Purpose | Status |
|---|---|---|
| `01_ANALISIS_DE_REQUERIMIENTOS.md` | Problem, objectives, actors, RF/RNF scope, rules, acceptance criteria and priority of the backend | **Functional Borrator v1.2 — E2-2 D** |
| `02_CASOS_DE_USO.md` | 12 cases of use of the proposed backend, flows, errors, idempotency, continuance and traceability | **REVIED v1.3 — CU-04 with allocations** |
| [`03_MODELO_DE_DOMINIO_Y_UML.md`](03_MODELO_DE_DOMINIO_Y_UML.md) | Entities, rules, cardinalities, states, transactions and three UML diagrams | **PUBLICADO v1.3 — modelo LocationAssignment** |
| [`04_ARQUITECTURE_Y_PATRONES.md`](04_ARQUITECTURA_Y_PATRONES.md) | AS-IS/TO-BE architecture, Repository pattern, Adapter and book patterns (Factory, Decorator, Observer) | **PUBLISHED v1.4 — architecture E2-2 D** |
| [`05_MATRIZ_API_Y_TRAZABILITY.md`](05_MATRIZ_API_Y_TRAZABILIDAD.md) | RF → CU → endpoints reales → pruebas/roles/evidencia/pendientes | **PUBLISHED v1.0 — matrix E2-2 D** |
| [**Close E2-4**](../docs/revisiones/E2-4_CIERRE/00_LEEME.md) | Report, log of use, QA, IC and traceability of Suppliers/Buyers/Reception | **PUBLISHED — Court 2026-11-08** |
| `06_PRUEBAS_Y_DESPLIEGUE.md` | Estrategia de pruebas, GitHub Actions, Docker, despliegue y evidencias | Pending |
| [`diagrams/`](diagramas/) | Approved vector SVG, editable PlantUML fonts and three detailed guides | **03A / 03B / 03C published** |
| `presentacion/` | Final defense slides | A crear |

> The slogan requires **at least one UML**A case diagram and one class diagram are planned to improve exposure, subject to equipment approval.

## Conventions

1. **AS-IS / DEMO implemented:** evidence available on the frontend React, with local persistence and no server security.
2. **AS-IMPLEMENTED / Backend comprobado:** FastAPI, PostgreSQL, SQLAlchemy, Docker, auth and companies; contrast routes and tests with 05. **TO-BE / Earrings:** granular authorization by location, stock rules when changing capacities, catalog, purchases, stock, sales and integration React. **RF-03 already has POST/GET/PATCH/PUT locations in E2-2 B/C.** **Invitations and basic equipment are already implemented in the E2-1 API.**
3. **Deferred:** outside the scope of MVP; for example, actual payments from Market Payment, real partial QR, bank reconciliation and uncompromised automations.
4. Requirements identified as `RF-xx`, not functional as `RNF-xx` and business rules like `RN-xx`. Keep your identifiers between documents. **MVP NUCLE**, **MVP SUPPORT** o **POST-MVP** expresses the proposed scope of the backend, not a functionality implemented.
5. Each document passes through `BORRADOR` → `APROBADO` → `ACTUALIZADO PARA ENTREGA`, recording version/date. Approval corresponds to the computer. **A backend should not be marked as implemented or a test approved without evidence.**
6. **WALOS is an example company**does not define the target audience or limit the platform’s areas.
7. Document only verifiable facts; do not confuse frontend evidence with actual API testing.

## Supplementary internal documentation

Documents in `../docs/` include E0–E1 integration decisions, ADR and tests. They are sources of consultation, **not automatically equivalent to final delivery**: some represent historical proposals that must be contrasted with the current code.

The technical installation and command README is maintained in `../frontend/README.md` and, where it exists, `../backend/README.md` or the corresponding root README. This academic index does not replace them.

## Uso

One document was adopted at a time before being incorporated into the `main`. Do not upload catches or sensitive data from real companies. In the next stages, complete the evidence matrix with actual routes, test results and links to deployment.

**Scope for the first API:** The selection of core and support requirements in Document 01 is a proposal submitted for approval, not a commitment to implement all DEMO screens in FastAPI. The presentation must distinguish a class UML diagram (structure) and one case of use (interactions). The diagrams will be saved together with their editable sources in `diagramas/`, and exposure in `presentacion/`.

## How to use the diagrams of Document 03

- **[03A — Identity, companies and catalogue](diagramas/03A_EXPLICACION_IDENTIDAD_EMPRESAS_CATALOGO.md):** global identity, company memberships, founder, invitations, resources and cardinalities.
- **[03B — Purchases, receipt, inventory and sales](diagramas/03B_EXPLICACION_COMPRAS_INVENTARIO_VENTAS.md):** purchase without stock, single reception, sales and payments declared, snapshots, balances, movements, continuance and idempotency.
- **[03C — Cases of use of the first API](diagramas/03C_EXPLICACION_CASOS_DE_USO.md):** actors, CU-01 to CU-12, exemplificative flows and traceability to requirements.

Each explanation links the **vector SVG sheet** (presentation display) and file **PlantUML** The sheets show the conceptual design TO-BE, not the existing implementation of FastAPI. For defense, use SVG; to maintain or review associations and cardinalities, consult PUML and Document 03.

## Update policy for increments E2

**Operating rule:** no major delivery is considered closed by compiling only. The same delivery must link code, HTTP contracts, tests, Alembic version if applicable and academic documents. In each cut it is reviewed 05 and `../backend/README.md`; 01/02 change to the RF/CU, 03 and UML 03A by modifying entities/rules/cardinalities, and 04 by modifying architecture/security/patterns. 03B is not regenerated by identity or authorization changes.

**Verified sequence:** C.1 RBAC (98) → C.2 business edition (125) → C.3 issue (147) → C.4a acceptance (171) → C.4b equipment (195), all locally validated. **C.5:** documentation and 03A. **Next order:** prepare separately the E2-1 review for the companion and then RF-03 Locations.

### E2-1.3C.2 status (cut 8/11/2026)

Published `PATCH /api/v1/businesses/{business_id}` with data validations and real role authorization linked to the session and company. The new route implements a part of RF-02/CU-03. **Local execution/CI was subsequently validated in C.2 (125 tests)**; C.1 did finish with 98 approved tests. The domain model was not altered or regenerated 03A/03B. Invitations are still in block E2-1 (C.3/C.4); the formal sheet for peer review is not yet generated, because the functional block did not end.

### State C.3, cut of 8/11/2026

Safe issuance of invitations `POST /api/v1/businesses/{business_id}/invitations` implemented and tested in IC. New migration exists `e213c3_invitations`; the invitation does not create membership, token is given only once and hash persists only. Acceptance and administration of members remain pending. Local validation of court C.3 was completed later (147 tests); the previous text is historical. The formal audit sheet for the partner is prepared only when closing **E2-1** complete, not for every subpass.

### C.4a — Acceptance of invitations, 8/11/2026

Implemented `POST /api/v1/invitations/accept`: the authenticated recipient consumes the invitation with the C.3 token, creates or reactivates a single Membership and confirms ACCEPTED status + user trace/date in one transaction. `e213c4_acceptance`. CI aprobado en Python 3.12/3.14/PostgreSQL y Docker, **local validation subsequently approved (171 tests)**. C.4b was then completed with 195 tests; C.5 synchronized 03A. Not yet generating the audit delivery per E2-1 block; it will be made by closing all its steps.

### C.4b — Equipment control and protected ownership

No new migration, added `GET /api/v1/businesses/{business_id}/memberships` (holder/manager only) and `PATCH /api/v1/businesses/{business_id}/memberships/{membership_id}` (holder only) to manage operational roles and status. The source of permissions is the tenant SQL membership. CI approved PostgreSQL/Pytest and Docker; **local validation approved (195 tests)**. Ownership cannot be transferred or revoked for this operation. Closing E2-1/03A and audit sheet for the partner are still for C.5.

### C.5 — Full documentary synchronization (08/11/2026)

Functional closure E2-1 has `195 passed in 23.86s`, Alembic `e213c4_acceptance (head)` sin deriva, Docker API/DB `healthy` y `/ready` `ready`/`ok`; code C.4b `8cd1674` 3/3 CI. Documents 01–05, Technical README, and UML 03A (source PlantUML, editorial SVG and guide) were reconciled. 03B/03C and code are not altered. **does not presuppose a new execution of evidence on the documentary commit**. The peer review report will be the next separate job; just after it will begin RF-03.

### E2-2 A — First increase in Locations (RF-03)

**E2-2 A — Persistence of Locations (08/11/2026):** Published `Location`/`locations` with FK required `business_id → businesses.id` (`RESTRICT`), six types, `can_sell`/`can_store` independent, optional reference fields, `ACTIVA/PAUSADA`, `is_primary`, partial index that allows at most a main active per tenant and CHECK that prevents main paused. Additive migration `20261108_0008_business_locations.py` (`e22a_locations`, descendant of `e213c4_acceptance`) The company continues to start **no locations**. **No HTTP Location Routes yet**, no inventory/purchase/connected sale, no location permits; these changes belong to E2-2 B/C and subsequent blocks. The IC of the cut code was verified in `300fa6f` (GitHub Actions run 42491816481): result `success`. Local Windows validation of the new cut is still required; the previous 195 tests corresponded to E2-1.

The E2-1 review remains anchored in the fixed delivery commit; the new job does not modify your branch. Next step E2-2 B will add the real API and its authorization by company, maintaining the same rules `Location` y sin alterar E1 React.


### E2-2 A.1 — CASA and new head (08/11/2026)

`CASA` is added to the rates accepted; `can_sell`/`can_store` still independent. Additive migration `e22b_location_casa` after `e22a_locations`, no changes to previous data, and protected reversal when CASA locations exist. **CI backend** (run): **217 tests approved, Python 3.12.3.14, Alembic `e22b_location_casa (head)` sin deriva, Docker 3/3**. **CI frontend** (run): **2/2 successful jobs including build/lint and E2E**. Previous Windows result of E2-2 A: 212 tests; **Additional migration CASA and 217 tests must still be replicated locally**. No location endpoints up to E2-2 B/C and no React–API connection.

### E2-2 B — First HTTP Locations Cut

**State E2-2 B (08/11/2026):** Three real routes were published for low locations `/api/v1/businesses/{business_id}/locations` (`POST` 201, `GET` ready 200, `GET /{location_id}` 200). The creation valid DTO without protected fields, revalidates identity/session, blocks the company and membership of the actor, demands tenant `ACTIVA` y rol `TITULAR_ADMINISTRATIVO` o `ADMINISTRADOR`, and confirms a single transaction. A first location receives `is_primary=true`; the subsequent ones do not replace it. Active members of any recognized role can consult their own locations, even with suspended company; a suspended company does not allow to create. A third party or inactive membership returns 404; role without permission 403; invalid session 401; company suspended when creating 409; incorrect body 422. `CASA` and Google Maps HTTPS validated are included. **There is no PATCH/DELETE, no pause/reactivation, change of principal, individual staff assignment or commercial consumption of locations yet.** DEMO remains independent. Backend without new migration from `e22b_location_casa`.

**Evidence of IC:** commit funcional `bdd2c84653dafb976c8cd6b49d8c2d577cc345de`; GitHub Actions E2-2 B **3/3** (Python 3.12 y 3.14 con PostgreSQL, Docker), **277 approved tests**, `e22b_location_casa (head)` and Alembic without drift. The local Windows output provided previously for **E2-2 A.1** fue **217 passed in 23.90s**. Posteriormente E2-2 B **was validated in Windows with `277 passed in 31.22s`**, Alembic without drift and healthy Docker; E2-2 C adds new tests to be verified locally. The peer review of E2-1 remains anchored in the commit delivered.

### E2-2 C — Editing, Pausing and Main

**E2-2 C (08/11/2026) — actual location operations:** `PATCH /api/v1/businesses/{business_id}/locations/{location_id}` allows editing only `name`, `kind`, `address`, `map_url`, `can_sell` y `can_store` (optional fields in the body, but rejected `null`, empty bodies, invalid values and protected fields). `PATCH /{location_id}/status` receive only `ACTIVA` o `PAUSADA`: pause revoke `is_primary` in the same transaction and reactivate **no** recovers location ownership automatically. `PUT /{location_id}/primary` designates a location `ACTIVA`, unmarks the previous one and marks the one chosen within the **and a single transaction**, serialized by company lock and protected with the SQL index `uq_locations_one_active_primary`. The operation on an already main location does not make any additional changes. Owner/Manager with Active Membership can manage; maintainer/worker only consult. `SUSPENDIDA` read but no change; other/non-existent resource 404, role without permission 403, invalid session 401, incompatible status 409 and invalid body 422. DELETE was not enabled nor new tables were created.

**Evidence:** functional code `7abafd8208965cd99b0116e02ffc5240d23f218f`, GitHub Actions E2-2 C **3/3 successful**, 325/225 Python 3.12 and 3.14 tests with PostgreSQL, Alembic `e22b_location_casa (head)` no drift and correct Docker. Windows had previously validated E2-2 B (`277 passed in 31.22s`, `/ready` = `ready`/`ok`). **The 325 tests must still be played on Windows to close locally E2-2 C.** React/API integration, individual assignment of members to locations, inventory control when removing `can_store`, receptions/sales and operating fund management are future works; they are not attributed to this increase. E2-1 and UML 03B/03C were not modified.

### E2-2 D — Allocations by location

**E2-2 D AS-IMPLEMENTED:** `LocationAssignment` con clave `(business_id,location_id,user_id)` and FK composed towards `Location` y `Membership` of the same tenant. Additive migration `e22d_assignments`, single location index `(business_id,id)`. Administrative States `ACTIVA`/`REVOCADA`; date `revoked_at`No physical deletion. `GET /api/v1/businesses/{business_id}/locations/{location_id}/assignments` list of assignments from a headquarters (holder/manager); `PUT /api/v1/businesses/{business_id}/locations/{location_id}/assignments/{membership_id}` receive JSON `{"status":"ACTIVA"}` o `{"status":"REVOCADA"}` and actively/revolves. Only one member is activated ENTRY/TRAWER active towards the active location; revoke allows for paused headquarters or inactive member. Company SUSPENDED read only. Pure policy `can_operate_at_location` obliging tenant, membership, headquarters and capacity `SELL/STORE` in force, besides the active assignment to managers/workers. **The policy is not yet consumed in purchases, inventory or sales**, outside this cut. No new E2-1 functions or frontend connection.

**IC checked for functional code `3cd7bce71d951218e8c77da58d147e78fb0d426e`:** run 42497556047, **371/371 tests Python 3.12 and 3.14, 3/3 jobs approved**, Alembic `e22d_assignments (head)` sin deriva y Docker saludable. **Local Windows E2-2 D is pending:** the last execution contributed corresponds to E2-2 C, 325 passed. Do not attribute to the last commit documentary own execution of tests.

**Review delivery E2-2 not yet issued:** first verify migration, tests and local Docker on Windows; then fix closure SHA, reconcile UML 03A and apply master guide. E2-1 continues in its separate branch; do not start E2-3 before finishing this shutdown.

### E2-3 A — First persistent increase in the Catalogue

**Cut E2-3 A (08/11/2026), partial persistence of RF-04/CU-05:** clase SQLAlchemy `CatalogItem` y tabla `catalog_items` con `business_id` Compulsory, FK to Company (`RESTRICT`) y par UNIQUE `(business_id,id)` for future commercial FK of the same tenant. Four kinds of tab according to DEMO: `ELABORADO`, `REVENTA`, `INSUMO` (physical property) and `SERVICIO` (conceptually a service). `SERVICIO`; physical property prohibits it. `UNIDAD`, `GRAMO`, `KILOGRAMO`, `MILILITRO`, `LITRO`, `PAQUETE`, `CAJA`. Name, standardized key is stored `name_key`, category, optional SKU, description, internal observations, status `ACTIVO`/`INACTIVO`, condition `sellable`, `price_cents` y `reference_cost_cents` optional. Whole amounts BIGINT between 0 and 99,999,999.999 cents, without Float. Two independent restrictions prevent repeat `name_key` and SKU not null **within the company**, also in inactive chips; different tenants can reuse them. In E2-3 B the service must calculate `name_key` canonically (NFKC, collapsed spaces, capital equivalence) and normalize SKU to uppercase **before inserting/editing**: SQL imposes the uniqueness of saved keys and SKU format, but does not derive `name_key` Create tab does not create location, stock, purchases, sales or movements.

**Evidence:** code/test cut `79c2071f4e5192be95d75c78d5b1e9a75492a645`; GitHub Actions E2-3 A **3/3**, **407 approved tests** en Python 3.12 y Python 3.14 con PostgreSQL 16, Docker liveness aprobado y `e23a_catalog (head)` no pending changes from Alembic. **Local Windows Validation Pending for E2-3 A**; the above 371 tests correspond to the closure of E2-2. **No HTTP Catalog paths** in this cut; CRUD, catalog RBAC, SKU/name standardization of entry and protection of business stories will be implemented in E2-3 B/C/D. No React API integration or independent review of E2-3 yet. No change to E2-1 or E2-2 or DEMO frontend.

### E2-3 B — First Catalog endpoints

**E2-3 B — Real Catalogue API (RF-04/CU-05, 08/11/2026):** four low routes `/api/v1/businesses/{business_id}/catalog`: `POST /catalog` (201 high), `GET /catalog` (200 list with `offset>=0`, `1<=limit<=500`; default `limit=100`), `GET /catalog/{item_id}` (200 detalle) y `PATCH /catalog/{item_id}` (200 part edition). Each operation requires valid Bearer, session revalidation, user and membership of the requested company. Owner/manager can read and write; maintainer/worker with active membership only read; company SUSPENDED read only; enterprise or article other/non-existent 404. The server normalizes Unicode NFKC names, collapses spaces and generates `name_key` con `casefold`; normalizes SKU to ASCII capital letters and converts empty SKU into NULL. PostgreSQL retains the uniqueness per company of `name_key`/SKU even with INACTIVE tabs, and the API translates that collision to 409. Invalid data or protected fields (id, tenant, status, derivative key) receive 422. SERVICE type requires SERVICE unit; no other classification can use it. They are valid `price_cents` y `reference_cost_cents` NULL or integers from 0 to 99.999.999.999. The PATCH allows you to remove SKU/price/cost with NULL, but do not edit status. `status` and timestamps SQL. Creation does not create location, stock balance, purchases, sales or movements.

**Explicit limits:** E2-3 B not yet exposed `PATCH /status` No integration of frontend React with this API; no reception, sales, commercial snapshots or history unit editing protection are implemented as these modules are later. New tests check permissions, duplicate rollbacks, SKU/standard names, multi-company isolation, suspended reading and fault 401/403/404/409/422. **Evidence CI E2-3 B:** GitHub Actions 42506409757 finished **3/3 successful jobs**, **498 approved tests** both in Python 3.12 (53.96s) and Python 3.14 (50.12s), PostgreSQL 16, `e23a_catalog (head)` y `alembic check` No operations, Docker/liveness image approved. Validated functional code: `35ff901855397c024cee50fa590c6c05a7f04cfe`. Previous IQ `42506050141` had detected two HTTP mapping failures in PATCH with incompatible type/unit; they were corrected and both cases are now happening. **Local Windows validation of E2-3 B is still pending**; the last confirmed local result is 407/407 of E2-3 A.

### E2-3 C — Reversible status of tokens

**E2-3 C (08/11/2026):** implemented `PATCH /api/v1/businesses/{business_id}/catalog/{item_id}/status` with exclusive body `{"status":"ACTIVO"}` o `{"status":"INACTIVO"}`, strict validation and rejection of extra attributes (422). The path revalidates session and membership and requires an ACTIVA company owner/manager to write (401/403/404/409 as the case may be).The article is blocked inside the tenant and changed status in a single transaction.The repeated change is idepotent, without altering `updated_at`. The inactive article remains visible on GET/listed, with UUID, name and SKU reserved even for duplicate highs; there is no DELETE or fictitious stock. Generic PATCH maintains `status` This functionality also does not modify the independent field `sellable`.

**Units:** future purchases/sales must prohibit new movements with INACTIVE chips and keep real historical snapshots. There are still no commercial operations or integrated frontend; therefore, there is no real restriction on unit change for previous transactions either. No new migration: CHECK reused `ACTIVO/INACTIVO` de `e23a_catalog`.

**Tests:** CI E2-3 C **3/3 work adopted**, **527 passed** in Python 3.12 and 3.14 with PostgreSQL, `e23a_catalog (head)`, `alembic check` no operations and correct Docker; code `c2153ab9b65b265eb46b3081079e0f3f15002215`. E2-3 B: **498 passed en Windows (55.79s)**, Docker/API/DB saludables. **E2-3 C: Windows pending**. The subsequent documentary committ is not equivalent to another IC execution.

### E2-3 D — Integrity and regression

**E2-3 D (08/11/2026):** the existing Catalogue was strengthened, **without adding tables or migrations**. New tests verify Unicode NFKC+ equivalences `casefold` in names, SKU NFKC and ASCII capitals, rejection of invalid controls and forms, overflowing `name_key` per Unicode expansion, strict integer amounts (no booleans or decimals), differentiation between `PATCH` field and with `null` Explicit, incompatibility SERVICE/physical unit, protected fields of `/status`, name/SKU collisions even in INACTIVE chips, independence between two companies of the same user, session recovery after 409, and rollback provoked after `flush` both in high and in edition. A ceiling was added to `offset` catalogue (`9_223_372_036_854_775_807`, BIGINT PostgreSQL): exceed it produces 422 before running SQL, maintaining `limit` de 1 a 500 y `offset` The five Catalog endpoints retain their contracts and business permits; no stock is created.

**Scope and limits:** NICK `(business_id,name_key)` y `(business_id,sku)` and existing transactions/blocks protect against collisions; tests exercise actual duplicates and recoveries in PostgreSQL, **but are not simultaneous load/concurrence testing with multiple independent connections**. The latter is registered as future verification before production. There are not yet purchases, sales, movements or snapshots, so you cannot check a unit/state change rule with real business history. `sellable` does not replace `status`. Do not connect frontend DEMO or E2-1/E2-2 for this cut.

**IC evidence of code D:** commit `bf4fd3fa809c9f4e6afdeb064a155acf233b1722`, GitHub Actions run 42508771222: **3/3 work adopted**, **580 passed** en Python 3.12 y Python 3.14 con PostgreSQL, Docker build/liveness aprobado, `e23a_catalog (head)` y `alembic check` No difference. **Local Validation Windows E2-3 C:** 527 passed in 59.60s, healthy containers and `/ready` Right. **Local Validation Windows E2-3 D:** Do not confuse remote IC with tests performed on the author's computer.

### E2-3 E — Functional closure of the Catalogue

**E2-3 E closed functionally and documentaryly (08/11/2026):** catalogue `CatalogItem` with migration `e23a_catalog`, five actual REST routes, tenant/RBAC verification and active/INACTIVE status. **580 passed en Windows (66.45s)**, Alembic sin deriva, API y DB Docker healthy, `/ready` ready/ok. CI D 3/3 and 580 Python tests 3.12/3.14 sachet `bf4fd3fa809c9f4e6afdeb064a155acf233b1722`. UML 03A v0.7 (PUML, guide and editorial SVG) updated; To-BE Supplier, 03B/03C preserved. There are no purchases, inventory, sales or React/API integration yet. **Earrings: formal delivery to the reviewer, no PR merchandise**. The A/B/C/D states below correspond to historical cuts.
