# E1-B9 — Stock control by location (multi-item session)

**Status:** published in `main`. **Local check of build/lint/tests and QA missing in browser**.
**Base:** React E1-B8 prototype, reception/transfer/count history and reference HTML `walos_m_dulo_2_inventario_y_control_de_stock(3)(1).html` The visual structure of the article control is used; neither HTML scripts/fixtures nor reservation logic are imported.

## User experience

1. From **Inventory** button is offered **Stock Control**. The previous individual form is as follows: **Quick adjustment**.
2. Selected **an active location storing**. Changing location deletes edit counting so you don't accidentally apply it elsewhere.
3. They're ready. **Active physical articles** each item shows its theoretical balance, real counting field, buttons +/−, button **Mark 0** And visual difference.
4. **Not counting** = *do not modify*. It is different from entering **0**, which can generate output adjustment of all previous existence. Progress of counted articles is displayed; searcher by name/SKU; maximum **200 articles counted per session**.
5. Un **mandatory reason or observation** if you want to come with the meeting. **Review Differences**, a summary with theoretical balance, counted and differences of all the articles counted, including those that coincided.
6. By confirming, **all changes apply together** in DEMO status. If the balance of any article changed since revision, the session is rejected complete and re-edited to recalculate the summary.
7. En **Stock movements**the sitting took place at **a drop down row** with its number of items reviewed, number of differences, location, motif and date. When expanding, you see each item and its change. Previous individual settings and transfers remain visible.

## Model and compatibility

- The guy `InventoryOperation` incorporates `BATCH_COUNT`, guarding `locationId`, `requestId`, `reason`, `createdAt` y `lines[]`. Each line retains article, unit, `expectedMilli`, `countedMilli` y `deltaMilli`.
- `inventoryOperationMovements` project **a non-zero line adjustment**. Lines equal to their balance **yes remain in the session**, but do not generate artificial movements. Items not counted are not included.
- `inventoryHistoryEntries(movements, operations)` grouping the meeting by `operationId`, avoiding doubling rows and keeping signed inventory events to calculate balances. A move retains two moves even if it looks like a row.
- `demoGateway.countInventoryBatch`: valid company, location, active and physical items, exact units, limits, duplicates, motive and equal balance with the revised one; only does **un `notify`** at the end. The repetition of the same `requestId` in that company returns the previous session.
- ♪ When I get back ♪ `localStorage`, `BATCH_COUNT` is validated and rebuilt in temporary order next to `TRANSFER` y `COUNT`, comparing each previous historical balance. The key and local version do not change: `asistente-pyme.e1a2.demo.v1`1. No old profiles, companies, catalogs, suppliers, locations, purchases or operations are excluded.
- It's a **local simulation**: There is no authentication or inventory reservations, locking, browser matching, physical change reconciliation or real multi-user support. This control must be implemented with server transactions and permission policy when building backend TP3.

## Affected files

- `frontend/src/data/demo/inventoryPolicy.ts`: session types, calculation of revised differences and projection.
- `frontend/src/data/demo/demoStore.ts`: `countInventoryBatch`historical burden and barriers to integrity.
- `frontend/src/features/inventory/InventoryBatchCount.tsx`: Counting form by location, progress and review.
- `frontend/src/features/inventory/InventoryPage.tsx`: actions and history view with expansion per session.
- `frontend/src/App.tsx`: passes operations to each company's history.
- `frontend/src/App.css`: styles and responsive adaptation.
- `frontend/tests/inventory-policy.test.mjs`: Trial sessions with and without differences, ledger and inconsistencies of balance.

## Local verification

From `plataforma-pyme/frontend`:

```powershell
git pull --ff-only origin main
npm.cmd run build
npm.cmd run lint
npm.cmd run test:inventory
npm.cmd run test:purchases
npm.cmd run dev
```

### Minimum manual QA

| Code | Test | Expected outcome |
|---|---|---|
| B9-01 | Open Inventory → Stock Control | Session is opened without altering previous settings |
| B9-02 | Select a location | List only physical assets active from the current catalogue and its balances |
| B9-03 | Enter 7 in an item with a balance of 10; leave another "Not counted" | It is proposed −3 for the first and second remain unchanged |
| B9-04 | Mark 0 on an article that has 2 | Adjustment proposed −2; explicit zero does not amount to non-counting |
| B9-05 | Load two articles, check progress, observe summary before saving | Both are shown and their differences (even if one is zero) |
| B9-06 | Confirm and review Inventory | Both changes apply together without negatives |
| B9-07 | Review Movements | A row for session and detail per article when expanding |
| B9-08 | Counting without difference | Recorded a historic session, without making movements or changing stock |
| B9-09 | Change location during editing | Clear values in editing |
| B9-10 | Enter with another company's browser | No previous sessions or stock |
| B9-11 | Update F5 after control and a later purchase | Operations are retained and correct balances projected |
| B9-12 | Repeat the same `requestId` | One session only; no duplicate settings |
| B9-13 | Change stock between review and confirmation | The whole meeting is rejected and requires revision of the new balances |
| B9-14 | Try to count a service, negative amount or fraction of box | Refusal by Catalogue/Unit Rules |
| B9-15 | Open in Mobile Width | Accessible controls and readable rows |

## Deliberate pending

No reservations, lots, expiration alerts or simulated concurrent sales of the reference HTML are included: these functions depend on the domain model and reserved inventory that is not yet implemented. Neither is the Purchase module altered nor default stock data created.

**Recommended next cut:** complete operational inventory of Sales (authorized exits and cash-in sessions), respecting stock available and future integration with Market Payment without confusing QR item with QR collection.
