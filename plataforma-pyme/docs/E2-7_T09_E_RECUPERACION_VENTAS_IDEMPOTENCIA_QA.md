# E2-7 · T09-E — Recovery for sales due to HTTP loss of response

**Date:** 10/11/2026. Rama `feature/e2-7-t09-consulta-recuperacion-ventas`PR #42, draft, without meriting `main`.

## 1. Objective and scope limit

Probar en **Chromium REAL + FastAPI + PostgreSQL 16 ephemer** that a confirmed sale **once only** can recover after losing the POST response and reloading/starting session, without counting two declared payments, two sales or two inventory outflows.

**T09 no implementa el POS REAL.** As the form to create sales will be built in T10, the test browser T09-E issues the POST using a **harness aislado de Playwright**; the screen `RealSalesPage` maintains **solo GET**. El harness conserva la misma `Idempotency-Key` UUID4 and the same JSON of the first attempt for explicit replay. It does not represent a lasting production sales journal, nor is the ability to save and retry sales that it still has not been assigned to the IU.

## 2. Automated acceptance matrix

| Code | Ephemeral precondition | Main action | Required result |
|---|---|---|---|
| E1 — physical well | New company in ephemeral DB; headquarters SELL/STORE, product REVENT and initial stock 5 UNIT/v1 | Playwright sends POST, `route.fetch()` allows confirmation **201**, `route.abort()` Lose only the answer, F5 and new login, GET per request and original replay | A sale, a declared payment, **one movement `VENTA_SALIDA -1`** de la venta, stock **4 UNIT/v2**; replay **200** with same voucher and body/key; without automatic POST |
| E2 — service | New company, article SERVICE without headquarters or balance | Same response lost, re-entry, query by `request_id` y replay original | A sale, a declared payment, no snapshots or inventory mutations; replay **200** |
| E3 — preventive rejection | New company, attempted abortion by the harness **before reaching FastAPI** | GET per request da 404, F5/login, no automatic POST, forwarding **explicit** of key/original body | 404 **does not demonstrate** whether an uncertain attempt was confirmed or not; in this case instrumented it is known that it did not arrive; explicit forwarding generates a single **201** |
| E4 — identity conflict | After E1 and E2, send **same key** con **other amount/body** | POST devuelto **409** | No other sale, payment or additional moves created |
| E5 — frontend | Open `/real/empresas/{id}/ventas`F5/login, search `request_id` | UI consult only via GET | REAL Checker shows ID and payments **declared**; no crea venta ni modifica stock; no hay fallback a DEMO |

API checks read `GET /sales`, `GET /sales/by-request/{request_id}`, `GET /inventory/balances` y `GET /inventory/movements`, demanding identity and equality of data before/after replay, not just equal of an HTTP code.

## 3. Data protection

- **Mandatory guard:** `PYME_DISPOSABLE_QA=1`. Playwright REAL set FastAPI to `127.0.0.1:18001`, frontend en `127.0.0.1:5173`. El workflow usa DB `pyme_t085_ephemeral`. **Never point those tests to the user's manual container or to `TEST Empresa A`.**
- New users, companies, catalogs, headquarters and initial stock are generated within the ephemeral environment, exclusively for testing. No payments accredited by third parties are recorded.
- Captures and logs should not store Bearer. Token is only used in test memory; IC artifacts do not keep browser traces.
- Do not confuse the POST replay with a new charge: it is the **same idempotent request** and its exit is validated against the ledger.

## 4. Evidence and status

**Test implementation:** `plataforma-pyme/frontend/e2e/real/sales-recovery.spec.ts`.

**CI T09-E ADOPTED:** workflow full-stack #42910407673, commit ejecutable `38b980edbcccf1e3b73537571bdaf1b5b4afea8c`, final state **SUCCESS**. Direct evidence of job log `inventory-real`:

- Backend con PostgreSQL temporal: **886 approved**, 2 warnings no bloqueantes.
- Frontend Node: **272 approved**, 0 failed; `npm run build` and Oxlint without errors or warnings.
- Playwright REAL: **10/10 approved**: 4 T08 inventory, 3 T09-D reading, **3 T09-E** (physical sales, service sales and aborted POST before server).
- Playwright DEMO: **6/6 approved**.
- The T09-E cases were executed with `PYME_DISPOSABLE_QA=1` on `pyme_t085_ephemeral`Two cases verified `201` confirmed but hidden from browser → Get authorized after F5/login → replay `200`, y `409` by another load with existing key. The abortion case before reaching FastAPI verified `404` and explicitly retrying to `201`. Balances, vouchers and movements were compared before/after when physical assets were present.
- Backend Python 3.12/3.14 y Docker: **SUCCESS**, both interpreters and livingness. Second full execution #42910583172, started after the original T09-E documentation, also **SUCCESS** with the same code.

**Opinion T09-E:** **Approved in CI** for browser simulation using Harness, no actual POS deployment. Local manual acceptance of written sales is not necessary or advisable on existing data.

**Local manual testing of T09-E:** **not necessary** for E1–E4; would involve writing sales on an existing database, contrary to the agreed range. The empty status T09-D screen was already accepted manually. If you require viewing proof with data, a completely new and consented TEST base can be used in T09-F, without making evidence about `TEST Empresa A`.

## 5. Explicitly subsequent work

- **T10 / POS REAL:** enter sales command in React with **durable daily scooter by company+actor**, human confirmation and recovery from uncertain attempt without automatic POST.Get recovery of T09 is a dependency, not a replacement for the journal.
- **T09-F:** comprehensive audit, verification that T09-B/C/D/E did not introduce regressions, revision of documentation and pending manual non-mutant tests; PR in draft until merge authorization.
