# E2-6 — Independent audit protocol and selective decision

**Audited branch:** `feature/e2-6-ventas-integradas`  
**Authorised scope:** sales files, added evidence, contracts, migration E2-6 A and its direct dependencies in locations/catalogue/inventory.  
**Initial base:** `c5d26628166e55f75016a92c847a106f563b4474`.  
**Status:** call and evaluation matrix prepared. **It does not represent an audit carried out or approved.**

## Instructions for the independent auditor

1. Leer diff completo de `main...feature/e2-6-ventas-integradas`, together with current sales, stock and purchase/reception/transfer/adjustment contracts.
2. Evaluate **before** to propose changes if it breaks isolation by tenant, effective authorization, non-changeability of trade, atomity, idempotency or stock conservation.
3. Identify concrete steps to reproduce findings, with route and line, scenario, observed/expected result and severity founded.
4. Review competition on **two real PostgreSQL connections**including interspersions between sale and reception/transfer/adjustment, not only tests with external transaction.
5. Evaluate payload limits, Pydatic validators, SQL exceptions, indexes, schema restrictions, business-to-business information leak and HTTP code consistency.
6. Contrast all claims with existing evidence; do not consider the amount of evidence as a demonstration of bug absence.
7. **Do not edit code or `main`.** Deliver verifiable findings and proposals, not automatic re-implementation.

## Mandatory format of each finding

| Field | Required content |
|---|---|
| ID | AUD-E26-001, etc. |
| Severity | Blocker / High / Medium / Low |
| Evidence | File, lines, input/reproduction, impact |
| Rule breached | Tenancy, permits, stock, power, payments, history, etc. |
| Minimum proposal | Restricted change, dependencies and risks |
| Proof of acceptance | Unit test/integration/concurrence that fails before and passes after |
| Review decision | Accept / Adjust / Defer / Reject |
| Reason | Technical justification and compatibility |
| Correction Committee | SHA if incorporated |
| Verification | Focused result, regression, Alembic and CI |

## Pre-PR slope matrix

- [ ] Get a truly independent audit.
- [ ] Register **all** the findings and their decision, even those rejected.
- [ ] Correct blockers/highs accepted with reproduction and regression tests.
- [ ] To explicitly defer what exceeds MVP, without hiding it.
- [ ] Ejecutar `alembic current`, `alembic check`, `pytest -q` con `RUN_DB_INTEGRATION=1` on a temporary basis.
- [ ] Check final SHA CI in Python 3.12/3.14 and Docker.
- [ ] Inspect diff and branch status; confirm `main` no change in this delivery.
- [ ] One PR of E2-6 and one merge, with express approval of the closure.

## Adoption rule

Do not introduce changes by abstract style, preference or "best practices" if they affect the compatibility of MVP without a specific defect or gain. Priority: security/tenant, data integrity and atomity, idempotency, contractual consistency, testing, maintenance. Any accepted correction must have specific test and evidence of the result. Do not modify previous stages without scope authorization.
