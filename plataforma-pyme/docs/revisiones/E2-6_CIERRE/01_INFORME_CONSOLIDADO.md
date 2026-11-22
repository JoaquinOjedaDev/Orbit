# E2-6 — Consolidated technical report after merge

**Block:** E2-6 (RF-07 / CU-10) · **status:** merged into `main` by PR #26 and #27.  
**Cut:** merge `6336152e8dd095ca91363566beddd2b622432a5e` · **date:** 2026-11-09.

## 1. Completed scope A-E

| Cut | Actual outcome | Verification |
|---|---|---|
| **A** | SQL tables `sales`, `sale_lines`, `sale_payments`; columns `sale_id`/`sale_line_id` in leader; FK tenant, CHECK and Alembic migration `e26a_sales_foundation` | PR #26, structural tests/SQL |
| **B** | POST/GET sales of services, declared split payments, whole calculation, snapshots and idempotency by key and actor | Schema/API/service tests |
| **C** | Physical and mixed sales in location SELL+STORE, atomic stock debit, movement `VENTA_SALIDA` by physical line | Integration, Continuity and Swagger Testing |
| **D** | Rollback hardening, permissions, retrying, snapshot conservation and E2-4/E2-5 compatibility | Local regression 879 and CI |
| **E** | Technical delivery, comprehensive documentation, Swagger evidence and AI audit material | Published and merged with PR #27 |

## 2. Public contracts

- `POST /api/v1/businesses/{business_id}/sales`: Header `Idempotency-Key` (UUID v4), payload con `location_id?`, `discount_cents`, `notes`1 to 30 lines and 1 to 6 payments. **201**, identical replay **200**.
- `GET /api/v1/businesses/{business_id}/sales/{sale_id}`: authorised historical proof, **200** si existe y es accesible.
- Mistakes typified: **401** meeting; **403** permission; **404** not accessible company/combant; **409** status, key or stock; **422** payload or invalid article.
- Accounts or means `EFECTIVO`, `TRANSFERENCIA`, `CUENTA_DNI`, `TARJETA`, `MERCADO_PAGO_DECLARADO` son **declarations**: no real accreditation, webhook, cashier or verified financial movement is generated.

## 3. Rules and atomism

- Global business identity and authorization by business; locational sale required `SELL`. Physical property also requires `STORE` and active site suitable for storage.
- Physical items and services may coexist on a voucher; services do not discount stock.
- Strict integers and thousandths of amount; rounding HALF_UP per line; discounts and sum payments should match exactly the positive total.
- Historical copies of description, type, unit, SKU, quantity and price per line, more `balances_after` after physical debit.
- The service groups repeated physical quantities per item for a `UPDATE ... WHERE quantity_milli >= requerido RETURNING`, increases the balance version and records a `StockMovement(VENTA_SALIDA)` negative per line of good.
- Header + lines + declared payments + leadger + balances are confirmed within **one transaction**; proven error cases reverse the entire operation.
- Idempotence by `(business_id, request_id)` with standard digest and author; a valid replay does not change the stock.

## 4. Units of the previous system

| Module | Reusing integration E2-6 |
|---|---|
| **E2-1** | Registration, login, session, company and membership |
| **E2-2** | Active location, sales/storage capabilities, assignments and permits |
| **E2-3** | Catalog, physical type/service, units, status and snapshots |
| **E2-4** | Purchase/reception and historical origin `COMPRA_RECEPCION`, without changing his semantics |
| **E2-5** | `StockBalance` versioning, transfers/adjustments, physical ledger and XOR origin |
| **E2-6** | Sales and additional origin `VENTA_SALIDA`, references `sale_id` + `sale_line_id` |

E2-6 does not replace migrations or previous operations. Previous movements maintain their origin identifier; the extension of the source CHECK distinguishes sales from receipts and manual operations.

## 5. Implementation Files

```text
backend/app/modules/sales/router.py
backend/app/modules/sales/schemas.py
backend/app/modules/sales/service.py
backend/app/api/v1/router.py
backend/app/infrastructure/models/{sale,sale_line,sale_payment,stock_movement}.py
backend/alembic/versions/20261109_0017_sales_foundation.py
backend/tests/test_sale_foundation_{model,integration}.py
backend/tests/test_sales_{schemas,http,api_integration,atomicity_integration,
                          concurrency_integration,inventory_interop_integration,
                          permissions_integration}.py
```

Migration `e26a_sales_foundation` es aditiva y **bans downgrade if sales exist**. Do not modify QA data or run destructive downgrades. The sales API does not offer global listing, editing, cancellations or returns on this block.

## 6. Scope of closure

**The implementation of the MVP backend E2-6 is accepted as completed under the tests described**. No comprehensive independent audit, universal tolerance to deadlocks, external payments or coverage of all security scenarios is accredited. The published AI review material is an outstanding order. A subsequent external review may cause defects and PRs correction, without quietly reopening the already merged specification.
