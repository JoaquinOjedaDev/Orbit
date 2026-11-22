# E2-7 · T10-B2 — Idepotent Creation and Recovery Coordinator (no POST interface)

**Rama:** `feature/e2-7-t10-pos-ventas-real`. **PR #43:** draft; `main` no change T10.

## What implements

`frontend/src/features/sales/realSaleWriteCoordinator.ts` separates four explicit operations:

- `pending()`: local reading of the attempt isolated by **actor and company**.
- `prepare(body,key?)`: T10-A validation and IndexedDB persistence of **same standard body and UUID4** with a back reading, no HTTP requests; one previous attempt blocks another with different content.
- `recover(signal?)`: only `GET /businesses/{businessId}/sales/by-request/{key}` for the saved try. If you return matching voucher, try closing the row; if HTTP **404**, devuelve `not-found`, **not deleting or retry POST**404 does not prove that the first sale is non-existent.
- `sendApproved(key,true,signal?)`: requires explicit consent of the caller (the human confirmation IU will be T10-D), UUID key4, reading and rechecking the journal; only then allows a `POST /sales` with the original body and its `Idempotency-Key`. HTTP 401/403/404/409/422 and network errors do not delete the registry. An invalid POST response is **uncertain result** and demands to be recovered by GET before deciding. `201/200`, the voucher must match the company/actor/key, headquarters, lines, payments, notes and totals of the command.

**If the voucher is confirmed but local cleaning fails**, se devuelve `confirmed` con `journalCleared=false`: a sale as unconfirmed is not misreported; the record is preserved for recovery. It is never automatically replayed by F5, timeout or error 404. A retry must start from a new human confirmation, with key and body **identical**. There is no DEMO failback, new key generation after error or Bearer storage.

**Important limit:** The mechanism is a library/gateway, **is not connected to the React screen**. The user still **you cannot register a sale by this increase**. The P01 price/discount policy per role is still pending; it must be imposed on FastAPI before connecting the confirmation button.

## Verifications T10-B2

`frontend/tests/sales-real-write-coordinator.test.mjs` Adds 12 tests:

- Preparation without HTTP calls and key/body backup.
- Rejection without confirmation, foreign key or absent journal.
- Explicit POST with Bearer in Memory, `Idempotency-Key` original and authentic proof.
- Replay `200` and error `409`, keeping the record when the backend rejects.
- Invalid POST response and network loss: uncertain result, no repeat.
- GET `404` ambiguous without erasing, recovery after F5/nuevo login by GET without POST.
- Refusal of proof with tenant/actor/altered amount.
- IndexedDB reading/reserving failures block writing.
- Confirmed check with local erasing failure keeps the attempt without duplicating the sale.

**Comprehensive CI T10-B2 ADOPTED:** workflow #42919262068, commit funcional `b84823f89f2d7338b931c4fa8ca40ee3be6680e7`, **SUCCESS**. Log: **12/12 new T10-B2 tests**, **886/886 backend PostgreSQL**, **11/11 Playwright REAL**, **6/6 Playwright DEMO**; build and Lint frontend completed. T10-A (11) and B1 (12) tests had been approved locally. Command on Windows: `npm.cmd run test:sales-real-write`.

**Incident detected and resolved:** the first integral run of B2 failed in the test that required `SalePendingConflict` to other person's proof/corrupt, because the validator T09 rejected it earlier with `ApiTransportError('invalid-response')`. En `b84823f8` was corrected **only the expectation of testing** to accept both safe rejections and verify that the journal retains the attempt. The subsequent integral execution ended green; not hide the historical failed run. **The POS still does not enable sales from React**.

## Next Doors

- Implement P01 in backend and test attempt by API bypass: **no** It is enough to hide the price or discount from the worker.
- Before displaying POS and enabling shipments: complete catalog by page, assigned headquarters, physical purchase/sale vs service, human review and understandable recovery states.
- T10-E: Playwright REAL + disposable base for lost POST response, F5, explicit replay 200, absence of double stock/payment movements and DEMO regression.
- Keep **PR #43 DRAFT** y no fusionar a `main` before T10-F.
