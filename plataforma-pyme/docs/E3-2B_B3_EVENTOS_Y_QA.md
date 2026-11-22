# E3-2B · B3 — Event laboratory and safe recovery of QR

**Exclusive branch:** `feature/e3-2b-mercadopago-qr-demo`.  
**Status:** implementation B3 incorporated and submitted to IC; pending B4–B6.  
**Delivery:** single audit and manual QA after integrating B1–B6; do not make partial merge to `main`.

## What was integrated

1. Migration `e32b_qr_events` (post-review `e32b_qr_intents`) creates the logbook `qr_payment_events`, con `business_id`, `intent_id`, `event_key`, sequence, action, before/after user and date. Uniqueness by intent/event key and by attempt/sequence.
2. `CREAR` is recorded in the same commit as intention B2; `CANCELAR` in the same commit as cancellation B2. Writings block the intent row before changing status, avoiding divergent concurrent transitions.
3. `GET /api/v1/businesses/{business_id}/qr-payment-intents/{intent_id}/events` returns historical of the visible attempt, ordered, without tokens.
4. `POST /api/v1/businesses/{business_id}/qr-payment-intents/{intent_id}/simulate` accepts `{"action":"APROBAR|RECHAZAR|EXPIRAR|INDETERMINAR"}` y header `Idempotency-Key: UUID4`. Identical repeat returns 200 and does not insert another event; first event returns 201. Same UUID for different action/user is 409.
5. UI `/real/empresas/{business_id}/qr-cobros/{intent_id}`: more auditable history laboratory approval, rejection, expiration or uncertain result, with consultation/recovery. It is visually distinguished from a REAL payment.
6. POS: QR attempt persists in IndexedDB **before POST** and is reread to check integrity. After F5 and new login, the POS must recover the same key/body by GET without creating any other intention until it is resolved; a GET 404 does not erase the attempt and requires explicit forwarding with the same key.

## Laboratory protection

**Default disabled.** The simulator API responds 403 except if the server has:

```bash
PYME_ENABLE_QR_DEMO_LAB=1
```

And only in disposable QA installations, never with actual charges. The UI enables buttons exclusively if configured `VITE_PYME_ENABLE_QR_DEMO_LAB=1` in the Vite process. **Both variables** must be explicitly configured and the actor must be `TITULAR_ADMINISTRATIVO` o `ADMINISTRADOR` in the active company.

The QR query and its history work without activating the laboratory, according to business permissions. Operating users cannot broadcast fictitious events from the API even if they manipulate the frontend. A user cannot read another operating user's or other business attempt.

## State Machine

| From | DEMO Action | Towards |
|---|---|---|
| `ESPERANDO_PAGO` | `APROBAR` | `APROBADA_DEMO` |
| `ESPERANDO_PAGO` | `RECHAZAR` | `RECHAZADA` |
| `ESPERANDO_PAGO` | `EXPIRAR` | `EXPIRADA` |
| `ESPERANDO_PAGO` | `INDETERMINAR` | `INDETERMINADA` |
| `INDETERMINADA` | `APROBAR` / `RECHAZAR` / `EXPIRAR` | destination requested |
| Ends `APROBADA_DEMO`, `RECHAZADA`, `EXPIRADA`, `CANCELADA` | any new event | 409 |

Attempt with expired date cannot be approved/rejected: only explicitly pass to `EXPIRADA`. The GET continues to calculate `EXPIRADA` for a `ESPERANDO_PAGO` expired, even if there is not yet a written event. Periodic automatic materialization of maturities is not implemented; the transition with logbook is recorded by explicit laboratory action. Never infer accreditation of a fictitious state change.

## Limits of this stage

- **No money transfer**, consult Market Payment or external proof of payment.
- `APROBADA_DEMO` is a state of simulation and **does not generate Sale**, declared payment, stock, cash or movements.
- The link remains DEMO; OAuth and Orders API are left for B6.
- In B4 transactional confirmation with stock control and clearing/revision policy will be defined. Fictific approval should never become real accreditation.
- The local journal keeps the commercial body clear within IndexedDB and **does not save credentials**: Avoid shared devices and do not manually delete data in the event of uncertain responses.

## Automatic testing

- Python/FastAPI: session control, role, tenant, laboratory disabled, approval, rejection, cancellation, expiration, indetermination, resolution, idempotency, audit, blocking of contradictory transitions and absence of changes in `Sale` o `StockMovement`.
- Node: Event client, sending heads, data rejection from another tenant, uncertain network result, durable daily and comprehensive verification for cleaning after GET or POST.
- CI: `Plataforma PyME · Backend FastAPI`, `Frontend`, `Inventario REAL full-stack`. Require all green for the final SHA of B3; record any fault and correction.

**Next block:** B4 — REAL sale in PostgreSQL QA after simulated approval, idempotency and transactional control of stock, without crediting money.
