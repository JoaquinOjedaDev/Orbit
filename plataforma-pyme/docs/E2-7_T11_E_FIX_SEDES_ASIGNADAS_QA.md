# T11-E · Correction of authorized headquarters in POS and transfers

**Date:** 11/11/2026 · **PR:** #45 (DRAFT; sin merge). **Rama:** `feature/e2-7-t11-qa-integral-hardening`.

## Defects found in manual test T11-D2

- **T11-D2-01 (high):** user `TRABAJADOR` no active assignment to `Sede A TEST 2` It was displayed in the sales selector; it persisted after F5 and re-auttification.
- **T11-D2-02 (high):** the transfer panel offered origin/destination STORE of unallocated locations, even with reference balance. FastAPI remained the authority in each POST.
- **T11-D2-03 (not classified as bug):** the general consultation inventory may show headquarters of the same company; the stock reading policy remains unchanged due to a lack of contrary decision.

The findings were reproduced with two accounts in TEST Company A **no sales or transfers**. Automated correction and regression use exclusively tenants/users created in PostgreSQL disposable.

## Correction implemented

| File | Change |
|---|---|
| `backend/app/modules/locations/assignment_service.py` | Method `list_my_active_location_ids`, authenticated reading limited to the actor and tenant, filtering assignments and active venues. It does not expose information from other members nor enables administration. |
| `backend/app/modules/locations/router.py` | `GET /api/v1/businesses/{business_id}/locations/my-assignments`; returns UUID list of authenticated user's locations; respects 401/403/404. Pre-register to dynamic location path. |
| `frontend/src/features/businesses/realOperationsGateway.ts` | UUID typed client and response validation, no duplicates. |
| `frontend/src/features/sales/RealPosPage.tsx` | For CHARGE/TRANSTALTER only offers active SELL locations that are in their own assignments; owner and administrator retain access to active SELL sites. GET fails closed to not enable options without consulting permissions. |
| `frontend/src/features/inventory/RealInventoryPage.tsx` | It obtains own assignments for transfers, without restricting general consultation of stocks. |
| `frontend/src/features/inventory/RealTransferPanel.tsx` | Origin and destination restricted to active STORE headquarters with assignment of non-administrative actor; revalidation backend and idepotent recovery is preserved. |
| `frontend/e2e/real/security-errors.spec.ts` | The Unallocated Worker Test now expects the headquarters to be unselected in POS. |
| `frontend/e2e/real/assigned-location-visibility.spec.ts` | New test E2E: owner creates two locations, invites worker, assigns only A; backend returns only A, administrative endpoint remains 403; POS displays only A, transfers only A; revocation and F5 + new login leave selector without seats. No commercial POST from browser. |

## Evidencia de GitHub Actions

**Commit funcional final:** `d2cdf4e774990a770909b674520b883e9e8cd31a`.

- Full-stack REAL #43002093357: **SUCCESS**; **892 Pytest**, **32 Playwright REAL**, **6 Playwright DEMO**. The new case `T11-E: trabajador solo ve sus sedes SELL y STORE, revocación efectiva tras F5` approved.
- Frontend #43002093452: **SUCCESS**.
- Backend FastAPI #43002093351: **SUCCESS**.
- Pytest reported **3 warnings** Non-blockers (Pydantic alias/Annotated). Their number varies between executions; they are kept as independent hardening slope T11-E.

## Residual decisions and risks

1. **Do not replace backend permissions.** The mapping query determines UI options; all POSTs are still validated by API, tenant, membership and location at the time of operation. If an assignment is revoked during an open session, it is reflected when reloading/reopening; the API must reject the operation with expired permissions.
2. **Do not modify reading policy:** showing balances/history between headquarters to a member of the company was not treated as defect without a domain rule prohibiting it.
3. **Do not enable confirmation of persistent sales:** `VITE_PYME_ENABLE_REAL_SALES` continues to be disabled in the usual local environment.
4. **Earrings of T11-E general:** Pydantic warning, old-stage texts and closing/final review of the PR. **The correction of the two defects is approved; it does not imply overall acceptance of PR.**

## Suggested manual verification after updating

1. Keeping branch backend updated (changed FastAPI, requires recreating service image before testing).
2. Log in as Miguel and enter the TEST Company POS A: see only `Sede A TEST` (active allocation), without `Sede A TEST 2`.
3. In Inventory > Transfer, source/destination dropdowns should only offer assigned active STORE locations. With a single assigned location, the transfer cannot be confirmed.
4. Do not mark consent or send POST. Check that existing balances and versions do not change.

**Status:** T11-D2-01 y T11-D2-02 **CORREGITED AND VERIFIED IN CI**. PR #45 DRAFT; `main` intact.
