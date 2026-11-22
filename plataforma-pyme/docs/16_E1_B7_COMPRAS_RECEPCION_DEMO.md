# E1-B7 — Purchases, lines, reception and DEMO events

**Status:** code integrated into `main` el 06/11/2026. **Build, Lint, Automatic Testing and Local Visual QA PENDING.**
**Design/requirement sources:** Plan v4, E0-A Z050/Z070; Purchase/Expendation specification M2; ADR-004 (Proposed status); E1-B2-02, DEMO-STK-01 and QA-STK-01. Global scripts from the original HTML are not reused.

## Objective and scope

- Enter Shopping **per company** without requiring supplier, deposit or catalog item. A service company may register a purchase with free concept without creating warehouse.
- Register between 1 and 30 lines per operation, each linked to the active article/service of the catalogue **o** Free concept. Required quantity, unit and unit cost. Free concept uses unit `CONCEPTO` and doesn't enter stock.
- Capture date, optional provider, voucher reference and observations; payment information is NOT recorded in this court.
- **Historical Snapshot** by row: name, SKU, unit, quantity, cost and subtotal at time of registration. The provider’s name is also photographed. Edit an item or supplier later **does not change** Old shopping.
- Amounts in **ARS whole cents**quantities in **one thousandths of the catalog unit**. `lineTotalCents` calculates by `BigInt` and rounding HALF_UP *per row*; then sum subtotals in integers, without loss per floating point.
- The discrete units (unit, package, box, service and free concept) only support whole quantities; kilogram, gram, liter and milliliter allow up to three decimals. No automatic conversion box→units or kg→gram. Each entry is expressed in **the same control unit as the Catalogue**.
- Save purchase does not imply receipt or payment. It is registered with receiving status **Pending**, **Confirmed** o **No physical reception** (services/free concepts).
- Data sheet/story of purchases with search and filters by receiving status. No retrospective edition, no purchase deletion. The absence of proof means without reference, NOT that an invoice has been attached.
- Reception: a later, explicit and confirmed action requiring location **active with `canStore=true`**Generates **in the same command** a positive movement for every line of physical good in the catalogue. Free services and concepts are informative.
- **Idempotence in DEMO:** cada submit de compra usa `requestId` stable during the form; a retry with that key returns the same purchase. Each purchase accepts **a single reception**, complete with respect to your physical assets, in a single location. Summon again `receivePurchase` returns the previous reception and does not add movements.
- `listDemoReceiptMovements` it generates events from immutable snapshots; `receiptQuantityMilli` allows the transfer of amounts received by company, article and location. The Inventory will come later as a projection of these events; no operational inventory balances are presented yet.

## Data design

`PurchaseInput` = `purchasedOn`, `supplierId|null`, `reference`, `notes`, `lines[]`.

`PurchaseLineInput` = `catalogItemId|null`, `description`, `unit`, `quantityMilli`, `unitCostCents`.

`DemoPurchase` = `PurchaseInput` más `id`, `requestId`, `businessId`, `supplierNameSnapshot`, `createdAt`, `totalCents`, `receipt|null` and the `PurchaseLineSnapshot[]` with stable IDs and good/service/conceived class.

`PurchaseReceipt` = `id`, `locationId`, `createdAt`, `movements[]` with event IDs, inferred purchase/reglon, catalog, unit and positive quantity. The event is preserved after F5; when loading it validates movement congruence ↔ line and location ↔ company, to avoid interpreting arbitrary objects as stocks.

**Storage:** Go on. `asistente-pyme.e1a2.demo.v1` with version 1 and an array **optional** `purchases`. Pre-fields are preserved `profile`, `createdBusinesses`, `fixtureEdits`, `memberJobs`, `locations`, `teamInvitations`, `teamMembers`, `catalogItems` y `suppliers`. No pre-existing purchases are invented. The status of the browser **has no security, actual attendance or server persistence**.

## Files

- `frontend/src/data/demo/purchasePolicy.ts`: total amounts, cents, dates, classes and validation.
- `frontend/src/data/demo/demoStore.ts`: commands `registerPurchase` y `receivePurchase`, history and compatible reading.
- `frontend/src/features/purchases/PurchaseForm.tsx`: purchase with several lines and preview calculated.
- `frontend/src/features/purchases/PurchasesPage.tsx`: history, filters, KPIs.
- `frontend/src/features/purchases/PurchaseDetailDialog.tsx`: snapshots and confirmation of reception.
- `frontend/src/App.tsx` + `frontend/src/features/dashboard/Dashboards.tsx`: Shopping route and DEMO access.
- `frontend/src/App.css`: responsive design.
- `frontend/tests/purchase-policy.test.mjs` + script `test:purchases`: pure tests of politics.

## Run from `plataforma-pyme/frontend`

~~~powershell
git pull --ff-only origin main
npm.cmd run build
npm.cmd run lint
npm.cmd run test:purchases
npm.cmd run test:catalog
npm.cmd run test:suppliers
npm.cmd run test:team
npm.cmd run test:maps
npm.cmd run dev
~~~

If Vite is already active, skip the last command.

## Proposed manual validation

| Case | Steps | Expected |
|---|---|---|
| COMP-01 | Open Purchases in new company or services | Empty history; no deposit required |
| COMP-02 | Purchase with 1 free concept and no supplier | Recorded; status **No physical reception**Total correct |
| COMP-03 | Purchase with supplier and 2 physical items from the Catalogue | Muestra snapshot y total, **Pending receipt** |
| COMP-04 | Change article or provider name after registering | Previous Purchase Maintains Original Names |
| COMP-05 | Create active location that **no** store | Not available for reception |
| COMP-06 | Create active location with **You can store** | Allows selection in pending purchase |
| COMP-07 | Confirm receipt of 2 items at that location | 2 positive events appear and Confirmed status |
| COMP-08 | Close/open detail, update F5 | Reception is still confirmed, no button to receive again |
| COMP-09 | Run receipt from console with the same ID (only if technical QA) | Returns same recipit ID, does not duplicate movements |
| COMP-10 | Mixed purchase well + service + free concept | Only physical good is received |
| COMP-11 | Purchase of services only | No physical reception and no stock entry |
| COMP-12 | Quantity `0,5` box | Reject fraction for discrete unit |
| COMP-13 | Quantity `0,5` kg | Allows and preserves `500` millimetres of kg, not converted to grams |
| COMP-14 | Price `1.250,50` or more than 2 decimal places | Error without generating purchase; `1250,50` allowed |
| COMP-15 | Retry to register with same requestId | A single purchase |
| COMP-16 | Change company before and after registering | Records and receipts do not cross companies |
| COMP-17 | Back to Catalogue/Suppliers/Locations and F5 | Your records remain intact. |
| COMP-18 | Open Detail and Escape, Close, 390px | Modal and form usable without overflows |
| COMP-19 | Build, Lint, automatic tests | Sin errores ni warnings |

## Out of range E1-B7

Receptions **partial**, multiple destinations per invoice, returns, configurable packaging equivalences, attachments, OCR, actual payments, financial accounts, automatic deduction of promotions, order approval, modification or cancellation with accounting reversal, disaggregated taxes, advanced processing products, stock available/reserved and multi-branch attendance. **No** They're pretended to exist.

## Next cut

E1-B8 Inventory: consult movements and physical balance by company/location/article, calculated from a unique leader, add transfers and counts with non-negative stock validation. PostgreSQL API posterior: transactions, versions and persistent server idempotency keys; maintain the proposed TP3 and ADR requirements.
