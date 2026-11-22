# E2-7 T00 — Operational decisions and order of execution after external review

**Status:** T00 documentary; implementation NOT initiated. **Date:** 2026-11-09.  
**Verified base:** `main` `b72997be411d659ff7480f642543162445c951a0`.  
**Rama:** `docs/e2-7-t00-decisiones` (only documents, no changes in application).  
**Scope:** `plataforma-pyme/` only; E2-7 = React/FastAPI/PostgreSQL + QA + academic closure integration.  
**Inputs:** `E2-7_PLAN_RECTOR_INTEGRACION_Y_CIERRE.md`, `E2-7_MATRIZ_FRONTEND_BACKEND_Y_CONTRATOS.md`, `E2-7_QA_CRITERIOS_ACEPTACION_Y_RIESGOS.md`, external report `REVISION_GENERAL_PLATAFORMA_PYME_PRE_E2-7.md` v2 delivered by the responsible, plus observations from another AI. The external report is not incorporated here as original file; do not attribute execution of your tests to the computer.

> **Purpose:** establish a verifiable construction order and preserve distinction between: fact of code, technically accepted recommendation for planning, pending business decision and delayed improvement. It is not independently audited executed nor authorized price or security policy changes.

## 1. Baseline correction and observed facts

- En `backend/app/modules/auth/tokens.py`, the token is created by `secrets.token_urlsafe(32)` and its hash by SHA-256. **Opaque Bearer** stored/verified per session; **NO JWT**Never decode claims from him.
- `frontend/src/App.tsx` y `src/data/demo/demoStore.ts` continue using DEMO and `localStorage`. REAL mode needs explicit HTTP client, session and tenant; do not use objects or IDs `demo-...` as real DTOs.
- `GET /api/v1/businesses/{business_id}/catalog` admite `offset` y `limit`, con `limit=100` default and maximum 500. Local search on a single page **is not a global search**.
- The E2-6 contract has `POST /sales` y `GET /sales/{sale_id}`, sin `GET /sales` pagination or proof of `request_id` at the inspected cut.
- `SalesService` valid operational location before performing POST replay. Its modification requires explicit decision of historical policy and role/membership/headquarters testing.
- `SaleLineInput.unit_price_cents` and discount come from the client; the server does not force the current price of catalog. **It's a pending commercial decision.** for roles with SELL, it does not fail universally.
- Frontend counting operations represent final amount; `AdjustStockRequest` de backend representa **positive delta with type** más `expected_version`.
- The purchase/reception backend records a full reception and at one location only; partial/multiple reception is outside the current MVP except for specific approval.
- Previous IC reports test the referenced commit, not the code yet unintegrated E2-7.

## 2. Decisions adopted for the integration plan

| ID | Working policy for E2-7 | Justification and condition |
|---|---|---|
| D01 | **Store** SPA React and E1 design, adapting data and callbacks by flow | Avoid existing IU rewriting |
| D02 | Explicit separation `REAL` y `DEMO`; never mix identities, balances, KPIs or IDs | PostgreSQL is the authority of REAL state |
| D03 | Central HTTP client with DTOs API, 204 handling, faults, timeouts, 401/403/404/409/422 | Reduce discrepancies FastAPI/React |
| D04 | Development with proxy Vite towards FastAPI; without hardcode final URL | Avoid local CORS blocks and maintain reusable transport |
| D05 | Token de acceso **opaque**, only in memory initially; clear re-login after F5 | No refresh endpoint today. Do not interpret token as JWT. Persistent session is reconsidered if UX requires it |
| D06 | Remote status scooter per user + company + mode + session generation; ignore late answers | Avoid leaks by changes A→B, logout/login |
| D07 | Explicit Page/Completitude; not declare total global or zero stock per partial page | Catalogue/lists and POS >100 articles |
| D08 | Idepotent commands: key/body immutable by attempt; **no automatic retry with new key** | Timeout may occur after commit |
| D09 | For uncertain result commands, design of **long-term registration** independent of Bearer, subject to privacy review, cleaning and compatibility before activating | Must survive F5; no automatic queue or token storage |
| D10 | REAL Sales will require listing/recovery **if specific contracts are approved**; not fake customer history | Minimum extensions to GET /sales pagado y GET por request_id |
| D11 | Count adjustment translated to delta/version with human confirmation; non-atomic multi-item batch is DEMO or deferred | Do not create wrong changes by outdated reading |
| D12 | Box, expenses, financial accounts, QR and remote photos are DEMO/differed in E2-7 | Keep academic cut RF-01..07 |
| D13 | Do not refactor common authorisation or extend partial reception only by opportunity | E2-1..E2-6 compatibility; first integrate and measure |
| D14 | Each increment has focused tests, compilation, SHA evidence, and delimited PR; QA full-stack starts in authentication, not at the end | Reduce regressions and accumulate evidence |

These are rules of *implementation/integration*, not new trade policy decisions.

## 3. Business decisions and contract to be closed **before the affected flow**

| ID | Item | Initial recommendation | Door |
|---|---|---|---|
| P01 | Price/discount policy by role | Explicit retention of the current contract while deciding; if you choose restricted price, validate backend, never only UX. Do not enable workers with restriction assumptions without that decision | Before T10 |
| P02 | Historical/replay recovery from changed paused headquarters, role or assignment | Maintain authentication, tenant, actor and digest. Define historical reading rights against the right to resale. Test scenarios before moving validations | Before T09 |
| P03 | Accurate Listing Design/Sales Consultancy by Request_id | DTO summary, pagination, order, permissions, semantics of 404 and routes without collision with `/{sale_id}` | T09 |
| P04 | Local Register of Commercial Intentions | Decide support (IndexedDB or other), user/tenant scope, life cycle, manual deletion, retention limit, shared devices and cases of loss/damage of storage. **Do not quietly purge an unsolved attempt** | T06 |
| P05 | Session persistence after reload | Start memory and re-authentication MVP. If continuous session is required, evaluate alternative cookie HttpOnly/refresh server-side before you move on Bearer to `sessionStorage` | T02 / UX revision |
| P06 | POS with more than 100 articles | First approach: iterate pages or UI page; search globally requires compatible endpoint/filters. `q` fictional frontend | T05–T10 |

**Important:** P01 and P02 should not be automatically implemented because an AI has proposed a policy; decision of the responsible will be documented.

## 4. Treatment of external observations

| Finding | Type | Treatment |
|---|---|---|
| REV-001 | Gap | Accepted for design: decouple DEMO status of REAL by flow |
| REV-002 | Gap | Accepted: pagination/completion in list and POS |
| REV-003 | Founded risk | Accepted technical address: durable command identity, pending retention policy |
| REV-004 | Founded risk | Reserved for T09; do not move authorization without proof |
| REV-005 | Gap | Accepted: final count → delta + version |
| REV-006 | Document error | Correct JWT references in E2-7 documents; backend does not change |
| REV-007 | Business-dependent risk | P01 pending, not declaring bug confirmed |
| REV-008 | Optional improvement | Deferred after integration and measurement |
| Re-login tras F5 | Tradeoff UX | Explicit initial MVP behavior; persistent session requires separate evaluation |
| Partial reception / multiple deposits | Scope extension | Deferred |
| Remote search endpoint `?q=` | Scope extension | Conditioned to proof of necessity and contract |
| Limit five files/commit | Sugerencia de proceso | Not literally adopted: small PR by target and test |
| TTL of earrings 24 h | Proposed policy | Not automatically adopted; require retention/delete defined |
| `GET /sales` and search by request ID | Minimum candidate extension | Plan contract and approval in T09 |

## 5. Implementation order — T00 to T12

| Increase | Delivery | Activity | Dependencies/gate |
|---|---|---|---|
| **T00** | E2-7 A | This document, JWT correction and planning references | Only docs; no code changes |
| **T01** | B0 | HTTP client, transport/proxy, network errors and tests | T00 and defined network |
| **T02** | B1 | Registration/login/me/logout, guards, REAL/DEMO and opaque session | T01; test real API from browser |
| **T03** | B1 | Business and tenant, safe change, initial dashboard | T02 |
| **T04** | B2 | Locations, equipment, invitations and assignments | T03 |
| **T05** | B3 | Catalogue, pagination/completion, types, prices null | T03; T04 if using headquarters |
| **T06** | C preparation | Command attempt tracking, uncertain result, scope and recovery | T02/T03 y P04 |
| **T07** | C1 | Suppliers, purchases and reception | T04/T05/T06 |
| **T08** | C2 | Inventory, transfer, individual count versioned | T07 for end-to-end flow |
| **T09** | C3 support | Define and, if approved, implement list/recover sales; historical replay with P02 policy | T06, P02/P03 |
| **T10** | C3 | Actual POS, declared payments, vouchers, balances | T08/T09 and policy P01 |
| **T11** | D | QA integral PostgreSQL/Playwright/CI, multiempresa, errores de red | Integrated E2-7 |
| **T12** | E | Academic documents 01–05, UML, README, CHANGELOG, closing | Validated QA |

**Rule:** an increase can be subdivided if it covers too many responsibilities; not merge changes without testing new behavior. `main` should be refreshed at the beginning of each increment. `main` updated, not from an unfused documentary branch.

## 6. New minimum risk tests

- **T01/T02:** 204 without JSON, 401 current versus old session, CORS/proxy, secure routes, F5 and re-login.
- **T03:** late response of A after selecting B; different user in same browser.
- **T05:** 101 and 501 products, second page failed, selector POS does not hide an article per pagination; null fields.
- **T06/T09:** 201 confirmed and response lost; F5; login same actor; recover proof, one effect only. 404 temporary does not amount to operation never sent; retry same body/key.
- **T07:** High purchase without stock; once reception and replay; concept/service without physical movements.
- **T08:** count 10→7 delta -3, 10→0, 0 with history, `expected_version` old and concurrent sale.
- **T09/T10:** tenant, permissions and actor listed/consulted by request, replay with paused headquarters/revocated membership; price according to policy; non-negative stock without duplicate sale.
- **T11:** desktop/mobile browser with FastAPI and PostgreSQL **on the same ephemeral basis**, without DEMO failback; traces and sanitized credentials.

## 6.1. Acceptance requirements arising from a second review

The second opinion received supports the T00–T12 order and highlights four operational points. It does not change D01–D14 decisions or approve backend extensions by itself. These clarifications are **future test criteria**, not tests performed:

1. **F5 and sitting (T02):** test login → navigation to company → F5. With Bearer only in memory, a clear re-attunation must occur, the return route should be kept when it is safe and no information of an expired session displayed. Evaluate UX friction with real use before adopting token persistence. `sessionStorage` does not automatically approve; cookies `HttpOnly` would require a change of contract/authentication with CSRF analysis.
2. **Catalogue/POS completeness (T05 and T10):** test at least 101 and 501 articles. If successive pages are downloaded, the IU must distinguish `loading`, `partial`, `complete` y `error`. A local filter on an incomplete list cannot promise global results; a back-page error cannot be hidden under "no results". `GET /catalog?q=` is still subject to an explicit contract/backend.
3. **Dependencia T06 → T09 → T10:** T06 defines and tests preservation of intent/body identity against uncertain network; T09 defines authenticated recovery from sale by `request_id` and listed if approved; T10 **does not enable POS with collateral after F5** until you test the complete path to loss of response. A GET with 404 does not prove that the original POST has failed; do not create new key or automatically forward.
4. **Count version conflict (T08):** ante `409` por `expected_version` obsolete, refresh balance/version and show clearly that the inventory changed during counting. Require new human revision and confirmation; do not automatically recalculate or send a difference against the new version. Distinguish that conflict from another 409.
5. **Tests from T02:** each first real HTTP stream must test browser → FastAPI → PostgreSQL on an explicit time base, in addition to unit tests. T11 consolidates the complete scenarios but does not constitute the first full-stack execution.
6. **Small PR per target:** maintain independent PR for increase and related evidence; do not impose an arbitrary number of files per commit.

**Output:** These conditions must be moved to the criteria for acceptance of corresponding increments when implemented. They do not require a new phase prior to T01.

## 7. Output condition T00 and next step

**T00 is complete as a documentary proposal** When this document is published, the JWT references of the master plan are corrected and the diff versus `main` contains only documents. Do not claim that T01 or E2E cases are already implemented or approved.

**Next increase:** T01 HTTP/transport client. Start on a new branch based on the SHA of `main` not modify GitHub Actions outside the `plataforma-pyme/` without independent authorization.

### Note on external material

The expanded review report is evidence provided by the responsible; for a future AI developer, explicitly annex it or use this summary matrix. Do not assume that the original file is in GitHub if it has not been published there.
