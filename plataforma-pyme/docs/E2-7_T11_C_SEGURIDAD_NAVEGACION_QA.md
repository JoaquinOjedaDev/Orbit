# E2-7 · T11-C — Multi-company navigation and isolation safety

**Date:** 11/11/2026. **Rama:** `feature/e2-7-t11-qa-integral-hardening`. **PR:** #45 DRAFT, sin merge.

## Objective

Extend the safety test from existing FastAPI contracts to navigation **React REAL** to different users, A/B tenants, late responses and session closing/reloading. All data are PostgreSQL accounts and companies QA ephemeral; never TEST Company A nor DEMO.

## Implementation scenarios

File: `frontend/e2e/real/security-navigation.spec.ts`. Commit funcional `19d7b6eb3948d1c8bb7dd06ffde114a353bfa4f7`.

| Scenario | Operations and assertions | Outcome |
|---|---|---|
| **T11-C-01: A→B with delayed GET** | Create A/B, a different provider per company, log in to B; switch to A, intercept and delay GET from A providers, navigate the same SPA to B and release GET A; require only see supplier B, not A | **PASS**, Playwright real 1,4 s |
| **T11-C-02: external actor + logout/F5** | Create third party owner and user, company and private provider; third party API returns 403/404; open private URL in UI as non-member without supplier or registration form; list your companies without the other person; log out, F5 and login of the owner without session contamination | **PASS**, Playwright real 1,4 s |

**Observed behaviour:** `RealAuthApp` Keeps the opaque token only in memory; provider pages use AbortionController and discarded results after disassembly. Backend remains the authority for membership/permission.

## Evidencia reproducible de GitHub Actions

- Commit funcional: `19d7b6eb3948d1c8bb7dd06ffde114a353bfa4f7`.
- Full-stack REAL #42987791317: **SUCCESS**, **892 pytest, 22 Playwright REAL, 6 Playwright DEMO**. The two T11-C cases passed in Chromium against real API and PostgreSQL disposable.
- Frontend #42987791341: **SUCCESS**.
- 3 warnings Pydantic `UnsupportedFieldAttributeWarning` en suite of attendance: do not block these tests and are still registered as a risk of having.

## Coverage and upcoming T11-C controls

**Already checked in browser:** visual isolation A/B, late response discard, readability of other person's tenant, absence of writing form for non-member actor and deleted session venue after logout/F5.

**Still pending to close full T11-C:** UI scenario of worker/manager **member** no SELL/STORE mapping, plus HTTP 401/403/404/409/422 responses and network failures during navigation/operations on additional screens. Existing backend tests for those permissions do not replace the corresponding React path.

**Opinion:** subbloque **T11-C Multi-company navigation and session ADOPTED**; T11-C global permanece parcial. PR #45 DRAFT; no habilitar POST REAL en bases persistentes ni fusionar `main` without approval.

## Extension T11-C — SELL/STORE permissions and error matrix, validated

**New scenarios:** `frontend/e2e/real/security-errors.spec.ts`.

| Group | Automated evidence | Outcome |
|---|---|---|
| `401` React | GET with 401 causes login back, private data disappears, without POST | PASS |
| `403`, `404`, `503` React | Rejection/Temporary drop of vendor query is reported without false success; update recovers GET without writing | PASS (3 tests) |
| `409` y `422` | Duplicate provider from form produces rejection without second registration; invalid purchase from API receives 422 without creating purchase | PASS |
| WORKER member without assigned seat | Invitation/actual acceptance, direct sale attempt by API: 403; attempt receipt in STORE by API: 403; attempted sale from POS React: permission notice and preserved application, no proof or movement | PASS |

**Functional IC end of block:** commit `aeab8b9df2497aca515683238a4a91689ce75233`, run full-stack #42990216776: **SUCCESS**, `892 passed` Pytest (**4 warnings**), `28 passed` Playwright REAL y `6 passed` Playwright DEMO. The specific worker test `T11-C: trabajador miembro sin sede no puede recibir ni registrar venta desde POS` approved in 1.5 s. The independent frontend commit must be verified at its own checks; do not infer it from this suite.

**QA incident resolved:** the first test of worker in commit `bc0231c` failed by too wide Playwright selector (`getByRole('alert')` found both the pending request warning and the one for sale denied).It was not a permission failure: the API had returned 403 and both notices were present. `aeab8b9` distinguishes the two messages, eliminates unnecessary fixture purchase and the IC confirmed the scenario.

**Opinion T11-C:** **APPROVED** to continue T11-D (responsive, keyboard and DEMO/REAL). The reproducible controls described here are: not an exhaustive coverage of all routes 403/409/422 or all modules is stated. **4 non-blocking warnings of Pytest** research in T11-E; the requirement of PR #45 DRAFT is preserved, without merge or POST in persistent environments.
