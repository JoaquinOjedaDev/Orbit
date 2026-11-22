# E1-D2 — Frontend integration and preparation of E2

**Product:** Multi- and multi-company SME management platform. **WALOS is just an example business.**

**Scope:** close the E1-A/B/C/D increments, avoid frontend regressions, consolidate QA and prepare for transfer to backend contracts and models. E1-D2 does not add actual payments or authentication.

## 1. Evidence and status

| Area | Evidence | Status |
|---|---|---|
| Shell, menu and context A/B | User manual iterative QA; E2E Playwright by path and drawer | Manually validated; automated E2E |
| Catalog, images and Inventory | Manual QA: Two locations, shared photos and stock persistence | Manually Validated |
| Purchases, reception, transfers and counting | E1-B7/B8/B9 user QA, inventory policy tests | Manually Validated |
| Mixed sales and payments | QA of collections, multiple media, last balance and active accounts | Manually Validated |
| Accounts, Expenditure, Fund | 8 tests of E1-C3/C3.1; existing unit tests and closures | Manually Validated |
| QR DEMO | Creation, F5, cancellation, simulated approval and deactivated product | Manually valid (not real MP) |
| Desktop and Mobile Browser | `frontend/e2e/specs/frontend.spec.ts` / GitHub Actions | IC as a reproducible verification source |

No captures are invented or all browsers are verified. E2E uses **Chromium desktop and mobile**, not Firefox or Safari. The indexedDB photos uploaded by the user do not go up to IC.

## 2. Automated Suite E1-D2

- Navigation between example companies, 404 business and screen "Next".
- Drawer: Keyboard Escape and focus return to the initial button.
- Horizontal width check on key routes on both desktop and mobile.
- Service fee per company; A service does not appear in B.
- QR DEMO with a single half Market Payment declared; its PENDENT state does not create sale; F5 recovers intention; B does not see it; cancel does not create sale; simulated approval creates a sale and retry/persistence does not duplicate it.

**Local execution** (PowerShell, desde `plataforma-pyme/frontend`):

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd run lint
npm.cmd run test:accounts
npm.cmd run test:sales
npm.cmd run test:cash
npm.cmd run test:qr
npm.cmd run test:inventory
npm.cmd run test:images
cd e2e
npm.cmd install
npx.cmd playwright install chromium
npm.cmd test
```

To review the executions and their evidence, consult GitHub → Actions → "PyME Platform · Frontend". `playwright-report` y `test-results` They go up as an artifact if the E2E fails.

## 3. Invariants for the backend

1. `businessId` filters on the server and permissions are verified against real membership, not just by frontend.
2. An inactive product is never sold by approving a previously issued QR; a pending QR does not reserve or discount stock.
3. Sales and inventory participate in the same transaction when confirming, with the power of `requestId`.
4. All payment applications add up to exactly the total in cents; internal statement
5. The last medium can be supplemented by the outstanding balance, without altering previous amounts.
6. Bank accounts/disabled banknotes cannot be used in new operations, but their historical reference persists.
7. Physical box is not mixed with transfers; the closed snapshot is immutable.
8. Photos are associated with the article ID and company, never to the balance/location; they are currently saved only in IndexedDB.

## 4. Explicit limits

- Data continue in `localStorage`/IndexedDB, without secure synchronization between tabs or computers.
- There are no authenticated users, real authorization or external APIs.
- QR is illustrative/non-scanning and approval is a simulation.
- The QR of partial payment, actual reconciliation, stock reserves, production/lots, refunds and real costs are deferred.
- Local DEMO history is not automatically migrated to PostgreSQL: explicit import will be planned after contract definition.

## 5. Exit door towards E2

- Keep frontend React/TypeScript and a replaceable gateway with HTTP client, without rewriting screens.
- E2 should fix entities `User`, `Business`, `Membership`, `CatalogItem`, `Location`, `Supplier`, `Purchase`, `Receipt`, `StockMovement`, `Sale`, `PaymentApplication`, `Expense`, `CashSession`, `FinancialAccount` y `QrPaymentIntent`.
- Next Deliverables: UML of Classes, Transactional Diagrams (Sale/stock/box), SQL Tables, OpenAPI Contracts, Errors, Roles, Repository/Service Pattern and Traceability **at least 5 requirements** of the Programming consignment 2.
- Only after: FastAPI, SQLAlchemy 2.x, Alembic, PostgreSQL, Docker Compose, real log/login, pytest, CI and deploy.

**Functional criterion of E1-D2:** E2E and IC policy paths must pass; the UX user browser test remains a complementary review.
