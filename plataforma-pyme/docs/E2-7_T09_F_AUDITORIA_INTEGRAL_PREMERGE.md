# E2-7 · T09-F — Comprehensive audit of consultation and recovery of real sales

**Date:** 10/11/2026. **Rama:** `feature/e2-7-t09-consulta-recuperacion-ventas`. **PR:** #42 (delete, **sin merge**). **Base `main` de T09:** `5f83541049b6332e5a991810cbfd105515db10ce` (Close T08).

**Type of work:** Code/repository review, HTTP contracts, PostgreSQL and Playwright test cases, access matrices, IC evidence and user-reported manual evidence. It does not involve connection to your computer database, manual sales execution or access to original captures outside the chat.

**Final status:** T09-F audit **COMPLETED/APTA FOR FINAL REVISION**. Technical findings in branch; workflows of the last functional commit **APPROVED**. **No merge authorization involved:** PR #42 remains in draft until the responsible approves.

## 1. Scope and limits of block T09

- **T09-0:** base line and decisions P02/P03 (roles, historical permits and consultation contract).
- **T09-A:** customer GET voucher by UUID with snapshot parser, amounts and payments declared.
- **T09-B:** User approved policy: holder/admin all tenant; maintainer/worker exclusively sales of offices with active assignment. No permanent exception for being author.
- **T09-C:** `GET /api/v1/businesses/{business_id}/sales` (paged summaries), `GET /sales/by-request/{request_id}` and hardening of `GET /sales/{sale_id}`, filtering permission in SQL before pager. No new roles or migrations.
- **T09-D:** read-only REAL history and vouchers in React (load, filter, next page, error/retry, `request_id`, F5/login, respondive). DEMO remains isolated.
- **T09-E:** playwright REAL on disposable basis simulating loss of the `201` **tras el COMMIT**, recovery by GET, replay `200` with the same key/body, `409` if body differs; physical sale with a single debit and sales service without stock.
- **T09-F:** audit, regression, documentation, acceptance of limits and pre-merge opinion. **T10/real POS not implemented**: T09 **no** offers forms to create sales in React, no lasting journal of attempts, or accreditation of external payments.

**Final comparison against `main` (before this documentary closure):** **40 commits ahead, 0 from behind, 19 files** modified/added only under `plataforma-pyme/`GitHub confirms **mergeable=true, mergeable_state=clean**without conflicts and with `main` This documentary commit adds one more to the commit count, but does not change functional files.

## 2. Technical evidence matrix

| Audited area | Evidence | Opinion |
|---|---|---|
| Session and tenant | FastAPI revalidates session/membership; queries limited by `business_id`; no cross access when knowing a UUID/request ID | Right according to existing evidence |
| Four roles | ENTRY_AMINISTRATIVE/ADMINISTRATOR full tenant access; CHARGE/TRAWER only assigned active sites; no seat service reserved for holder/admin | Policy approved and verified in PostgreSQL |
| Change of permissions | Revocation of assignment removes reading even the author; session/membership revoked denies; paused venue retains historical reading if assignment continues ASSISTANCE, does not authorize new sale | Automatically checked |
| Backend `GET /sales` | Summary DTO without payment references, SQL filter prior to offset/limit, order `created_at DESC, id DESC` | Checked with 102 ephemeral vouchers |
| Request by ID/Request | Same authorization matrix, `404` for inaccessible sales; does not generate any move or forward POST | API and Insulated Browser Check |
| Sale and Idempotency | Original sale `201`, replay same actor/key/body `200`body changed `409`; a voucher, a set of declared payments and ledger without duplicates | Verified in E2-6 + T09-E |
| Physical stock | `VENTA_SALIDA` negative once; stock 5→4 UNIT/v2 in fixture; historical snapshots; no stock service | Checked in Playwright/DB ephemeral |
| Frontend | Gateway exclusivo de GET, sin `localStorage` token, without failback to DEMO, read-only IU; load/error/retry, navigation and responsive | Cubierto con Node, Playwright y build/lint |
| Regression T08/DEMO | Playwright Suite Real inventory and DEMO; do not change inventory/sales logic E2-6 except endpoints GET | Green in full execution T09-E |

**known CI of T09-E (base of this audit):** full-stack #42910407673 **SUCCESS**, **886/886 backend**, **272/272 frontend**, **10/10 Playwright REAL**, **6/6 DEMO**, build y lint aprobados. Backend independiente #42910407905 **SUCCESS** in Python 3.12 and 3.14 and Docker. Rechecking is required in SHA with T09-F corrections (see section 6).

## 3. Manual evidence that really exists

| Ctrl | Documented result | Scope |
|---|---|---|
| REAL Reading on Windows | User entered **TEST Company A** as **ADMINISTRATIVE SHIPPING**, saw Sales history, "Read only", location and consultation by request | **Manually Approved** |
| Backend Docker local | Initial error 5xx by old image; FastAPI was rebuilt, three paths were checked and proxy Vite corrected | **Solved, approved in subsequent observation** |
| State without sales | `0 cargadas · Fin del listado consultado` and empty list message **no error** | **Manually Approved**. It does not amount to ‘no sales in all companies’ |
| Headquarters filter | Control available in capture | **No manual filter change is reported**; cubierto en Playwright |
| Sales details with actual amounts and payments | No visible sale locally to open | **Not executed manually**; validated in PostgreSQL/Playwright ephemerals |
| Local Recovery by Request_id | There was no pre-existing local key | **Not executed manually**; T09-E automated |
| Local POST response loss | No mutations on TEST Company A were simulated | **Deliberately not executed manually**; automated with response abort in IC |
| Mobile and paging | No mobile manual capture/50+ sales | **Not executed manually**; cubierta por Playwright REAL y pruebas de API |

Internal sources: [T09-D — manual actuator and QA](E2-7_T09_D_HISTORIAL_VENTAS_REALES_QA.md), [T09-D — development and historical QA](E2-7_T09_D_HISTORIAL_Y_COMPROBANTES_QA.md), [T09-E — Recovery](E2-7_T09_E_RECUPERACION_VENTAS_IDEMPOTENCIA_QA.md). The historical document T09-D was reconciled with subsequent manual acceptance, without erasing the log of rounds or attributing automatic evidence to captures.

**Are there mandatory manual tests for the T09 merge?** We don't identify a test. **mutant** local necessary: creating sales at the user base only to produce evidence would introduce unjustified changes. **optional** a verification **non-mutant** If the controller wants additional evidence, it will be necessary to change the filter, reload F5 and re-enter. For actual proofs and POST cutout, automated isolated trials cover functional acceptance of the T09 range. This assessment does not replace a specific teacher requirement if it requires captures from each scenario.

## 4. Audit findings and corrections in the branch

| ID | Priority | Observation | Status/treatment |
|---|---|---|---|
| T09-F01 | **Average — corrected** | Parser `parseSaleSummaryList` compared `Date.parse(created_at)` PostgreSQL offers microseconds: two different sales within the same ms could be considered as a "pattern", and a valid order was rejected for comparing UUID | **Corrected**: complete order in microseconds and UUID tie-off only when the times are really identical. New retrogressive test on times `.123999` vs `.123001`, plus exact tie |
| T09-F02 | **Low — corrected** | Header said "Consulting..." although the listing had failed, visible observation in previous user capture | **Corrected**: status `Error al consultar` y recorrido Playwright con `503` injected, retry button GET and zero POST check |
| T09-F03 | **Low — corrected** | Two quick clicks on "Load More" could start redundant requests before the React status was updated | **Corrected**: immediate lock by active page driver ref |
| T09-F04 | **Documentary average — corrected** | Two T09-D minutes retained different manual statements (the previous one still said 'pending' after the acceptance capture) | **Conciliated**: the historical act refers to the new and local difference of tours Playwright |
| T09-F05 | Low — known | Pageing for `offset` you can skip items when inserting sales between pages, even if a duplicate ID does not appear; the frontend detects visible duplicates but does not guarantee list snapshots | **Non-blocker for MVP**: show partial results; plan stable cursor/snapshot in evolution T11 |
| T09-F06 | Low — known | Operational roles can see selector headquarters options that are unassigned; choosing them returns an authorized empty list | **No sales revealed**, effective filter only backend. Consider filtering names by assigned headquarters in an UX upgrade |
| T09-F07 | Low — Architectural boundary | No durable POST journal available on the frontend; T09-E test retains key/body only in test Harness | **Explicitly reserved to T10**: do not enable real POS until recording durable and safe retrying attempts |
| T09-F08 | Low — evidence | No original local captures were archived in the repository's T09 folder; the minutes cite the catch provided in conversation | Acceptable for follow-up; add sanitized capture if an independent academic review requires it |

**Incident CI of the new T09-F test (solved):** the runs of the committs `f3521db`, `12e7c97` y `f494781` detected **1 Judgement** in the newly incorporated Playwright 503/reintendant error test. 503 injection occurred only for the first request and React StrictMode could reassemble/resert, eliminating the error status before assertion; **was not a permissions, stock or server sales failure**. Corrected in `3df34c9`: the test keeps 503 on every GET request until you press "Retry", then allows real query. Full-stack #42913262454 verified the case **APPROVED**. Keep failed runs as historical evidence of detection and resolution, not describing them as green.

**No reproducible critical failure found** A static audit + IC does not show an absolute absence of future defects.

## 5. Integrity of scope

- Existing domain models were not modified to add a financial account or confirm external payments. Payments are **declared**, unaccredited.
- No global scripts or Bearer persistence were introduced into `localStorage`. The frontend does not write sales; the only POST within browser tests corresponds to fixes or T09-E's controlled Harness.
- Not amended `main`. La rama `feature/e2-7-t09-consulta-recuperacion-ventas` and PR #42 should remain open as draft until explicit authorization by the responsible.
- At the end of T09-F, the next block T10 must retain P02/P03 permits and contract, and design REAL POS creation with persistent idempotency before enabling payments/stock.

## 6. Final validation and opinion

**Functional committee verified:** `3df34c9a4d0c52294dcd59e24a55c8f8c8d4ebaf` (test correction 503). The exclusive subsequent documentary committs do not alter the performance behavior.

| Final Control | GitHub execution | Confirmed result |
|---|---|---|
| PostgreSQL ephemeral and full backend suite | Full-stack #42913262454 | **886/886** approved, 2 non-blocking warnings |
| Frontend Node | Same run | **273/273** approved, 0 failed (includes new microsecond test) |
| Compilation and Lint | Same run | **Build and Oxlint without errors or warnings** |
| Playwright REAL | Same run | **11/11**: 4 inventory T08, 4 reading/mistakes sales T09-D/F, 3 recovery T09-E; **including 503 with retrying GET** |
| Playwright DEMO | Same run | **6/6** Approved |
| Python 3.12/3.14, Docker y liveness | Backend independiente #42913262461 | **SUCCESS** all jobs |
| Frontend y Chromium DEMO independientes | Frontend #42913262480 | **SUCCESS** all jobs |
| Comparison PR #42 with `main` | PR #42 | **Sin conflictos, 0 commits behind**, aún **DRAFT / sin merge** |

**Final opinion: T09-0/A/B/C/D/E/F COMPLETED AND APPOSED FOR FINAL HUMAN REVISION.** There is no failed automatic test in the last functional commit, nor were critical defects of this range identified. It is not mandatory to make new sales or mutant tests at the local PostgreSQL to close T09. Additional manual checks possible (change filter, F5, check responsive) are **optional and read-only**; they are not attributed as realized. Non-blocking risks (overset pagination, absence of POS/journal T10, unarchived graphic evidence) are listed. **Do not merge main until explicit authorization of the person responsible**.
