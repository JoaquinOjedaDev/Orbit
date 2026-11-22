# E2-7 · T12-B — Conciliation Act RF/CU / API/IU / test

**Date:** 11/11/2026. **Rama:** `docs/e2-7-t12-cierre-academico` (PR #46, **DRAFT**).  
**Technical basis:** `main` `c6a77137cf82dcb9aad225645e84b1265b1da3ec` (PR #45, E2-7/T11).  
**Status:** T12-B **documentary executed**, with static consistency controls; **does not constitute approval of T12-C, T12-D or T12-E**.

## 1. Updated deliverables

| Document | Incorporated correction |
|---|---|
| [01 — Requirements analysis](../entrega-programacion-2/01_ANALISIS_DE_REQUERIMIENTOS.md) | Current version RF-01..RF-10; REAL RF-01..07, DEMO RF-08..10; rules, states, limits, 39 manual steps and IC |
| [02 — Cases of use](../entrega-programacion-2/02_CASOS_DE_USO.md) | CU-01..12 with actor, API, screen, postcondition and test; alternatives 401/403/404/409/422; power and reception vs purchase |
| [05 — API and traceability](../entrega-programacion-2/05_MATRIZ_API_Y_TRAZABILIDAD.md) | Matrix RF→CU→API→UI→test, inventory of **46 real HTTP operations** obtained from **13 routers** mounted, linked sources, tests and risks |

The previous content of each document was **expressly preserved as historical**, without erasing incremental evidence or attributing to them current states. No additional RF was invented and CU renumbered. **CU-11 belongs to RF-06**; CU-07 supports RF-05 and RF-06.

## 2. Method and evidence of consistency of documentation

1. Confirmed `api_v1_router = APIRouter(prefix="/api/v1")` and the 13 `include_router` de `backend/app/api/v1/router.py`.
2. HTTP decorators inspected `@router.get/post/patch/put` and prefixes of authentication routers, companies/invitations, locations/allocations, catalog, suppliers, purchases/reception, balance/movements, transfers, adjustments and sales.
3. **Inventory result:** **46 methods+mounted paths**; `GET /health` y `GET /ready` are separate technical routes of `/api/v1` and are not among those 46.
4. They contrasted with `frontend/src/features/auth/RealAuthApp.tsx` and the pages `Real*Page.tsx`: React REAL uses routes `/real/...` and DEMO `/inicio`, `/b/{demoId}/...`. No expenses, days, accounts or QR illustrative as REAL API resources were presented.
5. Specific files of `frontend/e2e/real/*.spec.ts`, suites Python backend and CI full-stack #4301554889. The figure tested in the base code was **892 Pytest + 38 Playwright REAL + 6 DEMO, todos PASS**. These results are not a new test execution due to the documentary change.
6. They remained explicit: separation purchase/reception, SELL/STORE by headquarters, balance-version and ledger, snapshots, cents/thousandths, declared payments, irreplay idepotent, memory sessions and DEMO without REAL impact.
7. The review confirmed that the historical versions contained labels which had been false after T11 (e.g. ‘React follows DEMO’, ‘RF-07 deferred’, ‘there is no REAL authentication’); **version T12-B at the start** of each document takes precedence over those historical paragraphs.

## 3. Outcome by requirement

| RF | T12-B result |
|---|---|
| RF-01 | Log, login, me and logout REAL drawn to API/UI/test |
| RF-02 | Companies, invitation, acceptance and REAL equipment traced |
| RF-03 | Locations, capacity SELL/STORE and active allocation by actor drawn |
| RF-04 | REAL Catalog of goods/services, price and status |
| RF-05 | Real suppliers and purchases with complete single reception layouts |
| RF-06 | Balance, ledger, atomic transfer and plotted adjustments/versions |
| RF-07 | Real sale, declared payments, recovery and permission by site traced |
| RF-08–10 | **DEMO/DIFFERENT**, sin confundir con backend comercial real |

## 4. Closure limits and pending work

- **T12-C:** the model and diagrams `.puml` 03A/03B/03C still have to be confronted with **SQLAlchemy classes, Alembic schema and current usage cases**. Editorial SVGs are not automatically regenerated without visual control.
- **T12-D:** Document 04, README of backend/frontend/delivery, CHANGELOG and PowerShell/Docker guide may still contain inconsistent historical information.
- **T12-E:** complete review of links, visual artifacts, academic slogan and final HEAD IC; express decision before merging to `main`.
- **Waste risks already documented:** Pydantic warnings `UnsupportedFieldAttributeWarning`, unencrypted indexedDB local recovery payload, declared (unaccredited) real payments, no MP WEBHOOK, UX/WCAG complete pending.
- The review was **documentation only**: no database commands, no new migrations and no business deeds in `TEST Empresa A`He didn't get upset. `main`.

**Opinion T12-B:** **APPROVABLE AS A DOCUMENTARY CONCILIATION OF THE RF/CU/API/UI/TEST NUCLEUM**, pending global review T12-E; does not imply that the TP is finished. Next step: **T12-C — 03 / 03A / 03B / 03C and SQL models**.
