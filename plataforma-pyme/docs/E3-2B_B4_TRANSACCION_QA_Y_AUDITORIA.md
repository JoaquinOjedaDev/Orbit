# E3-2B · B4 — Transactional confirmation of sale QR DEMO in PostgreSQL QA

**Rama:** `feature/e3-2b-mercadopago-qr-demo`  
**Status:** implementation in branch; requires IC approval on last SHA. No manual testing or merge of `main`; the integral acceptance corresponds after B6.

## Essential rule

An event `APROBADA_DEMO` **is not an external accreditation**. B4 incorporates an additional and explicit administrative action **A test sale** in PostgreSQL QA using the snapshot persisted by B2. B4 does not invoke Mercado Pago or credit money.

El backend requiere **both** variables in the database **disposable**:

```text
PYME_ENABLE_QR_DEMO_LAB=1
PYME_DISPOSABLE_QA=1
```

IU needs `VITE_PYME_ENABLE_QR_DEMO_LAB=1` y `VITE_PYME_ENABLE_QR_FINALIZATION_QA=1` to display the button. API does not rely on frontend variables and validates titular/administrator roles. **Never activate these variables on a daily basis or in production.** The local user base was not changed since this implementation.

## API

- `POST /api/v1/businesses/{business_id}/qr-payment-intents/{intent_id}/finalize-demo` — does not accept amounts, lines or payment means sent by browser. The request is identified by the persistent QR: repeat returns HTTP 200, same voucher and unchanged stock.
- `GET /api/v1/businesses/{business_id}/qr-payment-intents/{intent_id}/receipt` — proof confirmed only if there is transactional link.
- `GET /api/v1/businesses/{business_id}/qr-payment-intents/{intent_id}` — includes `sale_id` nullable, which is completed only when `FINALIZADA`.
- The public endpoint `POST /sales` He's still accepting alone. **five payments declared**, and can not declare `MERCADO_PAGO_DEMO_QA`. This new value is created exclusively from the internal service of B4.

## Single transaction, no duplicate sales

1. Revalidate session, active company and administrative role; check that the server uses a disposable QA environment.
2. Lock `QrPaymentIntent` (`SELECT FOR UPDATE`) If already exists `QrPaymentSettlement`, recover the same proof in an idepotent way; never again to owe stock.
3. Require status `APROBADA_DEMO` and event `APROBAR` in the logbook of that company and that attempt. Rejected, expired, cancelled, undetermined or under review cannot be completed.
4. Construir `CreateSaleRequest` **from the original server lines and totals**Assign `request_id` UUID4 deterministic by tenant/intense. Do not trust a new body sent by customer.
5. Reuse `SaleService.create(..., commit=False, trusted_qr_demo=True)`: valid role, headquarters, item and stock; insert sale, lines, payment `MERCADO_PAGO_DEMO_QA`, moves and modifies balances. It does not `COMMIT` The traditional sales endpoint retains its previous semantic commit.
6. Store name/SKU of QR snapshot, create `QrPaymentSettlement` (FK tenant to sale and try, unique for both), move QR status to `FINALIZADA`, add event `FINALIZAR`.
7. **Un solo commit** confirms sale + simulated payment + movements + stock + link + event. Any previous failure reverses the entire transaction.

The relationship is saved in the new table `qr_payment_settlements` migration `e32b_qr_sales`. The restriction of means of payment is extended to recognize `MERCADO_PAGO_DEMO_QA`; the public API does not accept it as input. `QrPaymentEvent.action` incorporates `FINALIZAR` y `REVISION`.

## Judgements after fictitious payment

If the sale is no longer eligible for registration of the item, headquarters or stock, the sales transaction is completely reversed. In a second transaction, the QR passes from `APROBADA_DEMO` a `REQUIERE_REVISION`, with event `REVISION` y sin `Sale`, `SalePayment`, `StockMovement` no debit. Do not automatically retry a review closure.

In uncertain network responses the browser must first consult the QR (and its voucher if it says `FINALIZADA`). The completion is idempotent because it uses the QR identifier and a unique link in DB; it does not generate new sales keys.

## Automatic cases envisaged

- No approval, rejected or cancelled: 409, zero sales.
- Simulated approval → POST closing: 201, payment `MERCADO_PAGO_DEMO_QA`event `FINALIZAR`, link 1:1.
- Same repeated POST: 200, same voucher and zero additional discounts.
- GET by QR and proof of sale; rejection of foreign tenant, employed without role or laboratory disabled.
- Physical well + service with balance: stock decreases once, version increased once, one movement.
- Stock is exhausted after approval: 409 and `REQUIERE_REVISION`, zero sales, zero movements, no negative balance.
- Late failure before commit: rollback sale, payment, stock, link and status of QR.
- Frontend: DEMO method other than declared; reject QR/sale/total/SKU response not matching and HTTP outcome uncertain.

## Pending

**B5:** visual consolidation, UX controls, QR warnings in revision and responsive paths.  
**B6:** OAuth, Dynamic QR API Orders, notifications and official reconciliation with credentials and actual test permissions. **Only B6 can issue a collectable QR in the provider environment**Never this fictional QR.

Do not request intermediate manual tests; do a single audit and B1–B6 route before the explicitly approved merge to `main`.
