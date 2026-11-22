# E3-1E1 — REAL Purchases: Listing and form in independent views

**Base:** `main` integrado en commit `03fa329` (PR #50–#54).  
**Rama:** `feature/e3-1e1-compras-visual-real`.  
**Status:** initial visual increase of E3-1E, for manual revision in draft PR.

## Objective

To adapt the REAL shopping load to the approved interaction for Locations, Catalog and Suppliers: a list view and an exclusive high screen, with navigation to return. To fully preserve the existing rules of purchase, reception, idempotency and stock.

## Includes

- Business head, security card indicating that a purchase does not move stock, indicators **only of loaded purchases** and local search by reference/supplier, filter by status and more readable cards.
- `Registrar compra REAL` opens a separate screen that hides the listing; `Volver a compras` y `Cancelar` They rule out the unsending draft.
- The form retains date, supplier, lines, unit cost, total exact editable, validations, availability of more pages, indexedDB consent, registration and retry with pre-existing identity.
- **Recovered pending operation:** is kept visible as a form. Return/Cancel is disabled until the intention is completed or resolved: the local registration is never quietly deleted.
- Headers/focus in return for view, responsive card design and isolated styles `e3-purchases-*`, regardless of DEMO elements.
- **No change** in gateway, backend, bases, migrations, roles, contracts, purchases, reception, leader, nor key `Idempotency-Key`.

## Timely correction approved in manual QA: name of the responsible

The visual review of E3-1E1 Purchases was functionally accepted. Proof of receipt was requested to show the person's name rather than privilege his UUID.

- Two different authors are shown: **‘Registered purchase’** linked to `purchase.created_by_id` y **‘Received’** linked to `receipt.confirmed_by_id`. Do not suppose that they were necessarily the same person.
- The identity of the connected user is only used when its UUID matches the corresponding audit field. For other members, the **current profile name** with the actual list of company memberships only if `canReadTeam(business)` FastAPI remains the authority for reading that directory.
- If the name is not queryable for the role or is no longer available, display **‘Name not available’** instead of inventing an attribution or revealing the private list of the equipment.
- The UUIDs of the author of purchase and reception are retained, but remain exclusively within **‘Trafficking identifiers’** for technical review.
- No fields are added to the purchase/reception contract, no deeds, migrations or changes of permissions; receipt is still read-only.
- Unitary tests ensure that the author of purchase and the recipient are shown separately, without assigning the session name to another UUID. Behavior for people without equipment permission remains restricted.

**Known limitation:** names correspond to the current membership profile, they are not an immutable historical snapshot of the name at the time of operation. To resolve historical names of actors who cannot consult the directory requires a later backend/permit decision.

## Scope of this first part

The selection and confirmation of reception view is preserved as it was (still under the list), so that no high visual migration is mixed with irreversible flow of stock movement. **E3-1E2** board reception/check in exclusive views with recovery review after timesouts and F5.

## Validation

- E2E new in `frontend/e2e/real/purchases-visual-navigation.spec.ts` with Disposable PostgreSQL: list, filter by status, search, creation of draft, Cancel/Back, absence of POST in cancellation, focus and 390px.
- Ejecutar build, lint, scripts de supply REAL, suite E2E y full-stack PostgreSQL.
- Manual QA without irreversible operations: check button Register, form and cancellation; receptions with stock only on disposable basis.
- No fusionar a `main` without subsequent review and authorization.
