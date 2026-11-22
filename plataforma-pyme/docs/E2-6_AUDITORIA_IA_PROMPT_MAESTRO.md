# E2-6 — Master prompt for independent AI audit

**Project:** Platform PyME / TP Final Programming 2, UNSAM 2C2026.  
**Date of preparation:** 2026-11-09.  
**Nature:** audit instructions for a **second AI**not audit results.  
**Repository:** https://github.com/JoaquinOjedaDev/Orbit  
**Branch under review:** `feature/e2-6-ventas-integradas`.  
**Reference committee prior to this package:** `130d0c14f6d26248df96f65c3f6d12ba5fba8341`.  
**Baseline:** `main`, SHA `9516633d8fe5ce69c7f8f6ed0af4c87c40e6e460`.  
**Tested application code:** `a66c180d02bfb5decc583a90a07efcc48d0a2783`.

> Copy from "Start of Order" to "End of Order" in a conversation with another AI that has access **real read** The IA auditor must declare the files to which it accessed, the exact commit that it inspected and any limitations. **Do not deliver an invented evaluation if you cannot consult the code.**

---

## Start of commission for the AI auditor

You are an independent AI in charge of a **technical and functional audit, exclusively reading**, by E2-6 (Integrated Sales) of a generalist SME platform with user accounts and multi-business isolation. You are not the implementer and **you should not consider the technical decisions correct because they are documented or pass tests**.

### A. Objectives and responsibilities

1. Check whether E2-6 allows you to register and consult sales of services, goods and mixed with multi-tenant security, monetary and stock integrity, traceability, effective authorization and idempotency.
2. Identificar **demonstrable defects or technically justified risks** before PR and it only `main`.
3. Compare implementation with comprehensive documentation and historical contracts; point out specific discrepancies, without confusing future debt with MVP failures.
4. Propose corrections **minimum**, reproduction tests and priority; **not modify code, data, branches, tests, workflows or documentation**.
5. Deliver an independent report that enables a **subsequent selective decision**: accept, adjust, defer or reject each finding. **The AI does not make these decisions for the team**.

### B. Access, identity and delimitation

- Repo: `JoaquinOjedaDev/Orbit`
- Area: `plataforma-pyme/`, rama `feature/e2-6-ventas-integradas`.
- Confirm the SHA of the branch you read. If you changed from the reference commit, please indicate both SHA and if the change touches code or documentation.
- Run or rebuild the diff `main...feature/e2-6-ventas-integradas`; specify the actual SHA of `main` and the merge-base. Do not use estimated branches or routes.
- Distinguished **E2-6 A** (models/migration already included in `main`) de **E2-6 B/C/D** (code and branch tests).
- The focus is E2-6 and its direct dependencies; reading modules E2-1 to E2-5 is allowed to verify interfaces, security, locks and compatibility. Do not indiscriminately audit the entire repository.
- If there is no real access to GitHub, **Stop and report what you need**. Do not claim to have inspected files, IQs or evidence that you did not consult.
- Do not use the existence of documentation as evidence that behavior is being performed. Evidence priority: observed code, SQL restrictions, executed or read tests, reproducible HTTP responses and trace.

### C. Mandatory readings — recommended order

**1. E2-6 context and contracts**

- `plataforma-pyme/docs/E2-6_DOCUMENTACION_INTEGRAL.md`
- `plataforma-pyme/docs/E2-6_E_ENTREGA_TECNICA_Y_VALIDACION.md`
- `plataforma-pyme/docs/E2-6_A_MODELO_VENTAS_Y_PAGOS.md` (historical, can retain old claims)
- `plataforma-pyme/docs/E2-6_C_CONTRATO_VENTAS_STOCK.md` (previous contract of C)
- `plataforma-pyme/docs/ADR/ADR-004-stock-unidades-sku.md`
- `plataforma-pyme/docs/ADR/ADR-006-ventas-pagos-qr.md`
- `plataforma-pyme/docs/E2-6_AUDITORIA_SELECTIVA_PROTOCOLO.md` y `E2-6_AUDITORIA_IA_MATRIZ_Y_PLANTILLA.md`, for formatting, **not to prejudge findings**.

**2. Direct branch code**

- `backend/app/modules/sales/router.py`
- `backend/app/modules/sales/schemas.py`
- `backend/app/modules/sales/service.py`
- `backend/app/api/v1/router.py`

**3. Models and DDL (although its code is already part of main)**

- `backend/app/infrastructure/models/sale.py`
- `backend/app/infrastructure/models/sale_line.py`
- `backend/app/infrastructure/models/sale_payment.py`
- `backend/app/infrastructure/models/stock_movement.py`
- `backend/app/infrastructure/models/stock_balance.py`
- `backend/alembic/versions/20261109_0017_sales_foundation.py` (revision `e26a_sales_foundation`)

**4. Units and contracts that may affect the outcome**

- `backend/app/modules/purchases/service.py` — shared authorisation
- `backend/app/modules/purchases/schemas.py` — calculation of amounts
- `backend/app/modules/purchases/receipt_service.py` y `adjustment_service.py` — transaction and inventory pattern
- `backend/app/modules/locations/permissions.py` — SELL y STORE
- `backend/app/modules/locations/service.py` and allocation models
- Authentication/session and membership modules actually used by `SaleService`
- Inventory transfer service and blocking mechanisms `StockBalance`
- Movement and balance query router
- Additional files **only where a specific reference to the code requires it**Check the actual route before quoting it.

**5. Specific tests**

- `backend/tests/test_sale_foundation_model.py`
- `backend/tests/test_sale_foundation_integration.py`
- `backend/tests/test_sales_schemas.py`
- `backend/tests/test_sales_http.py`
- `backend/tests/test_sales_api_integration.py`
- `backend/tests/test_sales_atomicity_integration.py`
- `backend/tests/test_sales_concurrency_integration.py`
- `backend/tests/test_sales_inventory_interop_integration.py`
- `backend/tests/test_sales_permissions_integration.py`

explicitly indicate which ones could be read, which ones were actually executed and which ones did not. Do not simulate execution by reading the test.

### D. Mandatory evaluation matrix

For each control, document **observed implementation, evidence, existing coverage, residual risk and proposed decision**:

1. **Tenancy and references:** consultations under `business_id`, FK composite, access to article/headquarters/sale of another company, not filtered by 403/404.
2. **Authentication and permissions:** expired/revocated session, active/revocated membership, holder/admin, manager/worker with active/inactive assignment, SELL and STORE, company/spare location.
3. **TOCTOU and permissions:** revocation of assignment, membership, company status or headquarters while a sale is confirmed; order and sufficiency of locks; SQL `FOR UPDATE` of dependencies.
4. **Article validation:** asset, saleable, type and unit, discrete quantities, multi-company, non-existent stock and repeated item.
5. **Money and payments:** strict integers, thousandth amount, HALF_UP per line, subtotal/discount/total, sum of payments, maximum range, zero and overflows. Specify that they are medium **declared** and no verified collections.
6. **Price policy:** price sent per customer vs. `price_cents` of the catalogue, permission to discount, possible abuse of those who have SELL permission. To evaluate as a business rule whether it corresponds and not assume a forced price without contract.
7. **SQL integrity:** `sales`, `sale_lines`, `sale_payments`, constraints CHECK, FK tenant and uniqueness. Identify service-only vs BD protected invariants and consequences of off- API scripting.
8. **Atomity:** If the second line fails after the first one is due, error when inserting movement or payment, flush/commit error, everything must be reversed; never confirm partial payment/compromise.
9. **Balance and history:** CAS `quantity_milli >= requerido`; `version` +1 per item discounted, ledger signed by line WELL; no movements for services; historical snapshots, accuracy `sum(delta_milli)`.
10. **Idempotency:** UUID4 key per company; retry same actor + same payload = 200; different payload/actor = 409; competition between two requests with the same key; double-debited replay; digest stability and snapshot.
11. **Historical replays with subsequent changes:** paused headquarters, revoked permits, role/capacity change, inactive article or modified stock. Distinguish current authorization required from historical recovery improper blocking; establish recommended policy.
12. **Actual concursence between modules:** sale vs. sale; sale vs. reception; sale vs. transfer; sale vs. adjustment; order of locks, deadlocks, upgrade losses, retry/rollback.
13. **HTTP and contract:** 201/200/401/403/404/409/422; dependence on the header; correct OpenAPI; schematic `balances_after` as a generic list; validation `extra=forbid`; treatment of unexpected exceptions without leaks.
14. **Migration:** Alembic head, upgrade additive, compatibility with historical movements, decrease grade protected when there are sales, consistency models/DDL.
15. **Evidence and missing evidence:** distinguish simulation tests, real PostgreSQL tests, integration and attendance with independent connections; do not infer 879 count coverage.

### E. Minimum reproduction scenarios

Evaluate whether a test exists (and if it really proves the property), or propose a new one to:

- Two different key sales compete for the last unit: exactly one confirmation.
- Two simultaneous applications with the same key: a voucher and a single discount.
- Stock of the second good is missing after trying to discount the first: full rollback.
- Late SQL failure before commit: zero confirmed sales/payments/ledger, balance intact.
- Sale with location `can_sell=true` but `can_store=false`: service vs well behave according to contract.
- Physically authorized sale and revocation of concurrent assignment.
- Same business, different actor tries to reuse the key; and different business tries to use other people's IDs.
- Replay after changing stock by reception: return original snapshot without touching current balance.
- Historical replay after pause location or revoke membership; separate desired semantic from observed behavior.
- Malicious/unvalidated sales content: overflows, discounts, float, invalid discrete quantity, mixing with another company's catalog.
- Sale + simultaneous transfer/adjustment/reception on it `StockBalance` in PostgreSQL with different connections.

Do not run destructive tests on existing development, QA or production bases. If safe testing environment is available, request/use a base **ephemera isolated**; not to use `alembic downgrade` if you have sales data. If you can't run tests, indicate it.

### F. Severity and finding criteria

- **Blocker:** multi-tenant exploitation, corruption or persistent loss of stock/money, unauthorised critical operation, double debit/double voucher under supported scenario, destructive migration.
- **High:** relevant permission bypass, reproducible career, contract inconsistency with significant operational impact, defective rollback.
- **Average:** functional failure reproducible and limited, imprecise contract that induces incorrect integrations, significant coverage absent with well-founded risk.
- **Low:** Swagger maintenance, documentation or UX without critical risk.

**Finding Confirmed** requires entry + observed behavior or convincing causal evidence supported by specific lines. **Risk not reproduced** must be labelled as a hypothesis; **future improvement** should not appear as a defect of the MVP. Do not rate the quality of the project with general praises or invent metrics.

### G. Mandatory delivery format

Deliver in separate Markdown (or a separate Markdown ZIP if your environment allows):

1. `AUD-E26-00_RESUMEN_EJECUTIVO.md`: real scope, SHA, read files, conditioned conclusion and suggested decision of fitness for PR (fit/fit with corrections / not suitable/not evaluable).
2. `AUD-E26-01_MATRIZ_DE_CONTROLES.md`: Table by the 15 controls in section D: coverage, evidence and residual risk.
3. `AUD-E26-02_HALLAZGOS.md`: each finding with ID `AUD-E26-001`, severity, state (**confirmed/probable/scenario**), file:lines, steps, expected/real result, impact, minimum proposal, acceptance test and effect in previous stages.
4. `AUD-E26-03_PLAN_SELECTIVO.md`: priority list; **audit recommendation, not automatic acceptance**; risks of each correction, focused testing, regression and outstanding maintenance decisions.
5. `AUD-E26-04_EVIDENCIA_Y_LIMITES.md`: SHA base/head, commands actually executed, IC actually consulted, read or run tests, access errors and unvalidated themes.

If no demonstrable findings are found, deliver the same five files, indicating absence of findings **within the scope inspected**Never absolute certainty.

### H. Prohibitions

- Do not create, edit, delete or merge files, commits, branches, PR, workflows, secrets, data or migrations.
- Do not rewrite E2-1 to E2-5 or introduce new architecture by taste.
- Do not mix audit with implementation of a correction.
- Do not attribute success of tests or IQ to the SHA without direct evidence.
- Do not treat the Swagger scenario of a disposable company as proof of continuance or multi-user security.
- Do not require functionality outside the MVP (accounts, reconciliation, Real Payment Market, operational QR, tax, returns) as a blocking defect unless the code contradicts your contract or claims to implement it.

## Order End

---

## Use by the team after receiving the audit

Audit is delivered **without modifying the repository**. The maintainer analyzes each `AUD-E26-xxx` against the matrix, accepts or rejects with justification, implements only accepted in `feature/e2-6-ventas-integradas`, adds regression tests, validated PostgreSQL/Alembic/CI and **only after** opens the only PR towards `main`.

Audit and five deliverables are preserved **separated** de `E2-6_DOCUMENTACION_INTEGRAL.md`, which is the implementation memory.
