# E2-7 T08-5 — Comprehensive QA and REAL inventory closure

Closing date of QA: 10/11/2026. **Committee validated:** `bdeee364cdc3039faacef444c62d363b28c90c18`. Rama `feature/e2-7-t08-inventario-real`. **Status: Comprehensive QA T08-5 APPROVED, pending final PR revision #41; no merit to `main`.** The closure is based on historical manual evidence and isolated CI full-stack; it does not amount to productive deployment.

## Main functional acceptance of T08-4

Evidence: Shared catches in the conversation by the user. It does not represent independent SQL query or browser network inspection.

Effective data: TEST Company A, **Headquarters A TEST** (No Headquarters A TEST 2), **Product T08-4 CONTEO**SKU TEST-T084-001, unit UNITY.

| Ctrl | Evidence observed | Outcome |
|---|---|---|
| Initial stock | Prior confirmation without balance, specified_version=0; STOCK INITIAL voucher +5 and GET verification message | Approved in IU |
| Entry | Confirmation prior balance 5, expected_version=1; voucher ADJUST ENTERED +2 | Approved in IU |
| Final count 6 | Confirmation prior balance 7, specified_version=2; voucher ADJUSTMENT OUTCOME -1 | Approved in IU |
| Ledger | Three Article/Headquarters records: +5, +2, -1 | Visually Approved |
| Final balance | Filter by article and Headquarters A TEST: 6 UNIT, version 3 | Visually Approved |
| Count equals balance | Quantity 6, balance consulted 6/v3, full reason and consent marked; coincidence notice and button disabled | Approved in IU; no HTTP traffic inspected |

The sequence reconciles 5 + 2 - 1 = 6. Do not repeat it to recreate evidence. T08-4 has primary functional acceptance; does not imply integral closure of safety or continuance.

## Automatic evidence and actual scope of the tests

**Primary source and commit:** GitHub Actions: Inventario REAL full-stack, run 42895894227, **SUCCESS** en `bdeee364`. Run with PostgreSQL 16 ephemeral `pyme_t085_ephemeral`, FastAPI in port 18001, Chromium and accounts created for QA. It did not use the local user base.

| Component | Evidencia del run completo |
|---|---|
| Migration | `alembic upgrade head`, `current` y `check`: correct |
| Backend | `python -m pytest -q --junitxml=/tmp/backend-qa.xml`: **879 approved, 0 failed**, con `RUN_DB_INTEGRATION=1` y PostgreSQL real |
| Frontend | `node --test tests/*.test.mjs`: **256 approved, 0 failed**; `npm run build` correct; lint **0 errors and 0 warnings** |
| REAL Browser | **4/4 Playwright aprobadas**: adjustment/transfer with lost response + F5 + replay; old version `409`; pagination 105/106 records, filters and displacement detection |
| DEMO Browser | **6/6 Playwright aprobadas** desktop and mobile; configuration `e2e/playwright.config.ts` con `testDir: ./specs`, separated from `e2e/playwright.real.config.ts` con `testDir: ./real` |
| Otros workflows en mismo commit | Frontend SUCCESS and Backend FastAPI SUCCESS, including Python 3.12 and 3.14 and Docker image check |

PostgreSQL Suites include `test_transfer_api_integration.py`, `test_transfer_concurrency_integration.py`, `test_adjustment_api_integration.py` y `test_adjustment_concurrency_integration.py`: negative authorizations, version, atomity, idempotency and conflicts. REAL browser validation checks end-to-end routes, not just mocks. Workflow disables browser traces to avoid keeping Bearer. Vite notice about chunk JS over 500 kB: **non-blocker**, pending performance optimization outside functional closure T08.

**Previous failures resolved:** en `1a23f6b` Isolated `DB_PORT`/`DB_HOST` en `test_db_settings.py` (before 878/879 due to interference from the IC environment); `bdeee36` explicit accessible labels were added to the selectors of the site and article (previously Playwright did not find the filter and used up time). No real stock rules or data were altered to resolve them.

## Final acceptance matrix

| Case | Procedure/evidence required | Status |
|---|---|---|
| P1 Worker without adjustments | With Miguel as an active LABOUR, open inventory and initial stock and settings; read-only notice, no form enabled | Approved in IU, capture of Miguel |
| P2 Authorization backend | Unauthorized worker, STORE in both locations and rejection without mutation | Approved in PostgreSQL integration suite |
| P3 Administrative roles | Starter/admin; maintainer adjusts with STORE but does not initialize | Approved in PostgreSQL integration suite |
| C1 Outdated version | Command with previous version returns 409; no movement added | Aprobado en PostgreSQL + Playwright REAL |
| C2 Concurrence and Idempotency | Unduplicated Replay, Atomic Transfer and Single Concurrent Initialization | Approved in PostgreSQL suites; replay also tested in REAL browser |
| R1 Recovery | Response 201 lost, F5/relogin, same key/body/version, no automatic POST; replay 200 | Aprobado en Playwright REAL para ajuste y traslado |
| R2 Repeated initialization | UI lock; backend rejects previous balance and history even if the balance is zero | Aprobado en UI manual y suite PostgreSQL |
| A1 Company B | Confirm absence of item, balance and movements T08-4 of A in B | Visually approved: B without balances or movements, general filters |
| A2 DEMO | DEMO data and navigation, without incorporating real TEST data | Visually approved and 6/6 Playwright DEMO (scritorio/mobile) |
| V1 Pagination | 105 movements, seat/article filters, concurrent insertion and soft drink up to 106 without duplicates | Aprobado 1/1 Playwright REAL |

P1 demonstrates interface behavior, does not replace P2. Do not remove actual Michael assignments or send potentially valid transfers to try to get a rejection: verify negative permissions in isolated fixes.

## Methodology, limits and closure decision

1. The human round showed role blocks, isolation between companies, DEMO data and rejection of repeated initialization. **visual**; it is not alleged that you inspected traffic from the local browser or TEST business SQL.
2. The backend suite used PostgreSQL 16 ephemeral for permissions, integrity, transactions and continuance. It is evidence of execution, not just code inspection.
3. Playwright REAL exercised the real API through Vite and Chromium proxy; intentional loss of response occurred **after** server confirmation. It does not forward by itself when reloading; the user must choose the explicit retry of the same identity.
4. Playwright DEMO confirmed separate paths from REAL flows. The tested page cover 105/106 movements and protection against sliding pages; it does not constitute a general test of mass load nor guarantees absence of any future race.
5. The durable attempt journal uses IndexedDB without encryption and does not synchronize between browsers: known risk; do not use shared computers. Large Vite bundle remains as performance debt, without blocking the MVP.

**Decision:** criteria of comprehensive QA T08-5 satisfied for the intended scope. **final revision of PR #41** and their academic preparation; **no se fusiona a `main` no deployment declared in production** as part of this document. Keep the user database and manual data intact.

## Manual round T08-5 completed — 10/11/2026

Captures: Miguel sees the read-only notice and does not receive adjustment form; Company B shows zero balances and zero movements with general filters; DEMO displays own companies and collagen, rinse cream and shampoo items, without visible TEST products. Repeated initialization of Product T08-4 CONTEO at Headquarters A TEST locked with balance 6/v3, quantity 1, complete reason and marked consent. These are visual checks; they do not replace API controls.

## Automatically executed closure — 10/11/2026

- **Conclusive Run:** 42895894227, commit `bdeee364`status **SUCCESS**, all steps from `inventory-real` correct, including REAL browser and DEMO regression.
- **Backend:** 879/879; **frontend:** 256/256, build y lint limpios; **Playwright REAL:** 4/4; **Playwright DEMO:** 6/6.
- **Functional T08-4:** Product T08-4 CONTEO, TEST Company A, Headquarters A TEST, final balance **6 UNITY / version 3**history **+5 +2 −1** visually confirmed by the user. Do not recreate these movements.
- **PR:** #41 should remain open and in draft until human revision, scope update and integration decision to `main`.

**Final result:** **T08-5 approved in QA**The revision of the PR and the merge are later and explicit tasks.
