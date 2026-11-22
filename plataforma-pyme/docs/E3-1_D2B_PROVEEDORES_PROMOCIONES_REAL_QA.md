# E3-1D2B — REAL Suppliers: means of payment and promotions per day

**Date:** 2026-11-12.
**Base:** PR #53 E3-1D2A, branch feature/e3-1d2a-suppliers-contacts-real. Depends on PR chain #52 → #51 → #50.
**Rama:** feature/e3-1d2b-suppliers-real promotions.
**Status:** for visual and functional QA. No major or changes to the user base.

## Objective

Re-use existing PostgreSQL JSONB and FastAPI Provider support to allow you to select accepted payment means and register up to eight informative promotions. **your own list of days (Monday to Sunday), optional payment means required and description of the benefit**. The form mimics the DEMO experience, without copying DEMO storage.

## Scope

- Accepted media: Cash, Transfer, Market Payment, Account ID, Card, Check and Current Account. Multiple selection without duplicates.
- Promotional rules: add/remove up to 8; standalone days for each rule, required average (or "No specific medium") and mandatory benefit of 3–160 characters.
- Backend days: 0 = Monday, 1 = Tuesday, ... 6 = Sunday; ordered when validating. **Empty day arrangement means no days were specified** (reported as ‘any day’ on the tab, without automation).
- Promotion identifiers: UUID generated when creating each rule and preserved in editing; never use preset DEMO IDs.
- The contact information of the D2A block and payment_methods/promotions is included in high POST. In PATCH edition, the complete set of these fields is sent; JSONB block arrangements are replaced as required by the service.
- The View tab view shows methods, benefits, applicable days and a half required for each promotion. Edition opens dedicated view with Return; Cancel discards all draft.
- Required medium and accepted medium are modeled separately, as set out in the API contract; the UI does not establish mandatory relationship between both without backend support.

## Invariants

1. Backend, Pydatic, Alembic, PostgreSQL and business permissions are unchanged.
2. No discounts, promotional prices, fees, settlements, QRs, inventory movements, sales or purchases are created. These are informational data provided by the supplier.
3. The form never sends tenant, status or provider identifier attributes as editable fields. Each promotion does include its own UUID, days, payment_method and benefit.
4. Only AVIAR_AMINISTRATIVO or AMINISTRATOR of active company can create/edit (final authority in FastAPI). Worker or other company can only see what their roles allow.
5. No POST/PATCH replay of the provider: if the network fails with uncertain result, the forwarding is blocked until it is checked. If the confirmed POST/PATCH is followed by a GET failure, it is not rewritten.
6. D2A methods for isolated contact remain unchanged: they continue to send only the eleven contact fields, and procurement legacy methods are maintained.

## Validation

- Frontend TypeScript/Vite build y Oxlint.
- npm run test:supply-real now also includes frontend/tests/supplier-promotions-real.test.mjs: exact POST/PATCH format, valid days 0–6, duplicate values, limits, IDs, preservation of protected fields, 403/404/409/422 and uncertain network without forwarding.
- E2E frontend/e2e/real/catalog-suppliers-visual.spec.ts: create provider with payments and promotions, inspect tab, cancel day edition, edit days and benefit, add second rule and check persistence after reloading and consulting API. Use SME_DISPOSABLE_QA=1 on ephemeral PostgreSQL.
- Manually check 390 px, 768 px and desktop; keep in mind that the selection of days and means does not apply money on Purchases.

## QA manual

1. Create test provider, mark Cash and Market Payment, add a promotion for Monday/Wednesday/Friday, with required average Market Payment and benefit.
2. Save: View tab should show means, days and benefit.
3. Edit: check preload. Change days, cancel and reopen: the draft should not persist.
4. Edit: add another promotion (e.g.Tuesday, Transfer), save, reload and check both rules.
5. Remove a rule, save and check that you removed it from PostgreSQL. Verify that another company does not see it and that there are no commercial movements.
6. Test validation: empty benefit, more than eight rules, independent days and mobile responsive.

## Close visual review and warning (12/11/2026)

The user tested Catalogue and REAL Suppliers, confirmed the operation of the card, means of payment and promotions for days, and approved the current design without yet requesting a new aesthetic iteration. No change of card structures, contracts or rules of commerce.

Warnings found in the QA environment:

- Two imports of unused types on the E2E route of purchase → sale: are eliminated without changing the test.
- React Compiler omitted to optimize a POS hook for a dependency `location` derived from a list created on each render: stabilises with `useMemo` the list of authorized locations and the selected headquarters, preserving the same filters, permits and results.
- Vite issues a bounle warning for an initial chunk JS of approximately 802 kB: it is a non-blocking performance warning, not an error. **Deferred**: analyze lazy loading by section and impact on shell/login/QA before entering code splitting. Do not artificially hide the notice by increasing the limit.
- The documentation and evidence of QA should record the outcome of IC after these adjustments, without claiming that the suite executed if it is still pending.

**The order of integration is maintained** of the stacked PR (#50 → #51 → #52 → #53 → #54) and this functional approval is not interpreted as automatic authorization to modify `main`.

## Integration

PR stacked DRAFT against the E3-1D2A branch, not against main, without automatic merge. IC required, QA manual and express approval of PR #50 → #51 → #52 → #53 → #54, in order.
