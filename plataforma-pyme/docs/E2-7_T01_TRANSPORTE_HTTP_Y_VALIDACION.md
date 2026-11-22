# E2-7 T01 — HTTP and Development Proxy Transport

**Status:** initial implementation in branch; QA final pending team and merge.  
**Rama:** `feature/e2-7-t01-cliente-http`.  
**Scope:** `plataforma-pyme/frontend/` and this document; does not change the backend or commercial data.  
**Base:** `main` `a6ef120437177600d2222b7652487d6f6f3d5b7d`.

## Objective

Prepare transport for E2-7 T02 without activating real commercial modes or connections yet. The existing UI E1 remains DEMO; **no screen currently uses the new client**.

## New and Modified Files

- `frontend/src/api/httpClient.ts`: `createApiClient`, `apiClient`, `ApiHttpError`, `ApiTransportError`; token Bearer **opaque** injection, generic typescript DTO (still without structural validation runtime), JSON body, `Idempotency-Key`, timeout and cancellation.
- `frontend/tests/http-client.test.mjs`: tests con fetch simulado, sin backend.
- `frontend/package.json`: script `npm run test:api`.
- `frontend/vite.config.ts`: developing proxy towards FastAPI for `/api`, `/health`, `/ready`, using local target per variable `PYME_API_PROXY_TARGET`.

## Development in Windows

With the right local branch of work and within `plataforma-pyme/frontend`:

```powershell
npm ci
npm run test:api
npm run build
npm run lint
```

To check real transport, boot FastAPI separately with your usual development settings and then Vite. By default Vite waits `http://127.0.0.1:8000`. If FastAPI runs on the port published by Docker, in the terminal running Vite:

```powershell
$env:PYME_API_PROXY_TARGET = "http://127.0.0.1:18000"
npm run dev
```

Open `http://localhost:5173/health` y `http://localhost:5173/ready`: must return the same result as the backend, through the proxy. **These paths verify connectivity, not authenticated flow**.

To return to the default target:

```powershell
Remove-Item Env:\PYME_API_PROXY_TARGET -ErrorAction SilentlyContinue
```

Do not send credentials to a remote URL; the proxy only accepts localhost or 127.0.0.1. Do not put passwords or tokens in Vite variables.

## Client contract planned for T02

```ts
import { createApiClient } from './api/httpClient'

const client = createApiClient({
  getAccessToken: () => tokenEnMemoria,
})
// Tras login, T02 inyectará el token opaco mediante el estado de sesión.
const me = await client.request<unknown>('/auth/me')
```

- `request<T>` model the expected static type, **does not automatically validate the remote schema**. T02 must enter appropriate DTOs/validations to the endpoint.
- `204`/`205` They're coming back. `undefined`, sin parsear JSON.
- `ApiHttpError` represents code and `detail` API; does not invent `error.code` does not expose proxy HTML.
- `ApiTransportError.reason` differentiate `network`, `timeout`, `aborted`, `invalid-response`.
- `outcomeUnknown=true` mutable command transport failures indicates **conservatively** that you can't ensure the backend hasn't committed. Durable key+body tracking will only be implemented in T06.
- **No automatic retrying** T01 does not enter refresh, REAL mode, authenticated session, CORS in backend or new business endpoints.

## Acceptance criteria and limitations

- [ ] `npm run test:api` approved in the equipment environment.
- [ ] `npm run build` y `npm run lint` No faults.
- [ ] `npm run dev` + chosen backend: `/health` OK through Vite.
- [ ] `/ready` reflects real availability of the base without inventing success.
- [ ] No visible or functional change in current DEMO screens.
- [ ] No postgreSQL writing, no use of real accounts to check T01.

**T01 must not be declared closed** until you register tests on the PR's exact SHA and check proxy on machine with accessible backend. The next T02 increase deals with real authentication, without reinterpreting the opaque token as JWT.
