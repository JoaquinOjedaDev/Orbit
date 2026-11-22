# ADR-001 — Company isolation and membership
**Date:** 2026-11-06  
**Status:** PROPOSED (provisional E1 rule; pending approval of the team)  
**Responsible for approval:** TP team/functional manager (to be designated).  
**Scope:** frontend DEMO, dominio y backend futuro.

## Context
The platform is multi-rubre and multi-business; a user can have zero, one or more companies. E0-A identifies H01/H02/H09/H14: historic single membership models, global permissions and isolated M1/M2/M3 storage, incompatible with the agreed product. Sources: E0-A ``3.1, 5 y 7; E0-B ``5–8; master plan v4 ``1–4.

## Proposed decision
1. **User** is a global identity; **Business** independent entity; **Membership** links user-business to role/state/scope. Memberships per user are supported.
2. All business operations include context **businessId** and authenticated actor; **locationId** when the operation requires it. `businessId` URL does not grant access alone.
3. In DEMO, data, drafts, projections, idempotent operations and visible permissions are indexed by company. A→B invalidates context of A (including box/location); it does not move drafts.
4. In backend each resource is searched within the authorized tenant; validate permissions **on server**, use composite filters and constraints that prevent cross-linking. For other people's IDs return error without revealing attributes (404 or 403 according to contract to formalize).
5. Register of founder and administrative responsibility is defined in **ADR-002**; invitation and acceptance in **ADR-003**.

## Alternatives assessed
- Singleton Profile and Business: discarded, filters information between tenants.
- Single role per global user: discarded, does not respect different A/B permissions.
- Deployment/company database separation: not selected for MVP; operation overload.

## Consequences and risks
- All queries and commands require explicit scope; they increase validations but avoid leakage.
- Visual saves only improve UX; **not presented as real security** hasta API.
- Future backend should prevent cross-tenant scripts even if the client manipulates IDs.

## Outstanding acceptance evidence
- **DEMO-TEN-01:** user belongs to A and B with different roles; alternate and verify catalogs, drafts, buttons and dashboard without contamination.
- **QA-TEN-01/02:** API denies B resource reading/writing from A and applies effective role by membership.
- Create user without company and service company without deposit.

## Review and approval
Approve before closing E1-A2. Adjust contracts according to UML/TP3 during E2; do not confuse a memory demo with server protected access.