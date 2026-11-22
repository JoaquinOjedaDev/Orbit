# E2-7 T03 — REAL companies and tenant isolation

**Status:** PR implementation, pending tests integrated into the computer of the computer.  
**Rama:** `feature/e2-7-t03-empresas-reales`.  
**Base:** `main` `0ab1d2e82ea3c0f57aeadc50a9f05cdd4a696797`, T02 merged.  
**Scope:** only `plataforma-pyme/frontend` and documentation; does not modify the backend or migrate DEMO data.

## 1. Contracts checked in backend

| REAL Operation | HTTP | Requirement/behaviour |
|---|---|---|
| Listing your own businesses | `GET /api/v1/businesses` | Opaque Bearer; backend includes only active memberships |
| Create business and founding membership | `POST /api/v1/businesses` | Bearer + `Idempotency-Key` UUID4; devuelve 201 o 200 en replay |
| Consult a business | `GET /api/v1/businesses/{business_id}` | Bearer; requires active membership; other people's business returns 404 |
| Edit Business Profile | `PATCH /api/v1/businesses/{business_id}` | Name/rub/activity; backend applies role and status; 403/404/409 |

DTO real `BusinessView`: `id`, `name`, `category`, `activity_kind`, `status`, `founder_user_id`, `created_at` y `membership` (`id`, `user_id`, `role`, `status`, `job_title`) Do not invent fields of DEMO DTO. `category` is a 2-120-character free text.

## 2. New interface

- `/real/perfil`: button **My real companies**.
- `/real/empresas`: Listed from PostgreSQL, no fixes.
- `/real/empresas/nueva`: High REAL with name, heading, activity and key UUID idempotent.
- `/real/empresas/{uuid}`: REAL company initial panel, membership and status, with editing only for owner/manager and active company. The backend reauthorizes each deed.
- Navigation between REAL businesses: each selection changes the path and removes the previous panel; GET cancels/ignores if it arrived late, without reusing A data in B.
- `/inicio` y `/b/{id}/...` DEMO remains with independent profile and fixtures. REAL navigation → DEMO is explicit.
- **There's still no** actual sales metrics, stock or purchases in the new panel: do not display DEMO numbers in a REAL business.
- Opaque session only in memory, with re-login after F5.

## 3. Idempotence and limits up to T06

Backend demands `Idempotency-Key` UUID4 per creation. Form T03 generates a key by attempt and retains key+body **in the React session memory** to success or final result.

If a mutation ends in transport error, 409 or 5xx, uncertainty is displayed and no second key is generated automatically. `Mis empresas` and, if necessary, explicitly retry the same send (same key and data). Discarding the key requires human confirmation.

**Significant limitation:** after F5/Close tab pending intention still does not survive, because its persistent registration, limited by user/company and with retention policy, corresponds to **T06**. In the event of a fall or F5 during one creation, check the list before starting another. Do not declare guarantee of durable recovery nor absolute absence of duplication between recharges.

## 4. Local Validation (Windows)

The user is already located in `plataforma-pyme/frontend` y en la rama T03. Ejecutar:

```powershell
git pull --ff-only origin feature/e2-7-t03-empresas-reales

npm.cmd run test:api
if ($LASTEXITCODE -ne 0) { throw "Falló test:api" }
npm.cmd run test:auth
if ($LASTEXITCODE -ne 0) { throw "Falló test:auth" }
npm.cmd run test:businesses
if ($LASTEXITCODE -ne 0) { throw "Falló test:businesses" }
npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw "Falló build" }
npm.cmd run lint
if ($LASTEXITCODE -ne 0) { throw "Falló lint" }
```

Vite's chunk size warning may remain: do not raise the threshold to hide it; review lazy loading at a separate stage if necessary. React warnings are not muted.

With PostgreSQL/API Docker in good condition and Vite at the terminal:

```powershell
docker compose --profile api up -d --wait
$env:PYME_API_PROXY_TARGET = "http://127.0.0.1:18000"
npm.cmd run dev
```

Open `http://localhost:5173/real/login`, enter with the REAL test user registered in T02 and click **My real companies**.

**Creating businesses is a real writing** Use name tests unequivocally, do not modify productive enterprises.

## 5. Minimum functional QA, from browser

| Case | Action | Expected |
|---|---|---|
| T03-01 | User Login T02 → My companies | `GET /businesses`; empty if you do not have memberships |
| T03-02 | Create a TEST-A company | 201; visible company with administrative title |
| T03-03 | Create another TEST-B | A and B listed, different real IDs |
| T03-04 | Open A, then B and return A | Each panel displays only your business; it does not drag data when changing |
| T03-05 | Edit A name or heading | PATCH confirmed; list and tab reflect change |
| T03-06 | Logout and return to company URL | Requires re-authentication; never loads data from previous session |
| T03-07 | F5 in a business | Explicit relogin; no failback to DEMO |
| T03-08 | REAL Test User 2 | Can not get folder: %s: %s |
| T03-09 | Enter `/inicio` | DEMO intact, not mixed profile, business or articles |
| T03-10 | Mobile navigation or reduced width | Legible cards/forms; unwrapped |
| T03-11 | Cut connectivity during reading | Visible error; not filled with DEMO data or cross-access |
| T03-12 | Cut during Creation POST | Message of uncertain result and same key in retry as long as that meeting is still open |

**Reproducible QA with time base:** Docker backend connects to your own settings. Change `DB_NAME` Only in PowerShell does NOT change the base used by a Docker API already started. For isolated integration, explicitly configure API service and time base before running destructive tests.

## 6. Increase Files

```text
frontend/src/features/businesses/businessGateway.ts     DTOs + cliente REAL con controles de tenant
frontend/src/features/businesses/RealBusinessesPage.tsx  listado, selección, creación y edición
frontend/src/features/auth/RealAuthApp.tsx               navegación REAL integrada con sesión
frontend/src/features/auth/auth.css                      estilo responsive de empresas
frontend/tests/business-api.test.mjs                     tests HTTP y pertenencia
frontend/package.json                                   script test:businesses
docs/E2-7_T03_EMPRESAS_REALES_Y_QA.md                    este documento
```

## 7. Closure

No fusionar sin comprobar `test:api`, `test:auth`, `test:businesses`, build, lint and IC, in addition to the REAL user manual checks, two companies, editing and change of tenant. Policy on possible uncertain results and case A→B deserve special attention. T04 will include locations/equipment/invitations; not enable them through DEMO data.
