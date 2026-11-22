# Orbit backend

The FastAPI service uses PostgreSQL, SQLAlchemy, and Alembic. It handles company access, purchasing, inventory, sales, and receipts.

## Run locally

Follow the [setup guide](../../docs/getting-started.md). Once the API is running, open `http://localhost:8000/docs`. Use `/health` for process status and `/ready` for database connectivity.

## Checks

Run `python -m pytest` from this directory. To run PostgreSQL integration tests, configure a disposable test database and set `RUN_DB_INTEGRATION=1`.

The [API traceability matrix](../entrega-programacion-2/05_MATRIZ_API_Y_TRAZABILIDAD.md) maps endpoints to workflows and tests.

---

## Historical archive E2-0 to E2-5 (preserved)

> **E2-5 C — Ajustes y stock inicial (09/11/2026):** API `POST/GET /api/v1/businesses/{business_id}/inventory/adjustments` on occasion, expected version, signs, idempotence and permission controls by location. The first balance (`STOCK_INICIAL`) requires holder/admin and only supports location+article without history; adjustments require prior balance and do not allow negatives. **No new migration**: `e25a_inventory_ops`. [Contract/QA](../docs/E2-5_C_AJUSTES_Y_STOCK_INICIAL.md). CI E2-5 C #42616213215: **840 Python 3.12, 840 Python 3.14 tests, 3/3 jobs approved, drift-free Alembic**. Local Windows validation pending.

> **E2-5 B — Transfers (09/11/2026, IC approved; Windows pending):** new POST/GET `/api/v1/businesses/{business_id}/inventory/transfers`, debit/credit in a transaction, STORE permission in both locations, signed ledger and idempotent replay. No new migrations: `e25a_inventory_ops`. [Detalle y QA](../docs/E2-5_B_TRASLADOS_ATOMICOS.md). Base E2-5 A validated 816 local tests and CI; CI E2-5 B #42602232103: **826 tests Python 3.12, 826 Python 3.14, Docker 3/3, Alembic sin deriva**. Windows validation still pending.

> **Current status — E2-5 A (09/11/2026):** preparation of closed E2-4 inventory operations. `InventoryOperation`, ledger signed expanded and additive migration `e25a_inventory_ops`; **no new transfer/adjustment endpoints in this cut**. The E2-4 reception and its existing data remain intact. [E2-5A contract and procedure](../docs/E2-5_A_MODELO_OPERACIONES_INVENTARIO.md)The following sections E2-0 to E2-3 are historical records, not the last head. CI E2-5 A: **816 tests en Python 3.12, 816 en Python 3.14, 3/3 jobs verdes**, `e25a_inventory_ops (head)` sin deriva; **Windows still pending**.

# Orbit — Backend FastAPI

> **REFERENCE STATE — E2-4 (08–09/11/2026):** Suppliers and Purchases with snapshots, complete and unique reception, movement by physical line, atomic balance per company/location/article. `e24e_receipt_stock` (sin deriva), **797/797 tests en Windows y Python 3.12/3.14 CI**, Healthy Docker, 17-case Swagger log. `4f88416141c09a82e744990b1aee8c00b9f31dfd`. **Source in force:** [E2-4 closure documented](../docs/revisiones/E2-4_CIERRE/00_LEEME.md); [sheet for independent auditor](../docs/revisiones/E2-4_ENTREGA_PARA_REVISION.md). El resto de este README conserva notas **historical** by increase, which can present E2-4 modules as futures at the drafting date. Do not confuse with the current state or a productive deployment.


**Previous historical status (08/11/2026):** Preserved E2-1 and E2-2; locally validated E2-3 A/B/C/D (580 tests), E2-3 E documentation and UML 03A reconciled. `e23a_catalog (head)` no drift; API/DB health. Five Catalogue routes protected by company; frontend DEMO and pending business operations. E2-3 outstanding audit delivery.

> **Historical state E2-2 (08/11/2026):** E2-2 A/A.1/B/C/D implemented and validated: **371 Windows tests approved in 47.57s**, Alembic `e22d_assignments (head)` sin deriva, API y PostgreSQL en Docker `healthy`, `/ready` = `ready/ok`. Code IC E2-2 D: 3/3 approved, 371 Python tests 3.12/3.14 and Docker. **The headquarters policy does not yet apply to inventory/purchases/sales**, which are future blocks; frontend React remains DEMO. The partial states described in notes of A/B/C constitute historical.


**Architectural source:** [Document 04](../entrega-programacion-2/04_ARQUITECTURA_Y_PATRONES.md).

## Requirements

- Python **3.11–3.14**, pip and virtual environment.
- PowerShell en Windows o shell en Linux/macOS.

## Primer arranque en PowerShell

From the **repository root**:

```powershell
cd plataforma-pyme/backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

If you're already inside `plataforma-pyme/backend`, I omitted the first `cd`.

Open:

- `http://127.0.0.1:8000/health`: `{"status":"ok","service":"asistente-pyme-api"}`.
- `http://127.0.0.1:8000/docs`: Swagger UI.
- `http://127.0.0.1:8000/openapi.json`: OpenAPI.

Stop Uvicorn with `Ctrl+C`.

## Linux / macOS

```bash
cd plataforma-pyme/backend
python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -e '.[dev]'
.venv/bin/python -m pytest
.venv/bin/python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Architecture of this court

```text
backend/
├── app/
│   ├── main.py              # configuración y montaje de la aplicación FastAPI
│   └── api/
│       ├── health.py        # liveness independiente de PostgreSQL
│       └── v1/router.py     # espacio para recursos comerciales
├── tests/test_health.py     # salud, documentación y rutas inexistentes
├── pyproject.toml
└── .gitignore
```

**E2-0.2:** PostgreSQL 16 y Docker Compose. **E2-0.3:** SQLAlchemy, real connection and Alembic. `/health` indica liveness y `/ready` Check PostgreSQL connectivity.

Future blocking routes using SQLAlchemy synchronous will be `def`; sessions will be of limited duration and repositories will not `commit()`. Commercial contracts will be incorporated under `/api/v1`.

## E2-0.2: PostgreSQL 16 con Docker Compose

**This court created a local PostgreSQL development base.** E2-0.3 adds ORM connection and first migration, still without commercial tables.

The file `compose.yaml` is in `plataforma-pyme/`, **un nivel arriba** of this backend. The port is used **55432 of the team** towards the **5432 container**, so as not to interfere with PostgreSQL 16 that can already be installed locally on Windows.

### Primer arranque: PowerShell

If you are located in `plataforma-pyme/backend`:

```powershell
cd ..
docker --version
docker compose version
Copy-Item .env.example .env
notepad .env
```

In the Notepad, replace `POSTGRES_PASSWORD=` by a **long and private password**. The file `.env` is excluded from Git: do not upload or share it. **should not be left empty**.

Then run, still inside `plataforma-pyme/`:

```powershell
docker compose config --quiet
docker compose up -d db
docker compose ps
docker compose exec -T db psql -U pyme -d asistente_pyme -c "SELECT current_database() AS db, current_setting('server_version') AS postgres_version;"
```

**Expected result:** service `db` active and then `healthy`; query SQL showing `asistente_pyme` and PostgreSQL version `16.x`. The first boot may need to download the image; watch `docker compose ps` until the service is healthy. If Docker is not installed or is not started, do not modify your Windows PostgreSQL: the next step is to prepare Docker Desktop and repeat these commands.

**Safety and persistence:** el acceso se publica solo en `127.0.0.1:55432`Not the whole network. `db_data` is a persistent volume exclusive to this Compose; `docker compose down` Stops without deleting the data. **No ejecutar `docker compose down -v`** unless you want to deliberately delete the development data. Do not use this Compose as it is in public production.

**If port 55432 is occupied**, change alone `POSTGRES_HOST_PORT` in the local file `.env` and reapplyed `docker compose up -d db`. The port inside the container remains 5432.

**If password changes after creating volume**, PostgreSQL does not automatically modify the credentials of an already initialized volume. For MVP it retains the initial password and, if you need to rotate it, do so using SQL and an explicit strategy. Do not delete volumes to unplannedly solve a credentials error.

### Volver al backend de Python

```powershell
cd backend
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
.\.venv\Scripts\python.exe -m pytest -v
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

API and base lift **in independent processes**. `/health` checks the process and `/ready` Check PostgreSQL.

## Quality

```powershell
.\.venv\Scripts\python.exe -m pytest
```

The extra `.[dev]` install **httpx2** for `TestClient` (Modern Starlette); keeping it in the manifest avoids warning that appeared to the user. Existing unitary tests are infrastructure: **do not amount to ten unit tests of business logic of the TP**. Added proofs of business rules, real integration with PostgreSQL and IC in the next stages.

No real business secrets or data are kept. **Not amended `frontend/`.**


## E2-0.3: SQLAlchemy 2.x + Alembic + readiness

**The password is read from `plataforma-pyme/.env` automatically:** is the same private file that Docker Compose uses. Do not include it in commands or commits. API uses local port `POSTGRES_HOST_PORT` (default 55432).

First, from `plataforma-pyme/`:

```powershell
docker compose ps
```

Then, from `plataforma-pyme/backend/` (sin recrear `.venv`):

```powershell
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
.\.venv\Scripts\python.exe -m pytest -v
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check
```

Expected outcome: revision `e2003_baseline (head)` and Alembic without pending differences. Initial migration is **intentionally empty**: creates follow-up `alembic_version`, not business tables. In the next stages will be added entities with new migrations. `Base.metadata.create_all()` instead of migrations.

From `plataforma-pyme/`, verify the review record:

```powershell
docker compose exec -T db psql -U pyme -d asistente_pyme -c "SELECT version_num FROM alembic_version;"
```

Lift API from `backend/`:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- `GET /health`: HTTP 200, live process; independent of base.
- `GET /ready`: HTTP 200 and `{"status":"ready","database":"ok"}` when PostgreSQL responds to `SELECT 1`; 503 error without sensitive details if not.
- `GET /docs`: Swagger shows both routes.

Architecture: `app/core/settings.py` read the variables of `.env` located in the root of `plataforma-pyme`, usa `URL.create()` to handle special characters. Optional support `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_NAME` for future deployments.

`app/infrastructure/db.py` initialize engine and sessionmaker when you need them. A Session is by command and never shared between requests. `session_scope()` makes rollbacks to mistakes and **no hace commit**; that responsibility shall be for the service of the use case.

Automatic tests of E2-0.3 use dual connection and do not write to actual PostgreSQL. `alembic upgrade head` y el `/ready` real are integration checks explicitly performed by the developer.

**Security:** not share `.env`, `docker compose config` sin `--quiet` or logs with secrets. `docker compose down -v` to stop the base.

## E2-0.4 — API Docker y CI independiente

The service `api` es **optional** y usa un perfil Compose: `docker compose up -d db` continues to start PostgreSQL exclusively. API runs within Docker with the hostname PostgreSQL `db` and internal port `5432`without publishing credentials or copying `.env` The service uses a user without root privileges.

From `plataforma-pyme/`with Docker Desktop running and the same `.env` private of E2-0.2:

```powershell
git pull origin main
docker compose config --quiet
docker compose --profile api up -d --build api
docker compose ps
Invoke-RestMethod http://127.0.0.1:18000/health
Invoke-RestMethod http://127.0.0.1:18000/ready
```

Expected result: `db` y `api` assets; both endpoints return HTTP 200. The container exposes `127.0.0.1:18000` on Windows, **no 8000**If 18,000 were occupied, I defined `API_HOST_PORT` en `.env` And use that port. `POSTGRES_HOST_PORT` continues in 55432; none of these options interfere with Windows local PostgreSQL in 5432.

```powershell
# Desde plataforma-pyme/
docker compose --profile api stop api
```

Stops only the Docker API, keeping PostgreSQL and its volume. Do not run `docker compose down -v`. In the container, no migrations are automatically executed: they are a separate deployment operation. The initial migration has already been applied to the local PostgreSQL in E2-0.3.

### Tests con PostgreSQL real

From `backend/` PostgreSQL independent tests continue to work:

```powershell
.\.venv\Scripts\python.exe -m pytest -v
```

In addition, the file `tests/test_postgres_integration.py` includes actual connection and registration checks `alembic_version`. **Not enabled by default** to avoid accidental access to real databases. If you want to run them manually against the PostgreSQL development, from `backend/`, with the container `db` healthy and applied migration:

```powershell
$env:RUN_DB_INTEGRATION = "1"
.\.venv\Scripts\python.exe -m pytest -v
Remove-Item Env:\RUN_DB_INTEGRATION
```

We wait. **15 tests**: 13 infrastructure + 2 integration (commercial tests will be added in E2-1 and later). No commercial records created or altered.

### GitHub Actions

El workflow `.github/workflows/plataforma-pyme-backend.yml` is independent of frontend and activated against changes in backend, Compose or workflow. Use Python 3.12 and 3.14 with PostgreSQL 16 ephemeral, migrate from scratch, run `alembic check` and all tests with enabled integrations. Another job builds Docker image and checks `/health` in a container.

IC credentials are **ficticides and ephemerals** The frontend pipeline remains independent. Check results in the tab **Actions** before stating that IC is approved.

The dockered backend is not yet publicly displayed. A built image and a successful pipeline **do not replace the deployment required by TP**.

## E2-1.1 — First table: Global user identity

**Functional source:** RF-01, CU-01 and CU-02; Document 03, Section 3.1 and UML 03A.

Entity is incorporated `User` with PostgreSQL table `users`, without DEMO users persisted, without a mandatory company and without global roles. `e2101_users` includes:

- `id`: UUID unique as primary key.
- `email_normalizado`: single mail, not null, in lowercase and without outer spaces, up to 254 characters. E2-1.2 will complete the semantic validation of the mail.
- `password_hash`: non-null, space for a modern password hash. **Storage alone does not guarantee it is an Argon2id hash**; E2-1.2 will do the hash and its verification.
- `display_name`: name 2 to 70 characters; `contact_phone` optional maximum 30, depending on the frontend profile.
- `status`: `ACTIVO` o `DESHABILITADO`, starting value `ACTIVO`.
- `created_at` y `updated_at`: dates with time zone. The ORM updates `updated_at` when modifying records from SQLAlchemy; there is no trigger for external SQL modifications yet.

The avatar initials can be derived from the IU. Roles and permissions will belong to the table `memberships` in a later increase, never to `users`.

### Apply and verify migration

From `plataforma-pyme/`, con PostgreSQL Docker saludable:

```powershell
git pull origin main
docker compose ps
cd backend
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check
```

Expected result: `e2101_users (head)` y `No new upgrade operations detected.`

Integration tests perform random mail insertions within PostgreSQL transactions that **always reversed**. They do not leave test users on the base:

```powershell
$env:RUN_DB_INTEGRATION = "1"
.\.venv\Scripts\python.exe -m pytest -v
Remove-Item Env:\RUN_DB_INTEGRATION
```

To check the review and table, from `plataforma-pyme/`:

```powershell
cd ..
docker compose exec -T db psql -U pyme -d asistente_pyme -c "SELECT version_num FROM alembic_version;"
docker compose exec -T db psql -U pyme -d asistente_pyme -c "\d users"
```

`\d users` is an internal order of `psql`, not ordinary SQL; displays columns, restrictions and indices. Expected: revision `e2101_users`, tabla `users` y constraint `uq_users_email_normalizado`.

**No ejecutes `alembic downgrade` on actual data**, because reversing this migration deletes the user table.

### Scope and next step

- **Done as code:** model, table, migration and tests of oneness/normalization/state and rollback.
- **Pending validation on the computer:** migration application and integration tests.
- **E2-1.2 (after):** mail standardization, Argon2id, real registration and login, secure DTOs and HTTP tests. The specific credentials policy will be closed before programming.
- **E2-1.3:** The UML 03A will remain conceptual until these entities are integrated and their relationships.

## E2-1.2A — Real account recording

It's incorporated. `POST /api/v1/auth/register`: creates a global user, without company or membership, returning HTTP 201 with public fields (`id`, `email`, `display_name`, `contact_phone`, `status`, `created_at`). It does not return password nor hash. The email address is validated and normalized; ASCII is required for consistency with CHECK PostgreSQL, the uniqueness is guaranteed by `uq_users_email_normalizado`. A duplicate returns 409 with generic message. Invalids return 422.

Argon2id is used with random salt, 64 MiB memory, 3 iterations and parallelism 2. Initial policy requires 15 to 128 character access phrases. **NO session starts** no business permits. No new migrations added: the table is used `users` already validated in E2-1.1.

From `plataforma-pyme/backend/`:

```powershell
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
$env:RUN_DB_INTEGRATION = "1"
.\.venv\Scripts\python.exe -m pytest -v
Remove-Item Env:\RUN_DB_INTEGRATION
```

HTTP tests against PostgreSQL use an external transaction and SAVEPOINT: the test discharges are always reversed, without saving users. GitHub Actions runs the tests on an ephemeral base. To manually test Swagger, use API in `http://127.0.0.1:8000/docs` (Uvicorn Windows) or reconstruct Docker image and open `http://127.0.0.1:18000/docs`.

**Do not send real credentials in messages or files.** A high manual performed outside tests **if it persists**. For public deployment HTTPS is missing, anti-abuse and anti-gross force controls, protection against enumeration (409 reveals duplicates), email verification/recuperation and session management. E2-1.2B will incorporate login, expiration and revocation. The frontend is not modified.

## E2-1.2B — Personal sessions

New review Alembic `e212b_sessions`: tabla `auth_sessions` linked to `users` with FK, unique SHA-256 token print, creation dates, expiration and revocation. Do not keep bearer clear. The 256-bit random token is issued **only when logging in**; hard **12 hours**. Each protected request consults PostgreSQL to verify current session and active user.

| Path | Action |
|---|---|
| `POST /api/v1/auth/register` | Creates global identity, without a company |
| `POST /api/v1/auth/login` | Check Argon2id password and emits Opaque Bearer |
| `GET /api/v1/auth/me` | Public identity, requires Bearer |
| `POST /api/v1/auth/logout` | Revocation of current session only; HTTP 204 |

Error credentials, no user or disabled, expired or revoked session return HTTP 401 generic, without revealing what condition occurred. **outstanding**and the personal login does not grant commercial access.

### Probarlo en PowerShell

From `plataforma-pyme/`, with PostgreSQL Docker started:

```powershell
git pull origin main
cd backend
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check
$env:RUN_DB_INTEGRATION = "1"
.\.venv\Scripts\python.exe -m pytest -v
Remove-Item Env:\RUN_DB_INTEGRATION
```

Integration tests use real PostgreSQL under reversible external transactions; they leave no users or test sessions. `plataforma-pyme/`I just rebuilt the Docker API: `docker compose --profile api up -d --build api`. Consult Swagger at `http://127.0.0.1:18000/docs`. Do not paste tokens or real passwords in chat, logs or captures.

**Production limitations:** HTTPS public missing, limits of attempts against abuse, protection from enumeration, recovery and mail confirmation, secure frontend credentials storage and cookie/CSRF strategy if adopted later. Do not publicly expose this API without resolving these measures; the React DEMO browser remains unintegrated.

## E2-1.3A — Enterprise and Membership Entities (actual model)

**References:** Document 01 RF-02; Document 02 CU-03 and CU-12; Document 03 UML 03A and section 3.1; Document 04 authorization per tenant.

The Alembic Review `e213a_business_members` crea:

- `businesses`: UUID, name (2–120), category/category (2–120), activity `PRODUCTOS/SERVICIOS/MIXTO`historical founder `founder_user_id` (FK a `users`), status `ACTIVA/SUSPENDIDA` and dates.
- `memberships`: UUID, `business_id` (FK), `user_id` (FK), rol `TITULAR_ADMINISTRATIVO/ADMINISTRADOR/ENCARGADO/TRABAJADOR`status `ACTIVA/INACTIVA`optional position and dates.
- `UNIQUE (business_id,user_id)`: a single membership per person and company.
- Single index **partial** `uq_memberships_one_active_owner`: at most an active membership with role `TITULAR_ADMINISTRATIVO` by company. It does not block other administrators or collaborators.
- Contents `ix_memberships_user_id`: efficient queries from companies associated with an account.

**Decision to avoid inconsistency:** the historical founder lives in `businesses.founder_user_id`; the current administrative holder is **derived from Active Membership** with role `TITULAR_ADMINISTRATIVO`There's no `administrative_owner_user_id` redundant. It does not mean legal title or corporate participation. The transfer of ownership is postponed, as are the current documents.

**Database boundary:** the partial index guarantees **not more than one**; does not guarantee that there is at least one. E2-1.3B will implement `crearEmpresa` en **one transaction**, with company and initial membership of the founder. No endpoint in this court still creates companies, memberships or invitations. No location or stock is created by default; roles will be authorized in backend by permission and tenant in the following increments, not by trusting the frontend.

### Windows Check

From `plataforma-pyme/`keeping PostgreSQL healthy:

```powershell
git pull origin main
cd backend
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check
$env:RUN_DB_INTEGRATION = "1"
.\.venv\Scripts\python.exe -m pytest -v
Remove-Item Env:\RUN_DB_INTEGRATION
```

Review expected `e213a_business_members (head)` and no difference Alembic. Tests use PostgreSQL and SAVEPOINT transactions that are reversed; **no companies or demonstration users left**.

Checking tables from `plataforma-pyme/`:

```powershell
cd ..
docker compose exec -T db psql -U pyme -d asistente_pyme -c "SELECT version_num FROM alembic_version;"
docker compose exec -T db psql -U pyme -d asistente_pyme -c "\d businesses"
docker compose exec -T db psql -U pyme -d asistente_pyme -c "\d memberships"
```

No ejecutar un `downgrade` with real data. This cut **does not modify React, does not create business paths and does not require rebuilding the Docker API image**: only changes the schema and backend tests. The Docker backend will continue to work with `/health` y `/ready`.

**Next increase E2-1.3B:** Authenticated command of business creation and initial membership, in a transaction; listing of own companies, without cross-access. Then E2-1.3C: roles/permissions, invitations if kept in scope; subsequent update of UML 03A with validated code.

## E2-1.3B — CU-03: creating businesses and seeing only their own

**Implemented:** tres endpoints protegidos con Bearer en `/api/v1/businesses`:

| Method | Path | Response |
|---|---|---|
| POST | `/api/v1/businesses` | 201 first creation; 200 identical retry; 409 same key with different data |
| GET | `/api/v1/businesses` | 200 according to companies where the session has active membership |
| GET | `/api/v1/businesses/{business_id}` | 200 if active member; 404 if non-existent or no active member |

Creation is named, heading `category` and type of activity `PRODUCTOS/SERVICIOS/MIXTO`. Must carry a header **`Idempotency-Key` with a different UUID v4 by new command**. In HTTP retrying of the *same* command, the same key and content are reused. Sending is not allowed `founder_user_id`, `role` ni `user_id` from the client: the server derives them from the real identity.

The service checks the active account and session again **with rows locked within the same transaction** and then create the Enterprise, initial Membership `TITULAR_ADMINISTRATIVO/ACTIVA` and the idepotent record; confirms **once only**. Before failure reverses the three scriptures. The record `business_creation_requests` has composite primary key `(actor_user_id, idempotency_key)`, canonical hash of request and reference to the company created. It is not eliminated with TTL: avoids duplication before subsequent retry.

No locations, catalog, stock or legal partners are generated. **are not unique globally**; a business name and verifiable tax identifier will be defined later if the business requires it. `SUSPENDIDA` for consultation; the business transaction blocking will be implemented when there are business services. To avoid enumeration, the GET per ID returns **404 for both non-member and non-existent companies**.

### Check on your computer

From `plataforma-pyme/` con Docker PostgreSQL activo:

```powershell
git pull origin main
cd backend
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check
$env:RUN_DB_INTEGRATION = "1"
.\.venv\Scripts\python.exe -m pytest -v
Remove-Item Env:\RUN_DB_INTEGRATION
```

The expected revision is `e213b_business_creation (head)`. Integration tests create users/enterprises within an external transaction and SAVEPOINTs; **are reversed at the end** and they leave no persistent records.

Then, from `plataforma-pyme/`I rebuilt the Docker API with `docker compose --profile api up -d --build api`Check. `docker compose ps` And I opened `http://127.0.0.1:18000/docs`. New routes will appear under `empresas`. The POST manual test from Swagger **Yes, it keeps the real company.**So automated testing is enough for this cut.

**Update of historical record E2-1.3C:** Business permissions, issuance/acceptance and equipment management are already implemented; specific controls for future commercial commands remain pending. React will continue in DEMO mode until proven HTTP contracts are available. UML 03A models will be adjusted over the confirmed code.

### Alembic comparison correction in E2-1.3B

The primary key composed of `business_creation_requests(actor_user_id, idempotency_key)` **already guarantees the uniqueness of retry per person**The ORM declaration also contained a `UniqueConstraint` PostgreSQL 16 discards the duplicate index, but Alembic saw it in the metadata and detected an alleged pending operation `add_constraint`.

Deleted **only redundant UNIQUE of the ORM model** and the model test was adjusted; the effective scheme was not modified, passwords were not altered or a new migration was generated. Historical migration E2-1.3B remains immutable because it has already been applied. Real uniqueness is still covered by PK `pk_business_creation_requests`, and the reference `business_id` preserves its independent UNIQUE. `git pull`, `python -m alembic check` should indicate `No new upgrade operations detected.`If it still fails, inspect `\\d business_creation_requests` before modifying the database. Do not use `alembic stamp`, `downgrade` nor SQL manual for this correction.

## E2-1.3C.1 — Initial permit matrix and documentary update

`app/modules/businesses/permissions.py` defines capacities `business.view`, `business.profile.edit`, `members.invite` y `members.manage`. The decision depends on **membership role, membership status, company status and requested permission**. Non-existent roles and unknown states are denied; suspended company is read only for active members. This policy is pure and has tests; **NOT yet invoked from new edit or invite endpoints**.

The recovery of Idempotency races in the `BusinessService.create`: PostgreSQL may report violation of **`pk_business_creation_requests`**, not the restriction `uq_business_creation_actor_key` The route retains retrying without duplicating companies and a specific unit test was incorporated.

Updated academic documents: 01 v0.3, 02 v0.4, 03 v0.4 and 04 v0.5; new Document 05 v0.1 with real traceability and permission matrix. **No migration in this court**, the frontend is not altered or actual data is modified.

From `plataforma-pyme/`:

```powershell
git pull origin main
cd backend
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check
$env:RUN_DB_INTEGRATION = "1"
.\.venv\Scripts\python.exe -m pytest -v
Remove-Item Env:\RUN_DB_INTEGRATION
```

The version remains `e213b_business_creation (head)`; Alembic should not detect pending operations. **80 tests existentes** and also approve new cases of RBAC matrix and idempotency recovery. Docker does not need to be rebuilt because there is no effective HTTP change in C.1. **E2-1.3C.2** connect this policy to a real operation authorized by role, with proofs of 401/403/404/409 and belonging to the company.

## E2-1.3C.2 — Edit company data with effective authorisation

**Nuevo endpoint:** `PATCH /api/v1/businesses/{business_id}`. Receives only optional fields `name`, `category` y `activity_kind`. At least one mandatory field per request; `null`, extra fields, invalid name/rub or `activity_kind` outside `PRODUCTOS/SERVICIOS/MIXTO` produce HTTP 422. The omitted fields are not modified.

**Real permits:** the service revalidates user and session token with SQL lock, then gets and blocks `Business` y `Membership` of the same tenant with member `ACTIVA`, and applies `BusinessPermission.EDIT_PROFILE`. Administrative and administrative owner can edit; in charge and worker, no. Codes: 401 invalid session, 404 non-existent/non-existent company/inactive membership, 403 unlicensed role, 409 suspended company with apt role, 200 successful edition. No request can alter status, founder, membership or role. `flush/commit`, with rollback before exception; type response `BusinessView`.

**New tests:** `tests/test_business_update_schemas.py`, `tests/test_business_update_http.py`, `tests/test_business_update_integration.py`. The same PostgreSQL database and reversible transactions from the above cuts are used: do not create manual companies from Swagger to verify. Test data should not be persisted.

**Validation on Windows:** from `plataforma-pyme/`, ejecutar:

```powershell
git pull origin main
cd backend
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check
$env:RUN_DB_INTEGRATION = "1"
.\.venv\Scripts\python.exe -m pytest -q
Remove-Item Env:\RUN_DB_INTEGRATION
```

Expected: same revision `e213b_business_creation (head)`, `No new upgrade operations detected` y suite completa aprobada. **Do not affirm a final figure until it is executed**. To see PATCH in Docker Swagger, from `plataforma-pyme/` volver a construir **only API** con `docker compose --profile api up -d --build api`, check `docker compose ps`, `Invoke-RestMethod http://127.0.0.1:18000/ready` and open `http://127.0.0.1:18000/docs`. This update does not require new tables or migrations.

**Documentation:** 01 v0.4, 02 v0.5, 03 v0.5, 04 v0.6, 05 v0.2, academic index. The next step within E2-1 will be C.3 (invitation issue), followed by C.4 (acceptance/membership management). The formal audit sheet for your partner will be created when you close the large functional block **E2-1**, no al completar este subpaso.

## E2-1.3C.3 — Business invitations: issuing without granting access

**New migration:** `e213c3_invitations` crea `business_invitations` (standardized mails, token SHA-256, role, status, maturity, company and guest). `POST /api/v1/businesses/{business_id}/invitations` answers 201 and returns the secret token **once only**. Token is not stored in clear. It only invites `ENCARGADO` o `TRABAJADOR`, and only holders/administrators can issue. No acceptance, emailing or changes to `memberships` at this step.

Permissions and errors: 401 session invalid, 403 member without permission, 404 company outside/without active membership, 409 suspended/member already active/invitation in force, 422 body incorrect. An invitation pending to normalized email in a company is prevented by partial index UNIQUE. If it expired, it is marked `EXPIRADA` before generating a new one. Validation and writing is done in a transaction; guest mail does not need to have global account yet.

**CI:** GitHub Actions validated migration, `alembic check`, Pytest real con PostgreSQL 16 en Python 3.12/3.14 y Docker. **Running missing on local Windows** after applying new migrations.

From `plataforma-pyme/` con Docker DB saludable:

```powershell
git pull origin main
cd backend
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check
$env:RUN_DB_INTEGRATION = "1"
.\.venv\Scripts\python.exe -m pytest -q
Remove-Item Env:\RUN_DB_INTEGRATION
cd ..
docker compose --profile api up -d --build api
docker compose ps
Invoke-RestMethod http://127.0.0.1:18000/ready
```

Waited: `e213c3_invitations (head)`, no drifting Alembic, approved suite and API/DB `healthy`. En Swagger `http://127.0.0.1:18000/docs` the new POST will appear. **Warning:** Using Swagger to issue invitation creates a real record; the revertible integration tests are sufficient for this cut. Do not display invite tokens in captures, logs or documentation.

**Synchronised documentation:** 01 v0.5, 02 v0.6, 03 v0.6, 04 v0.7, 05 v0.3 and academic index. **Next:** C.4 accept and manage memberships; only when you close E2-1 complete is your partner's transfer to audit report generated.

## E2-1 C.4a — Accept invitation and enable actual membership

**Contract:** `POST /api/v1/invitations/accept` with Bearer of the recipient and JSON `{"invitation_token":"..."}`. Only the account whose standard mail matches the invitation can be consumed. The service revalidates user/session, checks token and expiration footprint, blocks invitation/company/membership, creates or reactivates a single Operating Membership, ACCEPTED mark and saves user/date on **a transaction**. Respond 200 with `BusinessView`; 401 invalid session, 404 token non-existent/alien, 409 expired/consumed, company suspended or already active membership, 422 invalid body. The client does not choose company/rol when accepting. The historical status/rol of the inactive administrative holder is protected. There is no secret token in the acceptance response DTOs.

**New migration:** `e213c4_acceptance` adds acceptance audit to `business_invitations` (`accepted_by_user_id`, `accepted_at` and CHECK of consistency with ACCEPTED state). Do not modify previously applied migrations. `test_business_acceptance_schema.py` y `test_business_acceptance_integration.py` They check receiver, account created after the invitation, token alien/duplicate/win, company suspended, role, reactivated membership, multi-company isolation, revoked session and rollback after a bug. GitHub Actions approved migration, Pytest and Docker; local validation is missing.

**Check from `plataforma-pyme/`** con Docker PostgreSQL saludable:

```powershell
git pull origin main
cd backend
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check
$env:RUN_DB_INTEGRATION = "1"
.\.venv\Scripts\python.exe -m pytest -q
Remove-Item Env:\RUN_DB_INTEGRATION
cd ..
docker compose --profile api up -d --build api
docker compose ps
Invoke-RestMethod http://127.0.0.1:18000/ready
```

The subsequent local check confirmed `e213c4_acceptance (head)`, Alembic without new operations and **195 tests approved** at closing C.4b. A consultation to `/ready` immediately after rebuilding may fail while the container displays `health: starting`; repeat after boot. No actual invitations from Swagger are required, because PostgreSQL tests create and reverse data. Basic member administration was completed in C.4b; cancellation/rejection of invitations, email validation and secure delivery for production remain pending.

**Documents of that historical court C.4a:** 01 v0.6, 02 v0.7, 03 v0.7, 04 v0.8 y 05 v0.4. **Versions on closing C.5:** 01 v0.8, 02 v0.9, 03 v0.9, 04 v1.0 and 05 v0.6; UML 03A reconciled. No frontend changes.

## E2-1 C.4b — Membership and administration directory per holder

Two team routes were published:

- **GET `/api/v1/businesses/{business_id}/memberships`**: holder/active administrator (permission `members.read`) obtain members of the same tenant with minimum professional identity (`id`, `user_id`, `email`, `display_name`, `role`, `status`, `job_title`), including INACTIVES. Maintainer/worker cannot read that directory.
- **PATCH `/api/v1/businesses/{business_id}/memberships/{membership_id}`**: only valid administrative holder (permission `members.manage`) can change `role` (`ADMINISTRADOR`, `ENCARGADO`, `TRABAJADOR`) y/o `status` (`ACTIVA`, `INACTIVA`) Only operational memberships of that tenant. It does not allow to change the active holder or an inactive historical owner, transfer title, or update user_id or job_title.

Both operations revalidate user, token, company and actor membership in the DB. Editing also blocks objective membership and confirms a unique transaction; it does not affect other businesses or the global personal profile. Errors: 401 auth, 403 insufficient role, 404 tenant/target alien, 409 suspended company or protected holder, 422 body of invalid PATCH. **No new migration**; Alembic continues in `e213c4_acceptance`.

**New tests:** `test_business_team_schemas.py` (DTOs, OpenAPI y auth) y `test_business_team_integration.py` (RBAC, isolation, role/state changes, impossible self-degradation and rollback), plus enlargement of `test_business_permissions.py`. CI approved Pytest with PostgreSQL Python 3.12/3.14 and Docker. Run local checks before calling C.4b closed.

From `plataforma-pyme/`:

```powershell
git pull origin main
cd backend
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check
$env:RUN_DB_INTEGRATION = "1"
.\.venv\Scripts\python.exe -m pytest -q
Remove-Item Env:\RUN_DB_INTEGRATION
cd ..
docker compose --profile api up -d --build --wait api
docker compose ps
Invoke-RestMethod http://127.0.0.1:18000/ready
```

React was not altered or any brother project. **C.5 consolidated UML 03A and documents 01–05.** The partner's audit sheet will be prepared separately, after synchronization and before RF-03.

## E2-1 C.5 — Evidence and scope of the documentary closure (08/11/2026)

**Functional basis:** commit `8cd167481291b78628da0d038c7414cc26e3a311`, with CI 3/3. In Windows, the developer executed PostgreSQL integration tests with `RUN_DB_INTEGRATION=1`, result `195 passed in 23.86s`. `alembic current` returned `e213c4_acceptance (head)` y `alembic check` He didn't find any new operations. `docker compose --profile api up -d --build --wait api` concluded with API/DB `healthy` y `/ready` `ready`/`ok`.

**C.5:** update documents 01–05, indexes and 03A (PUML, SVG, guide). **Not amended** code, tests, migrations, React, 03B or 03C, nor does it imply a re-executing IC for the documentary commit. **independent review sheet** for the companion; then RF-03 Locations.

## E2-2 A — Location model and incremental validation

**E2-2 A — Persistence of Locations (08/11/2026):** Published `Location`/`locations` with FK required `business_id → businesses.id` (`RESTRICT`), six types, `can_sell`/`can_store` independent, optional reference fields, `ACTIVA/PAUSADA`, `is_primary`, partial index that allows at most a main active per tenant and CHECK that prevents main paused. Additive migration `20261108_0008_business_locations.py` (`e22a_locations`, descendant of `e213c4_acceptance`) The company continues to start **no locations**. **No HTTP Location Routes yet**, no inventory/purchase/connected sale, no location permits; these changes belong to E2-2 B/C and subsequent blocks. The IC of the cut code was verified in `300fa6f` (GitHub Actions run 42491816481): result `success`. Local Windows validation of the new cut is still required; the previous 195 tests corresponded to E2-1.

**From `plataforma-pyme/backend/` after `git pull`:**

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check
$env:RUN_DB_INTEGRATION = "1"
try {
  .\.venv\Scripts\python.exe -m pytest -q
} finally {
  Remove-Item Env:\RUN_DB_INTEGRATION -ErrorAction SilentlyContinue
}
```

The expected head now is **`e22b_location_casa (head)`** (the previous head was `e22a_locations`). Migration only adds the table `locations`; does not create default records or delete previous data. Integrity tests use external transactions and SAVEPOINT. **Do not run against a productive base; do not execute `downgrade`, `stamp` ni `docker compose down -v`.** The Alembic version control test was adjusted to the new head, without modifying E2-1 rules. The next step will implement API/DTO/services/authorization; do not attribute CRUD to this increase.


### E2-2 A.1 — CASA and new head (08/11/2026)

`CASA` is added to the rates accepted; `can_sell`/`can_store` still independent. Additive migration `e22b_location_casa` after `e22a_locations`, no changes to previous data, and protected reversal when CASA locations exist. **CI backend** (run): **217 tests approved, Python 3.12.3.14, Alembic `e22b_location_casa (head)` sin deriva, Docker 3/3**. **CI frontend** (run): **2/2 successful jobs including build/lint and E2E**. Previous Windows result of E2-2 A: 212 tests; **Additional migration CASA and 217 tests must still be replicated locally**. No location endpoints up to E2-2 B/C and no React–API connection.

**Secure command from `plataforma-pyme/backend/`:** first `python -m alembic upgrade head`, later `python -m alembic current`, `python -m alembic check`, y `RUN_DB_INTEGRATION=1` con `pytest -q` in a known local DB. Do not run downgrade on real data.

## E2-2 B — Creation and reading of locations by API (partial cut)

**State E2-2 B (08/11/2026):** Three real routes were published for low locations `/api/v1/businesses/{business_id}/locations` (`POST` 201, `GET` ready 200, `GET /{location_id}` 200). The creation valid DTO without protected fields, revalidates identity/session, blocks the company and membership of the actor, demands tenant `ACTIVA` y rol `TITULAR_ADMINISTRATIVO` o `ADMINISTRADOR`, and confirms a single transaction. A first location receives `is_primary=true`; the subsequent ones do not replace it. Active members of any recognized role can consult their own locations, even with suspended company; a suspended company does not allow to create. A third party or inactive membership returns 404; role without permission 403; invalid session 401; company suspended when creating 409; incorrect body 422. `CASA` and Google Maps HTTPS validated are included. **There is no PATCH/DELETE, no pause/reactivation, change of principal, individual staff assignment or commercial consumption of locations yet.** DEMO remains independent. Backend without new migration from `e22b_location_casa`.

**Evidence of IC:** commit funcional `bdd2c84653dafb976c8cd6b49d8c2d577cc345de`; GitHub Actions E2-2 B **3/3** (Python 3.12 y 3.14 con PostgreSQL, Docker), **277 approved tests**, `e22b_location_casa (head)` and Alembic without drift. The local Windows output provided previously for **E2-2 A.1** fue **217 passed in 23.90s**. Posteriormente E2-2 B **was validated in Windows with `277 passed in 31.22s`**, Alembic without drift and healthy Docker; E2-2 C adds new tests to be verified locally. The peer review of E2-1 remains anchored in the commit delivered.

**Suggested local verification after `git pull` from `plataforma-pyme/backend/`:** ejecutar `.\\.venv\\Scripts\\python.exe -m alembic current`, `... -m alembic check` and Pytest with `RUN_DB_INTEGRATION=1` in the development base already migrated. Head expected `e22b_location_casa (head)`; there are no E2-2 B migrations. **Do not run version rollback, downgrade or volume deletion.** The Docker container must be rebuilt to use new routes. Exhibit /docs only in development environment.

## E2-2 C — Location management (no new migration)

**E2-2 C (08/11/2026) — actual location operations:** `PATCH /api/v1/businesses/{business_id}/locations/{location_id}` allows editing only `name`, `kind`, `address`, `map_url`, `can_sell` y `can_store` (optional fields in the body, but rejected `null`, empty bodies, invalid values and protected fields). `PATCH /{location_id}/status` receive only `ACTIVA` o `PAUSADA`: pause revoke `is_primary` in the same transaction and reactivate **no** recovers location ownership automatically. `PUT /{location_id}/primary` designates a location `ACTIVA`, unmarks the previous one and marks the one chosen within the **and a single transaction**, serialized by company lock and protected with the SQL index `uq_locations_one_active_primary`. The operation on an already main location does not make any additional changes. Owner/Manager with Active Membership can manage; maintainer/worker only consult. `SUSPENDIDA` read but no change; other/non-existent resource 404, role without permission 403, invalid session 401, incompatible status 409 and invalid body 422. DELETE was not enabled nor new tables were created.

**Evidence:** functional code `7abafd8208965cd99b0116e02ffc5240d23f218f`, GitHub Actions E2-2 C **3/3 successful**, 325/225 Python 3.12 and 3.14 tests with PostgreSQL, Alembic `e22b_location_casa (head)` no drift and correct Docker. Windows had previously validated E2-2 B (`277 passed in 31.22s`, `/ready` = `ready`/`ok`). **The 325 tests must still be played on Windows to close locally E2-2 C.** React/API integration, individual assignment of members to locations, inventory control when removing `can_store`, receptions/sales and operating fund management are future works; they are not attributed to this increase. E2-1 and UML 03B/03C were not modified.

**Windows Validation:** from `plataforma-pyme/backend/`, ejecutar `alembic current`, `alembic check`, y `RUN_DB_INTEGRATION=1 pytest -q` with the same interpreter `.venv` Rebuild with Docker Compose and consult `/ready`Head expected `e22b_location_casa (head)`, total expected **325 tests**, pending confirmation by the developer. Do not touch the review branch of E2-1, nor run downgrades or delete volumes.

## E2-2 D — Operational allocations by headquarters

**E2-2 D AS-IMPLEMENTED:** `LocationAssignment` con clave `(business_id,location_id,user_id)` and FK composed towards `Location` y `Membership` of the same tenant. Additive migration `e22d_assignments`, single location index `(business_id,id)`. Administrative States `ACTIVA`/`REVOCADA`; date `revoked_at`No physical deletion. `GET /api/v1/businesses/{business_id}/locations/{location_id}/assignments` list of assignments from a headquarters (holder/manager); `PUT /api/v1/businesses/{business_id}/locations/{location_id}/assignments/{membership_id}` receive JSON `{"status":"ACTIVA"}` o `{"status":"REVOCADA"}` and actively/revolves. Only one member is activated ENTRY/TRAWER active towards the active location; revoke allows for paused headquarters or inactive member. Company SUSPENDED read only. Pure policy `can_operate_at_location` obliging tenant, membership, headquarters and capacity `SELL/STORE` in force, besides the active assignment to managers/workers. **The policy is not yet consumed in purchases, inventory or sales**, outside this cut. No new E2-1 functions or frontend connection.

**IC checked for functional code `3cd7bce71d951218e8c77da58d147e78fb0d426e`:** run 42497556047, **371/371 tests Python 3.12 and 3.14, 3/3 jobs approved**, Alembic `e22d_assignments (head)` sin deriva y Docker saludable. **Local Windows E2-2 D is pending:** the last execution contributed corresponds to E2-2 C, 325 passed. Do not attribute to the last commit documentary own execution of tests.

**Local Check with PostgreSQL Development (PowerShell from `backend/`):**

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check
$env:RUN_DB_INTEGRATION = "1"
try { .\.venv\Scripts\python.exe -m pytest -q }
finally { Remove-Item Env:\RUN_DB_INTEGRATION -ErrorAction SilentlyContinue }
```

Waited: `e22d_assignments (head)` y **371 passed**. Migration adds table and single index, without touching previous data. Do not use `stamp`, `downgrade`, `down -v` or destructive commands. Rebuild containers and verify `/ready` After syncing.

## E2-3 A — Catalog: ORM and migration, no HTTP API yet

**Cut E2-3 A (08/11/2026), partial persistence of RF-04/CU-05:** clase SQLAlchemy `CatalogItem` y tabla `catalog_items` con `business_id` Compulsory, FK to Company (`RESTRICT`) y par UNIQUE `(business_id,id)` for future commercial FK of the same tenant. Four kinds of tab according to DEMO: `ELABORADO`, `REVENTA`, `INSUMO` (physical property) and `SERVICIO` (conceptually a service). `SERVICIO`; physical property prohibits it. `UNIDAD`, `GRAMO`, `KILOGRAMO`, `MILILITRO`, `LITRO`, `PAQUETE`, `CAJA`. Name, standardized key is stored `name_key`, category, optional SKU, description, internal observations, status `ACTIVO`/`INACTIVO`, condition `sellable`, `price_cents` y `reference_cost_cents` optional. Whole amounts BIGINT between 0 and 99,999,999.999 cents, without Float. Two independent restrictions prevent repeat `name_key` and SKU not null **within the company**, also in inactive chips; different tenants can reuse them. In E2-3 B the service must calculate `name_key` canonically (NFKC, collapsed spaces, capital equivalence) and normalize SKU to uppercase **before inserting/editing**: SQL imposes the uniqueness of saved keys and SKU format, but does not derive `name_key` Create tab does not create location, stock, purchases, sales or movements.

**Evidence:** code/test cut `79c2071f4e5192be95d75c78d5b1e9a75492a645`; GitHub Actions E2-3 A **3/3**, **407 approved tests** en Python 3.12 y Python 3.14 con PostgreSQL 16, Docker liveness aprobado y `e23a_catalog (head)` no pending changes from Alembic. **Local Windows Validation Pending for E2-3 A**; the above 371 tests correspond to the closure of E2-2. **No HTTP Catalog paths** in this cut; CRUD, catalog RBAC, SKU/name standardization of entry and protection of business stories will be implemented in E2-3 B/C/D. No React API integration or independent review of E2-3 yet. No change to E2-1 or E2-2 or DEMO frontend.

**Secure local validation** from `plataforma-pyme/backend/` with PostgreSQL 16 development (non-production):

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check
$env:RUN_DB_INTEGRATION = "1"
try {
  .\.venv\Scripts\python.exe -m pytest -q
} finally {
  Remove-Item Env:\RUN_DB_INTEGRATION -ErrorAction SilentlyContinue
}
```

Expected **`e23a_catalog (head)`** y **407 passed**. It is a new table without data or stock. Avoid `downgrade`, `stamp` and elimination of volumes.

## E2-3 B — Initial Catalog API

**E2-3 B — Real Catalogue API (RF-04/CU-05, 08/11/2026):** four low routes `/api/v1/businesses/{business_id}/catalog`: `POST /catalog` (201 high), `GET /catalog` (200 list with `offset>=0`, `1<=limit<=500`; default `limit=100`), `GET /catalog/{item_id}` (200 detalle) y `PATCH /catalog/{item_id}` (200 part edition). Each operation requires valid Bearer, session revalidation, user and membership of the requested company. Owner/manager can read and write; maintainer/worker with active membership only read; company SUSPENDED read only; enterprise or article other/non-existent 404. The server normalizes Unicode NFKC names, collapses spaces and generates `name_key` con `casefold`; normalizes SKU to ASCII capital letters and converts empty SKU into NULL. PostgreSQL retains the uniqueness per company of `name_key`/SKU even with INACTIVE tabs, and the API translates that collision to 409. Invalid data or protected fields (id, tenant, status, derivative key) receive 422. SERVICE type requires SERVICE unit; no other classification can use it. They are valid `price_cents` y `reference_cost_cents` NULL or integers from 0 to 99.999.999.999. The PATCH allows you to remove SKU/price/cost with NULL, but do not edit status. `status` and timestamps SQL. Creation does not create location, stock balance, purchases, sales or movements.

**Explicit limits:** E2-3 B not yet exposed `PATCH /status` No integration of frontend React with this API; no reception, sales, commercial snapshots or history unit editing protection are implemented as these modules are later. New tests check permissions, duplicate rollbacks, SKU/standard names, multi-company isolation, suspended reading and fault 401/403/404/409/422. **Evidence CI E2-3 B:** GitHub Actions 42506409757 finished **3/3 successful jobs**, **498 approved tests** both in Python 3.12 (53.96s) and Python 3.14 (50.12s), PostgreSQL 16, `e23a_catalog (head)` y `alembic check` No operations, Docker/liveness image approved. Validated functional code: `35ff901855397c024cee50fa590c6c05a7f04cfe`. Previous IQ `42506050141` had detected two HTTP mapping failures in PATCH with incompatible type/unit; they were corrected and both cases are now happening. **Local Windows validation of E2-3 B is still pending**; the last confirmed local result is 407/407 of E2-3 A.

**Validation:** from `plataforma-pyme/backend/`, Alembic is still in `e23a_catalog (head)`; run Pytest with `RUN_DB_INTEGRATION=1` Swagger will have all four routes of `/api/v1/businesses/{business_id}/catalog`. Rebuild Docker before testing locally. E2-3 C will incorporate a path of its own to enable/disable, not a mutable field in the current PATCH.

## E2-3 C — ASSETS/INACTIVE

**E2-3 C (08/11/2026):** implemented `PATCH /api/v1/businesses/{business_id}/catalog/{item_id}/status` with exclusive body `{"status":"ACTIVO"}` o `{"status":"INACTIVO"}`, strict validation and rejection of extra attributes (422). The path revalidates session and membership and requires an ACTIVA company owner/manager to write (401/403/404/409 as the case may be).The article is blocked inside the tenant and changed status in a single transaction.The repeated change is idepotent, without altering `updated_at`. The inactive article remains visible on GET/listed, with UUID, name and SKU reserved even for duplicate highs; there is no DELETE or fictitious stock. Generic PATCH maintains `status` This functionality also does not modify the independent field `sellable`.

**Units:** future purchases/sales must prohibit new movements with INACTIVE chips and keep real historical snapshots. There are still no commercial operations or integrated frontend; therefore, there is no real restriction on unit change for previous transactions either. No new migration: CHECK reused `ACTIVO/INACTIVO` de `e23a_catalog`.

**Tests:** CI E2-3 C **3/3 work adopted**, **527 passed** in Python 3.12 and 3.14 with PostgreSQL, `e23a_catalog (head)`, `alembic check` no operations and correct Docker; code `c2153ab9b65b265eb46b3081079e0f3f15002215`. E2-3 B: **498 passed en Windows (55.79s)**, Docker/API/DB saludables. **E2-3 C: Windows pending**. The subsequent documentary committ is not equivalent to another IC execution.

**Check on Windows:** `alembic current`, `alembic check`, `RUN_DB_INTEGRATION=1` with Pytest (**527 passed** expected), reconstruct Docker and consult `/ready`. Do not execute destructive migrations.

## E2-3 D — Integrity and regression of the catalogue

**E2-3 D (08/11/2026):** the existing Catalogue was strengthened, **without adding tables or migrations**. New tests verify Unicode NFKC+ equivalences `casefold` in names, SKU NFKC and ASCII capitals, rejection of invalid controls and forms, overflowing `name_key` per Unicode expansion, strict integer amounts (no booleans or decimals), differentiation between `PATCH` field and with `null` Explicit, incompatibility SERVICE/physical unit, protected fields of `/status`, name/SKU collisions even in INACTIVE chips, independence between two companies of the same user, session recovery after 409, and rollback provoked after `flush` both in high and in edition. A ceiling was added to `offset` catalogue (`9_223_372_036_854_775_807`, BIGINT PostgreSQL): exceed it produces 422 before running SQL, maintaining `limit` de 1 a 500 y `offset` The five Catalog endpoints retain their contracts and business permits; no stock is created.

**Scope and limits:** NICK `(business_id,name_key)` y `(business_id,sku)` and existing transactions/blocks protect against collisions; tests exercise actual duplicates and recoveries in PostgreSQL, **but are not simultaneous load/concurrence testing with multiple independent connections**. The latter is registered as future verification before production. There are not yet purchases, sales, movements or snapshots, so you cannot check a unit/state change rule with real business history. `sellable` does not replace `status`. Do not connect frontend DEMO or E2-1/E2-2 for this cut.

**IC evidence of code D:** commit `bf4fd3fa809c9f4e6afdeb064a155acf233b1722`, GitHub Actions run 42508771222: **3/3 work adopted**, **580 passed** en Python 3.12 y Python 3.14 con PostgreSQL, Docker build/liveness aprobado, `e23a_catalog (head)` y `alembic check` No difference. **Local Validation Windows E2-3 C:** 527 passed in 59.60s, healthy containers and `/ready` Right. **Local Validation Windows E2-3 D:** Do not confuse remote IC with tests performed on the author's computer.

**For Windows, from `plataforma-pyme/backend/`:** `alembic current`, `alembic check` and Pytest with `RUN_DB_INTEGRATION=1` (**580 passed expected**). After rebuilding Docker, check `docker compose ps` y `/ready`There are no new migrations and there is no need to modify E2-1/E2-2.

## E2-3 E — Catalogue closure

**E2-3 E closed functionally and documentaryly (08/11/2026):** catalogue `CatalogItem` with migration `e23a_catalog`, five actual REST routes, tenant/RBAC verification and active/INACTIVE status. **580 passed en Windows (66.45s)**, Alembic sin deriva, API y DB Docker healthy, `/ready` ready/ok. CI D 3/3 and 580 Python tests 3.12/3.14 sachet `bf4fd3fa809c9f4e6afdeb064a155acf233b1722`. UML 03A v0.7 (PUML, guide and editorial SVG) updated; To-BE Supplier, 03B/03C preserved. There are no purchases, inventory, sales or React/API integration yet. **Earrings: formal delivery to the reviewer, no PR merchandise**. The A/B/C/D states below correspond to historical cuts.

**Validation D already reported from Windows:** `580 passed in 66.45s`, Alembic `e23a_catalog (head)` no operations and `/ready` `ready/ok`. A single documentary commit does not require the repeat of the set of tests; independent audit shall distinguish specific evidence from evidence provided.

## E2-4 — Validation and consolidated delivery reference (cut 08/11/2026)

- **API:** five vendor operations, three purchase operations, reception `POST /purchases/{purchase_id}/receive`, consultation of receipt and consultations of `inventory/balances` / `inventory/movements`.
- **Additive migrations:** `e24a_suppliers` → `e24c_purchases` → `e24d_purchase_hash` → `e24e_receipt_stock`.
- **Tests:** commit `4f88416141c09a82e744990b1aee8c00b9f31dfd`; `20 passed` affected file and `797 passed` Total suite in Windows over populated DB; CI run 42530739959, three successful jobs.
- **QA manual:** free concept purchase 12505 cents; physical purchase of 10 units per 100,000 cents; active real deposit; reception 201, replay 200, second attempt with different key 409, balance 10000 thousandths/version 1 and a single input movement. [Detalle exacto, sin claves ni tokens](../docs/revisiones/E2-4_CIERRE/02_BITACORA_PRUEBAS_SWAGGER.md).
- **Unimplemented earrings:** API cancellation, partial 1:N, returns, settings, transfers, sales, multicurrency, DB permissions for immutability, complete DB separation of tests, frontend React integrated, production. [Traceability](../docs/revisiones/E2-4_CIERRE/05_TRAZABILIDAD_Y_PENDIENTES.md).

**How to revalidate:** continue [safe guide E2-4](../docs/revisiones/E2-4_CIERRE/07_GUIA_REPRODUCCION_SEGURA.md). **Do not delete volumes** to run tests or reuse historical identifiers as new keys.

## E2-5 A — Prepare traceability of transfers and adjustments

This delivery sum `inventory_operations` (type, article, unit, quantity, origin/destiny, motive, actor and idempotency per company), and expands `stock_movements` to represent `TRASLADO_{SALIDA,ENTRADA}`, `AJUSTE_{SALIDA,ENTRADA}` y `STOCK_INICIAL` with signed deltas, without breaking `COMPRA_RECEPCION`Alone. **SQL model, migration and integrity testing**; does not display new commands or modify user balances. The E2-4 motion endpoint is still specialized in receptions; it will be extended when publishing manual operations on E2-5 B/C.

Migration: `e25a_inventory_ops` (after `e24e_receipt_stock`). Route and controls: [E2-5 A](../docs/E2-5_A_MODELO_OPERACIONES_INVENTARIO.md).

From `plataforma-pyme/backend`:

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check
$env:RUN_DB_INTEGRATION = "1"
try { .\.venv\Scripts\python.exe -m pytest -q }
finally { Remove-Item Env:\RUN_DB_INTEGRATION -ErrorAction SilentlyContinue }
```

**Do not use downgrade, stamp or volume removal to validate**: the manual purchase/reception QA of E2-4 must be kept.
