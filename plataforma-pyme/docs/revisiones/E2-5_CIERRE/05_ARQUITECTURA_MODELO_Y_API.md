# E2-5 — Effective architecture, model, API and invariants

**Scope:** code `plataforma-pyme/backend/` read in `main` `748e69319d8d04900c009d5184168a264a9deeac`. Only features supported by code, tests or manual responses are described. **no** is the complete architecture of the product.

## 1. Flow and separation of responsibilities

```text
Cliente autenticado
  └── /api/v1/businesses/{business_id}/...
        ├── routers FastAPI (contratos, Bearer opaco con sesión revocable, HTTP)
        ├── services (autorización, validaciones, idempotencia, unidad transaccional)
        ├── modelos SQLAlchemy (business/ubicaciones/artículo/saldo/operación/movimiento)
        └── PostgreSQL 16 (FK, UNIQUE, CHECK, row locks, commit/rollback)
```

Authentication uses tokens **Bearer opacos de 256 bits**, with SHA-256 print indexed in `auth_sessions`, validity and revocation proved against the base. **No hay JWT**. The initial session is checked again within stock operations under user/session/membership locks.

The E2-4 distinction is maintained: **• registered purchase • physical reception**. The high in catalog also does not generate stock. E2-5 B moves existing quantities; E2-5 C records corrections or first stock, all with an auditable movement.

### Endpoints vigentes (prefijo `/api/v1`)

| Method | Path | Origin/Result |
|---|---|---|
| `GET` | `/businesses/{business_id}/inventory/balances` | Balances per company; filters `location_id`, `catalog_item_id`, pagination |
| `GET` | `/businesses/{business_id}/inventory/movements` | Ledger of receptions, transfers and initial stock/adjustments; filters and pagination |
| `POST` | `/businesses/{business_id}/inventory/transfers` | Transfer of an item between two suitable locations; `201` new / `200` replay |
| `GET` | `/businesses/{business_id}/inventory/transfers/{transfer_id}` | Historical check and two movements |
| `POST` | `/businesses/{business_id}/inventory/adjustments` | `AJUSTE_ENTRADA`, `AJUSTE_SALIDA`, `STOCK_INICIAL`; `201` / `200` replay |
| `GET` | `/businesses/{business_id}/inventory/adjustments/{adjustment_id}` | Manual operation checker and a movement |
| `POST` | `/businesses/{business_id}/purchases/{purchase_id}/receive` | **Dependencia E2-4**: Full reception at STORE location; change stock once |

Also used `POST /catalog`, `POST /purchases` y `POST /locations` to prepare data. All actual business routes require authentication and company membership.

### Essential claims contracts

**Transfer:** `catalog_item_id`, `source_location_id`, `destination_location_id`, `quantity_milli`, `reason`. Not required `expected_version` for the transfer: the origin is deducted by means of a **conditional SQL update**and the destination is increased with a UPSERT.

**Ajuste/stock inicial:** `kind`, `catalog_item_id`, `location_id`, `quantity_milli`, `expected_version`, `reason`. The version is strict and comes from `GET /inventory/balances`; if no balance exists yet, `STOCK_INICIAL` use `0`. In both POST UUID power header4 is required **whose value is not deliberately published**.

- Positive amount: `1..999999999` Thousandths per operation.
- Well, physically. `item_type=BIEN`Article `ACTIVO`, valid unit. `UNIDAD`, `PAQUETE`, `CAJA` require `quantity_milli` multiple of 1000.
- `reason` 3 to 500 characters normalized; the command does not accept extra fields.
- Never negative balances; maximum projection of `stock_balances` es `999999999999999` Thousandthies.

## 2. Persistence and SQL integrity

| Entity/table | Current function |
|---|---|
| `InventoryOperation` / `inventory_operations` | Header `TRASLADO`, `AJUSTE_ENTRADA`, `AJUSTE_SALIDA`, `STOCK_INICIAL`; quantities, type, article, address, reason, actor, date and application by company |
| `StockMovement` / `stock_movements` | Historical record signed with explicit origin **reception** o **manual operation**, without rewriting background |
| `StockBalance` / `stock_balances` | Current projection with composite key company+location+article, non-negative quantity, `version` and temporary update |
| `PurchaseReceipt` / `purchase_receipts` | **E2-4**, receipt linked to purchase/lines; does not change your contract to E2-5 |
| `Location`, `LocationAssignment`, `CatalogItem`, `Membership` | Insulation by company, STORE capacity, permits and active type/unit |

The A model incorporates FK composed of tenant and type of operation, UNIQUE of application by company and event by operation, and CHECK that distinguish addresses and signs. **It does not constitute proof of immutability in the face of an SQL superuser**; is integrity relative to the restrictions and services exposed.

**Applied migration:** `backend/alembic/versions/20261109_0016_inventory_operations.py` con `revision='e25a_inventory_ops'` y `down_revision='e24e_receipt_stock'`New table `inventory_operations`; optional columns `inventory_operation_id`, `operation_kind` in ledger; FK/CHECK of extended origin; existing reception movements are preserved. E2-5 B/C **no other migration**.

## 3. Atomity and continuance

### E2-5 B transfer

1. Revalidation of session and membership within the scope of the operation.
2. Idepotent request search; identical replay returns original voucher (`200`) without repeating balances; incompatible load/actor/operation produce conflict.
3. Blockage of **both UUID fixed order locations**; status checked `ACTIVA`, `can_store=true`membership and STORE permits.
4. Shared catalogue block (`FOR SHARE`).
5. Conditional discount on origin (`quantity_milli >= solicitado`); missing/insufficient balance
6. Destination credit via UPSERT PostgreSQL; uploads destination version or creates version 1.
7. Insertion of a `InventoryOperation` y **dos** `StockMovement` (`TRASLADO_SALIDA` negative, `TRASLADO_ENTRADA` positive), followed by **un commit**Exception -rollback.

### Ajustes E2-5 C

1. Revalidation of session, company, membership, location and role; STORE permission check.
2. Location blocking; shared catalogue; balance `FOR UPDATE` If it exists, the pair of concurrent operations with the same location is protected.
3. **Initial stock:** only when **no balance or previous movement** for that combination article/location and `expected_version=0`. An existing balance of zero quantity **no** enable rebootization.
4. **Input/output adjustments:** prior balance and `expected_version` matching. The output checks sufficient quantity; the input checks balance limit. Both increase `version`.
5. A manual header and **a signed movement** (`STOCK_INICIAL`/`AJUSTE_ENTRADA` positive; `AJUSTE_SALIDA` negative) are confirmed by projection in a single transaction.

**Race control demonstrated by test, not Swagger:** two rival outputs with the same version offer 201/409; concurrent replay of the same command 201/200; two simultaneous initial loads 201/409. For opposite transfers there are tests without deadlock in the tested range.

## 4. Roles and permits

- **Transfer:** rol `TITULAR_ADMINISTRATIVO` o `ADMINISTRADOR` (without special allocation) or `ENCARGADO`/`TRABAJADOR` **with Active allocation in both locations**Always. `ACTIVA` y `can_store=true`.
- **Initial stock:** only `TITULAR_ADMINISTRATIVO` / `ADMINISTRADOR`, with suitable location and active membership/company.
- **Ajustes:** holder/manager, or `ENCARGADO` assigned to the location. `TRABAJADOR` **no** is allowed to create/remove stock using manual settings.
- A third party resource identifier does not grant access. The valid tenant API and conditions, and you can return `404` generic for external resources.

### HTTP and characteristic errors

`201` new writing; `200` lectura/replay exacto; `401` absent/invalid session; `403` permission; `404` appeal/tenant absent; `409` insufficient balance, initial double, obsolete version, conflict key, inappropriate business/location; `422` Invalid body/UID/quantity. HTTP layer translates service exceptions; **409 does not imply compensatory movement**.

## 5. Compatibility and design boundaries

- E2-5 A retains the entrances `COMPRA_RECEPCION` with its reference to receipt and line; B extends the common DTO to include new classes without forcing null fields into old responses; C uses that leadger.
- **The auditable source** are the movements; **current projection** are the balances and versions. A reading of a historical voucher does not guarantee present balance.
- Not yet in existence `Venta` backend that does not result in these stocks, nor automatic reversal of transfer/adjustment, stock per batch or absolute physical count with reconciliation of differences.
- El `reason` is basic traceability; it does not amount to double approval, documentary support or anti-fraud policy.

### Verifiable source paths

`backend/app/infrastructure/models/{inventory_operation,stock_movement,stock_balance}.py`  
`backend/app/modules/purchases/{inventory_router,transfer_router,transfer_schemas,transfer_service,adjustment_router,adjustment_schemas,adjustment_service}.py`  
`backend/app/modules/purchases/{receipt_router,receipt_schemas,receipt_service}.py`  
`backend/alembic/versions/20261109_0016_inventory_operations.py`.

## Technical addendum v1.1 — Concurrence and semantic balance

**Effective model (SQLAlchemy synchron) `Session`, no `AsyncSession`):** `TransferService.transfer()` toma locks `FOR UPDATE` on **two locations in UUID order**, validates location/permission and physical well, executes the conditional debit of origin and credit `UPSERT` in destination, adding the `version` of balances. `AdjustmentService.adjust()` Take `FOR UPDATE` location, `FOR SHARE` Article and `FOR UPDATE` balance, compares the `expected_version` before modifying. Purchase tickets also block the location.

If a transfer enters a deposit between reading the balance in IU and confirming an adjustment, the setting may **reject with 409 by intentionally obsolete version**. It does not show loss of stock: avoids applying a difference over a changed amount. The frontend should check the balance again and allow recalculation or confirmation of adjustment, **never change `expected_version` Quietly**. The existing automated competition tests cover races within transfers and within adjustments, as well as post-transfer adjustment; **no** are a specific interspersed adjustment/transfer test in parallel to the same destination: proposed as additional coverage.

**Two different concepts:** `STOCK_INICIAL` is a unique historical fact for each pair (company, location, article) **no previous movements**; a balance with `quantity_milli=0` does not rehabilitate it. For new income after exhaustion a purchase/reception, incoming transfer or positive adjustment is used; for absolute count a future CU is proposed that derives the delta on the version observed. Authorize `STOCK_INICIAL` Again, when I hit zero, I would fake the semantics of the ledger.

No changes in endpoints or migrations were made as a result of this addition. Policy changes and structural controls should be discussed in a later submission. [external evaluation](13_EVALUACION_OBSERVACIONES_IA.md).
