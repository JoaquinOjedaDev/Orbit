# E2-4 E — Complete reception and physical transactional stock

**Contract:** RF-05/CU-07 and part one of RF-06/CU-08. Base: E2-4 D, migration \`e24d_purchase_hash\`. Insulated branch \`feature/e2-4e-recepcion-stock\`. The DEMO frontend is not integrated.

## What implements

- \`POST /api/v1/businesses/{business_id}/purchases/{purchase_id}/receive\` con Bearer e \`Idempotency-Key\` UUID4. Compulsory and exclusive body: \`{"location_id":"<UUID>"}\`. Partial quantities, prices, alternative items or several destinations are not permitted.
- Reception for purchase only \`REGISTRADA\` with at least one physical line; \`CERRADA_SIN_RECEPCION\`, \`RECIBIDA\` o \`CANCELADA\` are rejected with 409 (except identical replay).
- Location of the same tenant, \`ACTIVA\` y \`can_store=true\`. \`can_sell\` does not replace \`can_store\`.
- \ Enterprise policy is being reused`can_operate_at_location(..., operation="STORE")\`: Active membership holder/admin operate in suitable locations; maintainer/worker with only active assignment to that location. SUSPENDED company blocks new receptions; revoked sessions do not access.
- Mixed purchases: only lines with snapshot \`BIEN\` Each one generates a movement; no services or free concepts are entered. The article must follow ASSISTANT, physical and with the same unit stored in the snapshot, to avoid mixing incompatible units.
- A single PostgreSQL transaction blocks user/session, company/membership, purchase and location, query catalog ordered, creates Reception, creates ledger entries, applies UPSERT atomic to balances grouped by item and passes Purchase to \`RECIBIDA\`. Error => rollback completo.
- Each new initial entry is inserted into \`stock_balances\`; others add up`quantity_milli\` and increase \`version\`, low \`INSERT ... ON CONFLICT DO UPDATE\`. No negative balances and amounts greater than the scheme limit.
- \`purchase_receipts\`: a receipt per purchase, unique retry key by company, SHA-256 body hash + purchase_id, author and historical destination. The exact retryings of the **same actor** return HTTP 200 and the first receipt; different key or body returns 409 and never re-enters merchandise. *response photo* \`balances_after\` so that a replay remains identical even if there are later receptions.
- \`stock_movements\`: ledger of signed historical facts, one per physical line (without merging descriptions or historic units); FK composed of company, location, article, receipt, historical line and actor, with UNIQUE receipt+line.
- \`stock_balances\`: balance projection by (business_id,location_id,catalog_item_id), with non-negative version and CHECK. No fictitious stock when creating Purchase/Catalog/Company.
- \`GET /api/v1/businesses/{business_id}/purchases/{purchase_id}/receipt\`: historical proof and movements of this reception.
- \`GET /api/v1/businesses/{business_id}/inventory/balances\`: Current balances paged with optional filters \`location_id\`, \`catalog_item_id\`.
- \`GET /api/v1/businesses/{business_id}/inventory/movements\`: ledger paging physical entries. Own GET requires active membership and supports company suspended for read only. Editing or erasing of movements and balances from API is prohibited.

**Catalogue Integrity:** once there is a historical line of purchase (or balance), your item cannot change from \`kind\` ni \`unit\` by PATCH (409); name, SKU and descriptive data remain editable without altering snapshots. Receiving still validates the current tab to fail safely against changes made by SQL outside the API.

## Migration and compatibility

Additive migration`e24e_receipt_stock\` on`e24d_purchase_hash\`: creates exclusively \`purchase_receipts\`, \`stock_balances\`, \`stock_movements\`, indexes/UNIQUE/CHECK/FK composite. Do not modify or delete purchases, catalogs, locations or suppliers already registered. Physical purchase of QA \`3e50aff2-c895-49d9-8fe5-d5843438f109\` ♪ Stay ♪`REGISTRADA\` until the user decides to receive it from Swagger.

**Alcance del ledger E2-4 E:** unique origin \`COMPRA_RECEPCION\` with FK mandatory to Reception. It will expand in Sales/OperationsInventory increments with FK of additional origins and CHECK XOR without creating fictitious sales tables now. The reader should avoid presenting the final variant of three origins as already implemented.

## Recommended manual test (only after merge, migration and green IC/local)

1. Confirm that QA purchase follows \`REGISTRADA\`.
2. List locations; select a \`ACTIVA\`, \`can_store=true\`. If it does not exist, create a real QA deposit with \`POST /locations\`, type \`DEPOSITO\`, \`can_store=true\`, \`can_sell=false\`.
3. Generate new \`Idempotency-Key\` UUID4, ejecutar \`POST /purchases/3e50aff2-c895-49d9-8fe5-d5843438f109/receive\` con \`{"location_id": "<UUID-ALMACEN>"}\`. Expected HTTP 201, status \`RECIBIDA\`, one move \`+10000\` thousandths and item balance.
4. Repeat **exactly the same key and body** • 200, same receipt and movement, same response snapshot.
5. Read \`GET /purchases/{id}\` ♪ status received, ♪`GET /receipt\` Same receipt,`GET /inventory/balances\` filter by location/article • quantity 10000 (if initial balance 0), \`GET /inventory/movements\` • signed fact. Buying free concept \`b6646fcd-428f-4b9b-ab80-83e7ffb14827\` must refuse reception (409).
6. Do not share full Bearer tokens or Swagger Curl.

### Outside E2-4 E

It does not include partial/multi-destiny reception, returns, stock sale/discount, transfers, adjustments, payments, financial accounts, Market Payment or React–API integration. Reading current balance and ticket leader is only the start of RF-06. PostgreSQL automated testing included; closing of the consolidated TP report at the end of ALL E2-4, not in this sub-increment.
