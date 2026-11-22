---
type_document: "INREGA_PARA_REVISION"
block: "E2-4"
version: "1.0"
_Cut date: "2026-11-08"
project: "Platform PyME — Programming 2 UNSAM"
rama_de_origen: "main"
commit_cierre_backend: "4f88416141c09a82e744990b1aee8c00b9f31dfd"
branch_sugerida_revision: "review/e2-4-providers-buyers-reception"
status: "FUNCTIONALLY_FOR_REVISION_INDEPENDENT"
merge_automatic_of_reviewer: false
---

# E2-4 — Delivery Sheet for eventual independent review

**This sheet is not the independent audit report.** It provides the references of the code and the evidence already obtained for another member to audit separately. `E2-4_CIERRE/10_OBSERVACIONES_DE_AUDITORIA_Y_DECISIONES.md` is a set of observations, not a check proper to the entire backend.

## 1. Acceso, rama y SHA

- Repo: https://github.com/JoaquinOjedaDev/Orbit
- Single Scope Folder: `plataforma-pyme/`.
- **Code SHA and proven evidence:** `4f88416141c09a82e744990b1aee8c00b9f31dfd` This documentation has a later commitment that **no cambia backend**.
- Suggested branch for an external reviewer: `review/e2-4-proveedores-compras-recepcion`, founded from SHA of the agreed court, **without rear automatic surge/base**.
- Read pre-read [master guide E2](GUIA_MAESTRA_REVISION_BLOQUES_E2_ASISTENTE_PYME.md) y [evidence of closure](E2-4_CIERRE/00_LEEME.md).

The independent review should confirm access to the real code, migration metadata and academic docs 01–05 before issuing conclusions. If it cannot access, it must declare and not invent results.

## 2. Scope implemented by increase

| Cut | Code/Scheme | Final evidence of the cut |
|---|---|---|
| A Suppliers persistence | `models/supplier.py`; `e24a_suppliers` | 598 tests, PR #12 |
| B API Providers | `modules/suppliers/`, cinco endpoints | 693 tests, PR #13 |
| C Persistence purchases | `models/purchase.py`, `purchase_line.py`; `e24c_purchases` | 717 tests, PR #14 |
| D Purchases API | `modules/purchases/{router,service,schemas}.py`; `e24d_purchase_hash` | 772 tests, PR #15 |
| E Reception and stock | `receipt_*.py`, `inventory_router.py`, three SQL models; `e24e_receipt_stock` | 796 tests, PR #17 |
| Correction of populated tests | `tests/test_purchase_integration.py` | **797 tests, PR #18** |

**Backend actual:** Complete and unique reception per purchase, a STORE location, UPSERT atomic balances, a physical line movement and unchangeable replay with original key. There are still no sales or stock settings, no multicurrency reconciliation, nor React/API integration.

## 3. Evidence to be reproduced and separated by origin

- GitHub CI 42530739959: Python 3.12 and 3.14 with PostgreSQL 16, **797 tests each**, Alembic `e24e_receipt_stock`, Docker 3/3 jobs.
- Windows author: first 781/796 and 15 test failures by populated DB QA; then PR #18, 20/20 affected file and **797/797** Full suite, same preserved base. The original state was **781 passed y 15 failed**, repeat tests should not be added to the final total.
- Swagger author: 17 cases observed, free concept, physical purchase, deposit, reception 201, replay 200, 409 attempt new, balance 10000 and single move. **The full CRUD Suppliers does not have detailed manual log**. 
- Complete documents: `E2-4_CIERRE/01...` a `10...`, JSON and collection `requests/E2-4_QA.http`.

**Failure to establish evidence of its own if only the author ' s exits were read.** New keys/resources are generated in QA to reproduce retry; historical secrets are not revealed.

## 4. Minimum audit matrix

| Criterion | Routes/models | Tests/risk |
|---|---|---|
| Insulation by tenant | all routers, FK composite | zero inter-company accesses and revoked membership |
| Provider and name | supplier schemas/service/SQL | standardization, 409, without canonical duplicate |
| Compra y snapshots | purchase/service, purchase_lines | HALF_UP, cost, 1–30 lines, no stock in high |
| Actor and key power | purchase y receipt | 200 replay, 409 diferente, concurrencia |
| Location/rol STORE | receipt_service, location permissions | company suspended, missing assignment, can_store |
| Ledger y saldo | stock_movements/stock_balances | transaction and rollback, UPSERT without lost update |
| Type/unit history | catalog service + receipt_service | lock edition and read FOR SHARE real |
| Evolution of domain | states, partial 1:N, multicurrency | **TO-BE**, not assume implemented |
| Riesgo DB de tests | test_purchase_integration.py | PR #18 filters; ephemeral DB still pending |
| SQL immutability | roles/triggers de PostgreSQL | REST sin PATCH/DELETE; no trigger UPDATE/DELETE |

## 5. Whitelist for review

Preferably review `backend/app/modules/suppliers/**`, `backend/app/modules/purchases/**`, `backend/app/infrastructure/models/{supplier,purchase,purchase_line,purchase_receipt,stock_balance,stock_movement}.py`, `backend/tests/test_{supplier,purchase,receipt}*.py`, `docs/E2-4_*.md` and closing. Catalogue/locations and E2-1 are consulted as dependencies and modified **only for proven defect and specific justification**preserving compatibility.

**Do not edit already applied migrations 0012–0015**, do not delete volumes/data, do not change `main` directly or merge the PR of the reviewer. If a correction requires SQL change, propose migration **new additive**, impact on contracts and independent testing. `E2-4_INFORME_DE_REVISION.md` that distinguishes confirmed finding, risk, preference, code changed, test executed, status and pending. The responsible decides the merit.

## 6. Limit of this sheet

The E2-4 closure is validated for its backend range and subsequent review may find additional defects. **does not amount to production or completed external audit**and does not authorize the implementation of developments in E2-5, E2-6 or E2-7 within the review.
