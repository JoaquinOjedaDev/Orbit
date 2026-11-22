# E3-1D — Catalog and Suppliers: REAL visual design and QA

**Date:** 12/11/2026  
**Stacked base:** PR #51 E3-1C3, still not integrating main; PR #50 is dependent on #51.  
**Rama:** feature/e3-1d-catalog-suppliers-visual  
**Functional source:** frontend React REAL y gateways FastAPI existentes, no los HTML DEMO.

## Objective

After the approved review of E3-1C3, the management UX should use **exclusive views**: cards remain in the list, but create, edit or view a tab replaces content with a separate screen with **«Volver»** up; forms under cards are not expanded.

## REAL Catalog

- Header, summary of tabs **loaded** (total, active, inactive) and cards with name, type, category, unit, SKU, sellable, prices and status.
- Search by name/SKU, filter by type/state, **only within pages consulted**Never suggest that the whole catalogue was searched when possible pages remain.
- **Ver ficha** accessible to those who can consult: real data and texts without launching mutations.
- **Create article / Edit** open dedicated views, with current preload in editing and cancellation that does not write.
- Keep compatible type/unit, exact cents, validation, 409 and recovery from uncertain result. Confirmed save returns to list and re-checks first page because the name affects order.
- No real photos, no DEMO storage, no invented stock. No endpoints added.

## REAL Suppliers

- Heading, total **Loaded**, status, local search, contact details tabs that effectively delivers FastAPI.
- **Ver ficha** opens consultation screen with contact, phone, mail, address, WhatsApp, web, Instagram, Maps, offers and notes, if they exist; without editing or generating fictitious data.
- **Add Provider** opens an exclusive high view, **only by commercial name**, because it is the only thing that implements the REAL gateway of this screen. Cancel does not make POST, save returns to list if operation and checkout were successful.
- Enable/disable retains the existing confirmation dialog and current API.
- Do not submit fake edition of contacts, promotions, payment means, payments or QR. Do not generate purchases automatically.

## Invariants

1. Do not touch backend, schematic, migrations, permissions, roles, cross-tenant caches or shell routes.
2. No DEMO data is mixed with the REAL API; all data, including counters, are calculated from the tenant and pages actually viewed.
3. Doubtful scriptures block automatic retrying and require safe conversion; do not duplicate high.
4. The selection of companies goes back to the components, eliminating drafts from another company.
5. Buttons with focus and pulse status, dedicated views, keyboard navigation and respond to 390 px.

## Testing and review

- **New E2E:** e2e/real/catalog-suppliers-visual.spec.ts, only in PostgreSQL ephemeral: cards, filters, tab, preload and cancellation, high REAL, navigation, mobile, no fictitious sales/stock.
- **Regression:** business-crud-persistence.spec.ts updated to access the new dedicated supplier form, without altering CRUD expectations.
- **Required CI:** build/lint/frontend, E2E Chromium, backend/postgres full-stack and regression DEMO.
- **Manual QA before merge:** catalog with test items of different types; verify local search, change of price with authorized role, cancellation; supplier with real or incomplete data; creation and return; mobile/scritory.

## PR units

This PR is based on PR #51 E3-1C3. Do not merge C2, C3 or D without express permission; validate changes first and then approve sequential integration. Do not modify the local user base.
