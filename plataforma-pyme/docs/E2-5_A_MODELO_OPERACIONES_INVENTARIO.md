# E2-5 A — Compatible ledger inventory and expansion operations model

**Date:** 09/11/2026 · **Status:** implementation validated in IC; pending to merit and local Windows validation.
**Base exacta:** `main` `1a188f9a596f4674ca121806ecb92e6a96abf294` (close documentary E2-4).
**Scope:** RF-06, CU-09 (transfers), CU-11 (adjustments), support of CU-07/08 (reception/reading). **sin nuevos endpoints HTTP en este corte**.

## 1. Problema que resuelve

En E2-4 E, `stock_movements` I only had positive entries. `COMPRA_RECEPCION`, con `receipt_id` y `purchase_line_id` This structure could not represent an exit, a transfer or an adjustment without violating SQL restrictions. Reception 1:1 is retained **without redesigning it**and another source is prepared for future manual movements.

E2-5 A crea `inventory_operations` and expands the ledger in an additive way. Do not move, do not create real initial stock, do not edit stocks and do not publish new commands. Future balances update should occur **in the same transaction** that movements; INSERT must not be made direct to operate commercially.

## 2. Entities and restrictions implemented

### `inventory_operations` — header of a manual operation

| Field | Rule |
|---|---|
| `id` / `business_id` | UUID of operation and company, FK restrictive |
| `kind` | `TRASLADO`, `AJUSTE_ENTRADA`, `AJUSTE_SALIDA`, `STOCK_INICIAL` |
| `catalog_item_id` / `unit_snapshot` | Physical property of the same tenant and historical unity of the operation |
| `quantity_milli` | 1.999999999 thousandths; discrete units with multiples of 1000 |
| `source_location_id` / `destination_location_id` | FK locations per tenant; mandatory addresses and consistent with `kind` |
| `reason` | Required reason for 3,500 characters not empty |
| `request_id` / `request_sha256` | Single Company Key and 64 Character Footprint (Power of future commands) |
| `actor_id` / `created_at` | Business Membership and Historical Date |

Stop `TRASLADO` two locations required **different**. Stop `AJUSTE_SALIDA`- Just origin. `AJUSTE_ENTRADA` y `STOCK_INICIAL`It's modeled. **one item per basic operation**; lots, multiple counts and multiple items per command are future extensions.

Includes UNIQUE `(business_id,request_id)` y `(business_id,id,kind)`. The last supports three-column FK from the movement: it prevents associating an event to a header of another class or tenant. **The value sent to ORM is not in itself an authentication test**: future services must authenticate, validate permissions, company and location, and calculate the footprint.

### `stock_movements` — expanded historical ledger

Continue to include `receipt_id` y `purchase_line_id`Now. **optional** to allow new origins. Added `inventory_operation_id` y `operation_kind`, both NULL in the already existing entrances by reception, with FK composed of `inventory_operations`.

Restriction `ck_stock_movements_origin_and_sign`:

- `COMPRA_RECEPCION`: `receipt_id` y `purchase_line_id` present, manual operation absent, `delta_milli > 0`.
- `TRASLADO_SALIDA`: only operation `TRASLADO`- No, no.
- `TRASLADO_ENTRADA`: only operation `TRASLADO`- Yeah, it's a positive delta.
- `AJUSTE_SALIDA`: only operation `AJUSTE_SALIDA`- No, no.
- `AJUSTE_ENTRADA`: only operation `AJUSTE_ENTRADA`- Yeah, it's a positive delta.
- `STOCK_INICIAL`: only operation `STOCK_INICIAL`- Yeah, it's a positive delta.

Movements must satisfy **exactly one of the two sources implemented** (reception or manual operation), with the commercial line only if it is received. `operation_kind IS NOT NULL` to prevent a `CHECK` SQL acepte `UNKNOWN` by semantics NULL. UNIQUE `(business_id,inventory_operation_id,event_type)` prevents duplicating the side of a simple transfer. **third origin, Sale**, follows TO-BE; no fictional table is created.

**Invariants requiring E2-5 B/C services:** both move movements must exist or none; location, article, sign and amount of movement must correspond to their header; not decrease non-existent balances; ensure stable order of locks and a single commit; keep track of errors. FK and CHECK of this cut are partial defenses, **do not replace transactional use cases**.

### `stock_balances` y `purchase_receipts`

**Not amended**. It is preserved `stock_balances` (non-negative quantity, triple version and key) Historical receptions and their movements are not rewritten. The keys of idempotence and the snapshots of E2-4 remain valid.

## 3. Additive migration and compatibility

File: `backend/alembic/versions/20261109_0016_inventory_operations.py`

- New head: **`e25a_inventory_ops`**, descendant of `e24e_receipt_stock`.
- `CREATE TABLE inventory_operations`, FK composites, UNIQUE and CHECK.
- `ADD COLUMN stock_movements.inventory_operation_id NULL` y `operation_kind NULL`.
- `receipt_id`/`purchase_line_id` they go on to allow NULL, without updating the existing values.
- Two legacy CHECKs for reception tickets are replaced by a general CHECK of origin, class and sign. UNIQUE is preserved `uq_stock_movements_receipt_line`.
- FK is added to header and UNIQUE by event.
- Reversal is blocked **if there is already any manual operation**, not to erase its origin; never use `downgrade` at the work base.

Previous migrations, React views, endpoints, sales and financial accounts are not modified.

**API Compatibility:** as long as there are no E2-5 B/C commands, the Motions GET continues to return only receptions and its E2-4 DTO, which requires `receipt_id`. **Before** to allow new events by HTTP, E2-5 B should extend the read response without breaking historical data; do not insert manual operations using external SQL to try to simulate end-use.

## 4. Planned testing

- SQLAlchemy metadata contract: table, columns, FK per tenant, uniqueness and CHECK.
- Real SQL PostgreSQL 16: Invalid address rejection, origin=destination, discrete fractional quantity, alien tenant, repeated request, incorrect sign, incompatible type event and operation without `operation_kind`.
- Retrocompatibility: Record and receive a purchase using E2-4 endpoints, check voucher, movement and balance without change of form or quantity.
- IC with PostgreSQL 16 and Alembic `e25a_inventory_ops` sin deriva, Python 3.12/3.14 y Docker.
- Local tests: execute them **without deleting QA records**. The external transaction test reverses the data it creates itself. There is no manual motion QA E2-5 A: there are no endpoints yet.

## 5. Order of the following courts

1. **E2-5 B — Transfers**: protected endpoint, SELL/STORE validation according to agreed policy (transfers require STORY capacity in both deposits), location permits, conditional discount without negatives, concurrent entry, two movements in one transaction, double idempotent retry, HTTP and race tests.
2. **E2-5 C — Ajustes y stock inicial**: justified positive/negative adjustment; initial stock only once per location/article under validated rule; absolute counts with version observed when applicable.
3. **E2-5 D — Reading, reconciliation and robustness**: extend GET movements for manual origins, audit per operation, filters, permissions, SQL control commanding and consistency testing.
4. **E2-5 E — Closure**: Swagger evidence, IC, documentation and complete local evidence.

**Recognized cross-sectional debt:** Local integration tests still use PostgreSQL development with rollback for fixture and filters per tenant; the IC does use an ephemeral container. Isolate a base `pyme_test_db` Dedicated (and the competition tests that currently create temporarily compromised tenants) requires changing the environment/configuration and will be addressed as controlled work in E2-5, not with data deletion or destructive commercial migration.

## 6. Windows playback after integration

From `plataforma-pyme/`, with preserved development DB:

```powershell
git switch main
git pull --ff-only origin main
cd backend
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check

$env:RUN_DB_INTEGRATION = "1"
try {
    .\.venv\Scripts\python.exe -m pytest -q
} finally {
    Remove-Item Env:\RUN_DB_INTEGRATION -ErrorAction SilentlyContinue
}
cd ..
```

**Waited:** `e25a_inventory_ops (head)`, without migration drift and suite without faults. CI confirmed 816 approved tests; Windows execution should be documented separately, without attributing to the local machine results not yet executed.
