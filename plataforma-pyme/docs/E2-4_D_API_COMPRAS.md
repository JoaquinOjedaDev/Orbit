# E2-4 D — Real Purchase API (no reception)

**Base:** E2-4 C migration \`e24c_purchases\`. **Rama:** \`feature/e2-4d-compras-api\`. **Date:** 08/11/2026.

## Functions

- **POST** \`/api/v1/businesses/{business_id}/purchases\`: records 1–30 lines and returns 201. Requires \`Idempotency-Key\` UUID v4, Bearer and membership ENTRY_ACMINISTRATIVE OR ENTRY ASSISTANT. Key ID+payload from the same creator returns 200 and the same purchase; same key with other content/actor returns 409.
- **GET** \`/api/v1/businesses/{business_id}/purchases\`: full tenant history, with snapshots and pagination \`offset=0, limit=100\` default.
- **GET** \`/api/v1/businesses/{business_id}/purchases/{purchase_id}\`: purchase consultation of the same company with ordered lines. Reading for active members, also under suspension.
- Optional supplier and free concepts without catalog or location. If a Provider is referenced, it must be ASSISTANT of the same tenant. Referenced Catalog must be ASSISTING and have the same unit as the requested line.
- Name/SKU/type/item unit and provider name are copied exclusively from PostgreSQL as **historical snapshot**, never from a data that the customer can fake. The description sent of articles is validated but the historical name comes from the catalog.
- Arithmetic in **whole cents** y **Thousandths of the whole**rounding`HALF_UP\` for each line (without Float), sum of exact lines. \`REGISTRADA\` when there is at least one physical good; \`CERRADA_SIN_RECEPCION\` for only services and/or free concepts.
- Purchase and 1–30 lines inserted **in a single transaction**; any error involves rollback. Multi-company isolation by tenant filters and composite foreign keys.
- Add Add Additive Migration \`e24d_purchase_hash\`, nullable field`purchases.request_sha256\` with CHECK 64 length to record SHA-256 hash of the application. Nulable preserves compatibility with old purchases if they exist, but all new high HTTP reports footprint. The uniqueness of \`(business_id, request_id)\` It was already created in E2-4 C.

## High Fields

\`\`\`json
{
  "purchased_on": "2026-11-08",
  "supplier_id": null,
  "reference": "FC-001",
  "notes": "Buy fictional for QA",
  "lines": [
    {
      "catalog_item_id": null,
      "description": "Servicio externo",
      "unit": "CONCEPTO",
      "quantity_milli": 1000,
      "unit_cost_cents": 12505
    }
  ]
}
\`\`\`

For an article in the catalogue:`catalog_item_id\` UUID real, \`unit\` equal to the current tab and \`description\` information; for free concept: \`catalog_item_id: null\`, \`unit: "CONCEPTO"\`. All lines require quantity > 0 and cost >=0. Discreet units require thousandths of multiples of 1000.

## Explicit limits and subsequent cuts

- **No Location Created or Required**, there are no payments, receipt, sellable existence, movement, or physical effect on Inventory.
- The purchase is saved for later reception E2-4 E (once, complete, in a location with permission STORE). Free concept and service do not give right to reception.
- No back-to-order editing/delete. SQL and API integrity controls protect high; no INSERT commercial permission is entered for end users.
- The React/HTTP integration, DEMO frontend and financial accounts are outside this cut.
- Protection of type/unit changes in Catalogue when there is a business history must be incorporated into the relevant integrity block; already saved snapshots do not change.
- HTTP and PostgreSQL tests for creation, queries, roles, tenant, idempotency, amounts, rounding, status, active references, rollback and stock absence. **Comprehensive documentation of PT evidence: at the closure of complete E2-4**according to the author ' s instruction.

## Recommended validation

1. CI Python 3.12 / 3.14 with PostgreSQL 16, \`alembic upgrade head\` y \`alembic check\`, Docker.
2. Merge from the PR only after green CI and review.
3. On Windows \`git pull --ff-only origin main\`, \`python -m alembic upgrade head\`, \`alembic current\`, \`alembic check\`, \`RUN_DB_INTEGRATION=1 pytest -q\` y \`docker compose --profile api up -d --build --wait api\`.
4. Swagger: Free concept purchase record, repeat with the same key, reject key with different load, list and query, then a purchase with physical item from catalog without reception.
