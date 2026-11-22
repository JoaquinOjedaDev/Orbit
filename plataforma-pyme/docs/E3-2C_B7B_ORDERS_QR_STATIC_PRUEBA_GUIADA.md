# E3-2C · B7-B — One QR Market TEST Payment Box for all QA companies

**Rama:** `feature/e3-2c-qr-qa-caja-unica` — **PR #70 (delete; base B6)**. No merge nor changes in `main`.
**Scope:** Disposable QA only. No external resources are modified from Market Payment until the operator manually creates the first order from the POS.

## Existing resources (DO NOT re-create)

- TEST Seller: `3837129107`
- Sucursal TEST: `89968780` (`PYMEQA001`)
- TEST box: `140776986` (`PYMEQA001POS001`)
- Same static QR from official response `POST /v2/pos`, reused by all QA companies

### Difference between QR and payment

The static QR is a **box address**Not an accreditation or order. **a static order per sale** con `POST /v1/orders`, `config.qr.mode="static"`, `config.qr.external_pos_id="PYMEQA001POS001"`, una `external_reference` unique and the original idempotent key of QR intent. The breakdown is taken from the server snapshot: if a discount or fractions prevent the sum of items from matching, a single item added in MP is issued while the PyME screen retains the full detail.

## B7-B code guarantees

- `GET /businesses/{bid}/mercadopago/qa-shared/connection`: Company membership, virtual view of QA box; no credentials; no resources generated.
- `POST .../qa-shared/orders/from-qr/{qr_id}`: an order by QR, idempotente. Backend query `GET /users/me` to confirm the TEST seller and country. Never receive amount, token, seller or box from browser.
- `mp_shared_qa_box` has a single row (id=1), with `SELECT FOR UPDATE` and durable reserve before the remote POST. Two companies cannot have two pending orders in the same box.
- `mp_shared_qa_orders` company persists, creator, total snapshot, `request_id`, reference, ID supplier, status and single sale.
- States `PREPARANDO` o `INDETERMINADA`: do not release the box or generate another `request_id`. Retry with the same key only inside the idempotence window; if not confirmed, manual revision.
- `POST .../orders/{id}/reconcile`: `GET` official validating seller, reference, amount, currency, box, mode and transaction. Processed/cancelled/expired/reimbursed releases the lock, not historical traceability.
- `POST .../orders/{id}/cancel`: only if `CREADA`. Cancellation is confirmed with official response; in case of doubt, keep box locked.
- `POST .../orders/{id}/settle-qa`: holder/admin, consults the provider, and only if status processed and accredited transaction records **UNA** sale + stock atomically, with `MERCADO_PAGO_QR_TEST`. If stock is missing it is marked for review without partial movement.
- The signed webhook B6 (when secretly configured) also reconciles shared orders with GET. The incoming message does not credit anything on its own.
- OAuth, cash changes and B6 command creation are blocked by company when the shared mode is active. DEMO simulations/finalizations are also locked if a shared order for that attempt already exists.
- New accounts are virtually linked; when creating their first QR, the necessary internal reference is still in place without requesting credentials or registering another box.

## Flags del backend (solo QA descartable)

```env
PYME_DISPOSABLE_QA=1
PYME_MP_QR_SHARED_QA_ENABLED=1
PYME_MP_SHARED_QA_ORDERS_ENABLED=1
PYME_MP_SHARED_QA_ACCESS_TOKEN=<TOKEN TEST VENDEDOR, NO VERSIONAR>
```

If the first three aren't worth exactly `1`The fourth is read only in the backend, never in Vite, HTML, GitHub or this conversation. Do not reuse a production token. Never run against a regular database. **Use of `APP_USR` alone does not guarantee that a token is a test**: TEST seller checked `3837129107` with GET to Mercado Pago.

El webhook `PYME_MP_WEBHOOK_SECRET` is optional for the first manual test (comparison can be used from the POS); it is mandatory to validate the automatic notification circuit.

## Guided manual test (after green CI)

**A. Isolating folder and DB.** Work in separate worktree, from the root folder of the original repo. Do not modify the usual base:

```powershell
git fetch origin
git worktree add --detach ..\TP-PyME-E3-2C-QA origin/feature/e3-2c-qr-qa-caja-unica
cd ..\TP-PyME-E3-2C-QA\plataforma-pyme
```

The operator must configure in that folder his private connection to PostgreSQL (`.env` **not versioned**); never copy an Access Token there or GitHub.

**B. New database.** With PostgreSQL Docker already up:

```powershell
$qaDb = "asistente_pyme_mp_b7_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
docker compose exec -T db createdb -U pyme $qaDb
if ($LASTEXITCODE -ne 0) { throw "No se pudo crear la DB QA" }
```

**C. Migrate ONLY the new DB.** In the terminal that will start FastAPI:

```powershell
cd backend
$env:DB_NAME = $qaDb
$env:PYME_DISPOSABLE_QA = "1"
$env:PYME_MP_QR_SHARED_QA_ENABLED = "1"
$env:PYME_MP_SHARED_QA_ORDERS_ENABLED = "1"
# Requiere .venv instalado en backend y .env privado con contraseña PostgreSQL.
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic check
```

**D. Enter token without showing it and lift QA backend** in the same window:

```powershell
$secureToken = Read-Host "Access Token de PRUEBA del vendedor QA" -AsSecureString
$env:PYME_MP_SHARED_QA_ACCESS_TOKEN = [System.Net.NetworkCredential]::new("", $secureToken).Password
$secureToken = $null
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 18001
```

**E. Frontend** in OTRA terminal within the worktree QA (`plataforma-pyme/frontend`):

```powershell
$env:PYME_API_PROXY_TARGET = "http://127.0.0.1:18001"
npm.cmd ci
npm.cmd run dev -- --host 127.0.0.1 --port 5174
```

Browse `http://127.0.0.1:5174`; create user and test company NEW in that disposable DB, item/service and small sale, e.g. ARS 100. In ‘Means of collection’ see box `140776986`, then POS → QR → "Assign sale to the real QR TEST". `provider_order_id` that starts with `ORD`, static QR and the correct total. **Before POST do not scan the QR box**.

**F. Insulation.** Create another QA company and try another QR: the server must return `409` while there's order `CREADA` On cancelling that order from your screen (confirmed by provider), the second can start a new command.

**G. Payment.** Use *another TEST buyer of Pay Market*, never the TEST seller account or a personal. Check payment on the device, click "Check Payment". Only if you get `PROCESADA` and accredited transaction, holder/admin can click "Register verified QA sale and discount stock". Repeat closing: same `sale_id`No double stock.

**H. Uncertain response.** If there is HTTP 5xx/timeout, do not create another sale or box. Return to same QR, "Check Saved Command", "Check" if ID exists, or try again **same** command/key inside the secure window. If left `INDETERMINADA` no ID, do not force lock release: manual review.

**Cleaning**: disconnect QA server, delete environment variables from that session and, after exporting evidence, remove the DB QA if desired. Do not erase the usual base, do not merge without permission.

## Evidence required to close B7-B

- CI backend in Python 3.12/3.14 + migration/Alembic and IC frontend.
- External manual test with real MP TEST responses (mocks are not enough).
- Seller identity, cash, currency, amount and items; another company blocked.
- Payment status reconciled, single invoice/sale and stock (or secure review).
- TEST buyer other than the seller, webhook signed when configured.

Official source: https://www.mercadopago.com.ar/developers/es/docs/qr-code/payment-processing
