# E3-1E2 — Real receipt and vouchers: independent views

**Date:** 2026-11-12  
**Base:** PR #55 / \`feature/e3-1e1-compras-visual-real\` en commit \`f8009b3\`Still not merged.  
**Rama:** \`feature/e3-1e2-recepciones-comprobantes-visual\`.  
**Status:** first version for QA, IC and manual revision; \`main\` No change.

## Objective

Complete the visual navigation of REAL Purchases using the same pattern approved for Company, Locations, Catalog and Suppliers: one screen for listing, another for **receive a purchase**, another for the **confirmed** and another for the purchase release (E3-1E1). Do not display the receipt or voucher under the cards.

## Design and behaviour

- **Listed:** E3-1E1 cards and filters. Clicking «Pending · Confirm reception in location» opens the exclusive reception screen. «Check voucher» opens the unique historical detail display, using backend GET and without sending receptions.
- **Reception:** Business header, immutable summary of purchase (supplier, date, amount, lines), documented articles and visible notice about concepts without physical stock. Active headquarters selector enabled for inventory. Confirmation continues to be **complete, single headquarters, not partial**, with the same explicit dialogue and the same backend call.
- **Checker:** exclusive view with summary of location, date, **‘Registered purchase’** y **‘Received’**, physical entries and technical drop-down traceability. Purchase snapshots and user names are retained solved only when permitted by the business directory. It is not invoice or PDF.
- Each view includes "Back to Purchase" above, without modifying the URL. The keyboard focus returns to the list header or Back button. Responsive design (390 px included).
- ‘Close detail’ is still available on the voucher as secondary access back. The list is entirely hidden during receipt and proof.

## Invariants and safety

1. No modificar backend, gateway, endpoint, esquema, permisos, ledger, stock, idempotencia ni migraciones.
2. Just confirm reception with the authorized headquarters, using the UUID key already reserved in **IndexedDB**. Retry, when permitted, strictly uses the **SAME key and body**. The frontend does not automatically send reception when opening, reloading or returning from screen.
3. **Return to list DOES NOT eliminate pending reception intention.** React status is closed, but indexedDB registration remains; when opening the same purchase original key and headquarters are recovered. An existing confirmation is verified before repeating. The form blocks editing of venue for a recovered intention.
4. The receipt check continues to use **GET**, and the receipt record is only discarded from the journal when the voucher confirms the same request_id. Do not delete keys automatically if the confirmation corresponds to another request.
5. Confirming a purchase without reception does not move stock; receiving only creates permitted physical movements and confirmed snapshots. Concepts and services do not create stock.
6. The user who registered the purchase may be different from the person who confirmed the receipt. If his name is not queryable by permissions or historical absence, show "Name not available", without inferring it from the session user.
7. No test should run user data receptions. QA E2E requires \`PYME_DISPOSABLE_QA=1\` and PostgreSQL disposable.

## Coverage

- New E2E test \`frontend/e2e/real/purchase-receipt-visual.spec.ts\`: a purchase with physical article and concept, navigation between list, reception, voucher and return; cancel without POST; confirm once; verify GET/balances/movements, reload and test 390 px.
- Adaptation of`frontend/e2e/real/purchases.spec.ts\` for the exclusive view during a slow reading of IndexedDB, preserving the lock of controls while recovering an intention and proving that the intention of another purchase is not duplicated.
- Existing regressions \`purchase-ui-persistence.spec.ts\`, \`flow-purchase-to-sale.spec.ts\`, \`test:supply-real\`, build/lint, Chromium E2E, backend y PostgreSQL integrales.

## Suggested manual review

1. Open a registered purchase. Verify that "Buy Reception" replaces cards, include the correct summary, location and Return button.
2. Select venue, return unconfirmed, reopen: **no** There must be new movement.
3. Check for a confirmed voucher. Verify that it opens a **full view** with the right names, no list behind and with Back.
4. Prove a real reception **only in a disposable company/test base**. Check increase of balance exactly once, read the movements and the possibility to re-consult without doubling anything.
5. Test resizing, keyboard and error states. If a request is uncertain, check first proof and reopen purchase to recover exactly the same receipt key.
6. Pass the increase before integrating it. PR #55 is dependent and remains independent until express authorization.

## Pending other stages

Exporting a PDF formal voucher, vendor bill upload, partial receipt and cash/QR redesigns **not included**. The overall typography/image setting and the optimization of the bundle is postponed to a cross-sectional visual review.

## UX adjustment after manual revision

The user validated visually and functionally E3-1E2 (reception, voucher and movements) and asked to clarify the button when registering a purchase. **Final text: ‘Register purchase’**, accompanied by an accompanying explanation: when registering it is pending receipt; to enter goods into the inventory you must confirm the reception at a headquarters. No changes in API or status, stock or idempotency.

In the first integral workflow of the PR was detected **a single accessibility failure**: after selecting reception, the Back button did not receive focus when initial reading of IndexedDB was still busy. The focus effect was adjusted to wait for completion of `busy` before focusing the view. The remaining 45 integral routes passed; this change requires **new complete workflow in green** and review of the shopping/reception routes before closing.
