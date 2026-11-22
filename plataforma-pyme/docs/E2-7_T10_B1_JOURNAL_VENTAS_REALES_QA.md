# E2-7 · T10-B1 — Persistent Journal of Real Sales (without POST)

**Date:** 10/11/2026 · **Rama:** `feature/e2-7-t10-pos-ventas-real` · **PR #43:** draft, no merit.

## 1. Scope implemented

Added `frontend/src/features/sales/salePendingJournal.ts`, module for **keep user-confirmed attempts locally before sending a POST**Still. **without integrating it into a sales writing POS**. Pattern compatible with existing business and shopping journals; use IndexedDB base **separate** `asistente-pyme-real-sales-v1`, warehouse `pending`Not save token Bearer, passwords or sessions, but keep commercial information **unencrypted**therefore shared devices are discouraged.

Each intention preserves exactly: `scope`, `actorId`, `businessId`, `kind: sale.create`, `key` UUID4, `body` complete standard/validated by T10-A and `createdAt`. `scope = actorId:businessId:sale.create` prohibits a company or actor from seeing another's pending sale. `key` during the React render.

### Operations and guarantees

- `newSalePending(actorId, businessId, body, key?)`: creates canonical intent; **doesn't write.** en disco ni en red.
- `journal.reserve(intent)`: IndexedDB transaction; rejects second key/body incompatible, reads the row again and demands exact equality **before allowing another increase to use a POST**. Without booking and rereading successful, fail closed.
- `journal.load(scope)`: after F5 and new login, restores the same body/UID4 or indicates absence; if it is corrupt/non-canonical, **no** It automatically replaces it.
- `journal.closeConfirmed(scope, key, receipt)`: requires REST proof `SaleView` valid, same company/actor/key/headquarters, subtotal/total/discount/notes, each line and every payment declared with your order and amount. Only then can you remove the original intention.
- There is no free deletion operation in the public API of the journal. Attempts over 30 days are only given warning; they are not purged by TTL.
- IndexedDB errors block future sales deed rather than generate a new UUID or quietly degrade by memory.
- `GET /sales/by-request/{request_id}` available from T09 will be the first recovery step in T10-B2/C. **404 not guaranteed** that the sale did not arrive; do not close or generate new request.
- Aún **not invoked `POST /sales` from IU** no new sales/stock are recorded. The controlled recovery/reintendence mechanism and the POS buttons are later work.

## 2. Automatic QA

`frontend/tests/sales-real-pending.test.mjs` Adds **12 tests** of: F5 reservation and restoration; separation by actor/tenant; key/changed body blocking; corrupt/secret data; IndexedDB inaccessible; rejection of other or incompatible vouchers; closure only with valid proof; lossless erasure failure; unpurified seniority; UUID4/NFKC and absence of network effects.

Comando Windows: `npm.cmd run test:sales-real-pending`.

**Initial evidence IQ:** the workflow frontend of the commit `34f755d0` Completed **SUCCESS**, con **12/12** T10-B, TypeScript/Vite and lint tests without errors. **11/11** Tests. The final workflow of the last T10-B1 commit will be recorded once completed; the full-stack suite is running against PostgreSQL disposable and does not involve user data.

## 3. Earrings and doors

**T10-B2:** POST sales gateway associated exclusively with a previously persistent attempt, GET recovery, management of `201`/`200`/`409`, 401/403 and uncertain result. Require tests to prove a POST absence if the journal fails, do not automatically try again and never create a new key before 404 or timeout.

**P01 remains pending human approval:** price and role discount permissions. Before enabling T10-C/D (confirmation from React) must be defined and **also in FastAPI**Never just hiding the form.

Do not enable creation of real sales until completing the journal+gateway, role contracts, backend tests and human confirmation. Keep PR #43 in draft.
