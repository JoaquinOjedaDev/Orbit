# E2-7 · T12-E — Documentary closure, final audit and Stage 2

**Date:** November 11, 2026.  
**Project:** Orbit — Multi-company/multi-rub general management platform (UNSAM, Programming 2, second quarter 2026). WALOS is only an example company.  
**Fixed functional base:** `main` `c6a77137cf82dcb9aad225645e84b1265b1da3ec` (PR #45, T11).  
**Branch and PR documentation:** `docs/e2-7-t12-cierre-academico`, PR #46, DRAFT until express authorization of the merge.  
**Nature of closure:** audit **static and documentary**This does not constitute penetration audit, WCAG evaluation, production certification or comprehensive matching of the TP3 slogan. The status of GitHub Actions was consulted by SHA; CI executions are reported separately and are not attributed to the drafting process.

## 1. Opinion

**T12 DOCUMENTS COMPLIED WITH DISCLOSED RESERVATIONS. APPROPRIATE FOR FINAL HUMAN REVISION OF PR #46; MERGE A `main` NOT AUTHORIZED BY THIS ACT.**

The main gaps that caused a **Documentary NO-GO**: Document 04 obsolete; frontend/backend delivery covers; UML 03A/03B/03C index; second SVG 03B; CHANGELOG; Document 03 and 05 headings. History preserved and respected `plataforma-pyme/`.

**Reservations not hidden:**
1. **IC of the evolving closure:** when T12 started there were no recorded executions for the documentary branch, but after publishing the GitHub act began **tres workflows** (​Frontend, Backend e Inventario REAL full-stack) sobre el commit `a71c946c4070602e91e1439b206ac4e1dcd1f953`event `pull_request`; the last check all three were **IN_PROGRESS, no conclusion**, no PASS. The YAML route filters do not allow to assume that they will not run. A new commit of the minutes changes HEAD SHA and requires checking again; the T11 background does not equal IC of T12.
2. Sources `03A/03B/03C.puml`: its existence and textual structure were verified, **but the compilation with the official PlantUML executable is still not executed** in this environment due to lack of JAR/binary. `PASS`.
3. La **original TP3 tag** was not fully contrasted against each RF/CU; not to claim that all inherited requirements are absorbed. [ADR-008 historical](ADR/ADR-008-integracion-con-tp.md) mentions **≥10 unit tests performed**: the total of 892 Python includes integration tests and **not enough alone** to certify that requirement without classifying cases. The known academic scope implemented is RF-01 to RF-07.
4. Academic development does not amount to a banking/commercial deployment of production: no sales or actual test payments on companies or personal credentials.

These reservations differ from demonstrated bugs: **no new functional bug detected** Because control T12 is documentary and did not run evidence on a database.

## 2. Inventory of deliverables at close

| Delivery | Main file | Outcome |
|---|---|---|
| T12-A | [Initial plan and matrix](E2-7_T12_A_PLAN_Y_MATRIZ_DESFASES.md) | Discrepancies and scope base, updated status |
| T12-B | [Acta RF/CU/API/UI/test](E2-7_T12_B_CONCILIACION_RF_CU_API_UI_TEST.md) | RF-01..07 REAL, RF-08..10 DEMO/deferred, routes and evidence |
| T12-C1 | [Document 03 v2.1](../entrega-programacion-2/03_MODELO_DE_DOMINIO_Y_UML.md) | 19 ORM models, rules and relationships |
| T12-C2 | [03A](../entrega-programacion-2/diagramas/03A_EXPLICACION_IDENTIDAD_EMPRESAS_CATALOGO.md) | PlantUML + SVG + guide |
| T12-C3 | [03B](../entrega-programacion-2/diagramas/03B_EXPLICACION_COMPRAS_INVENTARIO_VENTAS.md) | PlantUML + SVG + guide; [second explanatory flow](../entrega-programacion-2/diagramas/03B_FLUJO_COMERCIAL_EXPLICATIVO.svg) preserved |
| T12-C4 | [03C](../entrega-programacion-2/diagramas/03C_EXPLICACION_CASOS_DE_USO.md) | PlantUML + SVG + guide; 12 CU, 13 ovals (CU-12a/b) |
| T12-D1 | [Documento 04 AS-IMPLEMENTED](../entrega-programacion-2/04_ARQUITECTURA_Y_PATRONES.md) | REAL Architecture at the beginning, E2-3 archive preserved historical, patterns with evidence |
| T12-D2 | [Delivery cover](../entrega-programacion-2/README.md), [UML index](../entrega-programacion-2/diagramas/README.md), [Frontend](../frontend/README.md), [Backend](../backend/README.md), [CHANGELOG](../CHANGELOG.md) | Updated headers and navigation, preserved historical |
| T12-E | **This document** | Final reconciliation, reservations, verification procedure and backlog; [ADR-001.008 index](ADR/README.md) reconciled with current status |

Complete academic documents: [01](../entrega-programacion-2/01_ANALISIS_DE_REQUERIMIENTOS.md), [02](../entrega-programacion-2/02_CASOS_DE_USO.md), [03](../entrega-programacion-2/03_MODELO_DE_DOMINIO_Y_UML.md), [04](../entrega-programacion-2/04_ARQUITECTURA_Y_PATRONES.md), [05](../entrega-programacion-2/05_MATRIZ_API_Y_TRAZABILIDAD.md).

## 3. Functional and technical reconciliation

| RF/use cases | AS-IMPLEMENTED state at cut T11 | Important limit |
|---|---|---|
| RF-01 / CU-01 y CU-02 | Log, login, me, logout; token Bearer opaque | Token REAL in memory; F5 demands reauthentication |
| RF-02 / CU-03 y CU-12 | Companies, protected ownership, memberships, invitations and equipment | Invitation alone does not grant permissions; no automatic mail/transfer holder |
| RF-03 / CU-04 | Locations and allocations by company; SELL/STORE | Worker/manager needs authorization and effective assignment of headquarters |
| RF-04 / CU-05 | Catalogue of goods and services persisted by tenant | Crear ficha no crea stock |
| RF-05 / CU-06 y CU-07 | Suppliers, purchases, snapshots and unique reception complete | Register purchase without receipt does not change inventory |
| RF-06 / CU-08, CU-09 y CU-11 | StockBalance, signed ledger, transfers, adjustments and initial stock | No negative balances; control of competition and versions |
| RF-07 / CU-10 | Actual POS with prices/discounts per role and payments declared | No integration of automatic bank accreditation |
| RF-08 / cash and expenses | **DEMO / DIFFERED** | Sin router/circuito real equivalente |
| RF-09 / financial accounts | **DEMO / DIFFERED** | No Real Bank Integration |
| RF-10 / QR Market Payment | **DEMO / DIFFERED** | No OAuth of Commerce, Webhooks or Credited Charge |

**Model:** 19 persistent ORM classes cover user/session, company, members/invitations, headquarters/assignments, catalog/suppliers and commercial entities. Diagram 03B does not show a generic non-existent table `SolicitudIdempotente`; the real model retains keys and footprints per operation. Separate declared payment mode from external confirmation.

**Patterns for defence:** Repository and Service Layer implemented; SQLAlchemy session/commit with transactional practice; Observable observer in DEMO. Do not formally declare factory, decorator, state, command or memento implemented without proof of specific classes/contracts.

## 4. Technical evidence and scope of control

- **T11 — Quality history, NOT executed in T12:** [technical audit](E2-7_T11_E_AUDITORIA_FINAL_PREMERGE.md) record **892 Pytest + 38 Playwright REAL + 6 DEMO** in the specific functional committee `6aecd80e52a0712f7d1088dde8347de7f7a7c186`. The approval of PR #45 led to these functionalities `main`.
- **T12-B:** el [Document 05](../entrega-programacion-2/05_MATRIZ_API_Y_TRAZABILIDAD.md) Document **46 routes/methods** en **13 routers** and the matching with screens/test. Decorators of 13 routers of the code were contrasted and that total coincided.
- **T12-E:** the configuration of `.github/workflows/plataforma-pyme-frontend.yml`, `plataforma-pyme-backend.yml` e `inventory-real.yml`: are not Markdown or PlantUML specific validators; they are preserved unchanged. **GitHub Actions did start three automatic executions** Against the SHA of Evidence `a71c946c` (IDs 43049799155, 43049799104 and 43049799167; observed status: `in_progress`) This data prevails over the absence of run during the initial audit.
- **Enlaces Markdown:** were cross-checked **215 enlaces relativos en 17 Markdown** of delivery and T12 documents against the HEAD tree `a71c946c` of GitHub (**562 entries**); **215/215 existing destinations, 0 broken**. Check does not include anchors `#fragment`, external links or URLs generated at runtime.
- **SVG:** the four graphs present `viewBox` and text with color attribute `fill`; remain editorial diagrams and not literal PlantUML exports.
- **PlantUML:** `@startuml` y `@enduml` present; semantic compilation/rendering pending from an environment with PlantUML. The warning is preserved, no validation simulated.

### Manual and reproducible pending verification

From a disposable copy of the repository, without touching the working database:
```powershell
# En la carpeta plataforma-pyme/entrega-programacion-2/diagramas
java -jar .\plantuml.jar -checkonly .\03A_CLASES_IDENTIDAD_Y_CATALOGO.puml
java -jar .\plantuml.jar -checkonly .\03B_CLASES_COMERCIO_E_INVENTARIO.puml
java -jar .\plantuml.jar -checkonly .\03C_CASOS_DE_USO.puml
```
Visually validate the engine-generated SVG in each case, but **do not replace** the SVG publishing automatically approved: compositions have different purpose.

**Documentary CI without new workflow:** a link validation script / XML/PUML executed in copy of QA or signed manual control is recommended; add `.github/workflows/*.yml` would require another scope and a specific PR. **No** IC infrastructure changed here.

## 5. Priority residual observations

| ID | Priority | Final observation | Future action |
|---|---|---|---|
| R-01 | P1 for extended technical closure | No PlantUML Accredited Compilation | Ejecutar `-checkonly` and file output; do not fake PASS |
| R-02 | P1 if the heading so requires | TP3 not fully cross-checked | Compare inherited requirement → RF/CU → file/test; not declare automatic absorption |
| R-03 | P2 | Three IC workflows initiated on `a71c946c`, pending completion of the audit; documentation does not have dedicated validator | Check the result of the 3 runs of the last HEAD before merge; Markdown/PUML validator in rear PR, without adding YAML here |
| R-04 | P2 | Extensive historical README: old sections still contain "pending" words | Respect current headers and historical file delimiter |
| R-05 | P2 | Warns Pydantic `Field(alias=...)` reported in historical QA | Test evaluation before changing the contract |
| R-06 | P2 | Unencrypted IndexedDB pending attempts; risk on shared computers | Evaluate life cycle, expiration, minimization and encryption |
| R-07 | P2 | Bearer session in memory and re-entry F5; UX imperfect | Evaluate secure renewal, HttpOnly/CSRF cookies and controls |
| R-08 | P2 | Lack of comprehensive accessibility, physical mobile, performance and production safety assessment | Separate product QA plan, without using actual data |
| R-09 | P3 | Comments/docstrings pre-T11 code may still be old | Independent cleaning PR; do not pollute the documentary closure |
| R-10 | P3 | Unrealised external anchovy checks | Add link checker when documentary pipeline exists |

**There are no defects demonstrated in new models by this static audit.** Eso **no proof** absence of failures: no new functional tests were performed.

## 6. Shutter and decision door matrix

| Door | Evaluation |
|---|---|
| 01..05 with current header and REAL/DEMO limits | **Documentaryly completed**, with preserved historical record |
| 03A/03B/03C and second flow 03B included | **Documentaryly completed** |
| Relationship RF/CU→API→UI/test at 05 | **Complied with T11 base, not retested** |
| README of delivery/frontend/backend, UML index and changelog updated | **Implemented** |
| Single area `plataforma-pyme/`, no app/DB/infra files | **Checked:** 23 documentary archives, 14 committees on `main` to the SHA `a71c946c`, no code change/DB/infrastructure |
| Existing internal links | **215/215 destinations existing in the GitHub tree**, 0 broken; does not validate anchors or external links |
| Build/tests/CI executed for HEAD T12 | **3 workflows released for `a71c946c`, in application of the last control**. No conclusion: DO NOT declare PASS; the committ of updating the minutes requires consulting its own SHA |
| Official plantuml | **Pending** |
| Original TP3 consignor | **Complete matching pending** |
| Explicit human approval to pass PR READY and make merge | **NOT granted by this Act** |

**Operational opinion:** T12 closure documentary **RESERVES**, suitable for the responsible to review the branch and decide later on the merge. Do not change `main`, do not execute actions on PostgreSQL or touch functionality in this closure.

---

## 7. POST-CADEMIC BASKLOG — STAGE 2 (WHERE THE CURRENT EVALUABLE SCOPE IS OUT)

> **NOTA DE ALCANCE / FIREWALL:** The functionalities of this section are **ideas and product objectives after academic closure T12**. **They are NOT part of the RF-01 to RF-07 commitments assessed in this cut**, they must not be presented as implemented or become delivery defects because they appear here. If an official slogan requires any, that obligation should be explicitly analysed separately.

| Suggested command | Workline | Rules to be retained |
|---|---|---|
| **2A** | Real Visual and Navigation Convergence / DEMO | Reusing aesthetics, flows and accessibility DEMO over REAL data, unbound `demoStore` with API or weaken permissions |
| **2B** | PostgreSQL real ERD diagram | Generate FK view, tables and restrictions from a test environment using DBeaver or similar. **No migration required to Supabase** |
| **2C** | Web/mobile demonstration | QA Deploy, HTTPS, secure variables, fictitious data, responsive and touch/key test; do not publish private DB |
| **2D** | Market Real QR Payment **per company** | OAuth/credentials tenant-scoped, QR article vs QR collection, intention/expiration, webhooks with verified signature and reconciliation; prevent double sales |
| **2E** | Expenditure, cash and days (RF-08) | Accounting model, openings/closures with snapshots, permits and reconciliation of cash other than declared payment |
| **2F** | Financial accounts (RF-09), reserves, production/recipes, extended suppliers | Prioritize contracts for risk and value; do not mix technical inventory or funds per company |

**Minimum units:** First freeze API routes and permission policies; model REAL with DEMO flows; maintain CI/transaction regressions and idempotence; do not integrate productive QR without security, reverse and audit. The schedule and budget of Stage 2 require further decision, they do not arise from this closure.

## 8. Manifestation of sources and publication status

| Reference | Value/verification |
|---|---|
| Repository | `JoaquinOjedaDev/Orbit` |
| Functional basis | `main` `c6a77137cf82dcb9aad225645e84b1265b1da3ec` |
| Documentary PR | #46, rama `docs/e2-7-t12-cierre-academico` |
| Final integration | The last SHA of evidence before the IC clarification was `a71c946c4070602e91e1439b206ac4e1dcd1f953`; **verify the current HEAD and its checks directly at PR #46** After this note. The minutes cannot self-reference their own commit in a stable way. |
| Technical inventory | `backend/app/api/v1/router.py` y 13 routers; `backend/app/infrastructure/models/` and Alembic; `frontend/src/App.tsx` y `src/api/httpClient.ts` |
| Evidence T11 | `docs/E2-7_T11_E_AUDITORIA_FINAL_PREMERGE.md` |
| Change manifest and final check | `git diff --name-only origin/main...HEAD`, `git log -1 --oneline`, PR status and link controls/PUML |

**Privacy and integrity control:** This audit did not personally execute migration commands, tests or sales against databases. GitHub’s IC workflows operate in its test infrastructure according to their YAML and should not be confused with operations on the user’s local basis. No secrets, user tokens or real addresses are incorporated.

**Approval required:** the user approved the execution and documentary closure of T12, **did not express in this message separate authorization to merge PR #46 to `main`**. Request it before any merge; keep DRAFT until then.
