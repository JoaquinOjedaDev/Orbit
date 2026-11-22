# E1-B6 — Multi-rub (DEMO) Suppliers

**Status:** integrated and published in `main`. **Pending compilation, lint, automated testing and local visual validation.**
**Material received:** `walos_proveedores.html` and directory, tab and form catches; `01_ESPECIFICACION_FUNCIONAL_Y_UX(1).md`, `02_REVISION_TECNICA_RIESGOS_Y_QA(1).md`, `04_DECISIONES_Y_BACKLOG(1).md`.
**Selection E0-A:** visual reference Z073; the integrated shell React is preserved, neither HTML scripts nor their fictitious providers are imported.

## 1. Functional scope

Supplier Directory **por businessId**The only information required is the commercial name (2–90 characters). Other optional fields: description of products/services offered, contact person, telephone, WhatsApp international, email, address/reference, Google Maps link, HTTPS site, Instagram user, accepted payment means and commercial observations.

- Create and edit provider in the context of the current company.
- Search by name, offers, contact, phone, mail, address or observations and filter through Assets/Inactive/All.
- Single name per company, standardised in spaces and capitals, even between deactivated suppliers. The same name is allowed in other companies.
- Deactivate/reactivate with confirmation and **without physical disposal**: the identity of the supplier will not be lost when there is a historical purchase. Purchases not yet implemented.
- Detailed sheet `dialog` native: Escape, button and click out; no handler `close` prone to the StrintMode bug detected in Catalog.
- Explicit actions: open WhatsApp with valid international number E.164 only, telephone `tel:`, `mailto:`, HTTPS site, secure map link or search by validated user address and Instagram.
- ‘Copying contact details’ requires user pulsation; does not include **internal notes and promotions**. If the browser blocks the clipboard, it displays selectable text.
- Multiple payment means: cash, transfer, Market Payment, Identifier Account, card, check, checking account. **methods that the supplier declares to accept**, not company-configured collection accounts.
- Information promotions: up to eight rules with optional selection of days (Monday=0 to Sunday=6), optional average required and textual benefit. **No discounts automatically apply on Purchases**; no guarantee of validity or compliance. The discounted amount is not calculated.
- A business without suppliers is valid; the records start empty in all DEMO companies.
- HTML images/photos, WhatsApp by embedded messaging URL, automatic promotions, links to article and historical fictitious purchases **they don't care** in this cut.

## 2. Technical rules and integrity

- Data isolated by company in `suppliersById` with the business identifier and an internal UID; update/state commands always check `businessId`.
- The key is retained `asistente-pyme.e1a2.demo.v1` and storage version 1; an array is added `suppliers` optional. Preserved `profile`, `createdBusinesses`, `fixtureEdits`, `memberJobs`, `locations`, `teamInvitations`, `teamMembers` y `catalogItems`.
- When loading saved providers, the schema, name, links, promotions, IDs and membership are validated before they are included. If a record is not valid, only that record is discarded.
- No server authorization: localStorage is used only for UX testing, it is not a secure commercial repository.
- External sites: only valid HTTPS URLs without credentials or ports; links `target="_blank"` use `rel="noopener noreferrer"`. Maps reuses `mapsLinks.ts`; WhatsApp does not add prefixes or presuppose country; requires `+<código país><número>`.
- The tab is a **Informational view**. There are no orders, discounts applied, billing, purchases, receipt or stock.
- For backend and TP3: `proveedor.id`, `empresa.id`, logical status, contacts, declarative promotions and purchases with historical reference. Keep FK/tenant and purchase snapshots; never delete history when inactivate provider.

## 3. Code and evidence

- `frontend/src/data/demo/supplierPolicy.ts`: pure field validation, URL, WhatsApp, media and promotions.
- `frontend/src/data/demo/demoStore.ts`: types, compatible persistent reading, CRUD/state, business isolation.
- `frontend/src/features/suppliers/SupplierForm.tsx`: high/sectional edition.
- `frontend/src/features/suppliers/SuppliersPage.tsx`: directory, search, filters, status.
- `frontend/src/features/suppliers/SupplierDetailDialog.tsx`: tab, secure channels, copy.
- `frontend/src/App.tsx`: route `/b/:businessId/proveedores` con remount contextual.
- `frontend/src/features/dashboard/Dashboards.tsx`: access available DEMO.
- `frontend/src/App.css`: responsive styles.
- `frontend/tests/supplier-policy.test.mjs`: regressions for validations and links.
- `frontend/package.json`: `npm.cmd run test:suppliers`.

From `plataforma-pyme/frontend`:

~~~powershell
git pull --ff-only origin main
npm.cmd run build
npm.cmd run lint
npm.cmd run test:suppliers
npm.cmd run test:catalog
npm.cmd run test:maps
npm.cmd run test:team
npm.cmd run dev
~~~

## 4. Manual testing matrix

| ID | Action | Expected |
|---|---|---|
| PROV-01 | Open Suppliers in new company | Empty list, no invented suppliers |
| PROV-02 | Create Provider Only by Name | Valid High, active tab |
| PROV-03 | Complete fictitious offers, contact and phone | Saved and visible on tab |
| PROV-04 | Agregar WhatsApp `+5491112345678` | Link abre `wa.me/5491112345678` in another tab |
| PROV-05 | Ingresar WhatsApp `1112345678` | Validation prevents international formatting |
| PROV-06 | Save HTTPS site and public place maps link | Safe visible links; open only when clicking |
| PROV-07 | Try `javascript:` o URL Maps con host falso | Rejected Saved |
| PROV-08 | Add transfer and cash as means | Shown in the tab as information |
| PROV-09 | Register rule "10% Tuesday/Thursday per transfer" | Visible, without applying changes to prices or purchases |
| PROV-10 | Copy contact and paste into notepad | Name, offer and contacts; **no comments or promotions** |
| PROV-11 | Edit Provider and F5 | Changes retained |
| PROV-12 | Try to duplicate name with other capital letters | Rejection in the same company |
| PROV-13 | Create the same name in another company | Allowed, no cross-recording |
| PROV-14 | Deactivate, Inactive Filter, Reactivate | Preserved sheet, correct counters |
| PROV-15 | Open tab and press Escape | The modal is closed only when requested |
| PROV-16 | Change company during a form | Draft does not crawl to the other company |
| PROV-17 | Change section and return to Profile/Catalogue/Locations | Previous data unchanged |
| PROV-18 | Screen 390 px | Non-overflow readable form, options and tokens |
| PROV-19 | Run build, lint and all test scripts | No errors or warnings |

## 5. Next cut

**Purchases**: optional supplier, informational or related purchase to physical item, prior review, whole amounts, explicit conversion purchasing unit→base unit, atomic reception and idempotence as it evolves backend. The DEMO of suppliers still does not modify inventory or means of collection of the company itself.
