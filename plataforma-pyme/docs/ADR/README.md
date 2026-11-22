# ADR — Decision index and status in force T12 (11/11/2026)

**Technical baseline:** `main` `c6a77137cf82dcb9aad225645e84b1265b1da3ec` (E2-7/T11).  
**Documentation branch:** `docs/e2-7-t12-cierre-academico`, PR #46, sin merge.

> **Rule of precedence:** the eight ADRs were written during E0/E1 as **historical decisions or proposals**. Their ‘PROPOSAL’ headers are maintained to avoid rewriting dated decisions; **index and the [Document 04 in force](../../entrega-programacion-2/04_ARQUITECTURA_Y_PATRONES.md) clarify which part is already implemented, what proposal has changed and what is missing**. The source of truth is code + SQL models and documents 01–05, not the original design of each ADR.

| Historical ADR | Updated status to T11 | Verifiable observation |
|---|---|---|
| [001 — Multi-company isolation and membership](ADR-001-tenencia-y-membresias.md) | **REAL** | Global identity, `Membership` by company and tenant authorization at FastAPI |
| [002 — Administrative authority](ADR-002-titularidad-administrativa.md) | **PARTIAL REAL** | Historical Founder and Protected Holder; Transfer/Recovery **DIFFERENT** |
| [003 — Invitations](ADR-003-invitaciones.md) | **REAL NOMINATIVE / DIFFERENT QR REQUEST** | Mail address + authenticated acceptance; open request link/QR is not an authorized public access |
| [004 — Catalogue/units/stock](ADR-004-stock-unidades-sku.md) | **REAL WITH MODEL ADJUSTMENTS** | Catalogue and units; materialized stock + leadger, concurrent control, non-negative; definitive classifications and snapshots in Doc 03 |
| [005 — Cash-flow day and closing](ADR-005-jornada-cierre.md) | **DEMO ONLY / DIFFERED IN REAL** | No RF-08 Real cash or backend reconciliation |
| [006 — Sales, means of payment and QR](ADR-006-ventas-pagos-qr.md) | **REAL SALE / DIFFERENT MP QR** | `Sale` y `SalePayment` declared in FastAPI. OAuth/webhooks/QR of accredited collection **no such thing** in REAL |
| [007 — Frontend/gateway DEMO](ADR-007-frontend-demo-gateway.md) | **EVOLUTION** | React/Vite with REAL paths using HTTP client and local DEMO; do not claim that Zustand, `AppGateway` or all proposed ports were literally implemented |
| [008 — Integration with the TP](ADR-008-integracion-con-tp.md) | **APPLIED IN SCOPE / RUBERICA TP3 FOR COTTING** | Focused work on `plataforma-pyme/`; the historical ADR mentions a threshold of **≥10 unit tests performed** for TP3, but the totals of Pytest (including integration) do not demonstrate that subset alone or replace the official slogan |

## Precautions for defence

- **Do not adopt proposals retroactively:** a historic decision may have been corrected during T01–T11. Do not confuse proposed Zustand with `demoStore` nor a pattern described in pseudocode with implementation.
- **Academic scope:** RF-01..RF-07 and CU-01..CU-12 make up the documented REAL core. RF-08..RF-10 and QR of Real Payment Market are DEMO/Deferred. The official TP3 slogan must be checked before asserting its complete absorption.
- **Data security:** DEMO is local, does not authorize real operations. API verifies tenant, membership, role and headquarters. `MERCADO_PAGO_DECLARADO` does not credit third party payments.
- **Step 2:** [T12 and post-academic backlog](../E2-7_T12_E_ACTA_CIERRE_Y_BACKLOG_ETAPA_2.md) — Real/DEMO visual convergence, ERD PostgreSQL, web/mobile and Market Productive QR Payment per company.
