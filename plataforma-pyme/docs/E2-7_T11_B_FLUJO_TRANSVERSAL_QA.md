# E2-7 · T11-B — Cross-sectional test of purchase, receipt, inventory and POS

**Date:** 11/11/2026 · **Rama:** `feature/e2-7-t11-qa-integral-hardening` · **PR:** #45 (DRAFT / sin merge).

## Objective and limits

Validate a complete trade flow from the browser to FastAPI/PostgreSQL: registration, company, headquarters, supplier, physical catalog/service, **purchase without stock**, receipt with stock, mixed POS with declared payments, voucher, ledger and F5.

**File:** `plataforma-pyme/frontend/e2e/real/flow-purchase-to-sale.spec.ts`, commit `038d5b4393465ec2872c2fc7ff46323a3a24cc62`.

**Insulation:** only `PYME_DISPOSABLE_QA=1`, API IC fixed `127.0.0.1:18001`, PostgreSQL 16 temporary `pyme_t085_ephemeral`, user/company created for unique UUID test. Playwright runner activates `VITE_PYME_ENABLE_REAL_SALES=1` **only in the discardable instance of IC**. Do not execute locally against `TEST Empresa A`; does not enable persistent sales in everyday use.

## Verified sequence

| Paso | Actual operation | Assertions |
|---|---|---|
| Prepare data | Registration, login, company MIXTO, headquarters SELL+STORE, supplier, well REVENT and service | 201 Responses in Isolated API |
| Purchase | 10 physical units to $700 + freight concept $500 | Purchase 201, total $7,500 and two lines; empty balance/ledger |
| Replay compra | Same `Idempotency-Key` and body | HTTP 200, same document, one purchase only |
| Receipt | Receive complete at the SELL+STORE headquarters | 201, `COMPRA_RECEPCION +10000 milli`; balance 10 units, version 1 |
| Replay reception | Same key and body | HTTP 200, identical proof, no second entry |
| POS browser | Product 31,500 and service 12,000 | Two-line cart, total $6,500, zero POST before consent |
| Payments and consent | Cash $3,000 + transfer $3500 declared | Final review, consent and a single POST sale |
| Receipt | TEG of the confirmed sale | Subtotal/total 650,000 cents, two lines, two exact payments |
| Inventory | BS and movements | 7 units, version 2; exactly `COMPRA_RECEPCION +10000` y `VENTA_SALIDA -3000`, zero service movements |
| F5 y re-login | Reload POS | No additional sales POSTs; unchanging voucher, balance and history |

No external money is credited or QR/Webhook payment market is used.

## IQ and exact evidence

- **Commit funcional:** `038d5b4393465ec2872c2fc7ff46323a3a24cc62`.
- **Full-stack REAL:** run #42985928705 **SUCCESS**. Log: `T11-B: compra → recepción → inventario → POS mixto → comprobante y F5` approved (2.4 s), **20 Playwright REAL**, **6 Playwright DEMO**, **892 Pytest**, build/lint/test Node sin fallas.
- **Independent Frontend:** run #42985928595 **SUCCESS**.
- **Advertencias backend:** Pytest reported **3 `UnsupportedFieldAttributeWarning` of Pydantic**, originated during tests of concurring adjustments, sales and transfers. They are not faults of T11-B nor should they be hidden; record them as technical debt to be evaluated in T11-E/hardening. The increase against an earlier IC may vary by why concurrent tests produce warnings, does not itself prove a regression.

## Acceptance criterion T11-B

**Approved to continue to T11-C**Based on the successful execution of the complete scenario and regression. This opinion does not approve T11 in its entirety: lack of navigation/tenant security and permissions in UI (T11-C), mobile/keyboard (T11-D), hardening and closure T11-E. Do not merge PR #45 or enable persistent REAL POST without express authorization.
