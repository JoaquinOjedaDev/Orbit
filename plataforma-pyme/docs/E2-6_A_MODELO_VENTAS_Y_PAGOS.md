# E2-6 A — Transactional Persistence of Sales and Declared Payments

**Date:** 09/11/2026.  
**Status:** proposed implementation in the branch `feat/e2-6-a-sales-persistence`, **pending IC and local validation**.  
**Scope:** only `plataforma-pyme/`; without modifying E2-1–E2-5 code or applied migrations.  
**Base of departure:** `main` `4fad77ea458b195ad136726e670d93a8ecf85f4e`.  
**RF/CU:** **RF-07 / CU-10**, RF-03 dependencies (locations), RF-04 (catalogue), RF-05 (reception), RF-06 (stock).  
**References:** `entrega-programacion-2/{01,02,03,04,05}`; `docs/ADR/ADR-004-stock-unidades-sku.md`, `docs/ADR/ADR-006-ventas-pagos-qr.md`, `docs/20_E1_C1_VENTAS_DEMO.md`. La DEMO no equivale a backend de ventas.

## 1. Executable division of block E2-6

| Stage | Objective | Evidence of acceptance |
|---|---|---|
| **E2-6 A** | SQL models, FK tenant, snapshots, declared payments, origin `VENTA_SALIDA`, additive migration and DB testing | DDL + Alembic + PostgreSQL integration and structural tests; no sale can be run by HTTP yet |
| **E2-6 B** | `POST/GET /api/v1/businesses/{business_id}/sales`: Pydantic validations, exact cents, discount, split, reading, auth, permissions and idempotence | Service and APIs with sale only of services without location, and mixed sales to C; 201/200/401/403/404/409/422 |
| **E2-6 C** | Selling physical and mixed goods: locks, conditional debit, ledger `VENTA_SALIDA` once per line physical and snapshots balance | Two simultaneous sales for the last unit: one 201 and another 409; no payment or partial balance |
| **E2-6 D** | Hardening and regression: membership/roll/session changes, idempotency/replays, shopping collisions/stock, SQL errors, limits, mixtures per tenant, QA permissions | IC and cross-tests E2-4/E2-5/E2-6; Swagger manuals with own data |
| **E2-6 E** | Current academic documentation, QA closure and delivery report for independent auditor | Evidence with actual SHA/CI/Swagger, PR documentary, no secrets or invented tests |

**No actual sales enabled before E2-6 C**. Stage B should be kept in focus: if you enter sales of services, you must not register a physical sale before having atomization of stock. Any shipment of goods must be refused up to C.

## 2. Architecture and AS-IMPLEMENTED states in A

### Entities

- **`Sale` → `sales`**: company, `location_id?`, `request_id` UUID4, digest SHA-256, `status=CONFIRMADA`, subtotal, discount, total, notes, actor and time. `balances_after` JSONB is historical snapshot of response after commit, **not an editable balance source**. `request_id` is unique **within a company**.
- **`SaleLine` → `sale_lines`**1..30 (obligation of service), `line_number` single per sale, business item, name/type/unit/SKU snapshots, thousandth quantity, unit price and total per line `HALF_UP`. `catalog_item_id` always exists; **no free concepts offered** en E2-6 MVP.
- **`SalePayment` → `sale_payments`**: 1..6 (obligation of service), order and typed method, positive amount and declarative reference. Means: `EFECTIVO`, `TRANSFERENCIA`, `CUENTA_DNI`, `TARJETA`, `MERCADO_PAGO_DECLARADO`. **None** indicates accreditation or banking movement.
- **`StockMovement` → `stock_movements`**: new alternative origin `sale_id` + `sale_line_id`event `VENTA_SALIDA`, `delta_milli < 0`, FK composed of three fields to `sale_lines(business_id,sale_id,id)` y `UNIQUE(business_id,sale_id,sale_line_id)` to avoid double counting the same line. The six historical events E2-4/E2-5 continue to retain their previous origin/sign and are not rewritten.

### Migration

`backend/alembic/versions/20261109_0017_sales_foundation.py`: **`e26a_sales_foundation`** descends from `e25a_inventory_ops`. Add three tables and two columns **optional** en `stock_movements`, replacing only the source/sign CHECK to support sales. It does not execute UPDATE of balances, movements or previous purchases. `downgrade` **blocks if sales exist**; should not be executed on QA or productive data.

### SQL vs. pending service rules

**La DB protege:** tenant in FK, sole header idepotent, author belonging to the company, signed physical line linked to the same sale, quantity and price in ranges, discrete units, `HALF_UP` per line, positive amounts per payment, total = subtotal − discount (total >0), single lines and payments. `StockBalance` existing maintains its non-negative CHECK.

**Cannot infer from CHECK per row:** that payments in all rows add up to exactly the total, that the sum of lines coincide with subtotal, that there are at least 1 and maximum 30 lines or between 1 and 6 payments, that a sale with BIEN warrants location and balances, that the `kind_snapshot` the current catalogue, nor that a `VENTA_SALIDA` be of physical good or match in quantity with the line. **All these rules correspond to transactional service B/C and must be tested with API + PostgreSQL.** The scheme does not certify complete sales by INSERT SQL isolated; do not create manual sales in production.

**Domain rules decided for B/C:** `location_id` is nullable for exclusive sale of services. For sales with goods is required `Location.ACTIVA`, `can_sell` y `can_store`, membership/STORE/SELL authorized, sufficient current balance. Services do not generate movement; **do not reserve or consume inputs automatically**. In a mixed sale the grouping of repeated items only affects stock; prices are rounded **by line**.

## 3. Currency accuracy and example

- `line_total_cents = floor((quantity_milli * unit_price_cents + 500) / 1000)` non-negative, with arithmetic `NUMERIC` in PostgreSQL and integers in service.
- `subtotal_cents = sum(line_total_cents)` per line **without grouping amounts**.
- `total_cents = subtotal_cents - discount_cents` **strictly positive**.
- `sum(payment.amount_cents) = total_cents` exacto, **sin floats**.
- A line of 0.333 kg to 1,050 cents/kg totals 350 cents; three separate lines: 1,050 cents, although the aggregate amount of 0.999 kg would give 1,049 cents.

## 4. Proposed testing and safe operation

- `test_sale_foundation_model.py`: ORM record, types, FK tenant, XOR origin, check quantities and cents, enumerations and SHA.
- `test_sale_foundation_integration.py`: DB PostgreSQL, service-only without headquarters, split payment, cross FK rejected, same duplicate key, invalid discount, discrete unit, exact HALF_UP and non positive/duplicated sales movement.
- Regression: `test_receipt_models.py` updates your expectations by **the new optional FK**; E2-4/E2-5 tests remain with the original semantics of their operations.

**First validate branch/PR IQ.** For local execution use PostgreSQL **known and isolated**, without deleting or reconfiguring the existing QA volume. `plataforma-pyme/backend` after the approved merge and additive migration on known development DB:

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check
$env:RUN_DB_INTEGRATION = "1"
try {
    .\.venv\Scripts\python.exe -m pytest -q
} finally {
    Remove-Item Env:\RUN_DB_INTEGRATION -ErrorAction SilentlyContinue
}
```

**Do not execute now** these commands without decision and without checking the DB: this document is published in **functional branch PR**, and integration tests have temporary/rollback data. Pytest or Alembic has not been executed on the developer's machine during this delivery. In particular, never do `docker compose down -v`, `alembic downgrade`, `stamp` ni `TRUNCATE` on development DB.

## 5. E2-6A acceptance criteria

1. PR limited to E2-6 A, new migration and compatible ledger/DTO changes without rewriting data or E2-4/E2-5 migrations.
2. `alembic upgrade head`, `current` (`e26a_sales_foundation`) y `check` green in **CI PostgreSQL 16**.
3. New Tests and Green Full Regression Suite in CI Python 3.12./3.14.
4. Manual review of SQL tenant, XOR origin, quantity, price, `HALF_UP` and residual risks.
5. Only after B/C has been approved will the endpoint be declared `POST sales` as functional. The existence of tables **is not a sales API**.

**Next direct job:** E2-6 B, Pydatic contracts and Service Sales API; E2-6 C Atomic closing of physical/mixed sales, with race tests.
