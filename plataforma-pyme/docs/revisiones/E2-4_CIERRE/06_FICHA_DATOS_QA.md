# E2-4 — QA session data used (no credentials or keys)

**Origin:** Swagger responses provided for closure. **Date:** 2026-11-08. **Important:** the following UUID are test resource identifiers, not authentication keys. `Idempotency-Key`, `request_id`passwords, tokens Bearer and connection chains.

## Company and actor

| Field | Valor |
|---|---|
| Company | QA Test Trade |
| `business_id` | `bd4d4e42-4ff6-403a-8633-59cbc001487d` |
| `created_by_id` / actor | `0e0fc877-c3d4-45dd-9813-2501596baee0` |
| Environment | API local 127.0.0.1:18000, PostgreSQL 16, Docker |

## Supplier

| Field | Valor |
|---|---|
| Name | QA Distributor |
| `supplier_id` | `4a9e7618-6388-4765-a8e7-0d7338becd6d` |

The existence of the supplier was indirectly verified in the physical purchase it returned `supplier_name_snapshot: "Distribuidora QA"`. No complete transcription of your manual CRUD is preserved.

## U-01 — Free concept purchase

**POST** `/api/v1/businesses/{business_id}/purchases`; HTTP **201**.

```json
{
  "purchased_on": "2026-11-08",
  "supplier_id": null,
  "reference": "QA-COMPRA-001",
  "notes": "Primera compra de prueba sin proveedor ni recepcion",
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

| Response field | Valor |
|---|---|
| `purchase_id` | `b6646fcd-428f-4b9b-ab80-83e7ffb14827` |
| `purchase_line_id` | `914048a7-3c08-4fc1-bc32-16f833906cf7` |
| Status | `CERRADA_SIN_RECEPCION` |
| Total | `total_cents: 12505` |
| `created_at` | `2026-11-08T21:36:06.917074Z` |
| Identical retry | HTTP **200**, same document and line |
| Key Same and Different Cost | HTTP **409**, detail: re-used purchase key with different content |
| Get listed and detail | HTTP **200**, document retained |

## U-06 — Physical article

**POST** `/api/v1/businesses/{business_id}/catalog`; HTTP **201**.

```json
{
  "name": "Alimento balanceado QA",
  "kind": "REVENTA",
  "category": "Alimentos",
  "sku": "ALIM-QA-001",
  "unit": "UNIDAD",
  "description": "Producto ficticio para probar compras",
  "sellable": true,
  "price_cents": 150000,
  "reference_cost_cents": 100000
}
```

Answer: `id: 881fdae2-18c5-46ae-8037-44a500ca96c0`, `item_type: BIEN`, `status: ACTIVO`creation `2026-11-08T21:50:33.523379Z`. Test selling price: 1,500,00; reference cost: 1,000,00. **The currency is not explicitly stored in the E2-4 model**.

## U-07 — Physical purchase from supplier

**POST** `/purchases`; HTTP **201**.

```json
{
  "purchased_on": "2026-11-08",
  "supplier_id": "4a9e7618-6388-4765-a8e7-0d7338becd6d",
  "reference": "QA-COMPRA-002",
  "notes": "Compra de 10 unidades pendiente de recepcion",
  "lines": [
    {
      "catalog_item_id": "881fdae2-18c5-46ae-8037-44a500ca96c0",
      "description": "Alimento balanceado QA",
      "unit": "UNIDAD",
      "quantity_milli": 10000,
      "unit_cost_cents": 100000
    }
  ]
}
```

| Field | Valor |
|---|---|
| Purchase | `3e50aff2-c895-49d9-8fe5-d5843438f109` |
| Line | `fc2226e3-0205-4354-860e-73bb5376eec7` |
| Proveedor snapshot | `Distribuidora QA` |
| SKU snapshot | `ALIM-QA-001` |
| Initial State | `REGISTRADA` |
| Total | `1000000` cents, equivalent to ten × 100000 cents |
| `created_at` | `2026-11-08T21:53:23.410940Z` |
| Immediate effect of creating purchase | **No** generates movement and stock; physical effect occurs in U-12 |

## U-08/U-09/U-10 — Deposit

Initially `GET /locations` → **200**, `[]`After `POST /locations` → **201** con:

```json
{"name":"Depósito QA","kind":"DEPOSITO","address":"","map_url":"","can_sell":false,"can_store":true}
```

Answer: `location_id: 2d6761c4-efec-4b3e-925c-a24ceab8ce9c`, `is_primary: true`, `status: ACTIVA`, `created_at: 2026-11-08T22:45:49.542089Z`. El `GET /locations` repeated returned a single location with that UUID; the `GET /purchases/{id}` prior to receipt confirmed `REGISTRADA`.

## U-12/U-13/U-14 — Reception

**POST** `/purchases/3e50aff2-c895-49d9-8fe5-d5843438f109/receive`, body:

```json
{"location_id": "2d6761c4-efec-4b3e-925c-a24ceab8ce9c"}
```

**First result:** HTTP **201**, `id: 266bd03e-763b-4f29-8f12-c19c9bc59066`, `purchase_status: RECIBIDA`, `confirmed_at: 2026-11-08T22:51:29.200944Z`. Movement `id: 9d72f578-c54f-4250-accb-995d712958d8`, `event_type: COMPRA_RECEPCION`, `delta_milli: 10000`, `actor_id: 0e0fc877-c3d4-45dd-9813-2501596baee0`. Balance after: `quantity_milli: 10000`, `version: 1`.

**Second attempt with different key:** HTTP **409**, `{"detail":"Compra ya recibida, cancelada o sin bienes fisicos recepcionables"}`. **Identical retry with original key:** HTTP **200**, same receipt, movement and balance photo; no other reception was created.

## U-15/U-16/U-17 — Current consultations and leader

1. `GET /inventory/balances` with a `location_id` example of Swagger, not belonging to the deposit: **200 []**, incorrect filter, no inventory error.
2. Same GET with `location_id=2d6761c4-efec-4b3e-925c-a24ceab8ce9c`, `catalog_item_id=881fdae2-18c5-46ae-8037-44a500ca96c0`, `offset=0`, `limit=100`: **200**, a row `quantity_milli=10000, version=1`, `updated_at=2026-11-08T22:51:29.200944Z`.
3. `GET /inventory/movements` with the same filters: **200**, a movement `COMPRA_RECEPCION`, `+10000`, `receipt_id=266bd03e-763b-4f29-8f12-c19c9bc59066`.

**Do not use resource UUIDs as idepotent keys.** To test the creation of new documents, new UUID4 keys must be generated in a separate QA environment, saved only on the reviewer machine.
