# 02 — Specification of use cases

**Current version of query:** T12-B / E2-7, 11/11/2026 · **Base:** `main` `c6a77137cf82dcb9aad225645e84b1265b1da3ec`.  
**Status:** 12 cases of nuclear use with implemented API and evidence of integration. **The descriptive flows of the old versions are preserved below as history**; when a TO-BE detail diverges from the code, the current table and the [path matrix of Document 05](05_MATRIZ_API_Y_TRAZABILIDAD.md).

## Current state T12-B — CU-01 to CU-12 after REAL integration

**Real actors:** visitor; global user authenticated; administrative holder; administrator; manager or worker with active membership and effective permits; guest with global account whose mail matches the invitation. **no** are deduced from visible controls in React: FastAPI confirms them by tenant, role, status and, where applicable, headquarters assignments. **no** are platform users for the sole reason that they appear in an operation.

**Routes:** all APIs in the array are prefixed `/api/v1`; `B` represents `/api/v1/businesses/{business_id}` y `E` represents `/real/empresas/{business_id}`. React REAL screens do not use the `demoStore` as a source of truth.

### CU catalogue with observable postconditions

| CU / RF | Objective of the actor | REAL API representative | REAL Screen | Postcondition, evidence and boundaries |
|---|---|---|---|---|
| **CU-01 / RF-01** | Sign up | `POST /api/v1/auth/register` | `/real/registro` | Identity created; `auth-registration-ui.spec.ts` and registration tests. It does not involve verified mail |
| **CU-02 / RF-01** | Start/Close Session and Consult Identity | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` | `/real/login`, `/real/perfil` | The session is opaque or revoked; `auth-registration-ui.spec.ts`, `security-navigation.spec.ts`. Token only in memory and F5 demands re-entry |
| **CU-03 / RF-02** | Create and manage a company | `POST/GET /businesses`, `GET/PATCH B` | `/real/empresas`, `/real/empresas/nueva`, `E` | Company + initial holder, isolation and authorised edition; `security-navigation.spec.ts` and backend of companies. The idempotency key avoids two highs with the same request |
| **CU-04 / RF-03** | Create and manage location | `POST/GET B/locations`, `PATCH B/locations/{location_id}`, `PATCH .../status`, `PUT .../primary`, `GET .../my-assignments` | `E/ubicaciones` | Persisting Headquarters, Pause/Reactivation/Main and SELL/STORE permissions; `business-crud-persistence.spec.ts`, `assigned-location-visibility.spec.ts`; an assignment is not permission for all locations |
| **CU-05 / RF-04** | Create, edit and disable article or service | `POST/GET B/catalog`, `GET/PATCH B/catalog/{item_id}`, `PATCH .../status` | `E/catalogo` | SKU/name per company, active/inactive tab and optional price; `business-crud-persistence.spec.ts`; crear ficha **no** generates stock |
| **CU-06 / RF-05** | Register purchase | `POST/GET B/purchases`, `GET B/purchases/{purchase_id}` | `E/compras` | Purchase and persistent snapshots; may contain either physical, service or free concept; **no** increase stock before CU-07. `purchase-ui-persistence.spec.ts` |
| **CU-07 / RF-05+RF-06** | Confirm full reception | `POST B/purchases/{purchase_id}/receive`, `GET .../receipt` | `E/compras` | Physical entry by receptionable line, single transaction and voucher; idempotent replay without second income. `flow-purchase-to-sale.spec.ts`, `purchase-ui-persistence.spec.ts`; partial reception/multi-destiny **no** es MVP |
| **CU-08 / RF-06** | Check balances and movements | `GET B/inventory/balances`, `GET B/inventory/movements` | `E/inventario` | Balances by registered server header/article, version and ledger; `inventory.spec.ts`. General reading includes company headquarters; **is the decision of the MVP**Not right to operate there. |
| **CU-09 / RF-06** | Transfer stock between headquarters | `POST B/inventory/transfers`, `GET .../transfers/{transfer_id}` | `E/inventario`, Panel Transfer | Two movements in one operation, output −/entry +, zero net sum and no negative stock; `inventory.spec.ts`, `assigned-location-visibility.spec.ts`It requires STORE. **at both headquarters**; asynchronous logistics reception between workers is delayed |
| **CU-10 / RF-07** | Register sale with declared payments | `POST/GET B/sales`, `GET B/sales/{sale_id}`, `GET B/sales/by-request/{request_id}` | `E/pos`, `E/ventas` | Sales of goods and services, authorized discount/price, exact sum of payments, voucher and replay insurance. `pos-draft.spec.ts`, `flow-purchase-to-sale.spec.ts`, `sales-invalid-payment-policy.spec.ts`. **No bank payments credit**; local POS writing disabled unless explicitly activated |
| **CU-11 / RF-06** | Register initial stock or justified adjustment | `POST B/inventory/adjustments`, `GET .../adjustments/{adjustment_id}` | `E/inventario`, Settings/Counter panel | Version `expected_version` and reason, signed movements, 409 before obsolete version and without negative balance; `inventory.spec.ts`. Initial stock limited to administrators and pair of headquarters/article without history |
| **CU-12 / RF-02** | Invite, accept and manage collaboration | `POST B/invitations`, `POST /api/v1/invitations/accept`, `GET/PATCH B/memberships...`, `GET/PUT B/locations/{location_id}/assignments...` | `E/equipo`, `/real/invitaciones/aceptar` | Nominative invitation **no** grants membership when issuing; authenticated acceptance creates/reactive recipient membership and proposed role; holder manages non-titled roles. `test_business_acceptance_*.py`, `test_business_team_*.py` and manual validation of assignments. No automatic sending of public mail/QR |

**All routes abbreviated `/auth`, `/businesses` y `/invitations` in this table are understood under `/api/v1`; `B` already includes this prefix.** The comprehensive inventory of methods and URLs is found in Document 05; the fields and responses are governed by the schemas actually mounted on `backend/app/modules/*`Not old drafts.

### Current transactional and alternative flows

**Purchase → reception → inventory → sale.** The operator records a purchase and the consultation with its lines; it is not allowed to assume that it is received or increase stock from React. An authorized operator of the STORE headquarters confirms the complete receipt, which generates a movement for physical good. Free services and concepts do not originate physical entries. A subsequent sale of goods requires approved SELL headquarters, sufficient stock and payment charge declared exactly equal to the total; a service sale does not discount stocks. REAL voucher is recovered by ID and by `request_id`.

**Transfer and counting.** The transfer confirms the atomic debit/credit between two STORE headquarters; the worker assigned only to one headquarters **no** can move to another. The versioned settings reject a `expected_version` obsolete; a zero balance with history does not allow doubling initial load. The inventory query per company may include unallocated locations of the worker, but that query **no** He allows you to mutate them.

**Alternatives and errors for any CU that admits them:** `401` token/seat absent or revoked; `403` insufficient role or permission; `404` a non-visible, non-existent or other tenant remedy; `409` conflict of business, idempotency, version or inventory; `422` invalid application; `5xx`/loss of response is **uncertain result**, not "confirmed refusal". For commands with durable identity, recover first and never duplicate with another key for a lost response. `GET` historical are not forwarding instructions `POST`.

### Out of reach of these CU REAL

RF-08 expenses/box, RF-09 financial accounts and RF-10 QR are **DEMO/DIFFERENT**. DEMO controls do not generate write in the REAL API, verified by `demo-money-isolation.spec.ts`. No accreditation of Pago Market, webhooks, inventory reserves, effectively reconciled payments, prescription manufacturing and two-stroke logistics reception were implemented.

### Evidence and level of guarantee

- [Audit T11 final](../docs/E2-7_T11_E_AUDITORIA_FINAL_PREMERGE.md): **26/26 E27 scenarios covered in functional scope/smoke**, no full WCAG accessibility statement.
- Playwright + PostgreSQL CI final: **892 Pytest, 38 REAL y 6 DEMO PASS** (base to be discarded).
- [Guided manual test, 39 steps](../docs/E2-7_T11_D2_ACTA_PRUEBA_MANUAL_REAL.md): two defects of corrected and retested headquarters permits; catches observed in conversation, not incorporated as Git attachments.

---

## Historical Archive of Pre-Specifications and Cuts (Conserved)

The specification below contains **proposed flows when RF-03–RF-07 were still being built** and incremental appendices E2-1/E2-3. Maintained to assess design evolution; old expressions ‘backend pending’, ‘future’ or ‘TO-BE’ **do not contradict or replace** the previous REAL T12-B status.


**Project:** Orbit — Multi-company and multi-strike management platform  
**Materia:** Programming 2  
**Version:** 1.8 — E2-3 E, real catalogue and 580 Windows tests
**Status:** **REVISED FOR DELIVERY — TO-BE specification, with E2 decisions still open**  
**Date:** 8 November 2026  
**Reference document:** `01_ANALISIS_DE_REQUERIMIENTOS.md` (v0.8)  
**Scope:** cases of use of **proposed core** The final list of permissions, fields and HTTP codes will be formalized later. This revision incorporates CU-12 as support for real memberships, without extending the scope to mail or public access by QR.

> **Closing E2-1 / C.5 — 08/11/2026:** C.1 (98), C.2 (125), C.3 (147), C.4a (171) y **C.4b (195/195 approved local tests; `195 passed in 23.86s`)**. Alembic `e213c4_acceptance (head)`, `No new upgrade operations detected.`; Docker FastAPI/PostgreSQL `healthy` y `/ready` = `ready`/`ok`. GitHub Actions **3/3** corresponde al commit funcional `8cd1674`. C.5 es **documentary only**; no re-execution of evidence or change of endpoints, SQL models or migrations. React follows DEMO; RF-03–RF-07 has no backend; title transfer, mail verification and hardening for production remain pending.

> **State in force E2-2 (08/11/2026):** RF-03/CU-04 and E2-2 A/A.1/B/C/D implemented, with locations, partner assignments, tenant authorization and reusable operational policy. **371/371 tests on Windows (47.57s)**; `e22d_assignments (head)`; Alembic without pending operations; Docker FastAPI/PostgreSQL `healthy` y `/ready` = `ready/ok`. IC code E2-2 D: 3/3 and 371 tests in Python 3.12 and 3.14. **No** React–API integration and commercial purchases/stock/sales transactions that consume the policy are still in place; they correspond to later blocks. The previous cut-off paragraphs that mention validations or "pending" functions are retained as **history**, not as current state. The integral TP is not declared finished.


## 1. Purpose and methodology

This document describes **what objectives the actors are pursuing**, how the platform responds and what should happen to invalid data, repeated operations or lack of permissions. It does not describe screens, specific buttons, SQL tables or FastAPI implementation.

Un **functional requirement** express a system capacity (e.g. RF-07: recording sales). **use case** specifies an observable objective of the actor (e.g. CU-10: registering a sale with declared payments). **user history** is a brief formulation of need and benefit; it does not replace the flows and exceptions needed to evaluate this API.

The authentication and authorization flows described herein are **backend target**; they are not available as effective security in the local DEMO. The Business Scenarios of Catalogue, Purchase, Inventory and Sales use rules present on the frontend, but must be validated again on the server.

### 1.1 Conventions

- **Main flow:** successful and usual sequence.
- **Alternative:** another valid way to complete the operation.
- **Exception:** This situation prevents completion and produces a controlled response.
- **Postcondition:** observable state to be maintained when the operation is completed.
- **Idempotency:** the same repeated request with the same key does not produce a second commercial effect.
- **Declared account/payment:** internal reference; does not imply external banking movement or accreditation.
- **Tenant:** The user may belong to several companies, but each request must validate their access to the specific company.
- **Currency:** the amounts of this API are agreed and validated in **ARS whole cents** (e.g. ARS 10.50 = `1050` cents), or are converted without loss from a textual decimal in the input limit. No floating point numbers are used to store money. Physical quantities are represented according to the approved unit scale.
- **Atomity:** business validations that depend on changing data (stock available, active status and pending receipt) are executed with the transactional control necessary to ensure that verification and writing do not result in incompatible decisions.
- **Error response:** the future API will issue structured errors without internal traces. **Problem Details, RFC 9457** (updating RFC 7807), HTTP codes and `type`, `title`, `status`, `detail` e `instance` as appropriate; the final contract is defined in Document 05.
- **Status implemented:** The CU-01, CU-02 and CU-03 streams already have partial or complete endpoints supported by SQL tests; the remaining CUs remain TO-BE. Specific technical evidence is contained in Document 05.
- **Persisting data:** each successful operation confirms all or none of its scripts; relevant results retain identifiers, company, actor, date/time and source references. The exact field details will be defined in Document 03 and Document 05.
- **Reintense:** The Commission has also decided to establish a single system for the protection of the environment, which is based on the principle that the Community's energy policy should be based on the principles of the internal market. **same transaction** the commercial effect or an equivalent guarantee is implemented. The expiration/retention of keys remains for contracts.
- **Stock Concurrence:** If the stock is a projection of movements, it is not enough to block historical rows of the ledger. The backend should serialize operations on the **same company–location–article pair** By means of locking balance, conditional update, serialised isolation with controlled retry or other strategy tested in PostgreSQL. Operations on several balances must maintain a stable order of lock. The leadger remains the auditable source of movements.
- **Errors and permissions:** the validation of the client is guidance; any reading/writing of the business validates authentication, current membership and permissions on server. To avoid disclosure of information, a third party resource may respond as non-existent according to the contract. A business error must not create partial records.

## 2. Actors

| Actor | Description | Role in the CUs |
|---|---|---|
| Visitor | Person without authenticated session | Sign in and sign in |
| Authenticated user | Individual with a separate identity, global to companies | Create a company and access to licensed companies |
| Administrative holder/administrator | Member with configuration and management powers, according to future permissions | High number of locations, items and invitations |
| Authorized Contributor | Member who executes operations according to his permissions in the company | Check inventory, receive, transfer, sell |
| Guest user | Global identity to be addressed by an enterprise invitation; not automatically member | Accepting Authorized Invitation (CU-12) |


**UML system boundary:** the API and the platform constitute the **under study system**So **are not represented as actors** In the diagram of use cases. Yes, they can appear as internal participants in a sequence diagram. The actors interact from outside with the system to achieve their objectives.

**Role note:** For E2 a minimum permission model is proposed. It is not presumed that any collaborator can execute all operations; the exact matrix will be approved before implementing authentication/authorization. Customers and suppliers are reference commercial entities, not actors who should log in in in this scope.

## 3. Catalogue of use and traceability cases

| ID | Use case | Related RF | Lead actors | First API Priority |
|---|---|---|---|---|
| CU-01 | Register user account | RF-01 | Visitor | MVP core |
| CU-02 | Sign in | RF-01 | Visitor | MVP core |
| CU-03 | Create a company | RF-02 | Authenticated user | MVP core |
| CU-04 | Register a location | RF-03 | Authorized Administrator | MVP support |
| CU-05 | Register an article or service | RF-04 | Authorized Administrator | MVP core |
| CU-06 | Register a purchase | RF-05 | Authorized operator | MVP core |
| CU-07 | Confirm receipt of a purchase | RF-05, RF-06 | Authorized operator | MVP core |
| CU-08 | Check inventory by location | RF-06 | Authorized Member | MVP core |
| CU-09 | Transfer stocks between locations | RF-06 | Authorized operator | MVP core |
| CU-10 | Register a sale with declared payments | RF-07 | Authorized sales operator | MVP core |
| CU-11 | Register justified inventory adjustment | RF-06 | Authorized inventory operator | MVP core (basic adjustment; multiple count deferred) |
| CU-12 | Invite and accept incorporation of a collaborator | RF-02 | Administrator and guest user | Proposed membership support; confirm for first API |

**Important:** the twelve CUs represent **six main functional requirements** (RF-01, RF-02, RF-04, RF-05, RF-06, RF-07) and a RF-03 unit; they do not mean ten complete modules or ten independent requirements. RF-08 to RF-10 remain outside this first backend specification and can be documented in a later extension. **CU-12 is a limited proposal of support for real memberships**: Automatic mailing and QR request links are not part of the agreed kernel.

## 4. Specifications of use cases

### CU-01 — Register user account

**Requirement:** RF-01. **Actor:** Visitor. **Objective:** create a user identity to access the platform.  
**Shooter:** the visitor requests to register.  
**Preconditions:** does not require a prior company; it has the minimum data requested.  
**Post-success condition:** an identifiable account exists, with protected credentials, without obligation to belong to a company.

**Main flow**

1. The visitor requests to create an account and reports contact identifier and password, without selecting a company.
2. The API validates format, limits and credentials policy, normalizes the identifier according to the defined rule, and checks that there is no other equivalent account.
3. The server calculates a password hash suitable for authentication, with configurable security parameters; it never saves or returns the original password.
4. The API creates the global identity without automatically assigning companies to it and confirms persistence.
5. Returns an account identifier and minimal public data; does not include hash, secret or token from another person.
6. The new user can log in via CU-02 and then start a business (CU-03) or join by valid invitation (CU-12).

**Alternatives:** Register without association with any company; an invitation may be accepted later (CU-12), but registration does not accept invitations or grant access automatically.  
**Exceptions:** duplicate identity, invalid data, password out of policy or persistence failure. Partial account is not created; duplicate identity treatment should avoid abusive listing of users.  
**Acceptance criteria:** single user; password with hash; does not require company; without leaks of sensitive information in the response.  
**E2 earring:** exact password policy, post-registration confirmation and behavior; no outgoing mail is assumed in the first cut.

### CU-02 — Log in

**Requirement:** RF-01. **Actor:** Registered visitor. **Objective:** authenticate safely to use the authorized functions.  
**Shooter:** the visitor presents his credentials.  
**Preconditions:** the account exists and is enabled.  
**Post-success condition:** The API issues a valid session card to identify the user in subsequent requests; it does not automatically grant access to third-party companies.

**Main flow**

1. The registered person sends identifier and password via HTTPS.
2. The API searches the account and checks your hash password with a secure checker.
3. If the account is enabled, it issues the access card according to the mechanism defined in Document 05.
4. The client uses this credential to consult the authenticated identity and list of associated companies through active memberships.
5. If the user selects a company, the API revalidates membership and permissions in **Each business application**Not just in the log-in.
6. If there is no membership, it allows for personal functions and CU-03; it does not display outside companies or create implicit permissions.

**Alternatives:** the user does not belong to any company and can only operate on personal functions, create a business or accept a valid invitation; changing a business does not change the overall identity of the session.  
**Exceptions:** incorrect credentials, disabled account, malformed application or expired/unvalid credential in a subsequent request. Access is refused and no unnecessary information is given on which component of the credentials was incorrect.  
**Acceptance criteria:** anonymous access refused in protected resources; token or verifiable session; membership of a company validated in each business application.  
**E2 earring:** duration, revocation and safe storage of session credentials.

### CU-03 — Creating a business

**Requirement:** RF-02. **Actor:** Authenticated user. **Objective:** register a new company and obtain initial administrative responsibility.  
**Shooter:** the user requests to set up a company.  
**Preconditions:** authenticated identity; minimum valid business data.  
**Post-success condition:** created company, user linked by an active membership and a single initial administrative holder; the historical founder is identified.

**Main flow**

1. An authenticated user requests to create a company and reports name, category/type of activity and agreed mandatory fields.
2. The API validates the data and that the applicant remains authenticated; it does not infer the new company from the previous session.
3. In a single transaction, create Company, register the unchangeable identifier of the founder and create the initial active Membership with administrative responsibility.
4. Ensures that there is exactly one active administrative holder **initial** and that no partial writing is saved if discharge fails.
5. Returns the company identifier and created membership, without modifying user membership to your other companies.
6. The company is operational for its configuration and services, but **no fictitious locations or stock**. To receive or sell physical goods, the administrator records a suitable location through CU-04.

**Alternatives:** the user already belongs to other companies; the new company is added to its membership set. A company can be created **no location**especially if it offers only services. **Not automatically created** a fictitious location, deposit or initial stock.  
**Exceptions:** invalid fields or write error; the transaction reverses and no companies are left without initial membership.  
**Acceptance criteria:** global user; isolated company; historical founder; sole initial administrative ownership; newly created non-location company may use administrative functions and sell services if it meets other requirements, but **cannot receive goods or sell physical goods** until you create a location enabled by CU-04.  
**E2 earring:** definitive mandatory fields and policy for homonymous companies. Transfer of ownership and recovery are left outside the MVP.

### CU-04 — Register a location

**Requirement:** RF-03 (support). **Actor:** Member authorized to manage locations. **Objective:** enable a space for operation to record receptions, stocks or physical sales.  
**Shooter:** request to register location within a company.  
**Preconditions:** authenticated user, valid membership/permissions and existing company.  
**Post-success condition:** continued location, linked to a single company and with explicit sales and/or storage capacities.

**Main flow**

1. The administrator enters the context of a company where it has location management permission.
2. Report name, type and independent capabilities: store stock and/or make sales.
3. The API checks identity, active membership, authorization and validity of attributes; it does not rely on the client selector to provide only its own data.
4. Creates the location linked to that company and records its initial status (e.g. `ACTIVA`).
5. Returns identifier, capabilities and status; does not create purchases, movements or opening balances.
6. Subsequent operations assess capabilities **existing**Not the ones that had the location when it was created.

**Alternatives:** location suitable only for sale, storage only or both; it can also be an administrative space without those capabilities. `CASA` is a valid type of private address without automatic capacity; a service-only company may operate without deposit.  
**Exceptions:** other persons, invalid name or capacity; in a subsequent operation, a paused/inactive location is rejected if activity is required.  
**Acceptance criteria:** there is no cross-use between companies; a reception requires storageable location; a service does not require physical stock.

**Historical status CU-04 in E2-2 A:** In that cut only table/migration and PostgreSQL restrictions existed for locations, without being able to register by API. **Update:** E2-2 B does allow you to create, list and view real locations; editing, pause and change main are pending. Create/Edit/list/pause and designate principal, validate memberships and suspended companies and check permissions by location correspond to E2-2 B/C. Future receptions and sales of goods should be consulted `can_store`/`can_sell` In effect; none of that is executed in this court.

### CU-05 — Register an article or service

**Requirement:** RF-04. **Actor:** Member authorized to manage catalogue. **Objective:** incorporate a reusable sheet into the company's operations.  
**Shooter:** request to register an article.  
**Preconditions:** valid membership and permits in the company.  
**Post-success condition:** Catalog tab created with applicable type, status, unit and commercial data; no stock is generated by the register alone.

**Main flow**

1. An authorised member opens the context of a company's catalogue.
2. Defines name, physical classification/service, category, control unit, sellable condition and initial status; SKU and prices/costs are reported where applicable.
3. The API validates identity, membership, length/format, compatible unit and exact amounts in cents.
4. Check the uniqueness of SKU **within the company**; this guarantee must also be supported by a restriction in the database, not only with prior consultation.
5. The card with the company's own identifier and initial active status persists; a priceless token may require an explicit price when selling.
6. Returns the registered tab without creating inventory balance or movements. A service line will never be receptionable nor will it deduct stocks.
7. When a sale or purchase is confirmed later, it saves the relevant price/name/unit as operating snapshot; editing the tab does not retrospectively change those records.

**Alternatives:** service without stock; physical without initial stock; SKU absent if policy permits; list without list price, to quote when selling. Any edition/deactivation will require authorization and will not rewrite historical snapshots.  
**Exceptions:** SKU duplicated in the same company, incompatible unit, invalid data, unauthorized user.  
**Acceptance criteria:** SKU itself in different companies allowed; service without physical leader; creation does not alter Inventory.  
**E2 earring:** details of the types worked/inputs/resale and final minimum fields. Editing/deactivation can be defined as extension of this CU during API contracts.

### CU-06 — Register a purchase

**Requirement:** RF-05. **Actor:** Member authorized to manage purchases. **Objective:** documenting an acquisition without confusing it with the receipt of goods.  
**Shooter:** requests to register a purchase of goods and/or concepts linked to a supplier.  
**Preconditions:** company and valid permits; amounts and quantities compatible with the commercial rules. **It is not mandatory to have reception location yet.**  
**Post-success condition:** purchase identified and persisted with lines, totals and status, **without generating inventory entries**.

**Main flow**

1. The authorised operator chooses a company and date/reference of purchase, and selects a supplier for that company or indicates absence of supplier if the contract allows.
2. Add one or more lines: physical well identified in catalog, service or free concept not inventoryable. Report quantity, unit and unit cost; you can still skip the reception location.
3. The API validates permissions, existence/membership of items and supplier, type of each line, units, quantities, dates and amounts in exact cents.
4. Calculates the amounts of each line and total using an explicit rounding rule and retains a snapshot of description, unit and cost. It does not assume that registering purchase means paying for it.
5. If there is at least one physical line that can be received, create Purchase `REGISTRADA`; if there are only non-physical lines, create `CERRADA_SIN_RECEPCION`.
6. Confirms purchase and lines as a unit and returns identifier, status and total. **In neither case** creates inventory moves.
7. For later physical entries, the operator must run CU-07; an uninformed destination purchase can wait without affecting stock.

**Alternatives:** optional supplier; registering without destination location; free concepts allowed under explicit rules. **without any physical lines of reception** recorded as `CERRADA_SIN_RECEPCION` (proposed administrative closure state): **no** generates stock movement and **no** UC-07. An empty reception is not invented.  
**Exceptions:** supplier or other person's item, inactive item not allowed, invalid quantity/price, invalid date or reference, purchase without lines or repeated request conflict. No rejection creates stock or partial purchase.  
**Acceptance criteria:** record a purchase never changes stock; with physical goods remains `REGISTRADA`; without physical goods it is unequivocally identified that does not require reception.  
**E2 earring:** state names, if the cancellation is displayed in API and purchase registration idempotency. The first version compromises a **single reception complete in a location per purchase**; partial receptions/multidestiny are deferred.

### CU-07 — Confirm receipt of goods

**Requirements:** RF-05 y RF-06. **Actor:** Member authorized to receive purchases. **Objective:** record the physical entry for a previous purchase.  
**Shooter:** request to confirm receipt of a purchase.  
**Preconditions:** purchase of the same company in state `REGISTRADA`with at least one physical line; destination location **existing, active and suitable for storage**; valid permits.  
**Post-success condition:** the purchase goes to `RECIBIDA`, is registered **a single full reception**and all physical inputs are correlated with it.

**Main flow**

1. The authorized operator consults a purchase of your company and requests to receive your physical lines at a chosen location.
2. The API validates company, permissions, purchase and location existence, active status and storage capacity; non-inventible lines do not generate inputs.
3. In a **single transaction**, blocks purchase or executes an equivalent conditional transition and revalidates it to continue `REGISTRADA`Determines the physical lines from the snapshot of purchase.
4. Record a Reception with its own identifier, purchase reference, location and actor; record one entry for each physical line according to quantities and units of the purchase.
5. En la **same transaction**, change the purchase to `RECIBIDA` and saves the result of idempotence; there are no purchases received without your tickets, or tickets without reception.
6. Confirms and returns receipt, final status and up-to-date inventory data by location/article.
7. If the network response is lost after commit, the client retrys with equal key and load: gets the previous reception without a second effect.

**Alternatives:** mixed purchase with administrative services/concepts and physical goods: only physical goods are received. `CERRADA_SIN_RECEPCION`: there is no applicable CU-07; it is reported that no reception is required.  
**Exceptions:** purchase or location of others, not suitable location, purchase already `RECIBIDA` o `CANCELADA`, concurrent change of status, invalid data or repeated request with different keys. **the same key of idempotence and equivalent charge**, the result is recovered without a second entry; if the key is repeated with a different load, the server rejects the conflict. A second reception with another key is rejected by state and/or restriction of oneness.  
**Acceptance criteria:** a purchase with 10 physical units in A location generates +10 in A and changes to `RECIBIDA`; same repeated request leaves +10; with **two different concurrent keys** a mixed purchase only enters their physical goods. Faced with errors no purchases are left `RECIBIDA` no movement or movement without reception.  
**E2 earring:** SQL strategy specific to uniqueness/idempower and HTTP codes. The limit will be maintained **0.1 Reception by Purchase** in the MVP model; switching to partial reception will require reviewing states, endpoints and CU-07.

**Purchase Status Machine (MVP proposal)**

| Origin State | Event | Destination State | Stock effect |
|---|---|---|---|
| — | Register purchase with physical goods | `REGISTRADA` | None |
| — | Register purchase without receptionable goods | `CERRADA_SIN_RECEPCION` | None |
| `REGISTRADA` | Confirm full reception in **a location**valid and atomic | `RECIBIDA` | Physical inputs once |
| `REGISTRADA` | Cancel before receiving (if enabled in API) | `CANCELADA` | None |
| `RECIBIDA`, `CANCELADA`, `CERRADA_SIN_RECEPCION` | Try new reception | No transition | Refusal; no movement |

`BORRADOR` represents a form not yet confirmed on the frontend and **does not need to become a persistent state** The cancellation is optional for the first cut: if there is no cancellation endpoint, it will not be included as a available transaction. The exact names will be closed with Document 03 and the contracts of Document 05.

### CU-08 — Check stock by location

**Requirement:** RF-06. **Actor:** Member authorized. **Objective:** know available physical stocks by item and location of your company.  
**Shooter:** request the current inventory or apply query filters.  
**Preconditions:** valid membership; existing company.  
**Postcondition:** a consistent projection is obtained without modifying movements or quantities.

**Main flow**

1. An authorized member indicates company and, if needed, location and article filters.
2. The API checks membership and read permissions, and that each filter belongs to the requested company.
3. Read a consistent projection of confirmed movements or a reconciliationable balance projection with the leadger; never add up separate sales or receptions to produce a second independent balance.
4. Group by company, physical article and location, respecting the scale of the unit of the item.
5. Returns balances, identification of locations/items and units. Assets without movement can show zero balance according to the query contract.
6. The query does not generate adjustments or movements; the correction of a detected difference is done by CU-11.

**Alternatives:** company without physical goods or item without movement: zero/empty result according to contract; multiple locations show separate balances. Paused locations retain their history even if they are not suitable for new operations.  
**Exceptions:** company without permission, article or location other than the filter invalid.  
**Acceptance criteria:** the consultation does not modify stock; it never mixes units or company data; services lack physical stocks.

### CU-09 — Transfer stocks between locations

**Requirement:** RF-06. **Actor:** Member authorized for movements. **Objective:** transfer physical quantities from one location to another within the same undertaking.  
**Shooter:** The actor confirms a transfer.  
**Preconditions:** valid and different origin and destination, both suitable for storage; physical article and quantity greater than zero.  
**Post-success condition:** output movement at source and equivalent input at destination, confirmed in a single transaction.

**Main flow**

1. The operator indicates business, physical item, origin location, destination location, quantity and reference/reason if applicable.
2. API validates identity, permissions and membership of **both** locations and item; origin and destination must be distinct, active and suitable for storage.
3. Validate positive quantity and drive scale; does not support services or implicit package/box/kilos conversions.
4. En **one transaction**, obtains exclusive or atomic control over the necessary balances and checks current availability of origin (not as previously observed in the IU).
5. Generates a transfer operation with unique identifier and **two correlated movements**: origin exit and equivalent entry at destination.
6. Saves the idempotence key along with the effect, confirms or reverses the entire operation and returns the two resulting balances.
7. A repeated request with the same key/load returns the existing transfer; a different key represents new operation and is validated against the current stock.

**Alternatives:** transfer between different types of location, if both are enabled for storage.  
**Exceptions:** same origin and destination; insufficient stock; selected service; resources of other companies; some inactive location; duplicate retry.  
**Acceptance criteria:** from 10 units, move 3 leaves 7 at source and 3 at destination; try to move 11 is rejected unchanged; repeat request does not retransfer.  
**E2 earring:** decide between blockable balance and ledger, conditional update or verified serializable isolation; define the concurrent creation management of zero balance initially.

### CU-10 — Register sale with declared payments

**Requirement:** RF-07. **Actor:** Member authorized for sales. **Objective:** record a sale with one or more declared means and maintain inventory consistency.  
**Shooter:** the seller requests confirmation of the sale.  
**Preconditions:** valid company and permits; selling goods and services, correct quantities and prices; for physical goods, active location suitable for sale and storage and sufficient stock **at time of confirmation**.  
**Post-success condition:** exactly once confirmed sale, payment apps that add up the exact total and linked output movements **only to the physical goods lines**; does not credit external payments.

**Main flow**

1. The operator selects company and adds to the cart one or more physical items and/or services, with quantities, units, prices and total discount.
2. If there is at least one physical good, indicate location **active** that admits sale and storage; a single service sale can dispense with location.
3. Report one or more payments **declared** (e.g. cash and transfer), with positive amounts expressed in cents; no external bank accreditation is confirmed or reconciled.
4. API validates authentication, membership, permissions, item and location membership, unit scale, commercial availability, price limits and discounts; calculates subtotal, discount and total with exact rules and verifies that payments add up to exactly the total. Sales should be rejected without positive total.
5. En **a single transaction**, revalidates active/soldable status of current products, permits and location capabilities. Controls the concurrent stock of **all** physical lines (including items repeated in the cart) by means of a locked balance/conditional decrease or equivalent isolation; sum per item before requiring availability.
6. If there is stock for all physical lines, register Sales, lines with snapshots, declared payment applications and correlated physical output movements, along with the idempotency key. **Services do not create stock movements**.
7. Confirms all or reverses all: no lack of stock can leave payments, vouchers or partial outings. Returns internal voucher, totals, declared means and affected balances.
8. Faced with a lost response, the retry with the same key and charge recovers the existing sale; a new operation with another key competes again for the real stock.

**Alternatives:** sale of services only without deposit or physical output; mixed sale; split payments (effective + transfer or other declared means). A financial account reference can be omitted in this first API; the comprehensive validation of accounts and days corresponds to subsequent RF-08/RF-09. The same repeated physical article line is logically added to check availability.  
**Exceptions:** Non-conciliating payments; total zero or invalid discount; item deactivated between selection and confirmation; change of location; insufficient stock, including two simultaneous orders for the last unit; other person's resource; incorrect quantity/unit; reused key with different content. Partial sale, negative stock and loose payment applications are not generated.  
**Acceptance criteria:** Exact totals in cents; combined payments reconciled; services without physical movement; 2 concurrent sales per 1 unit = **exactly 1 successful sale and 1 controlled rejection**, with final balance 0; failed operation leaves no payments or departures; successful retry not duplicate.  
**E2 earring:** choose a coherent transactional strategy in PostgreSQL, define orderly blocking and collision management, set rules for deactivated article while it is confirmed. Associated accounts, payment days and QR remain at a later stage of the backend.

### CU-11 — Register justified inventory adjustment

**Requirement:** RF-06. **Actor:** Member authorized to adjust inventory. **Objective:** correct physical differences by recording their cause, without inventing purchases or sales.  
**Shooter:** the actor detects missing, diminished, damaged or leftover, or records a difference after counting physically.  
**Preconditions:** authorized user in the company; valid location with storage; physical item, unit and quantity compatible.  
**Post-success condition:** a traceable adjustment movement is recorded and stocks change only by confirmed difference.

**Main flow**

1. The authorised operator selects company, suitable location, physical item and type of adjustment: **income** o **discharge**.
2. It reports exact quantity in the unit of the article, mandatory reason and optionally reference to a physical verification; API validates length, format, actor and tenant membership.
3. Revalidates that the article and location are enabled for operation.
4. En **a single transaction**, obtains concurrent control over the affected balance, reads existing stocks and checks that an outflow does not generate negative balance.
5. Inserts an identifiable operation and the corresponding signed movement, with actor, date, motive, company and idempotency reference.
6. Confirms and returns the updated movement and balance, without retroactively modifying sales, receptions or transfers.
7. If a **physical count** instead of a direct difference, it should be accompanied by the balance/version observed: if another actor modified the stock from reading, the obsolete count is rejected and the difference is requested to be revised; the adjustment against a changed balance should not be recalculated without warning.

**Alternatives:** un **individual physical count** may cause an adjustment, but requires comparison against the observed balance/version and reject intermediate changes; match without difference does not generate movement. **multi-article count with review session** the frontend is deferred if it is not expressly incorporated into the MVP.  
**Exceptions:** service type item, non-company data, missing reason, invalid quantity or unit, attempt to exit larger than the stock available, duplicate retry, balance changed concurrently during a count. If the stock changes between physical count and its confirmation, API must **reject the obsolete transaction or require explicit review**do not quietly overwrite third party movements.  
**Acceptance criteria:** if there are 10 units and a decrease of 2, final balance 8 is recorded; an output adjustment of 11 is rejected in full; positive adjustment is traced; retrying with the same key does not duplicate; a concurrent sale leaves no negative balance or cancels a difference without revision.  
**E2 earring:** define minimum reasons and whether the individual count will have its own operation. **justified difference adjustment** is the minimum commitment of the UC; do not blindly mix ‘set absolute balance’ with ‘take/return quantity’.

### CU-12 — Invite and accept incorporation of a collaborator

**Requirement:** RF-02. **Actors:** Authorized Administrator (solicita la invitación) and Guest User (accepts). **Objective:** to link a consensually existing global identity to another company, with limited membership and permits.  
**Priority:** **proposed support** to demonstrate real multiuser; confirm whether it is part of the first API or prepared by fixings in tests. **No automatic mailing, public QR link or legal partner registration required.**  
**Shooter:** the administrator wants to incorporate a contributor.  
**Preconditions:** existing company; administrator with invitation permission; recipient with valid identity (can be registered by CU-01 before accepting).  
**Post-success condition:** exists **one active membership** the guest in that company and the invitation token is consumed; in another company retains its original permissions.

**Main flow**

1. An authenticated administrator chooses his company and requests an invitation addressed to a specific mail/identity with allowed role (never default administrative ownership).
2. The API checks the administrator's membership and permission, role limits, duplicates, and recipient validity.
3. Generate an invitation `PENDIENTE` with safe token, maturity and parent company; **creating the invitation does not grant access**. Your communication to the addressee may be manual during the MVP.
4. The authenticated recipient receives the token and asks to accept it; if he has no account yet, first executes CU-01 and CU-02.
5. API validates on token server, expiration, status `PENDIENTE`, correct authenticated recipient and corresponding company.
6. **In the same transaction** creates/activates your allowed membership, records acceptance and consumes the invitation exactly once; no other identity can take advantage of the token.
7. Returns membership and accessible company. The user will only see resources for which he/she has permissions and only from that moment.

**Alternatives:** If the user already has active membership, no other member is created; the API reports that it already belongs to that company. The invitation may be refused/cancelled if such operations are implemented.  
**Exceptions:** invalid, expired, reused or addressed to another account; unauthorized administrator; excessive role; non-accessible company; concurrent acceptance. All errors should avoid revealing sensitive information of the recipient and not creating partial memberships.  
**Acceptance criteria:** invitation does not grant access; a token is consumed once; only the recipient identity accepts it; the guest may belong to A and B with different roles; memberships are not duplicated under concurrent acceptance; the administrator cannot transfer title by basic invitation.  
**Validated E2-1.3C.3 and subsequent:** the CU-12a issue exists in the API (seven-day token delivered only in 201 roles, `ENCARGADO`/`TRABAJADOR`C.4a implemented and validated the CU-12b acceptance (**171 local tests**). C.4b implemented team listing and updating (**195 local tests**, CI 3/3), without enabling transfer of title. Cancellation, rejection and forwarding of invitations remain pending. SQL uniqueness is retained `(business_id,user_id)`.

## 5. Cross-sectional validation scenarios

| ID | Scenario | Related cases | Expected result in API |
|---|---|---|---|
| ET-01 | User without membership tries to access another company | CU-04 to CU-12 (depending on context) | Rejection, without revealing data of that company |
| ET-02 | Forwarding of a confirmed receipt | CU-07 | One reception and tickets; stable result with same key |
| ET-03 | Two authorised users simultaneously sell the only item available | CU-10 | 1 confirmed sale, 1 rejected; final balance 0, never negative |
| ET-04 | Transfers exceeding stocks | CU-09 | No output or input; previously intact stock |
| ET-05 | Mixed sale of physical product and service | CU-10 | Stock only affected by physical assets |
| ET-06 | Authenticated user without company | CU-02, CU-03 | You can create a company; you don't get access to another by knowing an ID |
| ET-07 | SKU repeated in another company | CU-05 | Allowed between companies, unique within each company |
| ET-08 | Purchase registered without reception | CU-06, CU-08 | Inventory unchanged |
| ET-09 | Purchase without receptionable goods | CU-06, CU-07 | Closure without physical reception; CU-07 rejected, no movement |
| ET-10 | Two requests confirm receipt of the same purchase | CU-07 | One transition to `RECIBIDA`; no double input |
| ET-11 | Adjustment for loss of reason or more | CU-11 | Rejection and stock intact |
| ET-12 | Stock changes between pre-reading and confirmation of sale, transfer or adjustment | CU-09 a CU-11 | Revalidated inside transaction and no negative balance |
| ET-13 | Create company without location, then receive goods or sell physical good | CU-03, CU-04, CU-07, CU-10 | Refusal to create an enabled location; services allowed without deposit |
| ET-14 | Reusing same idempotence key with a different charge | CU-07, CU-09, CU-10, CU-11 | Controlled conflict, no second operation |
| ET-15 | Another user is invited but does not accept, or tries to accept from another account | CU-12, CU-02 | No new active membership; invitation does not grant access on its own |
| ET-16 | Repeat acceptance of invitation or accept in parallel twice | CU-12 | One membership; once consumed invitation |
| ET-17 | Purchase/sale fails after preparing records but before confirming | CU-06, CU-07, CU-09, CU-10, CU-11 | Full Rollback; no partial data, consistent balances and operations |
| ET-18 | Sale of 2 lines of the same item with stock less than the total requested | CU-10 | Complete rejection; not validated each line in isolation |
| ET-19 | User consults another company with a valid article, supplier or location ID | CU-04 a CU-12 | No read/write by others; no escape rejection of attributes |

### 5.1 How to test ET-03 with two users without two computers

The test of **attendance** does not depend on two people clicking at the same time or the visual interface: it will be run by an integration test that launches two simultaneous HTTP requests against the real backend, with **PostgreSQL testing**. It does not serve as equivalent proof to run in `localStorage`, nor assume that SQLite in memory replicates PostgreSQL block behavior.

**Reproducible preparation:**

1. Create a test company, a physical item for sale, an active location and **exactly 1 unit** available by a valid reception or adjustment.
2. Create **two different users** with membership and permission to sell in that same company, by CU-12 if implemented or by **controlled test fixtures**; get two valid credentials. In no case re-use a single identity to fake two users.
3. Prepare two sales with a line of 1 unit, declared payments that reconcile and **different idempotency keys**.
4. Launch the two requests in parallel by `asyncio.gather`, with two HTTP clients and **two SQLAlchemy independent sessions/transactions**; synchronize the start by test barrier if actual containment is required. If the endpoint blocks a common resource, repeat the test several times.
5. Check answers and **persisting status**: a successful confirmation and a business rejection due to lack of stock, **exactly a sale**, your payment applications, a physical output and final balance 0. No sale/line/partial payment of the rejected attempt should be left.
6. Retry request **successful with your same key** and confirm that the same sale is recovered without generating another output.

> The test should consult the base after both requests have been completed. Two HTTP responses alone do not demonstrate integrity. If the engine uses serialization with controlled retrying, the API must resolve or reject the conflict consistently. The exact timing of the requests cannot be proven without instrumentation; a repeatable test under containment is more robust.

**Conceptual example of the test (not code implemented):**

```python
# Con PostgreSQL real, fixtures de dos usuarios autenticados y 1 unidad en stock.
resultados = await asyncio.gather(
    cliente_ana.post(ruta_ventas, json=venta_ana, headers=headers_ana),
    cliente_beto.post(ruta_ventas, json=venta_beto, headers=headers_beto),
)
assert sum(r.status_code == 201 for r in resultados) == 1
assert sum(r.status_code == 409 for r in resultados) == 1  # 409 propuesto; validar en Documento 05
assert consultar_ventas_confirmadas() == 1
assert consultar_salidas_de_stock() == 1
assert consultar_aplicaciones_pago() == 1  # un único medio en esta fixture
assert consultar_stock_disponible() == 0
```

**Classification:** ET-03 is a **integration test/concurrence**, does not replace the **10 unit tests** The example presupposes a paid-for-sale application, so it expects a single confirmed application. You can cover the rules with separate unit tests and run this additional scenario with PostgreSQL in Docker/GitHub Actions. The interface with two browsers can serve as a demonstration, but it is not a reliable test of a race condition.

### 5.2 Brief results matrix for each transaction

| Operation | Success | If a validation fails or conflict occurs | Identical retry |
|---|---|---|---|
| Register purchase (CU-06) | Purchase + lines and status, **sin stock** | No purchase or partial lines | Define idempotence in Document 05; recommended to avoid double purchases |
| Reception (CU-07) | Reception + all entries + status `RECIBIDA` | Purchase is pending and stock unchanged | Returns the same reception |
| Transfer (CU-09) | Reference + an equivalent output and input | Neither move appears | Returns the same move |
| Sale (CU-10) | Sales + lines + declared payments + physical outflows | No sale, applications or partial outputs | Returns the same sale |
| Ajuste (CU-11) | Operation + movement with reason + consistent balance | No movement or change of balance | Returns the same setting |
| Accept invitation (CU-12) | Membership + invitation consumed | No new membership and no partial acceptance status | No duplicate membership |

A case of use does not certify compliance alone: these results become **server tests** when FastAPI/PostgreSQL exists. In transactional cases, it is necessary to verify both the HTTP response and the persisting state.

## 6. Relationship to UML diagrams

El **diagram of use cases** It will represent the Authorized User, Owner/Administrator and Collaborator as external actors (according to permissions); CU-01 and CU-02 will be associated with the Visitor. CU-12 relates the Invited Administrator and the Authenticated User that it accepts, without drawing the API as an actor. **System/API will not be an actor of the diagram**. Relationships between actors should indicate specialization only when it is semantically valid.

It is not necessary to draw the twelve cases with all their exceptions. **presentation**, a readable overview will be proposed and the complex flows will be detailed with this specification. `<<include>>` y `<<extend>>` they shall be added only if they fulfil their UML meaning, not by decoration.

El **class diagram** will be defined after the domain approval and will not be confused with the SQL table scheme: there will be entities such as User, Company, Membership, Article, Location, Supplier, Purchase, Reception, Stock Movement, Sale and Payment Application, with consistent cardinalities and invariants.

In order to demonstrate competition and indempetence in defence, a **sales confirmation sequence diagram**, showing verification and discount under the same transaction. The Purchase Status Machine is described in CU-07; **does not require the implementation of the State pattern**.

## 7. Scope coverage and delayed functionalities

Cases CU-01 to CU-12 correspond to the backend **Proposed**, not to twelve capabilities fully implemented today. The inclusion of CU-12 does not require sending emails or automatically incorporating real permissions to the local frontend. RF-08 (expenditures and cashier), RF-09 (declared accounts) and RF-10 (QR DEMO) remain on the local frontend and will be specified for backend only if planning is expanded. Return operations, batch production, reserves, bank reconciliation and actual payments are not committed to the first API.

Accurate HTTP endpoints and methods will be defined in `05_MATRIZ_API_Y_TRAZABILIDAD.md`. Tests of the DEMO frontend shall not be equated with unitary tests and integration tests of the academic backend.

## 8. Decisions pending approval

| Decision | Initial proposal | Impacto |
|---|---|---|
| D-CU-01: backend permissions | Owner/Manager enables catalogues and locations; collaborators execute operations granted by company | Security and Role Matrix |
| D-CU-02: receipt of purchases | First API records **a full reception by purchase**; partial receptions deferred. Purchase only administrative ends in `CERRADA_SIN_RECEPCION` (proposed) | Entities, states and evidence |
| D-CU-03: location of physical products | A physical sale requires location with sales and storage capabilities; services do not require location | Sales and inventory design |
| D-CU-04: purchasing supplier | Optional for registration, as in DEMO; does not automatically determine receipt/payment | Purchase API |
| D-CU-05: session strategies and errors | Register/login and contract-phase defined permissions; structured errors preferably with RFC 9457 | Safety and evidence |
| D-CU-06: stock supply | Compare PostgreSQL balance lock vs conditioned atomic updates; single-sale and movement transaction | Oversales guarantee; ET-03 test |
| D-CU-07: Inventory adjustment | Enable manual setting with motif and trace; multi-article counting differs if it is not part of the approved scope | CU-11, permits and tests |
| D-CU-08: invitations/memberships | CU-12 as a recommended minimum support without automatic mail; alternatively prepare memberships only with matching fixes if endpoint differs | RF-02, real users and ET-03 |
| D-CU-09: amount and presentation | ARS in cents, amounts of climbing unit and snapshots of amounts; define rounding and ranges in schemas | CU-05, CU-06, CU-10 and Document 05 |
| D-CU-10: concurrent balances | If ledger is used, do not block only historical movements; guarantee serializable balance resource for concurrent inputs/outputs | CU-07, CU-09, CU-10, CU-11 |

## 9. Conditions of approval

This version is considered a revised basis for delivery. The team must confirm the actors, the scope of operations of the kernel and, in particular, whether **a full reception by purchase** is sufficient for the academic API. It is proposed as a less complex decision for MVP, without preventing evolution after partial receptions. The fields, HTTP codes and definitive paths may be specified during API design without rewriting the goals of use cases.

**Status:** revised version 0.3 for delivery as specification **TO-BE**. Final HTTP contracts, permissions and SQL schemas must be in accordance with the following documents; any change of scope requires updating the related RF and CU.

**External technical reference consulted for the error format:** RFC 9457 — *Problem Details for HTTP APIs* (IETF, 2023), which replaces RFC 7807: https://www.rfc-editor.org/rfc/rfc9457.html. It is documented as an architectural preference, not as an express obligation of the slogan.

## 10. Status of use cases and forthcoming authorization policy

| CU | API Status | Endpoint or check |
|---|---|---|
| CU-01 Registration | Implemented and locally tested | `POST /api/v1/auth/register` |
| CU-02 Login/profile/output | Implemented and locally tested | `POST /login`, `GET /me`, `POST /logout` low `/api/v1/auth` |
| CU-03 Create and manage company profile | Verified High and Reading; C.2 Edition published, still without confirmed local evidence | `POST/GET /api/v1/businesses`, `GET/PATCH /api/v1/businesses/{business_id}`; Business RBAC in PATCH |
| CU-04–CU-11 | Pendiente backend | Conceptual plan and frontend DEMO experience; no real endpoint yet |
| CU-12 Invitations/equipment | **C.3/C.4a/C.4b locally validated; 195 final tests and functional IC 3/3** | Issue, acceptance, directory `GET /api/v1/businesses/{business_id}/memberships` and editing `PATCH /api/v1/businesses/{business_id}/memberships/{membership_id}` |

**Policy E2-1.3C.1:** implementation of the **matriz RBAC pura** with four membership roles; for business consultation all active members can read, while the configuration is reserved to the owner and administrator. `ENCARGADO` y `TRABAJADOR` they do not receive general authority to edit a company, invite or administer members. **This first delivery defines and tests the policy; the effective application to the first protected mutation is the following cut.** Other business identifier or inactive membership should not grant access. For an active member of a suspended company, information reading is expected, no change. See Document 05 for the detail and HTTP errors previewed.

## 11. CU-03 plugin — editing a company profile (E2-1.3C.2)

**Actor:** authenticated user with membership `ACTIVA` in the objective company and role `TITULAR_ADMINISTRATIVO` o `ADMINISTRADOR`. **Preconditions:** current session and active account; existing company, own and `ACTIVA`; PATCH body with at least one `name`, `category`, `activity_kind`.

**Main flow:** (1) client sends `PATCH /api/v1/businesses/{business_id}` with Bearer and enabled fields; (2) FastAPI validates form and values, and the server authenticates; (3) the service reblocks/checks user and session; (4) queryes and blocks pair `Business`–`Membership` of the same tenant with active membership; (5) evaluates `BusinessPermission.EDIT_PROFILE`; (6) modifies only fields present and confirms a single transaction; (7) replies 200 with `BusinessView` updated and the membership that authorized.

**Alternatives:** invalid session `401`; non-existent or no active membership `404`; member valid without authority `403`; holder/company manager suspended `409`; prohibited fields, `null`, invalid names or empty body `422`. Any exception before commit reverses the update. The role of a company never enables to modify another. The status is not updated by this API.

**Tests introduced in C.2 (validated later on regression of E2-1):** successful flow of the holder, administrator, refusal to maintainer/worker, isolation between companies, suspended company, revoked session, inactive membership, body validation and induced rollback after `flush`. This supplement does not create a new entity nor requires regenerating 03A/03B.

## 12. E2-1.3C.3 — partial contract of CU-12a: issue invitation

**Preconditions:** user with current personal token, membership `ACTIVA` in the company `ACTIVA` and permission `members.invite` (administrative holder or administrator). `email` valid and role `ENCARGADO` o `TRABAJADOR` only. No advance comprehensive account of the addressee is required.

**Flow:** authenticate; revalidate session/user blocking rows; block company+actor membership; verify permission in the same tenant; check that no longer exists membership `ACTIVA` associated with mail in that company; explicitly discard an invitation `PENDIENTE` expired from the same company/mail; refuse duplicate in force; generate a 256 bit safe token, persist **only** hash, time and minimum data; confirm a single transaction; return 201 and include token once in the response. No members or users are created.

**Alternatives:** 401 no session; 404 if non-member/non-existent or inactive membership; 403 if unpermitted role; 409 suspended company, existing active member or pending invitation; 422 unsupported mail/rol or extra fields. All errors reverse changes. Tokenization is validated only on server, not by React.

**Evidence and evidence (updating C.5):** C.3 approved IC (Python 3.12/3.14, Alembic and Docker) and then **147 local tests**CU-12b was implemented and validated in C.4a (**171 tests**); consultation and membership management was validated in C.4b (**195 tests**). Cancellation/return/rejection of invitations and approval/transfer of title are still pending. This section retains the original specification of C.3 as antecedent.

## 13. C.4a — CU-12b invitation acceptance (implemented and locally validated)

**Actor:** global account with valid Bearer session and standard mail **Same** The recipient may register his account after the invitation has been issued. The issuer does not accept on behalf of the addressee.

**Main flow:** (1) Send `POST /api/v1/invitations/accept` con `{"invitation_token":"..."}`; (2) check session and have SQL lock; (3) consult the SHA-256 print invitation and block it; (4) require that the account mail match the recipient; (5) require PENDENT status and `expires_at` future; (6) block the Active Enterprise; (7) block the possible User Membership and create it if it does not exist or reactivate it if it was INACTIVE, preserving uniqueness per tenant; (8) consume token with an ACCEPTED state and save who/when accepted; (9) confirm membership + invitation in a transaction; (10) return `BusinessView` and enable business GET.

**Exceptions:** 401 invalid session/user; 404 token missing or directed to another identity **with the same message**; 409 token consumed/winned, suspended company, membership already active or reactivating former administrative holder; 422 token with invalid form or extra fields. Exceptions do not create or reactivate members. The accepted consumed does not produce second membership nor change of role when reintended. The role for reactivated membership comes from invitation, not from the client; the `job_title` previous is cleaned. No downgrading of an inactive historical holder with an operational invitation is allowed.

**Traceability:** CU-12b complements CU-12a and RF-02. Added `accepted_by_user_id` y `accepted_at` in an additive migration `e213c4_acceptance`, with restriction to only appear in the audit columns with `ACEPTADA` and be mandatory in that state. **CI approved Python/Alembic for both Python**; C.4a was verified with 171 local tests and C.4b with 195. Validation by real mail, role changes and IU belong to other courts.

## 14. C.4b — CU-12: consult equipment and change operating permissions

**Referral:** a User authenticated with membership `ACTIVA` y rol `TITULAR_ADMINISTRATIVO` o `ADMINISTRADOR` request `GET /api/v1/businesses/{business_id}/memberships`. API revalidates your session, blocks the company/membership itself and checks permission `members.read`; returns directory of **that company only**, including inactive members. Replies: 200 list, 401 no session, 403 role without permission, 404 non-member or inactive actor member, 409 company suspended. The directory shows minimal professional data, not user secrets.

**Mutation:** only one administrative holder **asset** you can request `PATCH /api/v1/businesses/{business_id}/memberships/{membership_id}` with field `role` y/o `status`. The body is partial; values `null`strangers, `TITULAR_ADMINISTRATIVO` and extra fields give 422. Revalidating session, company/membership of the actor, privilege `members.manage` and objective membership of the same company; block in SQL and confirm a single transaction. An administrator cannot disable colleagues or promote. The holder may not modify his own membership or any membership whose current role is `TITULAR_ADMINISTRATIVO` (answer 409, rollback). An external/non-existent target gives 404. Suspended company gives 409. Unauthenticated user gives 401 and unlicensed actor member gives 403. A deactivation has immediate effect on the upcoming applications with that account for that tenant; it does not revoke its global identity or affect other companies.

**Out of reach:** transfer or cessation of the holder, physical disposal, editing `job_title`, sending emails, checking mail ownership and managing invitation requests. The user maintains his or her global personal identity. The review of 03A and the closure of block E2-1 will be treated in a documentary stage of their own. **C.4b tests approved in IC, not yet executed locally**.

## 15. C.5 — Correspondence of use cases with actual API

CU-01/CU-02 (identity) and the concrete flows of CU-03/CU-12 (company, invitation and basic equipment) have endpoints and PostgreSQL tests. **Commercial use cases remain TO-BE**, although React DEMO has screens. C.4b: `195 passed in 23.86s`, Functional CI 3/3 and Alembic without differences. The transfer of title is not implemented; the audit for the companion will be prepared in a separate delivery, before RF-03.

## 16. E2-2 A — Partial evidence of CU-04

**E2-2 A — Persistence of Locations (08/11/2026):** Published `Location`/`locations` with FK required `business_id → businesses.id` (`RESTRICT`), six types, `can_sell`/`can_store` independent, optional reference fields, `ACTIVA/PAUSADA`, `is_primary`, partial index that allows at most a main active per tenant and CHECK that prevents main paused. Additive migration `20261108_0008_business_locations.py` (`e22a_locations`, descendant of `e213c4_acceptance`) The company continues to start **no locations**. **No HTTP Location Routes yet**, no inventory/purchase/connected sale, no location permits; these changes belong to E2-2 B/C and subsequent blocks. The IC of the cut code was verified in `300fa6f` (GitHub Actions run 42491816481): result `success`. Local Windows validation of the new cut is still required; the previous 195 tests corresponded to E2-1.

**Added tests:** `test_location_model.py` y `test_location_integration.py` They review metadata, SQL restrictions, FK, main index, states, independent capabilities, filtered query isolation and rollback. **They do not yet constitute HTTP tests or location permissions** and do not replace the entire CU-04 scenario. The 195 tests reported before are historical of E2-1, they are not attributed as local validation of the new cut.


### E2-2 A.1 — New CASA type (08/11/2026)

He's in. `CASA` as sixth type of location, without changing the independent capacity contract `can_sell` y `can_store`, nor states `ACTIVA`/`PAUSADA`. A house can sell, store, both or none of these activities (administrative address). **No address or location is created automatically** and no commercial empowerment is assumed. `e22b_location_casa`, descendant of `e22a_locations`expand `ck_locations_kind` without rewriting the previous migration or altering existing rows; it prevents its reversal while there are CASA rows. DEMO React supports CASA in the selector and local storage validation/reading, but remains separate from API. IC from code `b50bf200`: **backend 217/217 pruebas, Alembic sin deriva y Docker 3/3** (run backend); **frontend 2/2 including E2E desktop and mobile** (run frontend). Previous Windows result of E2-2 A: 212 tests; **local validation of A.1 pending**HTTP CRUD and location permissions remain for E2-2 B/C. E2/1/03B/03C are not altered.

## 17. E2-2 B — CU-04 partially implemented with authorization

**State E2-2 B (08/11/2026):** Three real routes were published for low locations `/api/v1/businesses/{business_id}/locations` (`POST` 201, `GET` ready 200, `GET /{location_id}` 200). The creation valid DTO without protected fields, revalidates identity/session, blocks the company and membership of the actor, demands tenant `ACTIVA` y rol `TITULAR_ADMINISTRATIVO` o `ADMINISTRADOR`, and confirms a single transaction. A first location receives `is_primary=true`; the subsequent ones do not replace it. Active members of any recognized role can consult their own locations, even with suspended company; a suspended company does not allow to create. A third party or inactive membership returns 404; role without permission 403; invalid session 401; company suspended when creating 409; incorrect body 422. `CASA` and Google Maps HTTPS validated are included. **There is no PATCH/DELETE, no pause/reactivation, change of principal, individual staff assignment or commercial consumption of locations yet.** DEMO remains independent. Backend without new migration from `e22b_location_casa`.

The absence of locations is proven by the registration of a company, automatic choice of the first main location, types (including CASA), independent booleans, SQL filtering by `business_id`, the detailed query, roles, global account, business suspension, prohibition of overwriting protected attributes and rollback errors. **Historical situation E2-2 B:** missing editing, pause and main; **all three operations were implemented and tested in IC at E2-2 C**. Granular permits/locations by location and stock-dependent trade rules are still missing.

**Evidence of IC:** commit funcional `bdd2c84653dafb976c8cd6b49d8c2d577cc345de`; GitHub Actions E2-2 B **3/3** (Python 3.12 y 3.14 con PostgreSQL, Docker), **277 approved tests**, `e22b_location_casa (head)` and Alembic without drift. The local Windows output provided previously for **E2-2 A.1** fue **217 passed in 23.90s**. Posteriormente E2-2 B **was validated in Windows with `277 passed in 31.22s`**, Alembic without drift and healthy Docker; E2-2 C adds new tests to be verified locally. The peer review of E2-1 remains anchored in the commit delivered.

## 18. E2-2 C — CU-04 extensions implemented

**E2-2 C (08/11/2026) — actual location operations:** `PATCH /api/v1/businesses/{business_id}/locations/{location_id}` allows editing only `name`, `kind`, `address`, `map_url`, `can_sell` y `can_store` (optional fields in the body, but rejected `null`, empty bodies, invalid values and protected fields). `PATCH /{location_id}/status` receive only `ACTIVA` o `PAUSADA`: pause revoke `is_primary` in the same transaction and reactivate **no** recovers location ownership automatically. `PUT /{location_id}/primary` designates a location `ACTIVA`, unmarks the previous one and marks the one chosen within the **and a single transaction**, serialized by company lock and protected with the SQL index `uq_locations_one_active_primary`. The operation on an already main location does not make any additional changes. Owner/Manager with Active Membership can manage; maintainer/worker only consult. `SUSPENDIDA` read but no change; other/non-existent resource 404, role without permission 403, invalid session 401, incompatible status 409 and invalid body 422. DELETE was not enabled nor new tables were created.

**Protected cases:** a location `PAUSADA` cannot be principal (409); when paused a main server removes that indicator atomically and does not designate another on its own; by reactivating it it does not recover the condition of principal. Two locations of the same company cannot maintain `is_primary=true` At the same time, locations of another company are not changed even if their UUID is known. Administration uses current business membership role, not a global role, and does not expose other people’s data. `can_store` They do not yet consult actual balances because the commercial backend does not exist; that rule should be resolved when inventory is implemented.

**Evidence:** functional code `7abafd8208965cd99b0116e02ffc5240d23f218f`, GitHub Actions E2-2 C **3/3 successful**, 325/225 Python 3.12 and 3.14 tests with PostgreSQL, Alembic `e22b_location_casa (head)` no drift and correct Docker. Windows had previously validated E2-2 B (`277 passed in 31.22s`, `/ready` = `ready`/`ok`). **The 325 tests must still be played on Windows to close locally E2-2 C.** React/API integration, individual assignment of members to locations, inventory control when removing `can_store`, receptions/sales and operating fund management are future works; they are not attributed to this increase. E2-1 and UML 03B/03C were not modified.

## 19. E2-2 D — CU-04: allocation and revocation by headquarters

**E2-2 D (08/11/2026) — implemented, pending local validation:** tabla `location_assignments` con clave triple `(business_id,location_id,user_id)`; Composite FK `(business_id,user_id)` a `memberships` y `(business_id,location_id)` a `locations` to prevent company crossings even in direct SQL. Additive migration `e22d_assignments`, unchanged migrations of E2-1; UNIQUE auxiliary `(business_id,id)` en `locations`Allocations `ACTIVA`/`REVOCADA` con `revoked_at` coherent (CHECK). GET of mapping collection and PUT status of a headquarters membership, only per owner/manager of the company; activating assignments is limited to ENTRY/TRAWER. Revealing preserves row and can be done with paused or inactive seat; activating requires both assets. Suspended company allows query but prevents deeds. Pure function `can_operate_at_location` requires active location and company, active membership, capacity `SELL`/`STORE` relevant and, for managers/workers, active assignment. **Not yet invoked from inventory, purchases or sales**It doesn't change business membership, it doesn't connect React and it doesn't create fictitious locations.



**Evidence:** final code `3cd7bce71d951218e8c77da58d147e78fb0d426e` and IC E2-2 D 3/3 approved, **371 tests** en Python 3.12/3.14, `e22d_assignments (head)` The last local result provided is E2-2 C, **325 passed in 36.91s**. **Migration and 371 E2-2 D tests still require local Windows execution before closing the block and preparing the audit sheet.**

## 20. E2-3 A — Initial evidence of CU-05

**Cut E2-3 A (08/11/2026), partial persistence of RF-04/CU-05:** clase SQLAlchemy `CatalogItem` y tabla `catalog_items` con `business_id` Compulsory, FK to Company (`RESTRICT`) y par UNIQUE `(business_id,id)` for future commercial FK of the same tenant. Four kinds of tab according to DEMO: `ELABORADO`, `REVENTA`, `INSUMO` (physical property) and `SERVICIO` (conceptually a service). `SERVICIO`; physical property prohibits it. `UNIDAD`, `GRAMO`, `KILOGRAMO`, `MILILITRO`, `LITRO`, `PAQUETE`, `CAJA`. Name, standardized key is stored `name_key`, category, optional SKU, description, internal observations, status `ACTIVO`/`INACTIVO`, condition `sellable`, `price_cents` y `reference_cost_cents` optional. Whole amounts BIGINT between 0 and 99,999,999.999 cents, without Float. Two independent restrictions prevent repeat `name_key` and SKU not null **within the company**, also in inactive chips; different tenants can reuse them. In E2-3 B the service must calculate `name_key` canonically (NFKC, collapsed spaces, capital equivalence) and normalize SKU to uppercase **before inserting/editing**: SQL imposes the uniqueness of saved keys and SKU format, but does not derive `name_key` Create tab does not create location, stock, purchases, sales or movements.

**Pending acceptance criterion:** an authenticated call to Catalog must check business permissions, generate a `name_key` canonical and standard SKU, query/save within the tenant and translate duplicates to documented HTTP error. **Do not confuse the current DB model with the CU-05 already implemented**. History restriction (not converting well ↔ service or unit with previous movements) will be activated with subsequent commercial modules, retaining snapshots.

**Evidence:** code/test cut `79c2071f4e5192be95d75c78d5b1e9a75492a645`; GitHub Actions E2-3 A **3/3**, **407 approved tests** en Python 3.12 y Python 3.14 con PostgreSQL 16, Docker liveness aprobado y `e23a_catalog (head)` no pending changes from Alembic. **Local Windows Validation Pending for E2-3 A**; the above 371 tests correspond to the closure of E2-2. **No HTTP Catalog paths** in this cut; CRUD, catalog RBAC, SKU/name standardization of entry and protection of business stories will be implemented in E2-3 B/C/D. No React API integration or independent review of E2-3 yet. No change to E2-1 or E2-2 or DEMO frontend.

## 21. E2-3 B — CU-05: discharge flow, query and editing implemented

**E2-3 B — Real Catalogue API (RF-04/CU-05, 08/11/2026):** four low routes `/api/v1/businesses/{business_id}/catalog`: `POST /catalog` (201 high), `GET /catalog` (200 list with `offset>=0`, `1<=limit<=500`; default `limit=100`), `GET /catalog/{item_id}` (200 detalle) y `PATCH /catalog/{item_id}` (200 part edition). Each operation requires valid Bearer, session revalidation, user and membership of the requested company. Owner/manager can read and write; maintainer/worker with active membership only read; company SUSPENDED read only; enterprise or article other/non-existent 404. The server normalizes Unicode NFKC names, collapses spaces and generates `name_key` con `casefold`; normalizes SKU to ASCII capital letters and converts empty SKU into NULL. PostgreSQL retains the uniqueness per company of `name_key`/SKU even with INACTIVE tabs, and the API translates that collision to 409. Invalid data or protected fields (id, tenant, status, derivative key) receive 422. SERVICE type requires SERVICE unit; no other classification can use it. They are valid `price_cents` y `reference_cost_cents` NULL or integers from 0 to 99.999.999.999. The PATCH allows you to remove SKU/price/cost with NULL, but do not edit status. `status` and timestamps SQL. Creation does not create location, stock balance, purchases, sales or movements.

**CU-05 contracts:** High requires `name`, `kind`, `unit` y `sellable` explicit; SKU, category, price/cost, description and observations have optional values. API returns tab with `id`, `business_id`conceptual classification `item_type=BIEN|SERVICIO`, status and dates. Partial editions check `kind`/`unit` In combination with existing securities, within a transaction. Two SKUs equal in different companies are valid; within the same company they do not duplicate even when the original registration is inactive.

**Explicit limits:** E2-3 B not yet exposed `PATCH /status` No integration of frontend React with this API; no reception, sales, commercial snapshots or history unit editing protection are implemented as these modules are later. New tests check permissions, duplicate rollbacks, SKU/standard names, multi-company isolation, suspended reading and fault 401/403/404/409/422. **Evidence CI E2-3 B:** GitHub Actions 42506409757 finished **3/3 successful jobs**, **498 approved tests** both in Python 3.12 (53.96s) and Python 3.14 (50.12s), PostgreSQL 16, `e23a_catalog (head)` y `alembic check` No operations, Docker/liveness image approved. Validated functional code: `35ff901855397c024cee50fa590c6c05a7f04cfe`. Previous IQ `42506050141` had detected two HTTP mapping failures in PATCH with incompatible type/unit; they were corrected and both cases are now happening. **Local Windows validation of E2-3 B is still pending**; the last confirmed local result is 407/407 of E2-3 A.

## 22. E2-3 C — CU-05: deactivate/reactivate tab

**E2-3 C (08/11/2026):** implemented `PATCH /api/v1/businesses/{business_id}/catalog/{item_id}/status` with exclusive body `{"status":"ACTIVO"}` o `{"status":"INACTIVO"}`, strict validation and rejection of extra attributes (422). The path revalidates session and membership and requires an ACTIVA company owner/manager to write (401/403/404/409 as the case may be).The article is blocked inside the tenant and changed status in a single transaction.The repeated change is idepotent, without altering `updated_at`. The inactive article remains visible on GET/listed, with UUID, name and SKU reserved even for duplicate highs; there is no DELETE or fictitious stock. Generic PATCH maintains `status` This functionality also does not modify the independent field `sellable`.

**Units:** future purchases/sales must prohibit new movements with INACTIVE chips and keep real historical snapshots. There are still no commercial operations or integrated frontend; therefore, there is no real restriction on unit change for previous transactions either. No new migration: CHECK reused `ACTIVO/INACTIVO` de `e23a_catalog`.

**Tests:** CI E2-3 C **3/3 work adopted**, **527 passed** in Python 3.12 and 3.14 with PostgreSQL, `e23a_catalog (head)`, `alembic check` no operations and correct Docker; code `c2153ab9b65b265eb46b3081079e0f3f15002215`. E2-3 B: **498 passed en Windows (55.79s)**, Docker/API/DB saludables. **E2-3 C: Windows pending**. The subsequent documentary committ is not equivalent to another IC execution.

## 23. E2-3 D — CU-05: negativas y rollback

**E2-3 D (08/11/2026):** the existing Catalogue was strengthened, **without adding tables or migrations**. New tests verify Unicode NFKC+ equivalences `casefold` in names, SKU NFKC and ASCII capitals, rejection of invalid controls and forms, overflowing `name_key` per Unicode expansion, strict integer amounts (no booleans or decimals), differentiation between `PATCH` field and with `null` Explicit, incompatibility SERVICE/physical unit, protected fields of `/status`, name/SKU collisions even in INACTIVE chips, independence between two companies of the same user, session recovery after 409, and rollback provoked after `flush` both in high and in edition. A ceiling was added to `offset` catalogue (`9_223_372_036_854_775_807`, BIGINT PostgreSQL): exceed it produces 422 before running SQL, maintaining `limit` de 1 a 500 y `offset` The five Catalog endpoints retain their contracts and business permits; no stock is created.

**Scope and limits:** NICK `(business_id,name_key)` y `(business_id,sku)` and existing transactions/blocks protect against collisions; tests exercise actual duplicates and recoveries in PostgreSQL, **but are not simultaneous load/concurrence testing with multiple independent connections**. The latter is registered as future verification before production. There are not yet purchases, sales, movements or snapshots, so you cannot check a unit/state change rule with real business history. `sellable` does not replace `status`. Do not connect frontend DEMO or E2-1/E2-2 for this cut.

**IC evidence of code D:** commit `bf4fd3fa809c9f4e6afdeb064a155acf233b1722`, GitHub Actions run 42508771222: **3/3 work adopted**, **580 passed** en Python 3.12 y Python 3.14 con PostgreSQL, Docker build/liveness aprobado, `e23a_catalog (head)` y `alembic check` No difference. **Local Validation Windows E2-3 C:** 527 passed in 59.60s, healthy containers and `/ready` Right. **Local Validation Windows E2-3 D:** Do not confuse remote IC with tests performed on the author's computer.

## E2-3 E — CU-05: model, tests and bounds reconciled

**E2-3 E (08/11/2026) — functional closure:** E2-3 A/B/C/D implemented `CatalogItem`/`catalog_items`, migration `e23a_catalog`, five REST operations (GET/POST collection, GET/PATCH detail, PATCH status), permissions for tenant and role, canonical name and SKU unique within the company, four classes ELABORATED/REVENT/INSUMO/SERVICE, type GOOD/SERVICE derivative without duplicate column, optional amounts in cents and reversible deactivation without erasing chips or releasing keys. No stock is created when registering an item. **PlantUML 03A v0.7 source and its editorial SVG have already been reconciled** with the actual Catalogue; `Proveedor` Go on, TO-BE.

**Windows D checked by the developer:** 580 passed in 66.45 s, `e23a_catalog (head)`, `No new upgrade operations detected.`, API y PostgreSQL Docker `healthy`, `/ready` → `ready/ok`. **CI D:** run 42508771222, SHA `bf4fd3fa809c9f4e6afdeb064a155acf233b1722`, 580 Python tests 3.12 and 3.14, 3/3 jobs approved. Subsequent changes only of UML/documents do not constitute new IC execution.

**Explicit pending:** no double-high test was performed at the same time with two independent connections and no sustained load. There are still no purchases, stock, sales, commercial snapshots or use of SELL/STORE permissions in real operations. The rules on type/unit changes with business history should be applied when these modules exist. React continues DEMO without HTTP integration. E2-1/E2-2 and diagrams 03B/03C remain out of reach. The block is prepared for **independent audit** and is not declared audited or ready for production.
