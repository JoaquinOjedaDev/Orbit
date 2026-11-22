# E2-5 C — Inventory and initial stock adjustments (CU-11)

**Date:** 09/11/2026. **Status:** implementation verified in IC; pending to merit and local validation Windows.
**Integration base:** `main` `4f992b3beb8dda732e4cd752f828b375f240e13d` (E2-5 B; 826 tests y QA manual).
**Scope:** RF-06 / CU-11, physical transactions of an item in a location, audit, idempotency and balance version. **No** touch frontend, purchases, transfers, sales and previous migrations.

## 1. Scope of the command

New `POST /api/v1/businesses/{business_id}/inventory/adjustments` with Bearer session and `Idempotency-Key` UUID4.

```json
{
  "kind": "AJUSTE_ENTRADA",
  "catalog_item_id": "<UUID DE ARTICULO FISICO>",
  "location_id": "<UUID DE UBICACION>",
  "quantity_milli": 2000,
  "expected_version": 1,
  "reason": "Sobrante identificado en recuento"
}
```

**Authorised types:**

| `kind` | Physical effect | Restrictions |
|---|---|---|
| `AJUSTE_ENTRADA` | Add `quantity_milli` to the existing balance | Reason, balance version, well active and STORE space |
| `AJUSTE_SALIDA` | Discount `quantity_milli` of the existing balance | Rejects insufficient stock, exact reason and version |
| `STOCK_INICIAL` | Create the first balance of a location+article pair | Only if **Never** there were balances or movements for that pair; `expected_version: 0`; title/admin role |

Amount in thousandths positive `1..999999999`; discrete units `UNIDAD`, `PAQUETE`, `CAJA` multiples of 1000. The body is strict (`extra=forbid`), standard and mandatory ratio 3.500 characters, `expected_version` is strict integer (not boolean).

**Express decision:** `AJUSTE_ENTRADA` y `AJUSTE_SALIDA` only operate on a previously created balance (by purchase, transfer, initial). The first balance is not created with an adjustment to circumvent the reinforced permission of `STOCK_INICIAL`. A used pair does not re-initialize **even with a zero balance**.

## 2. Version control and competition

The customer **read first** `GET /inventory/balances`. The balance brings `version`:

- If there is no record for the article+location pair, the initial stock uses `expected_version=0`.
- If it exists, an adjustment must send exactly `expected_version` that he observed.
- After a successful adjustment the version increases by one.
- If a reception, transfer or other setting changes the balance between reading and writing, the command returns **409 Conflict** y **no row is modified**; reread the balance before trying again with a new key.
- An outdated version is not treated as an executed operation; the request is rejected. The replay of a command previously confirmed with the **same** key and body returns its historical voucher with 200 even if the current balance evolved.

The backend revalidates user/session, company/membership, status and capacity STORE. It blocks location before catalog (`FOR SHARE`) and balance (`FOR UPDATE`), consistent with E2-4/E2-5 B receptions and transfers.The location lock also serializes the initial discharge with the purchase and transfer entries from that same deposit; there is no blind reading/insertion of the balance.

Balances, header `InventoryOperation` y **un** signed movement `StockMovement` a failure makes rollback; the historical leadger is preserved. No double editable balance is created.

## 3. Authorization

- `STOCK_INICIAL`: only `TITULAR_ADMINISTRATIVO` o `ADMINISTRADOR`, active membership and business, own location `can_store=true`.
- `AJUSTE_ENTRADA` / `AJUSTE_SALIDA`: the previous ones and also `ENCARGADO` **if you have an Active allocation to that location**. `TRABAJADOR` cannot be adjusted by the command's impact on stocks.
- Any user without authorization, no session or belonging to another company cannot produce or read other people's transactions. The voucher query applies the current business reading permit.

## 4. API, History and Idempotency

| Action | Outcome |
|---|---|
| `POST /inventory/adjustments` new operation | `201` with id, type, article, location, quantity, reason, actor, timestamp and movement |
| Same key, actor, type and identical body | `200`, **same** id and movement, without new variation |
| Key same with different load, actor or reused in transfer | `409`No new operation. |
| `GET /inventory/adjustments/{adjustment_id}` | `200` Unchangeable proof; `404` if it does not belong to the tenant |
| `GET /inventory/movements` | Existing + new movements `AJUSTE_*` y `STOCK_INICIAL`, with signed delta and reference origin |
| `GET /inventory/balances` | New balance and version; is the current source of availability, **no** historical voucher |

Codes: `401` no meeting; `403` no role/assignment; `404` company, file or missing/foreign location; `409` insufficient stock, initial already used, incompatible key, obsolete version, inactive business/location or overflow; `422` Invalid formatting or incompatible fractionation.

### Compatibility

Reusing already validated migration `e25a_inventory_ops`. E2-5 C **does not require another migration**. The table supports exactly the types used; the E2-4 contract of purchases, receipts, `POST /receive`The general reading of the ledger already supports the three new events from E2-5 B.

## 5. Evidence and evidence matrix

**IC code E2-5 C verified:** GitHub Actions #42616213215, **3/3 successful jobs**: **840 approved tests** with Python 3.12 (2 warnings) and **840** with Python 3.14 (3 warnings); PostgreSQL 16, `e25a_inventory_ops (head)`, `alembic check` No drift, healthy Docker build and liveness. Warnings did not affect the status of IC; analyze them as technical debt, do not hide them. **Windows run still pending.**


- Postgres FastAPI con rollback `isolated`: positive initial, replay and conflict, veto to the second initial even after the balance has been exhausted at zero, in/out of balance and ledger signed, rejection of insufficient quantity, obsolete version and change from post-transfer version, discrete unit, range, unknown fields, intangible service, authorization by role/location, alien tenant, shared idempotency with transfer and compatibility of `PurchaseReceiptView`.
- Three PostgreSQL tests with **standalone HTTP connections** and ephemeral tenant of its own: two competing outputs from the same version (201/409), same simultaneous request (201/200), two simultaneous initials (201/409).
- IC expected: PostgreSQL 16, `e25a_inventory_ops (head)`, `alembic check` sin deriva, Python 3.12 y 3.14 + imagen Docker.
- Local Windows: tras merge, `git pull`, `alembic current`, `alembic check`, suite completa `RUN_DB_INTEGRATION=1`, `docker compose --profile api up -d --build --wait api` y `/ready`.

**Debt not included:** absolute physical count (`cantidadContada` → derivative delta), adjustment of multiple articles/lots, compensatory cancellation, aggregate limits, policy to review sensitive adjustments, scheduled reconciliation of ledger vs balance and hardening against direct SQL. **no** deletes or modifies purchase or transfer records; leaves a new signed move.

## 6. Manual E2-5 C Swagger Guide without altering example E2-5 B

QA data observed after E2-5 B (check first its validity):
- Company `3b161aa4-f476-4efc-8293-5978d590e0fe`
- Item `e3bcd831-1ae5-48ab-b1c1-0c43e58ae84b` — QA balanced food
- Deposit `b492ced2-0faa-42d8-b652-609fc4c2b6f4`: **6000**version **2**.
- Home `a741f945-5c88-4855-8ff0-708374ac16f8`: **4000**version **1**.

To test E2-5 C without touching these balances, **create another test article** with new SKU, for example `INICIAL-E25C-001`unit `UNIDAD`, type `REVENTA`and use Casa for its first initialization. `GET /inventory/balances` for that item you must return an empty list.

1. `POST /inventory/adjustments`, `kind=STOCK_INICIAL`, new article, `location_id=Casa`, `quantity_milli=5000`, `expected_version=0`, `reason="Conteo inicial para pruebas E2-5 C"`, new key UUID4 → **201**, a movement `STOCK_INICIAL +5000`.
2. Repeat **same key and body** → **200**, same id, balance 5000 version1.
3. New key, same `STOCK_INICIAL` → **409**, balance no change.
4. `AJUSTE_ENTRADA` +2000 con `expected_version=1` → **201**, balance7000 version2.
5. `AJUSTE_SALIDA` -1000 con `expected_version=2` → **201**, balance6000 version3.
6. Try `AJUSTE_SALIDA` -7000 con `expected_version=3` and new key → **409**, balance and ledger intact.
7. Try setting +1000 with `expected_version=1` and another key → **409 by obsolete version**, balance and ledger intact.
8. Check movements for the article: exactly three, `STOCK_INICIAL +5000`, `AJUSTE_ENTRADA +2000`, `AJUSTE_SALIDA -1000`net **6000**. The 6000/4000 of the balanced food was not modified.

**Do not send in reports or to the repository** Bearer tokens, passwords or idepotent keys. Register HTTP codes, operations IDs and sanitized snapshots. Try the path in Swagger **only after merging PR and rebuilding Docker**.
