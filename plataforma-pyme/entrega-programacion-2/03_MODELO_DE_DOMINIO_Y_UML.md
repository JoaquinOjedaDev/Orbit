# 03 — Modelo de dominio y diagramas UML

**Project:** Orbit — Generalistic multi-company and multi-rub management platform  
**Materia:** Programming 2 — UNSAM, second quarter of 2026  
**Version:** 2.1 — E2-7 / T12-C1 (approved for documentary publication)  
**Date of cut:** 11 November 2026  
**Functional reference:** `main` `c6a77137cf82dcb9aad225645e84b1265b1da3ec` (merge PR #45, T11).  
**Documentary reference:** PR #46, rama `docs/e2-7-t12-cierre-academico`, **updated document in T12-C1**.  
**Documentary status:** **T12-C1 approved and published in documentary branch; PR #46 remains DRAFT**. AS-IMPLEMENTED writing contrasted with ORM models, service rules and technical cut migrations; diagrams 03A/03B/03C, SVG and guides were reconciled and published during T12-C2/C3/C4; cross-sectional review is documented in the T12-E minutes. **No new tests were carried out to produce this document.**
**Decision to publish:** approved the replacement of Document 03 in the documentary branch on 11/11/2026. This approval does not authorize merge to `main` or changes to the code or database.

> **Reading Convention.** This text describes the kernel **REAL** already implemented to the indicated cut. **DEMO**, **DIFFERENT** y **POST-T12 PROPOSALS** not to confuse a conceptual domain model with an exhaustive reproduction of all columns in the SQL schema; [Tracer matrix of Document 05](05_MATRIZ_API_Y_TRAZABILIDAD.md) and the code is the real source of the API. Diagrams 03A/03B/03C are now updated and linked in the [chart index](diagramas/README.md); compilation with the PlantUML engine remains as external pending control.

---

## 1. Purpose and limits of the document

The model explains how a global identity manages or integrates several isolated companies (*tenants*), how commercial resources are recorded and how the integrity of purchases, receptions, balances, movements and sales is preserved. **entities, associations, cardinalities, states, restrictions, authorization and atomic operations**as well as the relationship between conceptual classes and persisting entities.

**Core in force:** RF-01 to RF-07 and CU-01 to CU-12, with React REAL, FastAPI and PostgreSQL. This classification identifies the nuclear capabilities implemented, not a total equivalence between the backend and all visual components of DEMO. **No son backend REAL del recorte:** RF-08 (Cash/day), RF-09 (Financial Accounts) and RF-10 (Illustrative QR/Meeting Payment). Your DEMO screens do not credit money, are not bank accounts and must not mutate the REAL API. Nor were stock reservations implemented, production by recipe/lots, partial or multidestiny reception, returns, refunds, bank reconciliation, OAuth nor webhooks of Market Payment.

The platform is multi-rub; **WALOS is just an example of business**. The creation of a company does not create fictitiously local, products or balances. It is valid to operate as a service company without physical inventory.

### 1.1 Evidence criteria

- **Implemented:** class, contract, migration or verifiable rule in the indicated code cut.
- **Tested:** there is evidence of referenced execution; do not confuse previous execution of T11 with a new execution of T12.
- **Conceptual:** useful name or relationship to understand the business, even if it does not have a table with the same name.
- **Deferred:** proposed functionality or evolution that should not appear in UML as operational persistence.
- **History:** text belonging to a previous cut, without precedence over this version.
- **Post-T12 proposal:** explicit objective of evolution, without persisting classes, routes or evidence currently accredited.
- **Not certified:** a contract and proof exist not proof preparation for production, bank accreditation or comprehensive accessibility.

## 2. Vocabulary and conventions

| Concept | Current meaning |
|---|---|
| **User** | Global identity; it has no global corporate role. |
| **Company/tenant** | Independent scope of data, permits and commercial records. |
| **Membership** | User-Company link with role and status; enables contextual authorization. |
| **Allocation** | Link from member to headquarters; condition SELL/STORE for operational roles. |
| **Location** | Location, fair, warehouse, office, house or other space with capacities `can_sell` y `can_store` separate. |
| **Item** | Catalogue record: prepared, re-input or service. `BIEN`/`SERVICIO` is a classification **derivative** of the type of article. |
| **Supplier** | Commercial contact of a company; it is not authenticated user because it is supplier. |
| **Purchase** | Acquisition register; does not change stocks by itself. |
| **Receipt** | Complete and unique physical confirmation of the goods of a purchase to a headquarters. |
| **Balance** | Transactional projection by company, headquarters and article, with version. |
| **Movement** | Unchangeable input/output made to allow the origin of variation to be reconstructed. |
| **Operation inventory** | Grouping of transfer, adjustment of input/output or initial load. |
| **Sale** | Commercial fact `CONFIRMADA`, in detail, payments **declared** and eventual physical debit. |
| **Idempotency** | Same application identity + same content + actor/environment produces the same effect, not duplicates. |

**Money:** wholes of cents, without `float` persisting. **Quantities:** whole in thousandths (`quantity_milli`, `delta_milli`); discrete units such as `UNIDAD`, `PAQUETE`, `CAJA` y `SERVICIO` multiples of 1,000 are required when applicable. **Commercial rounding:** `HALF_UP` por **line**, not by subtotal added.

Domain nomenclature (e.g. `MovimientoInventario`) serves to explain the concept. The implementation uses Python/SQL names in English (`StockMovement`, `stock_movements`). Do not infer that the name UML is a different table.

## 3. Inventory of persistent classes — conceptual correspondence ↔ ORM ★ SQL

**Inventory result:** 19 ORM models of domain and infrastructure identified in `backend/app/infrastructure/models/` (excluding `base.py` ni `__init__.py`) The current scheme is derived from migrations up to `e26a_sales_foundation`.

| Area | Concept class / support | Modelo SQLAlchemy | SQL table |
|---|---|---|---|
| Identity | User | `User` | `users` |
| Identity | Technical session | `AuthSession` | `auth_sessions` |
| Company | Company | `Business` | `businesses` |
| Company | Membership | `Membership` | `memberships` |
| Company | Invitation | `BusinessInvitation` | `business_invitations` |
| Support | Application for business creation | `BusinessCreationRequest` | `business_creation_requests` |
| Sedes | Location | `Location` | `locations` |
| Sedes | AllocationLocation | `LocationAssignment` | `location_assignments` |
| Catalog | Article | `CatalogItem` | `catalog_items` |
| Suppliers | Supplier | `Supplier` | `suppliers` |
| Purchases | Purchase | `Purchase` | `purchases` |
| Purchases | DetailBuy | `PurchaseLine` | `purchase_lines` |
| Receipt | Receipt | `PurchaseReceipt` | `purchase_receipts` |
| Inventory | Inventory balance | `StockBalance` | `stock_balances` |
| Inventory | Inventory Movement | `StockMovement` | `stock_movements` |
| Inventory | OperationInventory | `InventoryOperation` | `inventory_operations` |
| Sales | Sale | `Sale` | `sales` |
| Sales | DetailsSale | `SaleLine` | `sale_lines` |
| Sales | ApplicationPayment | `SalePayment` | `sale_payments` |

**Correction for the previous diagram:** no generic table exists in the current scheme `SolicitudIdempotente` for all commands. `BusinessCreationRequest` specifically protects business creation; `Purchase`, `PurchaseReceipt`, `InventoryOperation` y `Sale` preserve `request_id` and digest the application in its own register. Idempotency is a **rule distributed by aggregate**not a single universal physical association.

## 4. Identity, company and equipment (RF-01, RF-02 and RF-03)

### 4.1 User, session and ownership

`User` represents the global identity. Standardized mail is unique, password is preserved as hash and user can have multiple memberships. `AuthSession` records the hash of the token, its expiry and possible revocation; **Token opaque is clearly not a business relationship or a commercial UML data**. The REAL frontend retains the Bearer **only in execution memory** and requires re-Login when refreshing the page (`F5`) This is a **limited experience in force** And a security decision, not a model's integrity failure.

**Post-T12 evolution (not implemented):** study a renewable session mechanism using cookies `HttpOnly`, `Secure` y `SameSite` and appropriate measures against CSRF, session fixing and misuse. Do not save Bearer in `localStorage` o `sessionStorage` without a threat analysis, or presenting the future mechanism as already available.

`Business` name, category/category, type of activity (`PRODUCTOS`, `SERVICIOS`, `MIXTO`), status and `founder_user_id` **history**. When creating the company, the transaction produces the company and initial membership `TITULAR_ADMINISTRATIVO` active, without creating a default location. Do not interpret the historical founder as legal holder or as an independent perpetual authorization of membership.

`Membership` unites a user with a company, with independent PK, role and status. `UNIQUE(business_id,user_id)`. Persisting roles are `TITULAR_ADMINISTRATIVO`, `ADMINISTRADOR`, `ENCARGADO`, `TRABAJADOR`; states are `ACTIVA` e `INACTIVA`. The partial index `uq_memberships_one_active_owner` Guarantee **at most one active holder** in an undertaking; **does not prove by itself that there always exists one**. La **initial existence** The owner is assured by the transactional creation of company+membership; subsequent modifications are restricted by service. In particular, the method of editing the team rejects both the self-editing of its own membership and the modification of a role membership `TITULAR_ADMINISTRATIVO` (including historical ones), so **there is currently no public operation to degrade or revoke the holder**. Acceptance of an invitation must not overwrite historical ownership either. **It is not correct to propose a service rule here. `COUNT(owners) > 1`** as if it were implemented: the transfer of title is deferred. The SQL index, by itself, imposes only * at most one* active.

### 4.2 Invitations and acceptance

`BusinessInvitation` preserves company, mandatory issuer, standard mail of the recipient, proposed role, hash token, maturity, status and, after acceptance, acceptor and date. **It does not require that there be a prior `User` for guest mail**. An open invitation does not create membership or permissions. Authenticated acceptance verifies identity/mail and creates or reactivates the membership in the same transaction.

Stockable States: `PENDIENTE`, `ACEPTADA`, `RECHAZADA`, `CANCELADA`, `EXPIRADA`. Do not equate expired maturity date with immediate physical transition of value `status`: the validity is checked during the operation. The role proposed in the invitation is restricted to `ENCARGADO` o `TRABAJADOR`; no invitation to a holder is allowed for this mechanism. There is a partial single pending invitation rate per company/mail and the secret only persists as SHA-256 hash.

### 4.3 Locations and allocations

`Location` belongs to an enterprise; admits `LOCAL`, `FERIA`, `DEPOSITO`, `OFICINA`, `CASA` u `OTRO`status `ACTIVA`/`PAUSADA`, address/map reference fields, independent capabilities `can_sell` y `can_store`, and indicator `is_primary`. A partial index guarantees **at most an active headquarters** by company; does not require at least one. Pause a principal removes that condition; reactivates it does not automatically restore it.

`LocationAssignment` link `(business_id, location_id, user_id)` and saves status `ACTIVA`/`REVOCADA`Its composite foreign keys verify that the seat and membership belong to the same tenant. **Assignment does not create a new business role**.

**Operational authorization in force:**

- Owner and administrator act according to business permits and location capabilities, without requiring individual assignment to each headquarters.
- Maintainer and worker need active membership and **active assignment at headquarters** for SELL/STORE operations; the assignment is revalidated in FastAPI, even if React does not display a location.
- `can_sell` does not imply `can_store`Transfers require STORE in **origin and destination**. A sale of physical good requires **SELL y STORE en su misma sede**: SELL to operate the sale and STORE to discount stocks. Reading balances can cover own tenant headquarters without granting right to trade there.
- The function permissions are not identical: for example, creating a purchase requires a holder/manager; `STOCK_INICIAL` requires a holder/manager, while ordinary adjustments may also be authorized for the service manager. Do not state that any worker can adjust balances.

Effective authorization always depends on the backend: user, session, membership, company, role, headquarters, status, capacity and assignment as appropriate.

## 5. Catalog and suppliers (RF-04, RF-05)

`CatalogItem` belongs to a tenant and registers `kind` (`ELABORADO`, `REVENTA`, `INSUMO`, `SERVICIO`), name and password for standardization, category, optional SKU, unit, condition `sellable`optional price and referential cost in cents, status and metadata. `BIEN`/`SERVICIO` se **deriva** de `kind`; is not another column persisted. A service uses unit `SERVICIO`; goods use compatible physical units.

Standard name is unique per company; standard SKU is unique **when reported**even for inactive items. `ACTIVO`/`INACTIVO` are low logic: historical transactions retain snapshot and FK. The release of the article **does not create stocks**. An inactive card should not be sold as a new transaction.

`Supplier` es **REAL**, not TO-BE: maintains unique standardized name and key by company, contact details, networks, references, notes, payment methods and referential promotions in JSONB, more status `ACTIVO`/`INACTIVO`. A purchase may not have a supplier; if it does, the tenant is validated and the historical name of the supplier is retained. **does not involve credited payments or integrated bank accounts**.

## 6. Purchases and receptions (RF-05; CU-06 and CU-07)

### 6.1 Compra y detalle

`Purchase` contains `business_id`, `request_id`, `request_sha256` (nullable in the compatibility model), optional supplier, `supplier_name_snapshot`, date of purchase, status, total amount, reference/notes, actor and creation date. `PurchaseLine` contains your company, buys, `line_number`, optional item, description snapshots, type, unit and SKU, quantity, unit cost and total line.

The line can be a **physical well**, **service** o **free concept without article**Only catalog goods originate from receipt of inventory. The API calculates amounts from quantities and costs with exact rounding rule; the customer cannot impose an inconsistent subtotal. **no stock change**.

**States in the SQL model:**

| Status | Current meaning and transition |
|---|---|
| `REGISTRADA` | Purchase with physical goods pending receipt. |
| `RECIBIDA` | Physical purchase after full receipt confirmed. |
| `CERRADA_SIN_RECEPCION` | Purchase of services/concepts that do not allow physical entry. |
| `CANCELADA` | **Capacity of the SQL schema, public endpoint deferred**. That CHECK allows value does not implement transition or operation `PATCH/POST` cancellation. |

### 6.2 Complete reception

`PurchaseReceipt` store company, purchase, location STORE, `request_id`, `request_sha256`, actor, confirmation time and `balances_after` JSONB (snapshot de respuesta, **no** second authoritative balance).A purchase may possess **0..1** reception and unity `(business_id,purchase_id)` prevents a second physical confirmation. The receipt of the MVP is **complete and in a single destination**Services/concepts do not create movements.

The transaction revalidates membership, STORE capabilities and headquarters status; it persists receiving, moving balances and generates movements by physical lines, marking purchase as `RECIBIDA`. Failure at any step leaves rollback complete. Repeating with equal key/body/actor recovers the result; re-receiving with another key does not create a second reception.

## 7. Physical inventory, leader and operations (RF-06; CU-08, CU-09, CU-11)

### 7.1 Balance and units

`StockBalance` uses PK composite `(business_id,location_id,catalog_item_id)`, `quantity_milli >= 0` y `version` positive, with date of update. It represents the balance materialized to consult and protect competition; **does not replace** an absence row is interpreted as zero to decide an output; no inventory is invented. For a first entry, secure concurrent creation/update, no reading+insertion without control is used.

### 7.2 Auditable movement

`StockMovement` company save, headquarters, article, actor, type of event, signed delta and date, more compatible source references. In the current scheme appear: `receipt_id`, `purchase_line_id`, `inventory_operation_id`, `operation_kind`, `sale_id`, `sale_line_id`.

The rule is not simply “three optional FKs”: `ck_stock_movements_origin_and_sign` verify **permitted combinations** of origin, event and sign. Examples:

| Event | Source identifier | Effect |
|---|---|---|
| `COMPRA_RECEPCION` | `receipt_id` + `purchase_line_id` | Delta positive for welcome. |
| `TRASLADO_SALIDA` | `inventory_operation_id` + `operation_kind=TRASLADO` | Negative Delta at home. |
| `TRASLADO_ENTRADA` | Same transfer operation | Positive Delta at destination headquarters. |
| `AJUSTE_ENTRADA` / `AJUSTE_SALIDA` | Inventory operation of the consistent type | Delta positive/negative depending on case. |
| `STOCK_INICIAL` | Initial loading inventory operation | Positive initial discharge, with rules of absence of history. |
| `VENTA_SALIDA` | `sale_id` + `sale_line_id` | Negative Delta per physical line sold. |

The exact names and variants are restricted by the current CHECK; do not add a new type to the documentation without comparing the model. There are FKs composed by company and uniqueities that prevent duplicating reception/sale lines and operating events. The commercial fact is not “corrected” by editing or erasing a historical movement.

### 7.3 Inventory operations

`InventoryOperation` supports `TRASLADO`, `AJUSTE_ENTRADA`, `AJUSTE_SALIDA` y `STOCK_INICIAL`; contains article, unit/quantity snapshot, home/destination location when applying, mandatory motive, actor, `request_id`, hash and date. A transfer requires different locations of the same tenant and performs **two moves** with zero algebraic sum in **a single commit**.

Positive/negative adjustments are justified and permissions by role and location are respected; absolute counting uses `expected_version` in the command to prevent confirming about an obsolete observed balance. `STOCK_INICIAL` is a special operation with stronger privileges and cannot be used to double the discharge over an article/headquarter that already has history. Checks and permissions are implemented between DTO, service, transaction and SQL; not attribute everything to a `CHECK` Row.

## 8. Declared sales and payments (RF-07; CU-10)

`Sale` contains company, optional location, persisting status **only** `CONFIRMADA`, `request_id`, `request_sha256`, amounts (subtotal/uncount/total), notes, actor, date and `balances_after`. `SaleLine` saves catalogue, numbering, description/type/unit/SKU snapshot, quantity, unit price and total. `SalePayment` records sequence, method, positive amount and reference. The model supports **1 to 30 lines** y **1 to 6 payment applications** According to controls implemented.

**Main rules:**

1. The sale is a confirmed event, not a persistent cart. `status = 'CONFIRMADA'`.
2. `subtotal_centavos = Σ total_linea_centavos`; `total_centavos = subtotal_centavos − descuento_centavos`; `Σ pagos_declarados = total_centavos`. The server checks the sums; DB checks restrictions per row and does not replace the add-on check between multiple tables.
3. `total_linea_centavos = HALF_UP(cantidad_milli × precio_unitario_centavos / 1000)`. Do not round up after merging separate product lines. A zero price line may be part of a positive total sale, according to the contract; no full sales of total zero are enabled. Subtotal, discount and total restrictions are also verified in persistence.
4. Holder and administrator can operate under the price/discount policy authorised. `ENCARGADO` y `TRABAJADOR` **cannot modify the price of the catalogue or add discounts**: FastAPI requires price of defined catalog and exact equality; it is not enough to block inputs in React.
5. The sale of goods requires active headquarters with **SELL+STORE**, effective authorization and sufficient stock for all physical lines. For a sale of services only, the location can be omitted only for a holder/manager according to the current service; without headquarters, an operating role cannot confirm.
6. A service sale does not automatically deduct inputs. A mixed sale is discounted **only physical lines**; group repeated quantities of a good to check the balance without losing prices/snapshots for each line.
7. Confirm sale, details, declared payments, balances, movements and `balances_after` If one unit is missing, **nowhere** is confirmed.
8. The list/consultation of sales for operational roles is restricted to locations with active assignment; even the historical author may lose access if he lost the assignment. Inventory reading has a different policy and should not be extrapolated.

**Declared payment** The methods persisted are `EFECTIVO`, `TRANSFERENCIA`, `CUENTA_DNI`, `TARJETA` y `MERCADO_PAGO_DECLARADO`; are declarations, not conciliation. The records do not show bank transfers, collections actually received, operation credited to Mercado Pago or tax document. The empowerment of POST REAL from the local frontend remains controlled by `VITE_PYME_ENABLE_REAL_SALES` and should not be activated to prove the document on a persistent personal basis.

## 9. Idem, recovery and loss of response

The application keys are UUID that identify the **command**The relevant high and commercial commands compare identity, canonical body (digest) and scope before recovering previous results. **Do not invent a table `SolicitudIdempotente` covering all cases**.

| Operation | Where the command identity persists | Observable guarantee |
|---|---|---|
| Create company | `BusinessCreationRequest`, PK `(actor_user_id,idempotency_key)` and digest | An actor does not create two companies with the same key and content. |
| Register purchase | `Purchase.request_id`, `request_sha256`, `created_by_id` | Uniqueness by tenant/application and replay controlled. |
| Confirm receipt | `PurchaseReceipt.request_id`, `request_sha256`actor and single purchase | One full entry, with proof recovery. |
| Transfer/adjustment | `InventoryOperation.request_id`, `request_sha256`, `actor_id`, `kind` | A physical command does not produce duplicate movements. |
| Register sale | `Sale.request_id`, `request_sha256`author | Rereading by ID and `request_id`No second sale. |

The hash/actor comparison is revalidated in the service and PostgreSQL's uniqueness is the second defense against racing. An identical repetition can return the already confirmed operation; the same key with incompatible content/actor causes conflict. **Timeout or lost response does not mean confirmed rejection:** the recovery logic should treat the response as * uncertain result* and use the original command identity to verify whether there was commit. `GET /api/v1/businesses/{business_id}/sales/by-request/{request_id}` allows searching for an authorized sales voucher; availability of the endpoint **not accredited** any client automatically query all bugs. Do not automatically forward a `POST` with a new key.

**UX post-T12 enhancement:** evaluate a visual state `Verificando resultado…` to consult `request_id`, distinguish confirmed proof of undetermined result and offer safe recovery without doubling sales. Do not affirm this automation as implemented behavior without a specific test.

The frontend saves certain pending commercial commands in IndexedDB for controlled recovery (without credentials) and retains documented limitations: those data are not encrypted; they may be lost when deleting the browser or switching devices. Do not promise global semantic delivery exactly once for external systems not yet integrated.

## 10. Relationships and cardinalities of the domain

The following multiplicitys are **Conceptual status**not promises that each is imposed by an isolated FK.

| Relationship | Multiplicity and Rule |
|---|---|
| User — Membership — Company | User `1 → 0..*` memberships; company starts with active owner, without global user uniqueness; `(business_id,user_id)` unique. |
| User — Company (founder) | A company has exactly a historical founder; user `1 → 0..*` companies created. |
| Company — Invitation | Company `1 → 0..*`; invitation has issuer `1` and accept `0..1`, mail recipient without FK prior. |
| Company — Location / Article / Supplier | Company `1 → 0..*` of each resource; each resource belongs to exactly one tenant. |
| Membership + Location — Allocation | Each assignment refers to exactly one membership and one seat of the same tenant; it may be revoked. |
| Supplier — Purchase | Purchase `0..1` supplier; supplier `1 → 0..*` shopping, with historical snapshots. |
| Purchase — DetailBuy | Purchase `1 → 1..*` lines when confirming the API; each line belongs to a purchase. |
| Purchase — Reception | Purchase `1 → 0..1` full reception; the reception identifies a single STORE headquarters. |
| DetailBuy — Catalogue | Line `0..1` article; free line does not need article, but retains snapshot. |
| Company + Headquarters + Article — Balance | `0..1` balance row per single triple; absence does not mean positive stock. |
| Reception/Operation/Sale — Movement | Every move has **a valid family of origin** and, where applicable, the specific purchase or sale details. |
| OperationInventory — Movement | Confirmed transfer `1 → 2` physical events; initial adjustment/stock confirmed `1 → 1` event. |
| Sales — DetailSale | Sale `1 → 1..*` lines, each linked to an article of that tenant. |
| Sales — ApplicationPayment | Sale `1 → 1..*` the amount of payments declared, which is reconciled with the total. |
| Sales — Location | Location `0..1` on sale; `null` only for service under specific rules and roles. |

A SVG can hide transverse associations by readability, **But you mustn't invent cardinalities.**Physical KFs and omitted associations must be included in their correspondence guide or annex.

## 11. Integrity: What SQL Guarantees and Validates the Application

| Invariant | Specific layer and reference |
|---|---|
| Membership unique | SQL `uq_memberships_business_user`. |
| At most one active holder | Partial SQL Index `uq_memberships_one_active_owner`; maintenance of initial holder and in-service editing protections. |
| At most an active headquarters | Partial SQL Index `uq_locations_one_active_primary` and CHECK main active. |
| Article name/SKU per tenant | SQL `uq_catalog_items_business_name`, partial index `uq_catalog_items_business_sku`. |
| Identity between company and linked resource | FK composed of `business_id` in operating tables + FastAPI authorisation checks. |
| A reception per purchase | SQL `uq_purchase_receipts_business_purchase`; service validates status and transaction. |
| Non-negative stock and versioned balance | SQL `ck_stock_balances_quantity_nonnegative`, `ck_stock_balances_version`; conditional debit, UPSERT and transactional lock in service. |
| Coherent origin/event/sign | SQL `ck_stock_movements_origin_and_sign` and composite FK; service creates correct events. |
| Do not duplicate physical events | Single `uq_stock_movements_receipt_line`, `uq_stock_movements_operation_event`, `uq_stock_movements_sale_line`. |
| Price/rounding of line | CHECK line `ck_sale_lines_half_up_total` / `ck_purchase_lines_half_up_total`; checking and calculating the command in service. |
| Total/dec/payments | SQL controls amounts and arithmetic ratio within `Sale`; **amounts between rows** are verified in transactional service. |
| Role, headquarters, SELL/STORE, allocation | FastAPI, session/membership and authorization services; cannot be resolved with a CHECK that consults other tables. |
| Idempotence by command | PK or NICK in commercial table, digest and actor tested by service; replay controlled. |

### 11.1 Conflict and operator communication errors

Current HTTP contracts contemplate errors such as `401` (unvalid meeting), `403` (insufficient permission), `404` (non-visible or non-existent resource), `409` (conflict) and `422` (validation). **Doesn't mean all endpoints return all codes.** In particular, the settings router maps version conflict to HTTP `409` with textual detail ‘Version of obsolete balance or non-existent balance’; a structured error code called `STALE_BALANCE_VERSION`.

**UX/API evolution, not implemented in this document:** evaluate stable and typed error responses, plus specific messages in React (for example: ‘The stock changed from the last count. Update balances before adjusting’). Any new error contract would require code change and testing at a later stage: T12 does not introduce it.

**Academic note:** PostgreSQL does not allow to use a `CHECK` The composite FKs resolve referential membership to the tenant, while states, authorization and aggregate summarizations need service logic and transactions. Nor should it be stated that a “at most one” restriction ensures “exist exactly one”.

## 12. Transactions and concurring

### 12.1 Business seniority

Check session/actor, register creative identity, create `Business` and initial holder `Membership` in a commit. Avoid duplicates by `BusinessCreationRequest` and uniqueness. Do not automatically create `Location`, `CatalogItem` or balance.

### 12.2 Purchase → reception → existence

1. Create `Purchase` y `PurchaseLine` con snapshots, sin stock.
2. Register Status `REGISTRADA` if you have physicists, or `CERRADA_SIN_RECEPCION` if it contains only non-receptible concepts.
3. Upon receiving, revalidate actor, tenant, state and headquarters STORE; prevent second reception.
4. Create `PurchaseReceipt`; accrediting goods with UPSERT concurrent insurance on `StockBalance`, generate entries `StockMovement` by physical line and persist `balances_after`.
5. Change purchase to `RECIBIDA` and make a single commit; any exception requires total rollback.

### 12.3 Stock transfer

1. Check the same company, active physical item, different locations, both STORE, permits and assignments.
2. Conditional origin (`quantity_milli >= solicitado`); if no balance exists, refuse.
3. Accrediting Destination with UPSERT; persist `InventoryOperation` and two `StockMovement` (`TRASLADO_SALIDA`, `TRASLADO_ENTRADA`).
4. Commit conjunto y replay por la clave original. **Net change in article between the two venues: zero.**

### 12.4 Adjustment/initial charge

Verify allowed role, STORE headquarters, motive, quantity/unit and, for absolute counting, expected version. The server controls the initial load history and records atomic operation/movement/sald. A zero difference does not justify creating a fictitious movement. A past move must not be edited to “correct” the balance.

### 12.5 Mixed sale

1. Revalidate company, membership, role, pricing policy and headquarters. For goods: SELL+STORE and allocation when applicable.
2. Validate active/sellable tokens, quantities, price/discount and exact sum of payments declared.
3. Add physical quantities per item for availability control, preserving individual sales lines.
4. To hold balances on condition of adequacy; to register `Sale`, `SaleLine`, `SalePayment`, movements `VENTA_SALIDA` y `balances_after` within the same transaction.
5. Confirm in full; in case of lack/concurrence, reverse the voucher, declared payments and attempts movements.

### 12.6 Cases of concurring that should be retained as evidence

- Two sales on the last unit: one confirms and another receives controlled conflict, with no negative balance or partial payment.
- Two receptions of the same purchase with different keys: one reception; no double income.
- Two simultaneous entries on non-existent balance: correct sum without doubling row.
- Simultaneous transfer and sale: consistency of origin/destination and ledger after commit/rollback.
- Ajuste con `expected_version` obsolete: rejection without movement.
- Repeating a `request_id` with different hash: conflict and no added effect.
- Revocation or assignment of a worker to one headquarters only: does not obtain operational capacity over another.
- Company A/B: the queries and deeds of one tenant are never enabled to know the UUID of another.

Transaction/concurrence tests should be executed **Against PostgreSQL isolated**, do not deduce from a purely unitary test or simulate two clicks.

## 13. Entity States — synthesis

| Entity | Persisting States and Accuracy |
|---|---|
| User | `ACTIVO`, `DESHABILITADO`; not infer business role from `User.status`. |
| Company | `ACTIVA`, `SUSPENDIDA`; **no** public API is declared to suspend even if the state exists in SQL. |
| Membership | `ACTIVA`, `INACTIVA`; title protected by index and rules. |
| Invitation | `PENDIENTE`, `ACEPTADA`, `RECHAZADA`, `CANCELADA`, `EXPIRADA`; issue access - . |
| Location | `ACTIVA`, `PAUSADA`; main only active. |
| AllocationLocation | `ACTIVA`, `REVOCADA`; date of consistent revocation. |
| Item | `ACTIVO`, `INACTIVO`; lowers logic without destroying snapshots. |
| Supplier | `ACTIVO`, `INACTIVO`; lower logic. |
| Purchase | `REGISTRADA`, `RECIBIDA`, `CERRADA_SIN_RECEPCION`, `CANCELADA` (last no public endpoint compromised). |
| Sale | Only `CONFIRMADA` en tabla `sales`; draft cart lives in UI. |
| Operation inventory | Su `kind` discriminates operation, not a commercial draft state. |

## 14. Observable architectural design patterns and decisions

Document 04 develops architecture; here is the correspondence between **pattern, actual implementation, benefit and limit** to facilitate technical defense. Do not confuse *classic GoF patterns* with business architecture patterns, HTTP contracts or SQL restrictions. A state rule does not automatically equal the GoF pattern **State**; copying historical attributes does not imply having implemented a class **Memento**.

| Pattern / technique | Specific evidence in the project | Benefit and precision |
|---|---|---|
| **Repository (Psistence Pattern)** | Files like `businesses/repository.py`, `purchases/repository.py`, `catalog/repository.py`; other areas, such as `sales/service.py`, run SQLAlchemy queries directly | Encapsulates queries in several modules; **no** declare that all accesses are abstracted by a uniform repository. |
| **Service Layer (applicability layer)** | `app/modules/*/service.py`; session revalidation, tenant, permissions, calculations and invariants | Coordinates use cases; avoids relying on frontend data or controls only. |
| **Unit of Work as a transactional limit** | `Session` de SQLAlchemy, `flush()`, `commit()` y `rollback()` in commercial transactions | Guarantees atomisation per operation in a work unit; **no** identifies a class of its own `UnitOfWork` generic in the revised inventory. |
| **Commercial Data Snapshot** | `purchase_lines.*_snapshot`, `sale_lines.*_snapshot`, `purchases.supplier_name_snapshot`, `balances_after` | Preserves the context of a transaction despite subsequent changes to the catalogue; it is snapshot technique, **no** proven implementation of the GoF Memento. `balances_after` is evidence of response, not another source of balance. |
| **Idempotent request / replay secure** | `BusinessCreationRequest` and columns `request_id`/`request_sha256` of purchases, receptions, operations and sales | Avoids duplication of effects in response to lost responses; it is not presented as a queue consumer or as a guarantee of *exactly eleven* on external suppliers. |
| **State machine as domain rules** | `Purchase.status`, `BusinessInvitation.status`, `Location.status`; validations and transitions in services | Controls valid changes; **no** It is claimed that there are polymorphic classes of the GoF State pattern. |

**Defensible example:** `POST /sales` validates session, role, prices and location permissions in the service; in a single SQL transaction creates `Sale` with its lines/payments, debit `StockBalance` and generates `StockMovement`; `request_id` y `request_sha256` make it possible to recover the voucher and refuse incompatible retry. Each component solves a different problem: **separation of responsibilities, atomisation, traceability and idempotency**.

**Defence criterion:** To prove patterns that appear in the code and differentiate them from proposed refactorings. The official slogan of the subject is the source to specify minimums and evaluation weights: not to infer percentages of note from an external review without checking this slogan.

## 15. Traceability to requirements, APIs and tests

| RF / CU | Central entities | API / REAL tour | Evidence available |
|---|---|---|---|
| RF-01 / CU-01 y CU-02 | `User`, `AuthSession` | Log, login, `me`, logout | T11 E2E registration/session and backend suites. |
| RF-02 / CU-03 y CU-12 | `Business`, `Membership`, `BusinessInvitation`, `BusinessCreationRequest` | Companies, invitation, acceptance, equipment | Invitations/equipment backend and multi-company navigation. |
| RF-03 / CU-04 | `Location`, `LocationAssignment` | Locations, headquarters, assignments | QA of permissions and visibility by T11 headquarters. |
| RF-04 / CU-05 | `CatalogItem` | High/editing/state and pagination | E2E CRUD/Persistence. |
| RF-05 / CU-06 y CU-07 | `Supplier`, `Purchase`, `PurchaseLine`, `PurchaseReceipt` | Supplier/purchase/single reception | Purchase flow→reception and recovery. |
| RF-06 / CU-08, CU-09 y **CU-11** | `StockBalance`, `StockMovement`, `InventoryOperation` | Balances, ledger, transfer and adjustment | Tests PostgreSQL, Playwright REAL de inventario. |
| RF-07 / CU-10 | `Sale`, `SaleLine`, `SalePayment`, `StockMovement` | POS, list, voucher and query by `request_id` | T11 mixed sale, replay and payment/price policies. |
| RF-08 a RF-10 | **No Real Core Similar Tables** | DEMO/DIFFERENT | Demo isolation verified; no actual collection. |

**Source of routes and tests:** [Document 05 in force](05_MATRIZ_API_Y_TRAZABILIDAD.md) y [Document 02 in force](02_CASOS_DE_USO.md). T12-B reconciliation verified **46 combinations method+path** de **13 routers** mounted under `/api/v1`; `GET /health` y `GET /ready` They're techniques apart.

**Preexisting technical evidence T11, not executed for this draft:** Full-stack GitHub Actions #43015544889: **892 Pytest, 38 Playwright REAL y 6 Playwright DEMO aprobadas**; [audit T11 of 26 criteria E27](../docs/E2-7_T11_E_AUDITORIA_FINAL_PREMERGE.md) y [39 step manual actuator](../docs/E2-7_T11_D2_ACTA_PRUEBA_MANUAL_REAL.md). T11 covers functional scope/smoke: it is not a general certification of accessibility, safety or commercial production.

## 16. Specification to be fulfilled by diagrams (T12-C2/C3/C4)

**03A — Identity, companies, offices, catalogue and supplier.** Show current business classes and relationships. Represent `LocationAssignment` and the correct cardinalities; not to declare `Supplier`, SELL/STORE or invitations like TO-BE. Differentiate `founder_user_id` history of `Membership` active. Sessions and creation requests are technical support and can go in a panel/guide, not necessarily in the main view.

**03B — Purchases, receipt, inventory and sales.** Use `Purchase`, `PurchaseLine`, `PurchaseReceipt`, `StockBalance`, `StockMovement`, `InventoryOperation`, `Sale`, `SaleLine` y `SalePayment` as verifiable mapping. Correct the four `kind` inventory, movement relationships with physical line, FK by company, states, snapshots and `request_id`/digest. Replace the persistent fiction class `SolicitudIdempotente` In a general sheet, technical metadata can be summarized to maintain readability; the guide contains the detail.

**03C — Cases of use.** Keep CU-01 to CU-12, with CU-12a/12b as two goals of the CU-12. Use external actors as a visitor, authenticated person and commercial functions exercised by members with roles **persisted** (`TITULAR_ADMINISTRATIVO`, `ADMINISTRADOR`, `ENCARGADO`, `TRABAJADOR`); a functional actor ‘inventory operator’ may remain if it is clarified that **is not a fifth SQL role**. Respect headquarters/assignment; do not draw API, database or system as external actor. Label REAL and delayed accurately. CU-11 corresponds to **RF-06**, no a RF-07.

**Control SVG vs PlantUML:** current editorial sheets are not rendered literal from sources `.puml`; each correction requires checking semantic equivalence, text, relationships and readability. **The above images still show TO-BE labels and should not be presented as approved current diagrams.** Until C2/C3/C4 is completed, consult the [historical sources and guides](diagramas/README.md) With this warning.

## 17. Deferred decisions and capacities

| Item | Decision of this version |
|---|---|
| Partial receptions/multi-destiny | Do not model as REAL; future line reception and multiple deliveries will require redesign of cardinalities. |
| Services with inputs | A service does not consume stock automatically; recipes, consumptions and delayed operating minima. |
| Manufacture/lots/reserves | They are not included in the current persistent core. |
| Return/sales cancellation | Do not draw non-existent states/endpoints as operatives. |
| Expenditure, cash and financial accounts | RF-08/09 DEMO, no bank reconciliation in REAL backend. |
| QR Recovery, Market Payment | RF-10 Illustrative DEMO; OAuth, collection preference, webhook and future accreditation. |
| Business status suspended | It exists in SQL, no unverified public API is attributed. |
| Data security pending | Unencrypted IndexedDB is a residual risk; do not store tokens or promise recovery between devices. |
| UX, accessibility and deployment | Model documentation does not constitute WCAG audit or production certification. |

## 18. Post-T12 objectives — evolution sheet, not implemented

This section records confirmed needs for the project **after the documentary closure T12**. Does not modify the evaluation of the core RF-01..07 nor does it transform DEMO screens into API. Its function is to prevent technical documentation from closing the path to subsequent evolution.

### 18.1 Convergence of REAL Experience ↔ DEMO

**Objective:** improve the use and presentation of REAL screens by taking DEMO already worked as a functional and visual reference: navigation, side menu, company panel, catalog, purchases, inventory, sales, form composition, messages and responsive behavior. **No proposal to replace the authoritative backend with `demoStore`**.

Criteria for future increase:

1. Invent screens and streams **DEMO** against its counterpart **REAL**, with a matrix *to preserve / adapt / to differ*.
2. Maintain enterprise isolation, role limits and effective server validations while reorganizing the interface.
3. Separate purely aesthetic improvements of DEMO functionalities that do not yet have REAL contracts (box, financial accounts, QR); the latter should not be presented as operational.
4. Unify visible field name, non-editable unit price for restricted roles, quantity, total per line, location notices and accessible error handling; validate desktop, keyboard and mobile.
5. Require real E2E regression tests and DEMO tests after each adaptation, regardless of whether local data is automatically imported into the tenant.

**Status:** POST-T12 proposal; does not constitute a requirement to alter Document 03 in this delivery.

### 18.2 PostgreSQL scheme display (ER diagram)

**Objective:** produce a view **entity–relationship of the actual physical scheme**, complementary to the conceptual UMLs 03A/03B. An introspection-generated ER diagram teaches tables, PK, FK and base cardinalities; UML diagrams also explain cases of use, rules and concepts. **They're not the same artifact.**.

**Recommended initial alternative:** DBeaver or an equivalent connected ERD tool **in reading mode** to a PostgreSQL instance of isolated test, with Alembic migrated to `e26a_sales_foundation`; generate an overview of the 19 tables and partial views by identity, trade and inventory. DBeaver allows diagrams of existing schemas and export in graphic formats (depending on editing). [Documentation of DBeaver diagrams](https://dbeaver.com/docs/dbeaver/ER-Diagrams/).

**Other options:** PgAdmin ERD, DBML/dbdiagram.io from a revised scheme or an instance hosted in Supabase **only if it is expressly decided to change the environment**. Supabase is not a delivery requirement nor does it involve an automatic transfer of PostgreSQL. **you must not modify, delete, migrate or publish real data**and any export should exclude personal credentials and records.

**Subsequent acceptance criterion:** diagram traceable to the real head of Alembic, readable on a global level and by modules, without invented relationships or changes in `main`/base local por la tarea visual.

### 18.3 Web and mobile navigable demonstration

The system already has React/TypeScript and Vite: the initial demo should use the **existing REAL application** in a browser and an isolated FastAPI/PostgreSQL environment, with test data; no need to compile a native mobile application. Show responsive views using browser development tools (viewport phone/tablet) and Playwright automation. If you want a packaged PWA or mobile app, it will be a separate and subsequent decision.

The demo exhibition must prove the path registration/login → company/sedes → catalog → purchase/reception → inventory → POS → proof, with limits of roles and error responses. When presenting DEMO local screens, identify them explicitly and not mix them with REAL data. Do not enable physical sales on the persistent basis of manual tests just by making a presentation.

### 18.4 Market Real QR Payment per Company

**Future objective:** that each company connects **your own authorised Market Payment account**, without sharing credentials between tenants. Distinguish **Article QR** (identification, catalogue or access to the intention of purchase) **QR collection** (payment of an order or transaction) and always distinguish the declaration from a payment from the actual confirmation by the supplier.

Future design requires deciding the current QR product of Market Payment for third parties, its sales authorization flow (e.g. OAuth where applicable), secure storage of backend credentials, company/headquarters identification/order, command creation power, verified webhook notifications, authoritative status query and reconciliation. The current business model `SalePayment` **does not record bank accreditations** and should not be overburdened quietly as if they were reconciled payments; it probably requires entities and states of **intention/order of collection**, supplier event and reconciliation, to design and approve before migrating SQL.

Possible design states, **not implemented**, include pending, confirmed/approved, rejected/cancelled/expired, subject to the exact API status of chosen. Expirations, duplicate/out-of-order webhooks, network failures, account disconnection, duplicate charges and F5 recovery must be tested with credentials and test environments. **Do not generate an illustrative QR and present it as a real charge.** Initial references: [Market Payment — QR](https://www.mercadopago.com.ar/developers/es/docs/qr-code/overview), [OAuth](https://www.mercadopago.com.ar/developers/es/docs/security/oauth/introduction) y [QR notifications](https://www.mercadopago.com.ar/developers/es/docs/qr-code/notifications).

### 18.5 Suggested future order and gateway

1. **Close T12** with consistent documentation, UML and final IC; do not incorporate new commercial changes to PR #46.
2. **REAL–DEMO visual/functional convergence** and demonstrable web/mobile path with evidence; keep backend and contracts, except for separate decisions.
3. **PostgreSQL ERD** from a disposable base for exposure and structural review; it can be done in parallel to visual improvement.
4. **Design and then integrate Market Payment Real QR** as an autonomous work with security analysis, contracts, migrations, tests and authorization of the responsible.

This command does not imply that QR is integrated when T12 is finished, nor that the software becomes productive by displaying it in the browser.

## 19. Sources of truth, versing and background

1. **Scheme and models:** `backend/app/infrastructure/models/*.py` y `backend/alembic/versions/*.py`. Last documented review of the outline: `e26a_sales_foundation`successor to `e25a_inventory_ops`. No historical migrations are edited or reordered to match a drawing.
2. **Operations and authorisations:** `backend/app/modules/*/{service,permissions,router,schemas}.py` Where they exist, the service is necessary to know non-expressible invariants like CHECK.
3. **API/IU/tests:** [Document 05](05_MATRIZ_API_Y_TRAZABILIDAD.md), [Document 02](02_CASOS_DE_USO.md), `frontend/src/features/` y `frontend/e2e/real/`.
4. **History of Document 03:** the previous version (E2-3 E, 08/11/2026) remains recoverable, without modification, in [Documento 03 antes de T12-C, commit `c6a77137`](https://github.com/JoaquinOjedaDev/Orbit/blob/main/plataforma-pyme/entrega-programacion-2/03_MODELO_DE_DOMINIO_Y_UML.md). Its sections E2-1 to E2-3 describe earlier cuts and **do not prevail** about this state AS-IMPLEMENTED.
5. **Documentary preservation:** by default, the unchangeable link of the previous point retains the entire pre-source and this version summarizes its milestones; if the controller requires to have the complete historical text within the delivery branch, file a separate and expressly labeled copy `HISTORICO` before replacement. Do not mix both states under the same "return" heading.
6. **Publication door:** Human approval of Document 03, subsequent update 03A/03B/03C and global link control, graphics and final IC. This file is **final candidate subject to approval**Not a document already merged.

## 20. Acceptance list for T12-C1

- [ ] The reviewer approves that the current state is T11 and that historical matters do not mix with it.
- [ ] The correspondence of the **19 ORM models** with their SQL tables (including technical support).
- [ ] There's no so-called single table left. `SolicitudIdempotente` in the REAL model.
- [ ] Roles, permits by headquarters and the requirement SELL+STORE for physical sale are documented.
- [ ] SQL states of transitions with endpoint REAL are distinguished (especially `CANCELADA` (a) The purchase of goods).
- [ ] The rules for purchase/reception, transfer, adjustments and sale without negative stock are represented.
- [ ] Invariant SQL and service validations are not attributed to the wrong layer.
- [ ] RF-08 to RF-10 continue DEMO/deferred; REAL payments remain declared.
- [ ] Current diagrams are marked as T12-C2/C3/C4 earrings and are not announced as synchronized.
- [ ] The holder cannot be degraded or revoked by a public operation; a count is not invented `COUNT(owners)>1`.
- [ ] The pattern section distinguishes what is actually encoded from literally unimplemented GoF tags.
- [ ] The objectives of convergence DEMO, ERD, web/mobile presentation and QR Pago Market are marked **post-T12**.
- [ ] The historical text can be retrieved by commit and, if requested, by archived annex before publication.

**Opinion of this delivery:** **T12-C1 ADOPTED AND PUBLISHED IN THE DOCUMENTARY RAM**. Diagrams 03A/03B/03C, its SVG and revision T12-E remain pending. This publication only modifies documentation; no new tests, migrations or database operations were carried out and does not imply merge a `main`.


## 21. Registration of decisions before external review of T12-C1

| Comment received | Treatment in this version |
|---|---|
| Partial index admits zero holders | The service is required **ban** the edition of members and self-editing; it is not proposed as implemented a `COUNT(owners)>1`. Transfer of title deferred. |
| Bearer in memory loses session with F5 | Current limitation is declared and it is proposed to evaluate safe cookies after T12, **sin** introduce token persistence into the draft. |
| `CANCELADA` exists in SQL without cancellation path | It's labeled **schema capacity with deferred endpoint**. |
| Make patterns visible | Repository, Service Layer, Unit of Work limit, snapshot and idempotency are documented; formal State/Mement implementations are avoided. |
| Automatic recovery after timeout | Documented the actual route `by-request` and conservative management; uniform automation remains as UX evolution, not as verified fact. |
| Error code `STALE_BALANCE_VERSION` | It is not invented; it documents the `409` and currently used message. A typed error is left as future API enhancement. |
| ER diagram, Web/mobile demo and QR Payment Market | It incorporates evolution sheet **post-T12**with REAL/DEMO separation and credentials per company. |

**Priority criterion:** the code verified at the base cut has prevalence over statements of external analysis; suggestions for UX and architecture that require development do not alter the description AS-IMPLEMENTED.