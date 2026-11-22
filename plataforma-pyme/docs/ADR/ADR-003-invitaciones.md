# ADR-003 — Two forms of invitation and access
**Date:** 2026-11-06  
**Status:** PROPOSAL. Order of the MVP: Nominative first; Link/QR request DIFFERED without cancelling as a requirement.  
**Responsible for approval:** TP team/functional manager (to be designated).  
**Sources:** E0-A Z002/Z014, H12 y D02, ``3.1/5; E0-B ``5 y 8; plan v4.

## Problem
The Team design includes a nominative invitation while M1 allows you to share a link or QR for **request** Input. These are processes with different authorizations and states.

## Proposed decision
**A. Nominative invitation:** an authorized person invites an email and allowed role. Conceptual states `PENDIENTE → ACEPTADA / RECHAZADA / CANCELADA / EXPIRADA`; non-reusable token, due date and correct recipient. Acceptance confirms membership only once and is audited.

**B. Link or QR of application:** a business link allows you to start an application, **no** automatically assigns permission. Concept States `PENDIENTE → APROBADA / RECHAZADA / CANCELADA`; approval per authorized member creates/active membership. Token's link and request are not confused with nominated invitation.

**En E1:** implement the nominated invitation only after you have Enterprise/Membership; the second stream can remain as "Next" view. Never promise real mail delivery in DEMO.

## Alternatives and consequences
- Unify invitation and request in a single "Log In" button that creates membership: discarded by privilege scaling.
- Remove QR/link: rejected as a permanent policy; deferred as implementation.
- PROPERTORY role assignable in invitation: not allowed per proposal; the transfer uses ADR-002.

## Pending evidence
- **QA-INV-01:** Token expired, revoked or for another user does not grant access.
- Reusing accepted invitation does not duplicate memberships; user without permission does not invite.
- Request per link does not enable access until approval.

## Review before API
Concretize expiration, revocation, role policy and safe delivery of tokens; no credentials in public fixtures.