# E3-2B · B2 — QR DEMO with detail and recovery

**Status:** code integrated into `feature/e3-2b-mercadopago-qr-demo`. B3–B6 pending; audit and use path at completion B6. Not partially integrate to `main`.

## Contracts and architecture B2

The REAL POS offers **‘Generate QR collection (DEMO)’** as an alternative, not a synonym for `MERCADO_PAGO_DECLARADO`. The button is enabled after consulting the state of the company's DEMO connection. A new independent intention is sent from `Sale`, con `Idempotency-Key` UUID4. On screen you see an authentic QR as **graphic format** but which only encodes `PYME-DEMO-QR:<referencia>`; cannot be paid with Pay Market. This distinction must remain visible.

**API:**
- `POST /api/v1/businesses/{business_id}/qr-payment-intents` — `location_id`, `lines`, `discount_cents`, `notes`, key idempotent; never declared payments, tokens or credentials in body.
- `GET /api/v1/businesses/{business_id}/qr-payment-intents/{intent_id}` — status, amounts and snapshots of the server, QR as PNG image embedded.
- `GET /api/v1/businesses/{business_id}/qr-payment-intents/by-request/{request_id}` — recovery of uncertain result for the applicant.
- `POST /api/v1/businesses/{business_id}/qr-payment-intents/{intent_id}/cancel` — idepotent cancellation without registration of sale.
- `DELETE /api/v1/businesses/{business_id}/payment-connections/mercadopago/demo` then block disconnection with QR not currently cancelled.

**Tables:** `qr_payment_intents` (tenant, headquarters, merchant, actor, UUID application, command SHA-256, reference, amounts in cents, status, maturity), `qr_payment_intent_lines` (line, item/sku/name/unit/type snapshot, number thousandths, unit/subtotal). `e32b_qr_intents` posterior a `e32b_payment_connection`. Not amended `Sale`, `SalePayment`, `StockBalance`, `StockMovement`.

**Security:** REAL session revalidated under lock, tenant membership, SELL and STORY policy by headquarters, pricing/discounting policy, active sellable catalog, current stock sufficient for physical goods (refer to, **no booking**), DEMO account active. If expires: read status `EXPIRADA`; future transitions in B3.

**Recovery:** canonical URL `/real/empresas/{business_id}/qr-cobros/{intent_id}` the checkout retains the same key and body for recovery by GET and explicitly retry when the network returns an uncertain result while the session is still open. The durable backup of the attempt before POST remains for additional hardening of B3/B5; not describe it as if it were IndexedDB.

**Amount and detail:** snapshot of fixed server, `ARS`, `quantity_milli` y `unit_price_cents` No floating rounding, total discount, 15 minutes expiration. Current photo of the catalog is decorative only and can change without altering frozen data. The amount of QR does not depend on manually entered data after creating it. Internal notes are not encoded in the QR.

## Official base and scope B6

Market Payment Public Orders API for QR: `POST /v1/orders`, `type: qr`, `items[]`, `external_reference`, `config.qr.external_pos_id`, `config.qr.mode: dynamic`, `X-Idempotency-Key`; el `qr_data` real will come from an order issued by MP. Documentation: https://www.mercadopago.com.ar/developers/es/docs/qr-code/payment-processing. **Do not try to pay QR B2**: no es `qr_data` of the supplier.

## Automatic QA built-in

- HTTP Python without DB: mandatory authentication and OpenAPI contracts.
- Pytest PostgreSQL isolated: unbound account, creation, unique replay with key, conflict with different body, two-service snapshot, 1 attempt + 2 lines, 0 sales, 0 stock; GET by ID and per request; disconnection block, cancellation, isolation between companies, another user, worker and expiration.
- Node: Snapshot composition without `payments`, pennies and validation, token Bearer, API routes, key idempotent, different tenant response invalid, total altered invalid and external QR rejected.
- Frontend: build, lint y tests existentes (`test:qr` includes B2). Fullstack and backend CI must be approved at the end of the stage SHA.

## Pending for next blocks

**B3:** laboratory and auditable events, idepotent and retrying states, durable journal in the customer for ambiguous POST. **B4:** transactional policy of reservation/stock or compensation before payment approved, single link with real sale QA and voucher. **B5:** UX and accessibility end-to-end. **B6:** OAuth/Orders API, test credentials, box/spanner, webhooks and provider verification.

No partial human QA is requested. Manual acceptance and audit will be from integrated B1–B6.
