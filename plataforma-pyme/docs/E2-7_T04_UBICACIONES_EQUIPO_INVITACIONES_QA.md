# E2-7 T04 — Locations, equipment, invitations and assignments REAL

**Status:** branch implementation for validation; NOT merged.  
**Base:** `main` `884fa56abac490d0ffde961426d0537357bff045` (T03 integrated).  
**Rama:** `feature/e2-7-t04-ubicaciones-equipo-invitaciones`.  
**Limit of change:** `plataforma-pyme/frontend`, this document and workflow of frontend. No modification backend, migrations, DEMO data or payments.

## 1. What is integrated

| Display | Endpoints REST reales | Protection |
|---|---|---|
| Company → Locations | `GET/POST /businesses/{id}/locations`, `PATCH /{location_id}`, `PATCH /{location_id}/status`, `PUT /{location_id}/primary` | Reading of active members; deed only holder/admin of company ACTIVA |
| Location → Allocations | `GET /businesses/{id}/locations/{location_id}/assignments`; `PUT /{membership_id}` | Holder only/admin. The member must be ENTRY/ACTRACTOR active, of the same tenant and the active headquarters |
| Company → Equipment | `GET /businesses/{id}/memberships`, `PATCH /{membership_id}` | View team: holder/admin. Change role/state: exclusive holder, without modifying its own protected membership |
| Team → Issue invitation | `POST /businesses/{id}/invitations` | Active business owner/admin; only proposed roles ENTRY OR WORKER |
| My REAL profile → Accept invitation | `POST /invitations/accept` | REAL Account authenticated recipient; exactly 43 characters opaque invitation token |

All the previous routes live low `/api/v1` y requieren Bearer **opaque** JWT. The petition bodies use the real fields in FastAPI DTOs, without mixing names/IDs of `demoStore`.

## 2. Navigation and actions

From `/real/login` enter `/real/perfil`. From My companies you select a company A or B and have:
- `/real/empresas/{business_id}/ubicaciones`: create and consult locations, edit name/type/address/link Google Maps/capacitys, pause/reactivate, choose head office, consult and manage assignments of managers/workers;
- `/real/empresas/{business_id}/equipo`: consult members and their roles, holder changes role or status of third parties; titular/admin issues invitation;
- `/real/invitaciones/aceptar`: the recipient with his own session pastes the code and accepts membership; then the real company appears in his account.

**DEMO is not used as backup when FastAPI fails.** No actual purchases, inventory, sales, cashier, financial accounts or documents have been connected.

## 3. Security and behaviour of invitations

- The emission endpoint **does not automatically send emails**: the holder must deliver the code by secure channel. Do not send it to chat, captures, repositories or logs.
- The invitation code is received in the POST and displayed **only once** in the broadcast view. `GET` If it hides, navigates or recharges, it disappears from React.
- The code does not persist in `localStorage`/`sessionStorage`, neither placed in URL or query string. Paste into a password form.
- The recipient must have its own account with the target email and be authenticated.
- A POST can be confirmed in PostgreSQL and lose the answer. There are no automatic retryings. In uncertain results you are instructed to **consult first** the state of the company/team before trying another writing. Durable recovery of intentions remains T06.
- Each route is formed with validated UUID; the backend requires business ownership and permissions. A hidden button in React **does not replace** server permissions.
- The GETs and writing results are ignored if the component was removed by navigation/logout, and headquarters/equipment data is not reused between A and B companies.

## 4. T03 Warnings

The two cases identified in the local log of T03 were corrected, without adding exceptions or deleting rules of lint:
- `react(set-state-in-effect)`: the `setLoading(...)` synchronous of the reading effect of companies. Initial status depends on the type of route, and network responses update the state afterwards.
- `react-hooks(exhaustive-deps)`: `go` y `onBusinessAuthLost` Now they are stable callbacks; the effect declares `onUnauthorized` as a dependency.

The Vite JavaScript package warning over 500 kB is deliberately kept visible; it is a pending bulk optimization, the threshold is not changed.

## 5. Validation on Windows, from `plataforma-pyme/frontend`

```powershell
git pull --ff-only origin feature/e2-7-t04-ubicaciones-equipo-invitaciones

npm.cmd run test:api
if ($LASTEXITCODE -ne 0) { throw "Falló test:api" }
npm.cmd run test:auth
if ($LASTEXITCODE -ne 0) { throw "Falló test:auth" }
npm.cmd run test:businesses
if ($LASTEXITCODE -ne 0) { throw "Falló test:businesses" }
npm.cmd run test:operations-real
if ($LASTEXITCODE -ne 0) { throw "Falló test:operations-real" }
npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw "Falló build" }
npm.cmd run lint
if ($LASTEXITCODE -ne 0) { throw "Falló lint" }
```

To test from browser (use **test data**; these scripts modify the PostgreSQL Docker DB configured:

```powershell
docker compose --profile api up -d --wait
$env:PYME_API_PROXY_TARGET = "http://127.0.0.1:18000"
npm.cmd run dev
```

Open `http://localhost:5173/real/login`. El token de login se conserva solo en memoria y **F5 forces to log in again**According to T00.

## 6. QA guided with TEST Company A/TEST Company B

| Scenario | Action | Expected outcome |
|---|---|---|
| T04-01 | User owner enters A → Locations and creates `Sede A TEST` | Se ve en A; no en B |
| T04-02 | En B crear `Sede B TEST` | It only appears in B. |
| T04-03 | Edit A-Site (direction, type, capabilities) | Changes persist after rereading |
| T04-04 | Make main headquarters A; pause it; reactivate it | Single Main; pause removes and blocks unfit operations |
| T04-05 | Open Equipment in A | Real memberships appear, including headline |
| T04-06 | Issue invitation for a second trial user as WORKER | API returns code only once; no automatic email is sent |
| T04-07 | Logout; login as recipient user; Accept invitation (code received) | A appears on your list of companies, B no |
| T04-08 | Guest WORKER opens A → Locations and Equipment | You can read venues; you cannot edit or view private computer listings |
| T04-09 | Headline returns to A, assigns worker to Headquarters A | An Active Assignment is Saved for A Only and that Headquarters |
| T04-10 | Holder revokes allocation | Recorded Revoke; not altered B |
| T04-11 | Holder changes role or disables third member | Backend saves change; protected title cannot be edited from IU |
| T04-12 | Guest tries to open B URL | 404/no access; no B DEMO content or data |
| T04-13 | Navigate A→B quickly; then logout/F5 | No old B-A or previous session data appear |
| T04-14 | Use invalid code and accept one consumed again | Safe errors 422/409; no privilege elevation |
| T04-15 | Open DEMO `/inicio` | It remains independent without REAL user data |
| T04-16 | Mobile screens | Cards, selects, botones y paneles legibles y funcionales |

**To test invitations do not reuse an active mail in the company:** backend rejects duplicate pending members and invitations. Do not paste token into messages to attendees or captures.

## 7. Evidence and door of closure

GitHub Actions Frontend checks were extended to execute `test:api`, `test:auth`, `test:businesses` y `test:operations-real` In addition to previous compilation, lint and DEMO tests. The IC tests simulated contracts; it does not substitute role testing and tenant with two users and PostgreSQL.

**No fusionar T04** until the current branch exceeds IC and the team confirms the main flows of headquarters, equipment, invitation/acceptance, assignment and isolation A/B with evidence. Only after booting T05 (real catalogue and pagination).
