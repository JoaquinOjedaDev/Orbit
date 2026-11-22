# E2-5 — Automated Testing, GitHub Actions, Alembic and Windows

**Date of cut:** 09/11/2026. **Repository and SHAs:** ver `00_LEEME.md`. GitHub checks are distinguished from logs provided by the developer. The quantities reflect **la suite completa del backend** in each cut, not the number of exclusive tests for E2-5.

## 1. Final CI by sub-increment — checked in GitHub

| Cut | Merged PR | SHA in `main` | Run over merge | Python 3.12 | Python 3.14 | Docker/liveness |
|---|---|---|---|---:|---:|---|
| **A — Model** | #21 | `4268846abc524ebd827b4da930ef58d8d9789ac7` | 42601062105 | **816 passed**, 1 warning | **816 passed**, 2 warnings | **success** |
| **B — Transfers** | #22 | `4f992b3beb8dda732e4cd752f828b375f240e13d` | 42604071018 | **826 passed** | **826 passed** | **success** |
| **C — Adjustments/initial** | #23 | `748e69319d8d04900c009d5184168a264a9deeac` | 42617212795 | **840 passed**, 4 warnings | **840 passed**, 2 warnings | **success** |

**All those runs are over. `success` with 3/3 successful jobs** (Python 3.12 + PostgreSQL, Python 3.14 + PostgreSQL, construction and livingness Docker). Each suite appears `e25a_inventory_ops (head)` y `No new upgrade operations detected.`. Pytest warnings are not faults; they should be investigated if technical cleaning is prioritized, without misrepresenting the result.

**Important on the figures:** A→B added 10 tests to the suite (816→826); B→C added 14 (826→840). **no** is a line coverage metric or comprehensive security.

## 2. Validation on Windows (source: developer output)

### E2-5 C — full evidence provided at closure

Commands executed within `plataforma-pyme/`, con `main` updated:

```powershell
git switch main
git pull --ff-only origin main
git rev-parse HEAD
cd backend
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check
$env:RUN_DB_INTEGRATION = "1"
try {
    .\.venv\Scripts\python.exe -m pytest -q
} finally {
    Remove-Item Env:\RUN_DB_INTEGRATION -ErrorAction SilentlyContinue
}
cd ..
docker compose --profile api up -d --build --wait api
Invoke-RestMethod http://127.0.0.1:18000/ready
```

**Output observed and provided:**

- `git rev-parse HEAD`: `748e69319d8d04900c009d5184168a264a9deeac`.
- `alembic current`: `e25a_inventory_ops (head)`.
- `alembic check`: `No new upgrade operations detected.`.
- Complete Pytest: **`840 passed in 110.89s (0:01:50)`**.
- Docker: imagen `asistente-pyme-e2-api` reconstructed; DB and API containers in **Healthy**.
- `/ready`: `status=ready`, `database=ok`.
- El `git pull --ff-only` fue fast-forward de `4f992b3` a `748e693`; there was no overlay or reset.

### E2-5 B — local background reported

Development history reported **826 local tests approved** after B, Alembic en `e25a_inventory_ops` and healthy Docker/API. Recorded as **history reported**Not like a second re-run in the C.C. court.The complete C (840) cumshot also went through B's regressions.

### E2-5 A — Documentary limit

IC 816/816 was verified. **There is no local transcription A with exact result in this conversation** To attach. No such record is made: the most recent consolidated Windows closure is that of E2-5 C, which executed the complete suite on the integrated model A.

## 3. What Specific Tests Test

| File family in `plataforma-pyme/backend/tests/` | Representative coverage |
|---|---|
| `test_inventory_operation_model.py` | Metadata ORM, FK, CHECK/UNIQUE, structural restrictions on operations and movements |
| `test_inventory_operation_integration.py` | Real SQL restrictions, tenant, address/signs, structural idempotency, feedback compatibility |
| `test_transfer_api_integration.py` | POST/GET transfer, dual movement, retrying, failure/impaired body rejection, RBAC, tenant, previous receipts |
| `test_transfer_concurrency_integration.py` | Double rival departure from the same balance (201/409), concurrent replay (201/200), offset transfers without loss |
| `test_adjustment_api_integration.py` | Single initial, input/output, previous zero balance, replay/collision, obsolete version, roles, tenant, interoperability with transfer |
| `test_adjustment_concurrency_integration.py` | Two outputs on the same version (201/409), same parallel order (201/200), rival initializations (201/409) |
| `test_receipt_api_integration.py` y `test_receipt_concurrency_integration.py` | Regression E2-4: full reception, retrying, ledger per reception, runs on balance initially absent |

**Evidence of attendance:** B/C suites use separate HTTP requests and real PostgreSQL connections, with time-specific test data. They are not an audit of scalability, resilience, distributed transactions or infrastructure failures. Avoid declaring benchmarks that were not made.

## 4. Incident of IC during E2-5 C development

A first run of 840 trials failed **in two new assertions** that they expected `[]` while the helper `view_balances(...)` returned `{}` Other scenarios, including the three contesting scenarios, were already going by. **without altering the stock logic for that incident**This background shows a test correction, not a proven production bug. The run code 42616213215 was green before the final documentation; the run de merge 42617212795 is also green.

## 5. Explicit limitations

- No percentage of coverage published `coverage.py`: **840/840 is quantity, not 100 % coverage**.
- Local tests can still be run against the development base according to configuration: failure-closed separation of DB from tests (inherited risk E2-4) is missing. No global cleaning was done to obtain green.
- The fact that IC works well does not test all production permits/configurations or eliminate the need for independent auditing.
- Windows output is **evidence provided**Not a remote access to that machine made for this package.

## Note to this documentary update (v1.1)

Reading external observations and incorporating this package into a Git branch **do not constitute proof of code execution or change the above results**. Swagger’s 816/826/840 and QA suites are attributed exactly to their original courts. To assess the new risks of contingencies (especially adjustment against transfer to the same destination), reversal, SQL permits and reservations must be designed and run a specific suite in the future; it is not claimed here to have executed it.
