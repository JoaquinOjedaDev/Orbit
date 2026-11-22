# E2-6 — Integrated sales: technical delivery and implementation closure

**Project:** PyME/TP Platform Programming 2 — UNSAM 2C2026  
**Directory:** `plataforma-pyme/`  
**Workforce:** `feature/e2-6-ventas-integradas`  
**Status:** A, B, C and D implemented and validated; E documentary. **No fusionar a `main` before the selective audit and the single PR.**  
**Code evaluated in Windows:** `a66c180d02bfb5decc583a90a07efcc48d0a2783` (2026-11-09).

## 1. Scope implemented

- Registration of sales exclusively of services, physical goods and mixed sales, linked to the authenticated business.
- Persistence of `Sale`, `SaleLine` y `SalePayment` with whole amounts in cents and amounts in thousandths.
- Unchangeable snapshots of the name, SKU, class, unit, prices and totals of each line of sale.
- Payments **declared**: `EFECTIVO`, `TRANSFERENCIA`, `CUENTA_DNI`, `TARJETA`, `MERCADO_PAGO_DECLARADO`. The amounts declared must be exactly the same as the total. **It does not amount to a confirmed recovery**.
- Physical discount by location and item with `UPDATE stock_balances ... WHERE quantity_milli >= required RETURNING`, incremental version and rejection if stocks are missing.
- Aggregation per item for discounting the balance; a `StockMovement` of a kind `VENTA_SALIDA` by physical line with origin `sale_id` + `sale_line_id`.
- Insertion of vouchers, lines, payments, movements and change of balance **a transaction**Rollback before any failure before commit.
- Clave `Idempotency-Key` UUID v4 per tenant: creation 201, identical replay of same actor 200, content collision/actor 409.
- Check the historical voucher by ID and tenant, without altering the stock or payments.
- Revalidation of session and membership; active company and location for new operations, location capacity and role assignment.

## 2. Published API

**POST** `/api/v1/businesses/{business_id}/sales`

Requires Bearer and header authentication `Idempotency-Key` (UUID v4). The body accepts:

```json
{
  "location_id": "UUID-de-ubicacion",
  "discount_cents": 0,
  "notes": "Venta de mostrador",
  "lines": [
    {"catalog_item_id": "UUID-del-articulo", "quantity_milli": 1000, "unit_price_cents": 2500}
  ],
  "payments": [
    {"method": "EFECTIVO", "amount_cents": 2500, "reference": ""}
  ]
}
```

The example is **illustrative**: replace valid UUID before using it. For sale of services without location, skip `location_id` or use `null` (administrative mode). For physical goods, an authorized location with `can_sell = true` y `can_store = true`.

**GET** `/api/v1/businesses/{business_id}/sales/{sale_id}` returns the authorized historical sale.

**Relevant responses:** 201 creation; 200 replay; 401 absent/revocated session; 403 unauthorized operation; 404 unavailable company/sale; 409 unenforced idempotency, enterprise/location or stock; 422 validation of content or article. API does not offer cancellation, return or reversal of stock in this block.

## 3. Rules and limits of contract

- 1 to 30 lines; 1 to 6 declared payments; positive totals and within limit `99_999_999_999` cents.
- Redondeo HALF_UP **by line**: `floor((quantity_milli * unit_price_cents + 500) / 1000)`.
- `SERVICIO` requires discrete units and quantities; goods may use valid physical units according to Catalogue. Discreet units `UNIDAD`, `PAQUETE` y `CAJA` require multiples of 1000.
- Validated Tenant in catalog, location, voucher and SQL references with composite FKs.
- Owner/Manager can operate in enabled locations; maintainer/worker requires active assignment. To exit goods, you must satisfy `SELL` y `STORE`.
- Without location, the administrative command only supports services.
- The standard payload hash SHA-256 allows for the detection of incompatible re-attempts.
- `balances_after` is historical, not the source of current stock.
- The flow does not allocate funds to accounts, does not open cash, verifies webhooks or credits payments from Pay Market.

## 4. Compatibility with earlier stages

E2-6 A reuses migration `e26a_sales_foundation`, without creating a new one for B/C/D. Inventory readings also show `VENTA_SALIDA`. The origins of `COMPRA_RECEPCION`, `TRASLADO_*`, `AJUSTE_*` y `STOCK_INICIAL`.

Sales movements retain FK to the commercial line and not a manual purchase or inventory, preserving the exclusion of origins defined in the scheme.

## 5. Evidence of validation

**Local environment provided by user (Windows, 2026-11-09):**
- B: `14 passed` and migrations and `alembic check` no differences; previous regression `864 passed, 1 warning`.
- C: `17 passed` targeted; `10 passed` attendance/IPA; `22 passed` cross-integration; regression `872 passed, 1 warning`.
- Security C: `16 passed`.
- D: `9 passed` atomisation/permissions/concurrence.
- Post-D regression: **`879 passed in 132.08s`**No reported warning.
- `alembic current`: `e26a_sales_foundation (head)`; `alembic check`: `No new upgrade operations detected.`
- The base used was `asistente_pyme_e26b_test_20261109_134652`, independent of usual QA.

**CI GitHub Actions:** `a66c180` — success (2026-11-09), workflow: historical CI run 42684413403 The IC must be re-verified upon completion of the audit and any corrections.

## 6. Risks, non-targets and future work

- This block does not deliver frontend sales, cash, monetary accounts, tax vouchers, reserves, returns, reconciliation or settlement of means of payment.
- `MERCADO_PAGO_DECLARADO` should not be interpreted as confirmed collection; integration of preferences, QR, webhooks and MP account per tenant requires flow and own contracts.
- The relationship `can_sell` + `can_store` for goods is a conservative decision of the stage; validate in design whether a single SELL point of sale should operate on external deposit by explicit, never implicit flow.
- The burden test and the evaluation of interlocks under different order requests remain limits to the current set.
- Pydatic's intermittent warning of aliases was observed in previous regressions, but **no** Last one.
- Before the Merge: Independent permission/tenancy review, accounting validation by line, race conditions, SQL error treatment, and compatibility with historical modules.

## 7. Exit criteria E2-6

1. Approved code and integrated tests — **completed in `a66c180`**.
2. Technical document E2-6 E — **present**.
3. Independent audit documented with findings, severity, individual decision and impact — **outstanding**.
4. Apply **only** accepted findings, with commit and regression tests — **outstanding**.
5. Confirm new green IC and final PR/diff review against `main` — **outstanding**.
6. Open **un PR** of all E2-6; merge only once after approval — **outstanding**.

**Rule:** not use this document as evidence of completed external audit or that the PR is ready.

## 8. Swagger manual validation (2026-11-09)

**Source:** real HTTP responses provided by the operator from local Swagger (`127.0.0.1:8000`) on the time basis used for E2-6. This evidence does not replace evidence of attendance with PostgreSQL.

**Exclusive test company:** `fc37e4ff-9e26-423b-946e-a9cc0b662360`.  
**Location SELL/STORE:** `013860da-e39b-4028-a080-1ae0638ae482`.  
**Physical article:** `dfbef980-9d7b-4810-9d04-ab0e4f51c86f`.  
**Service:** `740f0ed2-4371-4de3-bd0d-d218f9b53c34`.

| Operation | Observed HTTP | Observed result |
|---|---:|---|
| Register user and company | 201 / 201 | Active administrative holder |
| Create product, service and location | 201 / 201 / 201 | Active location with `can_sell` y `can_store` |
| Register `STOCK_INICIAL` | 201 | +10000 thousandths, balance 10000/version 1 |
| Check Product Inventory | 200 | 10000/version 1 |
| Create physical sale of 2 units | 201 | Sale `def970fc-6b45-48cb-ba65-a5ca994c3fdd`; 1000000 cents; balance 8000/version 2 |
| Create mixed sale (1 good + 1 service) | 201 | Sale `61108b12-df7e-4da6-8046-ddde75eedba4`; 650,000 cents; two payments; balance 7000/version 3 |
| Repeat mixed sale with same key and body | 200 | Same `sale_id`, date, lines, payments and snapshots of 7000/version 3 |
| Try selling 10 units with stock of 7 | 409 | `Stock insuficiente para confirmar la venta` |
| Check balance after rejection | 200 | 7000/version 3, unchanged |
| Consult leader with product filter/location | 200 | **Exactly 3 moves:** `STOCK_INICIAL +10000`, `VENTA_SALIDA -2000` y `VENTA_SALIDA -1000` |

**Conciliation:** `10000 - 2000 - 1000 = 7000` The two sales movements are linked to their respective `sale_id` y `sale_line_id`. No physical movements for service, replay or sale refused appear.

**Scope accuracy:** The results attest to the main manual circuit on the test company. They do not constitute independent audit or comprehensive manual proof of permits, frauds, infrastructure or external payments. `main`.
