# Premerge audit — E2-7 T08 (Real Inventory)

**Date:** 10/11/2026 · **Repository:** `JoaquinOjedaDev/Orbit` · **Rama:** `feature/e2-7-t08-inventario-real` · **PR:** #41 (**DRAFT, sin merge**).

**Functional base with green integral IC:** `3e4daffe4df7e90c8f4e7a7bf0da5954ce09327f`. The correction of subsequent documentation does not change the implementing code: `86d146e` (Acta T08-4) and `dd41b94` (acta T08-3). This audit is a **revision of code, contracts and public evidence**; does not involve local execution of Windows/Docker or independent access to catches hosted in chat history.

## 1. Technical scope of the review

- Comparison of `main` with the branch: before this act, **72 commit ahead, none behind and 27 different files changed**. No Merge conflict reported by GitHub. Executable changes correspond mainly to the frontend and its tests; **No change in E2-5 inventory backend services**There are also two workflow files in the root. `.github/workflows/`.
- Checks of reading, transfer and adjustment gateways and parasers were carried out; `RealInventoryPage`, `RealTransferPanel`, `RealAdjustmentPanel`, journal IndexedDB; real navigation cabling, CSS and test files; workflows; routers/services and existing backend tests of transfers, adjustments, permissions, competition and purchases/sales; model `StockBalance`.
- Static revision **does not show total absence of defects** nor replaces a real test on unrepresented devices.

## 2. Automatic reproducible verification

**Run integral GitHub Actions #42896686337 — SUCCESS — SHA `3e4daff`.**

| Ctrl | Evidence | Outcome |
|---|---|---|
| Scheme and migration | Alembic `upgrade head`, `current` y `check`, PostgreSQL ephemeral | APPROVED |
| Backend completo | `python -m pytest -q` con `RUN_DB_INTEGRATION=1` | **879/879 ADOPTED** |
| Frontend | Node tests, build TypeScript/Vite y Oxlint | **256/256 APPROVED**, build, lint sin errores |
| Browser REAL | 2 adjustment/transfer replays after loss of response and F5; 409 without retry; pagination 105→106 and filter | **4/4 APPROVED** |
| Browser DEMO | Playwright desktop and mobile, independent navigation | **6/6 ADOPTED** |
| Backend en CI independiente | Python 3.12 and 3.14, Docker construction, livingness | APPROVED |

REAL tests use time base `pyme_t085_ephemeral`, API `127.0.0.1:18001`, ephemeral actor and enterprise; **do not directly use or validate the data of the local user installation**. El `test` Pageing covers movement by concurrent changes in a limited dataset, not massive load benchmark. PostgreSQL tests should not be run against the manual basis.

Specific verifications observed in backend tests:
- `test_adjustment_api_integration.py::test_permissions_employee_and_manager_location_assignment`: worker 403, authorized for adjustment and 403 for initial stock, holder 201.
- `test_transfer_api_integration.py::test_employee_requires_store_assignment_at_both_locations`: employee without assignment and with a single allocation 403; with STORE in both headquarters 201.
- `test_adjustment_concurrency_integration.py`: competitive version [201,409], replay of the same key [200,201], single initialisation [201,409].
- `test_transfer_concurrency_integration.py`: insufficient concurrent stock [201,409], same idempotent request [200,201] and operations in opposite directions without inconsistency.

## 3. Manual evidence verified in documents

| Stage | Exercises effectively performed on the REAL frontend | Documentary source | Status |
|---|---|---|---|
| **T08-1** | TEST Company A / Headquarters A TEST / Product A TEST: **11 UNITY v3**, ledger receptions **+2,+4,+5**; Headquarters A TEST 2 without balances or movements; B without data from A; Miguel reader; DEMO independent | [Act T08-1](E2-7_T08_1_INVENTARIO_REAL_LECTURA_Y_QA.md) | Main functional acceptance documented |
| **T08-2** | **6 manual tests**: summary 3 inputs/0 outputs, inputs/outputs, search without matches, real traceability, return to stock 11/v3; positive search reported | [Act T08-2](E2-7_T08_2_HISTORIAL_TRAZABILIDAD_Y_QA.md) | Manual acceptance 6/6 documented; not claimed to have literally executed each variant of the initial plan |
| **T08-3** | Actual transfer **3** (11→8 origin, 0→3 destination), second different transfer **1** (final 7 origin, 4 destination); signed movements; same operation ID `efeff7f6-5f82-475b-b29b-bf0b53d778e6` of the transfer of 3; maintenance 7+4=11; B without A balances | [Act T08-3](E2-7_T08_3_PLAN_TRANSFERENCIAS_REAL.md) | Main circuit manual accepted |
| **T08-4** | Product T08-4 CONTEO, SKU `TEST-T084-001`, **Headquarters A TEST**, initial +5/v1, input +2/v2, final count 6 with output −1/v3, history +5+2−1, delta-free count disables button, repeated initialization locked | [Minutes T08-4 updated](E2-7_T08_4_STOCK_INICIAL_AJUSTES_VERSIONADOS_QA.md), [T08-5](E2-7_T08_5_QA_INTEGRAL_Y_CIERRE.md) | Accepted in UI, without separate manual SQL query |
| **T08-5** | Miguel without adjustment form; company B without A movements/balances; DEMO with own items; repeated initial stock rejection | [Act T08-5](E2-7_T08_5_QA_INTEGRAL_Y_CIERRE.md) | Partial Manual + Approved Automated Adverse Tests |

**Compulsory distinction:** There is insufficient evidence to claim that they were executed **manually** the 403 transfer with incomplete STORE assignment, all invalid form input options or disconnect/F5 from a POST on the local computer. **They are covered in automatic tests with PostgreSQL/Chromium disposable.** The original plan proposes scenarios, but a proposal is not evidence of execution.

**Catches:** Markdowns describe shared captures in the chat; a tour of the repository tree did not find QA T08 capture files attached to the project (only a graphical resource `hero.png`). **Do not present any images or invent results.** Selected and Sanitized Catches should be archived if the teacher/partner requires independent proof.

## 4. Findings and treatment

| ID | Importance | Finding / evidence | Recommended action or taken |
|---|---|---|---|
| DOC-01 | **Media, corrected** | The T08-4 report stated at the beginning and closing that manual QA was missing, despite the approval recorded in T08-5 | **Corrected in `86d146e`**, with royal record of 5→7→6 and distinction IU/PostgreSQL |
| DOC-02 | **Media, corrected** | The historical section of T08-3 retained missing permits and DEMO without clearly relating them to subsequent validation | **Corrected in `dd41b94`**: new reconciliation section, without attributing automatic scenarios to manual testing |
| QA-01 | **Median, scope of evidence** | The 403 of Miguel's transfer was not executed manually without full STORY, nor the entire adverse matrix of the form | Exact cases **PostgreSQL/Node suite approved**; do not reproduce POST on installations with uncertain permissions; only negative manual QA in new isolated environment if it is required as a requirement |
| EVID-01 | **Academic average** | Results written in minutes, but manual catches not archived in the repo | Attach sanitized catches or verifiable external index if autonomous auditability is required; without tokens/Bearer, passwords or sensitive data |
| GOV-01 | **Media, decision of the responsible person** | Two workflows files under `.github/workflows/` are out of the exclusive folder `plataforma-pyme/` | They are necessary for IC. **location exception** before merge, according to T00 guidelines; do not reverse them without alternative |
| UX-01 | Low, not blocking | Confirm transfer button can be enabled even with invalid reason/quantity; `create()` rejected by `transferReason`/`transferMilli` and does not send POST. Adjustment checks full reason when confirming | Mejorar feedback y `disabled` prevention in a subsequent improvement, maintaining strict logic in backend |
| PAG-01 | Low, known risk | Pageing for `offset/limit` is not a stable snapshot under contingencies; frontend detects duplicates and requires updating | Documented; evaluating keyset/snapshot cursor in evolution T11, not promising global completeness by local filter |
| SEC-01 | Low/medium, recognised risk | Journals de idempotencia en IndexedDB **unencrypted**, scoped by actor+company, not shared between browsers | UI warns against sharing; there are no tokens or passwords in records. Consider shared equipment/caducity policies and cleaning UX |
| E2E-01 | Low, future enlargement | Playwright REAL automated uses Chromium desktop; DEMO does test desktop and mobile | Add mobile REAL smoke without T11 mutations or earlier if responsive acceptance is required |
| CI-01 | Low maintenance | The new workflow can run both by `push` as per `pull_request`; installation E2E without lockfile at that step | Consider `concurrency` and reproducible dependencies after closure |
| PERF-01 | Low, not blocking | Vite warning chunk greater than 500 kB after minification | Future optimization by code splitting, without altering validated flow |

**No critical reproducible failure of tenant isolation, negative balance, loss of atomity, duplicate replay or role bypass was identified in the inspected code and approved suites.** This does not mean that the software is infallible: the review is limited by the scope of the tests and because it has not run a second independent infrastructure.

## 5. Steps prior to merge authorization

1. Confirm that the last documentary commit is still with green CI; the validated functional code already passed in SHA `3e4daff`.
2. Check that the T08-3, T08-4 and T08-5 records show states **consistent**keeping track of partial rounds.
3. If required to complete **each manual scenario originally written**, perform the missing validation of 403 permissions and invalid entries only in isolated environment. **Do not modify roles, test 403 using POST on an account with uncertain permissions or generate another transfer on Product A TEST.** As a substitute for security, there are already automatic suites.
4. For additional manual non-mutant evidence, the exact event filter can be checked on frontend `Recepción de compra` y `Salida por venta`, plus a REAL read-only smoke in mobile viewport. Capture result and note that there was no POST.
5. Obtain explicit acceptance from the person responsible for the exception `.github/workflows/` and known risks; update PR #41, without dialling it ready or automatically merging it.
6. **Only after final user compliance** choose Merge strategy and prepare T09 in a new branch. `main` intact until that moment.

**Opinion:** **functionally suitable for final human review**, with findings of documentation and evidence clarified. **Not yet authorized to merge**No new critical functional bugs confirmed in this audit were detected; risks and opportunities for improvement are explicit to decide on scope.
