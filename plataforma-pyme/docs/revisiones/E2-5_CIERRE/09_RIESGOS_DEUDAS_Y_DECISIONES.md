# E2-5 — Risks, technical debt and decisions pending review

**Criterion:** separate **demonstrated bug**, **substantiated risk**, **functional debt** y **optional improvement**. Priorities are a **Proposed** and no approved programming order.

## 1. Risks and outstanding

| ID | Guidance priority | Classification | Finding / Limit | Proposed action (outside this IPA) |
|---|---|---|---|---|
| E25-P01 | **P1 (INCIDENT CLOSED, Swagger evidence reported)** | Operational security: talk session token exhibition | A real Bearer was exposed; the value **is not included in this package**. Provided `POST /api/v1/auth/logout` **204** with **same token** el 09/11/2026 15:23:37 GMT. | **Revocation of that session confirmed under API contract and response provided**; does not involve closing other sessions or SQL inspection. Keep exposure prevention and clean up new catches. |
| E25-P02 | **P1** | Environmental risk QA | Local test runner supports PostgreSQL development according to configuration; rollback test by tenant does not replace physically isolated DB. | Configure dedicated ephemeral test DB and fail-closed versus production; do not delete existing QA data. E2-4 damage. |
| E25-P03 | **P1 before production** | Hardening SQL | The API does not offer to edit/delete historical movements, but it is not shown that a role with `UPDATE/DELETE` SQL can be prevented by triggers/licens policy. | Apply first privilege to runtime user, review DML and consider DB mechanism of immutability; test compatible migration. |
| E25-P04 | **P1 before expanding inventory** | Robustness / integrity | No scheduled reconciliation of `stock_movements` Against `stock_balances`; prior to privileged external SQL writing there is no published diagnostic routine. | Create query/reports of discrepancies **no silent self-repair**; scenarios with conjunctiality and errors. |
| E25-P05 | **P1 for RF-07** | Deferred functionality | The backend sale does not yet discount physical goods nor retains the potential for commercial output. | Define transactional sales, declared payments, stock outings, returns and permits as **new block**, preserving E2-5. |
| E25-P06 | P2 | Deferred functionality | `STOCK_INICIAL` is uniquely designed for first projection; `AJUSTE_*` aplica deltas. No existe endpoint de **absolute physical count** that results in difference from the observed balance. | Design counting CU with observed amount, version and difference; clarify if the adjustment is confirmed under revision. |
| E25-P07 | P2 | Deferred functionality | A manual command of E2-5 processes an article; there is no batch adjustment/transfer or item list, nor compensatory reversal of a wrong operation. | Design aggregates with added atomicity and idempotency; include auditably linked counteroperations. |
| E25-P08 | P2 | Documentary consistency | Historical documents E2-5 A/B/C can still indicate "to be merge/validated Windows". Cumulative headings of Document 05 cite earlier stages. | Add **current status index** closing and references to evidence, without deleting the history of the previous increase. |
| E25-P09 | P2 | Role Security/QA | The Swagger session was with QA headline; the tests were `ENCARGADO`, `TRABAJADOR`, assignments, alien tenant and careers are mainly automated, not manual. | Independent audit of permissions, sessions, revocation and reading paths; generate ephemeral test tenants. |
| E25-P10 | P2 | Scope IU and integration | React has DEMO screens; no productive integration was tested React ↔ API E2-5, session handling, load/error/network in interface. | Gateway API/React state phase by company, obsolete response control and E2E. |
| E25-P11 | P2 | Warning de CI | C en `main` happened with warnings of pytest (4 in Python 3.12, 2 in 3.14). They are not faults, but they were not reviewed in detail at this closure. | Classify each warning and its impact before declaring a zero-warning policy. |
| E25-P12 | P3 | Reproducibility | Manual tests are reported as codes and conversation responses; there is no independent execution video/artificial or signed DB snapshot. | In formal auditing, repeat about an ephemeral environment identified with SHA and record healthy results. |

## 2. Observations that should NOT be transformed into bugs without evidence

- El `422` initial when registering a purchase with `quantity_milli=1` for `UNIDAD` indica **correct validation**No miscalculation.
- El `401` when trying initial stock without header Bearer indicates **missing authorization/disabled meeting**; the authenticated retry was `201`There's no evidence of stock failure.
- The lack of `STOCK_INICIAL` at a location that **ya** received merchandise is intentional behavior; it is not a defect.
- A zero amount balance **registered** and the absence of balance are different states, by design.
- Un `200` Repeating a POST does not mean a second operation: the voucher/movement IDs did not change.
- The absence of actual sale/box in E2-5 is not a regression of the inventory: it is scope of another block.

## 3. Decisions proposed before the next development

1. **Approve/correct the scope of E2-5** and not expand it inadvertently while you check.
2. **First classify audit findings** about permissions, invariants SQL, attendance and documentation, with reproducible evidence, before deciding refactor.
3. **Do not rewrite already applied migrations**. If an upgrade needs additional SQL, design new and compatible migration.
4. **Do not create other editable stock source** by screen or write balances directly from frontend.
5. **Keep exact amount in millis, pennies** and retry behaviour by company/actor/body.
6. **Do not prioritize automotive sales**: first evaluate if there are P1 findings of E2-5 and agree on the MVP sequence.

## 4. Units for a formal audit

It is recommended to fix: exact commit, only E2-5 A–C range, previous base E2-4 as dependency, delivery and documents 01–05, ADR-004, test/service files and this evidence QA sanitized. The existing general guide is `docs/revisiones/GUIA_MAESTRA_REVISION_BLOQUES_E2_ASISTENTE_PYME.md`. **The specific custom document is now ready** en [E2-5_ENTREGA_PARA_REVISION.md](../E2-5_ENTREGA_PARA_REVISION.md) y [E2-5_AUDIT/](../E2-5_AUDITORIA/00_LEEME_Y_PRECONDICIONES.md)but **not approved, sent or executed**; the closure must be reviewed and published before delivery.

## 5. Repropriation v1.1 following external review assisted by AI

This review **is not evidence of new bugs reproduced**. For each proposal, the classification, priority and acceptance/rejection are explained in [13_EVALUATION_OBSERVATIONS_IA.md](13_EVALUACION_OBSERVACIONES_IA.md)The following works are incorporated with limited scope:

| ID | Proposed priority | Work and decision |
|---|---|---|
| E25-P13 | P1 before production | Review **real privileges of the SQL runtime role** and the immutability mechanism of `stock_movements`/operations, compatible with migration and test cleaning; not assert that single triggers block the DBA/superuser. |
| E25-P14 | P1 before multi-user operation | Designing policy for **negative decreases**: revision/umbral per tenant/rol, logbook of approvals and separation of functions; do not fix ARS 500 arbitrary or proven fraud. |
| E25-P15 | P2 | Propose `reason_code` stable + undelete observations `reason` history; their classification and migration must be compatible. |
| E25-P16 | P2 | Design **related compensatory reversal** to the original operation, with FK tenant and quantity control available, without editing historical leader. |
| E25-P17 | P2 for integration IU | Messages from `409` with stable error codes (evaluate **RFC 9457**), refresh balance/version and allow deliberate re-trying of the user; retain contract until agreed evolution. |
| E25-P18 | P2 | Add Tests for **intercalation transfer vs. adjustment at same destination** and saturation/overflow cases; do not attribute a non-reproductive stock loss bug to E2-5. |
| E25-P19 | P2 subject to actual use | Evaluar tope `quantity_milli <= 999999999` per operation; if it limits bulk items, redesign API, model and SQL boundaries together without fragmenting a business transaction arbitrarily. |
| E25-P20 | P2 en RF-05 | Evaluate partial/multi-destiny reception, remaining quantity traceability and 30 line limits; change model with new migration, do not edit applied E2-4. |
| E25-P21 | P2 en RF-05 | Evaluate explicit currency/rate snapshot and reconciliation of `HALF_UP` **per line**, preserving the existing monetary contract until decision. |
| E25-P22 | P2 only if reservations are required | Study stock reserves linked to order with maturity/idempotency for future RF-07. A sales debit **conditional atomic** can avoid overselling even without `reserved_milli`; booking is another business requirement. |

**Not to adopt:** impose `expected_version` mandatory at both ends of each shipment without justification for contractual change; `STOCK_INICIAL` balance 0 with history; replace `Session` synchronous for example `AsyncSession` non-coded; change `409` por `422` indiscriminately; remove limit of 30 lines without size/atomicity policy; apply `total_cents` rounded in aggregate while lines are rounded separately without a conciliation rule.


## 6. Relationship between duplicate debts to avoid redundant implementations (v1.2)

- **SQL integrity:** `E25-P03` is the initial risk; `E25-P13` develop a mitigation proposal. **It's just one family at work.**Not two independent features.
- **Countervailing transactions:** `E25-P07` grouping processes by lot and reversal as general debt; `E25-P16` specify the related reversal. If approved, **unify in a single reversal requirement**independent of batch work.
- **Ledger reconciliation/salts:** `E25-P04` is a problem other than SQL permissions of `P03/P13`: detect divergences does not replace prevent alteration and vice versa.
- **RF-07:** `E25-P05` covers confirmed sale and atomic output; `E25-P22` evaluates reservations only if orders or carts are approved. **These are not interchangeable requirements.**
- **Error presentation:** `E25-P17` corresponds to the frontend integration contract and should not be corrected by changing HTTP 409 massively to 422 without versioning.

**Do not open five PRs on the same root cause**: the auditor must cross-check these IDs, provide evidence and propose plan/ADR with acceptance criteria before modifying the backend.
