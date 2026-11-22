# E2-3 D — Technical matrix for the integrity and regression of the Catalogue

**Project:** Orbit (multi-enterprise and multi-rub)  
**Date:** 08/11/2026  
**Status:** CODE AND IC D VALIDADOS, WINDOWS 580/580 APPROVED; UML 03A CONCILIATED IN E2-3 E  
**Functional basis:** E2-3 C, commit `5fe257f140ebc0d19d6504798bcdee02b9c7e314`  
**Test cut D:** `8598c271eeaf5a21e64909e518765135d22fbc03`  
**Pagination cut D:** `bf4fd3fa809c9f4e6afdeb064a155acf233b1722`  
**IC of the last code:** historical CI run 42508771222

## 1. Purpose of the increase

Close the case limits of the five Catalog endpoints already built in E2-3 B/C without adding commercial functions, inventory or unnecessary modifications to models and migrations of previous blocks.

- Create, list, query and edit tabs, and change explicitly `status` ASSETS/INACTIVE.
- Physical goods ELABORATED/REVENT/INSUMO use physical units; SERVICE uses the SERVICE unit.
- Non-nullian canonical and SKU names are unique by company, also for inactive items, but may be reused on another tenant.
- The catalogue does not generate balance, purchase, sale or movement by registering or activating a tab.
- The status of a tab and the indicator `sellable` They are different and should not be confused.

## 2. New regression matrix

| Dimension | Evidence/contract | Evidence |
|---|---|---|
| Unicode and collisions | NFKC + casefold in names, fullwidth and ligatures | `test_catalog_hardening_schemas.py`, `test_catalog_api_integration.py` |
| SKU | ASCII canonicalization, capital letters and rejection of invalid formats | Pure and HTTP real collision tests |
| Limits | casefold that expands the name beyond 90 characters; control characters; length SKU | Pydatic Validation, 422 |
| Money | Strict integers with safe range; without float, bool or coerced chains | Scheme tests |
| PATCH | Difference between absent and null field for SKU/price/cost; `sellable=false` | SQL and later reading |
| Type/unit | A partial incompatible change returns 422 without affecting the registration; valid joint conversion without commercial history | SQL + API |
| Tenants | Two companies of the same user, same nominal key and UUID foreign | 404 and check intact rows |
| Status | The INACTIVE tab remains visible and retains reserved keys | SQL + API |
| Fallo posterior a flush | Derogation caused during serialization of high/editing | Rollback, no orphan row or partial change |
| Pagina | `offset` out of range BIGINT blocked before SQL | 422; `limit` continues between 1 and 500 |
| Global regression | E2-0, E2-1 and E2-2 did not change | Complete Suite and Diff Review |

## 3. Evidence IC

- Commit funcional final: `bf4fd3fa809c9f4e6afdeb064a155acf233b1722`.
- GitHub Actions: historical CI run 42508771222
- Python 3.12/PostgreSQL 16: **580 passed en 57.31s**.
- Python 3.14/PostgreSQL 16: **580 passed en 57.55s**.
- Docker build/liveness aprobado. Alembic `e23a_catalog (head)`; `alembic check`: no pending operations.
- Windows: the last result provided corresponds to **E2-3 C (527 passed in 59.60s)**. For E2-3 D **No local execution yet**.
- The subsequent documentary commit is a synchronization of evidence, not a new code IC.

## 4. Risks, limits and dependencies

1. **Actual concurrence:** the UNIQUE by tenant and existing SQL blocking provide the main defense against double highs. This delivery proves conflicts in PostgreSQL and rollback; **does not contain a simultaneous race test with two connections**, no load test. Register explicitly when auditing.
2. **Commercial history:** When implementing purchases, stock and sales must be linked by tenant keys and keep snapshots. Rules to prevent conversion of type/unit with registered transactions are added when there are actual commercial tables, not before.
3. **Status:** when confirming a future purchase or sale, check whether a card is ASSISTING, apart from `sellable`, location and permissions; the catalogue alone does not authorize the operation.
4. **Front-end:** React continues in DEMO mode and does not call this backend; integration and end-to-end tests belong to E2-7.
5. **Migration:** There was no new migration in E2-3 D. No editing of already applied E2-1, E2-2 or E2-3 A migrations.
6. **Independent review:** do not generate E2-3 audit report until the UML 03A is reconciled and receive Windows validation from D.

## 5. Next Windows execution (developmental base, no production)

From `plataforma-pyme/`:

```powershell
git pull --ff-only origin main
cd backend
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check
$env:RUN_DB_INTEGRATION = "1"
try {
    .\.venv\Scripts\python.exe -m pytest -q
} finally {
    Remove-Item Env:\RUN_DB_INTEGRATION -ErrorAction SilentlyContinue
}
cd ..
docker compose --profile api up -d --build --wait api
docker compose ps
Invoke-RestMethod http://127.0.0.1:18000/ready
```

Waited: **580 passed**, `e23a_catalog (head)`, no drifting, two containers `healthy` y `ready/ok`Do not use `downgrade`, `stamp` or delete volumes.

**Then:** E2-3 E — reconcile 03A PUML/guide/SVG and close documents 01–05 with a fixed SHA for external audit. Do not start E2-4 in the same cut.

## 6. Update after local validation and closure E2-3 E

**E2-3 E closed functionally and documentaryly (08/11/2026):** catalogue `CatalogItem` with migration `e23a_catalog`, five actual REST routes, tenant/RBAC verification and active/INACTIVE status. **580 passed en Windows (66.45s)**, Alembic sin deriva, API y DB Docker healthy, `/ready` ready/ok. CI D 3/3 and 580 Python tests 3.12/3.14 sachet `bf4fd3fa809c9f4e6afdeb064a155acf233b1722`. UML 03A v0.7 (PUML, guide and editorial SVG) updated; To-BE Supplier, 03B/03C preserved. There are no purchases, inventory, sales or React/API integration yet. **Earrings: formal delivery to the reviewer, no PR merchandise**. The A/B/C/D states below correspond to historical cuts.

**Section 5 records the procedure prior to the local test, now executed by the developer**. It remains as historical evidence; it does not mean that Windows is still pending. For external audit, do not confuse sequential SQL duplication tests with simultaneous connection run.
