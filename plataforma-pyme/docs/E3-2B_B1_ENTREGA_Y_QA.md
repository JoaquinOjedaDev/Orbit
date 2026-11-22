# E3-2B / B1 — Linking Market Payment DEMO · QA delivery

**Status:** implemented in branch, pending IC and manual testing; not approved or integrated to `main`.

## Actual scope

- REAL Menu by company: **Means of collection** (`/real/empresas/{business_id}/medios-de-cobro`).
- Card **Market Payment DEMO**: status, fictitious holder, reference and linking/unlinking/consulting controls.
- Authenticated API:
  - `GET /api/v1/businesses/{business_id}/payment-connections/mercadopago`
  - `POST /api/v1/businesses/{business_id}/payment-connections/mercadopago/demo`
  - `DELETE /api/v1/businesses/{business_id}/payment-connections/mercadopago/demo`
- Tabla `merchant_payment_connections`Additive migration `e32b_payment_connection` after `e32a_photo_assets`.
- A link per company/supplier/mode; repeat connection does not duplicate data. Disconnect retains reference; reconnects the record.
- Mutation authorisation: Active Enterprise Operator or AMINISTRATIVE PORTUGUESE. Operational roles are consulted; other 404; suspension 409.
- No password, external token, CVU, money, collectable QR or sale is generated in B1.

## Local Preparation (Windows / PowerShell)

From `plataforma-pyme/` in a clean working copy, without overwriting any changes of your own:

```powershell
git fetch origin
git switch feature/e3-2b-mercadopago-qr-demo
git pull --ff-only origin feature/e3-2b-mercadopago-qr-demo
docker compose --profile api up -d --wait
cd backend
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic check
.\.venv\Scripts\python.exe -m pytest -q tests/test_payment_connection_b1.py
$env:RUN_DB_INTEGRATION = '1'
try { .\.venv\Scripts\python.exe -m pytest -q tests/test_payment_connection_b1.py } finally { Remove-Item Env:\RUN_DB_INTEGRATION -ErrorAction SilentlyContinue }
cd ../frontend
npm.cmd run build
```

**Caution:** use only PostgreSQL QA disposable before running integrated migration/tests. If Docker Compose points to actual data, explicitly change the database before running it. Do not run write tests against the daily basis.

## Human route of B1

1. Log in REAL with company A and role holder. Open **Means of collection**, observe `NO_VINCULADA`.
2. Press **Link demo account**; check `ACTIVA` and reference starting with `MP-DEMO-`.
3. Press **Check Status**, change screen and return; when reloading F5 re-Log in (the token only lives in memory); check account persistence.
4. Switch to another B company; verify that your card is separate and does not reveal the A reference.
5. As an A worker, check for reading and absence of modification controls; the API returns 403 to POST/DELETE.
6. As holder, untie and reconnect; maintain the same test identifier.
7. Company suspended: consultation allowed, changes 409.
8. Check that sales, cash, stock, POS and real money remain intact.

## Exit door

Do not start B2 or integrate `main` hasta: CI backend/frontend/fullstack aprobado, Alembic `check` clean, PostgreSQL QA tests and validated human path. B1 does not constitute an enabled charge.