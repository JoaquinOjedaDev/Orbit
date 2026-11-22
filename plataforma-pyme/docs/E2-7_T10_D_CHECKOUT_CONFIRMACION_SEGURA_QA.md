# E2-7 · T10-D — REAL checkout, declared payments and idepotent confirmation

**Date:** 10/11/2026. **Rama:** `feature/e2-7-t10-pos-ventas-real`. **PR:** #43 (**DRAFT / SIN MERGE**).

## Scope

The functional phase T10-D on the already approved cart and policy P01 was implemented. `EFECTIVO`, `TRANSFERENCIA`, `CUENTA_DNI`, `TARJETA`, `MERCADO_PAGO_DECLARADO`. **No external payments**, does not consult a QR collection or assume that a reference means money received.

### Re-used contracts

- `realPosCheckoutDraft.ts`: pure composition of 1–6 media with ARS amount → non-float cents, NFKC references and T10-A validation; total payments exactly equal to the total after discount.
- `RealPosCheckout.tsx`: payment form/note, detailed review company+sede+renglons+prices+subtotal+discount+total+means and specific human acceptance to create the sale.
- `realSaleWriteCoordinator.ts` de T10-B2: `pending`/ `prepare`/ `recover`/ `sendApproved`. **Mandatory** reserve the original body + UUID4 by actor and company at IndexedDB and reread it before the first POST.
- `salePendingJournal.ts` T10-B1: no attempt to delete timeout, F5, 404 or 409; proof matching tenant, actor, request_id, headquarters, lines and payments to close is required.
- `SaleService` FastAPI and P01 of T10-C: physical stock atomity, proof snapshots, range per seat, prohibition to modify price/discount for Maintainer/Worker, response `201` original, `200` replay y `409` conflict.

### States and security controls

1. Al montar el POS se **blocks** the cart while searching IndexedDB. If there is an earlier slope, your UUID4 is displayed; if IndexedDB fails, the POS is closed to new sales. No mounting query sends a POST.
2. A valid cart can declare mixed payments. **Final review** captures an immutable command; its opening blocks editing of the cart and requires an explicit consent box. Canceling the revision allows you to edit **only before persisting or sending**.
3. Confirmation requires that the IU be enabled in test environment, explicit check and `coordinator.prepare(review.body)`. Only when the reservation + durable rereading is successfully completed is it called to `sendApproved(key,true)` con **el mismo body y clave**. A lock or storage error prevents POST.
4. After network error, abortion, timeout, incompatible response or HTTP `401/403/409/422`, the attempt is retained and consultation required `GET /sales/by-request/{key}` before an eventual **manual forwarding of the same request**. **404 is ambiguous** and does not allow you to delete or create a new key automatically.
5. After `201` o `200`, it is verified that the voucher matches the saved intention. If the IndexedDB deletion fails, the confirmed receipt is shown as confirmed, but the resale restriction is maintained until getting cleaning by GET. There is no failback DEMO or token storage in IndexedDB.
6. Only when the journal is closed and the sale is confirmed will the cart be released to start another operation. Show total and payments as **declared**, unaccredited.

### Environmentally enabled control (operational defence, not authorisation)

IU uses `VITE_PYME_ENABLE_REAL_SALES === '1'` to enable the button **‘Signing and registering REAL sale’**; **default is disabled in local user vite**, so you can check the checkout without mutating TEST Company A. **It's not a security check.** (any browser could call the API), so P01 membership, assignment and atomization are still imposed by FastAPI.

`frontend/e2e/playwright.real.config.ts` only enable that switch in REAL execution with `PYME_DISPOSABLE_QA=1` and an API in `http://127.0.0.1:18001` with PostgreSQL ephemeral. Never use real credentials or DB for those tests.

## Evidence

- **8 New Node** en `tests/sales-real-checkout.test.mjs`: mixed sale 52000 + 41000 2000 12000; mix of payments, limits, exact sum, reference text, rejection of accredited methods and standardization.
- **2 Playwright REAL nuevas** en `e2e/real/pos-draft.spec.ts`: human consent, one-time POST and in-service voucher; response `201` lost after COMMIT, F5/login and GET recovery **no second POST**.
- The original 2 T10-C tests were adapted for the checkout screen: the price is still blocked by default, the cart/editing are tested without being sent out and 501 tokens maintain pagination.
- **CI T10-D COMPLETE AND APPROVED:** Full-stack #42928402751, commit funcional `f3286c6d500190407294be9d38a5e5399cecbcc9`, **SUCCESS**. **892/892 Pytest** ephemeral PostgreSQL (**2 non-blocking warnings**), **8/8** Node checkout tests, **15/15 Playwright REAL** (including T10-D 2) and **6/6 Playwright DEMO**, no bugs; TypeScript build/Oxlint also approved. Independent Frontend #42928402676 and Backend Python 3.12/3.14 + Docker #42928402678 also **SUCCESS**These 3 runs check the **mismo commit funcional**before documentary updates.

## Pending acceptance

- **T10-E:** physical product and stock scenarios, mixed sale, operational roles, HTTP errors, conflict/stock failure, F5 browser and mixed payment; run on company and disposable PostgreSQL and check ledger, uniqueness and snapshots.
- **Local visual QA without mutations:** review selection, total by product, declared means, disabled confirmation and help messages. **Do not ask the user to register sales at TEST Company A**.
- **T10-F:** security audit, reconciliation with QA, explicit decision to enable REAL POST outside IC and merge with human authorization. Future rules of Market Real payment/QR collection are another scope.


## Opinion T10-D

**T10-D technically approved to move to T10-E.** The UI payments and review works; the original POST service test and loss scenario `201` After COMMIT they were checked with browser and PostgreSQL **disposable**, without duplicates. Do not attribute these executions to local user data.

**T10-D does NOT enable sales operations in the default local browser.** The extended T10-E battery (physical stock/mixed sales, declared mixed payments, 403/409/422 errors, operator permissions and recoveries), manual QA without mutations and T10-F audit remain pending. Do not merge PR #43 or activate `VITE_PYME_ENABLE_REAL_SALES` in a persistent environment until explicit acceptance.
