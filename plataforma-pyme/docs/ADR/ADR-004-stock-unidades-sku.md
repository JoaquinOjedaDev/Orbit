# ADR-004 — Catalogue, units and stock based on movements
**Date:** 2026-11-06  
**Status:** PROPOSED (unit parameters and homonyms PENDING to fix in E1-B).  
**Responsible for approval:** TP team/functional manager (to be designated).  
**Sources:** E0-A Z050/Z069/Z072/Z070; H07/H09/H16/H18/H19/H22/H25/H26; D04/D09/D10; E0-B ``6–8; v4.

## Proposed decision
1. `CatalogItem` es **Okay.** o **SERVICE**. Resale, input and processing are optional capabilities of the BIEN. Service does not require stock, deposit, batch or recipe.
2. Identifier and SKU belong to business; **Single SKU per company** (repeatable between companies).Auto-generation rules, homonymous names and SKU changes follow proposals.
3. The balance is not edited directly in the views. `StockMovement` is the record from which physical balances are derived, reserved and available by company/article/location; no display maintains independent counter.
4. Purchase, reception, transfer and payment are different. Reception applies one time (idempotent) entry; transfer applies -q and +q in an atomic command. Refuse negative and transfers greater than available.
5. Quantities include unit and scale; **no** use `parseInt` For kilos/liters; strict parseo and exact representation in whole or decimal smaller units with declared scale. Choose scales by type before E1-B2.
6. Count records adjustment and motive; concurrent changes require revision of version in API. Return from fair/transfer does not automatically consume "lacks": difference is explicitly documented.

## Alternatives
- Field `stockActual` editable in each module: discarded by H09.
- Purchases that receive/pays automatically: discarded by inconsistencies.
- JavaScript float quantity without rounding policy: not accepted for commercial operations.

## Consequences
A gateway is required with DEMO transactional operations and invariant testing. The protection of the continuance between devices is incorporated **en backend PostgreSQL**, no con flags UI.

## Pending evidence
- **DEMO-STK-01 / QA-STK-01:** receive 10 twice with the same key leaves +10, no +20.
- **DEMO-STK-02 / QA-STK-02:** transfer 3 of 10 leaves 7 source/3 destination; move 11 complete fault.
- **QA-STK-03:** two concurrent sales of the last available no negative balance (**Real API**).
- **QA-CAT-01:** same SKU in different tenant allowed; service has no stock.
- Differential count and return do not produce silent loss H25.

## Earrings
Scales/units, homonyms and SKU policy will be set when starting E1-B2, without blocking shell E1-A.