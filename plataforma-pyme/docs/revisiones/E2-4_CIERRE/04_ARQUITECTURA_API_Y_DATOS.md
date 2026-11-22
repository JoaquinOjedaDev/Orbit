# E2-4 — Architecture, HTTP contracts, persistence and risks

**AS-IMPLEMENTED:** Backend FastAPI, SQLAlchemy ORM 2, PostgreSQL 16, Alembic; multi-company by `business_id`, membership, session and permissions. React DEMO does not yet consume these endpoints. Technical source: code of `backend/app/modules/{suppliers,purchases}/` and migrations 0012–0015.

## 1. Implemented flow

```text
Usuario autenticado → Membresía de Empresa
             ├── Proveedor (opcional)
             └── Compra + PurchaseLine (snapshots; NO stock)
                     ├── Solo servicios/conceptos → CERRADA_SIN_RECEPCION
                     └── Con BIEN → REGISTRADA
                               ↓ POST /receive (una vez, completa)
                           Compra RECIBIDA
                               ├── PurchaseReceipt único por compra
                               ├── StockMovement por línea física
                               └── StockBalance por empresa/ubicación/artículo
```

Services and free concepts of a mixed purchase **no** They generate stock entries. Reception occurs after commercial registration, not on the same endpoint.

## 2. Existing routes

Prefix `/api/v1/businesses/{business_id}`.

| Group | Method and sub-route | Action | Success |
|---|---|---|---|
| Suppliers | `GET /suppliers` | Listed, including inactive | 200 |
| Suppliers | `POST /suppliers` | High | 201 |
| Suppliers | `GET /suppliers/{supplier_id}` | Details | 200 |
| Suppliers | `PATCH /suppliers/{supplier_id}` | Partial editing, no status | 200 |
| Suppliers | `PATCH /suppliers/{supplier_id}/status` | Enable/disable | 200 |
| Purchases | `POST /purchases` | Document and lines, **sin stock** | 201 / replay 200 |
| Purchases | `GET /purchases` | Listado y snapshots | 200 |
| Purchases | `GET /purchases/{purchase_id}` | Detail and status | 200 |
| Receipt | `POST /purchases/{purchase_id}/receive` | Full physical income to a location | 201 / replay 200 |
| Receipt | `GET /purchases/{purchase_id}/receipt` | Historical check and movements | 200 |
| Inventory | `GET /inventory/balances` | Current balance filtered/paginated | 200 |
| Inventory | `GET /inventory/movements` | Historical inputs filtered/paged | 200 |

Readings require active company membership and session; writing Provider/Buy requires the corresponding roles and Active Company. Reception applies `can_operate_at_location(...operation="STORE")`, destination `ACTIVA` y `can_store=true`; operational staff need active assignment. Errors 401/403/404/409/422 depend on context and should not be confused with infrastructure failures.

## 3. Purchase: entry, totals and statements

```json
{
  "purchased_on": "2026-11-08",
  "supplier_id": null,
  "reference": "QA-COMPRA-001",
  "notes": "Compra ficticia",
  "lines": [
    {
      "catalog_item_id": null,
      "description": "Servicio de limpieza externo",
      "unit": "CONCEPTO",
      "quantity_milli": 1000,
      "unit_cost_cents": 12505
    }
  ]
}
```

- Amounts in thousandths and money in cents as whole; `quantity_milli: 10000` represents 10 units.
- Each line: `line_total_cents = floor((quantity_milli * unit_cost_cents + 500)/1000)`The sum of the lines is `total_cents`; se evita Float. **Limit 1–30 lines** by creation.
- Active references of the same tenant. Names, SKU, type and unit of the item and supplier name are extracted from the backend to fix historical snapshots (without confidence in a customer description).
- `POST /purchases` requires `Idempotency-Key` UUID4: same actor, key and content → 200 and same document. Reused key with changes → 409.
- `REGISTRADA` if there is a physical good; `CERRADA_SIN_RECEPCION` If there isn't. `RECIBIDA` after physical confirmation. `CANCELADA` is intended as a schematic state, **no HTTP path to cancel yet**.

## 4. Reception, transaction, powerlessness and blocking

```json
{"location_id": "2d6761c4-efec-4b3e-925c-a24ceab8ce9c"}
```

Entry is strictly limited to `location_id`: No partial quantities, no selected lines or multiple deposit. Operation in a PostgreSQL transaction:

1. Revalidate account, session, company and membership; acknowledge exact retry.
2. Block purchase and location, check `REGISTRADA`, `ACTIVA`, `can_store=true` and permission STORE.
3. Blocks ordered catalog rows: **the code does use `.with_for_update(read=True)` en `receipt_service.py`**, which in PostgreSQL implements reading `FOR SHARE`. Therefore, the external observation that this protection would be missing **does not describe the current implementation**. It is appropriate to verify generated SQL when changing driver/dialect.
4. Insert `purchase_receipts` (UNIQUE per company/purchase and enterprise/key), a `stock_movements` by line BIEN and groups the quantities per item.
5. Implement `INSERT ... ON CONFLICT DO UPDATE` to increase atomically `stock_balances`. Preserva snapshots `balances_after`, fixed purchase `RECIBIDA` and confirms **un solo COMMIT**. Error → ROLLBACK.
6. The identical retry of the same actor/key/destiny returns 200 and the original receipt, although the actual balance may have changed later. New key on purchase already received → 409.

## 5. SQL model and migrations

| Migration | Change |
|---|---|
| `e24a_suppliers` | `suppliers`, standard/single name in company, form and status |
| `e24c_purchases` | `purchases` y `purchase_lines`; FKs por tenant, snapshots, UNIQUE y CHECK |
| `e24d_purchase_hash` | `purchases.request_sha256` optional (compatible migration) |
| `e24e_receipt_stock` | `purchase_receipts`, `stock_movements`, `stock_balances` |

The reception is modeled 1:1 by purchase using UNIQUE `(business_id,purchase_id)`; no 1:N ratio was declared implemented. Balances have PK `(business_id,location_id,catalog_item_id)`, non-negative quantity and version. A movement retains reference to receipt, line, article, location and actor; it does not have PATCH/DELETE REST.

## 6. Review observations: technical classification

| Comment received | Verification/decision |
|---|---|
| Partial and multi-destiny receptions not available | **Conscious functional limitation of the cut**, not fail a complete reception. Requires design 1:N, line assignment and additive migration. Do not rewrite historical migration 0015. |
| `CANCELADA` sin endpoint | **Functional gap pending**. Incorporate cancellation command validating allowed transition, authorship and idempotency; do not update status by ad hoc SQL. |
| No reversion of receipt | **Pending operational gap**Design auditory settings/compensations, not ledger DELETE or destructive manual rollback. |
| No `currency_code` no exchange rate | **Model limitation** For multicurrency. Do not infer ARS as a currency persisted by the system; weights were only used when interpreting local QA scenarios. Plan ISO 4217 and explicit historical conversion. |
| HALF_UP accumulation by line | **Deliberate and proven rule**, but may differ from the external voucher. Design discounts/adjustments/conciliatory taxes without modifying past snapshots. |
| Maximum 30 lines | **Current contractual limit**; analyze batch highs and bulk load pagination without removing size protections. |
| Immutability of the ledger only by REST | **Riesgo real de hardening DB:** There are no UPDATE/DELETE triggers on movements; keys/FKs do not amount to immutability before an operator with direct SQL scripts. Minimum privilege SQL roles, audit and, if applicable, restrictive trigger are required. |
| Lack of catalog blocking | **Non-applicable comment** to the current code: `with_for_update(read=True)` if you perform blocker shared reading. Confirm with race test and SQL compiled if you want to reinforce evidence. |
| Tests with local populated DB | **Confirmed environmental isolation debt**; PR #18 corrected global assertions, did not create an independent ephemeral DB. |

## 7. Deferred scope and compatibility decisions

Receiving 1:N, cancellations/compensations, transfers, negative adjustments, sales and cash, declared payments/Merchany Payment, currency reconciliation, multicurrency, large charges, hardening/observability and connected frontend **are not implemented in this block**.

Do not alter already applied migration columns/UNIQUE to add these capabilities. Require ADR, new migrations, permissions and compatibility tests. Do not declare ready for production to the subsystem just by passing IC.
