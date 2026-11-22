# E3-1F1 — REAL Inventory: stocks, history and operating views

**Date:** 2026-11-12  
**Base:** PR #57, rama \`feature/e3-1e2-recepciones-comprobantes-visual\`, commit \`0011715\`. Dependencia PR #55.  
**Rama:** \`feature/e3-1f1-inventario-vistas-real\`.  
**Status:** first visual increase E3-1F for QA and PR draft; **no fusionar a main** before review.

## Reason and scope

Homogeneize REAL Inventory with approved navigation for Company, Locations, Suppliers and Purchases, **not substituted** transfer, counting and adjustment components already validated against FastAPI and PostgreSQL.

- **Listing View:** Business header, indicators limited to stocks and movements *already loaded*, existing headquarters and article filters, Stock/History tabs, responsive cards, pagination and traceability.
- **Transfer view:** "Transfer between locations" opens its own screen without showing under stock or history. It is fully reused \`RealTransferPanel\` with origin/destiny, querying the source balance, authorized destination, exact quantities and motif. Your own top button "Back to inventory" remains disabled while you are sending an operation.
- **Initial stock view and settings:** Start Stock and Settings opens another separate screen. Re-use \`RealAdjustmentPanel\` including **Physical count**, Input adjustment, Output adjustment and Initial stock; displays current balance/versions and preview delta, without changing logic.
- **Navigation by React status** on the same path: \`list\`, \`transfer\`, \`adjustment\`; the listing content is not under the form. The keyboard focus moves to the title of the enabled view or list when it returns. The detail of movements retains a traceability dropdown.
- **Specific Styles** en \`realInventoryVisual.css\`, without modifying DEMO or transactional logic. Responsive view with test at 390px.

## Safety invariants

1. No changes to gateway, backend, API contracts, Alembic, models, roles, permissions, STORY rules, version control, balance calculations, or historical movements.
2. The balance comes from the backend; the frontend **does not add purchases** nor mixes heterogeneous units to invent a total. **loaded rows**, not total global when API page.
3. The journal is maintained in IndexedDB, with the same key and body for replay allowed. **Back doesn't make POST** does not delete saved pending attempts; when reopening a panel they are recovered. Button lock Return during an active POST.
4. The atomic rule of transfer (out/input), the expected versions of adjustments, and the exact difference for physical counting are retained. \`window.confirm\`.
5. Warnings and locks of 409, uncertain result and validation against actually consulted balances are retained. No sales, purchases or payments are created.
6. It is clearly shown that the history filter by type or search acts only on loaded records, while headquarters/article are sent to API for re-consultation.

## Evidence

- New E2E`frontend/e2e/real/inventory-visual-navigation.spec.ts\` con \`PYME_DISPOSABLE_QA=1\`: seed in an isolated company, navigation list ↔ transfer ★ settings, focus, 390px, filters and total absence of POST inventory when opening/cancelling.
- Regression`frontend/e2e/real/inventory.spec.ts\`: attempts saved against lost response, F5, forwarding of same key and body, non duplication, conflicts 409, pagination of more than a hundred movements and history by site/article.
- CI: build, lint, E2E Chromium, PostgreSQL REAL suites and stock/ledger tests. All actual test mutations are performed only in disposable DB.

## Visual review requested

Open REAL Inventory in a test company, check balances and history. Press "Transfer between locations" and "Start Stock and settings" to verify that they open as exclusive screens and return to the list, without running any POSTs. Check that Physical Counting remains visible within Settings, that filters and traceability are maintained and that the listing is usable at 390px.

**No fusionar** without approval. The following increases of E3-1F may polish the history and representation of movements/adjustments if needed, without mixing redesign with domain changes.

## Functional approval and audit adjustment (12/11/2026)

The user approved the design and operation of E3-1F1 and requested a single final correction: show in motion detail **the name of the person who performed the operation**without sacrificing the technical identifier.

- The inventory contract already contains `actor_id`, corresponding to the actor who made the movement; correction does not alter DTO or scripts.
- En **History of movements**, is shown "Realized the movement: name", solving the identity of the user connected by its session ID and that of other members exclusively through the REAL list of company members, when `canReadTeam` authorises consultation.
- The team's response is preserved associated with its `businessId` and is only used if the active company and current permissions match. No lookup of external accounts is made.
- If there is no reference name, it is presented ‘Name not available’ without attributing a historical movement to the current user. UUID continues in ‘View traceability’ as ‘Responsible (ID)’.
- The name shown is the current name of the member profile; it does not pretend to be an immutable historical snapshot.
- The mobile interface, GET methods, pagination, filters, atomic operations, idempower keys and version control are maintained.
- Tests of display of own name, different author, case without access to the directory and conservation of UUID were added; in addition, the disposable base E2E verifies the name and technical detail without generating inventory POST.

**Closure:** functional approval expressed by the user; PR prepared for GitHub review after CI. It does not constitute authorization to merge the chain to `main`.
