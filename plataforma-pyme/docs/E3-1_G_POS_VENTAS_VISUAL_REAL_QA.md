# E3-1G — Sales point and sales history REAL

**Approved basis:** PR #58 / \`feature/e3-1f1-inventario-vistas-real\`, commit \`dbdb219\`.  
**Rama:** \`feature/e3-1g-pos-ventas-visual-real\`, PR stacked against #58.  
**Status:** implementation for IC and visual review, not integrated into \`main\`.

## Objective

Continue the visual consistency of E3. **POS REAL** y el **Sales history** so that the selection of the catalogue and preparation of the cart are clear, while the revision/confirmation and display of a voucher occupy exclusive views. Do not introduce new collection logic, stock or discounts.

## POS REAL

- Maintains headquarters selector, search for items (only catalog loaded), selection with non-editable list price by default, price exception only for authorized roles, exact subtotals, maximum 30 items and cart.
- Visual presentation: business header, catalog cards in grid, cart in side column on desktop and below mobile, ordered payment controls.
- \`RealPosCheckout\` **remains mounted** during the flow to preserve IndexedDB review and attempt status. When passing \`review\`, \`sending\`, \`pending\` o \`confirmed\` the draft of the cart remains **visually hidden**but not destroyed.`Volver a editar\` Review restores full screen without losing data.
- \`pending\` opens directly as a re-entry recovery screen if there is saved attempt. Only one explicit decision and the same \`request_id\`/body allows forwarding. No automatic POST.
- Confirm Real sale continues **disabled by default**. Enables only when environment is explicitly configured with \`VITE_PYME_ENABLE_REAL_SALES=1\`, besides FastAPI business rules and permissions. This frontend flag never replaces RBAC.
- Payments are **declarations**; Market Payment declared does not imply bank/external accreditation.

## REAL Sales History

- Listed with cards, loaded quantity indicator (without asserting global totals), headquarters filter sent to API and local ID search, location and responsible. Local search only applies to pages consulted.
- **See voucher** changes to an exclusive display with "Back to History" and retains the previous filters.`request_id\` remain exclusively \`GET\`.
- Check sample date, location, **name of the person who registered the sale**, original lines and snapshots, subtotal/discount/total, declared payments and historical inventory balances. UUID user and keys remain in ‘Trafficking identifiers’.
- Names are resolved exclusively from the current user or from the business directory when \`canReadTeam\` allows you to consult it. If the identity is not available, "Name not available" is displayed. Current profile names are shown, not historical name snapshots.
- Recovery by request 404 maintains original warning; **404 does not prove that the original sale did not occur**. No new POST is offered from history.

## Not amended

Backend, SQL, Alembic, DTO contracts, permissions and isolations per company, BigInt/HALF_UP algorithms, inventory condition, versions, persistent/not persisted cart, IndexedDB, \`Idempotency-Key\`, unit price and exceptions, discount policies and T10 validation mode.

## Evidence

- New E2E`frontend/e2e/real/e3-pos-sales-visual.spec.ts\`: PostgreSQL company disposable; API confirmed sales; navigation listed → exclusive proof → POS → exclusive review → back; actor name, local search, 390px and zero POST UI.
- Fallback`sales.spec.ts\` adapted to return from voucher before searching for another request.
- Keeping undelete: \`pos-draft.spec.ts\`, \`sales-read.spec.ts\`, \`sales-recovery.spec.ts\`, \`sales-invalid-payment-policy.spec.ts\` y \`flow-purchase-to-sale.spec.ts\`.
- Compile with TypeScript, Lint Oxlint and Tests \`test:sales-real-pos\`, \`test:sales-real-checkout\`, \`test:sales-real-read\`, \`test:sales-real-pending\`, \`test:sales-real-write\`; ejecutar E2E con \`PYME_DISPOSABLE_QA=1\` y backend PostgreSQL **disposable**.
- If the PR IC is incomplete or fails, keep in draft and correct before requesting revision.

## Manual QA (without generating scripts)

1. Enter **REAL POSITION** with test company: select venue, item, quantity; check unit and subtotal price. Add to cart; review declared amount.
2. Press "Check sale and payments": check the exclusive screen with lines and total; "Re-edit" recovers the cart and payments. **Do not confirm sales on your usual basis**.
3. Open **Sales history**: verify filters, cards and seller's name.
4. Select "See voucher": observe full screen without listing below, payments **declared** and historical balances. Back to history; try query by \`request_id\`.
5. Test 390px widths and desktop. Check permissions, box operation not included, and that history does not create new sales.

## Units

E3 string still unmerged: #55 → #57 → #58 → E3-1G PR. Do not merge until manual approval and IC controls; do not touch \`main\` or local bases at this stage.

## Pending further increments

Boundle optimization, final cross-cutting refinement of aesthetics, real photos with REAL storage and money/box/QR are not implemented by this visual change.

## Adjustments after manual user review — E3-1G

After testing the POS and history in VS Code, the user proposed three operating improvements taken as a DEMO reference:

### A. Visible discount in collection calculation

- The discount remains **global a la venta**, not a change in unit price, category or inventory. Fixed amount discounts are available only for previously authorized roles.
- It is explicitly displayed within **Declared payments** the account **subtotal items − discount = total receivable**ARS format.
- The initial payment figure follows the total calculated as long as it is not edited manually. If amounts are changed by hand, missing/excess is indicated and the completion control allows adjusting the last medium.
- The exact HALF_UP algorithm, contracts or persistent payments are not modified.

### B. Available stock guideline limit

- Just for **physical property**when choosing article and venue enabled for storage, it is consulted exclusively by **GET** inventory/balances filtering location and item, reading an authorized balance per company.
- Amount shown in real unit (exact thousandths), location and date of balance if available. No balance row reported zero; services do not require physical stock.
- The line is blocked to add or update if the amount exceeds the last balance consulted or if the reading is still pending/failed; it exists **Update availability** explicit.
- The draft **no reserva stock**. FastAPI retains 409 rejection if availability changes before confirming. Race E2E: stock existing when adding, exhausted by another operation before registering.
- No new endpoints, automatic stock changes or readings from other people's locations.

### C. Completing last payment method

- Add **Complete balance remaining in this medium** in the last declared medium, respecting previous ones.
- The pure function completes the exact amount as **total receivable − amount of prior means**BigInt cents, updating only the last.
- If the above already cover the total, have invalid amount or there is no positive amount left, error is shown without changing payments.
- No bank money, cards, ID Account or Payment Market is credited.

### Regressions and closure

Exact pennies tests, discount changes, mixed payments and errors are extended, in addition to E2E with zero stock, soft drinks for GET and limits. Existing tests of F5, exceptional price, 409 concurrent, mixed payment and idempotence are preserved.

Updates historical proof that expected the point of sale header in the state **Sales recovery** after F5, reflecting the independent E3-1G display without changing the transactional code.

**Do not merge to main without green IC and user approval.**


## POS interaction refinement after user review (12/11/2026)

The REAL and DEMO catches guided an additional visual closure. The distinction between selection and confirmation is maintained, which protects traceability.

1. **Catalogue cards and units:** tabs with neutral icon, category, SKU, price, existence of selected headquarters and visible action "Add units". Choosing an article opens your editor of quantity and authorized price; does not make a sale. The cart includes buttons +/− to change a unit without altering the price, plus "Edit quantity" for fractionable units. No double one line for the same catalog.
2. **Stock en la sede:** balances are read from \`GET /inventory/balances\` filtered by location and pagination (up to 20 pages of 500), with incomplete result indicator. Each card shows only one balance **known**, for its own unit. An article absent from an incomplete result is shown as "Unverified balance", never as zero. No stock of different items or locations is added. The editor retains his query by article/headquarters and blocks adding more than the balance consulted; the + button of the cart also respects known availability. FastAPI revalidates the stock when confirming, and no inventory reservation view.
3. **Discount and total:** inside the summary of the cart, subtotal lines, discount field, applied and total to collect are in that order, using the exact calculations already existing. Empty or invalid cart does not invent a final total.
4. **Complete payment:** is preserved`completeLastPosPayment\` (Exact BigInt/cents) and contextual indication is added. This button requires a cart with positive total; without cart there is no balance to complete and it is disabled. It fills only the last medium after deducting previous amounts, without POST.
5. **Two clear steps:** ‘Finish sale’ opens the **Full detail exclusive screen pending confirmation**: company, headquarters, lines, quantities, price, subtotals, discount, total, declared means and notes. Only there is "Confirming and registering REAL sale", conditioned to explicit acceptance and the mutation rating flag. The "Re-edit" button recovers cart and payments without further attempt.
6. **Images:** Reserve icons are used as long as there is no REAL storage of articles photographs. Future thumbnails should be obtained from **REAL Catalog**, with link to article, validation and persistence backend by company. Do not upload images from DEMO/localStorage as real data or incorporate hardcoded photos.

QA: existing POS/recovery suites, extended E2E E3-1G test for visible balance of a physical product, quantity limit, increase/decrease of cart, discount and complete payment; integration into disposable DB. Do not merge until IC and user approval.


## E3-1G — Catalogue/cart and ticket correction (QA of 12/11/2026)

**Finding:** in the previous design the complete tab of the catalog was a button associated with `choose(item)`. For this reason "Add units" only selected or changed the active editor: the product was NOT added to detail until a second action was pressed, whose visual location confused the user.

**New tour:**
- The catalogue sheet becomes informative: name, category, SKU, unit, price, physical balance of the **selected venue** when it is checked. Your own button **‘Add units’ incorporates one unit directly into the detail**, adds one unit if the article is already in place, and never replaces the other articles. The tab shows "Detail: X units".
- The cart occupies the **full section under the catalogue**Each line has name, unit, quantity, unit price, subtotal and horizontal controls `−` / `+`, "Edit quantity" and "Remove". Manual editing, including fractional quantities, occurs in the same detail; no drop-down editor appears under the catalog.
- If an item is priceless, it is not added with a invented amount. The owner/manager may choose "Define Price", use the exceptional detail editor and save it. Roles without price permission remain blocked.
- The summary of the detail retains the order: **Subtotal articles → Discount (if role is authorized) → Discount applied → Total to be charged**. When moving to ‘Finish sale’, the exclusive view shows the **same lines** and prices, discount and payments declared before explicit confirmation.
- The amounts for goods cannot exceed the known balance at headquarters. An absent availability or an incomplete page is not interpreted as zero; as long as the balance is not verified it is not allowed to add quickly. The user can start a specific query of that article. No merchandise is reserved; confirmation validates everything in FastAPI.
- The UI uses temporary neutral icons. Future loading of photographs should be done in **REAL Catalog**, with persistent storage and isolation by company, and then feed these same tokens; neither DEMO nor browser images are used.
- The circuit of `Idempotency-Key` and IndexedDB, catalog prices, HALF_UP calculation, line limit and permission policy, no backend changes or migrations.

**Regression:** new unit tests for direct addition to the cart, preservation of other lines, exceptional price and stock limit; POS E2E/sales adapted to new interaction, including a purchase with physical product and service, and complete integration suite against PostgreSQL **disposable**.

**Integration:** PR #59 in draft, stacked on #58 → #57 → #55. This setting does NOT constitute merge authorization.
