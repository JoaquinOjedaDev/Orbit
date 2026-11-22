# E2-2 D — Prior Plan and Implementation Record

**Project:** Orbit · **Date:** 08/11/2026 · **Status:** IMPLEMENTED AND VALUE IN CI AND WINDOWS (371/371); UNsubmitted PR FOR REVISION  
**Block:** E2-2 — Business locations and location clearance  
**Checked cut:** code E2-2 C in `7abafd8208965cd99b0116e02ffc5240d23f218f` (CI 3/3), documentation/03A synchronized later.  
**Evidencia local:** Windows: **325 passed in 36.91s**, Alembic `e22b_location_casa (head)` sin deriva, Docker API y PostgreSQL `healthy`, `/ready` = `ready/ok`.

> **Nota:** Sections 1–5 are the historical plan prior to implementation, so that their expressions "pending" are read in this context. Section 6 records the status of the current code.

> **State in force E2-2 (08/11/2026):** E2-2 A/A.1/B/C/D implemented and validated: **371 Windows tests approved in 47.57s**, Alembic `e22d_assignments (head)` sin deriva, API y PostgreSQL en Docker `healthy`, `/ready` = `ready/ok`. Code IC E2-2 D: 3/3 approved, 371 Python tests 3.12/3.14 and Docker. **The headquarters policy does not yet apply to inventory/purchases/sales**, which are future blocks; frontend React remains DEMO. The partial states described in notes of A/B/C constitute historical.

## 1. Reason for this phase

The master guide states that E2-2 contemplates **membership, permits and location relationships**. E2-2 A/B/C effectively implements:

- `locations` with FK to Company, types `LOCAL/FERIA/DEPOSITO/OFICINA/CASA/OTRO`, independent capabilities, state and main unique active.
- Create, list, view, edit, pause/reactivate and choose main in **six real routes** by tenant, with revalidated business session and membership.
- RBAC: AMINISTRATIVE AND ADMINISTRATOR SERVICE manage all of their own locations; active members of other roles can consult them. The suspended company is read only.
- 325 local regression tests + postgreSQL/Python CI 3.12/3.14/Docker correct.

**Not yet in existence** assignment of members to specific headquarters or an operational permit restricting future purchases, stocks and sales to such locations. **DO NOT declare complete E2-2 or generate the sheet `E2-2_ENTREGA_PARA_REVISION.md` until this scope is explicitly resolved or its deferment approved**.

## 2. Suggested policy to avoid breaking E2-1 or E2-2 B/C

1. Keep the **global identity** of User and the **Membership by Company**; location **Never** creates a global role and an independent membership.
2. Keep current administrative/operational reading: Active members can list and consult tenant locations, without crossing companies.
3. Maintain holder/manager with business administrative permission to create/edit/pause/main designator, regardless of future employment assignments.
4. Define Assignment **Company Membership ↔ Location** as a working link (potentially many-to-many) for CHARGE/TRABEDOR, with revocation. A user from several companies may have separate assignments.
5. **Future commercial operations** must verify simultaneously: session ACTIVA, membership ENTITRAL, company ENTITLEMENT, location ENTITLEMENT `can_sell` o `can_store` according to the operation, and allocation in force where applicable. **Allocation does not grant administrative permits on its own.**
6. No one should be granted access to the premises of another tenant for UUIDs. Suspension of a membership cancels effective access even if historical assignments exist.
7. Avoid rewriting models or migrations of E2-0/E2-1. If new indices/constraints are required for composite FKs, add them by adding additive Alembic migration and testing, not retrospective editing.
8. Do not invent stock dependencies that do not yet exist. `can_store`, indicate that the ban with positive balances is implemented in E2-5, not validate it in a fictitious way now.
9. Do not modify the DEMO frontend or connect React to FastAPI in E2-2 D; integration belongs to E2-7.

## 3. Contract to be terminated before codifying

| Technical question | Suggested criterion/protection |
|---|---|
| What entity does the assignment represent? | A Membership Association **of the same tenant** with a Location; check tenant both in SQL and service. Avoid duplicate business roles. |
| Who can manage assignments? | Only ENTRY_MANNER/ACISTERING OF THE ACTIVA COMPANIES. Do not allow workers to self-assign themselves. |
| Is it allowed to assign a holder/admin to a headquarters? | Optional as information, **Never** as a source of its administrative authority. |
| What does an active assignment mean? | Only if the location, company and membership are active, and the assignment was not revoked. |
| What is shown to the workers? | Keep reading locations as current contract; granular restriction will apply to the **operation** on a seat, it is not inferred that the domicile should be public. `address/map_url` require stricter visibility before deployment. |
| How does the case behave without assignments? | Deny the **operations by headquarters** worker/manager until assigned, not create implied accesses. Current reading remains intact. |
| Is permission to change permission `can_store` con stock? | Even without persistent inventory, it can be changed; E2-5 will add the business rule when real stock exists. |
| Are inventory or sales operations enabled here? | No. E2-2 defines reusable policy and allocation management; E2-4/5/6 consumes it. |

These rules are **design proposal** For E2-2 D, no proven functionality or irrevocable academic decision. Maintain localized and transactional changes.

## 4. Verifiable implementation sequence

1. Specify the assignment model, its tenant membership constraints, high/revocation and behavior before membership/disturbed location.
2. Add SQLAlchemy model and new additive migration. Do not alter `e22a_locations`, `e22b_location_casa` No E2-1 migrations.
3. Add services/repository/allocation paths to the module `locations`, reusing existing identity/session and blocking without mutating the creation and management of locations behavior.
4. To present a pure and testable authorization policy for future location commands; for active locations and compatible capabilities, with consistent role/member/assignment.
5. Test: holder/admin, manager/worker, inactive membership, suspended company, PAUSADA location, revoked assignment, other IDs, two companies of the same user, uniqueness, attendance and rollback.
6. Validate `alembic upgrade head`, `current`, `check`, Full Python, CI Python 3.12/3.14 and Docker; confirm Windows local.
7. Reconciling RF-03, CU-04, Documents 01–05 and UML 03A (PUML/guide/SVG editorial). Leave 03B and 03C unchanged.
8. **Only then.** generate `plataforma-pyme/docs/revisiones/E2-2_ENTREGA_PARA_REVISION.md` with SHA closing, block allowlist, deliberate decisions, exclusions, results and branch `review/e2-2-ubicaciones`The companion creates `E2-2_INFORME_DE_REVISION.md` in its branch and presents PR **sin fusionarlo**.

## 5. Do not confuse the cuts

| Cut | Status |
|---|---|
| E2-2 A/A.1 | Persistence and CASA, locally validated |
| E2-2 B | POST + GET list/detail, locally validated (277 tests) |
| E2-2 C | PATCH editing, PATCH status, main PUT, locally validated (325 tests) |
| **E2-2 D** | **Pending:** granular operational allocations and permits by location |
| E2-2 formal delivery | **Not created** until E2-2 D resolution or approved deferment |
| E2-3 Catalogue | Unstarted; not anticipate code |

**Closed range up to C:** location of company with effective controls for tenant and administrative role. **Recognized gap:** Location permissions for operators and future business modules. A successful testing matrix does not demonstrate missing functionality.

## 6. Confirmed implementation of E2-2 D (08/11/2026)

**E2-2 D AS-IMPLEMENTED:** `LocationAssignment` con clave `(business_id,location_id,user_id)` and FK composed towards `Location` y `Membership` of the same tenant. Additive migration `e22d_assignments`, single location index `(business_id,id)`. Administrative States `ACTIVA`/`REVOCADA`; date `revoked_at`No physical deletion. `GET /api/v1/businesses/{business_id}/locations/{location_id}/assignments` list of assignments from a headquarters (holder/manager); `PUT /api/v1/businesses/{business_id}/locations/{location_id}/assignments/{membership_id}` receive JSON `{"status":"ACTIVA"}` o `{"status":"REVOCADA"}` and actively/revolves. Only one member is activated ENTRY/TRAWER active towards the active location; revoke allows for paused headquarters or inactive member. Company SUSPENDED read only. Pure policy `can_operate_at_location` obliging tenant, membership, headquarters and capacity `SELL/STORE` in force, besides the active assignment to managers/workers. **The policy is not yet consumed in purchases, inventory or sales**, outside this cut. No new E2-1 functions or frontend connection.

**IC checked for functional code `3cd7bce71d951218e8c77da58d147e78fb0d426e`:** run 42497556047, **371/371 tests Python 3.12 and 3.14, 3/3 jobs approved**, Alembic `e22d_assignments (head)` sin deriva y Docker saludable. **Local Windows E2-2 D is pending:** the last execution contributed corresponds to E2-2 C, 325 passed. Do not attribute to the last commit documentary own execution of tests.

**Next step:** validate 371 tests on Windows, Alembic and Docker; then close documentation/UML and generate E2-2 review sheet with fixed SHA and branch `review/e2-2-ubicaciones`. The partner will prepare report and PR without merit, following the master guide.

## 7. Confirmed technical closure and next delivery

**Evidence received from Windows:** `371 passed in 47.57s`, `e22d_assignments (head)`, `No new upgrade operations detected.`, PostgreSQL y FastAPI `healthy`, `ready/ok`. This validation replaces the ‘Windows pending’ indication that was registered when drawing up the plan before implementation. `docs/revisiones/E2-2_ENTREGA_PARA_REVISION.md`, with the independent review branch. Do not start E2-3 as part of the review.
