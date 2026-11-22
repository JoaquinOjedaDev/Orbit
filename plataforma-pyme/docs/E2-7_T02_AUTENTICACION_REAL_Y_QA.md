# E2-7 T02 — REAL Authentication, opaque session and separation of DEMO

**Status:** implementation in the branch; pending local operator validation and IC.  
**Rama:** `feature/e2-7-t02-autenticacion-real`.  
**Base:** `main` `136bed6b847bdb3c9aac7ca4132c95b83b8e71cb` (T01 merged).  
**Scope:** only frontend and docs en `plataforma-pyme/`; no backend, Docker, migration or business changes.

## 1. Scope

- Acceso REAL por `/real/login`, `/real/registro` y `/real/perfil`.
- `POST /api/v1/auth/register` creates persistent user and **no login**.
- `POST /api/v1/auth/login` Get a **Opaque Bearer**, no JWT. El token solo se conserva en memoria React.
- `GET /api/v1/auth/me` validates the token before displaying the profile, and allows updating the identity from server.
- `POST /api/v1/auth/logout` disables remote session if FastAPI is accessible; IU hides profile immediately. **does not claim remote revocation**.
- Token y password no se guardan en `localStorage`, `sessionStorage`, URL ni `demoStore`. F5 recharge implies re-attendation, decision T00/P05.
- The React REAL tree does not mount DEMO pages. A separate link allows you to access the prototype `/inicio`; the use of that link is **an explicit change in mode**Not a failback to a 401 or network crash.
- REAL Data does not yet include companies, locations, catalog, purchases or sales. These modules remain DEMO until T03 and later.

## 2. Archives

```text
frontend/src/App.tsx                     frontera /real/* y enlace desde DEMO
frontend/src/features/auth/authGateway.ts  DTOs, requests y errores seguros
frontend/src/features/auth/RealAuthApp.tsx formularios, perfil, navegación y sesión
frontend/src/features/auth/auth.css        interfaz responsive
frontend/tests/auth-api.test.mjs           tests de contrato HTTP con fetch simulado
frontend/package.json                     npm run test:auth
docs/E2-7_T02_AUTENTICACION_REAL_Y_QA.md   este documento
```

## 3. Ejecutar localmente — Windows PowerShell

Use the T02 branch, without changing folder outside the repo except as indicated. As in PowerShell `npm.ps1` is blocked, use **`npm.cmd`**.

From `plataforma-pyme/frontend`:

```powershell
git status --short --branch
npm.cmd ci
if ($LASTEXITCODE -ne 0) { throw "npm ci falló" }
npm.cmd run test:api
if ($LASTEXITCODE -ne 0) { throw "test:api falló" }
npm.cmd run test:auth
if ($LASTEXITCODE -ne 0) { throw "test:auth falló" }
npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw "build falló" }
npm.cmd run lint
if ($LASTEXITCODE -ne 0) { throw "lint falló" }
```

If Docker backend continues to run and accessible in port **18000**, at another terminal:

```powershell
$env:PYME_API_PROXY_TARGET = "http://127.0.0.1:18000"
npm.cmd run dev
```

Vite will open in `http://localhost:5173`. Probar `http://localhost:5173/health` y `http://localhost:5173/ready`If satisfactory, visit:

- `http://localhost:5173/real/registro` — crear **a new test user**, with a test email you can control and a password of at least 15 characters. Do not share credentials or tokens in captures/logs/chat.
- `http://localhost:5173/real/login` — authenticate. `/real/perfil` with the name/mail obtained from the API.
- Button **Update from API** — GET /auth/me debe completar sin error.
- Button **Sign out** — back to login. Visit manually `/real/perfil` no session must not show protected identity.
- Reauthenticate and press **F5**: you must require login again, without redirecting to DEMO data. That's **known behaviour of the MVP**Not a bug to correct in T02.
- Entering an erroneous password: you must give credentials error, without revealing internal information.
- Open `http://localhost:5173/inicio` and navigate to Catalog/Inventory/DEMO Sales to verify that the prototype did not suffer regression.

**Precautions:** Real user registration creates a registry in the configured Docker DB; do not use real person emails/passwords or the database if you require completely ephemeral data. For reproducible and isolated tests in IC, set up temporary standalone PostgreSQL base; creating an ephemeral DB must actually be directed from the API (it is not enough to change `DB_NAME` en PowerShell mientras Docker usa otro valor).

## 4. Minimum acceptance matrix

| ID | Test | Expected |
|---|---|---|
| T02-01 | New registration | 201, real user; standalone login |
| T02-02 | Right login | token opaque + `GET /me`; correct profile |
| T02-03 | Wrong login | 401, error safe and no session |
| T02-04 | Reload F5 with memory session | Request re-authentication; does not reveal identity |
| T02-05 | Logout | Clean IU; HTTP 204 if accessible API |
| T02-06 | Open `/real/perfil` sin token | No private information appears |
| T02-07 | Error 401 while updating profile | Active session cleaning |
| T02-08 | → DEMO | Explicit change; no data mix |
| T02-09 | Tests + build + lint | All without mistakes |
| T02-10 | Mobile view | Readable forms, correct navigation |

## 5. Known limits

1. There is no refresh token or cookie; when reloading F5 you have to log back in. This is T00/D05 and P05.
2. T02 does not connect real companies; this integration corresponds to T03.
3. The login UI does not allow editing of profile (there is no general PATCH profile in the E2-1 contract).
4. User registration is a real database operation; for public demos, there must be added rates limits/anti-abuse measures before deploying the internet service.
5. Tests `node --test` verify transport and DTOs, **no** replace browser + FastAPI + PostgreSQL. Do not declare full acceptance until the tests of this document.
6. The production frontend requires setting up API publishing from the same source, reverse proxy or restricted CORS; the current proxy is only for Vite development.

## 6. Closing rule

Register branch SHA, results of `test:api`, `test:auth`, `build`, `lint`, real browser tests + FastAPI and GitHub Actions. Do not merge until credentials errors, logout and F5 have been verified, as well as check non-regression of the DEMO prototype.
