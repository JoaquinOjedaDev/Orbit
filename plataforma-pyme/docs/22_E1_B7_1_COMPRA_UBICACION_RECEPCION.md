# E1-B7.1 — Clearing of location pending on recording purchases

**Date:** 06/11/2026. **Status:** integrated into `main`; build/lint/QA local pending. UX enhancement without domain changes or migrations.

## Problem observed

When loading a purchase with physical products and then opening the detail, the location is selected after saving the lines. Although the reception works well, the intermediate step can be interpreted as the goods already entered the Inventory or that the storage was incomplete.

## Solution

1. The Register purchase screen reports two stages: **1. Register purchase**, **2. Confirm location and reception** (the second applies only to physical goods).
2. If the form contains physical goods, it shows a notice **‘Receiving location is not confirmed’** and the button is renamed **‘Save purchase and choose location’**. First the document is saved, without affecting stock.
3. Opens the details of the purchase already saved, with message **‘Saved purchase · location to be confirmed’**.
4. Select a location **enabled and enabled to store**, the summary is reviewed and finally clicked **‘Confirm location and enter Inventory’**. Only this command generates stock entries; it remains idempotent.
5. In the history, pending purchases offer **‘Confirm location and reception’** instead of a generic "View purchase".
6. For purchases exclusively of services or free concepts, the button remains "Register purchase DEMO" and no location or reception is requested.

**No new obligations added** to choose a location at the time of registration: days may elapse between the invoice and actual receipt. Neither were the existing rules for single full reception, company traceability and units without conversion modified.

## Proposed verifications

From `plataforma-pyme/frontend`:

```powershell
git pull --ff-only origin main
npm.cmd run build
npm.cmd run lint
npm.cmd run test:purchases
npm.cmd run test:inventory
npm.cmd run dev
```

- **COMP-UX-01**: record Shampoo and other physical good; see stages and pending location notice **before** de guardar.
- **COMP-UX-02**: save; opens detail with pending location. Inventory does not yet increase stocks.
- **COMP-UX-03**: select valid location, review and confirm; Inventory adds lines only once.
- **COMP-UX-04**: F5 and check again the purchase; receipt is still confirmed, no repeat offer.
- **COMP-UX-05**: buy only one service/free concept; no location required and no stock movements occur.
- **COMP-UX-06**: record a purchase with items and leave it unreceived; it is pending in history, with clear access to confirm it later.
- **COMP-UX-07**: Narrow/mobile view and confirmation buttons without cuts.

**Pending:** actual build, lint and UI tests; changes were verified at the level of files published in the repository.
