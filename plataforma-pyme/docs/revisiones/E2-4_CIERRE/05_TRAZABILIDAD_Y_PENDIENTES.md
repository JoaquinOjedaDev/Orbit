# E2-4 — Traceability, Evidence and Backlog Matrix

**Classifications:** AS-IMPLEMENTED (executable code), QA-MANUAL (swagger response provided by the developer), CI-VERIFIED (run of GitHub checked), TO-BE (design), DIFFERED (not implemented). A requirement label does not automatically convert all its functionality into realized.

## 1. Requirements, use cases and evidence

| RF/CU | Contract implemented | Source file | Evidence/evidence | Status |
|---|---|---|---|---|
| RF-05 / CU-06 | High, query, editing and status of Supplier by company | `modules/suppliers/{router,service,schemas}.py` | CI A/B; suites `test_supplier_*` | AS-IMPLEMENTED + CI |
| RF-05 / CU-06 | Optionally associated purchase fee for Supplier; lines, snapshots, totals | `modules/purchases/{router,service,schemas}.py` | U-01/U-07, CI D | AS-IMPLEMENTED + QA-MANUAL |
| RF-05 / CU-06 | Purchase power, different collision and GET/listing | `purchases/service.py`, `purchases/router.py` | U-02 to U-05; attendance tests/HTTP | AS-IMPLEMENTED + QA-MANUAL |
| RF-05 / CU-07 | Unique and complete reception to STORE location | `purchases/receipt_service.py`, `receipt_router.py` | U-12/U-13/U-14, CI E | AS-IMPLEMENTED + QA-MANUAL |
| RF-06 / CU-08 (partial) | Current balance by company/location/article | `purchases/inventory_router.py`, `stock_balance.py` | U-15/U-16, stock test | AS-IMPLEMENTED (parcial) |
| RF-06 / CU-08 (partial) | Ledger of entries with traceability | `purchases/inventory_router.py`, `stock_movement.py` | U-17, tests de ledger | AS-IMPLEMENTED (parcial) |
| RF-03 / CU-04 (dependencia) | Locations `ACTIVA`, `can_store`, allocation | `modules/locations/` y `purchases/receipt_service.py` | U-08/U-09/U-10, integration | AS-IMPLEMENTED |
| RF-04 / CU-05 (dependencia) | Physical catalog, status, unity and historical protection | `modules/catalog/service.py` | U-06, E integration, IC | AS-IMPLEMENTED |
| CU-09 / transfers | Origin/destiny movement and 2 balances | No existe endpoint E2-4 | No execution | DIFFERENT |
| CU-11 / ajustes | Manual adjustment signed and voucher | No existe endpoint E2-4 | No execution | DIFFERENT |
| RF-07 / CU-10 (sales) | Sale/box and outflows of stock | No existe endpoint E2-4 | No execution | DIFFERENT |

Consult academic documents `entrega-programacion-2/01`–`05` The UML 03B contains broader conceptual design than this cut: not attribute attributes or operations to the code that have not yet been implemented.

## 2. Non-negotiable security and transaction contracts

1. `business_id` and permits are verified in the backend for each operation; a global identity does not give a global role to all companies.
2. Purchase has no physical effect until reception; concepts/services do not generate stock.
3. The reception is complete, atomic and by a STORE location, with only one entrance per physical line.
4. Never re-enter the same document for using a new key. Exact retry of the same actor and body plays response, without altering balance.
5. Composite FK restrictions and historical records should not be removed in future extensions.
6. Keep whole cents/thousandths and HALF_UP rule per line as long as the current contract does not change.
7. Tests should isolate documents/enterprises in their queries without relying on a global row count.
8. A change of contract requires additive version/migration and testing; do not edit already applied migrations.

## 3. Priority backlog (proposed; no new E2-4 functionalities)

| Guidance priority | Work | Reason and future acceptance criteria |
|---|---|---|
| P1 before destructive testing | **Insulated test database** | `RUN_DB_INTEGRATION=1` never connect to DB development/production without explicit name separation and protection/URL; create ephemeral DB and migrate it |
| P1 for actual operation | Commercial cancellation | Define transition `REGISTRADA→CANCELADA` and authorization/idempotency. Do not cancel a purchase `RECIBIDA` by simple change of status |
| P1 to correct real errors | Compensation or adjustment of the reception | Do not erase the original movement; generate controlled counteroperation, preserve non-negative and motive |
| P1 for deployment | Permissions and SQL movement immutability | Rol runtime without privilege of UPDATE/DELETE ledger, restricted DBA access, audit and trigger evaluation |
| P2 according to business need | Partial reception 1:N/multidestiny | Redesign by line/quantity pending and receipt voucher, guarantee additive migration without breaking the existing complete reception |
| P2 commercial | Currency and historical exchange rate | ISO code 4217 + fee/date/source of exchange; clarify currency in purchase and reports |
| P2 commercial | Rounding reconciliation | Adjustments for voucher/taxes/discounts without changing historical line cost |
| P2 scale | 30 line limit | Batch import with protection from abuse, atomism and reading pagination |
| P2 integrity | Reconciling leadger and balances | Difference reporting, secure actions against external SQL manipulation, without manually setting in silence |
| QA documentation | Full CRUD Manual Suppliers | Registrar POST/GET/PATCH/PATCH status sin exponer credenciales |
| P3 experiencia dev | Parametrized HTTP requests | Collections .http/Bruno with ephemeral local tokens and keys; do not cover secrets |
| P3 | Frontend React connected to API | DTO contract, session, tenant status and E2E tests |
| Future | Sales, transfers, expenses, cash, MP/QR | Other blocks with use cases and independent security |

The order expresses technical risk, not approved product decision. Prioritize under the plan of the TP.

## 4. Status of external review received

Third party comments are classified and answered in `10_OBSERVACIONES_DE_AUDITORIA_Y_DECISIONES.md`. **Not complete independent audit test**E2-4 is functionally closed for the scope implemented, not for production.
