# E3-1H1 — Company start-up and onboarding REAL

**Date:** 12/11/2026. **Project:** Multi-rubor orbit/multi-enterprise.  
**Workbase:** rama `feature/e3-1g-pos-ventas-visual-real`, commit `e52f502`, with PR #59 pending integration.  
**Own branch:** `feature/e3-1h1-inicio-onboarding-real`. PR DRAFT contra E3-1G; sin fusionar ni modificar `main`.

## Objective
Implement **REAL Home** and a first step guide supported by FastAPI/PostgreSQL without copying DEMO, without inventing sales, amounts, KPIs or stock, and without modifying permissions, contracts or writing processes.

## Functional scope
- New path: `/real/empresas/:businessId/inicio`accepted by `RealAuthApp`The route, shell and side menu. `/real/empresas/:businessId` remains Company Data to preserve existing navigation and testing.
- From Company Data there is a button **Start and first steps**; the new REAL menu includes **Home**.
- Title, name, heading, role and status come from `GET /businesses/{id}`; the entire page is isolated by company, with remount of shell, AbortionController and session exclusively in memory.
- The guide checks in this order:
  1. **Location:** there is at least one active location, through `GET /locations`.
  2. **Catalogue:** there is at least one item or service active and sellable, through `GET /catalog`.
  3. **Physical inventory:** if there are physical goods sold, a positive balance of one of them is sought in an active headquarters with capacity STORE, through `GET /inventory/balances`. If the catalogue sold is exclusively serviced and complete, it is marked **No requiere stock** (not interpreted as non-existent inventory).
- The steps are determined in each query, cannot be manually dialed. The bar shows how many steps have been checked as prepared, **no** certifies that all commercial operations can be carried out.
- Catalogue and inventory queries with 100 pages and 5-page limit (500 records per resource). When the query is incomplete, a missing person is never represented as zero. 403 responses and network errors leave status **Not verified**; 401 invalidates the session.
- REAL Shortcuts to Suppliers, Purchases and Receptions, POS and History; Panel **no** generates purchases, sales, initial stock or invitations. The user does the operations from his modules, with existing authorizations.
- Desktop and mobile responsiveness; accessible focus and semantic controls; no fictitious images or `demoStore`.

## Deliberate restrictions
- Sin endpoints o migraciones nuevos.
- No financial indicator panel or profit estimate; no balance is calculated from purchases.
- No Cash/Accounts/Expenditure/Reservations/Real QR is introduced; they remain deferred.
- No shortcut to create `STOCK_INICIAL` without consulting roles and inventory policy.
- A user without writing permission can check the steps that the API authorizes. Buttons navigate to REAL modules, they do not grant privileges.
- There is no image storage or business logos.
- The semantics of F5 is preserved: session only in memory; you have to re-enter to consult again.

## QA and acceptance
1. Newly created company: Start shows 0/3 and the three steps in slope when queries are complete and empty. No POST is generated from browser.
2. Register an active location and a physical item for sale in the disposable DB: after "Update from API" it shows 2/3; it does not assume that there is stock.
3. Register initial stock explicitly by API on the disposable base: when updating, 3/3 are displayed.
4. Company with only services: 2/2 and **No requiere stock**- No, no. No, no, no, no, no, no, no, no, no, no.
5. Different B Company: the selector changes tenant and returns to 0/3; no A resources appear. The shell removes the page and aborts old readings.
6. Partially pagulated catalog or GET 403: the panel must indicate **Not verified**Never real 0 by inference.
7. Keyboard, 390 px mobile, no horizontal scroll; direct URL navigation and return; after F5 login required.
8. `npm.cmd run build`, `npm.cmd run lint`, `npm.cmd run test:auth` and E2E REAL suites in PostgreSQL disposable. No commercial proof of writing against the usual local base.

## Next planned subblocks
- **E3-1H2:** context guide for improved configuration/navigation of screens and empty states, without duplicating forms or enabling new permissions.
- **E3-1H3:** evaluate additional REAL indicators, only where sufficient contracts exist, well-founded KPIs and validation of scope.
- Photographs from Catalog, Bound optimization, Box and REAL QR are out of this PR.

**Integration criterion:** PR in stacked draft above #59. Do not merge before IC and human revision.
