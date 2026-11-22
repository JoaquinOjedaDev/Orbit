# E1-C1.1 — Visual POS selector, without altering Sales commands

**Date:** 06/11/2026. **Status:** published in `main`; requires build/lint and local functional validation.

## Origin and scope

Revised references: attached user images and `WALOS_M3_Cargar_Venta_POS_vNext.html` Original. Take advantage of your search pattern by product/SKU, filter by category and priced item cards, image, location stock and add button. **You do not carry the full HTML or your JavaScript stock, cash box, currency or QR.**

E1-C1 already had editable cart, whole cents, fixed discount, exact split payments, single stock out and DEMO voucher. Those rules remain intact.

### Visible changes

- Dentro de **Sales → New sale** a **Visual item selector** And then the cart form.
- Search by name, SKU, category or description, without distinguishing capital letters or accents; drop-down filter by category.
- Cards with optional image already saved in IndexedDB, name, SKU, category, price and availability according to selected location.
- **Add** incorporates a unit into the existing cart or increases the quantity when the item is already chosen. The traditional form allows measured quantities, prices to be quoted and manual corrections.
- In physical goods without a chosen location, or without at least one available unit, the fast addition is disabled. Services allow you to add without location or stock.
- The quantity already selected is visually subtracted from the availability of that location. Final validation still belongs to `demoGateway.registerSale`; no se cambia el ledger.
- Up to 30 items per sale; the search limits presentation to 100 cards, without losing access to the rest by filters.
- Design adaptable to browser width, without copying the side menu, WALOS brand or the store of reference HTML.

### Deliberate decisions

- **Do not include "Replenishment" on each card** In this delivery: own production and transfers must go through existing traceable operations, never create free stock from Sales.
- **Do not show ‘Open Box’** if there is no real day; the opening and arching belong to E1-C2.
- **Do not simulate payment market accreditation** from a Sales button. It is maintained ‘declared DEMO payment’; QR of collection, expirations and verified accreditation will have separate delivery.
- **Do not switch to two screen checkout yet**: the existing interface already supports mixed payments and discounts, which should not be missed by simplifying to a single medium.
- **Do not add cash received/returned** without explicit model of `tenderedCents` versus `appliedCents`. It will be useful with Box, but an isolated delivery could fake total cash.

## Recommended local QA

From `plataforma-pyme/frontend`:

```powershell
git pull --ff-only origin main
npm.cmd run build
npm.cmd run lint
npm.cmd run test:sales
npm.cmd run test:inventory
npm.cmd run dev
```

1. Enter WALOS → Sales → New sale, choose a location that allows you to sell and store. **Shampoo**, check image, price and availability; add it twice and verify that the cart has a single line with quantity **2**.
2. Try adding products without location: disabled button, no stock outputs. Add a **service** no location: available.
3. Search for SKU and filter by category. Check that the items appear again when deleting filters.
4. Try location with zero stock: visible article and disabled aggregate action; do not disappear from search.
5. Confirm a discount sale and two exact means; check voucher and unique inventory exit. F5 should not change balance.
6. Test a price from the catalogue 'To quote': you can select and then enter the price manually before confirming.
7. Try mobile window width: cards, cart and form must retain readability and navigation.

**What remains to be seen:** actual build/lint execution, browser response and visual regression tests by the team. Do not confuse this QA listing with already executed tests.

**Next deliveries:** Costs + Opening/Close (E1-C2). Selection and collection separation, persistent cart and amount received/returned are as subsequent improvements with explicit rules.
