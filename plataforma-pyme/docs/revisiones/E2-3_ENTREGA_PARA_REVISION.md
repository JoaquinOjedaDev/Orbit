---
type_document: "INREGA_PARA_REVISION"
project: "Orbit — Programming 2, UNSAM"
block: "E2-3"
name: "Multi-company catalog: persistence, API, state and integrity"
version: "1.0"
_Cut date: "2026-11-08"
repository: "JoaquinOjedaDev/Orbit"
_exclusive folder: "platform-pyme/"
rama_origen: "main"
rama_revision: "review/e2-3-catalogo"
commit_fin_e2_2: "af47a65bd2c04576cb3cb4b526188591585212f6"
commit_code_e2_3_d_validated_ci: "bf4fd3fa809c9f4e6afdeb064a155acf233b1722"
commit_previous_a_esta_sheet: "b409a45e5a4db36245753543f7cb177ba038da2f"
base_branch_revision: "SHA_COMMIT_DEL_COMMIT_WHERE_PUBLISH_THAT_SHOLE"
reviewer_report: "platform-pyme/docs/revisions/E2-3_INFORME_DE_REVISION.md"
status: "FUNCTIONALLY_FOR_REVISION_INDEPENDENT"
merge_permitida_al_revisor: false
---

# E2-3 — Catalogue independent audit delivery sheet

**Addressee:** the reviewer partner and the AI with which the audit is conducted. **code actually delivered** and the scope decisions, do NOT substitute for revision or ensure absence of defects. The result should be a second Markdown, `E2-3_INFORME_DE_REVISION.md`, versioned in `review/e2-3-catalogo`, y un Pull Request contra `main` **sin fusionar**.

> **Main rule:** thoroughly examine E2-3, document proven failures and correct **only** The review does not allow for restructuring E2-0/E2-1/E2-2, resolution of external audits, touching frontend, creating suppliers/purchases/stock/sales, or initiating a general refactoring. The responsible retains the decision to ACCEPT, REJECT, EXCUSE or DIFFER each modification separately.

## 1. Repository, SHAs and mandatory sources

**Repository:** https://github.com/JoaquinOjedaDev/Orbit  
**Exclusive Folder:** `plataforma-pyme/`  
**Work force of the responsible person:** `main`  
**Branch that will create the reviewer in a separate clone or worktree:** `review/e2-3-catalogo`.

- **Closure E2-2:** `af47a65bd2c04576cb3cb4b526188591585212f6`. It serves as a historical reference to identify the beginning of the new Catalogue; it can include the review sheet E2-2.
- **Last E2-3 CODE SHA approved in IC:** `bf4fd3fa809c9f4e6afdeb064a155acf233b1722`.
- **Code SHA + UML 03A + E2-3 E documentation prior to this sheet:** `b409a45e5a4db36245753543f7cb177ba038da2f`.
- **SHA FIX of the revision branch:** the full SHA **of the committee that publishes this same sheet**. It is impossible to embed your own exact hash into the file without changing it; the responsible will communicate it next to the link. `git show`, `git rev-parse HEAD` and existence of this archive **before you start**.
- **Do not start from `main` most recent** whether it advanced after delivery; nor did it synchronize by overbase/merge during review without authorization.

**Order of reading and precedence:**

1. This leaf and [Master review guide E2](GUIA_MAESTRA_REVISION_BLOQUES_E2_ASISTENTE_PYME.md).
2. [01 Requirements](../../entrega-programacion-2/01_ANALISIS_DE_REQUERIMIENTOS.md) RF-04; [02 Cases of use](../../entrega-programacion-2/02_CASOS_DE_USO.md) CU-05; [03 Dominio/UML](../../entrega-programacion-2/03_MODELO_DE_DOMINIO_Y_UML.md); [04 Architecture](../../entrega-programacion-2/04_ARQUITECTURA_Y_PATRONES.md); [05 Matrix API](../../entrega-programacion-2/05_MATRIZ_API_Y_TRAZABILIDAD.md).
3. [UML 03A PlantUML v0.7](../../entrega-programacion-2/diagramas/03A_CLASES_IDENTIDAD_Y_CATALOGO.puml), [guide 03A](../../entrega-programacion-2/diagramas/03A_EXPLICACION_IDENTIDAD_EMPRESAS_CATALOGO.md), [SVG editorial](../../entrega-programacion-2/diagramas/03A_IDENTIDAD_EMPRESAS_CATALOGO_REDISENADO.svg).
4. [E2-3 D matrix of integrity and boundaries](../E2-3_D_INTEGRIDAD_CATALOGO.md), [README backend](../../backend/README.md) and real code in `backend/app/modules/catalog/`, `models/catalog_item.py`migration and tests.
5. Documents E2-1/E2-2 **only for compatibility**, never as permission to edit them. 03B/03C are also read only.

## 2. Actual result and limits of each cut

| Cut | Implemented result | Last local test provided |
|---|---|---|
| **E2-3 A** | ORM `CatalogItem`, tabla `catalog_items`, tenant restrictions, name, SKU, units, prices; additive migration `e23a_catalog` | 407 passed |
| **E2-3 B** | Four routes: POST/GET collection and GET/PATECH detail; standardization, RBAC, tenant, pagination | 498 passed |
| **E2-3 C** | Quinta ruta PATCH `/status` (ACTIVE/INACTIVE), Idempotency and not erased | 527 passed |
| **E2-3 D** | Unicode regression, nullability, type/unit, isolation of two companies, rollback after flow and BIGINT offset limit | **580 passed in 66.45s** |
| **E2-3 E** | Update Documents 01–05, README, model PUML 03A v0.7, guide and editorial SVG, independent sheet for audit | **No code changes/test**; no new IC declared |

**Status:** Catalogue **is implemented and validated locally for its scope**. No supplier or purchase, stock, sales or frontend operations connected to FastAPI have been implemented yet. Do not infer from this table a complete final TP or a production setting.

### 2.1. Actual model, cardinality and restrictions

- Each `CatalogItem` belongs to one `Business` by `business_id` y FK `RESTRICT`. A company can start with **zero articles**. Additional UNIQUE exists `(business_id,id)` to facilitate future composite commercial FK.
- `kind` represents **ELABORATED, REVENT, INSUMO, SERVICE**. El `item_type` WELL/SERVICE of the API is **derived from `kind`**, NOT a column or second mutable discriminator.
- `unit` admite `UNIDAD, GRAMO, KILOGRAMO, MILILITRO, LITRO, PAQUETE, CAJA, SERVICIO`. Class SERVICE requires unit SERVICE and vice versa. Do not invent units without product agreement.
- `name` y `name_key` (canonical by NFKC, collapse of spaces and `casefold`), up to 90 characters effective. `(business_id,name_key)` includes INACTIVE tokens.
- `sku` optional/NULL, maximum 32 ASCII characters `[A-Z0-9._-]` after NFKC/mayuscules; partial UNIQUE `(business_id,sku) WHERE sku IS NOT NULL`. Several items without SKU are valid; non-zero SKU is unique in the company **even if you are inactive**Another company can reuse it.
- `category` non-empty text, starting value `General`; `description` y `observations` saved by file. `sellable` is Boolean independent of `status`.
- `price_cents` y `reference_cost_cents` son BIGINT **optional**, between 0 and 99.999.999 cents, **sin Float**. Zero price is valid, NULL price means uninformed; the future commercial command will be responsible for demanding an appropriate amount.
- `status` ASSETS/INACTIVE, with reversible deactivation/reactivation and **without physical DELETE**. Repeated status for dedicated route not updated `updated_at`. The query catalog includes inactive chips; disable does NOT release name or SKU.
- `created_at`, `updated_at` linger dates. Register tokens **no crea stock**location, purchase, sale, balance, seat or movement.

**Attention:** The canonical check of names and SKU occurs in the DTO/service; PostgreSQL protects keys stored by indexes. Do not claim that SQL automatically normalizes all direct entries. Check that logic resolves conflicts of continuance through SQL and rollback exceptions.

### 2.2. The actual 5 HTTP routes

Prefix exact `/api/v1/businesses/{business_id}`. All revalidate session, user and business membership.

| Method | Path | Effect | Success |
|---|---|---|---|
| GET | `/catalog` | List sorted by `name_key,id`, active and inactive, offset >= 0, limit 1.500 | 200 |
| POST | `/catalog` | Creates a stockless Active tab | 201 |
| GET | `/catalog/{item_id}` | Check a tenant tab | 200 |
| PATCH | `/catalog/{item_id}` | Edit allowed attributes, NOT state or tenant | 200 |
| PATCH | `/catalog/{item_id}/status` | Alone `ACTIVO`/`INACTIVO`, reversible, idempotente | 200 |

**RBAC:** Active members with business readable permission can GET. For POST/PATCH, **only ENTRY_MANNER AND ADMINISTRATOR**, with Active Company and valid session. SUSPENDED company supports authorized consultations but no modifications.

**Errors:** 401 invalid token/session; 403 non-permission role; 404 company, membership or item outside the tenant/non-existent; 409 duplicate SKU name or company suspended in writing; 422 payload, unit, type, protected fields or invalid pagination. **each route**: not to assume the same list of errors in all cases. Attributes `business_id,id,name_key,status,created_at,updated_at` should not be supplanted by generic POST/PATECH. `status` only by dedicated route. `null` the optional fields PATCH are distinguished from omitted field.

### 2.3. Deliberate rules and differences

1. Generalist multi-company/multi-rubro platform. **just one example client case**.
2. The company is born with **zero articles**; no file, warehouse or inventory is created by default.
3. `BIEN/SERVICIO` derived from `kind`; prevent unnecessary duplication of conceptual status in SQL.
4. The four types of article are categories `kind` DEMO, **no** the free column `category`; they are different concepts.
5. The catalogue contains both physical goods and services, but **does not authorize or account for sale or production**.
6. Price and reference cost are optional and whole in cents; they do not require being greater than zero.
7. Canon name and SKU remain reserved while a tab is INACTIVE. Only explicit and valid editing of the name/SKU can release the previous key, not deactivation.
8. The route `PATCH /status` does not remove chips and does not change `sellable` or other business attributes.
9. `PATCH` partial may change `kind` y `unit` together if the final combination is valid **because there is no business history yet**Protection against changes incompatible with prior transactions is an obligation of future business modules; not to invent a blockade based on non-existent history.
10. The page limit `offset` is the maximum BIGINT PostgreSQL `9_223_372_036_854_775_807` to prevent 500 error with arbitrary integers. Do not modify the contract without proof of compatibility.
11. The PlantUML 03A source includes full real correspondence; the SVG is **Summary editorial sheet**: can omit attributes and associations shown in the guide. `Proveedor` continues conceptual/TO-BE.
12. D commit adds tests and an offset limit correction, **no** new migration. `e23a_catalog` applied is part of the history, and is not rewritten during revision.

## 3. EXCLUDED scope and dependencies for other blocks

- **E2-4 Suppliers, Purchases and Reception:** there are no backend routes yet. You will use items from the same tenant and a compatible location to receive.
- **E2-5 Inventory:** balances by location, lots, transfers, movements, actual initial inventory and capacity control `can_store`.
- **E2-6 Sales and payments declared:** sales line, explicit price if no list price, active status and `sellable`, use of `can_sell` and operating permits by headquarters, history/snapshots, commercial attendance.
- **E2-7 Frontend connected / E2E:** React DEMO is independent; do not confuse your screens with integrated FastAPI routes.
- Price/tax history version, complex variants, persistent commercial photos, QR payment Market Payment, new roles, unlimited labels, geolocation, notifications and public deployment.
- Modify registration, invitations, ownership, memberships, business roles E2-1; locations/assignments E2-2; UML 03B/03C.
- Load test and specific test of two simultaneous INSERTs on the same SKU/name **NO were performed**. PostgreSQL indices are SQL defense, but collision tests were sequential; document the limit and suggest an independent test.

**An out of reach unit should be reported as a future risk or requirement, not implemented during the audit without permission.**

## 4. Real files to review (all inside platform-pyme)

**Persistence and outline:**

- `backend/app/infrastructure/models/catalog_item.py` — SQL, CHECK, UNIQUE fields by company, FK.
- `backend/alembic/versions/20261108_0011_catalog_items.py` — migration `e23a_catalog`, aditiva; **ONLY READING, NOT Modifying Applied Migrations**.
- `backend/app/infrastructure/models/__init__.py` — registration of the model in metadata, read only.
- `backend/tests/test_postgres_integration.py` — Alembic head, read only.

**API:**

- `backend/app/modules/catalog/schemas.py` — DTO of creation, editing, status, canonicalization and limits.
- `backend/app/modules/catalog/service.py` — sessions, memberships, role, transactions, 409, update.
- `backend/app/modules/catalog/repository.py` — queries por `business_id`Order and lock.
- `backend/app/modules/catalog/router.py` — five HTTP contracts, codes and pagination.
- `backend/app/modules/catalog/__init__.py`, route log in `backend/app/api/v1/router.py` (last, ONLY READING unless previously allowed).

**Tests:** `backend/tests/test_catalog_item_model.py`, `test_catalog_item_integration.py`, `test_catalog_schemas.py`, `test_catalog_http.py`, `test_catalog_api_integration.py`, `test_catalog_hardening_schemas.py`There may be more files `test_catalog*.py` within the same scope; check by listing, not infer them.

**Documentation:** 01–05, technical guide E2-3 D, UML 03A PUML/guide/SVG and index. Compare AS-IMPLEMENTED and TO-BE requirements without retroactively correcting historical if they are labeled as such.

## 5. BLANK LIST of revisioner edition (binding restriction)

The permitted routes are only modified if there is a finding and proportional solution. **By default, any file not expressly authorized is READING ONLY.**

~~~yaml
rutas_permitidas_sin_autorizacion_adicional_para_correcciones_demostradas:
  - "plataforma-pyme/backend/app/modules/catalog/**"
  - "plataforma-pyme/backend/app/infrastructure/models/catalog_item.py"
  - "plataforma-pyme/backend/tests/test_catalog*.py"
  - "plataforma-pyme/docs/revisiones/E2-3_INFORME_DE_REVISION.md"
  - "plataforma-pyme/docs/E2-3_D_INTEGRIDAD_CATALOGO.md"
  - "plataforma-pyme/backend/README.md" # Solo secciones E2-3
  - "plataforma-pyme/entrega-programacion-2/01_ANALISIS_DE_REQUERIMIENTOS.md" # Solo RF-04/E2-3
  - "plataforma-pyme/entrega-programacion-2/02_CASOS_DE_USO.md" # Solo CU-05/E2-3
  - "plataforma-pyme/entrega-programacion-2/03_MODELO_DE_DOMINIO_Y_UML.md" # Solo Catálogo E2-3
  - "plataforma-pyme/entrega-programacion-2/04_ARQUITECTURA_Y_PATRONES.md" # Solo E2-3
  - "plataforma-pyme/entrega-programacion-2/05_MATRIZ_API_Y_TRAZABILIDAD.md" # Solo E2-3
  - "plataforma-pyme/entrega-programacion-2/README.md" # Solo índice E2-3
  - "plataforma-pyme/entrega-programacion-2/diagramas/03A_CLASES_IDENTIDAD_Y_CATALOGO.puml" # Solo ArticuloCatalogo y nota relacionada
  - "plataforma-pyme/entrega-programacion-2/diagramas/03A_EXPLICACION_IDENTIDAD_EMPRESAS_CATALOGO.md" # Solo E2-3
  - "plataforma-pyme/entrega-programacion-2/diagramas/03A_IDENTIDAD_EMPRESAS_CATALOGO_REDISENADO.svg" # Solo corrección factual de Catálogo
  - "plataforma-pyme/entrega-programacion-2/diagramas/README.md" # Solo estado/entrada E2-3

rutas_excepcionales_solo_con_aprobacion_previa:
  - "plataforma-pyme/backend/app/infrastructure/models/__init__.py" # Registro, si indispensable
  - "plataforma-pyme/backend/app/api/v1/router.py" # Registro, no alterar módulos ajenos
  - "plataforma-pyme/backend/tests/test_postgres_integration.py" # Solo por NUEVO head autorizado
  - "plataforma-pyme/backend/alembic/versions/**" # Solo NUEVA migración aditiva con aprobación; nunca editar 0011 ni migraciones E2-1/E2-2
rutas_prohibidas_o_solo_lectura:
  - "plataforma-pyme/backend/app/modules/auth/**"
  - "plataforma-pyme/backend/app/modules/businesses/**"
  - "plataforma-pyme/backend/app/modules/locations/**"
  - "plataforma-pyme/backend/app/infrastructure/models/user.py"
  - "plataforma-pyme/backend/app/infrastructure/models/business.py"
  - "plataforma-pyme/backend/app/infrastructure/models/membership.py"
  - "plataforma-pyme/backend/app/infrastructure/models/location.py"
  - "plataforma-pyme/backend/app/infrastructure/models/location_assignment.py"
  - "plataforma-pyme/backend/app/infrastructure/db.py"
  - "plataforma-pyme/backend/app/infrastructure/config.py"
  - "plataforma-pyme/backend/app/main.py"
  - "plataforma-pyme/backend/alembic/env.py"
  - "plataforma-pyme/backend/alembic/versions/20261108_0011_catalog_items.py"
  - "plataforma-pyme/frontend/**"
  - "plataforma-pyme/entrega-programacion-2/diagramas/03B*"
  - "plataforma-pyme/entrega-programacion-2/diagramas/03C*"
  - "plataforma-pyme/docs/revisiones/E2-1_*"
  - "plataforma-pyme/docs/revisiones/E2-2_*"
  - "plataforma-pyme/docs/revisiones/GUIA_MAESTRA_REVISION_BLOQUES_E2_ASISTENTE_PYME.md"
  - "plataforma-pyme/docs/revisiones/E2-3_ENTREGA_PARA_REVISION.md"
  - "plataforma-pyme/compose.yaml"
  - ".github/workflows/**"
  - "cualquier otra ruta no autorizada"
regla_general: "Revisar solo archivos de E2-3; si una corrección requiere otro archivo, elevar propuesta y esperar aprobación."
~~~

**Strict migration rule:** `20261108_0011_catalog_items.py` already applied to local PostgreSQL; never modify it retroactively. For a vulnerability that requires new CHECK, index or column, propose **new** Additive migration with compatibility, risk and evidence. Expect approval before writing it.

## 6. Evidence available; reviewer must reproduce what he or she can

| Ctrl | Results | Classification |
|---|---|---|
| Git | D-code SHA `bf4fd3fa...`, pre-leaf closure E SHA `b409a45...` | Author Court |
| Pytest Windows | **580 passed in 66.45s** | `REPORTADO_POR_AUTOR` |
| Alembic Windows | `e23a_catalog (head)`, `No new upgrade operations detected.` | `REPORTADO_POR_AUTOR` |
| Docker Windows | API and PostgreSQL `healthy` | `REPORTADO_POR_AUTOR` |
| Readiness Windows | `/ready` devuelve `ready / ok` | `REPORTADO_POR_AUTOR` |
| CI D (Python 3.12) | 580 passed, PostgreSQL 16, sin deriva de esquema | CI 42508771222, `CI_PASS_VERIFICADO` |
| CI D (Python 3.14) | 580 passed, PostgreSQL 16, sin deriva de esquema | Same run/SHA |
| CI D Docker | Image and Liveness Check | Same run/SHA, approved |

**Important:** the reviewer must not mark `EJECUTADO_PASS` about tests that only the responsible or other runner performed. If you run tests in your environment, report **your own SHA, command, date, result, PostgreSQL and configuration**. E-commitments are documentaries and do not provide evidence of competition, production or burden.

## 7. Git and Review Procedure — NO MERGE

### A. Confirm access, fix SHA and create independent branch

Use another clone or isolated worktree. Do not modify the usual work tree of the responsible person or his local files without tracking. Before continuing, confirm real access to `plataforma-pyme/`, Documents 01–05, 03A, Catalog code and tests. If access is incomplete, detail exactly which ones are missing.

~~~powershell
git clone https://github.com/JoaquinOjedaDev/Orbit.git
cd Orbit
git fetch origin
git status --short

# Usar el SHA de publicación comunicado por el responsable.
$SHA_CORTE = "SHA_DE_PUBLICACION_DE_ESTA_HOJA"
git show --no-patch --format="%H %s" $SHA_CORTE
git cat-file -e "$SHA_CORTE^{commit}"

git switch -c review/e2-3-catalogo $SHA_CORTE
git branch --show-current
git rev-parse HEAD
~~~

Si `review/e2-3-catalogo` already exists, DO NOT overwrite or use it `reset --hard` o `push --force`. Coordinate with the team.

### B. Reviewing with evidence and prioritizing

1. Inspect RF-04/CU-05, schemas, migration, services, repositories, router, tests, UML 03A and README of **this same SHA**.
2. Compare from closure E2-2 `af47a65...` until cut, filtering **only changes E2-3**. Do not assume that all files of a historical diff are editable.
3. Build array requirement → DTO → API → Service → Repository → SQL → tests, differentiated implemented, partial and future.
4. Search for reproducible P0/P1/P2/P3 bugs with input, actual response, impact and code/line evidence.
5. Especially review SQL tenant-safe, roles, session revocation, Unicode, collisions and mapping error, state idempotency, real simultaneous race if environment allows, 500 errors, rollback, schema and SVG.
6. Distinguishing an out-of-range product improvement from a real failure. Do not change deliberate design without authorization.

### C. Correct in separate and limited committees

A finding should map to `REV-E2-3-###`; correction, a `MOD-E2-3-###`. Prefer **a finding/a logical change/a commit**. Each corrected reproducible bug should be accompanied by regression test that fails before and after. Do not inflate the audit with general reformats or refactors.

If the correction requires file off the whitelist or new migration, **stop this modification**, record evidence and request prior authorization, with impact on data history and rollback. A limitation that cannot be corrected without touching E2-1/E2-2 should remain as an open finding, not cause a unilateral transversal change.

### D. Validate with secure environment

From `plataforma-pyme/backend/`, only on a well-known PostgreSQL development basis:

~~~powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check
$env:RUN_DB_INTEGRATION = "1"
try {
    .\.venv\Scripts\python.exe -m pytest -q
} finally {
    Remove-Item Env:\RUN_DB_INTEGRATION -ErrorAction SilentlyContinue
}
~~~

From `plataforma-pyme/`:

~~~powershell
docker compose --profile api up -d --build --wait api
docker compose ps
Invoke-RestMethod http://127.0.0.1:18000/ready
~~~

**No ejecutar** migration on a shared or productive basis; or `downgrade`, `stamp`, `docker compose down -v`, SQL cleaning or `git reset --hard` as shortcuts. If you do not have PostgreSQL/environment, enter `OMITIDO_SIN_ENTORNO` rather than inventing results. **PR IC**, about his own SHA, not just the historical run.

Permissible States: `EJECUTADO_PASS`, `EJECUTADO_FAIL`, `OMITIDO_SIN_ENTORNO`, `NO_EJECUTADO`, `CI_PENDIENTE`, `CI_PASS_VERIFICADO`, `CI_FAIL_VERIFICADO`.

### E. Publicar informe y PR, NO fusionar

~~~powershell
git status --short
git diff --check
git diff --stat
# Agregar explícitamente solo archivos permitidos. Ejemplo:
git add plataforma-pyme/docs/revisiones/E2-3_INFORME_DE_REVISION.md
git commit -m "docs(review): informe de auditoria E2-3"
git push -u origin review/e2-3-catalogo
~~~

If there were code corrections, add them individually in your previous commit. **Do not use `git add -A` Indiscriminate**. Open PR with **base `main` ← head `review/e2-3-catalogo`**preferably draft while checked. **The reviewer does NOT merge anything**, nor integrate PRs E2-1/E2-2.

Si `main` progress during the review, keep original SHA. Do not do `git rebase origin/main` ni `git merge origin/main` without permission. Record differences and, if applicable, `CONFLICTO_CON_MAIN`The responsible person shall decide cherry pick or selective integration.

## 8. Second mandatory document of the reviewer: E2-3 report

Fixed path: **`plataforma-pyme/docs/revisiones/E2-3_INFORME_DE_REVISION.md`**. It should be in the PR even if no correction is proposed. Headed YAML parseable:

~~~yaml
---
tipo_documento: "INFORME_DE_REVISION"
bloque: "E2-3"
rama: "review/e2-3-catalogo"
sha_base_recibido: null
sha_final_rama: null
sha_main_al_abrir_pr: null
estado_recomendado: null # APTO | APTO_CON_OBSERVACIONES | REQUIERE_CORRECCIONES | BLOQUEADO
resumen_hallazgos:
  P0_bloqueantes: null
  P1_altos: null
  P2_medios: null
  P3_bajos: null
hallazgos_corregidos: null
hallazgos_pendientes: null
requiere_decision_humana: null
conflicto_con_main: null
cumplio_lista_blanca: null
pruebas_regresion: null
ci_del_pr: null
---
~~~

**Mandatory content:** executive summary; real access and SHA; requirements reading; traceability matrix; testing methodology, SQL/RBAC, canonicalization and concurring; findings `REV-E2-3-###` with tests; modifications `MOD-E2-3-###` with commit and effects; pending human decisions; impact on E2-1/E2-2 and existing data; consistency Documents 01–05/UML 03A; test run table with SHA/date/command/state and limits; verified whitelist; PR IC status; PR URL and declaration **NO MERGE**.

### 8.1. Obligatory selective decision matrix

| Change ID | Finding | Commit SHA | Files | Priority | Before/after | New Test and CI PR | Impact and compatibility | Units | Revised recommendation | Team decision |
|---|---|---|---|---|---|---|---|---|---|---|
| MOD-E2-3-001 | REV-E2-3-001 | Actual SHA | real files | P0/P1/P2/P3 | evidence | command/outcome | E2-1/E2-2/Data/API | other MOD or none | ACCEPT/REJECT/JUST/DIFFERENCE | **PENDING** |

The reviewer never completes the final column on behalf of the team. Do not mix a blocking correction with an optional aesthetic improvement in one piece. If there are dependencies, specify order and if they can be accepted separately.

### 8.2. Criteria for opinions

| Status | Recommendation |
|---|---|
| Zero P0/P1 outstanding, satisfactory own critical coverage, CI PR verified where applicable, scope respected | `APTO` |
| No P0/P1, only documented P2/P3 and relevant correct tests | `APTO_CON_OBSERVACIONES` |
| P0/P1 pending or critical evidence failed | `REQUIERE_CORRECCIONES` |
| Files out of reach, incompatible migration, data at risk or serious conflict without resolution | `BLOQUEADO` |

If there is no evidence environment, report it. Do not submit an omission as `PASS`. An audit with zero changes can be valid if it explains the scope and evidence reviewed.

## 9. Partner final checklist

- [ ] Correct fixed repository and SHA; do not over-reach/merge unnoticed.
- [ ] Five real routes; do not create a sixth endpoint by mistake or claim a physical DELETE.
- [ ] Active user/membership/session, company and resource tenant-scoped; role without permission does not write.
- [ ] Two companies can use identical SKU/name; same tenant no, even INACTIVE.
- [ ] Name NFKC + casefold and SKU uppercase ASCII; Unicode/control characters and extreme protected lengths.
- [ ] SKU null allowed several times; zero and null price/cost correctly separated.
- [ ] SERVICE only with unit SERVICE; WELL/SERVICE is derivative attribute.
- [ ] Partial PATCH distinguishes omitted from null; protected fields are not written.
- [ ] Reversible state without erasing record or releasing keys; idempotency prevents artificially updating timestamp.
- [ ] 401/403/404/409/422 according to route; no 500 with offset beyond the BIGINT.
- [ ] Rollback after SQL conflicts or exception, without partially recording.
- [ ] Risks of simultaneous careers and changes with explicit future business history.
- [ ] UML 03A PUML/guide/SVG updated; SVG is an editorial summary and Supplier follows TO-BE.
- [ ] E2-1/E2-2, frontend, 03B/03C and applied migrations unmodified.
- [ ] Full report, matrix to accept individual changes and unmerged PR.

## 10. Expected delivery result

The comrade will deliver **(1) Unfused PR** from `review/e2-3-catalogo` a `main`, with justified corrections within scope and separable commitments; and **(2) full report** `E2-3_INFORME_DE_REVISION.md` The responsible person will then decide what to apply and in which order.

**Do not start E2-4 within this PR.** The Catalogue review is independent and should not block the preservation of previous blocks or pollute `main` with modifications from others.
