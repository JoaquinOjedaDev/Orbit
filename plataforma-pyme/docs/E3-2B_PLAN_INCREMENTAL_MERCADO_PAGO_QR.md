# E3-2B — Incremental Master Plan: Market Linking DEMO Payment, QR with details and sales confirmation

**Status:** B1–B5 incorporated and approved in IC (commit af4328d5). B6 implemented in this branch (OAuth PKCE TEST per company, Orders QR dynamic, detail of the POS, webhooks HMAC, reconciliation and single sale QA); pending the comprehensive validation of the latest SHA and official test with authorized Seller TEST. Production is not enabled. Manual audit and route B1–B6 after closing automatic review. Reference: E3-2B_B6_MERCED_PAGO_OFICIAL_TEST_QA.md.  
**Exclusive branch:** `feature/e3-2b-mercadopago-qr-demo`, born of `main` en `5b21daec04df6c551d3221a06ce03d577ec36544`.  
**Project:** multitenant and multi-rubre SMEs. WALOS HTMLs are UX references, not definitive code, or business model only.  
**Limit:** `plataforma-pyme/` and, where necessary, only SME IC. Do not modify `main` until express approval.

## New closure policy for the payment sector

By express decision of the user, **B1–B6 are integrated exclusively into this same branch**. No manual test, authorization or merge between blocks is required. Each advance must pass automatic controls (compilation, Alembic, Pytest, frontend and IC) to avoid dragging errors. Once integrated B6, a single comprehensive technical audit and usage path is performed before authorizing merge to `main`.

**B6 is part of this delivery**: Third party OAuth, dynamic QR with Orders API, branch/box, notifications and official reconciliation, using approved test credentials. If eligibility or credentials are missing, the blocking will be documented and no non-existent external verification will be asserted. Never activate real money collections or upload secrets to the repository.

## 0. User experience objective

A person with management permission links a **Fictificate account of Market Payment** then an authorized operator opens the POS, selects headquarters, items/services, quantities, prices and discounts; choose **Pay with Market QR Payment (DEMO)**. The application generates an individual collection attempt and shows **the QR and the full breakdown of the sale on the same screen**The test lab allows you to approve/reject/cancel/expire and play network problems. **Only if the backend checks an approved trial payment will a REAL sale be confirmed in PostgreSQL QA** using the existing sales/stock/idempotence logic, preserving the unambiguous simulated payment mark and without external funds. Proof is generated and history can be consulted.

**What does "detail in QR" mean:** detalle visible **to the side/under of the QR code** always. In the future official adapter, send to the supplier `items[]`, `description` y `external_reference` where the Orders API contract allows; **not assert** that the buyer's wallet necessarily represents each line, price or discount in an identical way. What the Payment Market app shows depends on it.

## 1. Analyzed references — keep/do not copy

1. `WALOS_M3_Cargar_Venta_POS_vNext(2).html` (replied file): selection of the means of payment, QR screen on hold, ticket, countdown and laboratory with approved, rejected, expiration, network loss and late payment. **Preserve conceptual UX. Do not copy local JS status or freely accredit production button.** The model does not show full list on QR screen: improve it.
2. `WALOS_Modulo_Ventas_UX_v4_0(4).html`: spacious catalog, "Select articles" and "Review and charge" stage, location context, visual confirmation, discounts, history and adaptable design. **Keep navigation and reading pattern; use existing React REAL components without duplicating POS.**
3. `cuentas_bancarias_asociadas(2).html`: account cards, holder, alias, CBU/CVU, roles, status and QR. **Keep as a separable visual guide**. Do not use external URL `qrserver.com` nor its exemplificative QR as a collectable code; do not treat CVU/alias as verified OAuth linkage.
4. REAL Status of `main`: React TS/Vite, FastAPI/PostgreSQL/Alembic, POS `RealPosPage` / `RealPosCheckout`, `SaleService` with sale `CONFIRMADA` and inventory discount in the same transaction, `Idempotency-Key`, recovery of attempts, payments currently **declared**, and frontend gate `VITE_PYME_ENABLE_REAL_SALES`. Do not rewrite or remove such guarantees.

## 2. Decisions of scope

- **First delivery: internal simulated provider, without accessing the external payment market API.** ‘Market Account Linked DEMO Payment’ = fictitious configuration persisted and associated with a single `business_id`. Name, ID and status are displayed as DEMO, not as a real link.
- Prepare interface `PaymentProvider` with an adapter `MockMercadoPago` and future contract `MercadoPagoOrdersApi`. **Do not send actual test credentials or generate real collectable QR on B1–B5**.
- The DEMO QR can encode a path/reference of **test** with visual marking ‘SIMULATION — NOT COBRABLE’; never use `qr_data` The amount and detail come from the persistent attempt of the server, not from the QR content or free input.
- **A business** link always per company; a user can operate several companies without sharing accounts, intentions, credentials or collections.
- **A collection account does not amount to bank accounts:** record intentions and collection events, but not invent accreditation or bank balance. The future financial module will consume reconciled events of accredited origin.
- **Do not mix declared payment with verified payment:** `MERCADO_PAGO` in the current sale is average declared and **no** The new option "QR Payment Market (DEMO)" uses an independent check flow. No frontend button authorizes a production payment.
- **No sales pending like `Sale` confirmed:** existing table restricts `Sale.status = 'CONFIRMADA'`; pending intentions should be modelled separately.
- Discounts, amounts and lines freeze as **snapshot** when creating the collection attempt; the backend validates/requotes before accepting it. `business_id`, `location_id`, account and amount cannot change during that attempt.
- During QR pending, explicitly resolve **stock reserves** or stock control in closing. If the stock disappears after an approved payment, never register negative stock sale, never duplicate collection; leave attempt on `REQUIERE_REVISION` For resolution and/or eventual reimbursement. Stage B4 must choose and implement the reservation policy with the same atomism of the leader.
- Keep `main` stable and not to turn on overall REAL sales; evidence exclusively against PostgreSQL QA isolated and explicit authorization flags, without real keys or real money.

## 3. Development sequence with automatic testing and a single final acceptance

| Block | Vertical deliverable | Backend / persistencia | Frontend / UX | Exit door |
|---|---|---|---|---|
| **B0** — Master plan | This document + ADR/contracts and QA matrix; branch from `main`, PR draft | Minimum sales, permissions and pagination audits | UX references mapped to REAL | Revised documents and scope; without modification of operation |
| **B1** — Link account | «Measuring means» → «Demo payment market» with linking, seeing status and delinking | Tenant-scoped link migration; read/write by role; no external tokens | Business card, fictitious alias, DEMO mode, connected/not connected | Company A connects; B does not see or modify; worker only consults |
| **B2** — QR attempt | From review of POS: start frozen collection attempt, amount and detail | Tried tables and lines/snapshot; reference and key idempotent; expiration, account/head | Display dedicated to QR DEMO, cover, units, price, discount, total, time remaining, status and "Back" insurance | F5 query same attempt; no sale created, no stock moved, 2 requests do not duplicate attempt |
| **B3** — Simulate collection | Operator/Manager QA test approved, rejected, expired, cancelled, networked and late | Unchangeable events, transition of states, permissions and replays; simulation endpoint **QA only** | Demo laboratory clearly separated from the client; understandable indicators | Unstable network, duplicate/out of order event, wrong company and incorrect role do not cause duplicate collection |
| **B4** — Confirm sale | By approving DEMO, confirm a single REAL QA sale and link proof to attempt | Safe transactional integration with `SaleService`stock and voucher; solve insufficient stock/reserve and recovery | ‘Reconfirmed sale’ display with breakdown, payment reference DEMO and voucher | Single leader/salt for physical good, services without stock, 409 protected, power and recovery F5 |
| **B5** — UX and closure | Complete and responsive single flow; observability and documentation | Status/operation, audit, cancellation/reconciliation; no secrets in logs | Consistent side menu, business status, accessibility, mobile, feedback and errors without double message | Backend Pytest + Alembic + build/lint + Playwright REAL y DEMO + QA manual integrado |
| **B6** — Official adaptor (after demo approved) | External integration implementable research: OAuth seller and Orders API QR in sandbox | Encrypted credentials/backend, token refresh, branch/box, `POST /v1/orders`, webhooks signed, confirmatory query, refunds | Connect real trial account by OAuth and use official QR when enabled by Pay Market | Only after verifying current access/API conditions and trial accounts, never treat mock as actual payment |

### Delivery B0 (present)
- New branch created from the SHA of `main` registered.
- Documentation of proposed decisions, endpoints, tests and risks.
- No migrations or sales activation; the user approves the plan before B1 if you want to make adjustments.

### Delivery B1 (first implementation)
**Suggested API (to be reviewed with the repository patterns):**
- `GET /api/v1/businesses/{business_id}/payment-connections/mercadopago`: non-sensitive configuration and status.
- `POST /api/v1/businesses/{business_id}/payment-connections/mercadopago/demo`: creates/reactivates the fictitious connection, with `Idempotency-Key`.
- `DELETE /api/v1/businesses/{business_id}/payment-connections/mercadopago/demo`: disables without erasing history; does not allow cutting an outstanding attempt without risk control.
- Not accepting `business_id` Not to admit passwords, access tokens or real secrets in DEMO's JSON.

**Minimum model:** `MerchantPaymentConnection` (uuid, business_id FK, provider, mode `DEMO`, mock_merchant_name, mock_merchant_ref, status `ACTIVA/INACTIVA`Timestamps and actor). Restriction of uniqueness by business/provider/mode. Without CBU/CVU invented as proof of ownership. Control by ACL company, never for hiding buttons only.

**QA B1:** account A, second business B, user Owner/Admin/Manager/Worker, company suspended, session revoked, double click and F5, company changes and no name leak.

### Delivery B2 (detail and QR)
**Screen proposed ‘Review and collect’:**
- Heading: Company, headquarters and ‘market related DEMO Payment’.
- Articles: cover if available; name, optional SKU, quantity, unit price, line subtotal.
- Summary: subtotal, discount, **fixed total amount calculated by the backend**, ARS; internal notes outside the QR.
- Large QR with persistent label ‘DEMO · NOT COBRABLE’, expiration and short reference.
- State "Waiting for payment", action "Check status" and instructions. The "Approve test" button lives within a panel **QA Laboratory** with backend-controlled role and flag.
- On mobile: collapsed detail **visible and recoverable** and QR complete without overflows.

**Tentative contracts:**
- `POST /api/v1/businesses/{business_id}/qr-payment-intents`: validated quote, account/headquarters, lines, discounts, idempotency.
- `GET /api/v1/businesses/{business_id}/qr-payment-intents/{intent_id}`: status, snapshot, expiration, optional sale.
- `POST /api/v1/businesses/{business_id}/qr-payment-intents/{intent_id}/cancel`: controlled cancellation.
- The DEMO QR identifies the attempt by opaque reference, does not contain sensitive data and does not equal the plot `qr_data` de un order real.

### B3/B4 deliveries (states and sale)
`CREADA` → `ESPERANDO_PAGO` → `APROBADA_DEMO` → `FINALIZADA` (REAL QA sale confirmed).  
Other destinations: `RECHAZADA`, `EXPIRADA`, `CANCELADA`, `INDETERMINADA` y `REQUIERE_REVISION`.  
**Do not reopen** an attempt completed, or allow for post-expiry approval without explicit conciliation.
- For each maximum attempt a confirmed sale, an idempotent key and a receipt link.
- No webhook/retry/refresh runs a second POST sale with another key.
- Persistent GET status verification; the frontend never stores collection only in `localStorage`.
- For trial payments, `payment_origin=SIMULADO_QA` and notice “No real money received”. Only future verifiable orders may have `payment_origin=MERCADO_PAGO_VERIFICADO`.

### Delivery B5 (final stage audit)
Incremental code review in a single branch, without merit until full closure B6. Tests of compatibility of declared sales, permits, invitations, stocks, purchases, DEMO box, users and multiple companies. Integral human validation after B6. Document what functionalities are REAL, which DEMO, which deferred.

## 4. Data design and compatibility

Evolutionary proposal:
- `merchant_payment_connections`: account metadata per company.
- `qr_payment_intents`: attempt, total in cents, ARS, single reference, source DEMO, maturity, status, `business_id`, `location_id` y eventual `sale_id`.
- `qr_payment_intent_lines`: article/price/quantity snapshot (thousandths compatible with POS).
- `qr_payment_events`: immutable record of transitions, actor, supplier and deduplication.
- `stock_reservations` **only if the B4 policy decides to reserve**, respecting continuance and expiration; not to declare stocks fictitiously reserved.

Minimum of invariants: index/unique per tenant for connections and idempotency keys; not accepting arbitrary changes of ownership or `business_id`; explicit attendance and SQL restrictions; actor traceability, session and origin; pennies and thousandths accuracy; 404 output without other company resources data; ban demo→real transit for changing a IU flag.

## 5. Deliberate exclusions of B1–B5

Do not create general bank accounts, balance sheets or external transfers, do not credit bank money, do not yet implement OAuth with real sellers, nor pay link, customer bookings or payment with QR from **Article**The Article/Identification QR is separate from the **QR from a sale**, which is the only current target. It does not promise to display images or all fields within the Pay Market app: the full breakdown will be displayed in our interface.

## 6. Official external references, verified 12/11/2026

- QR overview: https://www.mercadopago.com.ar/developers/es/docs/qr-code/overview
- Orders API for QR, `items[]`, `X-Idempotency-Key`, box and `qr_data`: https://www.mercadopago.com.ar/developers/es/docs/qr-code/payment-processing
- QR Purchase Tests: https://www.mercadopago.com.ar/developers/es/docs/qr-code/test-integration/test-purchase
- Migration to Orders API and Mode `dynamic/hybrid`: https://www.mercadopago.com.ar/developers/es/docs/qr-code/resources/migrate-dynamic-qr-model-to-orders
- Webhooks `order.*` and signature: https://www.mercadopago.com.ar/developers/es/docs/qr-code/notifications
- OAuth authorisation of third parties and PKCE: https://www.mercadopago.com.ar/developers/es/docs/security/oauth/creation

The official API can evolve; revalidate exact parameters and app/account eligibility before B6.
