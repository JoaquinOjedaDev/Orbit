# E2-1 — Independent peer review sheet

**Project:** Orbit — Multi-company and multi-rub management generalist API  
**Materia:** Programming 2 (UNSAM)  
**Date of preparation:** 8 November 2026  
**Type:** independent technical review record; **NO audit report or opinion adopted**  
**Reference branch:** `main`  
**Commit code base and documentation (pre-date of this sheet):** `c54461d18020f22483273dad3f14bf6308522fbc`  
**Exclusive Folder:** `plataforma-pyme/`  
**Review mode:** strictly reading the repository; not editing, pushing, entering migrations or correcting files.

## 1. Objective and rule of evidence

Assess if block **E2-1 — authentication, business, tenant authorization and invitations/equipment** It is correctly implemented, tested and documented. It is not enough for tests to pass: review design decisions, interlayer consistency, HTTP contracts, transactions, business isolation, security, SQL scheme and academic traceability.

The review should **distinguish four categories**: (a) observed directly in code/DDL/tests; (b) reproduced by the reviewer in a development environment; (c) reported by the developer or IC, without own reproduction; (d) predicted, deferred or not implemented. Never infer code that could not be consulted. If access to the repository fails, stop the revision of the affected item and document the limitation.

**Do not confuse:** WALOS is just an example business, not the product. React remains a local DEMO decoupled from this API. RF-03–RF-07 are still TO-BE in backend; you must not declare completion of full TP or certify a public deployment.

## 2. Source of truth and links

- Repository: https://github.com/JoaquinOjedaDev/Orbit
- Committee set for audit: historical commit c54461d18020f22483273dad3f14bf6308522fbc
- Code: `plataforma-pyme/backend/` (especially `app/modules/auth/`, `app/modules/businesses/`, `app/infrastructure/models/`, `alembic/versions/` y `tests/`).
- Documents: `plataforma-pyme/entrega-programacion-2/01_ANALISIS_DE_REQUERIMIENTOS.md` a `05_MATRIZ_API_Y_TRAZABILIDAD.md`.
- Diagrams: `entrega-programacion-2/diagramas/03A_CLASES_IDENTIDAD_Y_CATALOGO.puml`, `03A_IDENTIDAD_EMPRESAS_CATALOGO_REDISENADO.svg` y `03A_EXPLICACION_IDENTIDAD_EMPRESAS_CATALOGO.md`.
- Execution architecture: `plataforma-pyme/backend/README.md`, `plataforma-pyme/compose.yaml` y `.github/workflows/plataforma-pyme-backend.yml`.
- **IC of the last functional committee C.4b:** historical CI run 42472269979 — GitHub reports `completed / success`, corresponding to SHA `8cd167481291b78628da0d038c7414cc26e3a311`.
- Los commits posteriores de **C.5** only modify documentation and UML 03A. Do not attribute the IC to them of the functional commission or assume that they carried out new tests.

At the beginning, check `git rev-parse HEAD` and register the SHA that was actually audited. Yes `main` advanced, use the above-fixed SHA or explicitly declare the new scope; do not mix different commit states.

## 3. Pre-evidence provided by the developer — contrast, not revalidated

| Cut | Scope | Local tests reported |
|---|---|---:|
| C.1 | Company RBAC; regression of idempotency | 98 |
| C.2 | Business profile PATCH | 125 |
| C.3 | Issue of invitations | 147 |
| C.4a | Authenticated acceptance | 171 |
| C.4b | Directory and team management | **195** |
| C.5 | Corrigendum and UML 03A | **No further evidence being executed by this court** |

Developer shared for C.4b (Windows) `195 passed in 23.86s`, `alembic current` = `e213c4_acceptance (head)`, `alembic check` = `No new upgrade operations detected.`, Docker API y DB `healthy`, y `GET /ready` = `status: ready, database: ok`. The reviewer should classify these data as **evidence reported** unless you reproduce them. The IC indicated corresponds to the functional code (not the commit of this guide).

## 4. Functional review matrix and safety

Register **CONFORME / FULLNESS / NOT VERIFIED / NOT APPLICABLE**, with exact file, function or test for each conclusion.

| Area | What to check | Risk to be ruled out |
|---|---|---|
| Registration RF-01 / CU-01 | Email Validation and Normalization; UNIQUE SQL; Argon2id; response without hash or password | Duplicate tall, exposed secrets, uncontrolled errors |
| Sesiones RF-01 / CU-02 | Login, expiration, opaque token; persistent footprint, `/me`, revocation `/logout`; disabled account | Sessions revoked still valid, token clear in DB |
| RF-02 / CU-03 company release | Company, historical founder and initial membership in **a transaction**; actor-key+content power | Orphan companies, concurrent duplicates, incompatible retries |
| Business profile C.2 | `PATCH /api/v1/businesses/{business_id}`; permitted fields; holder/manager RBAC; 403/404/409/422 | Privilege scaling, cross-tenant writing |
| Invitation issue C.3 / CU-12a | `POST .../invitations`; permissions; role only CHARGE/TRABEDOR; TTL 7 days; single pending by email/tenant | Give access before accepting; repeat token or keep plain secret |
| Acceptance C.4a / CU-12b | `POST /api/v1/invitations/accept`; authenticated account email; status/surplus; single consumption; create/reactivate membership | Re-use, double membership, incomplete rollback, other people's invitation |
| Equipment C.4b — GET | `GET .../memberships` only holder/manager; includes tenant assets/inactives and only intended public fields | Misfilt the tenant, expose sensitive data |
| Equipo C.4b — PATCH | `PATCH .../memberships/{membership_id}` only current holder; change operational/state roles; ban playing current/historical headline | Auto-deactivation of the holder, climbing to owner, editing another company |
| State of business/meeting | `SUSPENDIDA` y `INACTIVA` Denies operations according to policy; rollback and consistent errors | Operating with expired privileges or other companies |
| Concurrence | SQL blocks; unique conflicts; idempotency and acceptance under independent parallel requests | Verify and write out the same transaction |

**RBAC matrix to contrast with code**: ADMINISTRATIVE PORTUNITY can edit profile, invite, read and manage members; ADMINISTRATOR can edit profile, invite and read equipment, **no** administering roles/states; CHARGE and WORKER do not receive these powers. `business.view` does correspond to active members of the tenant, subject to the applicable state. The mere existence of the permission function does not prove that each route invokes it correctly.

## 5. SQL integrity, migrations and UML 03A

Verify SQLAlchemy models and Alembic revisions, including `users`, `auth_sessions`, `businesses`, `memberships`, `business_creation_requests` y `business_invitations`. Examine PK/FK, partial indexes and CHECK, its correspondence with DTO/services, and the review graph up to `e213c4_acceptance`. **Do not use `stamp` Or destroy a base to hide drift.**

Specific points:

1. `Membership`: UNIQUE `(business_id,user_id)`; index `uq_memberships_one_active_owner` imposes **not more than one** ASSETS holder, while the service of discharge guarantees the initial holder. Do not attribute to the index the obligation that there is an operator.
2. `Business`: el `founder_user_id` represents historical founder, **no** automatic authorization or legal property.
3. `BusinessInvitation`: FK `invited_by_user_id` mandatory (issuer); `email_normalizado` as recipient (not FK to User); `accepted_by_user_id` optional and `accepted_at` consistent with CHECK-ACEPTED state.
4. Token: never clear within the table; check SHA-256 hash and uniqueness; functional maturity even if the state persists as PENDENT.
5. Acceptance: a single transaction must write invitation consumption and high/membership reactivation; look for rollback tests.
6. UML **03A**: review that PlantUML and SVG editorial do not contradict. **issuer**, the PUML contains also **optional acceptor** and historical founder. Location, ArticleCatalog and Supplier continue modelled as TO-BE.
7. UML **03B/03C**: confirm that C.5 did not modify them and do not interpret future trade rules as already implemented.

## 6. Documentation and architecture verification

Contrast at least:

- **01**: RF-01/RF-02 and actual limits; RF-03–RF-07 pending. Do not confuse the proposed scope column with implementation.
- **02**: CU-01/CU-02/CU-03/CU-12, preconditions, idempotency, errors, atomism and authorisation.
- **03 + 03A**: entities, states, cardinalities, initial and historical title; true relations and FKs.
- **04**: implementation Router → Service → Repository → PostgreSQL, on-demand sessions, commit and rollbacks; separate historical sections proposed from AS-IMPLEMENTED.
- **05**: methods/paths, roles, errors, migrations, tests and evidence states in correspondence with the code.
- **README backend**: Reproducible commands, limitations, no exposure of secrets or destructive suggestions.
- **CI**: confirm that the reference execution actually revised the functional commit C.4b. The workflow may not be activated by changes only documentaries in C.5.

**Special attention:** historical texts can still mention earlier states; report a real contradiction that affects the reader, distinguishing it from an explicitly labeled as historical background.

## 7. Optional testing in development environment

The audit of the repository is **read only**. If the reviewer decides to perform tests, do so exclusively in a **the basis for own and isolated development**with Docker available, never against production or data from a real company.

From `plataforma-pyme/`, in PowerShell (to adjust Python environment to the computer):

```powershell
git rev-parse HEAD
git status --short
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

Don't stick in the secret report, tokens, `.env` no passwords. Do not execute `git clean -fd`, `git reset --hard`, `docker compose down -v` The repository may contain unversed personal files; preserve them.

If the evidence is not executed, indicate "not reproduced by the reviewer" and use the IC/evidence provided with correct attribution. **Do not add up test figures from different courts**: 195 is the total reported for C.4b, no 98+125+147+171+195.

## 8. Specific scopes outstanding

**Do not require as implemented in E2-1:** transfer of ownership, historical audit of role changes, post editing, cancellation/rejection/return/listing of invitations, email verification, automatic shipping, rate limiting and other hardenings for production, integration of frontend with API, public deployment, RF-03 locations, RF-04 catalog, RF-05 purchases, RF-06 inventory, RF-07 sales, no deferred functions of expense/box, Market Payment and real QR.

However, **sí** it can be noted that one of these missing capabilities limits security, operativity or academic compliance; distinguish between “bug versus E2-1 scope”, “real risk” and “future improvement”.

The academic slogan requires an RESTful API with a sufficient set of functional requirements (including at least five high-level ones according to delivery documents), tests, IQs, patterns and deployment. **not test by itself** that all these requirements are complete.

## 9. Deliverable requested to the reviewer

Submit an independent technical review, with this order:

1. **Identification:** date, SHA effectively revised, accessible files and access limits.
2. **Opinion by area:** authentication, multi-company, RBAC, creation idempotent, issuance, acceptance, equipment administration, transactions, migrations, diagrams and documents.
3. **Priority findings:** for each: ID, severity (Critical/ALTA/MEDIA/LOW), file and line or function, reproducible evidence, scenario/impact, proposed correction and if blocking the step to RF-03.
4. **Tracer matrix:** RF → CU → endpoint → service/repository/model → tests → actual status. Leave any unconfirmed relationship as pending.
5. **Evidence/evidence:** differentiate results observed by the reviewer, IC records and results reported by the developer.
6. **Recognised earrings:** outside E2-1, risks to production and requirements of TP not yet covered.
7. **Conclusion of progress:** `APTO PARA CONTINUAR / APTO CON OBSERVACIONES / BLOQUEADO`, justification and verifiable conditions for starting RF-03.

For each substantive technical statement, quote **specific routes, classes, methods or tests**, not general opinions. Do not attribute success to C.5 CI without verifying its execution or asserting total security compliance only by the number of tests. If there are no critical findings, also describe verified coverage limitations.

### Brief template per finding

```markdown
### H-E2-XX — Título
- Severidad:
- Tipo: defecto / seguridad / documentación / deuda técnica / mejora
- Evidencia (archivo, línea, método, test o respuesta HTTP):
- Comportamiento observado:
- Comportamiento esperado según RF/CU/contrato:
- Impacto y reproducibilidad:
- Recomendación mínima:
- ¿Bloquea RF-03?: Sí / No / Por verificar
```

## 10. Closing criterion

The E2-1 review is considered **realized** only when the companion provides his findings and evidence; **This sheet is not an opinion**. The next step of the team will be to evaluate the findings, correct only those that merit it and then start **RF-03 — Locations** as a new functional increase. Do not modify the repository during independent audit.
