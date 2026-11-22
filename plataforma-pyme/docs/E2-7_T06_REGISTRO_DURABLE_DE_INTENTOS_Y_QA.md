# E2-7 T06 — Durable recording of attempts, safe recovery and limits

**Status:** PR draft, subject to CI and QA full-stack; do not merge before validation.  
**Base:** `main` `474ff6e4086808c5a70da9725c91caa0e3f634ee` (T05).  
**Rama:** `feature/e2-7-t06-comandos-pendientes`.

## 1. Risks we resolve

If the server confirms a command, but the answer is lost by timeout or F5, the browser cannot assume that it failed or send a new POST with another key. **start-up** (`POST /api/v1/businesses`) supports `Idempotency-Key` UUID4 per actor and immutable body; repeat the same key + same body with new session of **same user** produces replay (200) without duplicate company. Using the same key with different body returns 409.

Key reserve persists **before** to send POST via IndexedDB. If the browser does not allow saving, it fails to close and does not send POST. Once the same user has been authenticated after F5, the form `/real/empresas/nueva` recharges its original key and body and demands human decision on retry. **No automatic forwarding**.

## 2. Scope of this implementation

- `frontend/src/features/pending/businessIntentJournal.ts`: Abstract port of persistence and IndexedDB adapter, data validation, separation by actor, mutual exclusion of 1 attempt per user and global limit of 20 users saved by origin.
- `frontend/src/features/businesses/RealBusinessesPage.tsx`: reading and restoration after F5 and login, explicit consent for local persistence, editing blocking while there is an attempt, durable reserve before POST, same key for retrying, deleted after success or manual discard warned.
- `frontend/src/features/auth/RealAuthApp.tsx`: safe return route after re-login on `/real/empresas/nueva`.
- `frontend/tests/pending-commands.test.mjs`: deterministic tests of reserve/recovery/isolation/immutability and errors without new dependencies.
- `frontend/src/features/auth/auth.css`: visual states of the saved attempt.
- `frontend/package.json` + workflow de frontend: `npm run test:pending-commands`.

**No persistence** tokens Bearer, passwords, invitation codes, credentials, payments, sales data, worker personal data or content of the `demoStore`. The register only keeps:
```json
{
  "actorId": "UUID del usuario autenticado",
  "kind": "business.create",
  "key": "UUID4 Idempotency-Key",
  "body": {"name": "...", "category": "...", "activity_kind": "PRODUCTOS"},
  "createdAt": "ISO timestamp"
}
```
The storage space is called `asistente-pyme-real-intentos-v1`. The current user can only view/resume his or her own earrings after authenticating against FastAPI.

## 3. Privacy, retention and shared devices policy (P04)

**Decisions for the MVP:**

1. IndexedDB is limited to the source/navigator, **is not a remote base or an encrypted warehouse**. Anyone with access to browser profile files or malicious JavaScript at the same source could inspect it. Do not use the function on shared devices. The form requires explicit consent.
2. A maximum slope per actor; maximum 20 actors in this browser, without removing foreign records when starting a new operation. If there is no capacity or IndexedDB is blocked, the discharge is interrupted before POST.
3. To the **30 days** registration is marked as old and especially careful revision is requested. Something unresolved is not quietly purged; retention is under manual user control. This policy should be reviewed in a possible output to production for an actual legal/operational limit.
4. Logging is deleted only after server confirmation **y** successful local cleaning, or by explicit discard after review `Mis empresas`. Local deletion does not remove companies in PostgreSQL.
5. Logout/F5 does not remove pending to allow recovery, although they do rule out token in memory. There is no synchronization between browsers or devices.
6. Clearing site data, using a private browser, changing Firefox profile or losing disk can destroy IndexedDB; there is no absolute guarantee of damage/loss of storage. **No** declare infallible recovery.

## 4. Which operations are deliberately excluded

| Operation | Backend | Policy T06 |
|---|---|---|
| Create company | Idempotency-Key UUID4 + replay en servidor | **Integrated with durable journal and manual retry** |
| Create article | No soporta clave/replay de comando | Warning uncertain result; consult catalogue before deciding |
| Issue invitation | Single-use code without a GET that returns secret | Do not save clear token or reissue automatically |
| Create location / change role / assign | No replay key according to contract | Do not automatically retry; read status |
| Create purchase / receive purchases | Requires analysis of contracts by increase T07 | No REAL interface enabled yet |
| Confirm sale | Idempotency-Key and replay, but no recovery by request-id approved | **T09 pending design** and application in real POS T10, not enabled here |

The current infrastructure only saves `business.create`. Do not reuse the same strategy indiscriminately in non-idepotent operations. In particular, do not report “it was not created” just because a GET returned 404 or because an answer was lost.

## 5. Local testing

From `plataforma-pyme/frontend`:

```powershell
git pull --ff-only origin feature/e2-7-t06-comandos-pendientes

npm.cmd run test:pending-commands
if ($LASTEXITCODE -ne 0) { throw 'Falló test:pending-commands' }
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

Con `docker compose --profile api up -d --wait` y `PYME_API_PROXY_TARGET=http://127.0.0.1:18000`, ejecutar `npm.cmd run dev` and open `http://localhost:5173/real/login`.

## 6. Manual QA, with only accounts and test companies

| Scenario | Action | Expected |
|---|---|---|
| T06-01 | Open new company, without consent | Post not allowed |
| T06-02 | Accept and Create `TEST T06 OK` | HTTP 201; visible enterprise; deleted attempt |
| T06-03 | Create Try `TEST T06 PENDIENTE` with network interrupted, after saving the key | Uncertain result; no duplicate company automatically appears |
| T06-04 | F5 en route `/real/empresas/nueva` | Ask for login; return to form, rehydrate key/body |
| T06-05 | Open form with another test user in the same browser | Never see the slope of previous user |
| T06-06 | Re-enter with original actor | Recovers the same attempt, blocked fields, offers to verify list |
| T06-07 | Voluntary repeat with identical key and content | Backend returns creation or replay; a single effect in PostgreSQL |
| T06-08 | Discard explicitly pending | Remove only IndexedDB after confirming warning, without deleting company |
| T06-09 | Lock IndexedDB from browser settings | Operation is NOT sent without reservation confirmed |
| T06-10 | Navigate A→B / exit and return to DEMO | No data from another actor/tenant, no navigational creation |
| T06-11 | 30+ days simulated in unit tests | It's old, never quietly erased. |

**Precautions:** The network cut must be done in test environment (ideally postgreSQL ephemeral base), not in an important operation. If the POST came to server, it may still exist without response. Do not assume results by appearance of network. Do not reload or delete site data indiscriminately if there is a slope.

## 7. Door closing

CI con build, lint y suites previas + `test:pending-commands`; local checks; F5/re-login tests, same different actor and actor; evidence that no company is duplicated or attempt lost after network cutting. Do not merge without it. The rules of recovery for sales and request-id consultation will be part of T09/T10, do not infer here.
