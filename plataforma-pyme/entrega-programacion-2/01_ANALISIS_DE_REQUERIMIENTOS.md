# 01 — Requirements analysis

**Current version of query:** T12-B / E2-7, 11/11/2026 · **Functional cut:** `main` `c6a77137cf82dcb9aad225645e84b1265b1da3ec` (PR #45).  
**Status:** academic core RF-01–RF-07 implemented in FastAPI/PostgreSQL and connected to Real React screens; RF-08–RF-10 continue DEMO/deferred.  
**Purpose:** check the scope **actual** without rewriting incremental background.

> **How to read the document:** the section ‘T12-B status in force’ is the current reference. Under ‘Historical file’, statements such as ‘React follows only DEMO’, ‘RF-07 pending’ and ‘TO-BE’ are **photographs of previous E2 cuts**, do not describe the `main` 11 November after T11. This criterion avoids deleting the academic record of decisions. For routes, permits and evidence consult the [Document 05 in force](05_MATRIZ_API_Y_TRAZABILIDAD.md).

## Current status T12-B — functional scope implemented

Orbit is a **generalist and multi-company platform**. Each user has his/her own identity; he/she can create companies or join by invitation, and REAL operations validate membership, tenant, role and, for physical operations, capacity/location of headquarters. WALOS is just an example of company, not a restriction of domain.

**Two explicitly isolated modes:** `/real/...` uses React connected to FastAPI and PostgreSQL; `/inicio` y `/b/{demoId}/...` use local DEMO data. DEMO data is not automatically imported into the API. REAL authentication uses opaque Bearer in memory; after F5 requests to be entered again. REAL payments are **declared**: do not constitute bank accreditation, Market Payment or tax issuance.

### RF in force, cut and traceability

| RF | Description of requirement | Checkable status in the MVP | CU | Limit declared |
|---|---|---|---|---|
| **RF-01** | Identity, registration, login, authenticated profile and logout | **REAL** — API and IU, protected sessions, re-attend after F5 | CU-01, CU-02 | No mail check or persistent refresh |
| **RF-02** | Create/Edit Company, Memberships, Team, Invitations | **REAL** — creation and profile; nominative invitation, identity acceptance and team management | CU-03, CU-12 | No automatic mail or title transfer |
| **RF-03** | Locations and permits by headquarters | **REAL** — High/consultation/editing/pause/reactivation/main; allocations, SELL/STORE filter | CU-04 | General visibility of balances of the same tenant allowed; manage a non-headquarters |
| **RF-04** | Catalogue sheets for goods, inputs and services | **REAL** — high/consultation/editing/state; optional prices, SKU and pagination | CU-05 | A service does not generate physical stock movement |
| **RF-05** | Suppliers, shopping, reception | **REAL** — CRUD supplier, purchase with good/service/free concept and full reception idempotent | CU-06, CU-07 | Register purchase non-alter balance; partial receipt/multidestination deferred |
| **RF-06** | Inventory control and traceability | **REAL** — versioned balances, ledger, double-moving, initial stock and version adjustments | CU-08, CU-09, CU-11 | Non-negative stock; STORE operations subject to authorisation by headquarters |
| **RF-07** | Sale of goods and services with declared payments | **REAL** — POS, cart, price per role, discounts, divided payments, vouchers and recovery by request | CU-10 | Activated POS write by explicit configuration; no reconciliation of external payments |
| **RF-08** | Expenditure and opening/closing of cash | **DEMO** — local behaviour; **sin** homologue backend in this clipping | Outside the 12 nuclear CUs | Do not represent it as REAL cash box |
| **RF-09** | Reference financial accounts | **DEMO** — form and local status | Out of the core | No bank account or crediting |
| **RF-10** | QR Collection Intentions | **DEMO** — Illustrative visual QR, not scanable or certified | Out of the core | No integration OAuth/webhook Real Payment Market |

**Academic compliance criteria:** RF-01–RF-07 have use cases, real contracts and verifications; asserting seven RF does not mean that *all* options for each E1 module are implemented in API. E27 was verified in functional scope/smoke, not as production certification or complete WCAG audit.

### Cross-cutting business rules currently tested

1. **Multi-tenant isolation:** you can not read or modify resources of an external company only knowing its UUID; the interface discards late answers when changing companies. An actor may belong to several companies without mixing data.
2. **Effective authorization on server:** Hide controls in React does not enable an action. Selling goods requires SELL capacity, reception and transfers require STORY; workers can only operate headquarters where they retain active assignment. The POS filtering and transfer correction was checked manually and at Playwright.
3. **Purchase and reception are different events:** `POST /purchases` conserva un snapshot comercial sin mover stock; `POST /purchases/{purchase_id}/receive` generates inputs only for physical lines, transactionally and uniquely.
4. **Integrity:** balance by (company, headquarters, article) + version and ledger signed; negative origin transfer/positive atomic destination, adjustment with `expected_version`, ban on negative balances and rollback in the face of conflicts.
5. **Money in cents and amounts in thousandths:** totals per line with rounding HALF_UP; payments declared add up exactly the final amount. A physical sale takes stock, one of services does not; no bank charge is claimed.
6. **Idempotency and recovery:** commercial commands identified by UUID `Idempotency-Key`; lost response does not mean failed operation; authenticated recovery and manual replay without duplicating operation.
7. **REAL/DEMO isolated:** QR flows, days and DEMO accounts should not consult or generate REAL commercial scripts.

### Evidence and acceptance limits

- [T11 — final audit and 26 E27 scenarios](../docs/E2-7_T11_E_AUDITORIA_FINAL_PREMERGE.md).
- [T11-D2 — 39 manual test steps](../docs/E2-7_T11_D2_ACTA_PRUEBA_MANUAL_REAL.md)including two corrected and retested headquarters permit defects.
- GitHub Actions full-stack del commit final T11: **892 Pytest, 38 Playwright REAL y 6 DEMO aprobadas**. Independent Frontend/backend: three green ICs. These are ambient results **disposable**, not test deeds in productive data.
- **Documented non-blocking debt:** Pydatic warnings about `Field(alias=...)` in concurrent tests, pending commercial payload on IndexedDB without encryption, accessibility/design improvements, real banking infrastructure and RF-08–RF-10 functionalities.

**Main technical sources:** `backend/app/api/v1/router.py`, `backend/app/modules/{auth,businesses,locations,catalog,suppliers,purchases,sales}/*router.py`, `frontend/src/features/auth/RealAuthApp.tsx`, screens `Real*Page.tsx` y `frontend/e2e/real/*.spec.ts`. El [Document 05](05_MATRIZ_API_Y_TRAZABILIDAD.md) lists specific methods and routes.

---

## Incremental historical file prior to T12 (conservated)

The following content maintains **full** the analysis and the statements that were correct at their respective dates (E2-1 to E2-3). **have no precedence** on the previous status section.


**Project:** Orbit — Multi-company and multi-strike management platform  
**Materia:** Programming 2  
**Version:** 1.7 — E2-3 E, real catalogue and 580 Windows tests
**Status:** **RF-01/RF-02 implemented kernel; RF-03 E2-2 C location API available with declared boundaries**  
**Date:** 8 November 2026  
**Source of academic requirements:** official entry ‘Development of an RESTful API’.  
**Scope of this document:** product analysis and objective requirements. **It does not amount to claiming that the API is implemented.**

> **Closing E2-1 / C.5 — 08/11/2026:** C.1 (98), C.2 (125), C.3 (147), C.4a (171) y **C.4b (195/195 approved local tests; `195 passed in 23.86s`)**. Alembic `e213c4_acceptance (head)`, `No new upgrade operations detected.`; Docker FastAPI/PostgreSQL `healthy` y `/ready` = `ready`/`ok`. GitHub Actions **3/3** corresponde al commit funcional `8cd1674`. C.5 es **documentary only**; no re-execution of evidence or change of endpoints, SQL models or migrations. React follows DEMO; RF-03–RF-07 has no backend; title transfer, mail verification and hardening for production remain pending.

> **State in force E2-2 (08/11/2026):** RF-03/CU-04 and E2-2 A/A.1/B/C/D implemented, with locations, partner assignments, tenant authorization and reusable operational policy. **371/371 tests on Windows (47.57s)**; `e22d_assignments (head)`; Alembic without pending operations; Docker FastAPI/PostgreSQL `healthy` y `/ready` = `ready/ok`. IC code E2-2 D: 3/3 and 371 tests in Python 3.12 and 3.14. **No** React–API integration and commercial purchases/stock/sales transactions that consume the policy are still in place; they correspond to later blocks. The previous cut-off paragraphs that mention validations or "pending" functions are retained as **history**, not as current state. The integral TP is not declared finished.


## 1. Project presentation

Orbit is a management platform for small and medium-sized enterprises in different sectors. It aims to centralize commercial and operational information that is usually managed through separate tools, manual records or spreadsheets.

The system allows to organize companies, locations, items and services, suppliers, purchases, stocks, sales, expenses, means of payment and cash days. Each company retains an independent data context, while one user may be linked to more than one company.

**WALOS** is used as an example of business during testing and demonstrations. **is not limited** to the pet products sector.

The Frontend React/TypeScript is still in DEMO mode with local storage. A FastAPI API with PostgreSQL and real authentication plus the first business operations has been implemented in parallel. **Business authorization of profile, invitations and equipment is already implemented; permits for future commercial operations and modules RF-03–RF-07 are still under development**; frontend/API integration is not yet in place.

## 2. Problem to be solved

A company can manage its catalog, suppliers, stocks, sales and cash in different media, making it difficult to consult information and track operations.

Such fragmentation can cause duplicate records, differences between physical stocks and declared sales, difficulty in rebuilding the origin of a movement and lack of clarity about each location's operations.

A single application is proposed that links registries without confusing different transactions: **a purchase does not imply reception**, **a sale does not amount to bank accreditation** y **an intention to collect does not amount to a confirmed sale**.

## 3. Objectives

### 3.1 General objective

Develop a multi-company business and operational management platform, accessible through a web interface and supported by an RESTful API, which allows the registration, consultation and traceability of key business processes.

### 3.2 Specific objectives

- Centralize the data of each company and its locations, without mixing information between businesses.
- Manage products, materials and services from a common catalogue.
- Register suppliers, purchases and receipt of merchandise with traceability.
- Maintain stocks consistent with inventory movements.
- Register sales with amounts and payments declared accurate.
- Manage expenses and cash days with verifiable historical records.
- Consolidate the authenticated backend already started and incorporate permission controls per company in each actual operation.
- Provide automated testing and sufficient documentation to verify the performance of the API.

## 4. Actors and stakeholders

| Actor/interested | Relationship to the system | Observation |
|---|---|---|
| Platform user | Access your personal space and may belong to one or more companies | Log, login and actual sessions available in API; frontend still DEMO |
| Founder or administrative holder | Create a company and manage its initial configuration | Ownership and future transfer require formal definition |
| Company Administrator | Manages information and operations according to permissions | Roles and final permits will be specified in E2 |
| Contributor | Only the authorised functions in the company are operated | Current frontend roles are demonstration |
| Sales manager or cashier | Record sales, expenses or days, according to authorization | It is an operational function; not necessarily an independent technical role |
| Supplier and Client | They are referenced in commercial transactions | They are not supposed to enter the platform |

**Distinction:** actors and permissions for the API should not be presented as security mechanisms already operating in DEMO.

## 5. Scope and implementation status

### 5.1 Features available on the DEMO frontend (AS-IS)

Multi-company interface; local personal profile; business data; locations; simulated equipment and invitations; catalog; local images; suppliers; purchases and receipt; inventory and counting; sales with divided payments; expenses; declared accounts; cash days; and visual DEMQ.

The operations have already been subjected to manual and automated frontend testing, but their storage remains local. There is no real log/login, server permissions, secure synchronization between devices or banking connection.

### 5.2 Objective scope of academic backend (TO-BE)

RESTful API in FastAPI, secure login and registration, authorization and resource isolation by company, SQLAlchemy persistence with database, error management, Docker, automated testing, GitHub Actions, documentation and deployment. The exact scope of endpoints will be set before implementation, maintaining **at least five high-level functional requirements** covered and verifiable.

**Proposed cutback for first API delivery (subject to approval):** authenticate users (RF-01); manage core businesses/memberships (RF-02); manage catalog (RF-04); register basic purchases and receptions (RF-05); control stocks and transfers (RF-06); and record sales with declared payments (RF-07). Locations (RF-03) is a support unit for purchases, inventory and sales: implement the minimum necessary on the server side. This selection contains more than five high level requirements, but **does not require the reproduction of all advanced functions on the backend of each screen**. Expenditure/box, financial accounts declared and QR DEMO (RF-08 to RF-10) are proposed as a second phase of integration, except for equipment review.

The delivery requires secure authentication even if the current application does not have login. None of the above services is considered implemented because its DEMO interface exists.

### 5.3 Deferred functions

Real fees through Market Payment, OAuth by seller, accreditation webhooks, bank reconciliation, real partial payment QR, stock reserves, refunds/reimbursements, batch production, advanced analytics and automatic importation of local history to the database. They are not compromised requirements for the current MVP unless later decided.

## 6. Functional requirements

**Convention of States:** ‘DEMO’ = local interface and policy implemented; ‘BACKEND PENDENT’ = missing endpoints, persistence and server validation. **The "Scope backend" column is a priority proposal, not an approved commitment or implementation status.**

- **MVP NUCLE:** must have use cases, real endpoints and tests for initial API delivery.
- **MVP SUPPORT:** minimum capacity needed for the kernel to work; its full implementation may differ.
- **POST-MVP:** exists on the frontend DEMO, but integration with the backend is proposed for a later phase.

| ID | High-level requirement | Expected behaviour | Current status | Proposed backend scope |
|---|---|---|---|---|
| **RF-01** | Manage users and authentication | Registration, login and secure access to authorized resources | React DEMO sin login; **Real API with log and sessions** | **MVP NUCLEO — Required per consignment** |
| **RF-02** | Managing companies and members | Create/Edit companies, invite/accept and manage equipment with permissions per tenant | React DEMO simulated; **RF-02 Basic implemented backend** | **MVP NUCLE** (membership and basic permits) |
| **RF-03** | Manage Locations | Create, edit, view and disable locations by differentiating sales and storage | **API E2-2 B/C: high, list/detail, editing, pause/reactivation and main; independent DEMO; pending subsequent trade controls** | **MVP SUPPORT** (high/low-level consultations and validations) |
| **RF-04** | Manage Catalog | Register and edit items, supplies and services with SKU, unit, price and status | **E2-3 B: Real four-way API and ORM; status management and pending React** | **MVP NUCLE** |
| **RF-05** | Managing suppliers and purchases | Register suppliers and purchases; receive goods explicitly and consult history | DEMO local | **MVP NUCLE** (basic and idempotent purchase/reception) |
| **RF-06** | Control inventory | Check stock by location, record transfers, countdowns and traceable adjustments | DEMO local | **MVP NUCLE** (stocks/transfers; full counts can be expanded) |
| **RF-07** | Record sales and reported payments | Register sales, discounts and one or more means of which the total amount matches the sale; discount physical stock where applicable | DEMO local | **MVP NUCLE** (transactional sales with declared payments) |
| **RF-08** | Manage expenses and cash | Register expenses; open and close days with arching and closure history | DEMO local | **POST-MVP** (second-phase backend) |
| **RF-09** | Administer declared financial accounts | Register banks and wallets as references for collections/payments; monitor active status and keep track of history | DEMO local | **POST-MVP** (second-phase backend) |
| **RF-10** | Managing intentions QR DEMO | Create, cancel and pass a simulated intention without treating it as actual collection | Local visual DEMO, no actual charge | **POST-MVP** (actual QR backend not required) |

**Scope warning:** RF-01 to RF-07 do not mean seven complete modules and no cutouts: minimum acceptable operations will be specified in use cases and API matrix before implementation. In particular, locations are a real inventory and reception dependency; they cannot be omitted without redefining those cases. RF-08 to RF-10 should not be declared implemented in the first delivery API.

### 6.1 Preliminary functional acceptance criteria

- **RF-01:** a non-authenticated person cannot access protected endpoints; passwords are not stored in plain text.
- **RF-02:** a user without permission for company B cannot consult or modify its resources even if it knows its identifiers.
- **RF-04:** the SKU is validated within each company; a service does not generate physical stock.
- **RF-05:** Registering a purchase does not increase stock; receiving it generates tickets once.
- **RF-06:** a negative stock transfer or output is not accepted; each movement is plotted. Validation must be transactional when performing the operation, not only visual in the client.
- **RF-07:** payments add up to exactly the total in cents; a valid sale generates stock outflows from **physical property** without duplicating them against retry. In a mixed sale the services do not generate inventory exits.
- **RF-08:** digital operations are not added to the expected cash; a shutdown saves a snapshot that is not retroactively recalculated.
- **RF-09:** a disabled account is not offered for new partnerships and remains identified in previous transactions.
- **RF-10:** an pending QR does not create sale; approving it again validates the availability of the item and is never interpreted as external accreditation.

These criteria are proposed for the future system and will become use case scenarios, contracts and tests. Not all of them constitute results already obtained in API.

## 7. Non-functional requirements

| ID | Requirement | Proposed verification criterion |
|---|---|---|
| **RNF-01** | Multi-company security and isolation | Secure registration/login, credentials protection and membership check and permissions for each business resource on the server. No ID provided by the client grants access alone. |
| **RNF-02** | Data integrity and ownership | Transactions for transactions that modify several entities, referential integrity and links between resources of the same company; without inconsistent partial states. |
| **RNF-03** | Persistence | Backend data stored in PostgreSQL through SQLAlchemy, independent of local browser storage |
| **RNF-04** | Interoperability | RESTful endpoints, JSON requests/responses, HTTP codes and explicit error management |
| **RNF-05** | Sustainability | Separate responsibilities between API, services, domain and data access; at least one valid useful pattern |
| **RNF-06** | Verifiable quality | At least 10 unit API tests and automated GitHub Actions execution |
| **RNF-07** | Deployment and reproducibility | Executable API in Docker, installation, configuration and display instructions published |
| **RNF-08** | Usability | Clear interface, validated forms and desktop- and mobile-adapted navigation |
| **RNF-09** | Traceability | Identifyers, states and historical references sufficient to explain operations and closures |

The additional quantitative targets of performance, availability and coverage will be defined if the chair or project requires measurement; metrics that have not yet been relieved are not claimed.

## 8. Main business rules

| ID | Rule |
|---|---|
| **RN-01** | Every business resource is associated with a company and its access is validated in backend by memberships and permissions. Global entities, as User, do not belong to a single company; a Membership links User and Company. The base must prevent cross-references by means of appropriate, direct or derived keys and restrictions. |
| **RN-02** | A registered purchase does not create stock until its confirmed receipt. |
| **RN-03** | Reception and sale should avoid duplicate movements by retry. |
| **RN-04** | Physical goods are controlled by item and location; services do not consume physical inventory. In mixed sales of goods and services, only physical lines generate inventory movements. |
| **RN-05** | The monetary amounts are accurately represented: whole cents (preferably `BIGINT` in perseverance, within approved limits) or `NUMERIC`/`Decimal` with a defined scale. Pydatic must validate format and range. **Do not use `Float` to store money**; define and test rounding rules. |
| **RN-06** | A sale may apply several means, but the sum of its amounts must be equal to the total. |
| **RN-07** | Only cash charges and expenses associated with one day change the expected cash of that day. |
| **RN-08** | A box closure retains its arching as a historical snapshot. |
| **RN-09** | Deactivating a declared account prevents new internal references; it does not close a real bank account. |
| **RN-10** | A pending or cancelled QR DEMO intent does not create sale or stock account. Simulated approval revalidates the transaction. |

## 9. Preliminary relationship with the RESTful API

To meet the academic standard, high-level requirements must be considered by real endpoints. **proposed, not implemented**:

| Requirement | Example of API resources/operations |
|---|---|
| RF-01 | `POST /auth/register`, `POST /auth/login` |
| RF-02 | `GET/POST /businesses`, `GET /businesses/{id}/members` |
| RF-03 (support) | `GET/POST /businesses/{id}/locations` (high/minimum consultations) |
| RF-04 | `GET/POST /businesses/{id}/items` |
| RF-05 | `GET/POST /businesses/{id}/purchases`, reception operation |
| RF-06 | `GET /businesses/{id}/inventory`, transfer operation |
| RF-07 | `GET/POST /businesses/{id}/sales` |
| RF-08 | `GET/POST /businesses/{id}/expenses`, cash operations |

The definitive design of methods, routes, HTTP states and schemas will be done in the document `05_MATRIZ_API_Y_TRAZABILIDAD.md`, after approving the use and domain model cases. **A frontend path as an API endpoint should not be counted.**

## 10. Restrictions and assumptions

- The work will be carried out within `plataforma-pyme/` without modifying the brotherly academic projects.
- The Frontend React/TypeScript will be retained as the visual basis of integration; the backend will exercise authority over the state and critical rules.
- DEMO data will not automatically migrate to PostgreSQL without a specific decision and procedure.
- The photos are now in IndexedDB and are only seen in the browser where they were loaded. For the initial API it is proposed to store as metadata an optional reference (`image_url`/`image_key`) or use a controlled static resource; the shared binary load and persistence may differ. If you decide to incorporate multi-user images, a persistent storage external to the ephemeral container and its permission policy should be defined. Base64 blobs will not be stored directly in inertia business data.
- The WALOS example company does not limit itself to other business.
- Detailed roles and permissions, as well as the exact scope of each endpoint, are subject to approval before implementing the API.

## 11. Traceability and subsequent documents

- **Document 02 — Cases of use:** specify actors, preconditions, main flow, alternatives and exceptions to selected RFs.
- **Documento 03 — Modelo de dominio y UML:** formalize entities, associations, cardinalities and invariants.
- **Document 04 — Architecture and Patterns:** explain the separation of responsibilities and the design pattern chosen.
- **Document 05 — API matrix and traceability:** RF → use case → endpoint → testing.
- **Document 06 — Testing and deployment:** will gather Docker, tests, IQ and real evidence of the deploy.

## 12. Aspects to be adopted before version 1.0

1. Adopt or adjust the proposal for a **MVP NUCLE** RF-01, RF-02, RF-04, RF-05, RF-06 and RF-07, with RF-03 as minimum support; this cut is provisional and should be verified against the time of the equipment.
2. Specify for each RF the minimum operations that will have real endpoints and tests (not necessarily the entire visual module), ensuring **at least five high-level requirements** covered.
3. Agree the actors, permissions and User-Company relationship to detail in cases of use.
4. Define whether the first backend will retain only an optional image reference or implement persistent binary load.
5. Set monetary contracts and quantity limits before the SQL model and Pydantic schemas.

**This document remains in draft form until its adoption.**

## 13. Implementation of RF monitoring and traceability E2

| RF | Verified code and evidence | Pending |
|---|---|---|
| RF-01 | `POST /api/v1/auth/register`, `login`, `GET /me`, `POST /logout`; Argon2id, persistent sessions and PostgreSQL tests | Public hardening, account recovery and React integration |
| RF-02 | Create/consult/edit company; issue/accept invitations; list/manage equipment — **195 local tests approved and functional IC 3/3**; `e213c4_acceptance (head)` | React connected, mail verification, transfer of ownership, historical audit and public hardening |
| RF-03–RF-07 | Planned rules, some DEMO behaviors | Endpoints reales, tablas, transacciones y tests de negocio |
| RF-08–RF-10 | Frontend DEMO or deferred designs | Unencumbered as the first MVP backend |

**Documentary policy:** Each large E2 delivery should review its RF and RNF, the use case, UML entities if they changed, architecture, Document 05 and evidence of evidence. `03B` is not regenerated by changes in identity permits; its conceptual work is retained. The E2-1.3C.1 permission matrix is testable policy code, **does not yet equal a role-protected endpoint**.

### 13.1 E2-1.3C.2 — requirement RF-02: profile editing with permission

Published `PATCH /api/v1/businesses/{business_id}`: allows for partial modification `name`, `category` y `activity_kind`. You cannot modify founder, status, title, role or membership. The actor is derived from the session Bearer, never from client fields. Execution blocks and re-checks identity, session, company and postgreSQL membership before writing; holder and administrator can edit. Maintainer and worker do not receive modification privileges. Non-member/active member company responds 404; role without permission, 403; suspended company with authorized role, 409; invalid body, empty or with prohibited fields, 422. Everything happens in a single transaction, with rollback before errors.

**State of evidence updated in C.5:** C.2 was validated with **125 local tests** and regressions C.3/C.4a/C.4b ended in **195/195**. PATCH did not require migration or change cardinalities. CU-12 circuit, pending when C.2 was closed, was subsequently implemented in C.3/C.4a/C.4b.

### 13.2 E2-1.3C.3 — RF-02: Directed invitation without automatic membership

Implemented `POST /api/v1/businesses/{business_id}/invitations`protected by Bearer and by permission `members.invite` on an active membership of the requested company. Allows to invite exclusively the operating roles **MANAGER** y **STAFF MEMBER**; does not assign administrator, ownership or permissions of another company. The recipient is identified by standard mail and does not need a prior account to **issue** the invitation. The issue **does not create, activate or transfer any membership**: authenticated acceptance corresponds to C.4.

Random opaque token is delivered **one time in response 201** and only your SHA-256 hash is saved. It expires at seven days. The base contains a partial UNIQUE restriction that prevents two invitations `PENDIENTE` to the same standard mail within the same company. The service marks `EXPIRADA` a pending due before allowing a new one; there is no automatic expiration task. A duplicate application while the former is in effect responds 409. Confirmation occurs in a transaction along with verification of identity, membership, permits and company.

**Historical record of C.3:** acceptance and administration of members were pending when issuing invitations, but **were subsequently implemented and validated in C.4a/C.4b**. The list/cancellation/resending of invitations, mail/QR, account generation and React interface remain outside E2-1.

### 13.3 C.4a — Acceptance of an invitation as authenticated identity

The recipient can accept only an invitation whose standard mail matches that of his or her authenticated global account. `POST /api/v1/invitations/accept`; API uses only `Authorization: Bearer` to obtain identity (does not accept `user_id`, role or company sent by the client). Checked by SHA-256 hash in PostgreSQL, status `PENDIENTE`, current maturity and company `ACTIVA`. The transaction creates a single membership or reactivates the previous one `INACTIVA` without duplicating `(business_id,user_id)`; new membership uses the role of `ENCARGADO` o `TRABAJADOR` that fixed the invitation, never title or global privileges. The invitation passes to `ACEPTADA` and records `accepted_by_user_id` y `accepted_at` Repeating acceptance does not produce effects.

**Current limitations:** There is no React interface connected, emailing, listing/cancellation/re forwarding of invitations or verification of ownership of email. **Equipment management and operational role changes are available from C.4b.** Safe delivery of token, rate limiting and auth hardening is required for production. C.4a was validated with 171 tests and C.4b with 195.

### 13.4 C.4b — RF-02: consult and manage team memberships

They're incorporated. `GET /api/v1/businesses/{business_id}/memberships` y `PATCH /api/v1/businesses/{business_id}/memberships/{membership_id}`. The first allows the administrative holder and administrator to consult **only your company’s equipment** (active and inactive members) with id, user, email, visible name, role, status and existing job. It does not display password, phones or tokens. Maintainer/worker cannot access that directory. The second operation is reserved for the **Active administrative holder** and changes, partially, `role` between `ADMINISTRADOR/ENCARGADO/TRABAJADOR` o `status` between `ACTIVA/INACTIVA`. Does not admit the change of `user_id`, company or ownership.

The current membership of the incumbent is protected as well as any historical membership with a role `TITULAR_ADMINISTRATIVO`: neither deactivation, degradation nor transfer are implemented here. Modifications are authorized with the current role **consulted in PostgreSQL within the transaction** and lock down company, actor member and objective membership. A suspended company does not support sensitive directory reading or mutations; the informative reading of the business profile remains available.

**State C.5:** C.4b validated on Windows with **195/195 tests**, Functional CI 3/3, `e213c4_acceptance (head)` No additional migration and healthy Docker. Documentation updated and UML 03A unchanged 03B; transfer of title and advanced post management are still pending.

## 14. C.5 — Closure of verifiable requirements

**RF-01:** log, login, `/me` y logout con sesiones PostgreSQL. **RF-02:** creation/listing/reading/editing of companies, issuing and accepting invitations, consultation of memberships and updating of role/state by holder; RBAC permits and verified tenant isolation. **No** is equivalent to all future processes of management, assignment of title or React integration.

**Evidencia local 08/11/2026:** `195 passed in 23.86s`, Alembic `e213c4_acceptance (head)` y `alembic check` no operations, API containers and base `healthy`, `/ready` IC 3/3 corresponds to the code `8cd1674`, not a new C.5 IC. The RF-03–RF-07 still lacks endpoints backend. First the separate E2-1 revision is prepared and then RF-03 starts.

## 15. E2-2 A — Location persistence (partial implementation RF-03)

**E2-2 A — Persistence of Locations (08/11/2026):** Published `Location`/`locations` with FK required `business_id → businesses.id` (`RESTRICT`), six types, `can_sell`/`can_store` independent, optional reference fields, `ACTIVA/PAUSADA`, `is_primary`, partial index that allows at most a main active per tenant and CHECK that prevents main paused. Additive migration `20261108_0008_business_locations.py` (`e22a_locations`, descendant of `e213c4_acceptance`) The company continues to start **no locations**. **No HTTP Location Routes yet**, no inventory/purchase/connected sale, no location permits; these changes belong to E2-2 B/C and subsequent blocks. The IC of the cut code was verified in `300fa6f` (GitHub Actions run 42491816481): result `success`. Local Windows validation of the new cut is still required; the previous 195 tests corresponded to E2-1.

**Decisions in force:** names from 2 to 80 characters; types `LOCAL/FERIA/DEPOSITO/OFICINA/CASA/OTRO`; `address` (hasta 160) y `map_url` (up to 2048) saved as optional texts represented with empty string; mandatory boolean capabilities **without demanding that any be true** (an administrative office may not sell or save).The main location is optional (zero or active) and cannot be in status `PAUSADA`; the future service will manage the transition of principal transactionally. No single name is imposed within the tenant because the current contract does not require it. Link validation, RBAC and pause rules with stock pending correspond to later stages. **RF-03 is not declared completed.**


### E2-2 A.1 — New CASA type (08/11/2026)

He's in. `CASA` as sixth type of location, without changing the independent capacity contract `can_sell` y `can_store`, nor states `ACTIVA`/`PAUSADA`. A house can sell, store, both or none of these activities (administrative address). **No address or location is created automatically** and no commercial empowerment is assumed. `e22b_location_casa`, descendant of `e22a_locations`expand `ck_locations_kind` without rewriting the previous migration or altering existing rows; it prevents its reversal while there are CASA rows. DEMO React supports CASA in the selector and local storage validation/reading, but remains separate from API. IC from code `b50bf200`: **backend 217/217 pruebas, Alembic sin deriva y Docker 3/3** (run backend); **frontend 2/2 including E2E desktop and mobile** (run frontend). Previous Windows result of E2-2 A: 212 tests; **local validation of A.1 pending**HTTP CRUD and location permissions remain for E2-2 B/C. E2/1/03B/03C are not altered.

## 16. E2-2 B — Authenticated locational discharge and query (RF-03 partial)

**State E2-2 B (08/11/2026):** Three real routes were published for low locations `/api/v1/businesses/{business_id}/locations` (`POST` 201, `GET` ready 200, `GET /{location_id}` 200). The creation valid DTO without protected fields, revalidates identity/session, blocks the company and membership of the actor, demands tenant `ACTIVA` y rol `TITULAR_ADMINISTRATIVO` o `ADMINISTRADOR`, and confirms a single transaction. A first location receives `is_primary=true`; the subsequent ones do not replace it. Active members of any recognized role can consult their own locations, even with suspended company; a suspended company does not allow to create. A third party or inactive membership returns 404; role without permission 403; invalid session 401; company suspended when creating 409; incorrect body 422. `CASA` and Google Maps HTTPS validated are included. **There is no PATCH/DELETE, no pause/reactivation, change of principal, individual staff assignment or commercial consumption of locations yet.** DEMO remains independent. Backend without new migration from `e22b_location_casa`.

**Evidence of IC:** commit funcional `bdd2c84653dafb976c8cd6b49d8c2d577cc345de`; GitHub Actions E2-2 B **3/3** (Python 3.12 y 3.14 con PostgreSQL, Docker), **277 approved tests**, `e22b_location_casa (head)` and Alembic without drift. The local Windows output provided previously for **E2-2 A.1** fue **217 passed in 23.90s**. Posteriormente E2-2 B **was validated in Windows with `277 passed in 31.22s`**, Alembic without drift and healthy Docker; E2-2 C adds new tests to be verified locally. The peer review of E2-1 remains anchored in the commit delivered.

## 17. E2-2 C — Safe location management (RF-03)

**E2-2 C (08/11/2026) — actual location operations:** `PATCH /api/v1/businesses/{business_id}/locations/{location_id}` allows editing only `name`, `kind`, `address`, `map_url`, `can_sell` y `can_store` (optional fields in the body, but rejected `null`, empty bodies, invalid values and protected fields). `PATCH /{location_id}/status` receive only `ACTIVA` o `PAUSADA`: pause revoke `is_primary` in the same transaction and reactivate **no** recovers location ownership automatically. `PUT /{location_id}/primary` designates a location `ACTIVA`, unmarks the previous one and marks the one chosen within the **and a single transaction**, serialized by company lock and protected with the SQL index `uq_locations_one_active_primary`. The operation on an already main location does not make any additional changes. Owner/Manager with Active Membership can manage; maintainer/worker only consult. `SUSPENDIDA` read but no change; other/non-existent resource 404, role without permission 403, invalid session 401, incompatible status 409 and invalid body 422. DELETE was not enabled nor new tables were created.

**Evidence:** functional code `7abafd8208965cd99b0116e02ffc5240d23f218f`, GitHub Actions E2-2 C **3/3 successful**, 325/225 Python 3.12 and 3.14 tests with PostgreSQL, Alembic `e22b_location_casa (head)` no drift and correct Docker. Windows had previously validated E2-2 B (`277 passed in 31.22s`, `/ready` = `ready`/`ok`). **The 325 tests must still be played on Windows to close locally E2-2 C.** React/API integration, individual assignment of members to locations, inventory control when removing `can_store`, receptions/sales and operating fund management are future works; they are not attributed to this increase. E2-1 and UML 03B/03C were not modified.

## 18. E2-2 D — RF-03: allocations and permits by location

**E2-2 D (08/11/2026) — implemented, pending local validation:** tabla `location_assignments` con clave triple `(business_id,location_id,user_id)`; Composite FK `(business_id,user_id)` a `memberships` y `(business_id,location_id)` a `locations` to prevent company crossings even in direct SQL. Additive migration `e22d_assignments`, unchanged migrations of E2-1; UNIQUE auxiliary `(business_id,id)` en `locations`Allocations `ACTIVA`/`REVOCADA` con `revoked_at` coherent (CHECK). GET of mapping collection and PUT status of a headquarters membership, only per owner/manager of the company; activating assignments is limited to ENTRY/TRAWER. Revealing preserves row and can be done with paused or inactive seat; activating requires both assets. Suspended company allows query but prevents deeds. Pure function `can_operate_at_location` requires active location and company, active membership, capacity `SELL`/`STORE` relevant and, for managers/workers, active assignment. **Not yet invoked from inventory, purchases or sales**It doesn't change business membership, it doesn't connect React and it doesn't create fictitious locations.



**Evidence:** final code `3cd7bce71d951218e8c77da58d147e78fb0d426e` and IC E2-2 D 3/3 approved, **371 tests** en Python 3.12/3.14, `e22d_assignments (head)` The last local result provided is E2-2 C, **325 passed in 36.91s**. **Migration and 371 E2-2 D tests still require local Windows execution before closing the block and preparing the audit sheet.**

## 19. E2-3 A — Catalogue: actual RF-04 persistence (partial)

**Cut E2-3 A (08/11/2026), partial persistence of RF-04/CU-05:** clase SQLAlchemy `CatalogItem` y tabla `catalog_items` con `business_id` Compulsory, FK to Company (`RESTRICT`) y par UNIQUE `(business_id,id)` for future commercial FK of the same tenant. Four kinds of tab according to DEMO: `ELABORADO`, `REVENTA`, `INSUMO` (physical property) and `SERVICIO` (conceptually a service). `SERVICIO`; physical property prohibits it. `UNIDAD`, `GRAMO`, `KILOGRAMO`, `MILILITRO`, `LITRO`, `PAQUETE`, `CAJA`. Name, standardized key is stored `name_key`, category, optional SKU, description, internal observations, status `ACTIVO`/`INACTIVO`, condition `sellable`, `price_cents` y `reference_cost_cents` optional. Whole amounts BIGINT between 0 and 99,999,999.999 cents, without Float. Two independent restrictions prevent repeat `name_key` and SKU not null **within the company**, also in inactive chips; different tenants can reuse them. In E2-3 B the service must calculate `name_key` canonically (NFKC, collapsed spaces, capital equivalence) and normalize SKU to uppercase **before inserting/editing**: SQL imposes the uniqueness of saved keys and SKU format, but does not derive `name_key` Create tab does not create location, stock, purchases, sales or movements.

**Evidence:** code/test cut `79c2071f4e5192be95d75c78d5b1e9a75492a645`; GitHub Actions E2-3 A **3/3**, **407 approved tests** en Python 3.12 y Python 3.14 con PostgreSQL 16, Docker liveness aprobado y `e23a_catalog (head)` no pending changes from Alembic. **Local Windows Validation Pending for E2-3 A**; the above 371 tests correspond to the closure of E2-2. **No HTTP Catalog paths** in this cut; CRUD, catalog RBAC, SKU/name standardization of entry and protection of business stories will be implemented in E2-3 B/C/D. No React API integration or independent review of E2-3 yet. No change to E2-1 or E2-2 or DEMO frontend.

## 20. E2-3 B — Catalogue API (RF-04 partial)

**E2-3 B — Real Catalogue API (RF-04/CU-05, 08/11/2026):** four low routes `/api/v1/businesses/{business_id}/catalog`: `POST /catalog` (201 high), `GET /catalog` (200 list with `offset>=0`, `1<=limit<=500`; default `limit=100`), `GET /catalog/{item_id}` (200 detalle) y `PATCH /catalog/{item_id}` (200 part edition). Each operation requires valid Bearer, session revalidation, user and membership of the requested company. Owner/manager can read and write; maintainer/worker with active membership only read; company SUSPENDED read only; enterprise or article other/non-existent 404. The server normalizes Unicode NFKC names, collapses spaces and generates `name_key` con `casefold`; normalizes SKU to ASCII capital letters and converts empty SKU into NULL. PostgreSQL retains the uniqueness per company of `name_key`/SKU even with INACTIVE tabs, and the API translates that collision to 409. Invalid data or protected fields (id, tenant, status, derivative key) receive 422. SERVICE type requires SERVICE unit; no other classification can use it. They are valid `price_cents` y `reference_cost_cents` NULL or integers from 0 to 99.999.999.999. The PATCH allows you to remove SKU/price/cost with NULL, but do not edit status. `status` and timestamps SQL. Creation does not create location, stock balance, purchases, sales or movements.

**Explicit limits:** E2-3 B not yet exposed `PATCH /status` No integration of frontend React with this API; no reception, sales, commercial snapshots or history unit editing protection are implemented as these modules are later. New tests check permissions, duplicate rollbacks, SKU/standard names, multi-company isolation, suspended reading and fault 401/403/404/409/422. **Evidence CI E2-3 B:** GitHub Actions 42506409757 finished **3/3 successful jobs**, **498 approved tests** both in Python 3.12 (53.96s) and Python 3.14 (50.12s), PostgreSQL 16, `e23a_catalog (head)` y `alembic check` No operations, Docker/liveness image approved. Validated functional code: `35ff901855397c024cee50fa590c6c05a7f04cfe`. Previous IQ `42506050141` had detected two HTTP mapping failures in PATCH with incompatible type/unit; they were corrected and both cases are now happening. **Local Windows validation of E2-3 B is still pending**; the last confirmed local result is 407/407 of E2-3 A.

## 22. E2-3 C — Article status management (RF-04)

**E2-3 C (08/11/2026):** implemented `PATCH /api/v1/businesses/{business_id}/catalog/{item_id}/status` with exclusive body `{"status":"ACTIVO"}` o `{"status":"INACTIVO"}`, strict validation and rejection of extra attributes (422). The path revalidates session and membership and requires an ACTIVA company owner/manager to write (401/403/404/409 as the case may be).The article is blocked inside the tenant and changed status in a single transaction.The repeated change is idepotent, without altering `updated_at`. The inactive article remains visible on GET/listed, with UUID, name and SKU reserved even for duplicate highs; there is no DELETE or fictitious stock. Generic PATCH maintains `status` This functionality also does not modify the independent field `sellable`.

**Units:** future purchases/sales must prohibit new movements with INACTIVE chips and keep real historical snapshots. There are still no commercial operations or integrated frontend; therefore, there is no real restriction on unit change for previous transactions either. No new migration: CHECK reused `ACTIVO/INACTIVO` de `e23a_catalog`.

**Tests:** CI E2-3 C **3/3 work adopted**, **527 passed** in Python 3.12 and 3.14 with PostgreSQL, `e23a_catalog (head)`, `alembic check` no operations and correct Docker; code `c2153ab9b65b265eb46b3081079e0f3f15002215`. E2-3 B: **498 passed en Windows (55.79s)**, Docker/API/DB saludables. **E2-3 C: Windows pending**. The subsequent documentary committ is not equivalent to another IC execution.

## 23. E2-3 D — Catalog validation regression (RF-04)

**E2-3 D (08/11/2026):** the existing Catalogue was strengthened, **without adding tables or migrations**. New tests verify Unicode NFKC+ equivalences `casefold` in names, SKU NFKC and ASCII capitals, rejection of invalid controls and forms, overflowing `name_key` per Unicode expansion, strict integer amounts (no booleans or decimals), differentiation between `PATCH` field and with `null` Explicit, incompatibility SERVICE/physical unit, protected fields of `/status`, name/SKU collisions even in INACTIVE chips, independence between two companies of the same user, session recovery after 409, and rollback provoked after `flush` both in high and in edition. A ceiling was added to `offset` catalogue (`9_223_372_036_854_775_807`, BIGINT PostgreSQL): exceed it produces 422 before running SQL, maintaining `limit` de 1 a 500 y `offset` The five Catalog endpoints retain their contracts and business permits; no stock is created.

**Scope and limits:** NICK `(business_id,name_key)` y `(business_id,sku)` and existing transactions/blocks protect against collisions; tests exercise actual duplicates and recoveries in PostgreSQL, **but are not simultaneous load/concurrence testing with multiple independent connections**. The latter is registered as future verification before production. There are not yet purchases, sales, movements or snapshots, so you cannot check a unit/state change rule with real business history. `sellable` does not replace `status`. Do not connect frontend DEMO or E2-1/E2-2 for this cut.

**IC evidence of code D:** commit `bf4fd3fa809c9f4e6afdeb064a155acf233b1722`, GitHub Actions run 42508771222: **3/3 work adopted**, **580 passed** en Python 3.12 y Python 3.14 con PostgreSQL, Docker build/liveness aprobado, `e23a_catalog (head)` y `alembic check` No difference. **Local Validation Windows E2-3 C:** 527 passed in 59.60s, healthy containers and `/ready` Right. **Local Validation Windows E2-3 D:** Do not confuse remote IC with tests performed on the author's computer.

## E2-3 E — RF-04: model, tests and bounds reconciled

**E2-3 E (08/11/2026) — functional closure:** E2-3 A/B/C/D implemented `CatalogItem`/`catalog_items`, migration `e23a_catalog`, five REST operations (GET/POST collection, GET/PATCH detail, PATCH status), permissions for tenant and role, canonical name and SKU unique within the company, four classes ELABORATED/REVENT/INSUMO/SERVICE, type GOOD/SERVICE derivative without duplicate column, optional amounts in cents and reversible deactivation without erasing chips or releasing keys. No stock is created when registering an item. **PlantUML 03A v0.7 source and its editorial SVG have already been reconciled** with the actual Catalogue; `Proveedor` Go on, TO-BE.

**Windows D checked by the developer:** 580 passed in 66.45 s, `e23a_catalog (head)`, `No new upgrade operations detected.`, API y PostgreSQL Docker `healthy`, `/ready` → `ready/ok`. **CI D:** run 42508771222, SHA `bf4fd3fa809c9f4e6afdeb064a155acf233b1722`, 580 Python tests 3.12 and 3.14, 3/3 jobs approved. Subsequent changes only of UML/documents do not constitute new IC execution.

**Explicit pending:** no double-high test was performed at the same time with two independent connections and no sustained load. There are still no purchases, stock, sales, commercial snapshots or use of SELL/STORE permissions in real operations. The rules on type/unit changes with business history should be applied when these modules exist. React continues DEMO without HTTP integration. E2-1/E2-2 and diagrams 03B/03C remain out of reach. The block is prepared for **independent audit** and is not declared audited or ready for production.
