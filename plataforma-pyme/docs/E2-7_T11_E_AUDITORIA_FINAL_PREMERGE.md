# E2-7 · T11 — Final integration audit and PRE-MERGE door

**Technical closure date:** 11/11/2026 · **Rama:** `feature/e2-7-t11-qa-integral-hardening` · **PR:** #45, **DRAFT**, sin merge.  
**Final regression code commit approved:** `6aecd80e52a0712f7d1088dde8347de7f7a7c186`.  
**This document replaces the preliminary NO-GO opinion issued before T11-F.** The exclusive documentary commission that updates this report requires reviewing its own checks before the merge.

## 1. Opinion

**Technical GO with EXPLANATORY LIMITATIONS to integrate functional stage E2-7/T11 to `main`, subject to human review and express authorization from the repository manager.** It does not imply authorization to execute the merge, enable local sales or declare academic documentation completed.

The report is based on:
- **26 of 26 functional criteria E27 with direct evidence of the required nucleus** mediante Playwright + FastAPI/PostgreSQL descartable, pruebas de backend y, donde corresponde, retest manual.
- **Three green workflows in the same code commit `6aecd80`**: frontend, backend y full-stack.
- **The two manual faults of the SELL/STORE headquarters corrected and retested**.
- GitHub compared PR with `main`: **63 commits forward, 0 back, 30 files changed, `mergeable=true`** in the court before this documentary update. No conflicts were detected.
- The E27-RESP-01 criterion is accredited in your **alcance de smoke test** (desktop 1440 px, mobile 390 px, keyboard, navigation and eight main routes); **no** represents a comprehensive WCAG evaluation and visual redesign approval.

The previous opinion of 17 direct/8 partial/1 missing was correct **for your cut-off date**, but it became obsolete after the T11-F suites. This is the current matrix.

## 2. Stages and verifiable evidence

| Stage | Evidence | Outcome |
|---|---|---|
| Backend y datos | Full-stack #43014577888, Pytest with ephemeral PostgreSQL and `RUN_DB_INTEGRATION=1` | **892 Pytest PASS**, 2 warnings Pydantic |
| Insulated backend | Backend #43014577849 | **SUCCESS**, Python 3.12/3.14 and FastAPI image |
| Independent Frontend | Frontend #43014577698 | **SUCCESS**, build, lint y pruebas unitarias/browser del workflow |
| Navegador REAL full-stack | Full-stack #43014577888 | **38 Playwright PASS**, FastAPI/Vite/PostgreSQL QA |
| DEMO Browser | Mismo full-stack | **6 Playwright PASS**, independent local state |
| Manual REAL | [Act T11-D2 of 39 steps](E2-7_T11_D2_ACTA_PRUEBA_MANUAL_REAL.md) + [retest SELL/STORE](E2-7_T11_E_FIX_SEDES_ASIGNADAS_QA.md) | Approved in cases covered; two defects corrected and verified |
| Integration verification | Comparison of PR #45 `main`→rama | 63 ahead / 0 behind, mergeable=true, sin reviews registradas |

**You keep critical:** browser tests that do POST use `PYME_DISPOSABLE_QA=1`API CI `127.0.0.1:18001`, unique users and QA companies. Local sales on TEST Company A were not enabled. The PR was retained as draft.

## 3. Current matrix of the 26 mandatory scenarios

**DIRECT** means that the stage core is checked in REAL + API/DB ephemeral browser (or, when the scenario is DEMO, in the DEMO IU monitoring REAL scripts). The existence of tests does not amount to universal coverage of all states and devices.

| Scenario | Status | Main test |
|---|---|---|
| E27-AUTH-01 registro/login/GET me | DIRECT | `auth-registration-ui.spec.ts` |
| E27-AUTH-02 logout and protection | DIRECT | `security-navigation.spec.ts` |
| E27-AUTH-03 F5 and re-authentication | DIRECT | `responsive-keyboard.spec.ts`, `sales-recovery.spec.ts` |
| E27-TEN-01 A/B companies | DIRECT | `security-navigation.spec.ts` |
| E27-TEN-02 late response A→B | DIRECT | `security-navigation.spec.ts` |
| E27-TEN-03 Other company URL | DIRECT | `security-navigation.spec.ts` |
| E27-PERM-01 SELL/STORE no allocation | DIRECT | `assigned-location-visibility.spec.ts`, `security-errors.spec.ts` |
| E27-LOC-01 active/pausada/reactivated headquarters + F5 | DIRECT | `business-crud-persistence.spec.ts` |
| E27-CAT-01 good/service/inactivation + F5 | DIRECT | `business-crud-persistence.spec.ts` |
| E27-SUP-01 CRUD supplier and persistence | DIRECT | `business-crud-persistence.spec.ts` |
| E27-PUR-01 well + free concept without stock before receiving | DIRECT | `purchase-ui-persistence.spec.ts` |
| E27-REC-01 reception and movement only for physical good | DIRECT | `purchase-ui-persistence.spec.ts`, `flow-purchase-to-sale.spec.ts` |
| E27-REC-02 Idepotent reception | DIRECT | `flow-purchase-to-sale.spec.ts` |
| E27-INV-01 balances/versions/ledger | DIRECT | `inventory.spec.ts` |
| E27-INV-02 transfer with −1/+1 and net zero | DIRECT | `inventory.spec.ts` (pair, same operation and replay) |
| E27-INV-03 Fit with valid version | DIRECT | `inventory.spec.ts` |
| E27-INV-04 obsolete version 409 | DIRECT | `inventory.spec.ts` |
| E27-SAL-01 physical sale and stock exit | DIRECT | `pos-draft.spec.ts` |
| E27-SAL-02 mixed sale + split payments | DIRECT | `flow-purchase-to-sale.spec.ts` |
| E27-SAL-03 lost 201 power → GET/replay 200 | DIRECT | `sales-recovery.spec.ts` |
| E27-SAL-04 stock insufficient 409 | DIRECT | `pos-draft.spec.ts` |
| E27-SAL-05 price/discount with inconsistent payments | DIRECT | `sales-invalid-payment-policy.spec.ts` (rejection IU and API 422); `responsive-keyboard.spec.ts` |
| E27-PRES-01 F5 persistent purchase/sale | DIRECT | `purchase-ui-persistence.spec.ts`, `flow-purchase-to-sale.spec.ts` |
| E27-MODE-01 DEMO∫REAL isolated | DIRECT | `responsive-keyboard.spec.ts` |
| E27-MODE-02 QR/box/DEMO accounts do not write REAL | DIRECT | `demo-money-isolation.spec.ts` |
| E27-RESP-01 mobile, desktop, keyboard, navigation | DIRECTO (smoke) | `responsive-keyboard.spec.ts`, `mobile-core-navigation.spec.ts` |

**Balance:** **26/26 E27 criteria tested in their defined acceptance scope.** Formally responsive/accessibility beyond that smoke, behaviour on real devices and complete WCAG are still pending a later UX stage. Do not classify it as comprehensive accessibility assessment.

## 4. Audit of the scope of PR (not breaking compatibility)

In the comparison of pre-commit document code, **30 files** en `plataforma-pyme/`; functional changes in production are minimal:
- `backend/app/modules/locations/assignment_service.py`, `router.py`: consultation of active own locations, limited by session and company.
- `frontend/src/features/businesses/realOperationsGateway.ts`: customer of own assignments.
- `frontend/src/features/sales/RealPosPage.tsx`: SELL selector filtered by authorized headquarters.
- `frontend/src/features/inventory/RealInventoryPage.tsx`, `RealTransferPanel.tsx`: origin/destination STORY limited to employee allowances.
- Four screens with corrections **text only** (suppliers, purchases, company and checkout).
- The rest: E2E tests and QA documents. **No new Alembic migrations, tables or modifications of production data.**

Compatibility checks: backend validates again permissions for each POST; the UI filter **no** grants authorization; management roles retain selection of locations. Purchase does not move stock without reception; service does not generate physical movement; idempotence avoids duplication. DEMO mode maintains local status separately and no DEMO action from QR/box/accounts writes sales, purchases or REAL inventory.

## 5. Manual review and limits of evidence

Followed **39 steps** about owner and worker accounts, with captures in the conversation (not attached as images versioned). Businesses/equipment, catalog, suppliers, purchases, receptions, inventory and POS (price, discounts, payments, F5, draft and logout) were visited. The list of balances observed was **7, 4 y 6**; it was visually verified that it did not change after cancelling a transfer. No persistent user SQL was verified.

Findings **T11-D2-01** (POS offered unallocated headquarters) and **T11-D2-02** (transfers offered unallocated headquarters) were corrected and revalidated in local browser and suite. **Yes, there was a real administrative revocation.** the assignment of Miguel at Headquarters A TEST 2 by the user; **no** sales, purchases, receptions or movements of stock manual were confirmed during this tour. The general reading policy of inventory between the same tenant headquarters is intentionally maintained for the MVP.

## 6. Residual risks and explicit decisions

| Risk or limit | Severity for integration E2-7 | Treatment |
|---|---|---|
| **Pydantic `UnsupportedFieldAttributeWarning`**, `Field(alias=...)` | Low/non-blocking | Full-stack of the final commit code reported **2 warnings** (a.k.a. `supplier_id` y `command`) with 892 PASS; varied between runs. No single reproducible source was identified; avoid speculative validation changes when closing the branch |
| **IndexedDB** with local commercial payload not encrypted in recovery flows | Means/Informed acceptance | No tokens saved; interface warns against shared devices; architecture and encryption are left for later hardening |
| **REAL Sales** disabled by default locally | Intentional | `VITE_PYME_ENABLE_REAL_SALES` only in disposable CI or other explicitly authorized environments. Do not activate in TEST Company A without decision |
| **Payments/QR DEMO** are not bank accreditation or real payment market | Intentional | REAL payments are *declared*, not verified by third parties; QR/box/DEMO accounts do not amount to productive financial integrations |
| UX, complete WCAG, screen readers, physical mobile compatibility | Out of reach for E27 smoke, product debt | Try after stabilising MVP; not to declare it certified |
| Academic documentation T12 (UML, RF/CU/API/IU, documents 01–05) | Different door | Update after integration, do not confuse frontend/backend QA with final academic delivery |

No test failures, duplication of operations or cross-tenant filtration were detected **in the tested scenarios**. No universal absence of bugs is claimed.

## 7. Checklist and authorization for main

- [x] Purchase/reception/stock/sale integrity under disposable PostgreSQL.
- [x] Registration tests, session, multi-tenant, permissions, HTTP 401/403/404/409/422/503, power.
- [x] 26 scenarios of the E27 matrix covered in its functional scope.
- [x] Two manually detected interface defects corrected and re-verified in IC + local browser.
- [x] 892 Pytest + 38 Playwright REAL + 6 DEMO PASS en mismo commit funcional; frontend/backend independientes SUCCESS.
- [x] No divergence or conflict GitHub with `main` cutting; changes limited to `plataforma-pyme/`.
- [x] The residual risks are explicit, without disguise DEMO of REAL banking integration.
- [ ] **Confirm three final HEAD ICs after updating this document.**
- [ ] **Explicit review and acceptance of the responsible person**including residual risks.
- [ ] Solo entonces pasar PR #45 de DRAFT a READY y, con permiso expreso, fusionar a `main`.
- [ ] T12 academic is planned after technical merit, separately.

**Opinion:** `APTO TÉCNICAMENTE PARA MAIN (E2-7/T11)`, with described limitations; pending checks of the documentary commit and human consent. **Not merged.**
