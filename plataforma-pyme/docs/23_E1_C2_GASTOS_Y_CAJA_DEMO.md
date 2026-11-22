# E1-C2 — Expenditure and opening/closing of the Box · First vertical DEMO

**Date:** 2026-11-06. **Status:** code published in `main`; `build`, `lint`automated testing and browser QA **outstanding local implementation**. **References:** Plan v4 E1-C2, ADR-005/006 proposed, HTML Z075/Z092/Z093 and E1-C1 Sales. No other general audit was performed.

## Functional delivery

### Expenditure (`/b/:businessId/gastos`)

- Single manual recording of operating expenses with date, category, concept, ARS amount, optional location, means of payment and observations.
- **Payments declared:** Cash, Transfer, Account ID, Card, Market Declared Payment and other means. Bank is not consulted, funds are not transferred or balances are verified.
- The expense is not confused with a purchase; registering in Purchases does not produce an automatic financial outflow. A purchase is not paid twice for navigation or receipt of goods.
- Expenditure does not alter Inventory or generate receptions.
- Expenditure **cash** automatically associate with the day **OPEN from the same location or general box**, if it exists at the moment of registration; if it does not exist, they are identified as ‘Out of Box’ without modifying previous closures.
- A higher than expected cash outflow from an open box is rejected; no negative balance permit.
- History by company, with search, filter medium and historical totals. Idempotency `requestId` avoid double registration by retry.

### Box (`/b/:businessId/jornadas`)

- Opens a `CashSession` con **active location enabled to sell** or with **general box** (without physical location), and initial cash fund expressed in cents.
- One day **OPEN BY PLACE** maximum. Time sequence of days is allowed after closing each; not ‘opening’ the old one.
- Las **New sales** registered during a day are associated by ID, never by mere coincidence of date. If there is no open day, Sales continues to work to preserve compatibility with E1-C1, but the voucher shows "No linked day" and that cash does not enter the arching.
- Only the amount `EFECTIVO` of divided payments and only expenditure `EFECTIVO` linked count for expected physical cash.
- **Expected cash = initial fund + associated cash sales − associated actual expenses.** BigInt is used for intermediate calculations and whole cents.
- Closing requires introduction **cash**. If there is a difference, it also requires **reason**. The button that opens the arching form does not block Sales. Confirmation of closing takes the current set of movements and saves it together with the CLOSED state in a single local snapshot change.
- **Unchangeable snapshot:** Opening, effective sales, actual expenses, total expected, counted, difference, reference to sales/expenditures, actor, date and observations. There is no change/reopen button or closure "unverified".
- Retry closing with the same `closeRequestId` returns the closure already persisted; with a different key is rejected.
- A closing does not return trade fair inventory, does not alter bank balances or move cash to accounts.

### Architecture

`src/data/demo/cashPolicy.ts`: `DemoCashSession`, `CashCloseSnapshot`, `DemoExpense`, categories, means and pure arching projection.
`src/data/demo/demoStore.ts`: status per company `expensesById` y `cashSessionsById`, `openCashSession`, `registerExpense`, `closeCashSession`, selectors, migration compatible with previous data and optional link `cashSessionId` en `DemoSale`.
`src/features/cash/ExpensesPage.tsx` y `CashSessionsPage.tsx`: DEMO screens. Navigation via `App.tsx` and been to Home.
`tests/cash-policy.test.mjs`: 12 pure tests, accessible with `npm.cmd run test:cash`.

**Compatibility:** holds key `asistente-pyme.e1a2.demo.v1` y `version: 1`. New optional persistence arrays `expenses` y `cashSessions` do not replace `profile`, companies, locations, catalog, sales, purchases, inventory or indexedDB images. Old sales without `cashSessionId` are not incorporated retroactively into the box. The closures are loaded with their snapshots without recalculating them in each query.

## QA of acceptance

From `plataforma-pyme/frontend`, not do another `cd` If you're already there:

```powershell
git pull --ff-only origin main
npm.cmd run build
npm.cmd run lint
npm.cmd run test:cash
npm.cmd run test:sales
npm.cmd run test:inventory
npm.cmd run dev
```

| Case | Action | Expected |
|---|---|---|
| CARTON-01 | Open day «San Martín Feria» with $10,000 initials | Open state, expected $10,000 |
| CARTON-02 | Register $3,000 cash for sale $2,000 and transfer $1,000 from that location | Expected cash $12,000; no cash transfer |
| CARTON-03 | Register $500 cash expense at that same location | Expected cash $11,500 |
| Caja-04 | Register transfer expense of $700 | History expenditure; expected cash remains $11,500 |
| BOX-05 | Spend $12,000 cash from that box | Rejection for insufficient funds; no duplicate discharge |
| BOX-06 | Close with count $11,500 | Snapshot with difference $0 and references to sale and expense |
| Caja-07 | Close with $11,000 for no reason | Rejection; adding motive allows difference -$500 |
| BOX-08 | Check Close, Press F5 and Open Again | Same amounts and references; not recalculated |
| BOX-09 | Trying to close the same day again | No other closure is generated; snapshot cannot be edited |
| CARTON-10 | Open a new day in the same location | Allowed; does not carry sales/expenditures from the previous |
| CARTON-11 | Register sale at another location or company | No current cash-in effect |
| Caja-12 | Cash sales recorded before opening the day | It still exists but does not enter the arching |
| BOX-13 | Service company without locations: open general box, sell only one service | The EFFECTIVE part is linked without creating location or stock |
| CARTON-14 | Buy/receive goods and close box | Purchase is not counted as money paid or stock off |
| CARTON-15 | Search for Expenses, check mobile, open menu, browse Sales | No information lost; no bank buttons "collected" |
| BOX-16 | Ejecutar build/lint/tests tras `git pull` | No errors. Register result observed, do not presume |

**Explicit DEMO limit:** operations are synchronous in a tab on a shared local store; `localStorage` does not implement transactions between multiple devices/checks, user isolation or server box lock. TP3 will require atomic transaction in FastAPI/PostgreSQL to create Sales/Expense/Close Session with time restriction and role/location authorization. Digital is not reconciled from external balances; QR is distinguished from QR item of collection. Each company will link its own Market Payment account at a later stage of backend.

## Next Unit: Accounts and Means of Payment

Add entities by company `FinancialAccount` / `PaymentChannel`, with title, bank/alias/CBU/CVU optional, status and permissions. **A bank account is different from a physical cashier**: will never add cash sales to the balance of a wallet. Avoid linking an expense to an unregistered account, or infer declared bank payment movements. After this court you can relate accounts with outflows, sales and real integration of MP OAuth + QR, without changing historical cash snapshots.
