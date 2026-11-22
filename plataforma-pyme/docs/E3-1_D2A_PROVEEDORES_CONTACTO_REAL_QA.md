# E3-1D2A — REAL Suppliers: Identification, Contact and Editing

**Date:** 2026-11-12.
**Base:** PR #52, feature/e3-1d-catalogue-suppliers-visual, stacked on PR #51 and PR #50.
**Rama:** feature/e3-1d2a-suppliers-contact-real.
**Status:** independent cut for PR DRAFT, without merge to main or modification of local bases.

## Scope

The REAL Providers form is completed with the fields already existing in FastAPI/PostgreSQL: business name, contact person, products or services offered, telephone, international WhatsApp, email, address, Google Maps, HTTPS website, Instagram and observations. Only name is required.

- Creating and editing open an exclusive screen, with Return to suppliers at the top; they do not expand under the list. Cancel discards draft.
- Edit preloads the server confirmed provider data.
- The tab keeps your data reading and offers Edit Provider only to members with permissions. Cards also allow Edit.
- The form includes the option Use your commercial phone for WhatsApp, but the resulting value must be international.
- Lengths, mail, phone format, name standardization, official Google Maps URL, HTTPS public website, uniqueness of the name and backend permissions are respected.
- POST and PATCH save the E3-1D2A fields in PostgreSQL; after confirming the script, the page is re-checked. If that reading fails, writing is not repeated.

## Invariants

1. No model changes, migrations, backends, routes or permissions. Gateway typed adds createSupplierDetailed and updateSupplierDetails, but preserves createSupplier(name) and changeSupplier for regressions and purchases.
2. Only 11 identification and contact fields are sent. **Nunca se sobrescriben payment_methods ni promotions** when editing; that work is left exclusively for E3-1D2B. Nor are status, ID, business_id or other protected attributes sent.
3. A provider is tenant-scoped. contact_person is free text for information, not a platform account or membership.
4. No purchase, sale, inventory balance, voucher, bank account or QR is created.
5. Providers do not have a replay/idempotency key for POST. Uncertain network result implies blocking new attempts until consultation; do not duplicate.
6. No DEMO storage, files or photographs are imported. No changes in main or local user base.

## QA

- Unitary test new frontend/tests/supplier-contact-real.test.mjs: POST/PATCH of the eleven fields, promotion/payment protection, validation errors, HTTP 403/404/409/422 and uncertain network response without forwarding.
- npm run test:supply-real includes these tests and existing purchases/receptions.
- E2E frontend/e2e/real/catalog-suppliers-visual.spec.ts is expanded with high complete, preloading, cancellation, PATCH and F5/GET check, on an ephemeral basis controlled by SMEs_DISPOSABLE_QA=1.
- CI: frontend build/lint/unit/E2E, y full-stack con PostgreSQL 16.

## Manual revision

1. Create test provider with all fields; check tab and list.
2. Open Edit, preload, cancel and return: the draft should be discarded. Repeat, save, reload and check persistence.
3. Check messages with WhatsApp without prefix, unofficial link to Maps, email and duplicate name.
4. With member without permissions, confirm absence of creation/editing and ban by backend.
5. Check mobile responsibility and that no changes were made to purchases, inventory, promotions or means of payment.

## Deferred

E3-1D2B will integrate informational payment means and promotions per day, half and profit, with separate regression. Later: real photo, several contacts linked to a provider and history of purchases by supplier.
