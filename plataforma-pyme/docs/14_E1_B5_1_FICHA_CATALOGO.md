# E1-B5.1 — Extended catalogue and internal observations

**Status:** code published in `main`. Build, Lint, Tests and Visual QA on the pending team.
**Visual reference:** `catalogo_modulo2(2).html` v8 and user catches of 06/11/2026. **Sin** incorporate pre-established data from the previous prototype.

## Changes made

1. The button **Ver ficha** opens a native HTML modal view `dialog`, compatible with Escape, close and click out of the content. Do not force to exit section or alter main menu of platform.
2. The tab shows header, category, type, status, SKU, price/cost and control unit; it also displays commercial description and high/last modification date saved in DEMO.
3. New field **Internal comments** independent of **Commercial description**. It does not appear on the summary card or in search results, only on the tab and in its edition. It is limited to 600 characters.
4. The tiles that existed before E1-B5.1 retain their data; when they are loaded, observations are normalized as empty text. The key to local storage, version, IDs, or other modules was not changed.
5. The tab explains what will be integrated after: photos, components/guides and suppliers; stock and maturities **do not appear as DEMO figures invented**.
6. A service still has no physical stock. No sales, purchases, recipes, vendor data or functional permits were created.
7. The function of observations is **organizativa, no confidencial**: The prototype uses local browser storage without security or server authorization. When backend is in place, real permissions will be required to read/edit internal notes.

## Files

- `frontend/src/data/demo/catalogPolicy.ts`: field `observations` en `CatalogInput`, limit and failback for old chips.
- `frontend/src/data/demo/demoStore.ts`: validates existing records with or without observations.
- `frontend/src/features/catalog/CatalogPage.tsx`: field edition and tab opening.
- `frontend/src/features/catalog/CatalogDetailDialog.tsx`: modal view component, independent of the catalogue.
- `frontend/src/App.css`: responsive styles of the modal.
- `frontend/tests/catalog-policy.test.mjs`: new cases of separation and migration.

## Local verification

From `plataforma-pyme/frontend`:

~~~powershell
git pull --ff-only origin main
npm.cmd run build
npm.cmd run lint
npm.cmd run test:catalog
npm.cmd run dev
~~~

Interface testing:

| Case | Action | Expected |
|---|---|---|
| CAT-F01 | Open existing Hairdressing tab/Service | Previous data; empty observations, no price changes |
| CAT-F02 | Edit tab and complete comments | Save; shown only in expanded tab |
| CAT-F03 | Change comments and description separately | They don't replace each other. |
| CAT-F04 | Open tab, press Escape | The modal is closed, back to the catalogue |
| CAT-F05 | Open tab, click out | Closes without discarding tab |
| CAT-F06 | Open tab, press Edit tab | The form of the same company is closed and appears |
| CAT-F07 | Change company and go back | Do not drag or mix the tab and its observation |
| CAT-F08 | Reload F5 | Old catalogue data and new observations persist |
| CAT-F09 | View service in modal | No fictitious stock |
| CAT-F10 | Mobile display | Modal queda dentro del viewport y permite scroll |

## Postergado

Photos 0.3 with main, secure image storage, barcode, recipes/components, guides, suppliers, inventory and verified audit. These are valuable concepts of HTML v8 but will be done after integrating entities and operations, avoiding fake or invented stock metric URLs.
