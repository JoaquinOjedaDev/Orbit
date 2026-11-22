# E3-2B · B6 — Market Official payment TEST: OAuth, QR Orders, conciliation and sale QA

**Workforce:** `feature/e3-2b-mercadopago-qr-demo`.  
**Mode of operation:** only **test accounts and credentials**, en PostgreSQL **disposable**. **Deactivated by default. Not prepared for production.**  
**Policy:** keep B1–B6 in this branch; DO NOT modify `main` without express authorization. The connection to real MP is not validated without effective authorisation and Seller Test.

## Official sources and decisions (requested 12/11/2026)

- [Integrate QR payment processing](https://www.mercadopago.com.ar/developers/es/docs/qr-code/payment-processing). Orders API POST `/v1/orders`; `config.qr.mode=dynamic`, `config.qr.external_pos_id` pre-registered cash register, `X-Idempotency-Key`, `transactions.payments[0].amount` exact decimal place; obtain `type_response.qr_data` and print QR.
- [Migrate Dynamic QR to Orders](https://www.mercadopago.com.ar/developers/es/docs/qr-code/resources/migrate-dynamic-qr-model-to-orders). Prefer Orders API and Topic `order` instead of APIs legacy.
- [OAuth authorization code + PKCE](https://www.mercadopago.com.ar/developers/es/docs/security/oauth/creation). Credenciales solo backend; `state` random; `code_verifier` single use; `code_challenge_method=S256`; `test_token=true`.
- [Webhooks QR](https://www.mercadopago.com.ar/developers/es/docs/qr-code/notifications)Validate `x-signature` y `x-request-id` with HMAC SHA256; notification is NOT self-accredited: GET to Orders API with vendor token from your company.
- [Create branch and box](https://www.mercadopago.com.ar/developers/es/docs/qr-code/create-store-and-pos). It is required to configure seller, branch and box. `external_pos_id` es el `external_id` box: **no** es CBU/CVU ni token.

## UX taken from the HTML provided

- `WALOS_M3_Cargar_Venta_POS_vNext(2).html`: keep review of the cart, snapshots per line, quantities, subtotal, discount, total and transition to QR with expiration; DO NOT adopt your `PaymentMockEngine` as proof of a real payment.
- `WALOS_Modulo_Ventas_UX_v4_0(4).html`: separate history, proof, payment record and closing of sale; do not confuse commercial amounts with bank balances.
- `cuentas_bancarias_asociadas(2).html`: keep clear cards, roles and states with design `md:grid-cols-2`, mobile a column. Do not reuse generic QR image URLs, fictitious CBU/CVU, example personal data or token paste forms.
- The app is multi-company and multi-rub. WALOS is just an example client.

## Architecture B6

### 1. Databases and encryption

Migration `e32b_mp_official` after `e32b_qr_sales`:
- `mp_oauth_pending`: hash SHA256 de `state`, `code_verifier` encryption, user and related company, 10 min expiration and single use.
- `mp_test_accounts`: 1 seller per company, single and identified MP seller globally, token and refresh encrypted with Fernet, status, maturity and external box.
- `mp_test_orders`: 1 order per original QR, idempotencia + requestUUID4, exact amount in single cents, reference and ID order, answer `qr_data` test, reconciled MP status, optional single link to `Sale`.
- Relationships by foreign keys composed of `business_id` hacia QrPaymentIntent/Sale/Account. Nunca enviar tokens en JSON ni usar `localStorage` for credentials.

### 2. Intentional blocking

B1–B5 conserved `MOCK_QA`; B6 introduces separately `official-test`.
- An official TEST order can only be issued from an original QR `ESPERANDO_PAGO` sin caducar.
- When it already exists `mp_test_orders` For that QR, the simulator B3 and closure DEMO B4 are locked (409); you can not add another sale by the same cart.
- Official orders are created with `X-Idempotency-Key` equal to `request_id` of the frozen QR. Recovery by `GET orders/for-qr/{source_intent_id}` after F5. Uncertain responses require forwarding **same** order and key, not generate another.
- The amounts, catalogue and notes come from snapshots on server, never from a new browser form.
- The IU displays fictional QR in mode B2 and official QR TEST separated only if MP returns `type_response.qr_data` valid; no generic external URL QR.

### 3. Reliable States

| Status | Meaning | Impact inventory |
|---|---|---|
| `PREPARANDO` | Preparation persisted before remote POST | None |
| `INDETERMINADA` | Timeout/Distant Unknown result | None; preserving identity |
| `CREADA` | Order TEST created and QR dynamic displayed | None |
| `PROCESADA` | Get to supplier confirms `status=processed` + processed transaction | None yet |
| `REQUIERE_REVISION` | TEST payment processed but could not create catalog/stock sale | None partial; human review |
| `CANCELADA`, `EXPIRADA`, `REEMBOLSADA` | Reconciled remote States | Do not sell; review refund if already sold |

The state `PROCESADA` is not synonymous with sale. `settle-qa` supplier consultation, requires `status_detail=accredited`, administrative role and records sale, lines, payment `MERCADO_PAGO_QR_TEST`, movement/stock and link `sale_id` with one `COMMIT`. Repeat returns the same `sale_id` No rescount.

**Important:** a test payment processed with missing stock remains `REQUIERE_REVISION`, without partial sale; no automatic refund or stock compensation is implemented in B6. A post-sales reimbursement requires human process of compensation, never retroactively deleted.

### 4. Endpoints

| Low path `/api/v1` | Action |
|---|---|
| `GET /businesses/{bid}/mercadopago/official-test/connection` | OAuth account without secrets |
| `POST /businesses/{bid}/mercadopago/official-test/oauth/start` | Official PKCE authorisation URL (title/admin) |
| `GET /mercadopago/official-test/oauth/callback` | Code/state of single use, save encrypted tokens |
| `PUT /businesses/{bid}/mercadopago/official-test/pos` | Link external box_pos_id MP |
| `POST /businesses/{bid}/mercadopago/official-test/orders/from-qr/{qr_id}` | Create dynamic TEST command with identical key to the original QR |
| `GET /businesses/{bid}/mercadopago/official-test/orders/for-qr/{qr_id}` | Recovery after F5 |
| `GET /businesses/{bid}/mercadopago/official-test/orders/{order_id}` | Read local state |
| `POST /businesses/{bid}/mercadopago/official-test/orders/{order_id}/reconcile` | Get to Market Payment and validation of merchant, QR, currency and amount |
| `POST /businesses/{bid}/mercadopago/official-test/orders/{order_id}/settle-qa` | Confirm QA sale without duplicates, from verified processed status |
| `POST /mercadopago/official-test/orders/webhook` | HMAC + GET reconciliation signature (without body acceptance as evidence) |

### 5. Secure configuration, DO NOT run on the usual base

The service is off except **both** flags:
```text
PYME_DISPOSABLE_QA=1
PYME_MP_QR_TEST_ENABLED=1
```
Before official testing, the operator must configure the following variables as secrets of the QA environment (never cover them, paste them in ChatGPT or send them to the frontend):
```text
PYME_MP_CLIENT_ID=<APP_ID del integrador TEST>
PYME_MP_CLIENT_SECRET=<secreto de la aplicación, SOLO backend>
PYME_MP_REDIRECT_URI=https://qa.example.net/api/v1/mercadopago/official-test/oauth/callback
PYME_MP_FERNET_KEY=<clave Fernet generada y custodiada fuera del repositorio>
PYME_MP_WEBHOOK_SECRET=<firma secreta configurada en Developers TEST>
PYME_MP_FRONTEND_RETURN_URL=https://qa.example.net/real/empresas
```
`PYME_MP_REDIRECT_URI` must match exactly the MP application log. It requires public HTTPS for OAuth/webhooks (except frontend loopback return option supported in QA mode). It is not set `API_ROOT` by input: the provider host is fixed. Creating the app and box requires action from the trial account holder, outside GitHub.

Fernet must be preserved between restarts: its loss makes tokens illegible, and its replacement requires migration/controlled rotation. Do not enable access to production with these routes, nor mix real funds with DEMO.

### 6. Security and mobile UX

- Buttons and controls with accessible status, `role=alert/status` and touch sizes of at least 44 px; readable cards and vouchers without zoom.
- There are no fields to paste access tokens, Webhook Secret into HTML, or redirect to OAuth host chosen by the user.
- OAuth always open in domain `auth.mercadopago.com`; fixed and unreflected return `code`/`state`.
- B3 log is preserved; official orders have supplier reference and identifiers, but do not invoke the B3 simulator.
- QA confirmation is explicit and requires a holder/manager. A seller may consult the order he created, but not settle funds and stock without administrative role.
- Do not use a QR as proof of payment: only authenticated order API query and complete validation.

### 7. Automatic QA and acceptance conditions

Python/SQLAlchemy/PostgreSQL + Node/Vite + Playwright Chromium:
- PKCE S256 state expires and is only used once; OAuth rejection `live_mode=true`.
- Encrypted tokens, administrative permission and company isolation.
- Correct HMAC, replay, timestamp ±5 min, rejection of other data.
- Request y response de Orders: `mode=dynamic`, `external_pos_id`, exact decimal amounts ARS, seller user, references and sum of payments.
- Idempotence before double click/uncertain response and recovery by QR.
- Single sale validation and mutual locking B3/B4/B6; stock is not discounted before QA closure.
- Desktop/mobile UI, non-production labeling, external OAuth without customer secrets.
- Full module and Alembic regression `current/check`.

**The simulated HTTP suite does not certify the operation of Real Payment Market.** A successful official test still requires: Seller Test, Developers app, MP branch/box, accessible callback URL and HTTPS Webhook, a purchase from TEST buyer, signed event and remote GET confirmed. This cannot be executed without those credentials and a user-provided trial account in the QA environment.

## 8. Time of manual functional testing

After green CI of B1–B6 in **el mismo commit**, documentation and security review. A guided matrix will be delivered to verify:
1. Registration/company/rol, DEMO and TEST differentiated.
2. Linking OAuth Seller Test, box, and QR for detailed sale.
3. Mobile reading and F5/reintents: do not duplicate order or stock.
4. Buy with buyer TEST user, webhook HMAC, reconciliation.
5. Sales + inventory + proof and stock incidents; rejection/refund.
6. Multi-company isolation; control of holders and workers.

Do not make a merge or modify the local base until express approval. After B6, the environmental/test limitations are left as specific slopes, no external gateway approval is faked.
