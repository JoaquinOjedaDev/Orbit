# Master Guide for Auditing, Correction and Delivery of E2 Reviews

**Project:** Orbit — Programming 2, UNSAM  
**Type:** reusable protocol for the peer reviewer and AI with which he works  
**Version:** 1.1 — Scope, evidence and selective decision  
**Date:** 8 November 2026  
**Repository:** https://github.com/JoaquinOjedaDev/Orbit  
**Main branch:** `main`  
**Exclusive Folder:** `plataforma-pyme/`  
**Status:** review instructions; does not constitute an audit performed.

> **Main mandate for the reviewer AI:** check the E2 block that you are assigned from their **commit de cierre exacto**. I corrected only necessary defects and improvements, local and justified, respecting the previous progress of `main`, architecture and documents. Do not reinvent the product or incorporate new products that are foreign to the block. Work on a review branch, subila GitHub, open an PR towards `main` and deliver **dentro del mismo PR un informe Markdown exhaustivo**: what you analyzed, what mistakes you found, what you edited and why, what you decided not to edit, what remains to be done and how everything relates to previous code and documentation. **Never directly modify `main` ni fusiones tu PR.**

---

> **Precedence for E2-1:** The E2-1 sheet itself commands on generic examples of this guide. The actual evidence of the code, commit and IC prevails over any historical description. A business contradiction is reported, not resolved unilaterally.

---

## 1. Purpose of the procedure

It is used to perform a **Second independent and controlled look** on large functional blocks that the main team has already developed and validated initially.

The main team **continue to work directly in `main`**When you close a complete block (`E2-1`, `E2-2`...), prepare a delivery sheet. Your partner, with another AI, will receive that sheet and this guide, create a branch from the indicated commit, audit **Just that block.**The project manager will review this PR with his own AI before approving the integration.

**Expected:** deep assessment, proportional corrections, new tests when applicable, synchronized documentation, clear report and a reviewable PR. **No amount of change is rewarded.** An audit that concludes that no modifications are required may also be correct if it proves and documents it.

### Mandatory results

1. Confirmation of actual access to the code and documents delivered.
2. Technical audit of the block, without exhaustive review of other modules.
3. Priority evidence-based findings.
4. Limited to scope and justified corrections.
5. Tests added or updated according to the defects found.
6. Revision and updating of documentation where necessary.
7. **File `E2-X_INFORME_DE_REVISION.md` Versed on the branch.**
8. Branch published in GitHub and **Pull Request to `main`**, sin fusionar.
9. Final summary with PR URL, commit, report, tests and pending.

## 2. Project context and access limits

**Orbit** is a management platform **generalist, multi-company and multi-rub**WALOS is just an example company, not the product identity. The model includes personal account, creation and membership of multiple companies, memberships, roles and permissions per company. Global corporate privileges should not be introduced by mistake.

The solution includes frontend React/TypeScript (which initially operates with local DEMO data) and backend FastAPI, SQLAlchemy, PostgreSQL 16, Alembic, Docker and GitHub Actions. The existence of a screen does not mean that its functionality has an actual API: **check the code and contracts**.

### Folder permitted

```text
Orbit/
├── .github/workflows/
│   ├── plataforma-pyme-backend.yml
│   └── plataforma-pyme-frontend.yml
└── plataforma-pyme/
    ├── backend/
    │   ├── app/
    │   ├── alembic/
    │   ├── tests/
    │   ├── pyproject.toml
    │   └── README.md
    ├── frontend/
    ├── entrega-programacion-2/
    │   ├── 01_ANALISIS_DE_REQUERIMIENTOS.md
    │   ├── 02_CASOS_DE_USO.md
    │   ├── 03_MODELO_DE_DOMINIO_Y_UML.md
    │   ├── 04_ARQUITECTURA_Y_PATRONES.md
    │   ├── 05_MATRIZ_API_Y_TRAZABILIDAD.md
    │   ├── README.md
    │   └── diagramas/
    ├── docs/
    │   └── revisiones/   # crear si falta
    ├── compose.yaml
    ├── .env.example
    └── .gitignore
```

This structure is indicative: **check the files present in the received SHA**. The academic document `06_PRUEBAS_Y_DESPLIEGUE.md` is planned; does not claim to exist without checking it. Other historical folders in the repository are **out of reach**. Do not modify or use them to rebuild the product.

### Academic requirements that should not be missed

The original TP slogan prevails over any summary. As guidance: RESTful API with FastAPI, registration/authentication security, SQLAlchemy persistence, at least five high-level RF actually covered by endpoints, use cases, UML, applied design pattern, at least ten unit tests of backend, IC, Docker and deployment. **Infrastructure tests do not magically convert five outstanding RFs into implemented.**

## 3. Block size and audit frequency

The formal audit is **complete functional blocks**not at every small programming step:

| Block | Guidance scope | What is especially important to verify |
|---|---|---|
| **E2-0** | Infrastructure, DB, migration, Docker and IC | Configuration, versions, reproducibility, migrations and secrets |
| **E2-1** | Users, authentication, companies, roles, invitations and memberships | Identity, sessions, authorization, tenant, atomism, ownership and idempotency |
| **E2-2** | Locations | Business membership, permits and location relationships |
| **E2-3** | Catalog | Products/services, variants, uniqueness and trade rules |
| **E2-4** | Suppliers, purchases and receptions | States, reception, power, location, traceability and rollback |
| **E2-5** | Inventory | Movements, balances, concurring, negative stock and transfers |
| **E2-6** | Sales and payments declared | Money in whole units, roundings, stock and transactions |
| **E2-7** | Frontend/backend integration, comprehensive QA and deployment | Contracts, Frontend security, E2E, IC and compliance with TP |

This grouping can be adjusted. **Receiving a block does not authorize the development of the next one.** If you audit E2-1 do not develop inventory, box, QR, Market Payment or new screens without explicit order.

---

## 4. How to deliver a block to the IA reviewer

La **real source is the repository and the closing commit**, not a collection of captures or a chat summary. When a block is closed, the main team delivers:

1. **This master guide**.
2. **Block's own sheet** `E2-X_ENTREGA_PARA_REVISION.md`.
3. Repository and Folder URL `plataforma-pyme/`.
4. **SHA completo del commit de cierre** en `main`.
5. Previous SHA/block commit range when it can be set.
6. Exact name of the branch that the reviewer must create.
7. Objectives, scope included and explicit limits.
8. RF/RN/CU and relevant academic documents.
9. List of implementations, routes and migrations to be verified.
10. Evidence of local and IC evidence actually checked, with date.
11. Risks and known pending when closing the block.

### Delivery identification template

```yaml
bloque: E2-X
nombre: "Nombre funcional"
repositorio: "JoaquinOjedaDev/Orbit"
carpeta: "plataforma-pyme/"
rama_de_origen: "main"
commit_de_cierre: "<SHA_REAL_COMPLETO>"
commit_inicial_o_rango: "<SHA_O_RANGO_REAL>"
rama_de_revision: "review/e2-x-nombre"
objetivo: "<objetivo confirmado>"
alcance: "<rutas y módulos autorizados>"
exclusiones: "<cambios explícitamente prohibidos>"
documentos: "<referencias pertinentes de 01 a 05 y diagramas>"
validacion: "<comandos y resultados efectivamente ejecutados>"
ci: "<URL del run y estado o pendiente>"
```

Bookmarks **are replaced by real values**. Do not invent SHA or links. If AI cannot read the full code in GitHub, you must report it before issuing conclusions. You may use a snapshot/ZIP provided for that SHA, but you should note that the analysis was based on that copy and not claim access that you did not have.

### What additional material is needed?

- PDF of the **official record** when relevant to validate specific academic requirements.
- Captures/video only if the block involves UX behavior or visual defect that the code does not allow to properly evaluate.
- Logs of precise errors and **no credentials**.
- UML references only if they are not already accessible within the repo.

**Do not need to attach all HTML or images made** if they are in the repository. Avoid extensive searches of documents that do not contribute to the block.

---

## 5. Audit methodology: mandatory phases

### Phase A. Confirm access and set reference

1. Check for effective reading of the repository, authorized directory, code, evidence and relevant documents.
2. Get and register the **SHA exact closure**.
3. Identify the range of changes in that block without incorporating others.
4. Verify that the announced files exist.
5. Confirm that the local folder is clean and create the branch from that SHA.
6. Register access limits or missing tools.

**If essential information is not available, do not invent.** Clearly indicate what could not be verified.

### Phase B. Targeted reading and initial traceability

Read in order: delivery sheet → relevant 01–05 documents → README and migrations → block code and tests → indispensable dependencies with previous modules → relevant commit. Do not perform general audit of the entire repository by inertia.

Before editing, build a matrix: **requirement/rule → CU → code/endpoint → tests → documentation/UML → status**Distinguish:

- **DEMO:** local frontend behavior.
- **AS-IMPLEMENTED:** functionality really present in the backend.
- **TO-BE:** plan or architecture not yet implemented.
- **DIFFERENT:** outside the MVP or pending another block.

### Phase C. Findings not yet modified code

Record findings with unique identifier as `REV-E2-1-001`, linking them to files, methods, evidence and business rules. Separate:

- **Bug confirmed:** reproduction or failure test.
- **Technically substantiated risk:** plausible scenario not yet reproduced.
- **Documentary inconsistency:** code and requirement/document do not match.
- **Lack of evidence:** critical rule without sufficient evidence.
- **Optional improvement:** preference or refactoring without proven error.

Do not treat an aesthetic preference as a safety failure or attribute a requirement that is not defined.

### Phase D. Prioritize what to correct

| Priority | Definition | Usual decision |
|---|---|---|
| **P0 — Blocking** | Exposure/loss of data, severe vulnerability, broken central operation | Correct if local and safe; if required redesign, block dialing and query |
| **P1 — High** | Bug demonstrated, rule failure or relevant regression | Correct within range with regression test |
| **P2 — Average** | Significant risk, missing coverage or documentary contradiction | Correct if change is provided; otherwise, document |
| **P3 — Low** | Unrequired style, convenience or novel idea | Normally **do not change**; optional registration |

**Do not make radical changes or introduce new functionalities on your own initiative.** A major modification affecting contracts, existing tables or architecture requires prior coordination. The review work improves continuity; it does not replace the project plan.

### Phase E. Applying only justified corrections

- Localized changes and with explicable purpose.
- Preserve stable interfaces, business rules, multi-company isolation and transactions.
- Add negative tests/regression for major defects.
- Review effects on other modules before closing a modification.
- Update related documentation when changing behavior, contract or decision.
- Avoid new dependencies, patterns and abstractions without demonstrable benefit.
- Do not touch the frontend unless it is an explicit part of the revised block.
- Do not edit historical migrations already applied without authorization; prefer new compatible migration if applicable.
- Do not delete tables, users or volumes from Docker or run destructive downgrades.

### Phase F. Validate result and detect regressions

Run relevant tests and compare with the initial status. When applicable, check HTTP, Alembic schema, migrations, business isolation, attendance and IC. Register exactly what was executed, where and with what result. If a test could not be run, **not mark it as approved**.

### Phase G. Publishing and reporting

Create `E2-X_INFORME_DE_REVISION.md`, verify that it is inside the branch along with code and documentation, upload the branch and open PR to `main`. Do not Merge. Deliver PR URL and risk summary and pending.


---

## 6. Rules to be preserved by the review

### 6.1. Identity, companies and permits

- **User** People have global identity; their permits vary by company.
- Do not create a global role that allows access to outside companies.
- Validate on the **server** el `business_id`membership and permission for the specific operation.
- Do not trust `role`, `user_id` o `business_id` sent by the client as evidence of authorization.
- Separate **historical founder**, **current administrative holder** y eventual **legal title**.
- Prevent an inactive membership from granting access and applying default denial to unknown roles or states.
- Not to disclose the existence of outside companies where the contract provides for a generic response or `404`.
- Review states and authorizations within transactional limits in sensitive operations.

### 6.2. Passwords, sessions and sensitive data

- Do not store or return passwords in clear.
- Keep robust hash of passwords, random secrets and revocable sessions according to the current contract.
- Do not expose access tokens, fingerprints, passwords or secrets in answers, logs or evidence.
- Authentication of a person does not imply authorization to operate in any company.
- Do not suggest public deployment without reviewing the remaining security measures (HTTPS, abuse prevention, access recovery, etc.).

### 6.3. SQLAlchemy, PostgreSQL, migrations and attendance

- A SQLAlchemy session by request or operation; do not share mutable sessions between requests.
- Repositories without hidden commit; the service or work unit defines the transactional limit.
- FK, UNIQUE, CHECK, indexes and blocks where they really protect invariants.
- Idempotency and command retrying, preserving the correct scope of the key.
- Reversal of **all** the transaction where a party fails: not to leave an undertaking without an initial holder, purchase without consistent receipt or partially applied sale.
- Avoid redundant keys or indices, but do not remove real restrictions on applied migration without compatibility plan.
- Do not replace Alembic migrations with `Base.metadata.create_all()` on persistent bases.
- Do not use `alembic stamp`, `downgrade` destructive, volume deletion or SQL cleaning to silence a difference without diagnosis and authorization.

### 6.4. Future commercial domain: verify only if applicable

The corresponding blocks shall review, among other rules, separate purchases of receptions, physical stock based on movements, impossibility of negative balance, services without stock unloading, consistent transfers, atomic operations and exact monetary calculation in whole units with defined roundings. **Do not implement these modules in advance by reviewing an identity block.**

### 6.5. Design patterns

The documents include concepts such as Observer, Repository, Service Layer/Unit of Work and proposals from Factory, Decorator or Adapter. Do not add a pattern to make it "look more advanced." Strictly distinguish:

- Pattern **identifiable in executable code**.
- Pattern **Proposed**but not implemented.
- Abstraction or common architecture that does not need pattern tag.

Only refactor to apply a pattern if it solves a real block problem and does not break the agreed design.

## 7. Academic documentation: contrast and update

Academic documentation is part of the deliverable, **not decorative material**. It must evolve along with the code without losing justified previous decisions.

| Document | What to contrast | When to edit it |
|---|---|---|
| `01_ANALISIS_DE_REQUERIMIENTOS.md` | RF/RNF, RN, scope, acceptance criteria and priorities | Change a rule, requirement, scope or implementation status |
| `02_CASOS_DE_USO.md` | Actors, flows, errors, pre/post conditions, permissions and transactions | Change the behavior of a use case |
| `03_MODELO_DE_DOMINIO_Y_UML.md` | Entities, associations, cardinalities, states, restrictions and UML | Change domain concepts, entities or relationships |
| `04_ARQUITECTURA_Y_PATRONES.md` | Layers, technical decisions, transactions, security and patterns actually applied | Changes architecture or a relevant technical decision |
| `05_MATRIZ_API_Y_TRAZABILIDAD.md` | RF→CU→endpoint→permission→test→state | Change endpoints, error codes, permissions, evidence or evidence |
| `backend/README.md` and other README | Installation, migrations, endpoints, verifiable status and commands | Operating modified or corrected |
| `06_PRUEBAS_Y_DESPLIEGUE.md`, **if any** | CI, Docker, deployment and evidence | Change the test/displiage process |

### 7.1. How to decide whether to change a document

1. If the code is defective against a current RF/CU, **correct code** if it's within range.
2. If the code expresses a legitimate subsequent decision that was not synchronized, **update the document** and record the reason.
3. If there is substantial contradiction or business decision without owner, **not to choose arbitrarily**: inform and request decision.
4. Keeping the Concept History **TO-BE** Differentiated status **AS-IMPLEMENTED**; do not delete proposals that remain relevant by reflection.
5. Do not mark a component as finished without verifiable evidence.
6. If a document was reviewed but does not require changes, report **“Reviewed; unchanged”** with a brief explanation.

### 7.2. Diagramas UML

- For identity and companies, focus on **03A**.
- The complex **03B must not be regenerated by default**. If inconsistency is detected, describe in detail attributes, entities, associations, multiplicity and future effects.
- If you are allowed to update a diagram, preserve the editable source (`.puml` where appropriate) and maintain it consistent with their exports (`.svg`).
- Do not convert infrastructure services into domain entities just because there are Python classes.
- Avoid merely aesthetic changes from UML in a backend review.

### 7.3. Mandatory traceability table

The final report should include:

| Finding/change | RF/RN | CU | Code/endpoint | Test | Documento/UML | Status |
|---|---|---|---|---|---|---|
| `REV-E2-X-001` / `MOD-001` | `RF-..` | `CU-..` | `ruta:método` | `test_...` | `02`, `05` | Corrected/tested |

Do not invent requirement IDs if a change does not correspond to an existing one: “transverse technical rule” can be indicated and the reason explained.

---

## 8. Tests, environments and evidence

### 8.1 Basic evidence

Ejemplos de PowerShell, **from `plataforma-pyme/backend/`**, adaptable to the block:

```powershell
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check
.\.venv\Scripts\python.exe -m pytest -q
```

Tests that consult PostgreSQL real require **pre-check the environment**. Enable them only on a confirmed, preferably ephemeral, test/development basis:

```powershell
$env:RUN_DB_INTEGRATION = "1"
.\.venv\Scripts\python.exe -m pytest -q
Remove-Item Env:\RUN_DB_INTEGRATION
```

In Linux/CI adapt executable and variables. **Do not run on a production basis.** The project integration tests have used external transactions and SAVEPOINTs: check that the received block tests actually reverse your data, without assuming it by name.

### 8.2. Specific revisions

- **API:** effective paths, OpenAPI, validation and HTTP code for errors and permissions.
- **PostgreSQL:** scheme, constraints, indices, migrations and transactions.
- **Concurrence:** simultaneous re-attempt and integrity to intermediate failures.
- **Security:** Cross-access between companies, invalid tokens, disabled users and no exposure of secrets.
- **Frontend when applying:** unit tests, browser E2E, accessibility and behavior DEMO vs API.
- **CI:** review the runs associated with SHA and PR; distinguish local outcome from IC.

### 8.3 What to register in the report

For each command: `comando`, `directorio`, `sistema/entorno`, `fecha`, `resultado real`, `cantidad de passed/failed/skipped`, `evidencia`, `limitaciones`. Register also **what evidence could not be carried out and why**.

Do not copy secrets from `.env` or command results that reveal them (e.g. `docker compose config` sin `--quiet`). Do not include passwords or actual tokens in catches, PR or logs. Do not state “GitHub Actions Green” if there is only local evidence.

---

## 9. Informe final Markdown: ENTREGABLE OBLIGATORIO

♪ When I'm done ♪ **all** the revision, create within the repository:

```text
plataforma-pyme/docs/revisiones/E2-X_INFORME_DE_REVISION.md
```

Examples: `E2-1_INFORME_DE_REVISION.md`, `E2-2_INFORME_DE_REVISION.md`.

If missing `docs/revisiones/`create that folder. **The file must be part of the same PR as the corrections.** The chat message does not replace the file. It must be Markdown with exact headers, tables and references. The responsible person must be able to evaluate it without having read the conversation of the AI.

### 9.1. Compulsory sections

1. **Cover/identification:** block, SHA audited, branch, commits and author of the review, date, PR, scope.
2. **Executive summary:** block assessment and preliminary conclusion.
3. **Actual scope:** inspected and modified files and modules; completed exclusions; access limitations.
4. **Methodology:** documentation and code read, types of analysis and tools used.
5. **Technical findings:** all errors, risks, inconsistencies and lack of evidence, with severity, evidence and decision.
6. **Changes made:** before/after, file, reason, rule that resolves and related test.
7. **Unrealized changes:** The Commission has already adopted a number of amendments to the directive on the protection of workers from the risks associated with the use of certain dangerous substances.
8. **Relationship with `main` previous:** contracts and invariants maintained, compatibility, regressions, subsequent changes of `main` and conflicts.
9. **Documentary contrast:** analysis of documents 01–05, UML and README, modifications and justification.
10. **Tests and validations:** executed commands and actual results; IC, DB and limitations.
11. **Archivos y commits:** summary of the diff and reason for each significant modification.
12. **Backlog residual:** Priority pending, dependencies and suggested future block.
13. **Final recommendation:** suitable, suitable with observations, requires corrections or blocked.
14. **Declaration of integrity:** verified access, honest evidence, no publication of secrets and does not merit `main`.

If a section does not apply, type **“Not applicable” and to justify it**. Do not omit sections silently.

### 9.2. Level of detail required for findings

Each relevant defect must have a record like this:

```markdown
### REV-E2-1-003 — Recuperación incorrecta de conflicto SQL

- **Tipo:** bug confirmado.
- **Prioridad:** P1.
- **Ruta / símbolo:** `backend/app/.../service.py`, método `...`.
- **Estado anterior:** el servicio esperaba un nombre de constraint inexistente.
- **Evidencia:** la excepción PostgreSQL informa una PK distinta;
  test de regresión `test_...`.
- **Consecuencia:** una solicitud repetida podía responder 500 en lugar
  de recuperar su resultado anterior.
- **Corrección:** se mapea la PK real; no se modifica la migración histórica.
- **Justificación:** preserva idempotencia y compatibilidad del endpoint.
- **Pruebas:** resultado real y entorno.
- **Documentos:** 04 y 05, según corresponda.
- **Estado:** corregido / validado / pendiente de CI.
```

This example illustrates the **degree of precision**, should not be copied as a new finding if it was not checked in the revised block.

### 9.3. What to explain about changes NOT made

The report should explicitly contain matters that AI detected but left outside the branch, including:

- Functions belonging to other blocks.
- Possible extensions without current requirements.
- Large refactories without sufficient justification.
- Business decisions pending approval.
- Relevant risks whose arrangement depends on new models or migrations.
- Tests not executed due to lack of access or environment.

**Do not hide earrings to declare the block “perfect”.** Distinguish known risks of blocking defects.


## 10. Complete template of the review report

**AI must create a new file following this model, complementing it with real data.** The next block is a content template, not a report already made.

````markdown
# E2-X — Informe de auditoría y revisión técnica

**Proyecto:** Orbit — Programación 2, UNSAM  
**Bloque:** E2-X — [nombre]  
**Revisor:** [integrante y, opcionalmente, IA utilizada]  
**Fecha:** [AAAA-MM-DD]  
**Repositorio:** [URL]  
**Carpeta analizada:** `plataforma-pyme/`  
**Commit de cierre auditado:** `[SHA completo]`  
**Rama:** `review/e2-x-nombre`  
**Último commit de correcciones:** `[SHA completo]`  
**PR:** [URL real o pendiente]  
**Estado:** Apto para segunda revisión / Con observaciones / Bloqueado

## 1. Resumen ejecutivo

- Objetivo funcional original del bloque.
- Alcance inspeccionado realmente.
- Hallazgos por severidad: P0/P1/P2/P3.
- Cantidad de defectos corregidos y pendientes.
- Principales cambios y efecto sobre el sistema anterior.
- Recomendación final para el responsable.

## 2. Alcance auditado y límites

| Área o ruta | Inspeccionada | Modificada | Razón / límite |
|---|---|---|---|
| `...` | Sí/No | Sí/No | ... |

**Fuera de alcance respetado:** ...  
**Limitaciones de acceso:** ...

## 3. Estado inicial de main en el SHA recibido

- Endpoints y casos de uso existentes.
- Tablas y migraciones relevantes.
- Contratos e invariantes conocidos.
- Tests inicialmente verificables.
- Estado real de CI y Docker, si se pudo comprobar.

## 4. Metodología de análisis

Explicar qué código, documentos, diffs, pruebas, decisiones de
arquitectura y casos límite se inspeccionaron y cómo.

## 5. Matriz general de hallazgos

| ID | Prioridad | Clasificación | Evidencia | Impacto | Decisión |
|---|---|---|---|---|---|
| REV-E2-X-001 | P1 | Bug confirmado | Ruta/test ... | ... | Corregido |
| REV-E2-X-002 | P2 | Riesgo | ... | ... | Pendiente |

### REV-E2-X-001 — [Título preciso]

**Estado:** corregido / pendiente / requiere decisión.  
**Código afectado:** `ruta:clase.función`.  
**Situación anterior:** ...  
**Evidencia:** ...  
**Causa:** ...  
**Consecuencia:** ...  
**Requisito / regla / documento:** ...  
**Decisión adoptada y justificación:** ...

[Repetir para hallazgos relevantes, especialmente P0 y P1.]

## 6. Modificaciones efectuadas

| Cambio | Hallazgo relacionado | Archivo(s) | Antes / después | Prueba | Documento |
|---|---|---|---|---|---|
| MOD-001 | REV-E2-X-001 | ... | ... | ... | 02, 05 |

### MOD-001 — [Nombre]

- **Qué se editó:** ...
- **Por qué se editó:** ...
- **Qué funcionaba antes:** ...
- **Qué funciona ahora:** ...
- **Por qué continúa el flujo anterior de main:** ...
- **Riesgo o incompatibilidad:** ...
- **Pruebas agregadas o modificadas:** ...
- **Documentación actualizada:** ...

## 7. Hallazgos y mejoras NO implementados

| ID | Asunto pendiente | Prioridad | Por qué no se editó | Dependencia | Bloque futuro |
|---|---|---|---|---|---|
| PEN-001 | ... | P2 | Fuera de alcance | ... | E2-Y |

Incluir decisiones de no cambiar código, UML o contratos que se
analizaron y se descartaron, con su justificación.

## 8. Relación con el progreso anterior de main

- Funcionalidades previamente validadas que se conservaron.
- Interfaces y contratos preservados o modificaciones autorizadas.
- Invariantes de seguridad y persistencia respetados.
- Impacto sobre migraciones o datos previos.
- Relación con módulos anteriores y siguientes.
- Si main avanzó durante la revisión, indicar SHA nuevos,
  conflictos y decisiones de integración.

## 9. Contraste con documentos y UML

| Documento | Qué se contrastó | Hallazgo | Cambio efectuado / sin cambios | Por qué |
|---|---|---|---|---|
| 01 Requerimientos | ... | ... | ... | ... |
| 02 Casos de uso | ... | ... | ... | ... |
| 03 Modelo y UML | ... | ... | ... | ... |
| 04 Arquitectura | ... | ... | ... | ... |
| 05 API y trazabilidad | ... | ... | ... | ... |
| README / 06 si existe | ... | ... | ... | ... |

### Matriz de trazabilidad

| Cambio/Hallazgo | RF/RN | CU | Código | Prueba | Documento | Estado |
|---|---|---|---|---|---|---|
| MOD-001 | RF-.. | CU-.. | ... | ... | 02/05 | Validado |

## 10. Pruebas y validaciones

| Comando/control | Entorno | Resultado REAL | Evidencia | Limitación |
|---|---|---|---|---|
| `python -m pytest -q` | ... | N passed / failed | ... | ... |
| `alembic check` | ... | ... | ... | ... |
| GitHub Actions | ... | Verde / rojo / pendiente | URL | ... |

- Casos agregados y reglas que cubren.
- Regresiones comprobadas.
- Pruebas omitidas/no ejecutadas y motivos.
- DB y estrategia para evitar dejar datos de prueba.
- Riesgos no reproducidos o todavía sin test.

## 11. Archivos cambiados y commits

| Archivo | Tipo de modificación | Motivo | Commit |
|---|---|---|---|
| `...` | Código/tests/docs/informe | ... | SHA |

**Archivos ajenos al bloque modificados:** ninguno / justificación.

## 12. Backlog residual priorizado

| Prioridad | Pendiente | Consecuencia | Dependencia | Incremento propuesto |
|---|---|---|---|---|
| P1 | ... | ... | ... | ... |

## 13. Conclusión para segunda revisión

- [ ] Apto para revisión final e integración.
- [ ] Apto con observaciones menores.
- [ ] Requiere correcciones previas.
- [ ] Bloqueado: NO integrar.

**Fundamento con evidencia:** ...  
**Riesgos residuales:** ...  
**Decisiones que se solicitan al responsable:** ...

## 14. Declaración de integridad

- [ ] Los archivos citados fueron realmente consultados.
- [ ] Los resultados de tests son reales o se indican como pendientes.
- [ ] No se subieron secretos, contraseñas ni tokens.
- [ ] No se modificó ni se hizo push directo a main.
- [ ] No se fusionó el PR.
- [ ] Cada cambio tiene justificación y referencia a tests/docs.
- [ ] Los pendientes y lo no modificado figuran explícitamente.
````

**Example of sufficient wording:** “The service caught the exception of a UNIQUE restriction that had been removed. PostgreSQL reported the name of the PK; the recovery branch was corrected for this PK, a retry test was added and the documentation of idempotency was updated. The applied migration was not edited. Tests gave X results in Y environment.”

**Insufficient example:** “I fixed the power, optimized architecture and everything works”, without evidence, files, evidence, reasons or pending.

---

## 11. How to work with Git and upload the revision to the repository

### 11.1. Initial requirement: Own branch and exact SHA

The main team will provide `commit_de_cierre` and the approved name of the branch. The reviewer must use **that exact basis**. The following commands are examples: replace bookmarks, without writing literally `<SHA_DE_CIERRE>`.

Si no existe un clon local, clonar:

```powershell
git clone https://github.com/JoaquinOjedaDev/Orbit.git
cd Orbit
```

If a clone already exists, from the **repository root**:

```powershell
# Verificar si hay archivos personales sin confirmar.
git status --short

# Actualizar referencias remotas, sin modificar main.
git fetch origin

# Comparar la referencia actual con la base del bloque.
git rev-parse origin/main

# Sustituir por el SHA de cierre recibido en la hoja de entrega.
git show --no-patch --format="%H %s" SHA_DE_CIERRE_REAL

# Ejemplo E2-1: crear rama desde ese commit exacto.
git switch -c review/e2-1-identidad-empresas SHA_DE_CIERRE_REAL

git branch --show-current
git rev-parse HEAD
```

Si `git status --short` shows modifications by another person, **do not delete them or make destructive checkout**. Use another clone or separate working folder, or coordinate.

Do not create branch from the `main` Today when the SHA delivered corresponds to a previous closure: it could mix changes from other blocks.

### 11.2. Making changes and generating the report

After auditing and correcting, create the report within `plataforma-pyme/docs/revisiones/` and confirm that that file is part of the same set of changes.

```powershell
# Inspeccionar qué cambió realmente.
git status --short
git diff --check
git diff --stat

# Agregar explícitamente los archivos reales modificados.
# EJEMPLO: reemplazar estas rutas por las reales de la revisión.
git add plataforma-pyme/backend/app/modules/businesses/permissions.py
git add plataforma-pyme/backend/tests/test_business_permissions.py
git add plataforma-pyme/docs/revisiones/E2-1_INFORME_DE_REVISION.md

# Añadir también documentos 01–05 pertinentes si se editaron.
# Ejemplo con un documento concreto:
git add plataforma-pyme/entrega-programacion-2/05_MATRIZ_API_Y_TRAZABILIDAD.md

# Verificar qué va a quedar en el commit.
git diff --cached --check
git diff --cached --stat

git commit -m "fix(pyme): revision E2-1 con pruebas y trazabilidad"
```

**The paths used as an example are not a mandatory list of files to be modified.** Do not add or edit them if the block does not require it. Prefer several semantic commit (`fix`, `test`, `docs`) if they help explain the changes. The report can be completed in a final commit of the branch.

Do not use `git add -A` blind: you could incorporate private files, local changes to other projects or unnecessary captures. `.gitignore`but remember that a already tracked file is not hidden simply by adding it to `.gitignore`.

### 11.3. Publish only the review branch

```powershell
git push -u origin review/e2-1-identidad-empresas
```

No ejecutar `git push origin main`, ni `git push --force` on shared branches.

### 11.4. Open Pull Request in GitHub

1. Enter the repository from the browser.
2. Elegir **Compare & pull request** for the published branch; or **Pull requests → New pull request**.
3. Verify **base: `main`** y **compare: `review/e2-1-identidad-empresas`**.
4. Inspect **Files changed** and check that no other blocks were mixed.
5. Complete title and description using the template in section 12.
6. If the revision or IC is still ongoing, create a **Draft PR** And get it ready when everything's ready.
7. Check GitHub Actions jobs that have been executed; report those that fail or do not shoot.
8. Copy the PR link and deliver it to the responsible party along with the SHA review and link to the report.
9. **NO fusionar el PR.** The responsible person shall carry out the second review and decide on its integration.

### 11.5. If the reviewer does not have write access to the repository

Use a **fork** personal: create fork in GitHub, clone, create the same branch from the original SHA, commit and upload the branch to that fork. Open a **Pull Request from the fork** to the original repository, with destination `main`. Maintain the same report and quality criteria. Do not request credentials from the repository owner; invitation access or fork.

### 11.6. What to do if `main` advance while checking the block

This can happen and **It's not a mistake.**because the main team continues to develop new increases in `main`.

- Keep the **Closing SHA audited**.
- Register the current SHA of `main` when preparing the PR.
- Do not insert new commit into the branch silently.
- Examine what conflicts the PR could generate with subsequent changes.
- Coordinate with the responsible person if you need to update the branch, overlay, merge or apply corrections by cherry pick.
- If the basis is updated by joint decision, re-run affected evidence and document it.
- **Never force changes on `main`** or resolve conflicts indiscriminately overwriting newer work.

When integrated, the responsible shall review the **diff against `main`**Not just the state that PR had on the day it was opened.


---

## 12. Compulsory description of Pull Request

El PR es la **summary of the work**; el `.md` es el **full report**. Do not copy the entire report into the PR body. The description should allow the responsible to decide quickly what to review and where to find evidence.

```markdown
## Revisión técnica E2-X — [Nombre del bloque]

**SHA original de main:** `SHA_COMPLETO`  
**Rama:** `review/e2-x-nombre`  
**Informe completo:** `plataforma-pyme/docs/revisiones/E2-X_INFORME_DE_REVISION.md`  
**Estado:** Listo para segunda revisión / Draft

### Objetivo de la auditoría
[Qué se pretendía verificar y mejorar del bloque entregado.]

### Resultado
- Hallazgos P0: [n]; P1: [n]; P2: [n]; P3: [n].
- Corregidos: [n].
- Pendientes documentados: [n].
- ¿Se respetó el alcance?: [sí / explicar excepciones autorizadas].

### Cambios importantes
- [MOD-001]: archivo, defecto y corrección.
- [MOD-002]: archivo, defecto y corrección.

### Documentación revisada
- 01: actualizada / revisada sin cambios / no aplica.
- 02: ...
- 03 y UML: ...
- 04: ...
- 05: ...

### Pruebas y CI
- Comando: `[comando exacto]` → [resultado real].
- Alembic: [resultado real / no aplica].
- GitHub Actions: [URL al run y estado / pendiente].

### Riesgos conocidos y pendientes
- [Riesgo significativo, prioridad, bloque sugerido.]
- [Decisión que requiere al responsable, si existe.]

### Entrega
Solicito segunda revisión de este PR. El informe técnico completo
está incluido en la rama. **No fusioné este PR con `main`.**
```

Do not enter commit names, quantities or fictitious links. If the report is still incomplete, keep the PR as draft. When the PR is complete, also deliver the direct link to the report in GitHub.

## 13. Acceptance list for the second review of the responsible person

Before the merge, the person responsible and his AI must be able to check:

- [ ] The audited SHA is the one who gave himself up, or any difference was documented.
- [ ] The PR only modifies the assigned block, relevant evidence and documents.
- [ ] No secret files, unnecessary binaries, credentials or `.env`.
- [ ] Important findings have evidence; they are not vague statements.
- [ ] Corrections are small, justified and do not redesign the application.
- [ ] Business rules and previous invariants are preserved.
- [ ] Relevant tests were performed or exact limits documented.
- [ ] GitHub Actions is checked for that PR, no invented results.
- [ ] Migration and DB relations remain consistent.
- [ ] Security and multi-company isolation were not weakened.
- [ ] Relevant academic documents were reviewed and updated as appropriate.
- [ ] Relevant LMUs are correct or their future corrections are described; 03B is not re-made without authorization.
- [ ] Markdown report is in. **versioned within the PR** and it's detailed enough.
- [ ] Each significant change and each decision not to change is explained.
- [ ] The slopes are sorted by priority and future block.
- [ ] New advances in `main` after SHA audited.
- [ ] The reviewer did not merge his own PR.

**Do not automatically approve** if a P0/P1 error persists, a significant regression, a serious discrepancy with documentation, an unauthorized destructive change or unresolved conflicts with a `main` Newer.

## 14. Autonomy, consultation and communication

The AI revises **may act without further authorisation** for local low-risk changes that comply with this guide: correct a proven bug, add a test, remove actual redundancy or update the affected document.

Must **stop the specific modification and consult the responsible** if you find:

- Change of requirement or rule of business without prior decision.
- Need to modify architecture, main units or external contracts.
- Potentially destructive migration or alteration of existing data.
- Serious security problem that exceeds the block.
- Lack of access to essential files or critical evidence.
- Conflict with subsequent changes in `main` I could lose a job.
- Innovative proposal beyond reach, although it seems attractive.

There is no need to interrupt continuously for minor issues. AI can document optional improvements without running them. **Any changes made and any relevant pending issues should be explained in the report.**

### Final message to be received by the responsible person

When delivering the PR, the reviewer must communicate in a compact manner:

1. Block and SHA of origin audited.
2. Branch created and **link to PR**.
3. Link to **informe Markdown dentro del PR**.
4. Number and severity of findings, corrected amount and outstanding amount.
5. Results **Actual** de pruebas y GitHub Actions.
6. Changes affecting documents 01–05 and UML.
7. Risks or decisions that require attention before the merge.
8. Confirmation that **did not directly publish in `main` and didn't even merge**.

The message is a synthesis. It does not replace the technical report versioned.

## 15. Complete block exchange example

**Delivery of main equipment:**

```text
Bloque: E2-1 — Identidad, Empresas y Membresías
Repositorio: JoaquinOjedaDev/Orbit
Carpeta: plataforma-pyme/
Commit de cierre: <SHA_REAL_DEL_BLOQUE>
Rango de commits: <RANGO_REAL>
Rama autorizada: review/e2-1-identidad-empresas
Hoja: docs/revisiones/E2-1_ENTREGA_PARA_REVISION.md
Guía: GUIA_MAESTRA_REVISION_BLOQUES_E2_ASISTENTE_PYME.md
Documentos: entrega-programacion-2/01...05, UML 03A y README backend
Pruebas y migraciones: resultados documentados en la hoja
Fuera de alcance: bloques comerciales posteriores, rediseño general, 03B
```

**Delivery of the peer reviewer:**

```text
Rama: review/e2-1-identidad-empresas
Cambios: fixes justificados + tests + documentos relacionados
Informe: plataforma-pyme/docs/revisiones/E2-1_INFORME_DE_REVISION.md
PR: https://github.com/JoaquinOjedaDev/Orbit
Estado: esperando segunda revisión del responsable
```

Bookmarks **are not real data**; replace them with the true values of the delivered block. The example does not mean that E2-1 is already closed or that PR exists.

---

## 16. Final instruction for the reviewer AI

**The purpose of your review is to consolidate one evolution of software, not replace it with another.** The application already has previous decisions and codes that must be respected; academic documentation must faithfully accompany this evolution, even if it can be corrected when the evidence justifies it.

Check the block rigorously, find real failures, improve what is necessary, demonstrate it with proof and leave explicit risks that do not yet correspond to solving. **Do not add novel functions, do not redo whole modules without need, do not expand the scope and do not introduce patterns or technologies because they seem interesting.**

**Everything you modify must have a technical explanation and verifiable relationship with the code and documentation. Any relevant matter that you decide not to change should also be justified.**

The final deliverable is: **Review branch + Pull Request to `main` + relevant code/tests/documentation + comprehensive Markdown report within PR + actual validation results**.

**No fusionar el PR.** The second review and integration are the responsibility of the project manager.
---

## 17. Addendum v1.1 — Additional mandatory controls

The addendum complements this guide and does not allow for the modification of new modules on its own.

### 17.1. Compulsory whitelist

The sheet of each block contains explicit paths **editable**, routes **consultation only** and archives of **Exceptional edition with approval**. All unauthorised is read only. If a correction needs to be out of reach, the reviewer records the finding, describes the dependence and consultation with the responsible; does not make change on his own initiative. Do not edit historical migrations already applied or change infrastructure from previous blocks.

### 17.2. `main` and conflicts

The branch is born from a fixed SHA, not the `main` mobile. Yes `main` progress, reviewer does not execute `git rebase origin/main`, `git merge origin/main`, `git reset --hard` ni `git push --force` autonomously. `CONFLICTO_CON_MAIN` with SHA, files and consequences and keeps your PR unfused. Solving conflicts and selecting changes belongs to the responsible.

### 17.3. Standardized test States

| Status | Meaning |
|---|---|
| `EJECUTADO_PASS` | Executed by the reviewer and approved |
| `EJECUTADO_FAIL` | Executed by the reviewer and failed |
| `OMITIDO_SIN_ENTORNO` | Not executable due to lack of DB, Docker or other identified unit |
| `NO_EJECUTADO` | No execution, indicate reason |
| `CI_PENDIENTE` | RP CI result not available |
| `CI_PASS_VERIFICADO` | CI verde con URL y commit exacto |
| `CI_FAIL_VERIFICADO` | CI rojo con URL y commit exacto |
| `REPORTADO_POR_AUTOR` | Result reported by another person, not reproduced |
| `NO_APLICA` | Control irrelevant, justify |

### 17.4. Report and targeted decisions

The report starts with YAML front matter real, with `bloque`, `commit_base_auditado`, `rama_revision`, `estado_recomendado`, `resumen_hallazgos` P0–P3, `hallazgos_corregidos`, `hallazgos_pendientes`, `requiere_decision_humana` y `conflicto_con_main`. Each find uses ID `REV-E2-X-###`, each change `MOD-E2-X-###`, with links between the two, file, reason, proof and decision.

A **individual acceptance matrix** by amendment with suggestion `ACEPTAR`, `AJUSTAR`, `RECHAZAR` o `DIFERIR`This is a recommendation: the responsible can choose only some changes. Prefer small commissions per finding; do not combine an aesthetic refactor with an inseparable functional correction.

### 17.5. Recommendation threshold

| Condition | Status |
|---|---|
| 0 P0/P1 open; relevant evidence completed and satisfactory; no regressions or violations of scope | `APTO` |
| 0 P0/P1 open; documented P2/P3; sufficient evidence and satisfactory relevant evidence | `APTO_CON_OBSERVACIONES` |
| P0/P1 open pending resolution in scope allowed | `REQUIERE_CORRECCIONES` |
| Uncompromised or off-white list change, data loss, severe regression or unresolved conflict | `BLOQUEADO` |

The absence of critical test environment should be listed as a limitation and cannot be disguised as `PASS`The recommendation does not authorize merge: the final decision on integration is the responsible one.
