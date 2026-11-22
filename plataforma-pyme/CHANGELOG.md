# Change Log — PyME Platform (E2-7/T12)

The original E1 history continues at the end. This header updates subsequent cuts without asserting productive deployment.

## E2-7 / T12 — Academic closing of documents (11/11/2026)

- Reconciled requirements 01 (RF-01..RF-10), use cases 02 (CU-01..CU-12), model 03 (19 ORM entities), architecture 04 and traceability 05 (46 FastAPI/13 routers operations).
- Updated PlantUML, guides and SVGs 03A/03B/03C; added a **second SVG of shopping flow→reception→stock→sale for exhibition** preserving the 03B canonical.
- Added index of diagrams, Real/DEMO scope covers, README updates and reconciliation minutes. Historical preserved.
- This change is exclusively documentary in `plataforma-pyme/`. PR #46 remains DRAFT until explicit merge review/permission.

## E2-7 / T01–T11 — Integration and REAL QA (until 11/11/2026)

- React/TypeScript/Vite connected to FastAPI/PostgreSQL on routes `/real` for identity, companies, headquarters, equipment, catalog, suppliers, purchases, receipt, inventory and sales POS, without mixing DEMO information.
- Permits for tenant, roles and locations, concurrent stock validation, idempotency and recovery of sales, price rules and declared payments; RF-08..RF-10 not extended to REAL backend.
- PR #45 merged into `main` `c6a77137cf82dcb9aad225645e84b1265b1da3ec`. [QA T11 Act](docs/E2-7_T11_E_AUDITORIA_FINAL_PREMERGE.md) records 892 Pytest, 38 Playwright REAL and 6 DEMO in its verified functional commit. Do not attribute those figures to the HEAD of T12.

## E2-1 to E2-6 — Backend evolution (summary)

- Identity and sessions → companies, memberships/invitations → locations/assignments → catalog → suppliers, purchases/reception → balances, leadger, transfers and adjustments → sales with declared payments.
- PostgreSQL/SQLalchemy/Alembic and IC for increments; buy/sale snapshots and transactional controls. View `docs/E2-*` y `entrega-programacion-2/`.

> **Post-academic backlog (Etapa 2):** Real/DEMO visual convergence, PostgreSQL DER (e.g. DBeaver), web/mobile demo, accounts/box/expenditures, and authentic QR payment market with OAuth, webhooks and company reconciliation. It is not already fulfilled commitment or existing REAL payment.

---

## Original history preserved E1

# Changelog — PyME Platform

Recording of increments relevant to the Programming prototype 2. E1 records are local and DEMO; they do not represent verified payments or server authorization.

## E1-D2 — Frontend integration
- E2E Playwright Chromium desktop/mobile: navigation, business isolation, placeholders, menu accessibility, full QR flow.
- QA and documented non-regression matrix; GitHub IC verifies browser, compilation, lint and policies.
- Labels and screen messages aligned with already integrated modules; no migration or business modification.

## E1-D1 — DEMO visual collection QR
- PENDENT, SIMULATED_ADOPTED AND CANCELATED STATES with persistence by business and without scanning QR.
- It does not record sale or stock outage when creating QR; simulated confirmation revalidates active products, stock and accounts.
- Balance outstanding for split payments applied to the last medium, not to the first.

## E1-C3 / C3.1 — accounts and means
- DEMO Financial Directory by business, active/inactive and major accounts.
- Optional associations in sales and expenses; transfers allow bank or wallet compatible.

## E1-B / E1-C — integrated operation
- Catalog, images, suppliers, purchases, inventory and stock control; sale, expenses and arching.
- Image of physical stocks reuses the same article in Catalogue, without duplicating blobs.

**Next phase E2:** arquitectura del backend, dominio, UML y contratos de API antes de FastAPI y Docker.
