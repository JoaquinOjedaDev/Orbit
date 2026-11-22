# E2-5 — Critical assessment of observations from another AI (no code refactor)

**Date:** 09/11/2026. **Status:** internal technical evaluation and verification plan, **no** independent audit and new evidence executed.  
**Reference code:** `main`, SHA `748e69319d8d04900c009d5184168a264a9deeac`; E2-5 A/B/C, PR #21, #22 y #23.  
**Source of comments:** two texts provided by the developer on 11/9/2026, which raise continuance, initial stock, reversal, traceability, trade limits and security controls. **proposals, not as confirmed bugs**and confront with services, schemes, migrations and tests of `plataforma-pyme/backend`.

## 1. Executive opinion

**The closed functional closure of E2-5 A–C is maintained:** IC/QA evidence exists for the implemented commands. **does not demonstrate** In their examples a negative balance, duplicate movement or loss of update. It provides, however, risks for real operation and future extensions that must become design decisions or reproducible tests. There is no justification to modify the applied migrations, HTTP contracts or QA balances from these texts.

Do not adopt by inertia the ‘P0’ labels of the revision: a P0 requires a reproducible critical failure, not the coexistence of correct serialization and version control mechanisms. The limit of this document is **analyze and prioritize**, without certification of production.

## 2. Observation matrix, contrast and decision

| ID | External observation | Contrast with implementation | Proposed classification/priority | Documentary decision |
|---|---|---|---|---|
| **OBS-01** | Transfer does not have `expected_version` at both ends and compete with settings | `TransferService.transfer` blocks both locations in UUID order, conditionally debits origin and credits destination with UPSERT + version increase. `AdjustmentService.adjust` lock location and balance and validate `expected_version`. A changing version generates **409 expected**, no lost writing proved. | Risk of UX/additional coverage, **P2**; **no P0 bug demonstrated** | Maintain behavior; document rereading and create specific cross-race testing |
| **OBS-02** | Allow new `STOCK_INICIAL` if recorded balance reaches 0 | The initial historical uniqueness is a **deliberate rule**: zero balance with history does not amount to an item never initialized. Backend and tests reject it. | Proposed semantic change, **no bug** | **Do not change**; resupply by reception/transfer/input adjustment. Propose different absolute physical count |
| **OBS-03** | Lack of reversal or explicit cancellation of wrong transactions | No endpoint to refer and compensate for a previous operation. Separate setting can be recorded, but it does not causally link the error. | **Functional traceability debt P2**, up to P1 if required before production | Design **compensatory operation** with reference to origin, quantity control, version, roles and idempotence. Do not delete or edit the original movement |
| **OBS-04** | `reason` free prevents grouping of decreases by cause | The mandatory 3–500 character motif does leave narrative evidence; it does not offer stable category for analytics. | **Valid improvement P2** | Evaluate `reason_code` type + `reason`/conservation preserved; additive migration, history compatibility |
| **OBS-05** | Maintainer can record negative losses without double approval | `AdjustmentService.adjust` allows `AJUSTE_SALIDA` a holder/admin or `ENCARGADO` assigned with STORE permit; `TRABAJADOR` No. There is actor traceability, but no dual approval or threshold. | **Internal control risk P1 before production**; no fraud proved | Design limits and approval by tenant/rol, audit of revisions and separation of functions. **Do not adopt arbitrary threshold ARS 500,00** example |
| **OBS-06** | Limit of `quantity_milli` per operation | Maximum `999999999` in command and CHECK SQL. In very large physical magnitudes or small mass units you can require partition; no case of client that exceeds it is known. | **Actual limitation of contract P2** by category | Measuring need, designing API+SQL+tests change; not removing limits or artificially splitting an atomic operation |
| **OBS-07** | Sin `reserved_milli` two concurrent sales would cause oversale | Sales `RF-07` they don't exist in backend yet. **La ausencia de reserva NO implica overselling** if the sale is conditionally and atomically discounted. Time reserve is another semantic business. | **Future Unit RF-07 P2**, no bug E2-5 | First define confirmed sale with atomic debit and race tests; add reservations only if orders/carts/reservations are approved with maturity |
| **OBS-08** | Purchases with reception 1:1, no partials/multidestiny | Correct for current E2-4 contract: full and unique reception at a location. It does not constitute regression E2-5. | **Commercial extension RF-05 P2**, outside E2-5 | Analyze `PurchaseReceiptLine` and 1:N through compatible migration, without modifying vouchers already received |
| **OBS-09** | Purchases without currency/historical rate | The current monetary specification of this API sets whole ARS cents; there is no multi-currency support agreed. | **Extension RF-05 P2**, no bug from the ARS trimming | Define price/invoice/payment currency, source/date rate, snapshot policy and compatibility before migration |
| **OBS-10** | Rounding `HALF_UP` per line differs from the global | The purchase contract **explicitly choose** `HALF_UP` by line and subtotal sum. Switching only header to global rounding can generate `total_cents != suma(line_total_cents)`. | **Future trade decision P2**, no implementation error demonstrated | Do not change calculation without validated reconciliation with provider/accounting and accuracy/regression tests |
| **OBS-11** | Ledger no inmune a `UPDATE/DELETE` Direct SQL | API does not publish edit/delete ledger, but a privileged SQL role could modify it. No definitive privilege or trigger configuration was accredited. | **SQL P1 integrity risk before production**, no proven incident | Review DBA/runtime permissions, role separation, DML protection, audit and possible trigger with new migration; consider fixtures/test cleanup and maintenance procedure |
| **OBS-12** | Multiple errors use `409` and do not have stable machine code | HTTP 409 for conflict of status, insufficiency and continuance is defensible. `detail` textual difficulties UX if they are to be analyzed literally. RFC 7807 citation revision; **the current version is RFC 9457**. | **DX P2 Improvement** | Evaluate errors with stable code and format compatible with RFC 9457, retaining codes until versioned/agreement; do not change 409 by 422 indiscriminately |
| **OBS-13** | Limit of 30 insufficient purchase lines for some items | `CreatePurchaseRequest.lines` limits to 30; protects size and cost, but may restrict extensive invoices. | **Contractual limit RF-05 P2** subject to actual case | Measure use, evaluate import/batch/large applications under limits and atomism; do not remove cap without controls |
| **OBS-14** | Example factor a `AsyncSession` y `FOR UPDATE` universal | The project uses SQLAlchemy **synchronous** (`Session`). Already combines atomic locks and SQL operations with location-by-location order. The external pseudocode is not a compatible patch nor does it consider balance as still nonexistent by UPSERT. | **Proposal not directly applicable** | Do not copy it as code. Design any refactors with PostgreSQL contracts and actual tests |

## 3. Concurrence: what is guaranteed and what is missing

### 3.1. Semantic version

`version` is a monotonic number of the **projection by company, location and article**. Transfers, receptions and adjustments affecting the row increase version. In setting, `expected_version` means ‘I decide on the balance I saw’. If a transfer changes that balance before confirming the adjustment, **the rejection by obsolete version is correct even when there would be enough**: the physical difference that was intended to be corrected may have ceased to be true.

It's not right to interpret that `409` The transfer, on the other hand, operates over current quantities and stocks and rejects debit when it is not enough: a photograph of origin/destiny supplied by the operator was not promised in his contract.

### 3.2. Recommended missing evidence

The current suite validates races between **two transfers**, **two adjustments**, **two initializations**, simultaneous replay and an outdated version after transfer. **It is not claimed to include a parallel intercalation specifically between an incoming transfer and an adjustment on the same destination balance.** Add in a future code PR a test with two sessions PostgreSQL/HTTP and barrier confirming:

1. With known previous version, if transfer confirms first, adjustment with old version gives **409**, no new movement; the balance reflects only the move.
2. If setting first confirms with current version, move must observe the result, and both can be confirmed when there is valid stock; versions increase and deltas match.
3. Under any race order, there is never negative balance, double movement or discrepancy between ledger and balances; without `500` ni deadlocks.
4. The test uses only its own ephemeral tenant, without erasing development or production data.

**Not executed** The difference should be visible to the person who audits the block.

## 4. Zero units

Reclassify the ‘initial stock bug’ as **request for UX pending**:

- `STOCK_INICIAL`: unique historic high event for combination company/location/art without previous balance or leader, `expected_version=0`.
- `AJUSTE_ENTRADA`: Adds units to a previous balance, including case of balance 0 and positive version, demanding current reason and version.
- Purchase/reception or incoming transfer: other explicit ways of resupplying the same good.
- **Absolute physical count**: future proposal to introduce observed amount and calculate server signed adjustment; should not be confused with initialization.

If the IU wants to present a common action "Register Count" you can select the correct command **with history/version information** and confirm the user's effects; you must not hide permission changes or derive a `STOCK_INICIAL` zero balance.

## 5. Safety and immutability: avoiding illusory solutions

Un trigger `BEFORE UPDATE OR DELETE` may prevent row mutations in the leadger to a normal role with DML, but **does not guarantee** protection against a base administrator or superuser capable of altering/removing the trigger. Nor does it replace minimum privileges, access audit, backup, migration control and periodic reconciliation.

Before production a compatible plan is recommended that identifies **what role does the API play** and what you need about `stock_movements` e `inventory_operations`; separate the migrator role from the execution role; evaluate triggers/revocations of permits and ensure testing and maintenance without erasing a real history. The solution should consider that the suite of clean contestants only tenants created by their fixtures.

For negative adjustments, double approval avoids some abuses but introduces operating states, pending and consistency requirements. `PENDIENTE_APROBACION` to the current header without designing its transitions, idempotency, permissions and effect on balance. An editable reference cost **is not automatically an auditable financial value** to calculate a threshold; requires cost snapshots or rules per business.

## 6. Acceptance and next steps

It is recommended to maintain this evaluation **next to the documentary closing**, but treat it as a response to external proposals, not as independent audit findings. The proposed changes require:

- Explicit decision of scope and priorities for a subsequent code PR.
- Reproducible acceptance criteria, regression suites and permissions per tenant/rol.
- New additive migration when already applied columns, states or CHECK are affected; do not rewrite `e25a_inventory_ops` ni E2-4.
- Windows + CI PostgreSQL/Python validation before merging any functional changes.
- Separate approval for final closure and **later use of the formal audit commission already prepared, not yet implemented**according to `GUIA_MAESTRA_REVISION_BLOQUES_E2_ASISTENTE_PYME.md`.

**Internal bibliography and source of truth:**
- `backend/app/modules/purchases/transfer_service.py`, `transfer_schemas.py`, `adjustment_service.py`, `adjustment_schemas.py`, `receipt_service.py`, `schemas.py`.
- `backend/app/infrastructure/models/{inventory_operation,stock_balance,stock_movement}.py` migration `20261109_0016_inventory_operations.py`.
- `backend/tests/test_{transfer,adjustment,receipt}*_integration.py`, CI de merge E2-5 A, E2-5 B, E2-5 C.


## 7. Independent process unit (add v1.2)

Critical review of this sheet **should not bias the auditor towards accepting AI's decisions**. La [Form sheet E2-5](../E2-5_ENTREGA_PARA_REVISION.md) y el [independent audit proposal](../E2-5_AUDITORIA/03_PROMPT_MAESTRO_AUDITOR_IA.md) require the auditor to first inspect sources and tests and only then read these observations; it may disagree with evidence. No tests were added or services modified by this documentary evaluation.
