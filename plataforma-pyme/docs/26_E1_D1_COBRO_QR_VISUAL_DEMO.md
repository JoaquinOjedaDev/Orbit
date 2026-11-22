# E1-D1 — Cobro con QR visual DEMO

**Status:** E1-D1 manually validated by the user in the browser, including QR pending no sale, cancellation and approval blocking when deactivating an item. External integration with Pay Market continues outside of MVP.

## Scope

- From **Sales → New sale**, select exactly **a market means declared payment** by the total; the button "Generate QR DEMO" creates a separate intention, with `businessId`, amount, item snapshot and discount, optional receiver account, Idepotent requestId and future reference to the sale.
- The QR shown is **a graphical pattern that is deliberately not scanable**. There is no Pago Market API, OAuth, credentials, interoperability, funds or real payment.
- States: `PENDIENTE`, `SIMULADO_APROBADO`, `CANCELADO`. While pending there is no sale, balance entered, payment registration or stock outing. Cancel leaves history of intention, without touching Inventory or Box.
- "Simulate approval (without actual charge)" uses the same gateway as ordinary sales. Revalidate stock, location activity, account membership and catalog availability; only then create **una** sale DEMO, whose payment Market Payment is still labeled *declared, unverified*.
- Each QR has a `saleRequestId` Double approval or retrying the transaction recovers the same sale. A QR sale is represented in inventory ledger by its physical lines only once.
- If the product was sold out or disabled while the QR was pending, simulated approval is rejected without creating a sale; it can be cancelled and generated.
- Compatible persistence: same `localStorage` y `version: 1`, with new optional collection `qrIntents`. It is loaded after sales to reconstruct a suspended approval between scriptures.
- In a B company, an intention of A company cannot be consulted or mutated. Each business sees only its QR.
- El **Article QR** remains outside this flow; never makes or certifies collections.

## Additional correction in Sales

The button to complete balance now **complete the last medium added**, keeping the amounts of the above intact; validates that no previous amounts are missing and rejects a zero or negative balance. The distribution of columns of selectors was adjusted.

## Commands

```powershell
git pull --ff-only origin main
npm.cmd run build
npm.cmd run lint
npm.cmd run test:sales
npm.cmd run test:qr
npm.cmd run test:accounts
npm.cmd run test:cash
npm.cmd run test:inventory
npm.cmd run dev
```

## Manual cases of acceptance

| ID | Sequence | Expected |
|---|---|---|
| QR-01 | Sale with 1 payment Market Payment DEMO in total; generate QR | PENDING State, company and exact amount, pattern with ‘non-scan’ |
| QR-02 | Consult Inventory and Sales with QR pending | No sale or stock discount |
| QR-03 | F5 and back to Sales | Recoverable intent with your condition |
| QR-04 | Cancel QR pending | No sale or stock; second cancellation idempotente |
| QR-05 | Create another QR; simulate explicit approval | Exactly one sale and one exit per physical line |
| QR-06 | Open approved intent and re-simulate (or retry gateway) | No double sale or stock |
| QR-07 | Switching to another company | It does not show or allow QR modification of the other company |
| QR-08 | Generate with Cash, 2 media or incorrect amount | Refusal to indicate QR requirements |
| QR-09 | Disable wallet or exhaust stock between intent and approval | Consistent blocking; still STILL no sale |
| QR-10 | Complete last medium after values in previous ones | Calculates only the final balance, does not modify first medium |
| QR-11 | Reopen Previous Box Closing | Identical snapshot; QR does not alter box |
| QR-12 | Try Desktop and Mobile | Readable fields, buttons and display |

## Out of reach

Real QR readable by payment apps, integration of OAuth vendors, external orders, webhooks, reconciliation, stock reservations, refunds and multi-user security. That requires backend and subsequent security design according to ADR-006.

**Product Warning:** never use this visual QR to charge a customer or consider `SIMULADO_APROBADO` as a money accreditation.
