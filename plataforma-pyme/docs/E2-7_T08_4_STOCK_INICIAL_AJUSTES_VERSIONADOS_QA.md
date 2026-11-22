# E2-7 · T08-4 — Initial stock, physical count and real versional adjustments

**Date:** 10/11/2026. **Updated status after T08-5:** end frontend implementation, main manual acceptance in REAL IU **Adopted** and PostgreSQL/Playwright Integration Suites **Adopted** in IC. Manual evidence is not independent SQL inspection. Branch: `feature/e2-7-t08-inventario-real`; PR #41 is still in draft, **sin merge a main**.

## 1. FastAPI contract and real rules

Direct review of `backend/app/modules/purchases/{adjustment_router.py,adjustment_schemas.py,adjustment_service.py}`, tests `test_adjustment_api_integration.py` y `test_adjustment_concurrency_integration.py` de E2-5 C:

- `POST /api/v1/businesses/{business_id}/inventory/adjustments`, header `Authorization: Bearer <opaco>` y `Idempotency-Key: <UUID4>`; creation **201**identical key and body replay **200**. No automatic HTTP retryings.
- JSON Corps **exactly.** `{kind, catalog_item_id, location_id, quantity_milli, expected_version, reason}`. `kind` = `STOCK_INICIAL`, `AJUSTE_ENTRADA` o `AJUSTE_SALIDA`. Whole positive quantity in thousandths 1.999999999, standard motif of 3–500 characters, version >= 0.
- `GET /api/v1/businesses/{business_id}/inventory/adjustments/{adjustment_id}` historical consultation **sin mutar stock**.
- **STOCK_INICIAL** only for holder/admin, balance **non-existent**, without history of movements at the headquarters+article, `expected_version=0`, positive starting balance, new projection with version 1. Do not enable repeated initialization, even after zero historical balance.
- **ADJUSTMENT_INTERPRISE/SALIDE** only if there is already a balance: it requires its exact positive version; a `expected_version` obsolete (by shipment, purchase, sale or other adjustment) produces **409** and API does NOT alter balance or leadger. Output requires quantity $$$ existing balance.
- **PHYSICAL CONTEE** is just a frontend comfort: user introduces **final balance** (up to 999999999999000ths); interface calculates difference `contado − saldo consultado`, build `AJUSTE_ENTRADA` o `AJUSTE_SALIDA` with positive delta and `expected_version` read. If difference = 0, **does not send POST**. If the difference is greater than 999999999 thousandths, it is rejected for exceeding the maximum of an individual transaction: it is not truncated or rounded. A final balance counted from zero is allowed in counting, not in initial stock.
- Roles: holder and administrator can initialize and adjust; maintainer can adjust if you have an active STORE assignment to the headquarters; worker cannot adjust or initialize. `can_store=true`active business and membership, article `BIEN` y `ACTIVO`. All actual authorization belongs to the backend.
- Answer contains exactly **a signed movement**, with type of operation, actor and UUID operation consistent with the voucher. Do not invent invoices or change catalog prices.

## 2. Architecture and Frontend changes

- `features/inventory/realAdjustmentGateway.ts`: strict validation and thousandth conversions, visible roles, counting interpretation and parsing of the only coherent movement. Distinction between HTTP 409, invalid GET response and invalid POST 201 response (potential confirmation).
- `features/inventory/adjustmentPendingJournal.ts`: IndexedDB registry by `actorId:businessId:inventory.adjustment`. UUID4 key save, exact body, version, date, scope; **no token or password**, but operational data **unencrypted**. Pre- POST transactional reservation, verification after reading, isolated scope and prohibition of replacing body/key. If IndexedDB fails, the mutation is blocked. It does not automatically erase attempts of uncertain result.
- `features/inventory/RealAdjustmentPanel.tsx`: contextual interface with physical article, suitable venue, modality **physical count/set input/tightness output/start stock**, reading API specific balance and version, preview delta and projected balance, reason, consent, human confirmation, error messages and ID voucher. Recovery in F5 without forwarding automatically. An operation failed by 409 **no** is automatically recalculated against the new version.
- `features/inventory/RealInventoryPage.tsx`: independent button **Stock inicial y ajustes** The two operations are not mounted simultaneously. When confirming, balances and movements are re-checked to FastAPI. DEMO and its `demoStore` remain intact.
- `features/auth/auth.css`: cards responsible for the balance observed, delta and expected balance.
- `tests/adjustment-real-api.test.mjs`, `package.json` (`npm run test:adjustment-real`), GitHub Actions frontend CI.

**Privacy:** persistent intent data are not encrypted or synchronized between browsers. Do not perform these tests from shared computers.

## 3. Automatic evidence

GitHub Actions in T08 branch with new script `test:adjustment-real` (check last command of code, do not confuse previous ICs):
- Frontend, build y lint: **220/220 Frontend Suites Trials**including **15/15 del ajuste**, **14/14 transfers** y **26/26 inventory**; lint **0 errors, 0 warnings**.
- New tests cover `201`, replay `200`, Historical GET, UUID4, exact amount, role, initial balance v0, v1+ settings, count with difference (+,−, zero), HTTP 401/403/404/409/422, motion signature, tenant, malformed response, uncertain network failure, F5 with key/body and original version, failed and indexedDB corruption.
- El backend **ya** has postgreSQL testing specific adjustments and continuance (`test_adjustment_api_integration.py`, `test_adjustment_concurrency_integration.py`), which should not be confused with new unitary frontend tests.
- Vite Notice by chunk JS >500 kB remains visible; it is a performance warning, not a build failure.
- A divergence between the limit of **accumulated balance** y el de **individual delta**; the final count may exceed a single setting as long as the delta meets its cap, according to `StockBalance.MAX_BALANCE_MILLI`. There is specific proof of the large balance.

## 4. Recommended manual QA — minimize alteration of existing data

**Documented starting point:** Product A TEST in TEST Company A, Headquarters A TEST **7 UNITY** and Headquarters A TEST 2 **4 UNITY** After transfers T08-3; do not use this article for the first tests T08-4. Balances represent only a statement observed on 10/11; reread API before any operation.

1. Update the branch and run local tests: `npm.cmd run test:adjustment-real`, `npm.cmd run test:inventory-real`, `npm.cmd run test:transfer-real`, `npm.cmd run build` y `npm.cmd run lint`. Lift Docker and Vite by proxy `PYME_API_PROXY_TARGET=http://127.0.0.1:18000`.
2. With user **TEST holder Company A**, in REAL Catalog create new physical test article **‘Product T08-4 CONTEO’**, of type REVENT and unit UNITY, unique SKU. Choose active location suitable for stock (e.g. **Headquarters A TEST 2**), checking first that for that article **no balance**.
3. REAL Inventory → **Stock inicial y ajustes**. Select new article, location, type **STOCK_INICIAL**, quantity `5`, motive `Conteo inicial de prueba T08-4`, accept storage, confirm **once only**. Expected: proof `STOCK_INICIAL +5`, stock **5 UNITY**version **1**, and a leader move. If API rejects (e.g. 409) **not invent another operation**; verify status/registration.
4. Reopen, select the same article and host: **_INTERPRISE**, quantity `2`, motive `Reposición por conteo de prueba`. Expected balance **7 UNITY**version **2**, movement `+2`.
5. Open **PHYSICAL CONTEE** 7. Enter counted balance `6`You must show **delta −1** and projection **6**. Confirm once; expected balance **6 UNITY**version **3**, movement `AJUSTE_SALIDA −1`.
6. Verify what count `6` over balance 6 show that there is no difference and **no** enable POST. Change the location/article and check that the version is re-read; do not reuse a `expected_version` obsolete.
7. Try to initialize an existing item again: it must be blocked in form, and a similar direct POST backend would return **409**. You do not need to send an unsafe operation to prove this condition if there is backend test.
8. **QA of continuance (optional, controlled, T08-5):** two sessions reading the same version; one makes an authorized setting and the other tries to command with the previous version: **409**, without changing balance. Review leader, recover/discard previous identity after checking; do not create new key automatically.
9. **Permissions:** with Miguel as **STAFF MEMBER**, the form should report read only; with assigned maintainer, settings are allowed but no initial stock. The backend must revalidate, not create artificial assignments.
10. **Insulation:** Company B must not view the article/movements/balances of A. DEMO continues with own data. Do not restart/delete PostgreSQL volumes.

## 5. Risks and closure criteria

- **Concurrence:** previous reading does not reserve inventory. Backend compares `expected_version` and blocks obsolete transactions in transaction. **409** the attempt is retained and is oriented to consult balances and history before discarding or retrying **same** intention. To change version it is mandatory to resolve the previous intention and prepare a **new** explicit command.
- **Loss of response:** Even with HTTP 201 invalid, it may have been confirmed. Do not make automatic retry or invent success; the durable record retains UUID4 itself.
- **Historical record:** not allow `STOCK_INICIAL` about location+article with previous moves, even if the historical balance is zero. Do not use purchase sum in browser.
- **Demo data:** Don't mix. **T08-4 will be functionally approved** only after initial stock catches, positive/negative adjustment, record preservation and permit/tenant control or documented QA evidence.

**Historical closure state:** In drafting this plan, there was a lack of REAL manual QA; **that pending was resolved on 11/10/2026** and is then supported in [T08-5](E2-7_T08_5_QA_INTEGRAL_Y_CIERRE.md)PR #41 is not yet merged.

## 6. Manual QA T08-4 retrospective report — final result (10/11/2026)

**Source:** captures and user confirmations about the REAL Inventory interface connected to FastAPI. This section records what is observed, without asserting SQL queries or separate HTTP traffic captures. **Headquarters actually used: Headquarters A TEST**See A TEST 2 as suggested by the previous plan. Article: **Product T08-4 CONTEO**, SKU `TEST-T084-001`, unit UNITY, in **TEST Company A**.

| Ctrl | Manual evidence observed | Outcome |
|---|---|---|
| Initial Load | No prior balance, `expected_version=0`; registration `STOCK_INICIAL +5` | Approved; 5 UNIT / version 1 |
| Input adjustment | Envelope 5/v1, `AJUSTE_ENTRADA +2` | Approved; 7 UNIT / version 2 |
| Physical count | Balance read 7/v2, balance counted 6; delta `AJUSTE_SALIDA -1` | Approved; 6 UNIT / version 3 |
| Ledger | Article/headquarters appear `+5, +2, -1` | Visually approved, total 6 |
| Counting without difference | Count 6 with current balance 6/v3 | Approved: Match message and confirm button disabled |
| Repeated initialization | Same article and headquarters with 6/v3, proposed quantity, reason and acceptance complete | Approved: initial operation blocked by pre-stock |
| Workers' role | Miguel sees read-only notice and does not get adjustment form | Approved in IU |
| Separation of undertakings | TEST Company B shows no balances or movements of A | Visually Approved |
| DEMO regression | DEMO shows companies and own items, not mixed with TEST data | Visually Approved |

**Earrings that should NOT be confused with manual tests carried out:** no two-session collision with `expected_version` The two behaviors were validated in isolated PostgreSQL, and the 409 was also tested with Playwright REAL.

**Closing CI:** run #42896686337, 879/879 backend, 256/256 frontend, 4/4 Playwright REAL and 6/6 Playwright DEMO, no flaws. Do not repeat movements on the TEST article to rebuild tests. **T08-4 functionally approved**; the merge requires further authorization from the user.
