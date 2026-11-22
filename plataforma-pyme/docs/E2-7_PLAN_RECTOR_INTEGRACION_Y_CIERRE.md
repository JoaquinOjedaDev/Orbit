# E2-7 — React–FastAPI integration master plan, comprehensive validation and academic closure

**Status:** reference plan prior to external review; existing T00 planning decisions are in place [E2-7_T00_ DECISIONS_Y_ORDEN_DE_EXECUTION.md](E2-7_T00_DECISIONES_Y_ORDEN_DE_EJECUCION.md). Integration is not yet implemented.  
**Date of preparation:** 2026-11-09.  
**Project:** Platform PyME, TP Final Programming 2, UNSAM 2C2026; multi-company/multi-branch generalist system (WALOS example only).  
**Unchangeable analysis reference:** `main` `9a7a66394daf5a96b18b9ce796a2fe9ec92a4068` (includes PR #28 closure E2-6).  
**Rama documental:** `docs/e2-7a-plan-integracion`. **Do not write productive code on this branch.**  
**Scope:** `plataforma-pyme/`, E2-7 = frontend/backend integration, comprehensive QA and academic closure, **no Expenses/Box as new block**.

> This document is a technical proposal built by reading code and documents from the repository. It does not replace the independent audit of E2-1 to E2-6, nor does it certify that the existing frontend works against PostgreSQL. The review with Astra should question decisions before implementing.

## 1. Purpose and criteria for success

Integrate SPA React/TypeScript E1-D2 (today local DEMO) with actual FastAPI/PostgreSQL contracts from E2-1 to E2-6, **preserving aesthetics, navigation and useful UI capabilities**, enabling incrementally the real flow identity → company → location → catalog → suppliers → purchase → receipt → inventory → sale. Keeping the capabilities of RF-08–RF-10 (expenditure/box, accounts, QR) explicitly in DEMO or deferred mode, without hinting at accreditation, remote persistence or monetary integration that does not exist.

**Verifiable closure:** a user can register, authenticate, create a company, manage his authorized resources, receive stock, make physical/mixed sale, check balance and voucher after reloading, and change business without mixing data. The integration tests of the browser, backend and IC must credit the flow in a precise SHA and with temporary PostgreSQL base.

## 2. Baseline and proven scope

### 2.1 Git and backend status

- `main` analyzed: `9a7a66394daf5a96b18b9ce796a2fe9ec92a4068`; PR #26 persistence E2-6, PR #27 sales, PR #28 merged documentary closure.
- Migrations up to `20261109_0017_sales_foundation.py` / `e26a_sales_foundation`; not introduce another migration without proven need.
- Backend modules present: `auth`, `businesses`, `locations`, `catalog`, `suppliers`, `purchases` y `sales`; inventory/reception/transfer/adjustments are organized under `modules/purchases`.
- HTTP v1 protected with Opaque Bearer (no JWT session random token) for private resources; `POST /sales` usa `Idempotency-Key` UUID4; the server decides authorization, stock, conflicts and response.
- IC of the Merge #27 about `6336152`: run #42696474777, three successful works. The documentary merit PR #28 does not imply new backend execution. Windows regression previously reported: `879 passed`. **No new evidence has been carried out as part of this plan.**

### 2.2 Frontend State

- `frontend/src/App.tsx` constructs the IU from `useDemoSnapshot()`, `findDemoBusiness()` and lists `listDemo*`; navigation controller uses `window.history.pushState`, no React Router.
- `frontend/src/data/demo/demoStore.ts` exposes `demoGateway` and data persists in `window.localStorage`; the code itself warns that it is not authentication or secure isolation.
- Business pages consume entities `Demo*` and no real HTTP client reusable in `src` in the cut analyzed.
- `frontend/vite.config.ts` does not configure proxy; `backend/app/main.py` does not configure CORS. **Decide Network Topology First**.
- The frontend E1 already has profile views, company creation, locations, equipment, catalog, suppliers, purchases, inventory, sales, expenses, days, accounts and visual QR.
- El workflow `.github/workflows/plataforma-pyme-frontend.yml` has jobs build/lint/tests and Playwright from the DEMO prototype. Running backend alone does not certify those jobs or an E2E against real API.

### 2.3 Rules of scope

**Dentro de E2-7:** connect RF-01 to RF-07 to the existing API; contracts/adapters, remote states, UX permissions, handling error, testing, final documentary update. **Out:** backend of expenses/days, real financial accounts, Market Real QR Payment/OAuth/webhook, reservations, returns, recipe production, automatic migration of local DEMO data, taxation, server hosted photography, advanced analytics.

**No falsear alcance:** a visual form may exist in DEMO mode, but that does not convert your operations into PostgreSQL facts. Do not mix DEMO data with REAL company data, nor display them added to the same KPI.

## 3. More important compatibility findings (not equivalent to E2-6) bugs

| ID | Evidence | Integration impact | Candidate solution |
|---|---|---|---|
| INT-01 | `App.tsx` consultation only `demoStore`; page mutations call `demoGateway` | Backend is not a real source in the IU | Explicit Remote Adapter/Repository, not Global Blind Replacement |
| INT-02 | Los IDs DEMO `demo-catalog-UUID`, `demo-location-UUID` no son UUID compatibles con FastAPI | Requirements 422, entity and tenant confusion | Separated DTOs APIs; not converting DEMO ID to API ID by stripping; creating real resources |
| INT-03 | No Vite proxy or CORS in existing configuration | Cross-origin requirements locked in browser | Prefer proxy Vite `/api` developing; production same origin or explicit CORS allowlist |
| INT-04 | `App.tsx` Take `DemoBusiness` and fixes; no authenticated session status | Visual access without real authority | App bootstrap: Authenticated session, remote companies and API-based guards |
| INT-05 | `SalesPage.tsx` use accounts, days and QR DEMO; `POST /sales` does not accept `financial_account_id` ni `cash_session_id` | Invalid or false financial imputation claims | Never send other fields; hide/disable associations in REAL, leave DEMO separate |
| INT-06 | `POST /sales` y `GET /sales/{id}`, sin `GET /sales` en E2-6 | Global sales history cannot be rebuilt from API | For E2-7 evaluation `GET /sales` minimum and paged **by contractual proposal and authorisation**; alternative UI: voucher newly created or by ID |
| INT-07 | E1 supports photos in IndexedDB local, backend catalog has no image upload | Images not portable between devices | Local failure marked; not treat as remote photo or invent endpoint |
| INT-08 | E1 calculates demo and balance movements from local events | Risk of doubling balance when combining API and demo | In REAL `GET /inventory/balances` is authority; `GET /inventory/movements` es ledger |
| INT-09 | E1 includes simulated invitations, cancellation/local approval | API contract only nominative issue/real acceptance and equipment; no full parity | Show only available capabilities; ban simulated Real acceptance |
| INT-10 | `backend/app/main.py` maintains E2-0.3 description; README and API matrix store historical states | Documentation does not reflect final integration | Update metadata and traceability in closing E2-7 E |

## 4. Proposed architectural decisions (ADRs to be ratified)

### ADR E27-01 — Two modes, end-to-end isolated

- **Proposal:** mode `REAL` for the platform connected to PostgreSQL and Mode `DEMO` clearly identified only for unconnected visualizations/functions. Preference: enter REAL mode after login, without mixing carts, business selector or DEMO data. The existing DEMO is kept isolated to preserve UX and academic evaluation; there is no migration or import of `localStorage` implied.
- The mode is not determined by the mere existence of an ID that starts with `demo-`, but by the application/data provider context. The server never relies on the mode declared by the UI.
- UX saves and caches must include `userId + businessId + mode` as an identity key; never mix result sets.
- Avoid accidentally keeping two mutable balances of the same item in REAL mode.

### ADR E27-02 — Typed, centralized and replaceable API Client

- `frontend/src/api/httpClient.ts`: `baseURL` relative, timing or cancellation, JSON typed, `Authorization: Bearer` en memoria y mapeo de errores 401/403/404/409/422/5xx.
- `frontend/src/api/contracts/*.ts`: DTOs in `snake_case` that match OpenAPI, without recycling the `Demo*`.
- `frontend/src/api/adapters/*.ts`: transform DTOs into React view models and inputs to backend commands, without inventing data or altering IDs.
- `frontend/src/api/repositories/*.ts`: auth, businesses, locations, catalog, suppliers, purchases, inventory, sales.
- `frontend/src/app/session/` y `businessContext/`: session, tenant selection and ongoing applications. React Router, Zustand or React Query are not required to be incorporated in the first stage; decide only if it reduces complexity demonstrably.
- **Do not generate client or code from OpenAPI without reviewing limits and conventions**; typed generation is a later option if useful.

### ADR E27-03 — Transport and session

- **Development:** configure Vite proxy for `/api`, `/health` o `/ready` if applicable; browser calls relative path. In production prefer same origin with reverse proxy. If it is inevitable cross origin, allowlist CORS explicit, without wildcard with credentials.
- Token Bearer opaque access only in memory state, without persistence in `localStorage`. El backend expone `/auth/login`, `/auth/me`, `/auth/logout`, **no refresh token** in the current contract; after F5 or expiration, a re-start of session may be necessary. That should be made clear in UX.
- Proteger `/perfil`, `/empresas/nueva` and routes `/b/:businessId/*` in REAL mode with session; verify company/membership GET without infer permissions for DEMO data.
- 401 • invalidate credentials and re-login; 403 • screen of lack of permission; 404 foreign tenant • do not disclose information; 409 • context message/read; 422 • form errors; 5xx/network • try again safely.
- Token should not appear in logs, URLs, E2E artifacts, screenshots or errors shown.

### ADR E27-04 — Commands, Idempotency and updates

- For each idempotent operation, use generated UUID4 **once for logical intent**, preserved with the body unchangeable during retrying. When the result of a mutation may be uncertain after F5, the confined durable local record will be defined in T06 according to the privacy/retention policy documented in T00; do not create a new key when the response is lost.
- In sales, purchases, receptions, transfers, adjustments, business creation: check exact route/header against router; not assume the same policy of all POSTs.
- After each successful commit, reload balance/ledger and dependent projections using only API returned; before timeout retain key/body and offer "Check/retry" instead of sending new command.
- `409` version in adjustment requires rereading of `StockBalance.version` before preparing a **new** command. Do not auto-repeat a modification with obsolete parameters.
- Form States: `idle/loading/success/error/unknown-outcome`; submit buttons disabled while waiting, without promising "not registered" after uncertain timing.

### ADR E27-05 — Do not extend backend without validation

- La ausencia de `GET /sales` It is impossible to replicate the existing history. **Previous formal decision:** accept partial query IU or open paged endpoint sub-PR `GET /sales` with tenant, permissions, filters, order and integrity tests; it is a minimum extension of E2-6, **no guarantee of scope already approved**.
- Similar criteria for pending invitations or unequivalent UI attributes: degrade with transparency or offer a small endpoint if there is justification by acceptance flow, never generate fictitious responses.
- New endpoints should not change historical migrations or expand RF-08–RF-10.
- Backend contracts take precedence; adjust UI to not send prohibited extra fields (`extra=forbid`).

### ADR E27-06 — Stable design, replaceable data

- Store `AppShell`, sidebar/drawer, cards, styles and responsive.
- Use gradually connected pages and reusable presentational components; not import `demoGateway` within a REAL component.
- The change of company goes back/invalidates previous views and requests; use of `AbortController` and context check in response.
- React does not decide effective authorization, it only represents server capabilities and hides/disables actions without permission.

## 5. Proposed incremental plan and quality doors

### E2-7 A — Plan and contracts (this delivery, docs only)

1. Freeze reference `main` and file list.
2. Invent page → action UI → real endpoint → DTO → role → dependence.
3. Sort `REAL`/`DEMO`/`DIFERIDO` and gaps; making pending decisions with Astra.
4. Define form of API layer, session, network, errors, idempotence and tests.
5. Approve matrix and ADRs **before modifying React or FastAPI**.

**Output A:** This plan, detailed matrix, risk matrix/QA, Astra feedback with decisions on changes. It can be merged PR independent documentary only after that review.

### E2-7 B — Real access, companies, locations, catalogue

Divide if appropriate in B0–B3:

- **B0 integration infrastructure:** Vite proxy/URLs, HTTP client, DTOs, error handling, config mode DEMO/REAL, unit tests with mocks. `npm run build` And green lint.
- **B1 auth y tenant:** log/login/logout screen and `GET /auth/me`; listing/creation/editing of companies; private routes; selection of company, absence of business and session states.
- **B2 locations/equipment:** list/creation/editing/state/primary, assignments, memberships and actual nomination invitation. Only operations displayed by API.
- **B3 catalogue:** list, detail, high/editing/activation, SKU/state, well vs service, optional non-authoritative local photo.

**Gate B:** After F5 of the browser the company and catalog are recovered from PostgreSQL; company A and B without leak; unauthorized controls do not execute commands. CI frontend and backend as appropriate.

### E2-7 C — Suppliers, purchases, inventory, sales

Divide to contain risk:

- **C1 suppliers/purchases:** CRUD available from suppliers; purchases with snapshots and free concept; registration does not receive; receipt is confirmed with `POST /purchases/{id}/receive` in a valid STORE location, key idempotent.
- **C2 inventory:** actual balances, signed movements, transfer between locations and `STOCK_INICIAL`/`AJUSTE_*` The frontend stops using the DEMO leader as an authority in REAL mode.
- **C3 sales:** Real POS with physical lines/service, exact payments, location SELL/STORE, `Idempotency-Key`; consult receipt by ID; evaluate pagated history as a pre-development gap.
- Expressly disable DEMO account/box/QR controls in REAL if they are not backed up. The visual QR intent should never trigger a real sale or simulate actual accreditation.

**Door C:** end to end flow executed with an isolated base and stock preservation, without duplicate movements after replay; balance and leadger reconcile.

### E2-7 D — QA integral y hardening

- Backend: pytest con PostgreSQL real en DB temporal, `alembic current/check`, concurrencia/rollback/tenancy.
- Frontend: build, lint, adapter tests, network states, navigation, session, permissions, power.
- E2E Playwright with real API/PostgreSQL, Chromium desktop and mobile; test data isolated by execution; play retrying and change tenant, without secret files.
- IC: jobs backend, frontend and a real e2e integration job (with services), with the same SHA status, touchable routes and traceable failures.
- QA manual guided in browser + Swagger/PostgreSQL cross check.
- Contrast external findings from E2-1 to E2-6 and not introduce unapproved cross-sectional corrections.

**Door D:** no critical/high faults accepted unsolved, green suite and written evidence of the scope that was tested.

### E2-7 E — Academic closure and final delivery

- Update `plataforma-pyme/entrega-programacion-2/01..05`, PlantUML/UML 03A/03B/03C diagrams where applicable, ADRs, README frontend/backend, CHANGELOG and traceability matrix RF/CU → API → IU → test.
- Document local installation and execution mode without credentials, Docker and URLs; define what a non-company user, limited member and entrepreneur with multiple tenants do.
- Register REAL/DEMO/DIFFERED status per screen, earrings and real manual/automated evidence.
- Publish final TW report, acceptance criteria and SHAs/CI manifest; do not confuse pending audit with closed.

**Gate E:** documents consistent with the latest actually integrated SHA and reproducible full flow demonstration.

## 6. Organization of work and branches

**Rule:** branch by increase from `main` Current **after the previous one**; PR isolated with narrowed diff, description of behavior and tests. Name suggested:

```text
docs/e2-7a-plan-integracion       (solo documentos; revisión Astra)
feature/e2-7b0-cliente-http
feature/e2-7b1-auth-tenant
feature/e2-7b2-ubicaciones-equipo
feature/e2-7b3-catalogo
feature/e2-7c1-proveedores-compras
feature/e2-7c2-inventario
feature/e2-7c3-ventas
feature/e2-7d-e2e-qa-integral
docs/e2-7e-cierre-final
```

The names are **proposed, not already created branches**E2-7 can retain the five A-E macrodeliveries even if B/C has micro-PRs.

If your partner opens revisions E2-1..E2-6 in parallel, do not mix their work with these branches without explicit decision. `main` after approving them, and repeat integrated flow tests after each relevant change.

## 7. Risks and mitigations

| Risk | Guidance Severity | Mitigation/test |
|---|---|---|
| • Confusion DEMO ↔ REAL and false operations | High | Unmistakable label, state separation, E2E does not mix |
| Company data leak A to B | Blocking | Cache keys scoped, abort + guard, E2E con dos tenants |
| Loss of response after confirmed POST | High | Persistent key/body in life of attempt, replay and check |
| Tokens displayed by storage, URL or logs | High | Memory only, bug chewing/logs, tests |
| Loss of monetary precision | High | Cents/milli as integers, Python parity HALF_UP, tests |
| Sale adjusts stock in browser and server | Blocking | Solo backend escribe saldo REAL, verificar ledger |
| Extra DEMO fields cause 422 | Average | Strict DTOs, tested adapters |
| Lack of global sales history | Average | Previous decision GET/sales or IU limited, not invented |
| A new form active function RF-08–10 not implemented | High | DEMO mode and disable REAL routes |
| E1 UX regressions or previous block | Average/High | Captures/Playwright desktop and mobile, IC by PR |

## 8. Overall acceptance criteria

**Functional:** log/login/logout; business creation and selector; locations/roles; catalog; suppliers/purchases; reception; balance sheets/movements; adjustment/transfer; physical sale/mixture; correct replay; actual recharge and persistence.

**Security:** isolation between two companies and users; 401/403/404 managed; roles/locations respected by server; no token in persistent storage or logs; no use of DEMO IDs as UUID real resources.

**Integrity:** sales and purchases retain snapshots, HALF_UP amounts and sum of payments; version adjustment; command idempotence; non-negative stock and consistent leadger.

**UX:** maintain professional and responsive prototype design; empty states, permissions, loading, error and precise success; marked deferred function; keyboard access.

**Technicians:** frontend/backend/e2e, Alembic and Docker tests in final SHA, updated academic documentation, isolated test data, no validated credentials.

## 9. Conditions before implementation and external review

The Astra AI must review this plan **without modifying the repository** and produce a proposal for settings with evidence of code, coverage matrix and decisions. Before opening E2-7 B, the team explicitly defines: (1) mode model; (2) UX session after F5; (3) proxy/CORS topology; (4) whether to expand sales list; (5) invitation range; (6) image policy; (7) E2E coverage and QA compatibility.

**Exit rule E2-7 A:** approve/reject each recommendation, update only the accepted plan, and merge this documentary PR. To that extent do not implement backend/frontend in E2-7 A.
