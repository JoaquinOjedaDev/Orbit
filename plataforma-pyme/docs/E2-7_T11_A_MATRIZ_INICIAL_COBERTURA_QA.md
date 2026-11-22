# E2-7 · T11-A — Initial cross-sectional matrix (partial cut)

**Date:** 11/11/2026. **Base:** `main` `bc91c1ee`; **rama:** `feature/e2-7-t11-qa-integral-hardening`; **PR:** #45 DRAFT.

## Methodology and limit

This matrix compares the **26 scenarios E27-*** required by `E2-7_QA_CRITERIOS_ACEPTACION_Y_RIESGOS.md` against evidence of which the content was inspected directly in this court: `frontend/e2e/real/pos-draft.spec.ts`, `inventory.spec.ts`, `sales.spec.ts`, `backend/tests/test_sales_api_integration.py` y `test_sales_price_policy_integration.py`The workflow full-stack is also considered the IC evidence of the T10-F act. **Not an exhaustive enumeration of all test files**: still to be inventoryed the authentication e2e, companies, catalog, suppliers and purchases. Do not confuse absence of evidence consulted with definitive absence of tests.

**Legend:** COVER = identified direct evidence of complete behavior; PARTIAL = there is evidence of a part but not of the entire cross-sectional scenario; VERIFY = insufficient evidence has been located or inspected in this cut.

| Scenario | Initial State | Evidence or specific gap |
|---|---|---|
| E27-AUTH-01 registro/login/GET me | TO BE VERIFIED | Fixtures POS are recorded and authenticated, but no screen test + GET /me was verified |
| E27-AUTH-02 logout/protection | TO BE VERIFIED | Revisar tests e2e auth |
| E27-AUTH-03 F5/reautification | PARTIAL | `sales.spec.ts` y `pos-draft.spec.ts` F5/re-login; no DEMO contamination is validated |
| E27-TEN-01 selector A/B | TO BE VERIFIED | Review e2e company tests and flow IU |
| E27-TEN-02 late response A→B | TO BE VERIFIED | High risk; specific network test |
| E27-TEN-03 URL company other | PARTIAL | Backend sales checks tenant isolation; navigation view is missing |
| E27-PERM-01 SELL/STORE no allocation | PARTIAL | `test_sales_price_policy_integration.py` 403 test without assignment; comprehensive IU missing |
| E27-LOC-01 sede pausar/reactivar y F5 | TO BE VERIFIED | Reviewing evidence of operations/headquarters |
| E27-CAT-01 good+service/inactivation | PARTIAL | POS E2E creates both types, but does not verify persistent inactivation |
| E27-SUP-01 CRUD supplier | TO BE VERIFIED | Review e2e suppliers |
| E27-PUR-01 mixed purchase without stock | TO BE VERIFIED | There is no buying scenario in the list of **19 Playwright REAL** certificate; separate backend/frontend coverage must be verified |
| E27-REC-01 receive purchase with stock | TO BE VERIFIED | None of the **19 cases Real browser** final workflow T10 test purchase→reception→sald; inventory backend and unit frontend tests before creating the crossover |
| E27-REC-02 Replay reception | TO BE VERIFIED | Check e2e reception and API idempotente |
| E27-INV-01 saldo/version/ledger | COVER | `inventory.spec.ts` checks balances, history and versions; `pos-draft.spec.ts` check balance and post-sales leader |
| E27-INV-02 transfer between headquarters | PARTIAL | `inventory.spec.ts`: transfer, balances in origin/destiny and replay without duplicates; extend explicit assertion of the two movements of opposite signs and net zero in a single scenario |
| E27-INV-03 Fit with valid version | COVER | `inventory.spec.ts` operates settings with `expected_version` and final balance |
| E27-INV-04 obsolete version/409 | COVER | `inventory.spec.ts` valid 409 without movement/automatic re-entry |
| E27-SAL-01 physical and debit sales | COVER | `pos-draft.spec.ts` test 5→3, a SALE_SALIDA movement and proof |
| E27-SAL-02 mixed well+service+2 payments | PARTIAL | `pos-draft.spec.ts` test two separate payments/discount and physical sale; backend `test_sales_api_integration.py` physical test + service; missing **combination in the same browser flow** |
| E27-SAL-03 lost response and replay 200 | COVER | `sales-recovery.spec.ts`: physical cases and service, 201 lost after COMMIT, F5, GET, HTTP replay 200, same key/body, no duplicate movement; plus `pos-draft.spec.ts` covers GET 404 and manual forwarding |
| E27-SAL-04 insufficiency/409 | COVER | `pos-draft.spec.ts` checks 409, F5, GET 404, zero sales; `test_sales_api_integration.py` prueba rollback de ledger y saldo |
| E27-SAL-05 price/discount and inconsistent payments | PARTIAL | `sales-real-checkout.test.mjs` y `test_sales_price_policy_integration.py` refuse amounts/permits; verify error displayed by browser |
| E27-PRES-01 F5 post purchase/sale | PARTIAL | `sales.spec.ts`, `sales-read.spec.ts` y `sales-recovery.spec.ts` check history/recovery after F5; same route is missing from purchase and receipt |
| E27-MODE-01 DEMO/REAL insulation | TO BE VERIFIED | The workflow runs separate DEMO and REAL suites; it does not amount to testing change between both modes |
| E27-MODE-02 QR/box/DEMO accounts without REAL spells | TO BE VERIFIED | Requires navigation and effect checking |
| E27-RESP-01 desktop/mobile/real keyboard | PARTIAL | `sales-read.spec.ts` includes realistic 390×844 and F5 viewport; Playwright REAL project uses Desktop Chrome and still lacks mobile matrix/comprehensive module keyboard; DEMO does have separate suite |

## Work priority T11

**P0 (first):** continuous scenario **bien physic + service → purchase/reception → stock → mixed sale with two payments → voucher + leadger + F5** on **a single company PostgreSQL ephemera**You must use existing contracts, without enabling sales in the local user environment.

**P1:** Tenant A/B attendance/isolation, late response when changing company, other people's URL navigation and unallocated worker permissions.

**P2:** Real mobile route and keyboard; non-contaminated DEMO∫REAL changes, QR/box actions/accounts that do not generate REAL scripts.

## Next action

Complete the inventory of relevant e2e files and backend tests before declaring definitive coverage, convert this table into traceable matrix with exact path and test name, and add only missing scenarios. Keep PR #45 DRAFT and require CI in the same commit for each change. **The initial matrix does not approve the T11-D door.**

## 4. T11-A — Reproducible Contrast of the REAL browser suite

**Direct source of execution:** GitHub Actions full-stack T10 latest documentary commit, run 42982898458, job `inventory-real` **SUCCESS**, Pytest log **892 passed (2 warnings)**, Playwright **19 passed** REAL and **6 passed** DEMO. Run belongs to T10 before starting T11; **no** states QA T11 still approved.

The list of tests performed by Playwright REAL consists of five files, without authentication suites, multi-company browsing, suppliers, purchases or reception:

| REAL Browser File | Real Run Cases | Remarkable coverage |
|---|---:|---|
| `e2e/real/inventory.spec.ts` | 4 | Setup and move with response/replay loss, 409 version, paged history |
| `e2e/real/pos-draft.spec.ts` | 8 | cart, 501 tokens, service, two payments, physical sale, stock 409, POST lost before API and 201 lost after COMMIT |
| `e2e/real/sales-read.spec.ts` | 3 | history/filter/comprobant and by-request, F5 in mobile viewport, 503 and retry of GET |
| `e2e/real/sales-recovery.spec.ts` | 3 | 201 lost response and replay 200 for good/service, GET 404 unsending request, no duplicates |
| `e2e/real/sales.spec.ts` | 1 | history, ID proof, recovery after F5 and only GET |
| **Total** | **19** | **Strongly covers inventory and sales; not the full chaining of other modules** |

**Adjustments to the initial matrix:**

- `E27-SAL-03` reclassifieda **COVER**: `sales-recovery.spec.ts` Runs the real 200 replay that was missing to identify (includes 201 lost, F5 and comparison of balances/ledger without duplicates). Do not create an identical third test in T11.
- `E27-RESP-01` Go on. **PARTIAL**: There is already a REAL case in width 390 px; there is no mobile/keyboard matrix for all modules.
- `E27-INV-02` left **PARTIAL in its strict discretion** two movements of opposite signs: the visible suite checks balance and retry, but there is no explicit assertion of the pair of movements in the same route.
- Registration/login are widely used as *fixtures* of other tests, but **does not amount to dedicated testing** user without company, change of tenant and routes from others.
- Los **892 Pytest** confirm a green backend regression, do not imply by themselves that all 26 interface scenarios are covered. Your cases should be plotted by name in a second documentary pass.

## 5. Decision T11-A to start T11-B

**Cross-sectional gap confirmed by execution:** none of the 19 E2E REAL joins *creation of purchase → receipt → balance → mixed sale* within the same company QA. That will be the **first scenario T11-B**, reusing DTO and routes that effectively exist in FastAPI, without adding imaginary endpoints or performing POST on persistent bases.

**Before writing that test:** inspect real source of purchase/reception and your contract, QA helpers/fixtures and IC scripts, and list existing backend tests to avoid replicating them. Then add a comprehensive E2E with saves `PYME_DISPOSABLE_QA=1`, API fixes the ephemeral PostgreSQL and balance/version/movement tracking. Keep PR #45 DRAFT, no merit; `main` and TEST Company A remain intact.

**State of T11-A:** evidence of inventoryed REAL suite and reclassified matrix; the nominative inventory of all vendor backend/front end tests and purchases is still **outstanding**, so this matrix should not be presented as exhaustive coverage of the entire repository.

## 6. T11-A — Additional backend coverage verified by test name

The test files integrated with PostgreSQL were opened and the existing test functions were verified. The tests of the following files have saved `RUN_DB_INTEGRATION=1` and are part of the Pytest regression, but **not test for themselves the React navigation of a full user flow**.

| Existing Component and Archive | Evidence verified in code | Criteria that you best support |
|---|---|---|
| `backend/tests/test_location_api_integration.py` | `test_pause_primary_releases_primary_and_resume_does_not_restore_it`, `test_member_of_two_companies_does_not_mix_records`, permissions, cross-tenant headquarters | LOC-01, TEN-01/03, PERM-01 **a nivel API** |
| `backend/tests/test_catalog_api_integration.py` | `test_deactivate_reactivate_and_idempotent_status_does_not_delete`, `test_create_list_get_edit_persisted_and_no_stock_created`, pagination and tenant | CAT-01 **a nivel API** |
| `backend/tests/test_supplier_api_integration.py` | `test_create_get_list_update_full_contact_and_no_inventory`, rollback, accesos y cross-tenant | SUP-01 **a nivel API** |
| `backend/tests/test_purchase_api_integration.py` | `test_mixed_purchase_and_snapshots_survive_catalog_supplier_edits`, `test_retries_return_same_purchase_and_reused_key_with_new_data_conflicts`, rollback y aislamiento | PUR-01 y parte de PRES-01 **a nivel API** |
| `backend/tests/test_receipt_api_integration.py` | `test_receive_first_stock_atomic_and_replay_exact`, `test_balance_after_snapshot_on_replay_does_not_follow_later_entries`, `test_assigned_employee_can_store_and_unassigned_employee_cannot` | REC-01/02, INV-01 and PERM-01 **a nivel API** |
| `backend/tests/test_sales_api_integration.py` y `test_sales_price_policy_integration.py` | mixed sale, ledger, rollback by stock insufficient and four-part P01 policies | SAL-01/02/04/05 and PERM-01 **a nivel API** |

**Diagnosis correction:** suppliers, purchases and reception **sí** have FastAPI/PostgreSQL integration regression identifiable; what is not covered by the 19 REAL tests of the browser is an execution **continuous use of these modules from the IU**. Therefore, there is no need to rebuild backend or invent contracts in T11-B: existing flows must be linked into a cross-sectional E2E and the status of the base verified.

**Earrings to complete fullness T11-A:** Nominative inventory of the remaining authentication/equipment backend files, and unitary frontend vendor/purchase/reception tests. This limitation does not block preparation of the first T11-B scenario, but it does prevent all repository tests from being audited.
