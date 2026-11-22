# E3-2C · B7 — Automatic combination with the single QR QA box

**Base:** B6 commit `6ed69cc70a740f2491daf06510fa0b8366d70f47`. **Rama:** `feature/e3-2c-qr-qa-caja-unica`.
Sin merge a `main`. The B6 code (OAuth per seller/dynamic Orders) is retained independently.

## Resources already created by the TEST Payment Market operator

| Type | Identifier |
|---|---|
| Seller TEST | `3837129107` |
| Sucursal TEST | `89968780` (`PYMEQA001`) |
| TEST box | `140776986` (`PYMEQA001POS001`) |
| Static QR | plot returned by Mercado Pago when creating that box |

Do not re-invoke branch POST or POS. The public plot is represented in PNG from the backend with `qrcode`but it does not amount to a payment or an order.

## B7-A implementation: reading link (delivered)

- `GET /api/v1/businesses/{business_id}/mercadopago/qa-shared/connection`.
- It requires active membership and session in the company; foreign companies give 404.
- Returns by company a **virtual, automatic association** to the same QA resource; no traders or boxes are created, no balance is written and credentials are copied.
- Visible in **Means of collection** for any QA company, only if `PYME_DISPOSABLE_QA=1` y `PYME_MP_QR_SHARED_QA_ENABLED=1`.
- It does not use Access Token, private key, OAuth or remote API. When flags are missing it does not expose the QR frame or its identifiers.
- While the shared QA mode is enabled, OAuth vendor registration and POS change from B6 routes are blocked by backend.
- The IU makes explicit: no one has yet been created **order** to allocate amount; there is no accreditation or guarantee that the QR remains active in the provider.

## B7-B pending: enable real QR charging in TEST, before dialing the ready flow

Setup required `PYME_MP_SHARED_QA_ACCESS_TOKEN` **solo en el entorno backend QA** and check by GET the identity of the seller and box (without pasting the token on GitHub, frontend or this conversation).
1. Extend Orders API B6 to Mode **static** using `config.qr.external_pos_id=PYMEQA001POS001`; each sale/company generates its own `external_reference` and idepotent key.
2. One external attempt globally pending per box, excluding **database**; companies remain isolated by `business_id`.
3. Validate amount and items from snapshot, Merchant/Test status, signed webhook or GET to supplier, and just then settle QA idempotent sale.
4. Try TEST buyer, local card and accessible network; never claim that a payment is credited just because the QR appears.
5. Do not allow other boxes or accounts to shared QA users.

B7-A does not integrate remote payments. **Do not scan as if the POS cart is associated with this QR until B7-B is finished.**.

References: https://www.mercadopago.com.ar/developers/es/docs/qr-code/payment-processing
