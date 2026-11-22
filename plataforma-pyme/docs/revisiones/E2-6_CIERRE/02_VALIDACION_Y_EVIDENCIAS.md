# E2-6 — Validation log and verifiable evidence

**Origin of evidence:** GitHub Actions consulted at `main` + actual Windows/Swagger operator outputs.  
**No new tests were carried out to draft this sheet.** The historical results are associated with their respective committees, date and environment.

## 1. Verifiable Git integration

| Delivery | PR | Merge SHA `main` |
|---|---|---|
| A — Model and migration | #26 | `9516633d8fe5ce69c7f8f6ed0af4c87c40e6e460` |
| B-E — Integrated sales | #27 | `6336152e8dd095ca91363566beddd2b622432a5e` |

**GitHub Actions del SHA #27:** run 42696474777. Three jobs completed with `success`: Python 3.12 with PostgreSQL, Python 3.14 with PostgreSQL and Docker build with liveness. Don’t claim that this execution validated future changes to another SHA.

## 2. Windows evidence of pre-merge code

**Tested code:** `a66c180d02bfb5decc583a90a07efcc48d0a2783`.  
**Independent time base:** `asistente_pyme_e26b_test_20261109_134652`.

- Targeted tests B: 14 passed; intermediate regression `864 passed, 1 warning`.
- Focused C: 17 passed; safety 16 passed; interoperability 22 passed; continuance/API 10 passed; intermediate regression `872 passed, 1 warning`.
- Focused D: 9 passed; final regression: **`879 passed in 132.08s`**No reported warning.
- `alembic current`: **`e26a_sales_foundation (head)`**.
- `alembic check`: **`No new upgrade operations detected.`**.
- IC branch for code `a66c180`: run 42684413403, success.

## 3. Local Swagger Validation (2026-11-09)

**Exclusive test company:** `fc37e4ff-9e26-423b-946e-a9cc0b662360`.  
**Location:** `013860da-e39b-4028-a080-1ae0638ae482`, `can_sell=true`, `can_store=true`.  
**Okay:** `dfbef980-9d7b-4810-9d04-ab0e4f51c86f`.  
**Service:** `740f0ed2-4371-4de3-bd0d-d218f9b53c34`.

| Request | HTTP | Actual outcome observed |
|---|---|---|
| User registration, company creation, good/service/location | 201 each | Active and fit resources |
| `POST /inventory/adjustments` STOCK_INICIAL | 201 | Movement +10000, balance 10000/v1 |
| `GET /inventory/balances` of good | 200 | 10000/v1 |
| `POST /sales` physical sale 2 units | 201 | Sale `def970fc-6b45-48cb-ba65-a5ca994c3fdd`, total 1000000 cents; balance 8000/v2 |
| `POST /sales` mixed sale (1 good + 1 service) | 201 | Sale `61108b12-df7e-4da6-8046-ddde75eedba4`; total 650000; payments 300000 cash and 350000 transfer; balance 7000/v3 |
| Same `Idempotency-Key`/payload/actor | 200 | Same voucher, lines, payments, date and historical snapshot |
| Sale of 10 units with 7 available | 409 | `Stock insuficiente para confirmar la venta`; balance 7000/v3 |
| `GET /inventory/movements` Article/location | 200 | **Three exact events:** `STOCK_INICIAL +10000`, `VENTA_SALIDA -2000`, `VENTA_SALIDA -1000` |

**Observable reconciliation:** `+10000 - 2000 - 1000 = 7000` Thousandths. `VENTA_SALIDA` preserve `sale_id` y `sale_line_id`. Replay, service and rejection due to insufficient balance did not add physical movements.

## 4. What this evidence does not prove

- The Swagger test did not cover a multi-user/tenant attack in manual execution or simulated concurrent clients; these conditions are examined in automated suites, and they are still independently audited.
- Evidence of continuance between **sales** and interop **sequential** with E2-4/E2-5 operations do not mean exhaustive proof of all cross-module races under load.
- The means of payment are declared: no actual settlement, cash box, wallet, QR, OAuth MP or webhooks were tested.
- Local tests are provided by the operator and they were not reruns when writing this closure.
- The five reports of an independent audit completed were not received at this closure.

## 5. Proven criteria

**Checked within range:** physical and mixed sales operations, arithmetic of declared payments, persistence of vouchers and snapshots, replay, rejection by insufficient stock, consultation of consistent balances and ledger, and CI of `main` successful.

**Not yet certified:** total absence of defects, production safety, React–FastAPI integration or selective adoption of external findings.
