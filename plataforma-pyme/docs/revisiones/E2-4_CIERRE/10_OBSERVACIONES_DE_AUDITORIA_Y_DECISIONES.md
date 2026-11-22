# E2-4 — Comments on the review received and documentary decisions

**Type:** evaluation of external observations provided by the developer on 11/9/2026. **Not a comprehensive independent audit of all archives**. Contracts, migrations, tests, IC and the catalogue block listed below were expressly checked. Opinions on future design are classified as proposals, not reproduced errors.

## 1. Report and quality of evidence

| ID | Comment received | Verification and decision |
|---|---|---|
| REV-E24-001 | CRUD Manual Log Missing Suppliers | **Confirmed as a documentation usage gap**: QA is available as a historical reference and HTTP/SQL/CI tests, but not the manual transcription of POST/list/PATCH/status. No results are invented. Additional QA pending if required. |
| REV-E24-002 | Unable to play historical replay without publishing key | **Confirmed as deliberate limitation of sanitization**. The evaluator will generate new private UUID4 in a test tenant and repeat the same operation; the original GETs do allow verification of past resources. Collection added `requests/E2-4_QA.http` con placeholders. |
| REV-E24-003 | Local Suite based on data development | **Confirmed as physical isolation debt**. PR #18 corrected the contamination of SQL assertions and 797/797 was confirmed with previous data; **did not create ephemeral DB or block production URLs**. Separate block infrastructure work is proposed. |
| REV-E24-004 | Duplicidad de PDF y Markdown en Git | **Accepted**. Only Markdown/JSON/ HTTP collection/checksums manifest is versioned. The previous academic PDF/ZIP is out of Git to avoid binary duplication; it can regenerate to deliver. |
| REV-E24-005 | Falta frontmatter | **Accepted**The report has frontmatter with cut, commit, scope, status and IC. |
| REV-E24-006 | Seeder of QA for third parties | **Partially accepted**. No seeder will be added that switches resources when running automatically and requires tokens. .http parameterized collection is included; an isolated finder opt-in with private keys and secure cleaning is left as later improvement. |
| REV-E24-007 | Checksums del manifiesto | **Accepted**. Archive of `sha256sum` regenerated against final texts left on the branch, with local verification instructions and no extra lines not compatible with `-c`. |

## 2. Architecture and operation

| ID | Item | AS-IMPLEMENTED SITUATION AND |
|---|---|---|
| REV-E24-008 | Partial reception / multidestiny | **Deferred by explicit scope**. Currently 1:1 purchase/receive and one location, 100% atomic operation. Future evolution 1:N will require additive design and migration with control of remaining quantities; no change 0015 retrospectively. |
| REV-E24-009 | Status `CANCELADA` unattainable by API | **Documented functional gap**. State present in domain, without POST/PATCH of commercial cancellation. Define permission, transition, compensation and error messages in future increase. |
| REV-E24-010 | Cannot undo reception | **Documented functional gap**. Propose compensatory operation/auditable adjustment that does not erase the original movement and respects non-negative stock. |
| REV-E24-011 | No currency or exchange rate on purchase | **Actual business limitation** For multicurrency; whole cents without ISO 4217 explicit. Do not assume that amounts are always in ARS for tests expressed in weights. |
| REV-E24-012 | Detour by HALF_UP by line | **Explicit and proven numerical decision**The sum of lines may differ from external vouchers for rounding; future fiscal reconciliation/taxes/discounts should be explicit and audited. |
| REV-E24-013 | 30 line stopper | **Functional limit in force**; evaluate high/mass imports with guarantees of atomity and size limit. |
| REV-E24-014 | Unchangeable history only REST | **Hardening risk confirmed by design:** There is no UPDATE/DELETE REST, but there are no triggers that block SQL statements with privileges. Prioritize restricted SQL role, audit and evaluation of triggers before production. |
| REV-E24-015 | Alleged lack of FOR SHARE in Catalogue | **Not applicable**: `backend/app/modules/purchases/receipt_service.py` Get articles with `.with_for_update(read=True)` (Shared block when using PostgreSQL). External review should correct this point. It is preserved as debt to try a specific race in which someone tries to change type/unit while receiving. |

## 3. Editorial decisions made in this documentary PR

- **Edited** the header of the steering report with YAML metadata and clarification of the origin of evidence.
- **Preserved** the manual logbook with the 17 reported cases and added note of absence from the CRUD Suppliers Manual.
- **Conciliated** technical notes of IC, architecture, traceability, QA tab and reproduction, specifying the bug test, shared DB debt and existing SQL lock.
- **Added** a JSON tuned for machines, parameterized HTTP examples, a delivery sheet for an eventual independent review and a checksums manifest.
- **Updated** The indexes of academic and technical documentation with current cut-off note; the old paragraphs remain as history.
- **Not modified** backend/frontend code, migrations, UML files, tables, environments, QA data or secrets.

## 4. Limits of the decision

The functional closure E2-4 does not certify a productive MVP nor does it mean that the pending ones are approved to implement. Each future change must start with reach decision, ADR if it alters the domain, compatible migration and regression tests. If an independent subsequent audit is carried out, it must start from fixed SHA and produce its own report, other than this document. **response to comments**.

**Sources of verification:** PR #12–#15, #17–#18; CI 42530739959; routes of `suppliers`, `purchases`, `receipt_service.py`, migrations 0012–0015 and Swagger responses described in the logbook.