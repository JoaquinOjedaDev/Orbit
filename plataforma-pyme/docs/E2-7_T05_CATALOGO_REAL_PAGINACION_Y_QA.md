# E2-7 T05 — REAL Catalog, units, cents and pagination

**Status:** branch implementation, pending integrated browser + PostgreSQL testing; NOT merged.  
**Rama:** `feature/e2-7-t05-catalogo-real`.  
**Base:** `main` `e051a8da4c964ddc25fd17783ffd53b57d73d654` (T04 validated and merged).

## 1. Scope and backend contracts

Only files from `plataforma-pyme/frontend`, the frontend workflow and this document. They don't change FastAPI, migrations, `demoStore`shopping, sales, inventory.

| Action | Endpoint REAL bajo `/api/v1` | Contract |
|---|---|---|
| Paged list | `GET /businesses/{business_id}/catalog?offset=0&limit=100` | `list[CatalogItemView]`, order by standard name and ID |
| Next Page | `GET .../catalog?offset=100&limit=100` | `offset >= 0`, `1 <= limit <= 500` |
| Details | `GET .../catalog/{item_id}` | Same tenant file |
| Crear ficha | `POST .../catalog` | No idempotency key; 201, high stockless |
| Edit Tab | `PATCH .../catalog/{item_id}` | Editable fields, subject to purchase history/stock |
| Enable/disable | `PATCH .../catalog/{item_id}/status` | `{ "status": "ACTIVO" | "INACTIVO" }` |

Types: `ELABORADO`, `REVENTA`, `INSUMO`, `SERVICIO`Units: `UNIDAD`, `GRAMO`, `KILOGRAMO`, `MILILITRO`, `LITRO`, `PAQUETE`, `CAJA`, `SERVICIO`. Unity `SERVICIO` is used exclusively for the type `SERVICIO`, y viceversa.

`price_cents` y `reference_cost_cents` admit non-negative whole cents or `null` (without reporting). Never convert to integers by direct multiplication of a entered decimal floating-point.

All GETs require a REAL session and active membership of the company; creation, editing and status are only enabled to `TITULAR_ADMINISTRATIVO` o `ADMINISTRADOR` in-company `ACTIVA`. FastAPI reauthorizes each action. For example a `TRABAJADOR` you can consult, but do not edit.

## 2. New routes and components

- `/real/empresas/{uuid}/catalogo`: REAL catalogue, separated from DEMO catalogue.
- `frontend/src/features/catalog/realCatalogGateway.ts`: DTO, validations, cent conversion, transport authorized by tenant and HTTP handling.
- `frontend/src/features/catalog/RealCatalogPage.tsx`: create, edit, disable/reactivate, filter between loaded pages, load 100 more.
- `frontend/tests/catalog-real-api.test.mjs`: contract tests, money, cross access and errors.
- `frontend/package.json`: `npm run test:catalog-real`.
- `.github/workflows/plataforma-pyme-frontend.yml`: adds `npm run test:catalog-real` IQ with the previous tests.
- `frontend/src/features/businesses/RealBusinessesPage.tsx` y `frontend/src/features/auth/RealAuthApp.tsx`: REAL navigation.
- `frontend/src/features/auth/auth.css`: cards and forms answer, without touching DEMO.

## 3. Pagination: not to affirm complete catalogue prematurely

The backend returns up to 100 per default request and **no provee `total`**That's why the first consultation is done. `offset=0&limit=100`. If you return exactly 100, the view indicates that potentially more exist and enables **Load the next 100**.

Clicking is consulted `offset=100&limit=100`, then 200, 300 etc. Only the last page is presented as accessed when it returns less than 100. If it returns 100 exacts an additional empty call may be required to confirm that there is no more.

The search by name or SKU and the status filter are **Locales entre páginas precios** and carry that explicit scope on the interface. They do not represent global searches in the database. If you change the data from the catalog during paging and repeated IDs are detected, the load is stopped and you request to update from the first page. The real backend order (standard name, ID) is used.

To consult the full catalogue, the user must continue to press the following pages until the sequence is completed. Future integration with a server searcher requires a new API or contractual extension.

## 4. Safety of mutations and boundaries

The creation of chips does not have idempotency-key or endpoint to recover a request per request-id. Before timeout, network failure, 5xx or malformed response, the result could be uncertain. UI displays a warning and blocks new scriptures up to **Revisit Catalogue**; do not automatically retry. T06 will treat durable/reconciliation commands and their limits according to actual backend support.

No invented stocks or purchase/sales figures are shown. `reference_cost_cents` is a data item, no historical cost or valued stock. The REAL inventory module will be integrated later.

## 5. PowerShell Validation Commands (from `plataforma-pyme/frontend`)

```powershell
git pull --ff-only origin feature/e2-7-t05-catalogo-real

npm.cmd run test:api
if ($LASTEXITCODE -ne 0) { throw 'Falló test:api' }
npm.cmd run test:auth
if ($LASTEXITCODE -ne 0) { throw 'Falló test:auth' }
npm.cmd run test:businesses
if ($LASTEXITCODE -ne 0) { throw 'Falló test:businesses' }
npm.cmd run test:operations-real
if ($LASTEXITCODE -ne 0) { throw 'Falló test:operations-real' }
npm.cmd run test:catalog-real
if ($LASTEXITCODE -ne 0) { throw 'Falló test:catalog-real' }
npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw 'Falló build' }
npm.cmd run lint
if ($LASTEXITCODE -ne 0) { throw 'Falló lint' }
```

If Docker is still active:

```powershell
docker compose --profile api up -d --wait
$env:PYME_API_PROXY_TARGET = 'http://127.0.0.1:18000'
npm.cmd run dev
```

Open `http://localhost:5173/real/login` and use test accounts. For a REAL panel, from `Mis empresas` open TEST Company A or B and press `Catálogo REAL`.

## 6. Functional QA

| Case | Operation | Expected |
|---|---|---|
| T05-01 | TEST Holder Company A opens REAL Catalog | Empty list initially, no DEMO products |
| T05-02 | Create `Producto A TEST` SKU type/UNITY, single SKU, price `1250,55` | Appears, with full price of 125055 cents on base |
| T05-03 | Create `Servicio A TEST` SERVICE/SERVICE | Correct tab, no fictitious stock |
| T05-04 | Try SERVICE with UNITY (or vice versa) | Form prevents combination; backend would also reject it |
| T05-05 | Edit Product A item, SKU or description | Persistence after updating, no change of tenant |
| T05-06 | Disable/reactivate Product A | Persistent state. Name/SKU is still reserved |
| T05-07 | Create article with duplicate name/SKU | HTTP 409, clear message; do not duplicate article |
| T05-08 | Open TEST Catalogue Company B | No Company A tokens shown |
| T05-09 | User WORKER of A Opens Catalogue A | Reading permitted, no creation/editing/state buttons |
| T05-10 | User A WORKER tries URL of the B catalog | 404/Not available, not showing B-cards |
| T05-11 | Catalogue with 101+ tokens (prefer automated testing and time base) | First 100+ button `Cargar los siguientes 100`without inventing wholeness |
| T05-12 | Name/SKU searched on page not yet loaded | Express message: local filter, no global search |
| T05-13 | Networking during POST in isolated environment | No automatic retry; consult before rewriting |
| T05-14 | DEMO `/inicio` | No changes in catalogue, images, prices or local stock |

Do not create 101 tabs manually just to validate pagination. For a massive real test use a temporary database, synthetic data and backend explicitly configured towards that DB. Pagination flow is also verified with deterministic gateway tests.

## 7. Closing criteria

Do not merge PR until CI is verified (including Chromium), `test:catalog-real`, local build/lint and real testing of A/B catalog, roles, creation, editing and states against PostgreSQL. Keep the warning Vite from chunk greater than 500 kB visible and do not disable Lint rules.
