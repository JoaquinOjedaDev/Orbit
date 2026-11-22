# ADR-002 — Founder and administrative title
**Date:** 2026-11-06  
**Status:** PROPOSAL; DIFFERENT transfer and recovery with mandatory design before actual API.  
**Responsible for approval:** TP team/functional manager (to be designated).  
**Sources:** E0-A ``3.1 y 5; E0-B ``6, 8 y 12; v4 `3, D01/H01.

## Context
Creating a company requires initial responsibility, but **historical founder**, **Administrative platform holder** y **legal holder/partner** some prototypes combine these concepts or allow inconsistent roles.

## Proposed decision
1. Al crear Business, registrar `founderUserId` immutable as a historical fact.
2. Create an active Membership of the creator and assign exactly **an initial active administrative holder** per business (invariant).
3. Do not allow in E1 transfer, revoke or remove the last responsible. Actions not yet designed must appear "nextly", do not offer false transfer.
4. In API, transfer of title will be transactional, authorized and audited; the transition must ensure that there are never zero or two holders **assets**Recovery and succession need flow apart.
5. Administrative attribution **does not credit legal property** is not derived from contributions, partners or percentages.

## Alternatives
- Unique and irrevocable founder: not acceptable for real business.
- Several active holders without coordination rule: it differs because it breaks oneness and responsibilities.
- Legal holder as automatic data of the user: discarded.

## Impact/risks
Invariance requires constraints/serialization of backend transfers; DEMO simulates validation but does not promise safe competition.

## Pending evidence
- **QA-ONB-01:** high creates a single administrative responsibility consistent with membership.
- No company can be left without active holder; two competing transfer requests are serialized **when API exists**.
- Registered Founder remains even if the responsible person changes.

## Approval
Adopt the initial discharge rule before E1-A2; leave transfers as unimplemented capacity up to complementary ADR and tests.