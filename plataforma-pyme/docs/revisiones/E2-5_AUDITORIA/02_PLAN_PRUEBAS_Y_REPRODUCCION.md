# E2-5 — Reproducible audit protocol and test plan

**Important:** This is it. **a plan for the auditor**, DO NOT evidence of additional tests performed during closure. The auditor must keep sound logs, SHA, environment and effective results from each test.

## 1. Entry door: isolation and traceability

**Before you run any test commands that PostgreSQL writes:**
1. Cloning in Directory **independent** and verify `git rev-parse HEAD` y `git status --short`.
2. Identify the effective URL of the engine and **name/host/port of database** to which the runner test will aim; print only non-sensitive parameters. If there is doubt about DB, stop execution.
3. Lift PostgreSQL 16 **dedicated/ephemeral**, with user and unreuseable data from local server/production. Do not recycle the developer's QA volume. If isolation cannot be verified, mark DB tests as **NOT EXECUTED**, do not force `RUN_DB_INTEGRATION=1`.
4. Review `backend/app/core/settings.py`, `backend/app/infrastructure/db.py` y las fixtures de `test_receipt_concurrency_integration.py`: some concurrent tests create and clean committed tenants, albeit with limited scope.
5. Apply migrations **on the test base only** according to the existing chain; `alembic current` must show `e25a_inventory_ops (head)` y `alembic check` You must not detect drift.
6. For shared environments, any INSERT/UPDATE/DELETE SQL-level testing is **prohibited**even inside “supposed” rollback without checking.

**No ejecutar:** `docker compose down -v`, `DROP`, `TRUNCATE`, `DELETE` global, `alembic downgrade`, `stamp` or elimination of tables/volumes. An auditor does not need to recreate the developer's base for evaluating the system.

## 2. Code verification and repository

In independent clone, after approval and merging of the documentary PR:

```powershell
git fetch origin
git switch main
git pull --ff-only origin main
git status --short
git rev-parse HEAD
# Fijar además SHA funcional: 748e69319d8d04900c009d5184168a264a9deeac
# Comprobar por diff si desde ese SHA solo cambió documentación.
git diff --name-status 748e69319d8d04900c009d5184168a264a9deeac HEAD -- plataforma-pyme/backend
```

**Expected only if main had no subsequent functional evolution:** Last command without difference. If change appears in backend, register **two SHAs** and not attribute E2-5 tests to the back code without retesting it. You should not jump to unknown branch to “fix” evidence.

**Safe schematic reading:** after checking isolated connection, within `plataforma-pyme/backend`:

```powershell
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check
```

**Complete suite in isolated DB only:** 

```powershell
$env:RUN_DB_INTEGRATION = "1"
try {
  .\.venv\Scripts\python.exe -m pytest -q
} finally {
  Remove-Item Env:\RUN_DB_INTEGRATION -ErrorAction SilentlyContinue
}
```

With Python available and DB isolated, contrast also the specific suites:

```powershell
$env:RUN_DB_INTEGRATION = "1"
try {
  .\.venv\Scripts\python.exe -m pytest -q tests/test_inventory_operation_model.py tests/test_inventory_operation_integration.py
  .\.venv\Scripts\python.exe -m pytest -q tests/test_transfer_api_integration.py tests/test_transfer_concurrency_integration.py
  .\.venv\Scripts\python.exe -m pytest -q tests/test_adjustment_api_integration.py tests/test_adjustment_concurrency_integration.py
  .\.venv\Scripts\python.exe -m pytest -q tests/test_receipt_api_integration.py tests/test_receipt_concurrency_integration.py
} finally {
  Remove-Item Env:\RUN_DB_INTEGRATION -ErrorAction SilentlyContinue
}
```

Register if you run the complete suite or just groups, and do not add historical counts as current tests. GitHub’s IC base serves as previous control: A `816`, B `826` y C `840` in Python 3.12/3.14; new results may vary legitimately if the auditor added tests.

## 3. HTTP Minimum Cases and Domain (create **tenant and new articles**)

| Code | Scenario | Operation | Result to be contrasted |
|---|---|---|---|
| T01 | Not authenticated / token expired/revocated | GET/POST inventario | `401`, no writing |
| T02 | User without company membership / other tenant resource | GET/POST | `404`/rejection expected, no disclosure of data |
| T03 | Employee STORE in both headquarters vs. only one | POST transfer | success or `403` by allocation |
| T04 | CHARGE AFFAIRED vs. WORKER | POST ajuste y STOCK_INICIAL | Maintainer can adjust but not initialize; worker none |
| T05 | Service / INACTIVE Catalog / Headquarters without STORY / Paused Headquarters | POST | Rejection without movement; differentiate `404`/`409`/`403`/`422` according to route |
| T06 | `UNIDAD` in quantity not multiple 1000; boolean; decimal; extra fields | POST transfer/adjustment | `422`; not silent coercion |
| T07 | Zero/negative/higher, empty/normalised motif | POST | `422` or contract code, zero deeds |
| T08 | Purchase, then one-off reception | POST compra / receive / GET | Purchase alone does not credit; reception +10; reading document E2-4 intact |
| T09 | Transfer 4 out of 10 | POST transfer, GET balances/movements | `201`6/4, two movements -4/+4 and single operation |
| T10 | Replay and transfer collision | igual clave+payload; igual clave+otro payload/actor | `200` replay; `409` collision, without doubling |
| T11 | Insufficient origin and full destination | POST transfer | `409` and rollback total; verify leader, quantities and version |
| T12 | Par sin historia, initial 5 | POST adjustment STOCK_INICIAL | `201`, event +5, version 1 |
| T13 | Initial Replay and Duplicate New Initial | POST same key; another key | `200` the same document; `409` duplicate |
| T14 | Balance 0 **with history** | POST STOCK_INICIAL | `409`: do not match new pair |
| T15 | `AJUSTE_ENTRADA` 2 on version 1; `AJUSTE_SALIDA` 1 envelope version 2 | POST adjustments | `201`/`201`, 6 final version 3, +2/-1 |
| T16 | Larger output than balance | POST ADJUST_SALIDE | `409`, no loss or movement |
| T17 | `expected_version` obsolete after adjustment or shipment | POST adjustment | `409`, no delta confirmed |
| T18 | Ajuste sin `StockBalance` y sin initial | POST adjustment | `409`, no se crea balance por bypass de permiso |
| T19 | UUID4 repeated idepotent in different types or with different actor | POST transfer vs. adjustment | `409`, limit of tenant and preserved type |
| T20 | Historical readings GET after subsequent balance sheet changes | GET transfer/adjustment/{id} | Original check stable and uninterpreted as current balance |

**Idempotency key:** generate random UUID4 values **New** only on the auditor's team and keep them temporarily during the case. To try to use exactly the initial key/body; for a different operation use different key. **Never upload real values**, ni pegarlos en chats, issues, logs o capturas.

## 4. Actual concurrence — pre-existing evidence and gaps

**Preexisting tests that should pass without changing your semantics:**
- `test_two_simultaneous_transfers_compete_for_same_ten_units`: two transfers of 7 over origin 10, one `201` and another `409`; never negative source.
- `test_concurrent_replay_same_key_does_not_duplicate_stock`: identical requests 201/200, one operation and two events.
- `test_opposite_direction_transfers_lock_locations_in_stable_order`: A∫B without deadlocks or destruction of quantities.
- `test_two_competing_adjustments_do_not_spend_same_version`: an accepted version, the rival rejected.
- `test_identical_key_concurrent_replay_is_safe`: same operation confirmed once.
- `test_concurrent_initial_stock_accepts_only_one_command`: two initial rivals, one accepted and the other rejected.

**Add/evaluate independently as potential missing test, NOT as proven failure:**
1. **Inbound transfer vs. ADJUST_ENTRADA on the same balance destination:** two clients/meetings/DB connections, time barrier and controlled commit order. If transfer confirms first, adjustment with read version before you must give `409`; if setting confirms first, move uses current balance. Compare leader with projection and number of versions.
2. **Reception vs. STOCK_INICIAL on the same article+ initially empty location:** a maximum of a recognized first balance; the other transaction must behave according to defined rule and serialization; neither duplicates of balance nor unrelated events should be left.
3. **Outgoing transfer vs. ADJUST_SALIDA at the same source:** limited stock; never double consumption, no negative stock, rollback of the rejected operation.
4. **Retry after progress**: Replay 200 although balance/version changed later; check which permissions are still needed and if it returns data outside the current scope.
5. **Membership changes/assignment and session revocation during operation:** verify that locks protect transaction and do not allow write after revocation already effective. Evaluate with barrier designed tests; do not infer from a sequential test.
6. **Partial SQL Errors**: simulate failure between balance and ledger in ephemeral DB, verify full rollback, clean sessions and reusable idempotency key when nothing was confirmed.

For each race register: initial version of each balance, barrier/schedule, HTTP per request, healthy operating IDs, final version, ledger deltas, sum of all locations, number of events and presence/absence of exceptions. **No invented performance timings or unexcended scalability tests.**

## 5. SQL Integrity and Hardening (ephemeral environment)

Verify, without putting at risk real QA:
- FK tenant restrictions; `CHECK` type/direction/value/quantity and semantics `NULL`; UNIQUE idempotente y por evento.
- Attempts to insert an operation with `kind=TRASLADO` and origin=destiny; a discrete fractional unit; event with `operation_kind` incompatible; two equal sides of an operation; movement with double origin; actor of alien tenant.
- Investigate whether DDL/FK/CHECK alone leaves a direct SQL path to link movement with **location or quantity other than your header**. Distinguish integrity in API vs integrity against SQL role with DML.
- Analyze SQL runtime role, migrator role, effective permissions, possible `UPDATE/DELETE` de ledger y eventual trigger/privilegios. **Do not run UPDATE/DELETE on other data.**
- Saturation of `quantity_milli`/`StockBalance`, BIGINT version limit, IntegrityError treatment, SQLSTATE and 500 error absence with sensitive details.

If the review finds a real vulnerability, attach **minimum reproducible case without credentials or user data**, and propose new/test migration before requesting implementation.

## 6. Architectural, maintenance and document checks

- Verify that router only translates contracts/HTTP, service applies permissions and transactional limit, and repository/ORM does not make hidden commit; SQLAlchemy sync real.
- Do not enter REact DEMO data into a backend stream; the frontend remains separate.
- Review current consistency of `entrega-programacion-2/01...05` and UML 03B; historical statements are noted, not deleted to “pass” the audit.
- Verify that parametrized tests cover 401/403/404/409/422 errors and do not hide bugs with `pytest.mark.skip` Undeclared.
- Examine warnings IC (C: 4 with Python3.12, 2 with 3.14) to classify them; do not call them failures without evidence.
- Avoid tests that depend on global order of rows or empty DB; isolate data/tenants and document matching fixes.

## 7. Compulsory registration by case (short template)

| Field | Valor |
|---|---|
| Case code | `T01`, `INV-01`, etc. |
| Commit funcional / documental | EXACT SHA |
| Environment | Python, PostgreSQL, Alembic, Docker |
| Preparation | Tenant and new resources, no secrets |
| Entry | Sanitized parameters and balance version |
| Expected | HTTP code / deltas / number of records |
| Observed | Actual result and log/test reference |
| Approved/failed/not executed | One of the three; never assume success |
| Finding Linked | `REV-E2-5-NNN` o `Ninguno` |

Save evidence within the report/PR or IC artifacts with appropriate access control; never include DB dump or session token.
