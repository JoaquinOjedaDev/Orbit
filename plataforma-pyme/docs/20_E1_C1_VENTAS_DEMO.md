# E1-C1 — Express sales and declared payments (DEMO)

**Status:** first implementation published in `main` el 06/11/2026. **There is no execution of build, lint, tests or QA on the user's PC until the lower commands are performed.**
**Design source:** E0-A Z074 (POS) + Z075 (checkout and history) + Plan Integration v4 E1-C1-01/02 + ADR-004/006 proposed. New implementation in React; no inherited iframes or scripts.

## What delivery

- **Sales** en `/b/:businessId/ventas`, accessible from the menu and Start panel.
- **Cart 1..30 lines**: active and enabled items to be sold, including services, with quantity and editable price per line. No external quote service; manual price can be charged when the Catalogue says "To be quoted".
- **Location**: necessary for physical goods; must be active, enabled to sell and store. Sale of only services can register without physical location.
- **Fixed discount** In ARS, discounted after calculating the subtotal, without discounting twice. The first version does not calculate supplier promotions automatically nor does it include tax taxes.
- **Payments declared 1..6**: Cash, Transfer, Account ID, Card and Market Payment declared. The amount of all means **must add up exactly the total**. Amounts and totals are whole cents (BigInt for intermediate products). There is no QR or accreditation check.
- **Impotent registration by requestId**: a double shipment or retry from the same sale within DEMO returns the existing sale; no other stock output applies.
- **Discount of existence** only for physical goods: the gateway refuses to sell more than is available in the chosen location, and each line generates a single projection `VENTA_SALIDA` negative amount within the leadger `listDemoInventoryMovements`. Services do not produce inventory event.
- **Check/history**: seller/company, instant, location or service without location, lines, subtotal, discount, total, means and observations, labeled "DEMO". It is not presented as a tax invoice or real bank accreditation.
- **Home** sample number of registered sales DEMO; Inventory and Movements update balances and allow filtering "Sales exits".
- **Separation by company**: the readings and scriptures are filtered/validated by `businessId` and do not cross catalogues, locations or sales.

## Architecture and compatibility

- `frontend/src/data/demo/salePolicy.ts`: `SaleInput`, `SalePayment`, `SaleLineSnapshot`, standardization, arithmetic of checkout and pure projection of physical outputs.
- `frontend/src/data/demo/demoStore.ts`: `DemoSale`, `salesById`, `registerSale`, `listDemoSales`, optional sales load, serialization and projection of the ledger.
- `frontend/src/data/demo/inventoryPolicy.ts`: incorporates the type of movement `VENTA_SALIDA`.
- `frontend/src/features/sales/SalesPage.tsx`: sales form, divided payments, discounts and voucher.
- `frontend/src/features/inventory/InventoryPage.tsx`: Filter output per sale.
- `frontend/src/features/dashboard/Dashboards.tsx`, `frontend/src/App.tsx`, `frontend/src/App.css`: navigation, indicators, responsive styles.
- `frontend/tests/sale-policy.test.mjs`: 12 unit tests pure of cents, discounts, split, stock and projection of exits.

**Persistence:** exactly holds the key `asistente-pyme.e1a2.demo.v1` and the stored object `version:1`. Add a field **optional** `sales` a `Stored`, without deleting or reconstructing previous profile data, business, Catalog, Locations, Shopping, Inventory or IndexedDB photos. `load` read the previously saved sales before reproducing historical counts so that a pre-count sale does not defigure your balance. Sales have their own IDs and do not write in `inventoryOperationsById`.

**Intentional limits:** localStorage does not offer authentication, secure isolation or distributed lock. DEMO gateway checks memory stocks at the time of registration; **does not serve as proof of two devices or tabs**. In backend FastAPI/PostgreSQL the creation of sale + departures + payments + balance must be made in a transaction with persistent idempotency and effective permits, as required by the TP3.

## Commands in VS Code

From `plataforma-pyme/frontend`:

```powershell
git pull --ff-only origin main
npm.cmd run build
npm.cmd run lint
npm.cmd run test:sales
npm.cmd run test:inventory
npm.cmd run test:purchases
npm.cmd run dev
```

If Vite is already running in the terminal, do not run another `npm.cmd run dev`. URL: `http://localhost:5173/inicio`.

## QA de E1-C1

| Case | Steps | Expected outcome |
|---|---|---|
| C1-01 | Buy/receive 3 units of a good in a location that allows sale and storage | Inventory = 3 |
| C1-02 | Sales → New sale → sell 2 units in that location | Sales are recorded and the balance is increased from 3 to 1 |
| C1-03 | Repeat submit/reintend with the same requestId | No duplicate sale or second discount is generated |
| C1-04 | Try selling 2 from location with balance 1 | Insufficient Stock error, not sold |
| C1-05 | Mixed cart: 1 well and 1 service | Well count stock; service does not require inventory |
| C1-06 | Service company, only 1 service, no location | Valid sale without creating deposit or inventory |
| C1-07 | ARS 50 discount from subtotal ARS 2,500, ARS 1,000 payments + ARS 1,450 | Total 2,450 and split exact |
| C1-08 | Minor/higher payments in 1 cent | Error; no sale confirmed |
| C1-09 | Payment means ‘Payment market (declared)’ | Checker warns that it does not prove actual collection |
| C1-10 | Open voucher, close, return and press F5 | Registration persists; balance is not re-deducted |
| C1-11 | Inventory → Movements, filter "Sales exits" | One exit per physical line with reference to the same sale |
| C1-12 | Go to another company | Sales, products and balances separately by company |
| C1-13 | Edit Catalog and try to change unit of an item already sold | Change that would break traceability is rejected |
| C1-14 | Build + lint + tests | No errors or warnings; record actual result |
| C1-15 | Mobile view, side menu and back | Cart and readable media without blocking navigation |

## Next cut: E1-C2 — Expenditure, Opening and Closure

Build a `CashSession` by company/location/box where applicable and distinguish:
1. Initial cash and cash flows fund; declared digital money belongs to a medium, **No to physical box**.
2. Explicit opening, operational expenses with source of funds, counting and closing with immutable snapshots, date and actor.
3. Prevention of sale against closed day; the lock must be fixed when confirming the cut, not simply when opening the modal revision.
4. Physical return from the fair is a different operation; no downsides or entrances are invented when closing.
5. Market Real payment and QR of item vs QR of collection continue later; OAuth on the seller account of each company and reconciliation with backend.

Keep ADR-005/006 as **Proposed**not to state them approved by the team.
