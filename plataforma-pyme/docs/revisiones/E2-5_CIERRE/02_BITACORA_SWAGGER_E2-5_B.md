# E2-5 B — Manual QA log in Swagger (transfers)

**Origin:** HTTP responses provided by the developer in this conversation, 09/11/2026. It was not an independent remote execution. **No token or real idepotent key is transcribed.**

**Controlled scenario:** a QA user with a membership holder, a QA company, two active locations with `can_store=true` (QA deposit and House) and a physical article `UNIDAD`The test used the purchase and receipt of block E2-4 as preparation, not as new code E2-5 B.

## 1. Observed sequence and results

| ID | Application/operation | Observed HTTP | Evidence / technical reading |
|---|---|---|---|
| B-01 | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` | Correct High and Authentication | QA identity was created and operated with valid session. No credentials are retained. |
| B-02 | `POST /businesses` | **201** | QA company with enabled holder. |
| B-03 | `POST /businesses/{business_id}/locations` twice | **201 / 201** | QA deposit: `DEPOSITO`, `can_store=true`, `can_sell=false`; House: `CASA`same storage capacity. |
| B-04 | `POST /catalog` Article A | **201** | `Alimento balanceado QA`, `REVENTA`, `item_type=BIEN`, `unit=UNIDAD`, `status=ACTIVO`. |
| B-05 | Initial attempt to `POST /purchases` with Swagger example, `quantity_milli=1` | **422** | Correct rejection: a discrete unit requires thousandths multiples of 1000. In addition the form retained an example ID; the attempt **didn't create a purchase**. |
| B-06 | `POST /purchases` Fixed: 10 units, unit cost 10,000 cents | **201** | Purchase `REGISTRADA`total `100000` cents ($1,000 ARS); still no physical income. |
| B-07 | `POST /purchases/{purchase_id}/receive` QA Deposit | **201** | `purchase_status=RECIBIDA`, movement `COMPRA_RECEPCION +10000`, destination balance 10000, version 1. |
| B-08 | `POST /inventory/transfers` QA Deposit → House of `4000` Thousandthies | **201** | Operation `TRASLADO`, two facts: exit `-4000` and entry `+4000`; both linked to the same operation. |
| B-09 | `GET /inventory/balances` filtered by article A | **200** | Home `4000`, version 1; QA deposit `6000`version 2; total 10000. |
| B-10 | Repeat **identical** of B-08 (same body, same unpublished key) | **200** | Transfer ID, date and IDs of both movements equal to the first response. |
| B-11 | Attempted transfer of 7000 from QA Deposit (available 6000), new key not published | **409** | `Stock insuficiente en la ubicacion de origen`. |
| B-12 | `GET /inventory/balances` after 409 | **200** | Home `4000`, version 1; QA deposit `6000`version 2, `updated_at` of the original transfer. |
| B-13 | `GET /inventory/movements` filtered by article A | **200** | **Exactly three moves:** -4000 departure, entrance +4000, reception +10000. No double transfer or entry for 409. |

## 2. Invariants contrasted with data

- **Storage of the transfer:** `(-4000) + 4000 = 0` thousandths. No physical gain/loss was recorded when changing location.
- **Keeping of total after reception:** `6000 + 4000 = 10000` thousandths; matches `COMPRA_RECEPCION +10000`.
- **Versions:** Deposit went to 2 after departure; Casa was created with version 1 upon receipt of the transfer.
- **Common Ledger:** each origin has a correct historical relationship: reception preserves `receipt_id`/`purchase_line_id`; transfers use `inventory_operation_id`/`operation_kind`.
- **Idempotency:** B-10 returned itself `id` and movements, and B-13 did not show new ranks.
- **Rejection without partial effects:** B-11 was 409 and B-12/B-13 showed unchanged balances and movements.
- **Strict validation:** B-05 was an input/example error from Swagger, **no** a proven API bug.

## 3. Contrast voucher identifiers (not credentials)

- Purchase: `c890b079-5d4c-4977-8143-258946d92060`.
- Reception: `b5c6ce63-d99a-473a-83a1-2ee07eba1132`.
- Transfer: `be1de1eb-90bc-4be3-ac6e-84f5e9d1640f`.
- Reception movement: `faffad9c-6134-4714-b243-58c38315757b`.
- Exit movement: `e73c0ec9-c976-45b4-8c1f-ce3cea21398b`.
- Input movement: `d2e3ee16-b1f8-4466-a5eb-f4130b3caa8e`.

The previous UUIDs are **Resource IDs**, not authentication keys or idempotence. They allow recognition of a future response, but do not grant access without permissions. Business identifiers/articles/locations: see `07_FICHA_QA_SANITIZADA.md`.

## 4. What this log does NOT prove

There were no two concurrent clients in Swagger manual, a trial among tenants, revocation of permissions during writing or blocking stress. **automated tests** documented in `04_PRUEBAS_AUTOMATIZADAS_CI_Y_WINDOWS.md`; are not attributed to this manual session.