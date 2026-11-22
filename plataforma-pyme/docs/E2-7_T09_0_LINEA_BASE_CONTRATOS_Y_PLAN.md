# E2-7 · T09-0 — Proposed baseline and contracts for consultation and recovery of REAL sales

Opening date: 10/11/2026. **Workforce:** `feature/e2-7-t09-consulta-recuperacion-ventas`created from `main` tras merge PR #41 (T08), commit `5f83541049b6332e5a991810cbfd105515db10ce`.

**State T09:** T09-A approved (CI + Windows); **T09-B — policy P02 confirmed by the responsible on 10/11/2026 and technical contract P03 defined for implementation**. The alternatives in section 2 are preserved as historical proposals; the explicit decision at the end of this file prevails. It does not amount to T09/T10 finished.

## 1. Existing code baseline and contracts

Reviewed directly in `backend/app/modules/sales/`:

| Current remedy | What guarantees | Limit |
|---|---|---|
| `POST /api/v1/businesses/{business_id}/sales` | `Idempotency-Key` UUID4; `201` creation, `200` identical replay; full voucher; one transaction with lines, payments **declared**, stock y ledger | Replay revalidates sales permissions, headquarters/SELL and STORE before checking the key: assignment changes may prevent recovery of the POST voucher |
| `GET /api/v1/businesses/{business_id}/sales/{sale_id}` | UUID full historical check, authenticated and isolated by company; no stock change | It requires knowing `sale_id`; valid session and active membership, but currently **no** filter by location or author of the sale on a valid membership |
| `SaleView` | id, business_id, location_id opcional, request_id, estado CONFIRMADA, subtotales/descuento/total en centavos, notes, created_by_id, created_at, balances_after, lines y payments con snapshots | Not a paged index or REAL sales interface |
| `Sale` | Single key per company `(business_id, request_id)`, company/date indexes, snapshots `balances_after`; FK business/headquarters and business/creator | There's no `GET /sales` ni `GET .../by-request/{request_id}` |

**Important facts:** payment `MERCADO_PAGO_DECLARADO` is a **manual declaration**, not confirmed accreditation of Market Payment, bank transfer, cash or money account. The DEMO sales frontend is not a REAL sale. E2-6 backend services will not be modified by a policy proposal without explicit decision.

Base includes suites `test_sales_api_integration.py`, `test_sales_permissions_integration.py`, `test_sales_atomicity_integration.py`, `test_sales_concurrency_integration.py` y `test_sales_inventory_interop_integration.py`; global acceptance T08 was 879/879 backend on temporary PostgreSQL. **not yet accredited** los endpoints propuestos de T09.

## 2. Decisions that T00 requires to be resolved first

### P02 — Historical and replay consultation for changes in permissions (PENDENT)

Situations requiring clear policy: Headquarters `SUSPENDIDA` after a sale; role or assignment `SELL/STORE` retired; user with revoked membership; closed session; change of company; confirmed attempt but lost HTTP response.

**Alternatives to evaluate (NOT implemented):**
- **A. Keeping the current contract unchanged:** replay POST requires current permissions; Get historical by `sale_id` allows any active member of the company (regardless of assignment). It is current observable behavior, but horizontal exposure between employees may not be desirable.
- **B. Separate authorization to read sales authorisation (preferred proposal for discussion):** la **new sale** always requires current permits; **reading of a confirmed sale of its own** its author is allowed as long as it remains active, even if the headquarters are pausated or lost STORE; holder/admin can see all the tenant; other employees cannot see sales of peers beyond their authorized reach. Membership or session revoked remains denied. Post repetition should not create new sale if permissions changed, and its replay policy is defined separately with explicit evidence.
- **C. Reading only with existing headquarters permits:** also restricts the author when he loses assignment; decreases exposure but may prevent him from resolving an attempt after F5.

**Not amended** `SaleService.create`, `get`, nor the rules of authorization until approving a policy and specifying precedence of 401/403/404/409, without filtering information from other tenants. The existing test confirms rejection of operator replay after revoke STORE, and rejection of session/membership revoked.

### P03 — Listing and search design by request ID (PENDENT)

**Proposal for a contract subject to approval:**

```text
GET /api/v1/businesses/{business_id}/sales?offset=0&limit=100&location_id=<UUID-opcional>
GET /api/v1/businesses/{business_id}/sales/by-request/{request_id}
GET /api/v1/businesses/{business_id}/sales/{sale_id}  (EXISTENTE, preservar)
```

- Stop `GET /sales`: DTO de **Summary**, without reference payments or full lines: `id, business_id, location_id, request_id, status, total_cents, created_by_id, created_at`; read only, deterministic order `created_at DESC, id DESC`, validated pagination `0 <= offset`, `1 <= limit <= 100` (or agreed limit), results limited to the authorized tenant/roles/locations. `offset` may move to new sales; do not advertise "full listing" until pages are exhausted.
- Stop `GET .../by-request/{request_id}`: **Same SaleView** historical, without mutating stock or creating new attempt; semantics not found without revealing if it belongs to another business. `/by-request/...` separated from `/{sale_id}`.
- El `request_id` is correlation identifier; to use the idempotent operation after lost response the **Idempotency-Key and the same body**. A 404 query does not show that a previous POST has not been processed.
- Auth: Opaque Bearer in memory, active session, strict tenant, without failback to DEMO; role visibility requires P02.
- Options: Alternative screen evaluation that only consults a voucher known to `sale_id`Without listing, the POS of T10 would be left with limited recovery.

## 3. First safe increase — T09-A

**Immediate objective:** to build a reading foundation that **are already authorised by the existing contract**: TypeScript client for `GET /sales/{sale_id}` with strict DTO validation, tenant/UID, amounts/snapshots and Node tests. Do not create REAL sales IU yet, do not add POST or modify servers or permissions; keep DEMO completely independent.

**Acceptance criteria:**
1. Path `/api/v1` relativa, GET Bearer, sin body, `credentials: omit`, without writing and no persistent token storage.
2. Parser accepts services without headquarters or inventory (`location_id=null`, `balances_after=[]`) and goods with historical balances, without recalculating prices from current catalogue.
3. Reject receipts from another tenant, UUID/quantities/amounts/compatible means, duplicate lines/payments and lack of consistency between lines, discounts and payments.
4. Propaga 401/403/404/5xx and network errors, without generating another POST or inventing a voucher.
5. Frontend build/lint/green test in GitHub; T09-A does not require migration or alter the database.

## 4. Suggested future implementation (subject to P02/P03)

- **T09-B — Approved contract:** set role/headquarters matrix/historical actor + summary DTO + pagination and error rules. Document ADR if you change the access policy; do not modify previous replay behavior without a regression test that reproduces the current policy.
- **T09-C — Backend:** Proposed endpoints and PostgreSQL tests, including 101+ sales, two companies, two operators, business/headquarters suspended, change of assignment, session or membership revoked, request of another tenant and stable order.
- **T09-D — Frontend:** REAL history tagged unequivocally, search by request ID only if approved contract, partial/loading/error/last page, snapshot proof, no fake credited payments.
- **T09-E — End to end recovery:** POST confirmed with lost response; F5 and login of the same actor; recover by request_id if it exists; explicit replay of MISMA key/body according to adopted policy; 404 does not imply "never sent"; do not duplicate sale or stock; PostgreSQL temporary and Playwright.
- **T09-F — QA:** manual validation with TEST data and without repeat sales; complete IC, audit and draft PR. `main` intact until integration authorization.

## 5. Guardrails para T09/T10

1. Do not enable REAL POS, cashier, expense, accounts or QR by inference from DEMO.
2. Do not create an API `GET /sales` fictional frontend before its verified implementation.
3. Do not use `localStorage` for Bearer or create virtually accredited payments.
4. Do not alter roles/allocations of real accounts to test negative scenarios; use isolated PostgreSQL fixes.
5. Do not replicate sales by retrying an uncertain response; preserve identity and body of the same attempt.
6. T09 PR open as draft up to QA and scope review.

**Milestone T09-0:** verified baseline, proposed contract and pending decisions; documenting them **does not automatically approve them**.


## 6. Local validation T09-A — 10/11/2026

- **Environment:** Windows PowerShell en `plataforma-pyme/frontend`; rama `feature/e2-7-t09-consulta-recuperacion-ventas`, commit funcional `09e0a88`.
- **Command executed by the user:** `npm.cmd run test:sales-real-read`. Used `npm.cmd` porque PowerShell bloquea `npm.ps1` for its implementation policy; **no change of ExecutionPolicy or administrator privilege required**.
- **Observed local result:** `tests 10`, `pass 10`, `fail 0`, `cancelled 0`, `skipped 0`, `todo 0`, duration ~260 ms.
- **Coverage of these 10 tests:** GET by UUID with Bearer in memory and without POST, snapshots and payments declared mixed sale, rounding HALF_UP, rejection of foreign tenant and invalid DTOs, inconsistent amounts/payments, duplicates, invalid UUID, propagation 401/403/404/500, network failure in GET and error messages.
- **Evidence of the same delivery:** GitHub Actions #42901702416, **SUCCESS** en `09e0a88`, 879 backend, 266 frontend, 4 Playwright REAL de inventario y 6 Playwright DEMO.

**Opinion T09-A:** Read gateway + IC and locally approved tests. No REAL sales screen or new endpoint; P02/P03 are pending approval before modifying historical permissions or the backend.


## 7. T09-B — Formal decision on historical permits (adopted 10/11/2026)

**Approval of the responsible person:** "In charge and Worker, where it is specifically assigned. Owner and Administrator, you can consult everything. User outside those roles cannot consult anything." **Four roles already exist** en `BusinessRole` Do not create new roles or relax the criterion to "any member sees everything".

| Role of Active Membership | `GET /sales/{sale_id}`, `GET /sales/by-request/{request_id}`, `GET /sales` |
|---|---|
| ADMINISTRATIVE SERVICE | Any proof of the company, with or without headquarters |
| ADMINISTRATOR | Any proof of the company, with or without headquarters |
| MANAGER | Only proof of headquarters where you have `LocationAssignment.status = ACTIVA` |
| STAFF MEMBER | Only proof of headquarters where you have `LocationAssignment.status = ACTIVA` |
| Non-existent role, user of another business, no Active membership or invalid session | Denied. No readings among tenants |

**Specific rules:**
- The author **has no special privilege**: If you lose assignment to the headquarters, you also do not read your own vouchers for that seat.
- A sale of services with `location_id = null` is visible only for holder/admin, because there is no seat to assign operators.
- Reading historical documents is not operating: if the headquarters is `PAUSA` after a sale, an allowance that is still `ACTIVA` preserve **Historical reading only**. The new sale continues to require permits and currently operational headquarters.
- Revalidation is provided in PostgreSQL session, membership, company and assignments on each application; hiding frontend buttons is not enough.
- For privacy, non-existent proofs, of another tenant or **not visible to that member** return `404` homogeneous. User who does not have business reading permission: `403`; no active session: `401`. Other/inactive membership uses `404`.
- `GET` does not change `Sale`, payments, inventory or ledger. `POST` sales and its existing replay policy **do not change in T09-B/C**; if you lost assignment, you cannot rewrite or replay POST. Recovery will be by means of a `GET` when the user still retains read permissions.
- El `request_id` is not a credit card that skips assignments. The search endpoint has exactly the same policy as the query for `sale_id`.

**P03 — Technical consultation contract authorised to advance:** `GET /sales` (visible sales summaries, 0 ≤ offset, 1 ≤ limit ≤ 100, date and ID down, optional location filter) and `GET /sales/by-request/{request_id}` (complete historical proof) The pagination and filter **apply in SQL after restricting by permissions**, no sales are returned from others even if they are in the same tenant. `GET /sales/{sale_id}` existing one hardens to comply with the new policy.

**Next step:** T09-C backend and security/visibility tests on isolated PostgreSQL, without changing local accounts, and then T09-D frontend with REAL history.
