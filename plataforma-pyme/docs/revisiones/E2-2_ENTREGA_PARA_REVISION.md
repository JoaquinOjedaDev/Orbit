---
type_document: "INREGA_PARA_REVISION"
project: "Orbit — Programming 2, UNSAM"
block: "E2-2"
name: "Business locations, capabilities, assignments and authorization by headquarters"
version: "1.0"
_Cut date: "2026-11-08"
repository: "JoaquinOjedaDev/Orbit"
_exclusive folder: "platform-pyme/"
rama_origen: "main"
branch_revision: "review/e2-2 locations"
commit_baseline_previo_e2_2: "51ec1161045ca3458807e60612fb7c6d3f9f2d52"
commit_code_final_validated_ci: "3cd7bce71d951218e8c77da58d147e78fb0d426e"
commit_cierre_documental_pre_hoja: "e815be73f4d5ab6ecbd436e9c9587938a62195fc"
base_branch_revision: "SHA_DE_PUBLISHMENT_DE_EST_HOLE_COMMUNICATE_FOR_THE_RESPOSSABLE"
reviewer_report: "platform-pyme/docs/revisions/E2-2_INFORME_DE_REVISION.md"
status: "CLOSED_PARA_REVISION_INDEPENDENT"
merge_per_revisor: false
---

# E2-2 — Formal delivery for controlled audit and corrections

**Addressee:** peer reviewer and the AI you work with. This document is **the delivery sheet**Not an audit report or a certification of absence of errors. `E2-2_INFORME_DE_REVISION.md`, produced by the reviewer IN HIS RAMA, along with a Pull Request to `main`, **sin fusionarlo**.

> **Priority rule:** audit E2-2 thoroughly without modifying or reinterpreting the work of E2-0, E2-1, the DEMO frontend or other blocks. A local and proven correction is welcome; a functional extension, wide refactoring, cross-cutting update or modification outside the white list requires prior authorization. **Not much of a reward for change**. The responsible team will decide separately which commit or change to the PR accepts.

## 1. Accurate reference, sources and temporal scope

**Public repository:** https://github.com/JoaquinOjedaDev/Orbit

**Development branch:** `main`. **Review branch to be created by the partner:** `review/e2-2-ubicaciones`.

- **AHS pre-E2-2:** `51ec1161045ca3458807e60612fb7c6d3f9f2d52` (close documentary C.5 of E2-1).
- **E2-2 D code SHA effectively verified by IC:** `3cd7bce71d951218e8c77da58d147e78fb0d426e`.
- **Code SHA + E2-2 documentation before issuing this sheet:** `e815be73f4d5ab6ecbd436e9c9587938a62195fc`.
- **EXACT SHA TO CREATE the revision branch:** **the full SHA of the commit that publishes this same sheet**, communicated with your link by the responsible. You cannot self-reference within your own content: the hash is calculated when you publish it. The reviewer MUST contrast the SHA informed with GitHub and `git rev-parse HEAD` **before analyzing or editing**.
- **Do not automatically start from `main` most recent** If he moved forward after the cut.

**Precedence and mandatory reading:**

1. This E2-2 sheet, especially whitelist, scope and SHA publication.
2. [Master Block Review Guide](GUIA_MAESTRA_REVISION_BLOQUES_E2_ASISTENTE_PYME.md), version 1.1; your examples of E2-1 are not permission to edit identity.
3. [01 Requirements](../../entrega-programacion-2/01_ANALISIS_DE_REQUERIMIENTOS.md), [02 Cases of use](../../entrega-programacion-2/02_CASOS_DE_USO.md), [03 Dominio/UML](../../entrega-programacion-2/03_MODELO_DE_DOMINIO_Y_UML.md), [04 Architecture](../../entrega-programacion-2/04_ARQUITECTURA_Y_PATRONES.md) y [05 Matrix API](../../entrega-programacion-2/05_MATRIZ_API_Y_TRAZABILIDAD.md).
4. [03A PlantUML source](../../entrega-programacion-2/diagramas/03A_CLASES_IDENTIDAD_Y_CATALOGO.puml), [guide 03A](../../entrega-programacion-2/diagramas/03A_EXPLICACION_IDENTIDAD_EMPRESAS_CATALOGO.md) y [SVG editorial](../../entrega-programacion-2/diagramas/03A_IDENTIDAD_EMPRESAS_CATALOGO_REDISENADO.svg).
5. [Plan y decisiones E2-2 D](../E2-2_D_PERMISOS_POR_UBICACION_PLAN.md), [Technical README](../../backend/README.md)migrations, models and tests really present.

**History Note Git:** the diff from `51ec116` also includes delivery files and guide **E2-1** created later, and even a limited adjustment to DEMO to add `CASA`. **They appear in the historical diff DO NOT make them editable files of E2-2.** Just check it as context.

## 2. What was sought and what was implemented

**Functional objective:** represent a company with zero or several real locations (local, fair, deposit, office, house or other space), indicate its independent sales/storage capabilities, manage its state and principal, and enable secure assignments of collaborators by headquarters without breaking identity and business memberships.

| Cut | Effectively delivered implementation | Local evidence of the author |
|---|---|---|
| **E2-2 A** | SQLAlchemy entity `Location`, tabla `locations`, restrictions and index of principal; migration `e22a_locations` | **212 passed** |
| **E2-2 A.1** | Type `CASA` incorporated by **new** migration `e22b_location_casa`; DEMO selector/validations also recognize it | **217 passed** |
| **E2-2 B** | Create, list and get details of real locations, with authentication, tenant and roles | **277 passed** |
| **E2-2 C** | Edit data/capacitys, pause/reactivate and choose main transactionally | **325 passed** |
| **E2-2 D** | Association `LocationAssignment`, migration `e22d_assignments`, employee assignment/revocation and pure operational clearance policy by headquarters | **371 passed in 47.57s** |

The company **born without locations**. No deposits, stocks, sales or permissions are created by default when registering a business.

### 2.1. Table and location domain

- `locations.id` UUID y `business_id` mandatory with FK a `businesses.id`; always consult the tenant.
- Types **`LOCAL`, `FERIA`, `DEPOSITO`, `OFICINA`, `CASA`, `OTRO`**. Do not add types or subcategories without permission.
- `name` de 2 a 80 caracteres, `address` y `map_url` optional in user experience (in SQL they are saved as empty strings by default).
- `can_sell` y `can_store` are independent booleans. The four combinations, including **both false** for an administrative seat.
- Status `ACTIVA`/`PAUSADA`. `is_primary` optional: **at most one main ACTIVA per company**. It is not mandatory that there be a principal.
- The first created location is automatically designated as the main location. Pause it overturns in that transaction; reactivate it DOES NOT return the condition automatically. Another active location can be chosen by specific path.
- CHECK and PostgreSQL's single partial index back those rules and the service uses locks and transactions.

### 2.2. Headquarters allocation table and domain

- Tabla `location_assignments` with PK composite **`(business_id, location_id, user_id)`**.
- Composite FK `(business_id, location_id)` → `locations(business_id,id)`, with UNIQUE auxiliary in the location table; FK composite `(business_id,user_id)` → `memberships(business_id,user_id)`. **No assignment can cross tenants even via direct SQL**.
- No new account or membership is created. A person belongs to the company by `Membership`; the assignment determines which locations you can work as a manager/worker.
- States `ACTIVA`/`REVOCADA`; `revoked_at` consistent with CHECK. Row is preserved when revoking. Reactivate reuses the same relationship, without duplicating it.
- El campo de clave es `user_id`, **no `membership_id`**; API exposes `membership_id` solving the membership of the same tenant. **deliberate** and should be evaluated with FK, not changed in style.

### 2.3. New HTTP Block Operations

Common prefix: `/api/v1/businesses/{business_id}`. All require valid bearer and review session, user, membership and company.

| Method | Exact suffix | Semantics | Success |
|---|---|---|---|
| POST | `/locations` | Create Location, First Main | 201 |
| GET | `/locations` | List Tenant Locations | 200 |
| GET | `/locations/{location_id}` | Details of location | 200 |
| PATCH | `/locations/{location_id}` | Edit data, type and capabilities only | 200 |
| PATCH | `/locations/{location_id}/status` | `ACTIVA` / `PAUSADA` | 200 |
| PUT | `/locations/{location_id}/primary` | Main designator | 200 |
| GET | `/locations/{location_id}/assignments` | List active and revoked assignments from a headquarters | 200 |
| PUT | `/locations/{location_id}/assignments/{membership_id}` | Enable/recall assignment, JSON `{"status":"ACTIVA"}` o `{"status":"REVOCADA"}` | 200 |

**No physical DELETE** location or allocation.

Error contracts: no valid session 401; actor without powers 403; tenant, resource or other/non-existent member or inactive membership 404; company suspended before writing, incompatible headquarters/member or PAUSADA headquarters when designating principal 409; protected attributes or invalid body 422. Verify codes **according to route**Not to assume that they all use the exact same set.

### 2.4. Authorization and scope of policy

| Action | ADMINISTRATIVE SERVICE | ADMINISTRATOR | MANAGER | STAFF MEMBER |
|---|---|---|---|---|
| Read Tenant Locations | Yes | Yes | Yes | Yes |
| Create/Edit/pause/reactivate/main design | Yes | Yes | No | No |
| Consult and manage assignments | Yes | Yes | No | No |
| To be operationally assigned to headquarters in the current contract | Not necessary | Not necessary | Yes | Yes |
| Future operation `SELL`/`STORE` with company/member/assets and compatible capacity | No individual assignment | No individual assignment | Requires Active Assignment | Requires Active Assignment |

The function `can_operate_at_location` is a **policy, which is pure reusable**. **No authorization for an existing sale or reception today**: There are no commercial endpoints yet to invoke it. Check if its parameters and conditions are consistent and safe, without inventing new routes.

Company `SUSPENDIDA`: business and administrative reading is maintained, without changes; member `INACTIVA`: loses effective access. Location `PAUSADA`: does not allow new assignments to be operated or activated; an assignment may remain active but result **ineffective** while the seat or membership is inactive. Administrative revocation is permitted in such cases with active company.

## 3. Deliberate decisions: not correct without evidence and authorization

1. Platform **multi-company/multi-branch**: WALOS is just an example client; neither a single business nor a single business is fixed.
2. `CASA` is a legitimate type; **no** indicates commercial clearance, inventory or public address.
3. No automatic headquarters are generated when creating a company, nor fictitious stock records.
4. The main headquarters is **0.1 ASSISTANCE** per company. Main pause can leave zero principals; do not choose another by surprise.
5. State and principal are managed by separate routes; generic PATCH does not allow writing `status`, `is_primary`, `id` ni `business_id`.
6. There is no global role per headquarters: roles are reused by Company Membership. Having an assignment DOES NOT grant business administration.
7. Only `ENCARGADO`/`TRABAJADOR` are objectives of the high operational allocation; holder and administrator retain independent business power from an assignment.
8. Revocations of assignments from a member who was deactivated or changed roles, and from a paused headquarters (with active enterprise), are allowed to facilitate reorganisation.
9. Revocations remain in line; `revoked_at` gives the last state/revocation, **not a complete history of all changes**.
10. Maps Links: HTTPS structure and supported domains are validated, but **link is not consulted, geocoded, geographical accuracy is not guaranteed**.
11. The SVG 03A is **editorial and summary**: the class `AsignacionUbicacion` with its multiplicity is in the PlantUML source and guide 03A. Do not match the two compositions artificially.
12. The migrations applied are historical and **immutable for this review**. New restrictions are added in an additive way; do not rewrite `e22a`, `e22b` ni `e22d`.
13. Reading locations by active members retains the current contract. `CASA` deserves privacy assessment before deployment, but **a change of visibility would be a business and contract decision**.
14. By deactivating a membership or paused headquarters, an assignment `ACTIVA` ceases to grant effective access without the need to delete the record. **Reactivating membership or headquarters could restore effectiveness to pre-existing assignment**; the reviewer should evaluate and report this behaviour, without unilaterally altering business policy.

## 4. What was NOT done and should continue outside E2-2

- **E2-3:** catalogue of products/services, variants, trade rules and prices.
- **E2-4:** suppliers, purchases and receipt of goods, including headquarters validations by reception.
- **E2-5:** movements, stocks, transfers and rules not to allow deactivating storage capacity with real stock.
- **E2-6:** sales, declared payments, cash, commercial concurrence and actual consumption of `SELL`/`STORE`.
- **E2-7:** Frontend React/FastAPI integration, integrated end-to-end testing and deployment.
- Rules for shift/time assignment, geolocation, legal validation of addresses, complete historical audit, notifications, definitive deletion, QR payment Market Payment and financial accounts.
- Changes in ownership, sessions, registration, invitations, memberships or E2-1 profiles; these belong to the block **previous** and they're out of the review.
- Public production, security tightening, secret management and cargo testing: they do NOT infer from a green IC.

**Nota:** ‘outside E2-2’ does not mean ‘unnecessary’. Register risks and dependencies with your block, without implementing them opportunistically during this audit.

## 5. Migrations, models, archives and tests to be reviewed

**Migration:**

- `backend/alembic/versions/20261108_0008_business_locations.py` → `e22a_locations`: initial table and restrictions.
- `backend/alembic/versions/20261108_0009_location_casa.py` → `e22b_location_casa`: type zoom `CASA` without rewriting the previous one.
- `backend/alembic/versions/20261108_0010_location_assignments.py` → `e22d_assignments`: association and composite FKs; UNIQUE auxiliary in `locations`.

**Block code:** `backend/app/infrastructure/models/location.py` y `location_assignment.py`; `backend/app/modules/locations/` (routers, service, repository, schemas, permissions y variantes `assignment_*`); registration of models in `backend/app/infrastructure/models/__init__.py` y registro de routers en `backend/app/api/v1/router.py`.

**Tests delivered:** `backend/tests/test_location_model.py`, `test_location_integration.py`, `test_location_schemas.py`, `test_location_http.py`, `test_location_api_integration.py`, `test_location_assignment_model.py`, `test_location_assignment_schemas.py`, `test_location_assignment_http.py` y `test_location_assignment_integration.py`. `test_postgres_integration.py` Check the global Alembic review.

**Revise explicitly:** SQL scheme, FK composed tenant-safe, rollback and savepoints, idempotency, authorization with revoked sessions, changing roles, acceptance/denial of protected data, career in choice of principal, states suspended, revocation/reactivation, and consistency of the SVG/PUML 03A. **The presence of a test alone does not prove that it covers all possible races**.

## 6. WHITE LIST OF AMENDMENTS (binding rule)

The permission to modify a route also requires a **demonstrated finding and a justified correction**. The listed routes are not an invitation to rewrite files.

~~~yaml
rutas_permitidas_modificar:
  - "plataforma-pyme/backend/app/modules/locations/**"
  - "plataforma-pyme/backend/app/infrastructure/models/location.py"
  - "plataforma-pyme/backend/app/infrastructure/models/location_assignment.py"
  - "plataforma-pyme/backend/tests/test_location*.py"
  - "plataforma-pyme/docs/revisiones/E2-2_INFORME_DE_REVISION.md"
  - "plataforma-pyme/docs/E2-2_D_PERMISOS_POR_UBICACION_PLAN.md"
  - "plataforma-pyme/backend/README.md" # Solo secciones E2-2
  - "plataforma-pyme/entrega-programacion-2/01_ANALISIS_DE_REQUERIMIENTOS.md" # Solo RF-03/E2-2
  - "plataforma-pyme/entrega-programacion-2/02_CASOS_DE_USO.md" # Solo CU-04/E2-2
  - "plataforma-pyme/entrega-programacion-2/03_MODELO_DE_DOMINIO_Y_UML.md" # Solo Ubicaciones/E2-2
  - "plataforma-pyme/entrega-programacion-2/04_ARQUITECTURA_Y_PATRONES.md" # Solo E2-2
  - "plataforma-pyme/entrega-programacion-2/05_MATRIZ_API_Y_TRAZABILIDAD.md" # Solo E2-2
  - "plataforma-pyme/entrega-programacion-2/README.md" # Índice/estado E2-2
  - "plataforma-pyme/entrega-programacion-2/diagramas/03A_CLASES_IDENTIDAD_Y_CATALOGO.puml" # Solo modelo E2-2
  - "plataforma-pyme/entrega-programacion-2/diagramas/03A_EXPLICACION_IDENTIDAD_EMPRESAS_CATALOGO.md" # Solo E2-2
  - "plataforma-pyme/entrega-programacion-2/diagramas/03A_IDENTIDAD_EMPRESAS_CATALOGO_REDISENADO.svg" # Solo corrección editorial E2-2
  - "plataforma-pyme/entrega-programacion-2/diagramas/README.md" # Solo entrada de 03A E2-2

rutas_excepcionales_solo_con_aprobacion_previa:
  - "plataforma-pyme/backend/alembic/versions/**" # Jamás editar migraciones 0008/0009/0010 aplicadas. Solo NUEVA migración aditiva autorizada.
  - "plataforma-pyme/backend/app/infrastructure/models/__init__.py" # Registro de modelos E2-2, solo si indispensable.
  - "plataforma-pyme/backend/app/api/v1/router.py" # Registro de routers E2-2, no modificar endpoints ajenos.
  - "plataforma-pyme/backend/tests/test_postgres_integration.py" # Solo ajuste de head Alembic si hay migración autorizada.
  - "plataforma-pyme/frontend/src/data/demo/demoStore.ts" # CASA ya incorporado; no refactorizar DEMO.
  - "plataforma-pyme/docs/10_E1_B3_UBICACIONES_DEMO.md" # Solo si se detecta error factual E2-2.
rutas_prohibidas_o_solo_lectura:
  - "plataforma-pyme/backend/app/modules/auth/**"
  - "plataforma-pyme/backend/app/modules/businesses/**"
  - "plataforma-pyme/backend/app/infrastructure/models/user.py"
  - "plataforma-pyme/backend/app/infrastructure/models/membership.py"
  - "plataforma-pyme/backend/app/infrastructure/models/business.py"
  - "plataforma-pyme/backend/app/infrastructure/db.py"
  - "plataforma-pyme/backend/app/infrastructure/config.py"
  - "plataforma-pyme/backend/app/main.py"
  - "plataforma-pyme/backend/alembic/env.py"
  - "plataforma-pyme/backend/alembic/versions/20261108_0008_business_locations.py"
  - "plataforma-pyme/backend/alembic/versions/20261108_0009_location_casa.py"
  - "plataforma-pyme/backend/alembic/versions/20261108_0010_location_assignments.py"
  - "plataforma-pyme/compose.yaml"
  - ".github/workflows/**"
  - "plataforma-pyme/entrega-programacion-2/diagramas/03B*"
  - "plataforma-pyme/entrega-programacion-2/diagramas/03C*"
  - "plataforma-pyme/docs/revisiones/E2-1_*"
  - "plataforma-pyme/docs/revisiones/GUIA_MAESTRA_REVISION_BLOQUES_E2_ASISTENTE_PYME.md"
  - "plataforma-pyme/docs/revisiones/E2-2_ENTREGA_PARA_REVISION.md"
  - "plataforma-pyme/entrega-programacion-2/REVISION_INDEPENDIENTE_E2-1.md"
  - "cualquier_otra_ruta_no_autorizada/**"
regla_por_defecto: "Si no está expresamente permitida, es SOLO LECTURA."
~~~

**Do not evade the whitelist** creating a new file outside those paths, copying another module or changing global settings for a test to pass. If an exceptional correction arises, **describe the finding, anticipated diff, risks and tests; request approval before editing**. A vulnerability beyond reach is raised as a priority finding; it is not hidden.

## 7. Evidence received: starting basis, NO result of reviewer

| Ctrl | Evidence of the author / IC | Status for the reviewer |
|---|---|---|
| PostgreSQL / Alembic | `e22d_assignments (head)`; `No new upgrade operations detected.` | `REPORTADO_POR_AUTOR` until you reproduce |
| Local Pytest Windows | **371 passed in 47.57s** | `REPORTADO_POR_AUTOR` |
| Docker | `asistente-pyme-e2-api-1` y `db-1` healthy | `REPORTADO_POR_AUTOR` |
| Readiness | `GET http://127.0.0.1:18000/ready` → `ready / ok` | `REPORTADO_POR_AUTOR` |
| CI Python 3.12 | **371 passed**, driftless migration | CI E2-2 D, `CI_PASS_VERIFICADO` in SHA `3cd7bce...` |
| CI Python 3.14 | **371 passed**, driftless migration | Same run and SHA; `CI_PASS_VERIFICADO` |
| CI Docker | Work "Constructe image and verify liveness" approved | Same run and SHA; `CI_PASS_VERIFICADO` |

Local validation was reported by the author; **the reviewer must not declare it executed personally**. Subsequent committal of documentation is not a new execution of IC.

## 8. Git Protocol: Fixed branch, separable changes and non-merge PR

### Fase A. Confirmar acceso y crear rama

- Confirm actual folder access `plataforma-pyme/` and to documents 01–05 and diagrams; if any file is missing, stop only the analysis affected and indicate it. Do not invent readings.
- Use preferably **other clean clone** or a isolated worktree. Do not delete personal files, third-party changes or untracked files.
- Get **the exact SHA of PUBLISHING this delivery message sheet**. Check your commit and that the file `E2-2_ENTREGA_PARA_REVISION.md` exists in it.

~~~powershell
git clone https://github.com/JoaquinOjedaDev/Orbit.git
cd Orbit
git fetch origin
git status --short

# Reemplazar con el SHA COMPLETO indicado por el responsable.
$SHA_CORTE = "SHA_DE_PUBLICACION_RECIBIDO"
git show --no-patch --format="%H %s" $SHA_CORTE
git cat-file -e "$SHA_CORTE^{commit}"

git switch -c review/e2-2-ubicaciones $SHA_CORTE
git branch --show-current
git rev-parse HEAD
~~~

If the branch already exists, **do not overwrite it** ni ejecutar `reset --hard`: coordinate. Never create branch from a `main` moved without checking the exact SHA.

### Phase B. Audit before editing

1. Read sheet, master guide, 01–05, 03A and real code. Create matrix RF-03/CU-04 → routes → services → repositories/models → migrations → tests → documents.
2. View diff from `51ec1161045ca3458807e60612fb7c6d3f9f2d52` to the cutting SHA; **filter by E2-2 files** and exclude E2-1 deliveries. Distinguish new cross-compatibility code.
3. Register potential defects with evidence (file + line, SQL/HTTP/reproducible test and risk). **P0/P1/P2/P3**. Before editing, decide which corrections are really necessary.
4. Checking conscious decisions in Section 3. A discrepancy in historical document should be labeled as historic, not "corrected" by rewriting E2-1.
5. Specially assess **revocation + reactivation** membership/headquarters, privacy of `CASA`, transactions and continuance, FKs tenant-safe, high duplicates and authorization at each point.

### Phase C. Correcting only the Justifiable

- Edit only allowlist; preserve previous E2-1, DEMO, DB and API contracts. **A finding = a logical change and preferably a commit**, with ID `REV-E2-2-###` y `MOD-E2-2-###`.
- Each code correction must provide regression test that **fail before and pass after**, when reproducible. To explicitly document exceptions.
- Avoid unnecessary cosmetic changes or refactors. Do not ‘normalise’ other modules or touch 03B/03C.
- For a new migration or cross-sectional file, request prior permission and explain compatibility, data, rollback and dependencies; do not delete or recreate DB as remedy.

### Phase D. Test in secure environment

**From `plataforma-pyme/backend/` in a known and isolated development DB** (adapt the interpreter to his own environment, without assuming that of the author):

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

`alembic upgrade head` **only on a safe basis**; if the connection does not exist or fails, register `OMITIDO_SIN_ENTORNO`, no `EJECUTADO_PASS`Do not use `stamp`, `downgrade` destructive, `docker compose down -v`, SQL cleaning or `git reset --hard`.

**From `plataforma-pyme/`:**

~~~powershell
docker compose --profile api up -d --build --wait api
docker compose ps
Invoke-RestMethod http://127.0.0.1:18000/ready
~~~

Review the IC of the **Reviewer's PR**, associated with the PR SHA, not only the historical IC of `3cd7bce`.

**Test-permitted States:** `EJECUTADO_PASS`, `EJECUTADO_FAIL`, `OMITIDO_SIN_ENTORNO`, `NO_EJECUTADO`, `CI_PENDIENTE`; for verified CI indicate `CI_PASS_VERIFICADO` o `CI_FAIL_VERIFICADO`Each state must include command, environment, SHA, evidence and limit.

### Phase E. Publish and NOT integrate

~~~powershell
git status --short
git diff --check
git diff --stat

# Agregar EXPLÍCITAMENTE los archivos reales permitidos.
# Ejemplo del informe, obligatorio aunque no haya cambios en el código:
git add plataforma-pyme/docs/revisiones/E2-2_INFORME_DE_REVISION.md
git commit -m "docs(review): informe E2-2 con evidencias y decisiones"
git push -u origin review/e2-2-ubicaciones
~~~

The example assumes a report created and, in the event of other changes, that have been added/confirmed in a controlled manner in previous commitments. **Do not use `git add -A` Indiscriminate** or push. Open PR **base `main` ← head `review/e2-2-ubicaciones`**preferably draft until the entire audit is completed. **The reviewer does NOT merge your PR**The responsible person shall evaluate the selective integration.

**Si `main` progresses during the review:** prohibited from doing `git rebase origin/main` o `git merge origin/main` without authorisation. Keep the SHA frozen, register current SHA of `main` and differences/conflicts. If collision occurs, dial `CONFLICTO_CON_MAIN` The resolution, cherry pick or selective merge shall be the responsibility of the responsible.

## 9. Second deliverable: Comprehensive report of the comrade

Fixed name: **`plataforma-pyme/docs/revisiones/E2-2_INFORME_DE_REVISION.md`**, versioned **in the same branch and PR**. Complete it with self-evident, do not copy it as if the author's results were yours. The report will have parseable YAML header:

~~~yaml
---
tipo_documento: "INFORME_DE_REVISION"
bloque: "E2-2"
rama: "review/e2-2-ubicaciones"
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
pruebas_regresion: null # EJECUTADO_PASS | EJECUTADO_FAIL | OMITIDO_SIN_ENTORNO | NO_EJECUTADO
ci_del_pr: null # CI_PENDIENTE | CI_PASS_VERIFICADO | CI_FAIL_VERIFICADO
---
~~~

**Compulsory sections in prose:**

1. Executive summary and recommendation, amounts P0–P3 and limitations.
2. Access confirmation: files actually inspected and SHA accurate.
3. Initial status: RF-03/CU-04 table, HTTP operations, models and migrations, respected design decisions.
4. Methodology: permission revision, SQL, API, concurrent/idempotency and documents (with checks performed).
5. Findings `REV-E2-2-###`: exact evidence, priority, impact, current/expected behavior, reproduction, correction or reason not to correct.
6. Amendments `MOD-E2-2-###`: individual commit(s), file/lines, before/after, compatibility, new test, risk and dependence on other modification.
7. Findings **not corrected** out of reach, lack of information, business decision or regression risk. Explain why.
8. E2-0/E2-1 compatibility, existing migrations, DEMO, data and `main` posterior.
9. Consistency with Documents 01–05, UML 03A PUML/guide/SVG (unchanged 03B/03C).
10. Test table with command, environment, date, SHA, normalized status, literal result and source. Distinguishing tests typical of historical CI and IC from the RP.
11. **Selective decision matrix** to decide what to take and what to discard.
12. Changed files/commits, whitelist verification, dependencies between commits, residual backlog.
13. Final opinion and PR URL; explicit statement that **NO Merge**.

### 9.1. ObligATORY matrix to accept separate changes

| Change ID | Finding that he attends | Commit SHA | Files | Priority | Concrete functional change | Own proof and CI | Compatibility / regression | Depends on another change | Reviewing suggestion | Team decision |
|---|---|---|---|---|---|---|---|---|---|---|
| MOD-E2-2-001 | REV-E2-2-001 | Actual SHA | actual routes | P1/P2/... | before/after | evidence | impacto | yes/no, IDs | **ACCEPT/REJECT/JUST/DIFFERENCE** | **PENDING** |

La columna `Decisión del equipo` You must remain **PENDING** until our meeting. The suggestion of the reviewer **is not permission to merge**. If a correction requires two commitments, explain the dependency and order of application.

**Example of desired separation:** a P1 bug demonstrated with test on one commit and an aesthetic improvement P3 on another; we can accept the first and discard the second. If the reviewer mixes both in a single commit, it should facilitate a separable diff or explain why it cannot.

### 9.2. Priority and result taxonomy

| Status | Recommended status |
|---|---|
| Zero P0/P1 pending, satisfactory own relevant evidence, PR CI verified when applying, no scope breach or regressions | `APTO` |
| Zero P0/P1, only documented P2/P3 and relevant satisfactory evidence | `APTO_CON_OBSERVACIONES` |
| P0/P1 pending or critical evidence failed | `REQUIERE_CORRECCIONES` |
| Unauthorized issues, severe breach of contracts, loss of data, incompatible migration or unresolved conflicts | `BLOQUEADO` |

No environment for critical tests, no calling `PASS` The absence of findings does not enable the report to affirm perfection; it must explain evidence and limits.

## 10. Reviewer ' s technical checklist

- [ ] Fixed SHA and real access; code check and documentation from the same cut.
- [ ] No change in E2-0/E2-1, frontend DEMO or 03B/03C.
- [ ] Multi-company registration and initial zero headquarters; type `CASA` and 4 combinations of `can_sell`/`can_store`.
- [ ] Uniqueness of main ACTIVA per company, transaction and absence of automatic choice when reactivating.
- [ ] Consultations for tenant even when knowing UUID from another; 401/403/404/409/422 per stage.
- [ ] Assignment only of valid member of the same tenant; composite FKs and triple PK.
- [ ] Revoke/reactivate, idempotency and consistency `revoked_at` without deleting rows.
- [ ] Inactivation of business/membership/headquarters nullifies effective access; evaluate reactivations.
- [ ] Policy `SELL`/`STORE` does not allow incompatible capacity or revoked allocation; does not confuse with commercial execution.
- [ ] Security and privacy of `CASA` and validation of `map_url` assessed without introducing unauthorized product changes.
- [ ] True PostgreSQL tests, rollback, concurrent conditions and potential SQL conflicts.
- [ ] Documents 01–05, 03A PlantUML and SVG consistent with deliberate editorial differences.
- [ ] Whitelist files only; exceptional changes requested before application.
- [ ] Complete report, selective matrix, PR IC, `main` posterior y PR **sin merge**.

## 11. Closure of work requested

The comrade will deliver **two things**: **(a)** un Pull Request de `review/e2-2-ubicaciones` a `main`, not merged, with only justified local corrections; **(b)** full report `E2-2_INFORME_DE_REVISION.md` versioned within that PR, even if no code file has changed.

Our team will review **finding by finding and commit by commit**, decide what to incorporate and if `main` The E2-2 audit does not allow progress or modification of other blocks. **E2-3 Catalog is planned separately after closing delivery and review mechanism.**
