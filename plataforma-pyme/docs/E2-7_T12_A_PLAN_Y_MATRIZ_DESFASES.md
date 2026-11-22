# E2-7 · T12-A — Academic closure plan and initial gap matrix

**Follow-up status:** T12-A completed inventory; **T12-B Documentary conciliation completed** (ver [act T12-B](E2-7_T12_B_CONCILIACION_RF_CU_API_UI_TEST.md)). **T12-C and T12-D documented and published; T12-E in closing minutes**. The merge approval, the PlantUML engine test and the complete comparison with TP3 are recorded as separate verifications/reserves.  
**Date:** 11/11/2026. **Exclusive branch:** `docs/e2-7-t12-cierre-academico`.  
**Base estable:** `main` `c6a77137cf82dcb9aad225645e84b1265b1da3ec`, merge PR #45 E2-7/T11.  
**Permitted scope:** `plataforma-pyme/`. No changes in data, migrations, functionalities or historical branches. A PR documentary DRAFT will be used for review.

## 1. What exactly is T12

According to [E2-7 master plan, section ‘E2-7 E’](E2-7_PLAN_RECTOR_INTEGRACION_Y_CIERRE.md) y [T00, orden T00–T12](E2-7_T00_DECISIONES_Y_ORDEN_DE_EJECUCION.md), **T12 corresponds to academic closure**: documents 01–05, models and diagrams PlantUML 03A/03B/03C, ADR, README frontend/backend, CHANGELOG, traceability RF/CU→API→UI→test, reproducible guide and SHA/CI manifest. It does not amount to reimplementing or repeating the integration of T01–T11. Nor does it certify bank production nor replace future visual redesign.

### Functional evidence baseline

- Technical Merge T11: **PR #45**, commit `c6a7713`; code T11 `fedd1ee`.
- Full-stack del HEAD de T11: run #43015544889, **892 Pytest, 38 Playwright REAL, 6 DEMO** successful; CI backend #43015544819 and frontend #43015544947 successful.
- Matrix QA E27: **26/26 functionally covered scenarios/smoke**, not universal WCAG audit.
- [Act of 39 manual steps](E2-7_T11_D2_ACTA_PRUEBA_MANUAL_REAL.md) with owner/worker and retests of the two headquarters defects. **no** annexed to GitHub; a revocation of probationary assignment was a royal administrative deed.
- **RISKS/CLARATIONS:** 4 non-blocking Pydatic warnings in latest IC; unencrypted IndexedDB recovery intentions; declared, uncredited REAL payments; expenses/box/accounts/QR follow DEMO; Local base REAL POS disabled by default.

## 2. Physical inventory found in main

| Element | Path |
|---|---|
| Requirements 01 | `entrega-programacion-2/01_ANALISIS_DE_REQUERIMIENTOS.md` |
| Cases of use 02 | `entrega-programacion-2/02_CASOS_DE_USO.md` |
| Dominio y UML 03 | `entrega-programacion-2/03_MODELO_DE_DOMINIO_Y_UML.md` |
| Architecture 04 | `entrega-programacion-2/04_ARQUITECTURA_Y_PATRONES.md` |
| Traceability 05 | `entrega-programacion-2/05_MATRIZ_API_Y_TRAZABILIDAD.md` |
| Classes identity/catalogue | `entrega-programacion-2/diagramas/03A_CLASES_IDENTIDAD_Y_CATALOGO.puml` + SVG and explanation |
| Business/inventory classes | `entrega-programacion-2/diagramas/03B_CLASES_COMERCIO_E_INVENTARIO.puml` + SVG and explanation |
| Cases of use | `entrega-programacion-2/diagramas/03C_CASOS_DE_USO.puml` + SVG and explanation |
| Delivery Guide | `entrega-programacion-2/README.md` + `diagramas/README.md` |
| Implementation and changes | `frontend/README.md`, `backend/README.md`, `CHANGELOG.md` |
| Source of evidence and limitations | `docs/E2-7_T11_E_AUDITORIA_FINAL_PREMERGE.md` and minutes T01–T11 |

**Route note:** all routes in this table are related to `plataforma-pyme/`. Sources `.puml` are editable and SVGs represent editorial compositions: **not to suppose** automatic visual equivalence between PlantUML and SVG. Reconcile content before regenerating or replacing SVG.

## 3. Initial documentary outdated matrix

Findings corroborated by the text **Current** de `main` And by evidence T11, not by guessing about new code.

| Document | Delay detected | Risk to delivery | Treatment T12 |
|---|---|---|---|
| **01** | Historical presentation/table states that React has no API integration and RF-03–RF-07 are pending; annex concludes approximately in E2-3 | Submit as proposed something already implemented | Incorporate section of **status post-T11**; preserve explicitly labeled historical cuts |
| **02** | Header ‘TO-BE / planned operations do not involve implemented endpoints’, version E2-3 E, buying/selling scenarios with ‘Pending E2’ | CU evaluated as futures while being REAL routes | Update CU-01..CU-12 states with exact API, UI and test reference; do not alter historical flow without signaling |
| **03** | Concept diagram "not yet SQL schema" and fonts 03A v0.7, 03B/03C of previous conceptual cut | UML differs from classes, relationships, snapshots, operations and authorizations | Compare class by class with SQLAlchemy/Alembic and contracts; fix fonts `.puml` **only when validated**; check SVG/editorial |
| **04** | Architecture declares AS-IS React DEMO / TO-BE backend, displays pseudocode and conceptual Docker "not yet exists" | Confused current architecture with educational examples | Enter architecture **AS-IMPLEMENTED** of FastAPI, Postgres, Alembic, Vite and state by tenant; preserve TO-BE examples as historical |
| **05** | Heading E2-5 says that RF-07 and frontend REST are deferred; historical tables per RF do not reflect T10/T11 | Academic matrix of RF/CU/API/IU/mistaken test | Recomponer matriz vigente y mapa de endpoints a partir de routers, DTO, frontend y tests reales |
| **README frontend** | Titled ‘Frontend (DEMO)’, phrase ‘No authentication, real authorization, backend’ | Instructions induce to launch only DEMO and hide REAL capacity | Separate DEMO and REAL paths/instructions, proxy to API, login and local environment |
| **README backend** | E2-5 C status header; previous blocks maintain API mode without frontend | No identifica baseline T11 ni endpoints comerciales posteriores | Add guide to the above and keep history as annexes by version |
| **README entrega** | Header E2-5 and entry ‘React follows DEMO / pending backend sales’ | Contradictory academic closure | Cover and manifest SHA/CI with current scope |
| **CHANGELOG** | Ends in E1-D2 | It does not record integrated E2-1..E2-7 or QA | Add entries E2 for verifiable facts, not invented timeline |
| **backend/app/main.py** | Docstring “The frontend remains independent” despite the REST IU | Out-of-date application metadata | **Code Observation:** correct only if there is explicit authorization for non-documentary change; do not modify production code in T12-A |

**Priority:** correct the main labels of 01–05 and README that describe the current state, without deleting incremental evidence; do not rewrite an academic rule without contrasting it with routers/models.

## 4. Functional reference state for conciliation

This table is a **working hypothesis supported by T11**, still pending verification by **contract and exact file** in steps T12-B/C.

| RF | What to document as a kernel | Product status to be made explicit |
|---|---|---|
| RF-01 | Registro, login, GET /me, logout; Bearer en memoria | Validated REAL; F5 requires re-authentication |
| RF-02 | Companies, memberships, roles/invitations; actor outreach | REAL with IU limits to be audited; do not confuse with DEMO invitations |
| RF-03 | Active/pausate locations, SELL/STORE and allocations | REAL + actual restriction by location |
| RF-04 | Physical catalogue and services, costs/prices, active/inactive | REAL, stock only of goods |
| RF-05 | Suppliers, free concept purchases, only reception | REAL, buy alone does not move stock |
| RF-06 | Balances, movements, double move, adjustments/versions | REAL; atomic stock and traceability |
| RF-07 | POS, discounts/prices per role, declared payments and recovery | REAL conditioned to environment; **without bank accreditation** |
| RF-08–10 | Expenditure/days, financial accounts and illustrative QR | DEMO/deferred; **no** productive payment services |

Do not declare REAL a functionality just because there is a DEMO screen. Separate **implemented endpoint, available screen, allowed operation and tested scenario**.

## 5. Proposed work on auditable increments

| Increase | Objective | Specific door |
|---|---|---|
| **T12-A — Base (completed)** | Inventory, baseline SHA, gap matrix, order and decisions; **this document** | Inventory and dated risks, without touching old sources |
| **T12-B — RF/CU/tracing (completed)** | Updated **01, 02, 05**; 46 verified actual routes against 13 routers, CU-01..12 routed | [Closing Act T12-B](E2-7_T12_B_CONCILIACION_RF_CU_API_UI_TEST.md) and file by RF/CU/API/UI/test |
| **T12-C — Dominio/UML** | Review **03 + 03A/03B/03C**, relationships and invariants according to models/Alembic; check SVG before publishing | SQL-compliant source diagram + signaled limitations |
| **T12-D — Architecture and reproducibility** | Review **04**, README frontend/backend/delivery, CHANGELOG, ADRs and PowerShell/Docker guide safe | Documented and reproducible execution without touching persistent DB or secrets |
| **T12-E — Control and delivery** | Validate links, REAL/DEMO tags, matrix of resolved inconsistencies, QA CI and delivery manifest | Revised documentary Diff, HEAD CI, closing/pending opinion, human approval and merit |

**Method:** work from branch `docs/e2-7-t12-cierre-academico`, PR DRAFT, cambios incrementales y GitHub Actions por commit. Mantener `main` intact until approval. Avoid editing logic/migrations unless proven failure and independent decision of the responsible.

## 6. Decisions and exclusions of closure

1. **Preserve History** E2-1..E2-6; a "status in force" header replaces the operational reading of TO-BE texts, does not eliminate the context of partial advances.
2. UML editable is the authority over **technical content** After code reconciliation, SVG requires independent visual validation.
3. **No** promise REAL financial accounts, REAL cashier, real QR MP/OAuth/webhooks, reservations, lots, prescription production or bank reconciliation; record them as deferred.
4. The prototype is **academic** and the suites pass in ephemeral environment. Do not treat it as audited software for commercial production.
5. Do not execute destructive commands on PostgreSQL user: never `docker compose down -v`, `dropdb`, table recreation or actual test sale in `TEST Empresa A`.
6. Pydatic warnings in IC and unencrypted IndexedDB intent storage: documented residual risk, do not blindly correct within a documentation PR.

## 7. Next action

**Closing of the plan:** T12-C1..C4 and T12-D1/D2 were published on the documentary branch. [T12-E audit report](E2-7_T12_E_ACTA_CIERRE_Y_BACKLOG_ETAPA_2.md) for the opinion, manifest of sources, verification of links, limits of QA and post-academic backlog. No instruction of this plan constitutes permission to merge to `main`.
