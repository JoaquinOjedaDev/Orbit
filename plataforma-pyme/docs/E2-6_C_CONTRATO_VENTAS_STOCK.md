# E2-6 C — Implementation contract for physical and mixed sales

**Rama:** `feature/e2-6-ventas-integradas`. **Functional basis:** E2-6 B, `dc7f16c252b705cf3e4eebc96deaad9058af3468`.
**Validation B Windows provided:** 864 passed, 1 warning; Alembic `e26a_sales_foundation` No difference. **Status C:** pending implementation and testing.

## Scope

- Keep sales of services without B location, with the same payment contracts and monetary rules.
- Accept sales with mixed goods and sales only at the same tenant location, `ACTIVA`, con `can_sell` y `can_store` real.
- Revalidate user, session, company, membership and permissions in the transaction. To operate at location: `SELL`; to consume physical stock: also `STORE`. Holder and administrator by role; manager and worker with only active assignment, without implied permissions.
- Block company/membership and location before catalog and balance, respecting the order of E2-4/E2-5. Lock items by UUID ordered. Avoid inverted order locks with catalogue editions, receptions, transfers and adjustments.
- Reject inactive, non-soldable items from another tenant or fractional amounts into discrete units. The server calculates prices and totals from the command and gets snapshots from the current tab.
- Grouping quantities of repeated goods **only for stock discounting**. Ejecutar `UPDATE stock_balances ... WHERE quantity_milli >= total_requerido RETURNING` by UUID order item; increase version only when properly discounted.
- Create a movement `VENTA_SALIDA` negative **for each physical line**, linked by `sale_id` y `sale_line_id`; never generate movement for services. Save `balances_after` as historical snapshot and not editable balance.
- Continuation of vouchers, lines, declared payments, movements, snapshots and balances **in a single commit**. In the event of any error or lack of stock, rollback everything; no proof or partial payment.
- Preserve Idempotence by `(business_id, request_id)`. Identical Replay returns 200 and same response without mutating stock. Payload or different actor with the same key: 409. Revalidate permission to replay.
- Means of payment are DEclarATED: do not credit banks, Market Payment, cash or accounts in E2-6 C. Do not add migration if `e26a_sales_foundation` That's enough.

## Required evidence before declaring C completed

1. Unique good: 201, decrease balance, version +1, single movement and correct snapshot.
2. Mixed: good + service, only the good affects stock.
3. Repeat good on several lines: single sum of debit, movement per line, HALF_UP cents per line.
4. Insufficient stock, non-existent balance, location without SELL/STORE, inactive or other tenant: error without partial deeds.
5. Permissions: holders/admin; maintainer/worker with and without assignment; session revoked; company suspended; membership revoked.
6. Two simultaneous sales with different keys per last unit: exactly one 201, the other 409 and a single debit.
7. Simultaneous retry with the same key: exactly a voucher, consistent historical response and no double debit.
8. Intercalation with receipt, transfer and adjustment of the same balance; no negative balances or loss of updates.
9. SQL failure after debiting balance but before commit: full rollback.
10. Sales of B services continue to operate without regressions.

## Closing criteria

Python green CI 3.12/3.14 + PostgreSQL 16, Alembic `current` y `check`, focused testing and complete regression Windows over temporary DB. Document exact SHA, real results and warnings. Do not open PR or merge to `main` until E2-6 D/E is closed and independent auditing is carried out.
