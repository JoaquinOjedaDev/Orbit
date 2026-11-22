# Manual use test log — E2-4

**Date:** 08/11/2026 · **Tool:** Swagger UI (FastAPI/OpenAPI) · **Host:** `http://127.0.0.1:18000` · **API base:** `/api/v1` · **QA Company:** `bd4d4e42-4ff6-403a-8633-59cbc001487d`.

> **Evidence criterion:** any HTTP code indicated as *observed* was transcribed from the responses communicated by the developer. Actual values of `Idempotency-Key`, his reflection on `request_id`, passwords, Bearer and sensitive material. Business bodies, costs and UUID resources are preserved to reproduce and review. **Do not re-run the `POST` with the actual data of this log and new keys** if duplicates or inventory changes are not desired.

> **Scope:** this log contains the sequence of use observed for purchases and reception, but **no** states that the supplier CRUD has been executed entirely manually. The Provider API is verified using PostgreSQL/HTTP and CI tests; see `03_PRUEBAS_AUTOMATIZADAS_Y_CI.md` y `05_TRAZABILIDAD_Y_PENDIENTES.md`.

## A. Preparation for the meeting

1. FastAPI rose with Docker and agreed to `http://127.0.0.1:18000/docs`.
2. En `POST /api/v1/auth/login` a pre-existing QA account was used and permission obtained. **not included**.
3. In the option **Authorize** the token was installed in Swagger. The client should not include the prefix `Bearer` twice.
4. When Swagger was closed or reopened, the test fields and authorization were no longer visible. A new login was made; no company, supplier, purchase or item had to be recreated because PostgreSQL persisted.
5. Subsequent protected tests returned `201`/`200`/`409` according to business rules; this proves that it was operated with an authorized session, but **no HTTP transcription is preserved** as independent evidence.

## B. Fixed meeting data

| Recourse | Identifier / data |
|---|---|
| Company | `Comercio de Prueba QA` — `bd4d4e42-4ff6-403a-8633-59cbc001487d` |
| Actor in the records | `0e0fc877-c3d4-45dd-9813-2501596baee0` |
| Supplier | `Distribuidora QA` — `4a9e7618-6388-4765-a8e7-0d7338becd6d` |
| Item | `Alimento balanceado QA` — `881fdae2-18c5-46ae-8037-44a500ca96c0` |
| Deposit | `Depósito QA` — `2d6761c4-efec-4b3e-925c-a24ceab8ce9c` |
| Free purchase | `QA-COMPRA-001` — `b6646fcd-428f-4b9b-ab80-83e7ffb14827` |
| Physical purchase | `QA-COMPRA-002` — `3e50aff2-c895-49d9-8fe5-d5843438f109` |
| Receipt | `266bd03e-763b-4f29-8f12-c19c9bc59066` |
| Movement | `9d72f578-c54f-4250-accb-995d712958d8` |

The tab with all non-secret attributes is in `06_FICHA_DATOS_QA.md`.

## C. Case U-01 — Free concept purchase fee

**Endpoint:** `POST /api/v1/businesses/{business_id}/purchases`  
**Objective:** verify that an administrative purchase without a supplier/catalogue/location does not create physical inventory.  
**Precondition:** Valid Bearer and authorised member of active company.  
**Additional header:** `Idempotency-Key: [VALOR REAL OMITIDO]` (UID4 generated for the operation).

**Input:**

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

**Observed result:** `201 Created`.

```json
{
  "id": "b6646fcd-428f-4b9b-ab80-83e7ffb14827",
  "business_id": "bd4d4e42-4ff6-403a-8633-59cbc001487d",
  "supplier_id": null,
  "supplier_name_snapshot": "",
  "purchased_on": "2026-11-08",
  "status": "CERRADA_SIN_RECEPCION",
  "total_cents": 12505,
  "reference": "QA-COMPRA-001",
  "notes": "Primera compra de prueba sin proveedor ni recepcion",
  "created_by_id": "0e0fc877-c3d4-45dd-9813-2501596baee0",
  "created_at": "2026-11-08T21:36:06.917074Z",
  "lines": [
    {
      "id": "914048a7-3c08-4fc1-bc32-16f833906cf7",
      "line_number": 1,
      "catalog_item_id": null,
      "description_snapshot": "Servicio de limpieza externo",
      "kind_snapshot": "CONCEPTO",
      "unit_snapshot": "CONCEPTO",
      "sku_snapshot": "",
      "quantity_milli": 1000,
      "unit_cost_cents": 12505,
      "line_total_cents": 12505
    }
  ]
}
```

*Answer submitted without the idempotent field `request_id`; the rest are observed values.*

**Interpretation:** 1,000 thousandths = 1 concept; cost 12.505 cents = **$125,05**; without physical goods, the state `CERRADA_SIN_RECEPCION` corresponds to the contract.

## D. Case U-02 — Identical re-purchase

**Endpoint:** same `POST /purchases`.  
**Entry:** same body as U-01 and exactly **the same key of idempotency** used in U-01 (not published).  
**Observed result:** `200 OK`, `id` of purchase `b6646fcd-428f-4b9b-ab80-83e7ffb14827`, `created_at` `2026-11-08T21:36:06.917074Z` and line `914048a7-3c08-4fc1-bc32-16f833906cf7`No change.

**Opinion:** Retry response, not a new purchase. Same date, buy and line show that the original document was recovered.

## E. Case U-03 — Collision for changing cost with the same key

**Entry:** same `POST` and the same key as U-01, but the only field changed was `lines[0].unit_cost_cents`: de `12505` a `20000`.

**Observed result:** `409 Conflict`.

```json
{
  "detail": "Clave de compra reutilizada con contenido diferente"
}
```

**Opinion:** the server rejects a different operation with the previous key; the original purchase is not modified.

## F. Case U-04 — List purchases

**Endpoint:** `GET /api/v1/businesses/{business_id}/purchases?offset=0&limit=100`.  
**Observed result:** `200 OK`, arrangement of **a single element** at that time, the purchase `QA-COMPRA-001` con `total_cents=12505`, `status=CERRADA_SIN_RECEPCION` and the line `CONCEPTO`. U-02/U-03 attempts did not add elements.

## G. Case U-05 — Consult individual purchase

**Endpoint:** `GET /api/v1/businesses/{business_id}/purchases/b6646fcd-428f-4b9b-ab80-83e7ffb14827`.  
**Observed result:** `200 OK`, same document, line, `created_at`, reference, total and status that U-01.  
**Opinion:** full historical reading.

## H. Case U-06 — Discharge of physical article of QA

**Endpoint:** `POST /api/v1/businesses/{business_id}/catalog`.

**Input:**

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

**Observed result:** `201 Created`.

```json
{
  "id": "881fdae2-18c5-46ae-8037-44a500ca96c0",
  "business_id": "bd4d4e42-4ff6-403a-8633-59cbc001487d",
  "name": "Alimento balanceado QA",
  "kind": "REVENTA",
  "item_type": "BIEN",
  "category": "Alimentos",
  "sku": "ALIM-QA-001",
  "unit": "UNIDAD",
  "description": "Producto ficticio para probar compras",
  "observations": "",
  "sellable": true,
  "price_cents": 150000,
  "reference_cost_cents": 100000,
  "status": "ACTIVO",
  "created_at": "2026-11-08T21:50:33.523379Z",
  "updated_at": "2026-11-08T21:50:33.523379Z"
}
```

Reference costs were used for **$1.000,00** and the reference selling price of **$1.500,00**; this does not amount to registering a sale.

## I. Case U-07 — Physical purchase from QA supplier

**Endpoint:** `POST /api/v1/businesses/{business_id}/purchases`.  
**Header:** `Idempotency-Key: [VALOR REAL OMITIDO]`new with regard to administrative purchase.

**Input:**

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

**Observed result:** `201 Created`.

```json
{
  "id": "3e50aff2-c895-49d9-8fe5-d5843438f109",
  "business_id": "bd4d4e42-4ff6-403a-8633-59cbc001487d",
  "supplier_id": "4a9e7618-6388-4765-a8e7-0d7338becd6d",
  "supplier_name_snapshot": "Distribuidora QA",
  "purchased_on": "2026-11-08",
  "status": "REGISTRADA",
  "total_cents": 1000000,
  "reference": "QA-COMPRA-002",
  "notes": "Compra de 10 unidades pendiente de recepcion",
  "created_by_id": "0e0fc877-c3d4-45dd-9813-2501596baee0",
  "created_at": "2026-11-08T21:53:23.410940Z",
  "lines": [
    {
      "id": "fc2226e3-0205-4354-860e-73bb5376eec7",
      "line_number": 1,
      "catalog_item_id": "881fdae2-18c5-46ae-8037-44a500ca96c0",
      "description_snapshot": "Alimento balanceado QA",
      "kind_snapshot": "BIEN",
      "unit_snapshot": "UNIDAD",
      "sku_snapshot": "ALIM-QA-001",
      "quantity_milli": 10000,
      "unit_cost_cents": 100000,
      "line_total_cents": 1000000
    }
  ]
}
```

* Skipped `request_id` of the original body.*

**Interpretation:** `10000 / 1000 = 10` units; cost per unit `100000 / 100 = $1.000,00`; total `1000000 / 100 = $10.000,00`. The purchase remains `REGISTRADA` y **still don't create stock**. The absence of stock at this stage is also supported in the backend contract and tests; POST alone does not return balances.

## J. Case U-08 — Consult locations without deposits

**Endpoint:** `GET /api/v1/businesses/{business_id}/locations`.  
**Observed result:** `200 OK` with body `[]`.  
**Opinion:** QA company did not have registered locations before creating the deposit.

## K. Case U-09 — Create actual QA deposit

**Endpoint:** `POST /api/v1/businesses/{business_id}/locations`.

**Input:**

```json
{
  "name": "Depósito QA",
  "kind": "DEPOSITO",
  "address": "",
  "map_url": "",
  "can_sell": false,
  "can_store": true
}
```

**Observed result:** `201 Created`.

```json
{
  "id": "2d6761c4-efec-4b3e-925c-a24ceab8ce9c",
  "business_id": "bd4d4e42-4ff6-403a-8633-59cbc001487d",
  "name": "Depósito QA",
  "kind": "DEPOSITO",
  "address": "",
  "map_url": "",
  "can_sell": false,
  "can_store": true,
  "is_primary": true,
  "status": "ACTIVA",
  "created_at": "2026-11-08T22:45:49.542089Z",
  "updated_at": "2026-11-08T22:45:49.542089Z"
}
```

## L. Cases U-10 and U-11 — Confirmation of location and purchase before receipt

- `GET /locations` → **200**, arrangement of **a location** con `id=2d6761c4-efec-4b3e-925c-a24ceab8ce9c`, `status=ACTIVA`, `can_store=true`, `can_sell=false`, `is_primary=true`.
- `GET /purchases/3e50aff2-c895-49d9-8fe5-d5843438f109` → **200**, buy QA-002 with supplier `Distribuidora QA`, `status=REGISTRADA`, `quantity_milli=10000` y `total_cents=1000000`.

These readings verify the preconditions of the receiving command: pending document and place enabled.

## M. Case U-12 — Confirm full physical reception

**Endpoint:** `POST /api/v1/businesses/{business_id}/purchases/3e50aff2-c895-49d9-8fe5-d5843438f109/receive`.  
**Header:** `Idempotency-Key: [VALOR REAL OMITIDO]` (UID4 new for **this reception**, different from the one used when creating the purchase).

**Input:**

```json
{
  "location_id": "2d6761c4-efec-4b3e-925c-a24ceab8ce9c"
}
```

**Observed result:** `201 Created`. The actual response is represented below without `request_id`.

```json
{
  "id": "266bd03e-763b-4f29-8f12-c19c9bc59066",
  "business_id": "bd4d4e42-4ff6-403a-8633-59cbc001487d",
  "purchase_id": "3e50aff2-c895-49d9-8fe5-d5843438f109",
  "location_id": "2d6761c4-efec-4b3e-925c-a24ceab8ce9c",
  "confirmed_by_id": "0e0fc877-c3d4-45dd-9813-2501596baee0",
  "confirmed_at": "2026-11-08T22:51:29.200944Z",
  "purchase_status": "RECIBIDA",
  "movements": [
    {
      "id": "9d72f578-c54f-4250-accb-995d712958d8",
      "business_id": "bd4d4e42-4ff6-403a-8633-59cbc001487d",
      "location_id": "2d6761c4-efec-4b3e-925c-a24ceab8ce9c",
      "catalog_item_id": "881fdae2-18c5-46ae-8037-44a500ca96c0",
      "receipt_id": "266bd03e-763b-4f29-8f12-c19c9bc59066",
      "purchase_line_id": "fc2226e3-0205-4354-860e-73bb5376eec7",
      "actor_id": "0e0fc877-c3d4-45dd-9813-2501596baee0",
      "event_type": "COMPRA_RECEPCION",
      "delta_milli": 10000,
      "occurred_at": "2026-11-08T22:51:29.200944Z"
    }
  ],
  "balances_after": [
    {
      "catalog_item_id": "881fdae2-18c5-46ae-8037-44a500ca96c0",
      "quantity_milli": 10000,
      "version": 1
    }
  ]
}
```

**Opinion:** a reception for a purchase, a physical line move and a balance of **10 units** in a location enabled. Response includes effective date `confirmed_at` And the actor.

## N. Case U-13 — Refuse second reception with another key

**Entry:** POST itself `/receive`, same purchase and same `location_id`but with a **different key** A UUID resource was accidentally used as a key; that value is not reproduced to fulfill the key exclusion policy.

**Observed result:** `409 Conflict`.

```json
{
  "detail": "Compra ya recibida, cancelada o sin bienes fisicos recepcionables"
}
```

**Opinion:** behaviour **Right.** double income protection; the purchase is now `RECIBIDA`. It should not be counted as backend failure.

## O. Case U-14 — Identical receipt

**Entry:** POST itself `/receive`same buy, same actor and **exactly the same key and body** That's U-12.  
**Observed result:** `200 OK`; values were recovered:

- `receipt.id`: `266bd03e-763b-4f29-8f12-c19c9bc59066`.
- `confirmed_at`: `2026-11-08T22:51:29.200944Z`.
- `purchase_status`: `RECIBIDA`.
- `movements[0].id`: `9d72f578-c54f-4250-accb-995d712958d8`.
- `movements[0].delta_milli`: `10000`.
- `balances_after[0].quantity_milli`: `10000`.
- `balances_after[0].version`: `1`.

**Opinion:** the answer represents the **same fact**Not a second operation. `1` and U-17's record shows no duplication.

## P. Case U-15 — Balance query with wrong example location

**Endpoint:** `GET /api/v1/businesses/{business_id}/inventory/balances`.  
**Parameters:** correct article `881fdae2-18c5-46ae-8037-44a500ca96c0`; was mistakenly left as `location_id` the fictitious UUID Swagger proposes in its examples instead of the deposit created; `offset=0`, `limit=100`.

**Observed result:** `200 OK` y `[]`.

**Diagnosis:** the query filtered a location that did not match the reception. **valid**, no evidence of missing balance.

## Q. Case U-16 — Balance query with actual filters

**Endpoint:** `GET /api/v1/businesses/{business_id}/inventory/balances`.  
**Parameters:**

```text
business_id      = bd4d4e42-4ff6-403a-8633-59cbc001487d
location_id      = 2d6761c4-efec-4b3e-925c-a24ceab8ce9c
catalog_item_id  = 881fdae2-18c5-46ae-8037-44a500ca96c0
offset           = 0
limit            = 100
```

**Observed result:** `200 OK`.

```json
[
  {
    "business_id": "bd4d4e42-4ff6-403a-8633-59cbc001487d",
    "location_id": "2d6761c4-efec-4b3e-925c-a24ceab8ce9c",
    "catalog_item_id": "881fdae2-18c5-46ae-8037-44a500ca96c0",
    "quantity_milli": 10000,
    "version": 1,
    "updated_at": "2026-11-08T22:51:29.200944Z"
  }
]
```

**Opinion:** the 10 units consist of `stock_balances`. The version remains `1` after the retry, and filters match the actual deposit.

## R. Case U-17 — Consultation of the movement leader

**Endpoint:** `GET /api/v1/businesses/{business_id}/inventory/movements` with exactly the same filters as U-16.

**Observed result:** `200 OK`; **one movement**:

```json
[
  {
    "id": "9d72f578-c54f-4250-accb-995d712958d8",
    "business_id": "bd4d4e42-4ff6-403a-8633-59cbc001487d",
    "location_id": "2d6761c4-efec-4b3e-925c-a24ceab8ce9c",
    "catalog_item_id": "881fdae2-18c5-46ae-8037-44a500ca96c0",
    "receipt_id": "266bd03e-763b-4f29-8f12-c19c9bc59066",
    "purchase_line_id": "fc2226e3-0205-4354-860e-73bb5376eec7",
    "actor_id": "0e0fc877-c3d4-45dd-9813-2501596baee0",
    "event_type": "COMPRA_RECEPCION",
    "delta_milli": 10000,
    "occurred_at": "2026-11-08T22:51:29.200944Z"
  }
]
```

**Opinion:** the consultation confirms the **only physical fact** QA-002 purchase and its traceability (actor, receipt and line). In conjunction with the U-14 test, it confirms no duplication in this scenario.

## S. Tabular summary of manual cases

| ID | Operation | Observed HTTP | Opinion |
|---|---|---:|---|
| U-01 | High purchase concept | 201 | Approved |
| U-02 | Replay misma compra | 200 | Approved |
| U-03 | Reused key at other cost | 409 | Approved: expected conflict |
| U-04 | List Shopping | 200 | Approved |
| U-05 | Detalle compra | 200 | Approved |
| U-06 | Create physical article | 201 | Approved |
| U-07 | Create physical purchase | 201 | Approved |
| U-08 | Locations before discharge | 200, `[]` | Approved |
| U-09 | High deposit | 201 | Approved |
| U-10 | Locations after discharge | 200 | Approved |
| U-11 | Physical purchase before receiving | 200 | Approved |
| U-12 | Single reception | 201 | Approved |
| U-13 | Attempted second reception | 409 | Approved: expected conflict |
| U-14 | Replay original reception | 200 | Approved |
| U-15 | Uncorresponding UUID filtered balance | 200, `[]` | Incorrect filter diagnosis |
| U-16 | Balance with correct deposit | 200 | Approved |
| U-17 | Movements with correct filters | 200 | Approved |

The Provider API (`POST/GET/PATCH/PATCH status`) is implemented and validated by IC. Evidence allows identifying a QA supplier used for purchase, but **does not contain a complete manual path with bodies and HTTP of each Provider operation**; that set of cases was not invented.

## T. Data reprocessing and retention rule

High U-01, U-06, U-07, U-09 and reception U-12 **They happened.** on a persistent basis. If you want to review this evidence, use the routes **GET**. To repeat exactly U-14 in an authorized context, the original key, which is excluded from the report, must be reused: **without it you can not perform the same replay test in identical way**. Do not substitute that key for the purchase ID and do not generate another one for the same reception; that produces correctly `409`.

For a new full practice, use other QA data and new saved keys **locally and outside the report**, without sharing authorization headers.