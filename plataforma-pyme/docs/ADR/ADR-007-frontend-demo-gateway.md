# ADR-007 — Frontend, navigation and DEMO repository
**Date:** 2026-11-06  
**Status:** PROPOSAL, pending validation of the team at start E1-A.  
**Responsible for approval:** TP/technical officer team (to be designated).  
**Sources:** E0-A H08/H09/H15/H17/H21; E0-B ``2–7; plan v4 ``3–4.

## Proposed technical decision
- `frontend/` as **SPA React + TypeScript + Vite** dentro de `plataforma-pyme/`. React Router para rutas, `navigation.ts` as a unique menu/card record, CSS tokens and accessible components.
- Zustand is proposed by store DEMO. **Central business status by businessId**, no `localStorage` and global functions inherited from M1/M2/M3.
- Separate `session`, `activeBusiness`, `businessesById` y `draftsByScopedKey` (user+business+feature+location cuando aplica).
- UI invokes typed commands/consultations to `AppGateway`; `DemoGateway` first, `ApiGateway` Business commands always carry actor, businessId and commandId; validation and typical result.
- E1-A starts with memory status and DEMO fixtures; optional persistence would be introduced by versioned adapter, **no** as real security.
- Start/company/profile/locations/catalogue/sales/box with explicit routes; unimplemented routes are "nextly".
- WALOS is an example company, **no** a product description or mark.

## Alternatives
- Import 19 HTML by iframe or copy global scripts: discarded, linked and inconsistent data.
- Insulated state by M1/M2/M3: discarded.
- Acoplar `fetch` directly to each screen: discarded by costly migration to API.
- React + Redux or microfrontends: complexity not necessary in first circuit; reconsider only with evidence.

## Consequences and limits
The authorizations, transactions, contestation and tokens will be in backend. UX saves and fixtures in memory are **simulation**: no security statement or real persistence.

## Pending evidence
- **DEMO-NAV-01:** each card leads to view or "Next" and matches the side menu.
- **DEMO-TEN-01:** alternate company A/B cleans context/car/deletion.
- **DEMO-UX-01:** shell responsive, forms/modal keyboard, focus and visible errors.
- With the backend, same commercial transactions through `ApiGateway` without double authority.

## Review milestone
Approve stack before creating the Vite E1-A1 skeleton; if you change framework, document impact on this ADR without re-auditing HTML.