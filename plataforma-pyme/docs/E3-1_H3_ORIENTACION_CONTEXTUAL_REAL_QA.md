# E3-1H3 — REAL contextual orientation and gradual onboarding closure

**Date:** 12/11/2026. **Rama:** `feature/e3-1h3-guia-contextual-onboarding-real`.  
**Base exacta:** `feature/e3-1h2-navegacion-onboarding-real`, commit `b76b368`, PR #62 (DRAFT).  
**Stacking:** H3 → H2 #62 → H1 #60 → E3-1G #59 → previous dependencies. **Do not merge main without approval.**

## Objective

Close the first configuration experience with orientation **context and verifiable** in Locations, Equipment, Catalog and Inventory, without modification of operations, permits, database models, contracts or design of the H1 Home.

## What it incorporates

- Reusable visual warning `RealSetupGuide`, exclusively readable, with a link to an existing REAL route validated by `realWorkspaceHref`.
- Volver a **First steps** from the list navigation of the four modules.
- **Locations:** specific message if there are no locations or if all are paused, conditional on read data and management permissions. The notice does not reactivate or create anything.
- **Equipment:** The verified individual membership allows you to start without invitations; adding contributors is optional. The message only appears if the reading of the team was authorized, completed without errors and only your own membership was observed.
- **Catalogue:** a really empty list distinguishes who can create chips and who can only consult them. In the form, when choosing type `SERVICIO` a clarification is provided that no stock movements should be created for services.
- **Inventory:** The orientation prioritizes missing locations, empty catalog, complete catalogue with only services and absence of balances in the general query. It does not suggest zero balances when there are filters, errors, incomplete queries or unknown pages.

## Minor experience adjustment: invitation load

The action of the profile that opens the screen is called **‘Introduce invitation code’**, like the title of the input screen. The button inside the form retains **‘Accept invitation’**since only the latter sends 43 character code to backend. The secret remains in React status in memory, it is not copied to URLs or local storage. An E2E browsing check was added without accidental acceptance in `auth-registration-ui.spec.ts`. No change in permissions, token or API contracts.

## Final approved adjustment: folding invitations

En **Team → Invite a collaborator**, the header works as an accessible button and initially displays the folded form. By clicking it, Enter or Space displays the original REAL form to enter mail and role and issue the code of one use only. `aria-expanded`, `aria-controls`, open indicator and visible focus allow to use it with keyboard or screen reader. Folding the form does not issue invitations, does not delete drafts and does not modify permissions, APIs, idempotence, or data. After issuing, the code remains visible in the open panel until manually hidden. The header remains disabled while it is issued, to avoid hiding the response by accident.

The E2E test was extended `locations-team-visual.spec.ts` to check closed panel initially, keyboard opening, closing/reopening, no POST when alternating and absence of role form without permission. Green CI is required on the new commit and desktop/mobile revision.

## Safeguards

1. No change `FastAPI`, SQL, Alembic, RBAC, authentication or endpoints.
2. The notices make **cero POST/PATCH/DELETE** and do not enable capabilities that the role does not have.
3. All screens, routes, filters, forms, states and trade policies of E2 and E3-1A/G/H1/H2 are retained.
4. No notice deducts total inventory from a partial page, filters or HTTP errors.
5. DEMO is not used, `demoStore`, localStorage nor fixture to generate visual data.
6. Real operations (creation, purchases, inventory, invitations, sales) remain subject to their explicit permissions and requests. The guide only navigates.
7. Companies remain isolated by `businessId` and session; H3 does not add state between tenants.
8. No correction or modification of company data following observation of ‘Fruta pack’; any verification must be compared `business_id` y `catalog_item_id` Exactly.

## QA

- Added `tests/real-setup-guidance.test.mjs` a `npm run test:auth`: valid gaps, failed readings, unwritten roles, private directory, partial catalogues, services and inventory filters.
- E2E `e2e/real/e3-onboarding-h3.spec.ts`, mandatory with `PYME_DISPOSABLE_QA=1`: QA account/company, Empty Locations, Empty Catalog, Single-holder equipment, headquarters and service entered from the disposable runner, Inventory without stock for services, return between sections, form detail and mobile 390 px, no commercial transactions issued from browser.
- Regression required: `npm run build`, `npm run lint`, `npm run test:auth`, `npm run test:businesses`, Real navigation E2E, services and security per tenant.
- Both workflows (Frontend and REAL full-stack inventory) are required to end in `success` **on the commit of H3**; an earlier IC does not validate new changes.

## Suggested manual verification

1. Enter with new company and title role; empty Locations and Catalog must appear first configuration notices and the link back to Start.
2. In Team, with only the membership itself, it should be informed that incorporating colleagues is optional. Check that no one is asked to invite anyone to complete H1.
3. Register active headquarters and a service sold explicitly, open Inventory: the guide should indicate that services do not require physical stock; it should not create movements.
4. In Catalogue, open form and select type Service; the clarification must appear without blocking or altering the edition.
5. Adding a physical good; with complete data and no balances, Inventory guides the explicit stock circuit without giving fictitious quantities.
6. Apply inventory filters and cause restricted reading in disposable QA: the guide should not affirm zero inventory.
7. Test role without permission: do not offer new actions of writing or filter data from the Team.
8. Change A→B, navigation with contracted menu of H2, F5 and viewport 390px. No data should appear from another company, horizontal scroll, new commercial applications or changes to the H1 Start.

## Exclusions and next stage

It does not include cash, accounts, real QR, Pay Market, financial indicators, catalog images or bulk optimizations. They are separate jobs.

**Planned closure of H:** After green IC and visual approval of H3, resolve the duplicate PR H2 #61; integrate the stack in order and perform a final regression against a disposable QA base. The work is not automatically integrated just by passing the IC.
