# E1-B8 — Inventory and locational movements (DEMO)

**Status:** integrated implementation in GitHub `main`. **Build, Lint, Automated Testing and Local Visual QA Pending**.
**Sources:** E0-A Z050 (Inventory/Integrated stock of M2), Z072 (Counties), Integration Plan v4, E1-B7 Purchases, Proposed ADR-004 and TP3 requirements. Existing shell React is retained; legacy HTML or global scripts are not incorporated.

## Functional scope delivered

- **Inventory:** inventory by company, physical item of the Catalogue and location. No fictitious stock preloaded. Services do not have stocks.
- **Movements:** path `/b/:businessId/movimientos` with the same component and leader as Inventory; directly opens receptions, transfers and settings history. **Improved view:** each transfer is shown in **a single row** with origin → destination and amount transferred. The two signed legs remain intact in the ledger.
- **Purchase Reception:** tickets previously confirmed in E1-B7 appear automatically, even those registered before this increase. A purchase still pending does NOT change stocks.
- **Transfer:** a command validates two different locations, active and enabled to store; it discounts the origin and adds exactly the same amount to the destination in **one operation**. Reject missing and does not generate negative stock.
- **Physical count:** records the amount actually observed in a location. The difference against the previous balance generates a move signed with mandatory reason; the count can be **zero**Zero difference adjustment and negative amounts are not accepted.
- **Traceability:** each move saves date/time, type, company, item, unit, location and motive; transfers share `operationId` The history groups only consistent pairs of the same article, company and quantity. If a leg is missing or data does not match, it shows individual records to avoid concealing evidence. Events are not edited or deleted.
- **Filters:** name/SKU/category and location for stocks; article/reference/motive and type/location for movements. Views limit rendering records to avoid saturating screen.
- **Indicators**: quantity of items with stock, item-location combinations with stock, lines received and quantity of **visible operations** (a transfer counts once). **No amounts of heterogeneous units are added**.

## Reglas del ledger

The source of truth is `PurchaseReceipt.movements` (purchase) along with `inventoryOperations` (transfers and counts). **No parallel stock table**. `listDemoInventoryMovements(snapshot, businessId)` produces projection; `stockBalances` group by pair `[locationId, catalogItemId]`. `inventoryBalanceMilli` check the balance without recalculating from another source.

- All quantities are expressed as integers in **thousandths of the Catalog unit**; for Unit, Box and Package, exact multiples of 1000 are required. Kilogram, Gram, Liter and Mililith support three decimal places. There are no automatic equivalences between boxes, packages, grams, kilograms or units.
- No business on services or inactive items. Inactive items with historical balance may continue to be shown for consultation.
- The control unit of an item associated with a historical purchase or movement is not changed, nor does it transform a historic good into service.
- A location can't lose `canStore=true` while maintaining positive balance; pauseing a location prevents new transfers/counts until reactivated, but does not eliminate historical stocks.
- An operation has a `requestId` Stable during your form. Repeating the same ID returns the previous operation and does not apply the move again. The frontend files a new request only when starting a new form.
- When rehydrating ancient local data, `inventoryOperations` is optional. Restored operations are validated against company, catalog, locations and balances **historical at the time of the event**preventing a subsequent reception from invalidating an earlier count.
- `load()` preserve `profile`, `createdBusinesses`, `fixtureEdits`, `memberJobs`, `locations`, `teamInvitations`, `teamMembers`, `catalogItems`, `suppliers`, `purchases` and its receptions. Same key/local version: `asistente-pyme.e1a2.demo.v1`version 1.
- These validations are **para la UX local**, not real authorizations. localStorage does not ensure distributed transactions, synchronization between computers, security, permissions or protection against manual changes. The future server must use transactions, blocking/versioning and idempotency keys.

## Files

- `frontend/src/data/demo/inventoryPolicy.ts`: types, key projection, quantity/motive validation, adjustment and transfer pairs.
- `frontend/src/data/demo/demoStore.ts`: acquisition and operations projection; commands `transferInventory`, `countInventory`; compatible and invariant cross load.
- `frontend/src/features/inventory/InventoryActionForm.tsx`: transfer and count with preview of balance and variation.
- `frontend/src/features/inventory/InventoryPage.tsx`: indicators, stocks, filters and history.
- `frontend/src/App.tsx` y `frontend/src/features/dashboard/Dashboards.tsx`: routes and accesses of Home.
- `frontend/src/App.css`: desktop and mobile styles.
- `frontend/tests/inventory-policy.test.mjs`: ledger tests and exact rules.

## Commands from `plataforma-pyme/frontend`

~~~powershell
git pull --ff-only origin main
npm.cmd run build
npm.cmd run lint
npm.cmd run test:inventory
npm.cmd run test:purchases
npm.cmd run test:catalog
npm.cmd run test:suppliers
npm.cmd run test:maps
npm.cmd run test:team
npm.cmd run dev
~~~

If Vite is already open, skip `npm.cmd run dev`.

## Manual validation matrix

| Case | Action | Expected |
|---|---|---|
| INV-01 | Open Inventory after confirming a Purchase E1-B7 receipt | The received item appears at the reception location; it should not be loaded again |
| INV-02 | Consult another company | No movements or balances of the previous company |
| INV-03 | Choose a location and activate "Include zero balances" | Physical articles without existence, expressed in their unity |
| INV-04 | Move 2 units from the warehouse to the premises | Origin −2, destination +2, total combined constant, two internally correlated movements and **one row** in the history |
| INV-05 | Try to move more stock than available | Insufficient Stock error, no event or negative balance |
| INV-06 | Try moving to the same location or a paused one | Rejection |
| INV-07 | Register real count of 7 units where there were 9 | Adjustment recorded −2 and balance left 7 |
| INV-08 | Register count zero | The output of the remainder is recorded to zero balance |
| INV-09 | Register count equal to current balance | Error: no setting to record |
| INV-10 | Register 0.5 boxes or packages | Rejection; no implicit conversions |
| INV-11 | Register 0.500 kg | Accepted in kilogram unit, not converted to grams |
| INV-12 | Create a service in Catalogue | Not shown among physical items for transfer/counting |
| INV-13 | Try editing the unit of an item with purchase/movement | Rejection; undisturbed history sheet and data |
| INV-14 | Try to disable "Can store" with positive stock | Rejection until moved or adjusted |
| INV-15 | Count, then receive another purchase and reload F5 | Preserving the previous count and adding the new reception |
| INV-16 | Confirm purchase receipt and return to Inventory/Movements | Unique physical event; no double reception |
| INV-17 | Update F5, browse to other sections and go back | Persistence and correct filters, without cross-border crossings |
| INV-18 | 390px display | Unoverflowed list, buttons and readable forms |
| INV-19 | Build, lint, test:inventory and other regression scripts | No errors or warnings |
| INV-20 | Filter transfers by location of origin or destination | One row per operation, visible with either filter |
| INV-21 | Filter history by type "Transfers between locations" | One row per transfer, no visual duplication |
| INV-22 | Projection of a missing/incoherent leg transfer | History does not group it or hide it; original events are visible |

## Out of reach and next cut

This delivery records only entries for Purchases, transfers and differences by count. It does not generate sales or reservations; it has no lots, maturities, multiple destination location by reception, returns, massive movements, equivalent units, box arching or reserved availability. Nor can it guarantee interdispository attendance.

**Next proposed cut:** inventory improvements by count/lots according to priority, then Sales and Box with stock outflows; TP3 backend with PostgreSQL, API transactions and contracts before operating actual data.
