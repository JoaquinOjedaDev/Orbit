# E2-7 — Comprehensive QA strategy, E2E tests, risks and exit doors

**Type:** QA design, not testing run. Operating plugin: [T00 decisions post review](E2-7_T00_DECISIONES_Y_ORDEN_DE_EJECUCION.md).  
**Initial version:** 2026-11-09. **Base:** `main` `9a7a66394daf5a96b18b9ce796a2fe9ec92a4068`.  
**Units:** [Master plan](E2-7_PLAN_RECTOR_INTEGRACION_Y_CIERRE.md) · [integration matrix](E2-7_MATRIZ_FRONTEND_BACKEND_Y_CONTRATOS.md).  
**Objective:** prevent "visual" integration that simulates persistence, permissions, money or stock without real connection.

## 1. What does "approved" mean and what does not

- A passing DEMO frontend test checks rules and E1 IU. **no** communication with FastAPI.
- A passing pytest backend checks backend in its environment, **no** React consummate the right contract.
- A correct Swagger 201 checks the API in the environment consulted, **no** the browser integration.
- Un Playwright contra Vite y fixtures locales **no** es E2E full stack.
- The E2-7 validation requires *full-stack* tests where browser, FastAPI and PostgreSQL share an identified ephemeral base, with account/company created for execution. Also keep pure unitary tests separately.
- Never print real credentials, tokens, passwords or DSN on logs or reports.

## 2. Proposed test pyramid

| Layer | Runer/environment | Probar | Door |
|---|---|---|---|
| TypeScript adapters | `node --test` or frontend runner defined in B0 | DTO snapshot_case, conversions, enums, nullables, cents/thousandths, IDs, errors | Every critical mapping has fixture |
| HTTP Client | Fetch deterministic mocks, no real connection | Authorization, Idempotency-Key, cancellation, 401/403/409/422/5xx, timing, parsing JSON | No secrets or dangerous retries |
| React Components | simulated UI status and API tests | Loading, empty, denied, retry, disabled submission, form validation, navigation | Do not mutate demoStore in REAL |
| Backend ya existente | pytest + PostgreSQL isolated | Auth, tenant, FK, rollback, balance, version, idempotency, permissions | Full regression without failure |
| Real API Integration | FastAPI/PostgreSQL test | POST/GET contracts, codes error, actual transactions | Balances and movements |
| Navegador full stack | Playwright Chromium desktop/mobile + API and DB | User flow → business → purchase/reception → sale → reload | No DEMO data, idempotency |
| Manual revision | Swagger and local browser | Checks, stock results, professional IU | Dated evidence, exact SHA |

**Minimum test observation:** save sanitized URLs, status, non-sensitive operation ID, timestamps, unsecreted environment settings, code SHA and links to IC. Show `request_id` test may be useful, but never taken session.

## 3. Mandatory E2E scenarios

| ID | Flow | Expected State |
|---|---|---|
| E27-AUTH-01 | Registration → login → `GET /me` | Real access and correct profile |
| E27-AUTH-02 | Logout and protected path access | No REAL information displayed after logout |
| E27-AUTH-03 | F5 with token only memory | Clear reauthentication, no fall to silent DEMO |
| E27-TEN-01 | Create A and B companies; change selector | Only selected company data |
| E27-TEN-02 | Request for A in flight when sailing to B | Old answer is canceled or ignored; no contamination |
| E27-TEN-03 | Enter other company URL | 403/404 and view without other data |
| E27-PERM-01 | Unallocated Contributor Trys Operation SELL/STORE | UI no promete permiso; API deniega |
| E27-LOC-01 | Crear sede SELL+STORE; pausar/reactivar | Changes that persist after F5 |
| E27-CAT-01 | Create Well `UNIDAD` and service `SERVICIO`; inactivate well | Persisting and sealable sheets/status respected |
| E27-SUP-01 | Register provider | CRUD/persistent actual consultation |
| E27-PUR-01 | Create purchase with a free concept and good | Register does not change stocks |
| E27-REC-01 | Receive purchase from STORE headquarters | Raise balance once, one movement per physical line |
| E27-REC-02 | Retry the same idempotent reception | Same receipt, no second income |
| E27-INV-01 | Check balance/version and leadger | Server values, not demo calculations |
| E27-INV-02 | Valid transfer of headquarters | Two events with opposite signs, zero net sum |
| E27-INV-03 | Adjust with `expected_version` valid | Balance/version progress exactly |
| E27-INV-04 | Adjust with obsolete version | 409, reload and notice without false update |
| E27-SAL-01 | Sale of 2 goods with sufficient stock | 201, negative movement and lower balance |
| E27-SAL-02 | Mixed sale good + service and two payments | Just fine discount, total payments accurate |
| E27-SAL-03 | Retry key/payload after lost response | 200 same voucher, no double movement |
| E27-SAL-04 | Sell more than stock | 409 no voucher and mutated balance |
| E27-SAL-05 | Change price IU or discount with inconsistent payments | Client/server validan, without false success |
| E27-PRES-01 | Reload after recording sale/purchase | Consultations reload the persistence in PostgreSQL |
| E27-MODE-01 | DEMO old local and REAL company in browser | Separate data and KPIs, without automatic import |
| E27-MODE-02 | Operating UI QR/days/accounts | DEMO reported; does not alter sales/stock/real accounts |
| E27-RESP-01 | Desktop/mobile and keyboard displays | Drawer, accessible forms, states and navigability |

**Important business criterion:** si en E2-7 C3 se decide no implementar `GET /sales`, document and test the limited experience of proof recovery by ID. Do not mark "complete persistent history" as approved for having shown only the last sale in memory.

## 4. Tests de red y resiliencia

**401:** token absent/revocated, clear session in memory, do not display protected data in the previous view.  
**403:** maintain general session, deny operation and not represent fictitious rollback.  
**404:** resource or company not available, safe navigation without information from another tenant.  
**409:** distinguish stock conflict, idempotency, version and company status; reload data and preserve user intent where appropriate.  
**422:** Map Pydatic details to fields, without presenting secrets or stack traces to the operator.  
**500/network:** show unknown result status for idepotent mutations with timeout, allow query/retry **same key and body**; do not create new command automatically.  
**Cancellation when changing tenant:** an aborted response cannot overwrite data or errors of the new context.

On frontend tests must cover `AbortController` or equivalent, loading/unmount, double click and quick business change.

## 5. Safe environment preparation

1. Use Docker PostgreSQL or known local service, without deleting pre-existing data. **single ephemeral per execution** with a preset name `asistente_pyme_e27_test_...`.
2. Apply `alembic upgrade head` on the new basis, `alembic current`, `alembic check`; do not execute downgrades in populated base.
3. Start FastAPI aiming at **that same DB**; probar `/health` y `/ready`.
4. Start Vite using proxy to that FastAPI; Playwright uses frontend origin, without exposing token.
5. Create users, companies and exclusive execution items with idepotent test keys; do not reuse historical E2-6 IDs.
6. When you finish, register SHA and results, do not share credentials. Delete DB only if it was created by that execution and does not contain preserved data; make explicit and secure cleaning.
7. The API of `compose --profile api` you can point to another DB/port: check `DB_NAME`port and `/ready` before interpreting results.
8. The IC integration should provide a clean PostgreSQL and publish sanitized log/failure evidence.

## 6. Windows reference commands (do not run on another base by accident)

En `plataforma-pyme/backend`, **only with known test DB**:

```powershell
$env:DB_NAME = "<BASE_E27_EFIMERA_Y_VERIFICADA>"
$env:RUN_DB_INTEGRATION = "1"
try {
  .\.venv\Scripts\python.exe -m alembic upgrade head
  if ($LASTEXITCODE -ne 0) { throw "upgrade falló" }
  .\.venv\Scripts\python.exe -m alembic current
  if ($LASTEXITCODE -ne 0) { throw "current falló" }
  .\.venv\Scripts\python.exe -m alembic check
  if ($LASTEXITCODE -ne 0) { throw "check falló" }
  .\.venv\Scripts\python.exe -m pytest -q
  if ($LASTEXITCODE -ne 0) { throw "pytest falló" }
} finally {
  Remove-Item Env:\DB_NAME -ErrorAction SilentlyContinue
  Remove-Item Env:\RUN_DB_INTEGRATION -ErrorAction SilentlyContinue
}
```

En `plataforma-pyme/frontend`:

```powershell
npm ci
npm run build
npm run lint
npm run test:sales
npm run test:inventory
```

Full-stack tests with Playwright require real backend and ephemeral base configuration/start **plus** of previous commands. Do not submit `npm run test:sales` demo as real E2E.

## 7. Delivery Acceptance Checklist

### E2-7 A (documents)
- [ ] Mapping pages, contracts and decisions read by the team
- [ ] Astra reviewed real access to the code and generated findings
- [ ] Found classified: accept/ adjust/displace/reject
- [ ] Explicit Mode Decisions, token, proxy, listings and financial partnership
- [ ] PR documentary A approved before encoding

### E2-7 B0–B3
- [ ] `/api/v1` from Vite works, no hardcoded URL
- [ ] No hay token en localStorage, sessionStorage o URL
- [ ] Login/logout and 401 solid error
- [ ] Change company cancels/invalidates data and queries
- [ ] Locations, equipment and catalog use API, without demo IDs
- [ ] UI retains design and responds in mobile/keyboard
- [ ] Adapter testing and green frontend IC

### E2-7 C1–C3
- [ ] Suppliers, shopping, reception connected
- [ ] Stock sale de `GET balances`; ledger de `GET movements`
- [ ] Adjustment respected `expected_version`
- [ ] Physical/mixed and replay sales do not count twice
- [ ] Declared payments do not impact accounts/box
- [ ] Sales history: expressly defined and proven scope
- [ ] Complete flow test and green cross regression

### E2-7 D–E
- [ ] Playwright desktop and mobile browser against real API + PostgreSQL
- [ ] Two tested tenants, permissions and revoked session
- [ ] Final SHA IC and driftless Alembic
- [ ] README, UML/plants and RF/CU/API/UI/test matrix updated
- [ ] Sanitized QA/CI logs, slopes and explicit limits
- [ ] External audits and decisions incorporated only if they are actually carried out

## 8. Findings policy

Astra's review of this plan **It's not a real test.**Each observation requires: reference code/contract, risk, minimum proposal, acceptance test and compatibility with E2-1-E2-6. Do not introduce style changes or dependencies by taste if they do not reduce verifiable risk. A confirmed blocking finding suspends the transition to the next increase until its resolution or documented decision of the responsible.

**Conclusion QA:** E2-7 can be considered closed only if **real commercial data cross the React–FastAPI–PostgreSQL border** in reproducible flows, without losing authentication, tenancy, atomism or traceability.

## 9. Cases incorporated from external review (planned, not implemented)

- **Pageing:** 101 and 501 articles, second-page failure, change of company in the middle of downloading; not count partial collection as total or infer zero balance per incomplete page.
- **Token opaque:** login does not interpret JWT; logout 204 without attempting to parse JSON; an old 401 session does not destroy a new session.
- **Uncertain result:** POST confirmed but lost response; F5 + re-login; recover the same intent without new key and no duplicate effect; durable storage failure and different user.
- **Count:** balance 10→7, 10→0, zero balance with history, obsolete version, intermediate sale and multiple non-atomic count disabled in REAL.
- **Sale:** replay after paused headquarters/role changed/revocated membership according to approved policy, and price/discount according to final trade rule.
- **Scope:** these tests are added to the planning; do not accredit its approval until you run the scenario against the SHA and corresponding environment.
