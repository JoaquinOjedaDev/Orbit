# E2-5 — Consolidated Implementation and Validation Report

**Status:** functionality implemented in `main`green IC and approved primary manual tests; **Proposed closure subject to review**Date: 09/11/2026.  
**Frozen reference:** `748e69319d8d04900c009d5184168a264a9deeac`.

## 1. Objective

Implement the physical core of RF-06/CU-08, CU-09 and CU-11: represent verifiable inventory operations with origin and sign, consult balances/movements per company/location/article, transfer stock without creating or destroying it and record initial stock and justified adjustments without admitting negative balances or duplicate retryings.

The platform is **generalist, multi-rub and multi-enterprise**. Example items belong to a QA business; the system is not limited to pet items.

## 2. Incremental developments

| Cut | What he gave | Qué **no** delivered in that instant | PR/merge SHA |
|---|---|---|---|
| **E2-5 A** | `InventoryOperation`, signed extension of `StockMovement`, FK/CHECK/UNIQUE per tenant, migration `e25a_inventory_ops`, retrocompatibility of reception | There were no transfer or adjustment commands yet | #21 · `4268846abc524ebd827b4da930ef58d8d9789ac7` |
| **E2-5 B** | POST/GET for atomic transfer, dual movement, idempotency, stock control and STORE permissions; general reading of extended ledger | No initial adjustments/stock yet | #22 · `4f992b3beb8dda732e4cd752f828b375f240e13d` |
| **E2-5 C** | POST/GET de ajuste `AJUSTE_ENTRADA`, `AJUSTE_SALIDA`, `STOCK_INICIAL`, optimistic version, motif, reinforced roles and traceability | No sales/React integrated or absolute counting | #23 · `748e69319d8d04900c009d5184168a264a9deeac` |

All three PRs are **merged**and the current code of `main` coincides with the E2-5 C SHA. Courts B and C did not introduce new migrations; they reuse `e25a_inventory_ops` de A.

## 3. Acceptance and evidence criteria

1. **Unit invariants:** physical quantity in thousands of wholes; discrete items with entire quantities; physical products ASSISTANCE; services without balance. Supported by automated schemes, restrictions and tests.
2. **Integrity by company:** FK and consultations with `business_id`; membership and location permissions; server revalidation. Coded back up and negative tests between tenants. The manual QA was executed in **una** test company, did not try inter-tenant independently.
3. **Transfers:** 4 units were removed from QA tank and entered the house. The two movements share operation and add up to zero. Manual result: **201**; confirmed balance sheets **6 + 4 = 10**, GET **200**.
4. **Retry of transfer:** same result and IDs using repeated POST, **200**; no second movement recorded in the consulted leader.
5. **Insufficient stock in transfer:** request above balance → **409**; later balance/history unchanged.
6. **Initial stock:** first entry of 5 units for another article in Casa → **201**; replay **200** with the same voucher; a second new charge → **409**.
7. **Ajustes:** 2 units input → **201**; 1 → output **201**; the final balance of the test item is **6 units, version 3**confirmed by GET **200**.
8. **Adjustment protections:** higher output than available → **409**; outdated version → **409**; Later GET shows balance and intact movements.
9. **CI and regression:** 816 → 826 → 840 tests per Python version (total suite of each cut), 3/3 jobs per run, with PostgreSQL 16, Docker and `alembic check` sin deriva.
10. **Windows of E2-5 C:** `840 passed in 110.89s`, `e25a_inventory_ops (head)`, `No new upgrade operations detected.`, Docker DB/API `healthy`, `/ready = ready/ok` (exit provided by developer).

## 4. Consolidated functional result

| Scenario | Final state reported | Justification |
|---|---|---|
| **Article A** — balanced food | QA deposit: **6 units, version 2**; House: **4 units, version 1** | 10 reception, transfer of 4, replay without effect and rejection due to insufficiency |
| **Article B** — QA biscuits | Home: **6 units, version 3** | Initial 5, input 2, output 1, two rejections without mutations |
| **Article A** | 3 moves: `COMPRA_RECEPCION +10`, `TRASLADO_SALIDA -4`, `TRASLADO_ENTRADA +4` | General GET by catalogue, 200 |
| **Article B** | 3 moves: `STOCK_INICIAL +5`, `AJUSTE_ENTRADA +2`, `AJUSTE_SALIDA -1` | General GET by catalogue, 200 |

The two articles are independent: Exhibit C did not reuse or modify Article A. The logbook only confirms the balances that were actually consulted and contributed; it does not show any absence of future external deeds.

## 5. Compatibility and delimitation

La **purchase** y la **reception** The E2-5 A scheme supports previous reception records with new manual operation movements without altering existing receptions. Services work with the following services: `StockBalance` as current projection and `StockMovement` as a signed historical trail.

**Not implemented or certified in E2-5:** automatic inventory consumption by a backend sale, real sales/payments, reverse or returns, lots, automatically derived absolute physical count, massive modifications, periodic reconciliation reports, UI React connected to these APIs, freezing of the ledger against privileged SQL access or productive deployment. The existence of DEMO screens does not amount to backend.

## 6. Opinion of this submission

**Suitable for functional closure review of E2-5 A-C range.** The evidence available is consistent: integrated code, approved IC and manual flows with expected results. **It is not an independent audit opinion or production approval.** The audit assignment document should be reviewed before the closure is published. **prepared at a post-preliminary stage**, upon request of the team: [Form sheet](../E2-5_ENTREGA_PARA_REVISION.md) y [audit package](../E2-5_AUDITORIA/00_LEEME_Y_PRECONDICIONES.md). **Audit not performed**.

## Critical evaluation after the first package (v1.1)

An AI-assisted review was contrasted, which proposed changing competition, rebooting zero balances, introducing reversals and approvals, tightening the base, typifying motives and extending trade operations. **No reproduction of corruption or loss of stock was identified in the material received at E2-5**: 409 rejections after concurrent changes are consistent with the adjustment contract and transactions on the same location are serialized by locks. Nor is it appropriate to equate zero recorded balance with no history of article-location pairing.

Se consideran **real debts**, subject to separate design and validation: control of direct alteration of the ledger SQL, balance/ledger reconciliation, linked compensatory reverses, negative adjustment policies, motive categories and ergonomics of version conflicts. Reservations, partial reception, currency and rounding changes belong to other blocks and require product decision; they do not justify rewriting E2-5 or migrations already applied in this closure. [Opinion and evidence](13_EVALUACION_OBSERVACIONES_IA.md) · [Priority backlog](09_RIESGOS_DEUDAS_Y_DECISIONES.md).

El **A–C functional closure** is supported by reported results and IQ, but **independent audit, pre-production hardening and final publication** No new backend tests were run for the documentary edition.


## 7. Publication status (closing addendum)

The documentary closure and his audit commission were **approved and published** en `main` by PR #24, Original SHA `c66df2f8ddaa8179ca12e342bd3099348bc6b155`This document retains results and decisions obtained in previous stages, but any old indication of "free-merging" was overtaken by this publication. **Independent audit still to be implemented**; documentary approval does not amount to production approval.
