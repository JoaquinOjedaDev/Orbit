# E1-B5 — General Catalogue of Products and Services (DEMO)

**Status:** code published in GitHub main. Build, lint, test and local visual tour PENDENTES.
**Base:** E0-A Z069 (catalogue_modulo2.html), Z050 (M2 v5.1), functional specification of module 2 v5.1, E0-C E1-B2-01 backlog and proposed ADR-004.

## Scope

A multi-rubre catalogue was integrated by company. WALOS is only a fixture and does not determine the content or mandatory names.

- **Own development, Resale, Input/material and Service** are different types of behavior from the visual category.
- Mandatory name, type, free category, optional SKU, control unit, description, optional price and optional reference cost. Independent field to indicate if offered for sale.
- A service uses SERVICE and **never creates physical existence**. The creation of any item also does not create stock, box, purchase, supplier or recipe.
- Single SKU **per company** When reported, standardized to capital letters. It can be repeated between companies. Internal identity uses an independent UUID.
- Single name per company ignoring repeated and capitalized spaces; not reused as long as there is an inactive tab with that name.
- Price and cost in **ARS whole cents**. The form admits amounts like 1250.50; 1250.50; 1250. Without thousands separators. Empty is equivalent to uninformed or listed.
- The box, package, kg, gram, unit, ml or liter units do NOT imply automatic equivalences.
- Search for name, description, SKU or category; filter by type and status. Save edit, disable/reactivate with confirmation without deleting history.
- Existing companies leave with empty catalog; no products from the original HTML are imported as real business data.
- Type and drive editing is allowed during DEMO because there are no associated movements yet. Before sales/inventory the server must block or reverse incompatible changes.

## Code

- frontend/src/data/demo/catalogPolicy.ts: types, units, validations, whole cents and normalization.
- frontend/src/data/demo/demoStore.ts: DemoCatalogItem indexed by ID, businessId read, high/editing/state commands with company membership.
- frontend/src/features/catalog/CatalogPage.tsx: form, cards, filters, detail, inactivation/reactivation.
- frontend/src/App.tsx: path /b/:businessId/catalogue; key per business to not transfer drafts.
- frontend/src/features/dashboard/Dashboards.tsx: acceso y cantidad de fichas activas.
- frontend/src/App.css: responsive design.
- frontend/tests/catalog-policy.test.mjs: pruebas de dinero/SKU/tipos.
- frontend/package.json: script npm.cmd run test:catalog.

## Persistence

The wizard-pyme.e1a2.demo.v1 key is retained with version 1; optional array items are added. Old reading preserves profile, createdBusinesses, fixtureEdits, memberJobs, locations, teamInvitations and teamMembers. No real authentication or permission control.

## Pending verification

From the platform-pyme/frontend folder:

~~~powershell
git pull --ff-only origin main
npm.cmd run build
npm.cmd run lint
npm.cmd run test:catalog
npm.cmd run test:team
npm.cmd run test:maps
npm.cmd run dev
~~~

| ID | Test | Expected outcome |
|---|---|---|
| CAT-01 | Open Catalogue in a company created | Empty, without invented products |
| CAT-02 | Create a quote service | Service unit, zero stock of own |
| CAT-03 | Create SKU-01 resale, price 1250.50 | ARS Amount Displayed; Saved Code |
| CAT-04 | Create Input without offering sale | Non-mandatory price |
| CAT-05 | Repeat SKU in the same company | Rejects duplicate |
| CAT-06 | Repeat SKU in another company | Allowed |
| CAT-07 | Repeat name by changing capital letters | Rejects duplicate |
| CAT-08 | Edit and Press F5 | Save Changes |
| CAT-09 | Deactivate, filter Inactive and reactivate | Reserved tab, change counter |
| CAT-10 | Switch from A to B during editing | Do not mix drafts |
| CAT-11 | Reopen Profile, Equipment, Locations and Maps | Previous data intact |
| CAT-12 | Enter 1,234.50, -10 or three decimal places | Rejects ambiguous/invalid amount |
| CAT-13 | Mobile width 390 px | Leafable filters and cards |
| CAT-14 | Build, lint y tres test scripts | Zero errors |

## Out of this cut.

Photos and gallery 0–3, barcode, images, components/recipes, production guides, suppliers, physical stocks, maturities and operations. They will be addressed in subsequent increments, preserving the requirements of TP3.
