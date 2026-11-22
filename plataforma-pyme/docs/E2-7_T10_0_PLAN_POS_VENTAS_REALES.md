# E2-7 · T10-0 — Real Sales POS Implementation Plan

**Date:** 10/11/2026. **Rama:** `feature/e2-7-t10-pos-ventas-real`. **Verified base:** `main` en el merge de T09 PR #42, commit `a09c0152aabc1b2c110726ef7aa2f42d71d79a0a`.

## Objective and border

Build the REAL Sales POS in React, integrated with FastAPI and PostgreSQL for multi-sector companies. **WALOS does not determine the domain, price or unit**. The POS will record goods, services or mixed sales, payments **declared** (not confirmed by banks/MP), discounts, immutable sales vouchers and atomic stock debit only when there are goods.

**T09 is merged:** exist `POST /api/v1/businesses/{business_id}/sales`, `GET /sales`, `GET /sales/{sale_id}` y `GET /sales/by-request/{request_id}`. The backend effectively validates company/headquarters permission, sellable catalog, amounts, payments and stock; the UI is not a security check.

**Do not make sales changes or stock at TEST Company A to program this block.** All writing tests must use users/businesses and PostgreSQL completely disposable in IC. The DEMO frontend is separated.

## 1. Contract verified in backend

`CreateSaleRequest` has exactly (you can skip default fields in the API, but T10 will use a full canonical representation for retrying):

- `location_id: UUID | null` (null allowed for no-headquarters service **only** a holder/manager according to current backend policy).
- `discount_cents`: strict integer from 0 to 99.999.999.999.
- `notes`: Standard text, maximum 500 characters once normalized.
- `lines`: de 1 a 30, `{catalog_item_id: UUID, quantity_milli: 1..999999999, unit_price_cents: 0..99999999999}`.
- `payments`: de 1 a 6, `{method,amount_cents,reference}`Methods: `EFECTIVO`, `TRANSFERENCIA`, `CUENTA_DNI`, `TARJETA`, `MERCADO_PAGO_DECLARADO`.
- Amounts in whole cents, amounts in thousandths. **HALF_UP by line:** `(quantity_milli * unit_price_cents + 500) // 1000`, **sin floats**. Final total and sum of payments declared must match exactly; the total after discount must be positive.
- **POST requires `Idempotency-Key` UUID4**. First confirmation `201` con `SaleView`; authorized replay of the same actor/key/body `200`; key reused with another body/actor `409`Two HTTP attempts do not amount to two sales if they preserve identity.
- No sales of split quantity catalogues with units `UNIDAD`, `PAQUETE`, `CAJA` o `SERVICIO`. Validate both in frontend with full catalogue and backend.
- Catalog can have `price_cents=null`, so never invent price `0` automatically or take price from DEMO. The existing API allows the command to indicate price; the policy of **who can edit it** is decision P01, not yet approved for T10.

## 2. Formal Decision P01 — Approved and implemented in Phasei

El plan previo `E2-7_T00_DECISIONES_Y_ORDEN_DE_EJECUCION.md` requires approval of the responsible for price/disagreement by role. **Do not assume that the backend restricts price per role:** currently their rules control sales permission by company/headquarters, but take `unit_price_cents` y `discount_cents` command and verify consistency.

**Rule approved by the responsible (10/11/2026) and in force since T10-P01 in the branch:**
- Administrative and administrative owner: may modify the price of sale, offer discounts and register any method **declared**.
- Maintainer/worker: may sell at their authorized premises at the price of the catalogue; **no** can change unit price or discount. If the catalogue does not define price, they cannot sell that item until a price is defined by an administrator or authorizes a formal exception.
- Services without headquarters: only holder/admin according to the backend.
- Any restrictions approved must be implemented in FastAPI **y** React, with API bypass tests, not just hiding the field.

**Implementation:** FastAPI rejects with 403 discounts/prices other than the catalog for operators and 422 items without price; Owner/Manager retain control. Tests with PostgreSQL ephemeral and regression of approved replays. View [minutes P01 and T10-C](E2-7_T10_P01_Y_C_POS_BORRADOR_QA.md). The rule will be checked again before T10-D.

## 3. Architecture of idepotent attempts (P04)

Before the first POST, persist in IndexedDB by scope **actor + company + `sale.create`** un `request_id` UUID4 y un **complete, canonical and immutable body**, without Bearer or credentials. Writing in IndexedDB must be finished and reread successfully **before** if storage is locked/corrupt, **no enviar POST**.

- After network crash, abort, timeout, invalid response or F5: save the attempt as uncertain; reauthenticate with token only in memory.
- First offer `GET /sales/by-request/{request_id}`. **404 doesn't prove POST didn't make it**: keep the attempt and offer retry **explicit** of the same key/body; do not generate new key by a timeout.
- Con `201`/`200` and verified proof for company, key and total: close the lasting intention. If the elimination of the journal fails, keep it and allow recovery without new POST.
- Ante `409`: **no** delete attempt, rewrite your body, or automatically try new key. Require human/diagnosis intervention (can be insufficient stock, suspended company or headquarters, or conflictive key).
- If actor/tenant changes, **physical isolation** the scope; do not disclose an attempt from another account. Warn that commercial information stored in IndexedDB is not encrypted: avoid shared computers.
- Do not quietly purge earrings; define safe manual retention and deletion. Reuse proven patterns `supplyPendingJournal.ts`without reusing your store with another scheme.

## 4. Minimum POS design

1. Explicit Selector of **company** and active headquarters with sales permit (SELL and STORE premises for goods). Never use implicit headquarters to debit stock.
2. Catalog paged with states **loading/parcial/completo/error**; probar **101 and 501 articles**. Do not filter locally as if they were all when you only loaded the first page. Do not invent search endpoint `?q=`.
3. Cart of 1–30 lines; units, quantity in thousandths and total HALF_UP per line. Price of the catalog as suggestion, not value tax until decided P01.
4. Discount and payments declared adding up exact total; not to confuse `MERCADO_PAGO_DECLARADO` with webhook/external accreditation or QR of the item with the QR collection.
5. Final review of company/headquarters, lines, price, discount and means, explicit human consent; double-click lock, journal persist first.
6. Show REAL T09 voucher; errors 401/403/404/409/422 and uncertain result with clear semantics. Current balance consulted in Inventory, after-sales balance shown as snapshot.
7. Integration and testing with several companies/roles, sufficient/insufficient stock, 409 per different replay, network down after commit, F5/relogin, no-stock service and mixed sale.

## 5. Proposed T10 increases

| Stage | Verifiable exit | Door |
|---|---|---|
| **T10-0** | Plan, contracts, risks P01/P04 and architecture | It is now done |
| **T10-A** | Pure TypeScript Validator command and preview HALF_UP + unit tests without POST | Safe before P01 |
| **T10-B** | Journal of durable sale scoped by tenant/actor, gateway of creation with request_id and recovery by GET; tests without effects on real basis | P04; not enable write button |
| **T10-C** | POS React for Headquarters/catalogue/cart, full page 101/501 and roles | P01 approved before accepting discounts/prices |
| **T10-D** | Payment statement, human confirmation, persist attempt before POST, UI uncertain result and proof | P01 and B/C approved |
| **T10-E** | Playwright REAL + PostgreSQL disposable: physical sale/service/mixture, payments, movements, loss 201, F5 and 200/409, not duplicated | Green integral CI |
| **T10-F** | Non-destructive manual, premerge audit, documentary closure and responsible approval | Do not merge automatically |

## 6. Safety and evidence criteria

- Own files under `plataforma-pyme/`, independent PR T10 in draft; **main no se modifica** during development.
- Do not change backend of T09/T08 unless you need it well founded and proven. Avoid changes in global GitHub actions and untracked folders.
- In each block: Node/TS/Vite/Oxlint; backend Python PostgreSQL/migrations; full-stack REAL and regression DEMO with ephemeral data.
- CI T09 before the merge: 886 backend, 273 frontend, 11 Playwright REAL, 6 DEMO, all approved; used as baseline, not as a result of T10.
- This plan is a **initiation of T10**, no authorization for real sales from the browser.


## Post-Status Update — T10-P01 / T10-C

The price policy was **expressly approved** and applied in FastAPI with bypass testing, without creating new roles. The route of **POS REAL /pos** with cart, catalogue paged and summary; your confirmation button remains **disabled**, without POST or journal from React. Increases of T10-D/E/F are still pending. View [canonical record T10-P01/C](E2-7_T10_P01_Y_C_POS_BORRADOR_QA.md) for existing tests and limits; the previous indications on ‘P01 pending’ are retained as historical context until approval.
