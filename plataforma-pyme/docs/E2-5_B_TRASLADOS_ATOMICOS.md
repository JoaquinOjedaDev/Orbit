# E2-5 B — Atomic physical transfers between locations

**Date:** 2026-11-09 · **Status:** validated backend in IC; pending to merit and local execution Windows.
**Base:** E2-5 A, commit de main `4268846abc524ebd827b4da930ef58d8d9789ac7`, migration `e25a_inventory_ops`.
**Scope:** RF-06, CU-09. Just backend, tenant data, STORE permissions and traceability; no UI React or CU-11 settings are built.

## Command Flow

**POST `/api/v1/businesses/{business_id}/inventory/transfers`** (Bearer + `Idempotency-Key` UUID4). Request:

```json
{
  "catalog_item_id": "<UUID ARTICULO FISICO>",
  "source_location_id": "<UUID DEPOSITO ORIGEN>",
  "destination_location_id": "<UUID DEPOSITO DESTINO>",
  "quantity_milli": 4000,
  "reason": "Reposicion de exhibicion"
}
```

UUIDs must belong **the same company**; both separate deposits, `ACTIVA` y `can_store=true`. The user must be able to operate STORE in both: owner/manager with active membership, or manager/worker actively assigned to **each**. A location `can_sell=true` but `can_store=false` does not serve to transport stock. ASSISTANT physical catalogue; quantity in milliths, whole and positive. UNIT/PACKET/CARD: multiple of 1000. The application must include a standardized motif of 3–500 characters.

### Technical steps

1. Revalidate user, revocable session, company and membership within the transaction, as in Purchases/Receptions.
2. Find the same tenant's idempotency key; if actor+load matches, return the **same transfer** and both moves with HTTP 200, without recalculating balances. If not matched, 409.
3. Validate company ACTIVA; block the two deposits in **UUID fixed order** to avoid deadlocks for opposite transfers; check membership, status and permission STORE.
4. Block Catalogue with `FOR SHARE`, confirm physical type, unit and quantity.
5. Uncounting the original balance by conditional UPDATE `quantity_milli >= solicitado`; a non-existent balance counts as zero → 409. Do not create negative balance or partially discount.
6. Adding to destination via PostgreSQL `INSERT … ON CONFLICT DO UPDATE`, with atomic quantity+version; SQL controls of the amount limit.
7. Persist **una** `InventoryOperation(kind=TRASLADO)` y **dos** traceable movements: `TRASLADO_SALIDA` = `-quantity_milli` at source and `TRASLADO_ENTRADA` = `+quantity_milli` in destination.
8. Confirm a single commit: balances, header and both movements.

**Total company balance:** the sum of both balances does not change for the transfer. There is no purchase, sale, payment or movement of cash.

**Answer:** 201 when creating; 200 for identical replay; 401 invalid session; 403 without STORE permission; 404 company/location/item/transfer missing or other; 409 suspended company, disabled destination, insufficient stock or different key; 422 UUID/quantity/unvalid body. A new key is a **new operation** and revalidation of availability.

El **GET `/api/v1/businesses/{business_id}/inventory/transfers/{transfer_id}`** returns historical header and movements of a transfer; does not reconstruct current balances, which are consulted in `GET /inventory/balances`. The status of deposits after the transfer can change without altering the voucher.

### Historical compatibility

It's preserved. `POST /purchases/{purchase_id}/receive` y `GET /purchases/{purchase_id}/receipt` with the E2-4 scheme intact. `/inventory/movements` Now accept so much `COMPRA_RECEPCION` optional fields of the missing source are omitted from the response to preserve the form of reception movements already validated in E2-4. Existing movements are not rewritten.

**No new migration in E2-5 B:** used `e25a_inventory_ops`; does not modify tables, FOREIGN KEY or historical CHECK of E2-4.

### Tests and limits

`tests/test_transfer_api_integration.py` covers transfer 10→6/4, persistent response, replay without duplicate, different load key, insufficient origin rejection without partial changes, physical and discrete units, non-transferable services, external or disabled location, manager/worker permissions and intertenant reading. Three proofs of actual continuance with independent HTTP/PostgreSQL connections verify: (i) two competing transfers of 7 units from a stock of 10: only one is confirmed (201 and 409), (ii) same UUID4 in two parallel orders: 201 and 200, one operation, (iii) opposite transfers from A/25070B locations: both 201, no deadlock or loss of stock. `tests/test_transfer_concurrency_integration.py` use a temporary tenant of your own and clean up restricted to that tenant; the pre-existing QA base is preserved.

**Not implemented in this court:** positive/negative adjustment (E2-5 C), initial stock, multiple item transfers, partial receptions, compensatory reversal, sales/production consumptions, periodic SQL reconciliation, front React connected. Although movement is historical and inaccessible by PATCH/DELETE in API, hardening to direct SQL modifications is still due.

### Manual reproduction without altering the existing QA tank until ready

After merge, rebuild the Docker API to expose the new route and validate `/ready`. Para probar Swagger, crear **a second QA deposit** con `can_store=true`. With the existing product `881fdae2-18c5-46ae-8037-44a500ca96c0`, the deposit of origin `2d6761c4-efec-4b3e-925c-a24ceab8ce9c` part of **10 units** according to last manual GET E2-4. **verify current balance**: not to assume that it is still 10 if there were other operations.

Prove a transfer of `quantity_milli=4000` only if there are 10 units. Expected: origin 6000, destination 4000 and two moves with zero sum. Repeat **the same key and body**: 200, no new entries. Another key/transfer higher than available: 409, unchanged. Share only reply and HTTP code **sin Bearer ni claves**. Do not use accounts/computes outside the QA environment.

### Local automated validation

From `plataforma-pyme/` (after merge in `main`):

```powershell
git switch main
git pull --ff-only origin main
cd backend
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check
$env:RUN_DB_INTEGRATION = "1"
try {
    .\.venv\Scripts\python.exe -m pytest -q
} finally {
    Remove-Item Env:\RUN_DB_INTEGRATION -ErrorAction SilentlyContinue
}
cd ..
docker compose --profile api up -d --build --wait api
```

Expected `e25a_inventory_ops (head)`, Alembic without drift and approved tests. **CI verified in GitHub Actions #42602232103**: 3/3 successful works; **826 tests** en Python 3.12 y **826** en Python 3.14 (PostgreSQL 16); `e25a_inventory_ops (head)`, `alembic check` sin deriva; imagen Docker y liveness aprobados. **Windows not yet executed for E2-5 B**Do not delete any Docker volume.
