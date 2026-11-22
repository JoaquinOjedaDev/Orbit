# E2-7 · T10-P01 and T10-C — Price policy and preliminary REAL POS

**Date of adoption:** 10/11/2026. **Rama:** `feature/e2-7-t10-pos-ventas-real`. **PR:** #43, draft, **sin merge a main**.

## 1. Decision P01 expressly approved by the responsible person

After presenting the price and discount rules, the responsible replied: 'Okay, that's fine.

| Existing role | Headquarters authorized for sale | Price in command | Discount |
|---|---|---|---|
| `TITULAR_ADMINISTRATIVO` | Any venue where you can operate, or without headquarters for services | You can choose/prepare price other than the catalog | Allowed |
| `ADMINISTRADOR` | Any venue where you can operate, or without headquarters for services | You can choose/prepare price other than the catalog | Allowed |
| `ENCARGADO` | Allocation only `ACTIVA`, according to FastAPI | **Same as current price `CatalogItem.price_cents`**, no null | **Zero mandatory** |
| `TRABAJADOR` | Allocation only `ACTIVA`, according to FastAPI | **Same as current price `CatalogItem.price_cents`**, no null | **Zero mandatory** |
| Other / users without membership | None | Denied | Denied |

**FastAPI guarantees (non-React guarantees):**

- En `SaleService.create()` the role, headquarters, active member and catalog of the tenant are revalidated in the same transaction. The price of the catalog is read with `FOR SHARE` before you create `Sale`, `SaleLine`, `SalePayment` o `StockMovement`.
- If Maintainer/Worker changes `unit_price_cents` or try `discount_cents > 0`, FastAPI devuelve **403** no persistent records or stock.
- If the catalogue is priceless `price_cents`, devuelve **422** for those roles; holder/admin may quote it and set a price directly on the sale transaction.
- A previously confirmed authentic replay of sale (same user, UUID4 key and body, with valid headquarters permissions) continues to return **200**even if you later change the price of the catalogue. A new sale of a trader with the old price is rejected.
- An error in a mixed sale line rejects **all** No exceptions allow selling at an unallocated headquarters. No new roles or DB migrations were introduced.

**Tests P01:** `backend/tests/test_sales_price_policy_integration.py` contains **6 tests** covering workers/managers, holder/manager, discounts, increased/decrease prices, absence of price, replays, several lines and unallocated headquarters. Two regression tests were adjusted prior to the new rule so that their workers use price from the catalog without losing proof of revocation.

## 2. T10-C: interface scope

**Path:** `/real/empresas/{business_id}/pos`, from **Real Company → Real Point of Sale · preparing cart**Archives:
- `frontend/src/features/sales/RealPosPage.tsx`: company/headquarters, paged tokens, selection, quantity, price, discount and preliminary cart.
- `frontend/src/features/sales/realPosDraft.ts`: pure validation of quantities (thousandths, whole for UNIT/PACKET/CATCH/SERVICE), visual permits per role, SELL/STORE headquarters for goods, prices and exact totals.
- `frontend/src/features/auth/RealAuthApp.tsx` y `RealBusinessesPage.tsx`: new path and access; responsive styles in `auth.css`.

**Deliberate restriction:** the **‘Sales confirmation available on T10-D’ is disabled**This view doesn't matter or call. `realSaleWriteCoordinator`He doesn't call. `journal.reserve`, does not record sales or payments, does not modify inventory and does not persist the cart (lost on exit/read). **Not to say that T10-C already allows selling.**

**Pageing:** uses the REAL API `GET /catalog?offset=...&limit=100` and the same semantics as REAL Catalog: filters over loaded pages and explicitly indicates when there is more. Do not invent endpoint `?q=`. Browser Test with **501 simulated tiles only in the IC browser** to verify 100+100+100+100+100+1 without allowing a complete false listing.

**Selection of headquarters:** shows the active sites with `can_sell`; for goods it also requires `can_store`. The backend remains the authority over assignment of the Maintainer/Worker. The IU may display the name of an unassigned headquarters, but **does not grant a sales permit**; improve selector filtering when there is an authorized endpoint to consult your own assignments.

## 3. Evidence and acceptance

- **P01 first IC verified:** full-stack #42920637980, **SUCCESS**: 892/892 backend, 308/308 frontend, 11/11 Playwright REAL y 6/6 DEMO.
- **T10-C pure Node:** `frontend/tests/sales-real-pos-draft.test.mjs` with 7 cases of quantities, roles, discounts, headquarters, service without headquarters and cart without external effects; command `npm.cmd run test:sales-real-pos`.
- **T10-C browser:** `frontend/e2e/real/pos-draft.spec.ts`two scenarios in IC with `PYME_DISPOSABLE_QA=1` and company created in PostgreSQL ephemeral. Check cart without POST and 501 pagadas tabs. The second uses simulated API fixes only for the page, without creating 501 articles on DB.
- **CI T10-C originally approved and new revised approved:** full-stack #42925918339, commit funcional `f6cfae57f9048eeca1e552739781d5e13c6ac877`, **SUCCESS: 892 backend, 13 Playwright REAL (incluidas ambas pruebas T10-C), 6 DEMO**, regressions and build/lint frontend approved. Independent Frontend #42925917999 also **SUCCESS**. Subsequent documentation does not change code.
- **Local manual tests T10-C (pre-alloy version):** user confirmed the REAL catalogue and mixed cart in TEST Company A by means of catches. Totals and discount were calculated correctly, but identified confusion between unit value and subtotal. The visualization changes were incorporated later and are approved in IC; **the new interface was not manually revalidated yet**No sale or confirmation of stock movement.

## 4. Next steps

**T10-D** add final review, declared payments, explicit human confirmation, indexedDB checked reservation before POST and results `201/200/409` before you enable the button, test price security P01 in API and frontend, including changing catalog price after you prepared the cart and before POST, and errors without duplication.

**PR #43 is still DRAFT, no merit.** Any real creation for QA must run in PostgreSQL ephemeral, not TEST Company A.


## 5. Functional adjustment after visual QA of the user (10/11/2026)

The user tested the POS with **TEST Company A** and shared catches of the product **Product A TEST**service **Service A TEST** and an article **Product T08-4 CONTEO** without catalog price.

**Verifiable observations of previous catches:** the cart already multiplied quantity × price per item and the overall total was consistent (example 5 units to $2,000 + 4 services to $1,000 = $14,000; discount $2,000, total $12,000). However, the subtotal of **each article** the holder saw the editable unit field without warning and, if an article already included was selected, a mistake was shown that forced it to be removed.

**Built-in functional change:**

1. Unit price **preloaded from catalog and locked by default**, even for the holder. Maintainer/Worker always see it blocked. Holder/Manager retains P01 through an action **explicit** ‘Exceptional price change’ to allow the quotation or alternative price. ‘Reset catalogue price’ cancels the exception; without price catalog it is required to explicitly enable management modification.
2. Subtotal of the article before adding: `cantidad_milli × precio_unitario_cents`, HALF_UP by line with **BigInt**. The cart shows separately name, quantity, unit price and **subtotal del producto**, avoiding confusing unit amount with total.
3. When selecting an item already included, the picker recovers its quantity and price. The button becomes **"Update in Cart"**; updates the same line without creating duplicates and supports editing from the cart.
4. As a small functional integration with DEMO, each sheet shows **‘In-cart: X UNIT/SERVICE’** when it has already been selected. Re-use **the interaction pattern**, no DEMO models or fictitious data.
5. The general, discount and total subtotal is preserved; **no POST** no stock movement. The ‘Sales confirmation available in T10-D’ control remains disabled.

**Do not copy now from DEMO:** images, categories, stocks or button "Add another" with cumulative quantity; REAL source must obtain catalogues and stock **per company/headquarter with permissions, units and versions**, and not assume fields present only in DEMO. Before adding stock available you must consult the Real Inventory of the headquarters and revalidate the stock atomically by confirming it in T10-D. The aesthetic harmonisation is left for a design phase, as requested by the user.

**Aggregate regressions:** 3 tests Node for individual subtotal (including 4 × $1,500, 5 × $2,000, rounding HALF_UP and pennies limits) and Playwright REAL expansion to ensure initial price lock, explicit management rating, subtotal per item, no duplicate row update and **zero POST**. The complete verification of the latest version should be disclosed after observing the final IC run; **existing catches do not yet prove new controls**.


### IC specific post-catch adjustment

- **10/11/2026:** Full-stack #42925918339 — **SUCCESS**; 892 Pytest in PostgreSQL disposable (3 non-blocking warnings), **13/13 Playwright REAL**, **6/6 DEMO**. T10-C tests verified cart, ineditionable initial price, managerial override, subtotal per item, editing quantity without duplication, page 501 and **zero sales POST**.
- **Independent Frontend #42925917999:** **SUCCESS**; build TypeScript/Vite, Oxlint and explicit workflow suites. **3 new subtotal tests** were executed and approved within the passage `node --test tests/*.test.mjs` del **full-stack #42925918339**as confirmed by his record.
- **Functional committee validated:** `f6cfae57`. This record is updated after the commit tested without changing logic.
