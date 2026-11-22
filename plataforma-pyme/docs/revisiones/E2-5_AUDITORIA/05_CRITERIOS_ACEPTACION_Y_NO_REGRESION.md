# E2-5 — Quality, non-regression and audit decision

**Status:** criteria **Proposed for future audit**; are not approval of the code by an external reviewer.  
**Functional line to check:** `748e69319d8d04900c009d5184168a264a9deeac`.  
**Responsible for approving or rejecting merge:** project owner/team, not the AI writing the report.

## 1. Pre-conditions to be initiated

| Door | Mandatory | If it fails |
|---|---|---|
| P-01 | Real access to code, documents, migration, tests and `main` Exactly. | Stop conclusions on inaccessible components |
| P-02 | **Implemented:** PR #24 merged and closed released with SHA `c66df2f8ddaa8179ca12e342bd3099348bc6b155`; before starting, also record the effective HEAD | If new functional changes are detected after cutting E2-5, clarify scope or freeze new SHA before executing |
| P-03 | Branch of the reviewer from `main` publicado; no commits directos a `main` | Redo Branch Preparation |
| P-04 | Base PostgreSQL 16 **insulated/ephemeral** and test configuration verified | No ejecutar `RUN_DB_INTEGRATION=1` or destructive testing |
| P-05 | No credentials displayed in prompts, files, ICs, logs or captures | Healing before sending; revoke affected sessions |

## 2. Minimum criteria for functional acceptance

| Code | Criterion | Minimum evidence for declaring approved |
|---|---|---|
| A-01 | El ledger distingue **reception** vs. **manual operation**, kind y signo | SQL+models+test PostgreSQL scheme, not just Pydantic |
| A-02 | No company/location/articulate/actor of other tenant | Authorization tests and composite FK, non-disclosure responses |
| A-03 | Never negative or exceeded balance | Conditional Debit Test/Setting, Limits and Rollback |
| A-04 | Transfer is **an atomic operation of two movements net zero** | Carrera y lectura de balances/ledger tras commit |
| A-05 | Adjustment/initial **an operation of a signed movement** | Signal compensation and verified version |
| A-06 | Unique historical initial stock **even if the balance is zero** | Test with previous balance 0, history and new key |
| A-07 | Version observed in adjustment avoids trading on old balance | 409 with concurrent changes and intact status |
| A-08 | Unduplicated Idem in normal, concurrent and cross-kind retry | 201/200 and 409 according to cases, same operations |
| A-09 | Permissions differentiated by role and location | Test holder/admin/manager/worker/assignment revoked |
| A-10 | E2-4 Compatibility: Purchases, Full Reception, Historical Data and Movements | Regression of purchase + reception + GET without rewrite |
| A-11 | Managing HTTP errors with rollback and without disclosure | Evidence 401/403/404/409/422 and representative SQL failures |
| A-12 | Tenant/DB isolated deterministic tests | Checked Fixtures and Secure Own Execution |
| A-13 | Documentation and UML differentiate AS-IMPLEMENTED/TO-BE | RF matrix→CU→ruta→test consistent with SHA |

A criterion may be **NOT EVALUATED** when environment or evidence is lacking. Do not elevate it to approved by mere existence of method or historical IC.

## 3. Threshold of severity and action

| Priority | Evidence required | Recommended decision |
|---|---|---|
| **P0** | Corruption/loss of data or critical vulnerability **reproduced**with concrete impact | Blocking the flow of changes audited to containment, solution and testing; not writing “P0” by hypothesis |
| **P1** | Confirmed Bug Central Rule, Authorisation or Stability, or High Safety Risk Verified | Correct in scope if safe; if required redesign, document blocking and request approval |
| **P2** | Possible risk, lack of significant evidence, functional debt or documentary contradiction | Correct if local/proportional; otherwise accepted backlog and verification criterion |
| **P3** | Style, optional enhancement or future feature | Record without preventive refactor |

Una **SQL vulnerability of runtime** Change risk to bug **only when privileges and mutations are checked** under the effective profile, safely on an ephemeral base; yet its priority depends on threat/environment. `409` **Right.** should not be labelled as stock loss.

## 4. Non-regression rule

**Any functional correction must retain:**
- Route contracts and request/response E2-4, E2-5 B/C; changing HTTP, Pydatic or unnegotiated fields is breakup.
- Tenant relationships, audit fields, actor/type/print power and existing versions.
- Prior migrations implemented; if necessary, **new review Alembic compatible** with historical data.
- Separation of registered purchase/reception; no buying move before receiving.
- Active physical items and entire quantities on a thousandths scale; no stock for services.
- Sorting locks/single commission/rollback without partial; no double-spend windows.
- Frontend React DEMO unaltered unless new order; do not add `localStorage` or alternative stock by shortcut.
- SQL API and historical leader; no hidden manual scripts.

**Minimum validation of any proposed code change:** Relevant Pytest, Full Suite Backend on DB **isolated** When possible, Alembic current/check, CI Python3.12./3.14 PostgreSQL16 and Docker, regression tests E2-4, migration diff and compatibility documentation. Register the tests that were not executed.

## 5. Acceptance of the auditor ' s report

Acceptable **full audit report** when:
1. Use real sources and fix SHAs of functional and documentary code.
2. Includes 24 controls `INV-01..INV-24` with status/evidence or justification of non-execution.
3. It accompanies findings with reproduction and priority provided, separates bug from risk.
4. Attach secure registration of own tests, warnings, IC and environmental limits.
5. Indicates what changed and what **no** changed, why, and relationship with earlier blocks.
6. Released versioned report `E2-5_INFORME_DE_REVISION.md` and PR separated to `main` **sin merge**.
7. It does not expose secrets or modify QA/production data.

**Not enough.** with “all correct, 840 tests” or stating “the design is P0 because it does not have specified_version in transfer”. The analysis must be supported by restrictions, service, order of locks, behavior and testing.

## 6. Closing States

- **Suitable for independent technical review:** documentation of validated equipment with warnings/pending.
- **Approved by audit E2-5:** only after report **independent realized** and team decision.
- **Suitable for merge corrections:** only if PR of the reviewer was evaluated and its tests/CI are acceptable.
- **Suitable for production:** requires hardening and actual operation beyond E2-5; it does not derive from any of the above states.

**The team's OK documentary technician never replaces these phases.**
