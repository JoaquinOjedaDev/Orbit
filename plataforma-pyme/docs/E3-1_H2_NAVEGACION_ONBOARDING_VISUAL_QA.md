# E3-1H2 — Navigation and first REAL configuration

**Date:** 12/11/2026  
**Rama:** `feature/e3-1h2-navegacion-onboarding-real`  
**Base:** `feature/e3-1h1-inicio-onboarding-real` (PR #60), stacked on E3-1G (PR #59).  
**Initial status:** PR for draft revision, **sin merge a main**.

## Targeted scope

1. **Side menu against desktop** (expanded width 254 px, contracted 76 px).Icons remain usable; each button retains accessible name and tooltip.
2. **Recovered space for content:** menu, top bar and content are aligned using the same CSS variable. No browser zoom required.
3. **React memory only preference:** The contraction survives navigation between modules and companies during the session; it is restarted when logging in or logging out. LocalStorage, cookies, IndexedDB or backend are not used for visual status.
4. **Mobile:** The full side opening menu continues to work, with overlay, Escape, focus trap and close when navigating. Desktop contraction does not alter the mobile menu.
5. **Company discharge:** after the confirmed FastAPI response and satisfactory cleaning of the idempotent record, it is automatically navigated to `/real/empresas/:id/inicio`. The existing data path of the company is preserved for manual access and compatibility.
6. **Orientation messages** in an empty list and a new company form: it explains what will happen after creating and that the services do not require physical stock.

## Preserved rules

- H1 is preserved without changing its three-step model, its GET queries or the appearance of Start.
- No changes are made to FastAPI, PostgreSQL, Alembic, endpoints, RBAC, commercial operations, sales, POS, inventory or idempotency.
- No actual activity is inferred from DEMO or false data; authentication session exclusively in memory.
- Uncertain creation attempts remain recoverable through existing IndexedDB and **no** Redirect until discharge is confirmed and registration discarded.
- No merger of PR #59, #60 or this PR is authorized without revision and approval.

## Automated QA

New E2E test `e2e/real/e3-onboarding-h2.spec.ts` about disposable API and PostgreSQL (variable `PYME_DISPOSABLE_QA=1`):

- Registration and login of a QA account.
- Creation from the interface, checking redirection to REAL Start and initial progress 0/3.
- Collapse and expand menu on desktop, using accessibility and CSS dimensions.
- Browse to Catalog while retaining the contracted menu.
- Check mobile menu at 390 px, readable text, close after browsing and no overflow.
- Check that navigation does not cause POST to inventory, purchases or sales.

Required regression: `npm run build`, `npm run lint`, `npm run test:auth`, `npm run test:businesses` and existing REAL E2E. For Windows, run from `plataforma-pyme/frontend` con `npm.cmd` when necessary.

## Manual visual review (acceptance criteria)

1. With an existing company and widescreen, click **Collapse Side Menu**. Verify that only icons remain, the central area is expanded and no button is inaccessible. Pass cursor to identify sections.
2. Change of section and company: visual state is preserved **only during the session**; no data from another company appear.
3. Expand and verify that labels, titles and workspaces return to your usual presentation.
4. With width close to 390 px, press **Open Menu**, navigate and close with Escape; you should see the full text and do not appear horizontal scroll.
5. Register a new account and create your first company. You must open **Home** automatically; the initial guide shows **0 of 3 preparations** and allows you to configure locations, catalog and physical inventory when applicable.
6. Log out and re-enter: Visual preference is expanded again. F5 retains the previous policy: it requires to be authenticated again.
7. With services companies only, Home maintains **2 of 2 preparations / No stock required** when your required steps are resolved.

## Separate integrity check: ‘Fruit pack’

Validation of the backend `app/modules/purchases/adjustment_service.py` excludes `CatalogItem.item_type != "BIEN"`even for `STOCK_INICIAL`. There is already a rejection test for service adjustments in `test_adjustment_api_integration.py`.

**Only to be observed with:** contrast the `business_id` y `catalog_item_id` The service is visible with those of the initial stock operation. If they coincide, investigate the historical origin or classification; if not, they are different records. **Do not edit or delete data** as part of H2.

## Proposed next sub-blocks

- **H3:** improve messages and empty states in the first modules (Locations, Catalog, Inventory, Equipment) and run QA transverse navigation/permits, retaining current contracts.
- Real financial indicators, Box/Accounts, QR Market Payment, photos and new features **are not part of** They do not activate for visual reasons. They require evaluation and separate blocks.

## Closure

Pass only after IC and human review. Keep this PR as **DRAFT** and stacked on PR #60 until dependencies are integrated in order.
