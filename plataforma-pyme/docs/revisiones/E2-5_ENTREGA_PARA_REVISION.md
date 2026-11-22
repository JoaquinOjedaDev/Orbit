# E2-5 — Formal delivery sheet for independent technical audit

**Project:** Orbit — Programming 2 (UNSAM, 2C2026)  
**Scope of code:** E2-5 A, B and C — physical inventory, transfers, adjustments, initial stock and common leader.  
**Status of this sheet:** **PUBLISHED AS A CHARGE OF INDEPENDENT AUDITOR**; the audit has not yet been conducted and there is no automatic merge authorization.  
**Date:** 09/11/2026.  
**Repository:** https://github.com/JoaquinOjedaDev/Orbit  
**Exclusive route:** `plataforma-pyme/`; functional branch of origin `main`.  
**EXACT SHA code E2-5 C:** `748e69319d8d04900c009d5184168a264a9deeac`.  
**SHA previous base of E2-4:** `1a188f9a596f4674ca121806ecb92e6a96abf294`.  
**Functional change range:** `1a188f9a596f4674ca121806ecb92e6a96abf294..748e69319d8d04900c009d5184168a264a9deeac`.  
**SHA closing documentary published by PR #24:** `c66df2f8ddaa8179ca12e342bd3099348bc6b155` (original publication; also verify real HEAD at the start of audit).  
**Suggested branch for the auditor:** `review/e2-5-inventario`, create it from the **main documental ya publicado**, recording in its report the SHA of the document received and the functional code analyzed.

> **Precondition satisfied:** the PR documentary #24 was merged into `main` al commit `c66df2f8ddaa8179ca12e342bd3099348bc6b155`. Ese es el **Original closure release SHA**. The auditor must also register the `main`/rama in effect at the beginning, because later documentary corrections may exist, and compare backend to frozen functional SHA.

## 1. What is given and what is the source of truth

Two different baselines are delivered: **functional code E2-5 to frozen SHA** y **closing documents issued to the original documentary commit `c66df2f8ddaa8179ca12e342bd3099348bc6b155`**. Documentation is a guide and an evidence collection; it does not replace inspect routers, services, ORM, SQL or run tests. If a historical document describes "pending merit", that state refers to the date of its writing, not the functional cut.

The internal report of [closure E2-5](E2-5_CIERRE/00_LEEME.md), la [evaluation of external observations](E2-5_CIERRE/13_EVALUACION_OBSERVACIONES_IA.md) y [this specific audit plan](E2-5_AUDITORIA/00_LEEME_Y_PRECONDICIONES.md) **are not independent audit results**. The reviewer should not copy the internal conclusions as proven findings or stop investigating hypotheses because they are labeled P2.

## 2. Increases and PR to be verified

| Cut | PR | Merge SHA en main | Work implemented | Suite CI final (Python 3.12 y 3.14) |
|---|---|---|---|---|
| **A** | #21 | `4268846abc524ebd827b4da930ef58d8d9789ac7` | Model `inventory_operations`; ledger signed with origin and FK/CHECK; migration `e25a_inventory_ops` | **816 passed** each version, 3/3 jobs |
| **B** | #22 | `4f992b3beb8dda732e4cd752f828b375f240e13d` | Atomic transfers, 2 events and common motion reading; same SQL schemas | **826 passed** each version, 3/3 jobs |
| **C** | #23 | `748e69319d8d04900c009d5184168a264a9deeac` | `STOCK_INICIAL`, `AJUSTE_ENTRADA`, `AJUSTE_SALIDA`version and idempotency | **840 passed** each version, 3/3 jobs |

Runs de `main`: A 42601062105 · B 42604071018 · C 42617212795.  
Windows provided by developer for C: **840 passed in 110.89s**, `alembic current = e25a_inventory_ops (head)`, `alembic check` without drift, healthy API and PostgreSQL. **Do not confuse these historical executions with tests made by the auditor.**

## 3. Technical scope allowed

**To thoroughly audit and correct only proven defects of this block**with the permission of the master guide and in its own branch:

- `backend/app/infrastructure/models/inventory_operation.py`, `stock_balance.py`, `stock_movement.py`.
- `backend/alembic/versions/20261109_0016_inventory_operations.py` **read only, being migration already applied**; any modification of the scheme requires **new additive migration** and approval when altering contract.
- `backend/app/modules/purchases/{transfer_router,transfer_service,transfer_schemas,adjustment_router,adjustment_service,adjustment_schemas,inventory_router}.py`.
- `backend/app/modules/purchases/{receipt_service,receipt_router,receipt_schemas,receipt_repository,service,schemas}.py`only **as regression dependence E2-4**.
- `backend/app/modules/locations/permissions.py`, `backend/app/modules/auth/` y `backend/app/modules/businesses/repository.py` **only to verify authorisation and locks**; functional changes outside the block require prior decision.
- Tests `test_inventory_operation_*`, `test_transfer_*`, `test_adjustment_*`, receipts test and base tests per tenant. Store regression suites.
- `plataforma-pyme/docs/E2-5_A_MODELO_OPERACIONES_INVENTARIO.md`, `E2-5_B_TRASLADOS_ATOMICOS.md`, `E2-5_C_AJUSTES_Y_STOCK_INICIAL.md`, documentary closure, and relevant academic documents.

**Do not touch:** frontend React DEMO, sales/payments/box, Market Payment, financial accounts, permits outside the inventory, existing QA data, previous migrations, other subprojects of the repository `.env`/credentials. No reservations, partial receptions or multi-currency to “improve” the audited block.

## 4. Requirements and rules to be tested, not assumed

**RF-06 / CU-08:** Tenant and location ledger balance and reading, filters/pagination, reception compatibility.  
**RF-06 / CU-09:** different origin/destination transfer, both locations `ACTIVA`/`can_store`, permissions, non-negative stock, 2 zero sum moves and single commit; identical replay 200 and conflict 409 without doubling.  
**RF-06 / CU-11:** initial single per pair without previous history, holder/admin; positive/negative delta adjustment only on existing balance and exact observed version; mandatory motive; not negative; actor and historical proofs.  
**RF-03/CU-04, RF-04/CU-05, RF-05/CU-07** as dependencies: STORE permits, physical items and receptions. **RF-07/CU-10 Unimplemented Backend Sale**: not to attribute it to E2-5.

Every command holds `business_id`, UUID4 idempotent, actor, motion signature, valid unit/quantity, transaction and rollback. The balance version changes with receptions/transfers/adjustments; **transfer does not require expected_version by contract**Tokens. **Revocable session opaque Bearer, not JWT**.

## 5. Mandatory audit questions

The reviewer must check code, tests and extreme cases at least on: (i) sequence of locks between users/sessions/company/locations/catalogue/salts; (ii) intertenant and RBAC leak in POST, GET and operating replay; (iii) idempotence with the same key+body, different load/actor/type and simultaneous requests; (iv) fallback to non-existent balance and zero existing balance; (v) single source SQL compatibility, type, sign, address and quantity, including direct insertions only on ephemeral basis; (vi) saturation of balance and whole limits; (vii) rollback under error midcommand, run windows with receptions and transfers; (viii) uncouple between documentation, UML and code. See [full matrix](E2-5_AUDITORIA/01_MATRIZ_AUDITORIA_E_INVARIANTES.md).

**The issues of another AI are a non-binding agenda:** not diagnose corruption by a `409` If a serious failure occurs, the Commission will be able to take the necessary measures to ensure that the aid is not granted. **reproduced**document it with priority and proof; new policies require team decision.

## 6. Environment and safety

The local suite has been run with PostgreSQL development in the past. **Do not run integration/destructive tests or SQL test against the developer's or production base**. Use an ephemeral/dedicated QA PostgreSQL 16, unpublished credentials and a failed destination control before you put `RUN_DB_INTEGRATION=1`. Concurrent tests create and eliminate temporary tenants: review your fixtures and cleaning limits.

Do not order tokens Bearer, passwords, retry hashes or secrets in reports or PR. Document only entries **Sanitized** and results; use resource aliases if possible. `docker compose down -v`, `alembic downgrade`, `stamp`, `TRUNCATE`, `DROP` ni `DELETE` without any restriction or approval.

## 7. Mandatory deliverables from the auditor

1. Confirmation of access to the real code, exact functional SHA, effective documentary SHA, branch and ambient conditions.
2. Matrix RF/RN/CU → path/method → model/SQL → tests → status.
3. Report **`plataforma-pyme/docs/revisiones/E2-5_INFORME_DE_REVISION.md`**, in its branch, with findings `REV-E2-5-001...`, P0–P3 priority, reproducible evidence, risk and decision.
4. Corrections **and justified** only when confirmed block defects. Each change: minimum diff, new/regression tests and consistent documentation. If no change is required, report “no code changes” as complete.
5. Test results actually performed by the auditor (commands, Python/PostgreSQL/Alembic, SHA, warnings, CI), differentiated from historical run.
6. Backlog of uncorrected issues, API/DDL/UML impacts, missing tests and conditions to accept merit.
7. Open **PR of the reviewer to `main`**, with its own branch, versioned report and summary of modifications. **No fusionar** or touch `main` directly.

**Mandatory guide:** [GUIDE_MAESTRA_REVISION_BLOCKS_E2_ASSISTENT_SMEs.md](GUIA_MAESTRA_REVISION_BLOQUES_E2_ASISTENTE_PYME.md).  
**Audit documentation and staffing table:** [E2-5_AUDIT/00_LEEME_Y_PRECIDITIONS.md](E2-5_AUDITORIA/00_LEEME_Y_PRECONDICIONES.md).  
**Closing criterion:** independent technical review and regression approved; final acceptance by the team, not by the auditor/IA automatically.
