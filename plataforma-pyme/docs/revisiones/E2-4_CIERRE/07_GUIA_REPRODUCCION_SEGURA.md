# E2-4 — Guide to reproduce and verify without compromising data

**Hearing:** author, reviewer, teacher. **Do not use the environment described against production**The local base already has persistent QA purchases; the main purpose is to audit with GET and, if mutation tests are desired, to plant new resources in an isolated test tenant.

## 1. Clonar o sincronizar y comprobar el commit

From `plataforma-pyme/` en PowerShell:

```powershell
git switch main
git pull --ff-only origin main
git rev-parse HEAD
cd backend
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check
cd ..
```

The code/QA auditable cut occurred on `4f88416141c09a82e744990b1aee8c00b9f31dfd` y `e24e_receipt_stock (head)`Subsequent documentary committs change the SHA without re-executing business cases. Register current SHA in any playback.

## 2. Verify tests without deleting data

```powershell
cd backend
$env:RUN_DB_INTEGRATION = "1"
try {
    .\.venv\Scripts\python.exe -m pytest -q tests/test_purchase_integration.py
    .\.venv\Scripts\python.exe -m pytest -q
} finally {
    Remove-Item Env:\RUN_DB_INTEGRATION -ErrorAction SilentlyContinue
}
cd ..
```

**Historical results Windows:** 20 passed en 6,54 s, luego 797 passed en 95,24 s. En GitHub Actions (run 42530739959): Python 3.12 y 3.14, 797 passed cada una (1 warning), y Docker exitoso.

**Additional caution:** PostgreSQL tests can now use local DB development. Run them only on an explicit basis of development. PR #18 correction filtered queries per tenant, but did not create a physically independent test base. Do not run over production, do not use `down -v`, `TRUNCATE`, `DROP` ni `downgrade`.

## 3. Docker y API

```powershell
docker compose --profile api up -d --build --wait api
docker compose ps
Invoke-RestMethod http://127.0.0.1:18000/ready
```

Expected: Healthy API and PostgreSQL; `{"status":"ready","database":"ok"}`.

## 4. Swagger and historical reading data

Open `http://127.0.0.1:18000/docs`. Authenticate by `POST /api/v1/auth/login` y `Authorize` using credentials **non-shared premises**. Do not copy to reports the `curl` If the session was exposed, revoke it with logout and get another one.

Historical data:

```text
business_id      = bd4d4e42-4ff6-403a-8633-59cbc001487d
purchase_id      = 3e50aff2-c895-49d9-8fe5-d5843438f109
location_id      = 2d6761c4-efec-4b3e-925c-a24ceab8ce9c
catalog_item_id  = 881fdae2-18c5-46ae-8037-44a500ca96c0
offset           = 0
limit            = 100
```

Review without changing data:
- `GET /api/v1/businesses/{business_id}/purchases/{purchase_id}` → `RECIBIDA`.
- `GET .../purchases/{purchase_id}/receipt` → receipt `266bd03e-763b-4f29-8f12-c19c9bc59066`.
- `GET .../inventory/balances`, Filters location/article → `quantity_milli: 10000, version: 1`.
- `GET .../inventory/movements` → a movement `COMPRA_RECEPCION`, `delta_milli: 10000`.

A filter with `location_id` another one returns 200 and empty list. `POST /receive` con **other key** on purchase already received returns 409; it is not regression. Do not re-create historical purchase/reception waiting 201.

## 5. Idempotency test for a new reviewer

No se publican valores de `Idempotency-Key`. A reviewer who does not keep the original key **cannot repeat the replay on the historical operation of QA**. Proper reproduction consists of creating a new document in your own QA tenant:

1. Create or select QA company and authorized user; check location `ACTIVA/can_store=true` and physical article `ACTIVO`.
2. Generate a UUID v4 purchase key and save it privately (for example `[guid]::NewGuid().ToString()` en PowerShell).
3. `POST /purchases` with item, date, quantity and cost → 201. Save `purchase_id`. Repeat same key and body → 200; change the body with the same key → 409.
4. Before receiving, read inventory by location+item and record starting balance; purchase alone should not upload it.
5. Generate **other** clave UUID4 distinta de la de compra; `POST /purchases/{purchase_id}/receive` with one `location_id` → 201. Save receipt, movement and balance later.
6. Repeat **same user, body and reception key** → 200, same receipt. New key for purchase already received → 409. The balance should reflect a single reception.
7. Document status and bodies **sin** credentials, keys or `request_id`.

Parametric file included `requests/E2-4_QA.http` as an example for VS Code REST Client, without credentials or real values. **POST examples are mutants**: review data/tenant before sending them, and never launch them against historical resources.

## 6. Convention on Evidence

For each case record: date, commit, environment, path, method, parameters (without secrets), business body, observed status, response and explanation fields. Distinguish observed manual, verified CI and pending. Do not infer that the full CRUD of Suppliers was executed manually for having green tests.
