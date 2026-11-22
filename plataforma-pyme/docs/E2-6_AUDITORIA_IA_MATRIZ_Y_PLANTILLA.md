# E2-6 — Independent audit matrix, evidence and templates

**Purpose:** working instrument for the AI auditor. **It is not an audit or a list of confirmed failures.**  
**Date:** 2026-11-09.  
**Rama:** `feature/e2-6-ventas-integradas`.  
**Scope:** `plataforma-pyme/`; E2-6 sales and direct dependencies.  
**Custom document:** [E2-6_AUDITORIA_IA_PROMPT_MAESTRO.md](E2-6_AUDITORIA_IA_PROMPT_MAESTRO.md).

## 1. Trace sheet to be completed by the auditor

| Data | Value to be recorded by AI |
|---|---|
| Repository URL | `https://github.com/JoaquinOjedaDev/Orbit` |
| Analysis branch | `feature/e2-6-ventas-integradas` |
| SHA of `main` effectively consulted | **Complete** |
| Exact SHA of the audited branch | **Complete** |
| Merge-base exact and comparison `main...feature` | **Complete** |
| Date/time of reading UTC | **Complete** |
| Modality | Read only |
| Accessible files and files | **Complete with exact paths** |
| Tests performed on an isolated basis | **Complete or ‘not executed’** |
| IC consulted and SHA of this execution | **Complete or ‘not consulted’** |
| Restrictions/ missing evidence | **Complete** |

**Rule:** the initial documentary reference is `130d0c14f6d26248df96f65c3f6d12ba5fba8341`the audit package adds documentary committs. **Real HEAD read**Don't copy that SHA mechanically.

## 2. Complete matrix of controls

For each row: write down `OK`, `FALLO`, `RIESGO` o `NO VERIFICADO`, file:lines and test/evidence supporting the trial. **OK does not involve exhaustive demonstration**.

| ID | Dimension | Specific control | Minimum evidence to look for | Status/foundation |
|---|---|---|---|---|
| C01 | Tenant | Catalog, sales, location, balance and movements belong to the authorized business_id | Queries con `business_id`, FK composites, cross-tenant test | Pending |
| C02 | Meeting | User/session revoked cannot create/read improperly | AuthContext, locks, session tests | Pending |
| C03 | Membership | Roles and active membership control POST and GET | `PurchaseService._authorize`, `own_business`, tests | Pending |
| C04 | Locations | SELL/STORE, active location/capacity, active assignments | `can_operate_at_location`, headquarters blocking | Pending |
| C05 | Careers in authorisations | Concurrent revocation of assignments, permits and operational status | Dos sesiones PostgreSQL; orden de locks | Pending |
| C06 | Catalog | ASSETS, SELLING, UNIT AND TYPE, Validation prior to debit | `CatalogItem`, validation of the service | Pending |
| C07 | Amounts | Thousandth positives, discrete in multiples of 1000, maximum | Validators and SQL CHECK | Pending |
| C08 | Amounts | HALF_UP per line, subtotal/total/uncounting, strict integers, maximum | Pydantic, SQL CHECK, limit tests | Pending |
| C09 | Declared payments | 1..6 payments; exact amount; no false accreditation or bank transaction | Schemes, payments, response, API texts | Pending |
| C10 | Price policy | Price difference received versus catalogue; limits of abuse per role | Service, permits, ADR | Pending |
| C11 | Atomity | Reverse voucher, payments, balance and ledger to failure online 2 or flush | Transaction bonds, tests late failure | Pending |
| C12 | Stock CAS | Quantity available and version, two sales per last unit | UPDATE condicional, tests concurrencia real | Pending |
| C13 | Ledger | Negative movement by line well, exclusive and linked to sale_line | StockMovement FK y CHECK, consulta balances | Pending |
| C14 | History | Stable sales and balance snapshot, non-mutation GET, rear replay | `SaleView`, `balances_after`, tests | Pending |
| C15 | Idempotency | Identity by tenant, actor and digest; secure replay; conflict by key | Unique constraint, hash, error 409, tests | Pending |
| C16 | Replay/changed venue | Pause Headquarters/STORE revoked after sale: decision of historical semantics | Exact order of authorisation and `_replay` | Pending |
| C17 | Interoperability | Sale with reception, transfer, simultaneous adjustments; deadlock/no losses | Locks/orden, conexiones PG reales | Pending |
| C18 | HTTP and OpenAPI | 201/200/401/403/404/409/422, request/response, non-filtering errors | Router, tests, OpenAPI | Pending |
| C19 | DDL / migration | Upgrade additive, XOR origin, FK tenant, downgrade protected | Alembic and models E2-6 A | Pending |
| C20 | Regression | B-D tests really cover your claims; untested limits | 7 test_sal files, local IQ/integration | Pending |

## 3. Priority test scenarios

Separate expressly **test confirmed case**, **test read but not executed**, **successful manual playback**, **potential risk** y **lack of evidence**.

| ID | Scenario | Expected outcome |
|---|---|---|
| T01 | Create 2 units physical sale with stock 10 | HTTP 201, balance 8, next version, 1 `VENTA_SALIDA` |
| T02 | Mixed sale well + service, with split payments | HTTP 201, only well account stock, exact payout sum |
| T03 | Repetir misma clave/payload del mismo actor | HTTP 200, same ID and snapshot, no additional balance/ledger |
| T04 | Misma clave con payload o actor diferente | HTTP 409, no extra writing |
| T05 | Request sale above balance | HTTP 409, stock and version unchanged |
| T06 | Two simultaneous sales per last unit | One 201 and one 409; not negative |
| T07 | Two simultaneous retryings of the same key | A single voucher and debit |
| T08 | Second item without stock after first UPDATE | Rollback of both and no sale/payments/ledger |
| T09 | SQL exception after discount and before commit | Rollback completo |
| T10 | User without permission/mistaken lieutenant | 403/404 per contract; zero effect |
| T11 | Revocation of session and membership before retry | Access denied according to policy |
| T12 | SELL/STORE assignment revoked concurrently | No unauthorised operations confirmed |
| T13 | Same sale recovered after subsequent stock change | Original Snapshot without Mutations |
| T14 | Replay after pause location | Observe and judge against explicit historical policy |
| T15 | Service item without location | Authorized administrative mode only |
| T16 | Discreet fractional unit, float or overflowing amounts | HTTP 422; no record |
| T17 | Concurrent sale and receipt of the same article | Consistent stock and reconciling history |
| T18 | Concurrent sale and transfer of the same article | Consistent stock, no persistent deadlock or losses |
| T19 | Concurrent sale and adjustment of the same article | Stock consistent, no negative balance |
| T20 | Upgrade and schema check on disposable basis | Alembic without differences; history E2-4/E2-5 preserved |

**Operational recommendation:** if T06–T20 is executed, use standalone sessions against PostgreSQL on an isolated database. Do not use the database with data that the user wants to keep. Do not require actual execution when the auditor lacks a setting, but leave that limitation in the report.

## 4. AUD-E26-XXX Find Template

Copy one instance per find. Do not complete with hypothetical examples as if they were real results.

```markdown
### AUD-E26-001 — [Título concreto]

- **Severidad:** Bloqueante / Alta / Media / Baja
- **Estado probatorio:** Confirmado / Probable / Hipótesis
- **Control asociado:** C__
- **Prioridad sugerida:** Antes de PR / Condicional / Diferible
- **Ubicación exacta:** `plataforma-pyme/.../archivo.py:Lx-Ly`
- **SHA auditado:** `...`
- **Regla o contrato afectado:** ...
- **Precondiciones:** ...
- **Pasos para reproducir:** 1. ... 2. ... 3. ...
- **Resultado esperado:** ...
- **Resultado observado:** ... [o "no ejecutado; inferido del flujo X"]
- **Impacto en tenants, datos, seguridad, negocio:** ...
- **Evidencia:** extracto breve, referencia a test y/o respuesta HTTP sin secretos
- **Causa probable:** ...
- **Corrección mínima propuesta (sin implementar):** ...
- **Riesgos de la corrección:** ...
- **Dependencias de E2-1 a E2-5:** ...
- **Test de aceptación propuesto:** ...; debe fallar antes y pasar luego
- **Incertidumbres que requieren decisión de negocio:** ...
- **Decisión del equipo (llenar después):** Aceptar / Ajustar / Diferir / Rechazar
- **Motivo y responsable (después):** ...
- **SHA de corrección (después):** ...
- **Resultado de regresión y CI (después):** ...
```

## 5. Maintainer Selective Decision Matrix Template

This table **no** must be automatically completed by the AI auditor as an authorization to implement.

| Finding ID | Evidence | Severity | Audit recommendation | Maintenance decision | Reason | Acceptance Test | SHA fix | Verification |
|---|---|---|---|---|---|---|---|---|
| AUD-E26-001 | Pending | Pending | Pending | **Undecided** | — | — | — | — |

Classification rules:

- **Accept:** reproducible defect within range; minimal correction with test.
- **Ajustar:** There is a real problem but less disruptive solution is required.
- **Defer:** well-founded risk not blocking or subsequent need outside MVP; specify condition and future task.
- **Reject:** insufficient evidence, false positive, unjustified regression or out of reach demand; retaining argumentation.
- **Block Merge:** critical or high finding confirmed unsolved, isolation violation or stock corruption, critical regression, red final IC.

## 6. File templates to be delivered

To avoid a generic report, AI must produce five independent Markdowns:

```text
AUD-E26-00_RESUMEN_EJECUTIVO.md
AUD-E26-01_MATRIZ_DE_CONTROLES.md
AUD-E26-02_HALLAZGOS.md
AUD-E26-03_PLAN_SELECTIVO.md
AUD-E26-04_EVIDENCIA_Y_LIMITES.md
```

Minimum:

- **00:** SHA, coverage, fitness status (suitable, fit with corrections, unfit, unevaluable), top risks with evidence, what was inspected and what is pending.
- **01:** complete C01–C20, with file/test references and limitations.
- **02:** all AUD-E26 instances; if no findings are found, explain "no reproducible findings in inspected scope".
- **03:** minimum proposal ordered by risk, scope of each correction and associated test, without executing it.
- **04:** inventory of read files, real diff, log/executed test commands, precise SHA CI, date and sources; separate what is not checked.

## 7. Checklist before accepting the report

- [ ] AI identifies the repo, branch and SHA that it actually examined.
- [ ] Report comparison `main...feature` and the persistence A that already exists in main.
- [ ] He read central archives, migration, contracts and relevant evidence, or declared each absence.
- [ ] It does not confuse the absence of future function with non-compliance with MVP.
- [ ] No serious finding lacks file:line, causality and verifiable result.
- [ ] Distinguish hypothetical risk of confirmed failure.
- [ ] It addresses the continuance and revocation of permits, not only valid data.
- [ ] It proposes concrete tests and a minimum correction per finding.
- [ ] You have not modified repository or actual data.
- [ ] Returns five separate artifacts with pending matrices and decisions.
- [ ] It does not present different SHA green IC as a final validation of a future fix.
- [ ] The team retains the power to correct only accepted findings.

## 8. Expected closure of the process, after audit

Once the audit has been received, the maintainer will record the decision of all findings, implement corrections accepted **only in** `feature/e2-6-ventas-integradas`, will run focused tests + regression in isolated PostgreSQL, will verify `alembic current/check` and GitHub Actions of the final SHA; then you will review a single PR towards `main` and merge only after explicit approval.

**Do not perform this sequence within the audit commission.**
