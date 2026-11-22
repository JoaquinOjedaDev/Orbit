---
type_document: "INREGA_PARA_REVISION"
project: "Orbit — Programming 2, UNSAM"
block: "E2-1"
name: "Identity, authentication, companies, roles, permissions, invitations and memberships"
version: "1.0"
_Cut date: "2026-11-08"
repository: "JoaquinOjedaDev/Orbit"
folder: "platform-pyme/"
rama_origen: "main"
branch_review: review/e2-1-company identity
commit_e2_0_previo: "5a5a8afb4495818828543a6625694ea01a49fb9c"
commit_e2_1_funcional_ci: "8cd167481291b78628da0d038c7414cc26e3a311"
commit_closing_technical_documentary: "53aa3863d5fd827ef6c8108386cc4e0885be687a"
commit_guia_maestra: "fb34b6c53f283d60f774d390caa6dd61b92fdd7f"
base_branch_revision: "SHA_DE_PUBLISHMENT_DE_EST_SHOOT_INFORMED_FOR_THE_RESPOSSABLE"
reviewer_report: "platform-pyme/docs/revisions/E2-1_INFORME_DE_REVISION.md"
status: "CLOSED_PARA_REVISION_INDEPENDENT"
merge_per_revisor: false
---

# E2-1 — Formal delivery for controlled audit and corrections

**For:** fellow reviewer and his AI. **This document is NOT the audit report.** It is the specification of the work that is delivered to review. The companion must develop his analysis, correct only the justifiable **en su rama** and prepare the detailed report within Pull Request.

> **Priority rule:** respect the previous integration and incremental growth of the platform. **Do not rewrite previous modules, do not redesign the project, do not implement future functionalities and do not modify components off the whitelist.** A review with zero code changes is valid if the evidence supports it. **Never push straight to `main` ni fusionar el PR.**

## 1. Git sources, precedence and references

Compulsory reading and in this order:

1. **This sheet of E2-1** (scope, editing permissions and revision basis).
2. [Master guide v1.1](GUIA_MAESTRA_REVISION_BLOQUES_E2_ASISTENTE_PYME.md): audit methodology, test results, report and PR. **The specific sheet prevails against a divergence with a generic example of the guide.**
3. [Documents 01–05](../../entrega-programacion-2/README.md)especially [05 — API matrix and traceability](../../entrega-programacion-2/05_MATRIZ_API_Y_TRAZABILIDAD.md).
4. [Modelo 03A PlantUML](../../entrega-programacion-2/diagramas/03A_CLASES_IDENTIDAD_Y_CATALOGO.puml), [SVG 03A](../../entrega-programacion-2/diagramas/03A_IDENTIDAD_EMPRESAS_CATALOGO_REDISENADO.svg) y [guide 03A](../../entrega-programacion-2/diagramas/03A_EXPLICACION_IDENTIDAD_EMPRESAS_CATALOGO.md).
5. `plataforma-pyme/backend/`: models, routers, services, repositories, permissions, migrations, tests and README **Actual**.
6. [Previous technical guide](../../entrega-programacion-2/REVISION_INDEPENDIENTE_E2-1.md), **only supplementary reference**It doesn't replace these rules.
7. CI de C.4b.

| Reference | SHA in full | Meaning |
|---|---|---|
| Last E2-0 before E2-1 | `5a5a8afb4495818828543a6625694ea01a49fb9c` | Historical limit: **What is inherited is preserved** |
| Last functional commit C.4b with verified CI | `8cd167481291b78628da0d038c7414cc26e3a311` | Backend y pruebas de E2-1 |
| Closure of documents C.5 and initial guide | `53aa3863d5fd827ef6c8108386cc4e0885be687a` | Technical and documentary basis to be audited |
| Incorporation of master guide into the repo | `fb34b6c53f283d60f774d390caa6dd61b92fdd7f` | Review protocol |
| **Publication of this sheet** | **SHA fully informed by the responsible person next to the link of this delivery** | **Exact commit to create the revision branch**, because it includes the two leaves |

**Important on the basis of:** code/documentation E2-1 was frozen in `53aa386...`. Subsequent commitments only incorporate protocols. Your partner's branch **must start from the commit that adds THIS sheet** (the exact SHA you will receive next to the link); otherwise it will not include revision documents. That SHA cannot appear inside the file itself before Git generates it. **Do not use `origin/main` as a mobile base** If he had made progress.

As an optional historical analysis, compare the previous status `5a5a8afb...` with the last C.4b `8cd16748...`. The rank helps to distinguish responsibilities, **does not extend the list of editable files**.

## 2. Objectives and scope actually built

**Product:** Orbit, management platform **generalist, multi-rub and multi-enterprise**. WALOS is an example business, not the product. A person has a global identity and can be linked to several companies with specific roles of each. Business security should work even if the frontend React continues as local DEMO.

**E2-1 objectives:**

1. Registration, identity validation, secure passwords and personal sessions persisted in PostgreSQL.
2. Companies with historical founder, initial membership and isolation by `business_id`.
3. Role and permission for **current membership in each tenant**, without global role or confidence in customer data.
4. Atomic and idempotent business creation to avoid duplication against retempt/concurrence.
5. Directed issuance of secure invitations, authenticated acceptance and creation/reactivation of a single membership.
6. Directory of equipment and controlled changes of operational/state roles, preserving ownership.
7. Unit/HTTP/SQL integration tests, migrations and document synchronization 01–05 with UML 03A.

### Internal deliveries already made

| Paso | What developed | Local tests reported |
|---|---|---:|
| E2-1.1 | Entity `User`, tabla `users` and identity restrictions | Integrated into successive regressions |
| E2-1.2A/B | Log with Argon2id; login, `/me`, logout, revocable sessions and expiration | Integrated into successive regressions |
| E2-1.3A/B | `Business`, `Membership`, founder, initial holder, creation of an independent company and consultations with its own companies | Integrated into successive regressions |
| C.1 | RBAC matrix and idempotent recovery correction | **98** |
| C.2 | `PATCH` business profile, permits and real isolation | **125** |
| C.3 | Issue of invitations by company/rol | **147** |
| C.4a | Authentic acceptance, single membership, rollback | **171** |
| C.4b | `GET` equipment and `PATCH` role/state per holder | **195** |
| C.5 | Documents 01–05, README and UML 03A updated | **Documentation only; no new tests** |

The numbers are totals accumulated per cut; **not adding them**.

### HTTP operations to audit

| Group | Method and route | Objective |
|---|---|---|
| Salud | `GET /health`, `GET /ready` | Previous infrastructure E2-0: **only verify compatibility; do not modify** |
| Authentication | `POST /api/v1/auth/register`, `POST /api/v1/auth/login` | Account discharge and login |
| Authentication | `GET /api/v1/auth/me`, `POST /api/v1/auth/logout` | Authenticated identity and revocation |
| Companies | `POST /api/v1/businesses` | High + initial holder + idempotency |
| Companies | `GET /api/v1/businesses`, `GET /api/v1/businesses/{business_id}` | List/consult your own companies |
| Companies | `PATCH /api/v1/businesses/{business_id}` | Edit Profile According to RBAC |
| Invitations | `POST /api/v1/businesses/{business_id}/invitations` | Authorized emission, single access token |
| Invitations | `POST /api/v1/invitations/accept` | Acceptance by authenticated consignee |
| Equipment | `GET /api/v1/businesses/{business_id}/memberships` | Directory limited to holder/administrator |
| Equipment | `PATCH /api/v1/businesses/{business_id}/memberships/{membership_id}` | Role change/collaboration status only per holder |

**HTTP expected:** to contract each specific contract in Document 05. `401` sin auth; `403` without permission for a company of its own; `404` other person/non-existent resource; `409` conflicts or incompatible states; `422` invalid data. Idepotent creation can return `201` al crear y `200` when recovering result from a valid retry. **Do not unify codes without reviewing rules and tests.**

### RBAC matrix to be preserved

| Excuse me. | ADMINISTRATIVE SERVICE | ADMINISTRATOR | MANAGER | STAFF MEMBER |
|---|---|---|---|---|
| `business.view` | Yes | Yes | Yes | Yes |
| `business.profile.edit` | Yes | Yes | No | No |
| `members.invite` | Yes | Yes | No | No |
| `members.read` | Yes | Yes | No | No |
| `members.manage` | Yes | No | No | No |

**Cross-cutting rules:** `Membership` Accurate tenant active; roles/unknown states denied; `SUSPENDIDA` allows for informative reading of the profile but no modifications or sensitive directory. **no** He's allowed to play a role in company B.

## 3. Deliberate design decisions — NOT "correct" by preference

| Conscious decision | Reason/involvement |
|---|---|
| `User` global, rol por `Membership` | Multitenence without global business privileges |
| `founder_user_id` • current holder | The founder does not grant perpetual permission nor necessarily represents legal property |
| New company with initial holder in transaction | Do not leave companies without initial administrator |
| Contents `uq_memberships_one_active_owner` | Impone **not more than one** active; creation requires the existence of initial |
| One membership per company+user | Avoid duplication by accepting or reactivating |
| Invitation to mail without prior account | Issue does not grant access; accepting requires authenticated email account |
| Inviteable roles limited to `ENCARGADO` y `TRABAJADOR` | Do not create administrators/titlers with basic invitation |
| Administrator may invite/read, but no `members.manage` | The holder is reserved for the administration of privileges of the team |
| Secret invitation delivered only in response 201 | To persist exclusively hash SHA-256; seven days period |
| C.4b did not modify the outline | Reuse `Membership` and their existing status/rol |
| React DEMO code decoupled | Real integration belongs to E2-7 |
| UML 03A conceptual | PlantUML retains optional and mandatory sender; SVG can summarize; Location/Catalog/Provider still TO-BE |
| Company without default location | Services do not require fictitious deposit |

If a requirement, document and code contradict each other, the reviewer **DOES NOT change unilaterally** Business rules. `DECISION_REQUERIDA` with evidence from both sides, alternatives and risk. **legitimate subsequent decision** with a bug just because it differs from an old design.

## 4. What was NOT implemented and should remain pending

**Identity/equipment:** transfer or cessation of ownership; verification/recovery of mail and password; automatic sending, rejection, cancellation, forwarding and administrative listing of invitations; editing of `job_title`; historical audit of role changes; physical removal of members; comprehensive protection for public internet (HTTPS, rate limiting, anti-abuse controls, etc.); integration with React; public deployment.

**Blocks expressly excluded:** E2-2 locations; E2-3 catalog and variants; E2-4 suppliers/purchases/reception; E2-5 inventory and movements; E2-6 sales/payments; E2-7 integration frontend/backend, QA integral and deployment; Pay/QR real market, reconciliation, production, analytics and other deferred extensions.

**The academic slogan requires more than E2-1:** among other points, an API covering **at least five high-level RF**, tests, IQ, patterns and deployment. Here RF-01/RF-02 have backend; RF-03–RF-07 are still pending. **Do not implement E2-2–E2-7 ahead of time during this review.** Yes document risks or dependencies if they affect the future.

## 5. Evidence of closure received by the reviewer

| Verification | Result received | Origin |
|---|---|---|
| Pytest with PostgreSQL | `195 passed in 23.86s` | Local Windows output provided by the developer |
| Alembic | `e213c4_acceptance (head)`, `No new upgrade operations detected.` | Local exit provided |
| Docker | API and PostgreSQL `healthy` con `--wait` | Local exit provided |
| `GET /ready` | `status=ready`; `database=ok` | Local exit provided |
| GitHub Actions | 3/3 jobs `success` for SHA `8cd1674`: Python 3.12/PostgreSQL, Python 3.14/PostgreSQL y Docker liveness | Run 42472269979 |

**Accuracy:** Windows data are **`REPORTADO_POR_AUTOR`** until the companion reproduces them. **`8cd1674`**, not to an alleged IQ of C.5 or its future branch. Relevant migrations culminate in `e213c4_acceptance`; do not edit any applied historical migration.

## 6. Whitelist of E2-1 modifications

**Default:** any file **not expressly authorized** es **READING ONLY**. Previous infrastructure can be consulted to understand dependencies, **not to change it**.

### 6.1. Default editable files ONLY by a confirmed/justified finding

```yaml
rutas_permitidas_modificar:
  - "plataforma-pyme/backend/app/modules/auth/**"
  - "plataforma-pyme/backend/app/modules/businesses/**"
  - "plataforma-pyme/backend/tests/test_auth*.py"
  - "plataforma-pyme/backend/tests/test_user*.py"
  - "plataforma-pyme/backend/tests/test_business*.py"
  - "plataforma-pyme/entrega-programacion-2/01_ANALISIS_DE_REQUERIMIENTOS.md"
  - "plataforma-pyme/entrega-programacion-2/02_CASOS_DE_USO.md"
  - "plataforma-pyme/entrega-programacion-2/03_MODELO_DE_DOMINIO_Y_UML.md"
  - "plataforma-pyme/entrega-programacion-2/04_ARQUITECTURA_Y_PATRONES.md"
  - "plataforma-pyme/entrega-programacion-2/05_MATRIZ_API_Y_TRAZABILIDAD.md"
  - "plataforma-pyme/backend/README.md"
  - "plataforma-pyme/entrega-programacion-2/diagramas/03A_CLASES_IDENTIDAD_Y_CATALOGO.puml"
  - "plataforma-pyme/entrega-programacion-2/diagramas/03A_IDENTIDAD_EMPRESAS_CATALOGO_REDISENADO.svg"
  - "plataforma-pyme/entrega-programacion-2/diagramas/03A_EXPLICACION_IDENTIDAD_EMPRESAS_CATALOGO.md"
  - "plataforma-pyme/docs/revisiones/E2-1_INFORME_DE_REVISION.md"
```

**Rule for documentation:** edit **only** sections affected by a real correction, keep the remaining decisions and state TO-BE, do not rewrite 01–05. UML 03A: correct content if it is wrong and synchronize source/export; **not regenerate aesthetics by taste**. Prefer a new test `test_auth*`/`test_user*`/`test_business*` to disable existing tests.

### 6.2. Exceptional edition — requires prior authorization for finding

```yaml
rutas_condicionadas_a_aprobacion:
  - "plataforma-pyme/backend/app/infrastructure/models/user.py"
  - "plataforma-pyme/backend/app/infrastructure/models/auth_session.py"
  - "plataforma-pyme/backend/app/infrastructure/models/business.py"
  - "plataforma-pyme/backend/app/infrastructure/models/membership.py"
  - "plataforma-pyme/backend/app/infrastructure/models/business_creation_request.py"
  - "plataforma-pyme/backend/app/infrastructure/models/business_invitation.py"
  - "plataforma-pyme/backend/app/infrastructure/models/__init__.py"
  - "plataforma-pyme/backend/app/api/dependencies.py"
  - "plataforma-pyme/backend/app/api/v1/router.py"
  - "plataforma-pyme/backend/pyproject.toml"
  - "plataforma-pyme/backend/alembic/env.py"
  - "cualquier_nueva_migracion_alembic"
regla: "Proponer cambios con ID, impacto, test y compatibilidad; esperar aprobación."
```

They can be **read** to identify errors. Do not change tables, FK, UNIQUE, CHECK or shared contracts without explicit authorization. **Forbidden to rewrite historical migrations already applied.** If a correction requires a new migration, its compatibility/rollback plan is first proposed and left pending.

### 6.3. Read only / prohibited from modifying in this review

```yaml
rutas_prohibidas_modificar:
  - "plataforma-pyme/frontend/**"
  - "plataforma-pyme/docs/00_*"
  - "plataforma-pyme/docs/01_*"
  - "plataforma-pyme/docs/02_*"
  - "plataforma-pyme/docs/03_*"
  - "plataforma-pyme/docs/04_*"
  - "plataforma-pyme/docs/05_*"
  - "plataforma-pyme/docs/06_*"
  - "plataforma-pyme/docs/07_*"
  - "plataforma-pyme/docs/08_*"
  - "plataforma-pyme/docs/09_*"
  - "plataforma-pyme/docs/1*"
  - "plataforma-pyme/docs/2*"
  - "plataforma-pyme/docs/ADR/**"
  - "plataforma-pyme/backend/app/infrastructure/db.py"
  - "plataforma-pyme/backend/app/infrastructure/models/base.py"
  - "plataforma-pyme/backend/app/core/**"
  - "plataforma-pyme/backend/app/main.py"
  - "plataforma-pyme/backend/alembic/versions/**"
  - "plataforma-pyme/backend/tests/test_db*.py"
  - "plataforma-pyme/backend/tests/test_postgres_integration.py"
  - "plataforma-pyme/backend/tests/test_health.py"
  - "plataforma-pyme/backend/tests/test_readiness.py"
  - "plataforma-pyme/compose.yaml"
  - "plataforma-pyme/.env.example"
  - "plataforma-pyme/.gitignore"
  - ".github/workflows/**"
  - "plataforma-pyme/entrega-programacion-2/diagramas/03B*"
  - "plataforma-pyme/entrega-programacion-2/diagramas/03C*"
  - "plataforma-pyme/entrega-programacion-2/REVISION_INDEPENDIENTE_E2-1.md"
  - "plataforma-pyme/docs/revisiones/GUIA_MAESTRA_REVISION_BLOQUES_E2_ASISTENTE_PYME.md"
  - "plataforma-pyme/docs/revisiones/E2-1_ENTREGA_PARA_REVISION.md"
  - "cualquier_otra_carpeta_del_repositorio/**"
default: "Si no está en rutas_permitidas_modificar, es de SOLO LECTURA."
```

These rules **preserve E2-0, E1, 03B/03C and other projects**If a major finding is outside the allowlist, **report it** without fixing it quietly. It is not valid to make an unauthorized change "to pass the tests".

## 7. Review process in Git and Pull Request

### 7.1. Phase A — confirm access and create branch from exact SHA

Verify actual access to documents, code and tests, set the commit of **publication of this sheet** communicated by the responsible; not rely only on a catch. Work preferably on a **isolated clone**. If there are unversed files or of another person, **do not delete them**.

```powershell
git clone https://github.com/JoaquinOjedaDev/Orbit.git
cd Orbit
git fetch origin
git status --short
$BASE_REVISION = "SHA_COMPLETO_DE_LA_ENTREGA_COMUNICADO_POR_EL_RESPONSABLE"
git show --no-patch --format="%H %s" $BASE_REVISION
git cat-file -e "$($BASE_REVISION):plataforma-pyme/docs/revisiones/E2-1_ENTREGA_PARA_REVISION.md"
git cat-file -e "$($BASE_REVISION):plataforma-pyme/docs/revisiones/GUIA_MAESTRA_REVISION_BLOQUES_E2_ASISTENTE_PYME.md"
git switch -c review/e2-1-identidad-empresas $BASE_REVISION
git rev-parse HEAD
git branch --show-current
```

**Without permission to write in the repo:** use fork own, create the same branch from the same SHA and present PR from the fork to the `main` Not sharing credentials.

### 7.2. Phase B — Read-only audit, before correction

Form Matrix `RF/RN → CU → HTTP/endpoint → schema/service/repository/model → prueba → doc/03A → estado`. Review positive, negative controls, RBAC, tenant isolation, idempotency, competition, transaction integrity and migrations.

Sort Findings as `BUG_CONFIRMADO`, `RIESGO_FUNDAMENTADO`, `DOCUMENTACION_INCONSISTENTE`, `COBERTURA_INSUFICIENTE`, `MEJORA_OPCIONAL` o `DECISION_REQUERIDA`. Each substantive conclusion requires **file, symbol, evidence, impact and contrast with RF/CU**Don't invent files or bugs.

### 7.3. Phase C — Minimum corrections and separable commit

| Priority | Definition | Planned action |
|---|---|---|
| P0 | Security/critical integrity or loss/exposure of data | Correct only if local and safe; if beyond reach, stop that change and consult |
| P1 | Reproduced Bug, regression or significant non-compliance | Timely correction with regression test |
| P2 | Risk, weak coverage, documentary inconsistency | Correct only if provided and within the allowlist; otherwise report |
| P3 | Aesthetic, style, optional refactor | Normally **not to change**Just suggest |

A finding uses ID `REV-E2-1-###`; each change `MOD-E2-1-###`. **Prefer a commit by logical correction** so that we can accept one and reject another. Do not mix a small arrangement with a structural rewrite. Keep all previous contracts and functionalities. If there are no justifiable faults, **not invent changes**.

### 7.4. Fase D — comprobar tests y regresiones

At a base of **self-development, isolated and secure**, from `plataforma-pyme/backend/`:

```powershell
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check
$env:RUN_DB_INTEGRATION = "1"
try {
    .\.venv\Scripts\python.exe -m pytest -q
} finally {
    Remove-Item Env:\RUN_DB_INTEGRATION -ErrorAction SilentlyContinue
}
```

To check Docker, from `plataforma-pyme/`:

```powershell
docker compose --profile api up -d --build --wait api
docker compose ps
Invoke-RestMethod http://127.0.0.1:18000/ready
```

Do not make changes in production. Do not run `git clean -fd`, `git reset --hard`, `docker compose down -v`, `alembic stamp`, destructive downgrades or operations that erase data. Do not publish files `.env`, logs with passwords or tokens.

**Reporting States:**

| Status | Meaning |
|---|---|
| `EJECUTADO_PASS` | The reviewer executed and approved |
| `EJECUTADO_FAIL` | The reviewer executed and detected faults |
| `OMITIDO_SIN_ENTORNO` | Could not execute due to lack of PostgreSQL, Docker, service or other specific dependencies |
| `NO_EJECUTADO` | No attempt; explain |
| `CI_PENDIENTE` | Absence of PR CI |
| `CI_PASS_VERIFICADO` / `CI_FAIL_VERIFICADO` | IC revised with URL, status and SHA |
| `REPORTADO_POR_AUTOR` | Developer's previous evidence, not reproduced by the reviewer |
| `NO_APLICA` | Justify why it does not correspond |

Los **195 tests de origen** son `REPORTADO_POR_AUTOR` for AI review until repeated. For each check score **command, directory, date, SHA, environment, past/failed/ missed, evidence and limitations**.

### 7.5. Fase E — publicar rama y PR, NO fusionar

Check the diff (white list only), run `git diff --check`, add files individually with `git add ruta_real` (never `git add -A` ) and make identifiable commitments by finding. Include the final report in the same branch, upload **only** `review/e2-1-identidad-empresas` and open PR with **base `main`**. Puede ser Draft hasta completar tests/informe.

**Prohibitions:** do not push directly to `main`; do not make PR merge; do not force-push on shared branches; do not resolve conflicts by overwriting new code.

### 7.6. Fase F — si `main` changes while checked

**Mechanical rule:** no ejecutar `git rebase origin/main` ni `git merge origin/main` automatically. Keep the branch based on the SHA fixed. `sha_main_al_abrir_pr` y `sha_main_al_cerrar_revision`; if there are incompatibilities dialing `CONFLICTO_CON_MAIN` and detail files. **The decision on integration/rebase/cherry-pick is up to us** when reviewing the PR; do not introduce further developments in silence.

## 8. Audit Technical Checklist (NOT a license to edit)

| Area | What to verify | Evidence |
|---|---|---|
| Registro y passwords | Standard/unique email, Argon2id, answers without secret | `auth`, `User`, tests |
| Sesiones | Login, expiration/revocation, disabled user, bearer hash in DB | `AuthSession`, tests and HTTP |
| Company + holder | High transactional, historical founder, not orphan companies, sole active holder | `Business`, `Membership`, tests |
| Idempotency | Equal/different retry, key per actor, attendance, rollback | `business_creation_requests`Test |
| RBAC | Real SQL source, current role per tenant, default denial | `permissions.py`, routers/services, tests |
| PATCH company | Only fields supported, 401/403/404/409/422, rollback | DTO, service, tests |
| Invitation | Authorized sender, recipient email, limited roles, TTL, token hash and duplicates | `BusinessInvitation`, tests |
| Acceptance | Authenticated destination, maturity/single consumption, reactivation and rollback | `accept`, constraints, tests |
| Equipment | Limited GET, PATCH per holder, target of the same tenant, protected holders | SQL/DTOs/tests |
| Integrity | Blocks, transactions, PK/UNIQUE/FK/CHECK, Alembic head/deriva | Models/migrations/tests |
| Documentation | 01–05/03A correspond to API; 03B/03C are not confused with executable code | Markdown/UML/README |
| CI | Real run for functional code, PR jobs, regressions and evidence | GitHub Actions y SHA |

## 9. FINAL Report that the Partner Must Create (Second Markdown)

**Mandatory route in your RAMA and on the same PR:**

```text
plataforma-pyme/docs/revisiones/E2-1_INFORME_DE_REVISION.md
```

The report should explain **what he found, what changed, why, what left unchanged and how to preserve the above**Your goal is that we can **accept, adjust, reject or defer each change independently**without needing to know the exchanges between his AI and him.

### 9.1. Front matter YAML parseable (rellenar con valores reales)

```yaml
---
bloque: "E2-1"
tipo: "INFORME_DE_REVISION"
commit_base_auditado: "SHA_COMPLETO_DE_PUBLICACION_DE_LA_HOJA"
rama_revision: "review/e2-1-identidad-empresas"
commit_main_al_presentar_pr: null
pr_url: null
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
```

**Don't invent:** if there is still no evidence, use `null` before you deliver, replace all markers with real values or `null` justified.

### 9.2. Mandatory sections of the report

1. Executive Summary: SHA, Status, P0–P3 findings, corrected and pending changes.
2. Confirmed access and files effectively inspected.
3. Initial status of the block and deliberate decisions respected.
4. Methodology and matrix RF/RN → CU → endpoint → code → proof → document/03A.
5. Findings, with evidence and priority, including uncorrected ones.
6. Amendments `MOD-E2-1-###`: commits, files, before/after, risk, tests, compatibility.
7. E2-0, frontend E1 protection, previous schema, roles, API and `main` posterior.
8. Documents 01–05, UML 03A and README: changed or revised without change and why.
9. Tests: actual results, omissions, environment, PR IC and URL/SHA.
10. **Selective acceptance matrix**, units between modifications and the reviewer's recommendation.
11. Residual backlog and functionalities deferred outside the block.
12. Conclusion and statement that there was NO direct push or merge in `main`.

### 9.3. Sheet by finding and modification

```markdown
### REV-E2-1-001 — [Título]
- Prioridad: P0 / P1 / P2 / P3
- Tipo: BUG_CONFIRMADO / RIESGO_FUNDAMENTADO / DOCUMENTACION_INCONSISTENTE /
        COBERTURA_INSUFICIENTE / MEJORA_OPCIONAL / DECISION_REQUERIDA
- Archivo y símbolo / línea: ...
- RF/RN/CU o contrato involucrado: ...
- Evidencia y cómo reproducir: ...
- Comportamiento esperado vs observado: ...
- Impacto: ...
- Estado: CORREGIDO_VALIDADO / CORREGIDO_SIN_VALIDAR / PENDIENTE
- Cambios relacionados: MOD-E2-1-001 / ninguno

### MOD-E2-1-001 — [Corrección]
- Hallazgo: REV-E2-1-001
- Commit(s) del revisor: SHA(s)
- Archivo(s) exactos: ...
- Antes y después: ...
- Beneficio y justificación: ...
- Regresiones y compatibilidad con E2-0/E1/E2-1: ...
- Test y resultado REAL: ...
- Documentos afectados: ...
- ¿Se puede aceptar sin otros cambios?: Sí / No; dependencias
- Recomendación del revisor: ACEPTAR / AJUSTAR / RECHAZAR / DIFERIR
```

### 9.4. Matrix for deciding which modifications we adopt

**OBLIGATORY:** one row per **Each** `MOD`Even if it looks small.

| MOD | Finding | Commit(s) | Change and profit | Files | Evidencia/Tests | Risk/compatibility | Independent | Proposal by the reviser | Decision of us |
|---|---|---|---|---|---|---|---|---|---|
| `MOD-E2-1-001` | `REV-E2-1-001` | Actual SHA | Description | Routes | Status | Risk | Yeah/No, it depends on... | ACCEPT/JUST/REJECT/DIFER | **PENDING** |

**Example of the objective of this matrix:** If the PR fixes a bug P1 and also incorporates an optional refactor, we need to be able to accept the fix and reject the refactor. Prefer separate commit; when changes are inseparable, declare it expressly.

**Table of tests required:**

| Test/command | Directory, environment and date | Standard status | Exact result | Evidencia (URL/commit/log) | Limitation |
|---|---|---|---|---|---|
| Pytest PostgreSQL | ... | EXECUTED_PASS / OMITED_IN_ENORN / ... | X passed / failed | ... | ... |
| Alembic | ... | ... | ... | ... | ... |
| Docker | ... | ... | ... | ... | ... |
| PR IC | GitHub | CI_PASS_VERIFIED / CIT_PENDENT / ... | ... | URL and SHA | ... |

## 10. Rules for the recommendation of the reviser

| Condition | Status of report |
|---|---|
| 0 P0/P1 pending; relevant evidence `EJECUTADO_PASS`; PR CI verified where applicable; no regressions or off-white list changes | `APTO` |
| 0 P0/P1; only P2/P3 non-documented blockers; satisfactory evidence and relevant evidence | `APTO_CON_OBSERVACIONES` |
| P0/P1 pending or critical evidence failed requiring repair | `REQUIERE_CORRECCIONES` |
| Unauthorized out-of-scope changes, severe regression, data loss, incompatible scheme, conflicts of `main` not resolved | `BLOQUEADO` |

**If there is no environment for a critical test:** `OMITIDO_SIN_ENTORNO` NO equals `PASS`. Do not recommend `APTO` based exclusively on historical IQ C.4b or the 195 cases that another person ran. The report should explain what was missing to prove.

### Brief description of Pull Request

The PR summarizes: exact SHA of origin, branch, link to report, P0–P3 findings, changes `MOD`, whitelist compliance, actual tests/CI, E2-0/E1 compatibility, pending decisions and confirmation of **NO MERGE**. The versioned report contains the full detail. If the review is not completed, open **Draft PR**.

## 11. Final acceptance checklist of delivery

- [ ] The AI was able to actually read the code, documents and migrations.
- [ ] He fixed and verified the exact SHA of publication of this sheet.
- [ ] Rama `review/e2-1-identidad-empresas` born of indicated SHA, not a `main` mobile.
- [ ] E2-0, frontend E1, 03B/03C and undisturbed projects.
- [ ] Files edited only allowed or with explicit prior authorization.
- [ ] It did not alter historical migrations or weaken contracts, tenant, permits or atomism.
- [ ] Each correction has finding, justification, test and document if applicable.
- [ ] No evidence, IQ, coverage, files or evidence were invented.
- [ ] No tokens, passwords, `.env` No sensitive data.
- [ ] Report with initial YAML, traceability matrix and selective acceptance matrix.
- [ ] RP CI is distinguished from previous IC from functional commit.
- [ ] Unexecuted evidence and reasons were reported.
- [ ] Si `main` progressed, their SHAs and conflicts were documented without over-/self-contained merchandise.
- [ ] PR published towards `main` y **Not merged**.

## 12. Expected final message from the companion

The companion must send us a synthesis with **(a)** Audited SHA, PR branch and URL; **(b)** URL to the report on your branch; **(c)** number of findings due to severity, corrections and pending; **(d)** actual results and omissions of tests/CI; **(e)** list of changes `MOD-E2-1-###` suggested to accept, adjust, reject or differ; **(f)** risks and decisions on our part; **(g)** confirmation that he did not push/merge to `main` nor did he edit previous blocks.

**Later flow:** We reviewed the report and the PR, decided **for each change** what to keep, adjust or reject whatever is necessary and **only after** We integrate the authorized changes. The review does not give permission to the partner to merge. After closing this second revision you can start E2-2 — Locations.

---

**Success criteria:** useful, reproducible, focused audit with minimally and selectively acceptable corrections; **without losing what already works and integrates the platform**.
