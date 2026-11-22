# E2-5 — Comprehensive review of documentation and audit preparation

**Date:** 09/11/2026. **Version:** v1.2, on draft documentary PR v1.1 #24.  
**Internal result:** **OK FOR FORMAL REVIEW OF THE EQUIPMENT AND PREPARATION OF EXTERNAL AUDITOR**with conditions and pending indicated.  
**It does not mean:** independent audit carried out, approved production, merged PR, backend test again executed or remediation of identified risks.  
**Functional code against which the documentation was contrasted:** `main` `748e69319d8d04900c009d5184168a264a9deeac`.  
**Revised branch:** `docs/e2-5-cierre-revision-critica`, PR #24 (Draft).

## 1. Method and sources inspected

This editorial/technical review compared:
- **GitHub code**: `auth/tokens.py` y `auth/session_service.py`; models `inventory_operation.py`, `stock_movement.py` y `stock_balance.py`; `transfer_{router,schemas,service}.py`, `adjustment_{router,schemas,service}.py`, `inventory_router.py`, `receipt_schemas.py`authorisation in `purchases/service.py` and political `locations/permissions.py`.
- **Data/migration**: `20261109_0016_inventory_operations.py` and Alembic chain; description of FK, CHECK, UNIQUE and attendance.
- **Tests**: names and scenarios of `test_inventory_operation_*`, `test_transfer_api_integration.py`, `test_transfer_concurrency_integration.py`, `test_adjustment_api_integration.py`, `test_adjustment_concurrency_integration.py` and reception units.
- **CI**: runs finales de merges A `42601062105`, B `42604071018`, C `42617212795`; 816/826/840 in Python3.12 and 3.14, 3/3 jobs. **functional history**Not this PR.
- **QA**: Swagger transfer responses and developer-shared settings, with balance/history per article; transcripts in B/C log.
- **Documents**: Set `00..13` the closure; E2-5 A/B/C specifications; audit guides; requirements/cases of use 01–05 and ADR-004; observations from another AI as input, not as evidence.

**Methodological limitation:** no tests or Swagger were performed since this documentary review; no live inspection of the Windows database was carried out, no cross-runs were played. No independent code audit is done and no global security coverage is certified. Documentation inspection was conducted on sources used in GitHub.

## 2. Documentary findings and corrections implemented

| ID | Nivel | Concrete finding | Documentary correction made | Status |
|---|---|---|---|---|
| **DOC-E25-01** | P2 | `05_ARQUITECTURA_MODELO_Y_API.md` called the authentication mechanism "JWT". **Bearer opaco de 256 bits** and revocable session, with digest in BD. | Replaced JWT and added the actual authentication and revalidation path. | **CORREGITED IN PR** |
| **DOC-E25-02** | P2 | `08_REPRODUCCION_SEGURA.md` y `10_CHECKLIST...md` referred to `12_MANIFIESTO_SHA256.txt` of the ZIP v1.0, no longer in force in Git. | Replaced with instructions `12_MANIFIESTO_GIT_BLOBS.md`; the manifest is regenerated upon completion of documentary changes. | **CORREGITED IN PR** |
| **DOC-E25-03** | P2 | The checklist continued to indicate that no documented tasks have already been performed (CI, SHA, Swagger, PR). | Updated states only where there was evidence; token revocation **later confirmed by Swagger 204 with the same Bearer**; approval and merit continue **outstanding**. | **CORREGITED IN PR** |
| **DOC-E25-04** | P2 | There was no E2-5 audit sheet or case matrix specific enough for a partner and his AI; risk of extending scope without permission. | Added `E2-5_ENTREGA_PARA_REVISION.md` and package `E2-5_AUDITORIA/` with real source, 24 invariants, RBAC controls, tests and report format. | **CORREGITED IN PR** |
| **DOC-E25-05** | P2 | Cumulative academic documents kept "RF-06 planned" and in a historical cut linked CU-11 to RF-07. An automatic reader could confuse historical status with current state. | Status Addendum E2-5 at the beginning of `entrega-programacion-2/05_MATRIZ_API_Y_TRAZABILIDAD.md` with current correspondence CU-11→RF-06 and notice on historical previous tables. | **CORREGITED IN PR** |
| **DOC-E25-06** | P2 | Some sections declared that the auditor's sheet would be made later, inconsistent with the new order. | Updated index, report, traceability, risks and checklist to say **prepared, not implemented/not approved**. | **CORREGITED IN PR** |
| **DOC-E25-07** | P2 | Repeated debts between P03/P13, P07/P16 and P04; implementation could be duplicated by an AI. | Related debt IDs without deleting your history, and defined **a main criterion** per family. | **CORREGITED IN PR** |

## 3. Functional/documentary consistency results

| Criterion | Editorial check | Outcome |
|---|---|---|
| Source of truth/SHAs | PR #21/#22/#23 merged; code SHA, migration and CI matching closure | **According to GitHub evidence** |
| Authorisation | Opaque tokens, Bearer + DB; STORE permissions and role by headquarters; politics and docs | **Corrected terminology; pending effective security audit** |
| HTTP contracts | 6 inventory and reception endpoints as a dependency; strict Pydatic and UUID4 | **According to code inspected** |
| Persistence | Manual header + ledger signed + versioned balance; additive migration | **According to models/migration, it does not certify SQL of privileged role** |
| Concurrence | Location locks sorted in transfer, version in adjustment, own concurrent tests | **According to existing tests, cross-race is still without specific test** |
| Idempotency | 201 new / 200 identical replay / 409 conflict | **According to services, tests and Swagger reported** |
| Initial stock | Once per pair, also when previous balance was exhausted at 0 | **Deliberate rule, not to adopt re-initiation** |
| QA and figures | 6/4 Article A and 6 Version3 Article B, ledger 3+3 events | **Reported manual attribution, not DB own reading** |
| CI/Windows | 816/826/840 per CI cut; 840 Windows in C | **Procedencia separada, no es % coverage** |
| React/Sales/Production | DEMO/TO-BE y hardening pendiente | **Explicit; not attributing sales backend to E2-5** |
| Secrets in docs | No password, Bearer literal, real key, personal mail or private DSN | **PR Content Control; Repeal of the Exposed Session Reported by Swagger 204, Not SQL Inspection** |

## 4. What is approved and what is conditioned

**The team can be recommended:**
1. Adopt the corrected documentary version for **independent technical audit**, after human review and controlled RP merge.
2. Provide the companion with the reproducible plan and master guide, **without publishing credentials**.
3. Keep current rules frozen while audited, and ask AI to review findings with evidence before changing code.
4. Request special attention to SQL runtime permissions, ledger/balance divergences, cross-runs, retrying after change of permissions and DB isolated test.

**Non-blocking pending for preparing audit, but relevant before production:** immutability of the leadger to direct SQL according to effective privileges, negative reduction policies, compensatory reversal, retrying after revocation, reconciliation and possible structured error interface. **They are not resolved to write documents.**

**Security update after the initial opinion:** the session whose token was exposed was closed by `POST /api/v1/auth/logout` **204** (09/11/2026 15:23:37 GMT) using the **same token**. Evidence **SWAGGER-REPORTED**, consistent with the revocation service. **This specific slope is closed**; no other meeting status is certified or the value reproduced.

**Publication status:** PR #24 is still a draft without merit; the audit sheet requires completion of the actual SHA documentary **after publication**. Until then, do not claim that the independent audit has begun or that documentation is in place `main`.

## 5. Definition of OK

East **OK is editorial and technical preparation**: the package is internally useful, describes what has been implemented with traceability and provides an audit agenda that can be executed by a human reviewer/IA. **It does not imply that the implementation of E2-5 has passed a new audit**nor does it authorize altering the backend, applying new migrations, reviewing other modules in depth or merging an PR on its own.

To get past `OK documental` a `CIERRE AUDITADO` missing, in order: approve and publish PR documentary, share commission with reviewer, receive independent report with real evidence, review/correct only confirmed defects and decide to merit from that PR by the team.


## 6. Addendum to publication after the original opinion

The previous record reflects the status of **before the merge** #24, so your mentions to ‘Draft’, ‘to be approved/merged’ and ‘not published in `main`» are historical. The responsible authorized the closure and conservation of UUID resources QA; PR #24 was **merged into `main`** with the original SHA documentary `c66df2f8ddaa8179ca12e342bd3099348bc6b155` on 11/9/2026. The QA session was revoked according to Swagger's response `POST /api/v1/auth/logout` `204` provided by the developer, without spreading the token.

The publication does NOT imply an independent audit performed: it will follow its formal process, with its own branch, tests and PR. References to the original documentary SHA are maintained **stable** even if there is a subsequent errata commit to complete references, the reviewer must also record the actually inspected HEAD.
