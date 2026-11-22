# E2-7 A — React integration matrix ↔ FastAPI and functional gaps

**Status:** base matrix, supplemented by [decisiones T00](E2-7_T00_DECISIONES_Y_ORDEN_DE_EJECUCION.md); integration not yet implemented.  
**Code base consulted:** `main` `9a7a66394daf5a96b18b9ce796a2fe9ec92a4068`, 2026-11-09.  
**Scope:** `plataforma-pyme/`. Base URL API: `/api/v1`.  
**Rules:** API is a source of truth in REAL mode; frontend E1 DEMO exists and does not magically connect; RF-08–RF-10 requirements remain DEMO/deferred.  
**References:** [Master plan](E2-7_PLAN_RECTOR_INTEGRACION_Y_CIERRE.md), `backend/app/api/v1/router.py`, routers individuales, `frontend/src/App.tsx`, `src/data/demo/demoStore.ts`.

## 1. Conventions

- **REAL REACHABLE:** endpoint exists; client/adapter/IU is still missing.
- **PARTIAL REAL:** API covers a portion of the screen; non-existent capabilities must be hidden, left in separate demo or produce contract proposal.
- **DEMO/DIFFERED:** without equivalent backend in RF-01–RF-07; those entities are not sent to API.
- **BLOCK:** dependency needed to use the screen without risk of double source truth.
- `{b}` = `business_id`, `{l}` = `location_id`, `{i}` = item ID, `{p}` = purchase ID, `{s}` = exits ID. Every private path requires real session and server-side validation.
- The results are evidence of static reading; to validate precise semantics of filters/pagination you must consult router signature and OpenAPI when implementing.

## 2. Map UI ↔ API

| Display / E1 file | Existing actions | Endpoint backend real | Gap/decision | Orden |
|---|---|---|---|---|
| **Profile**, `features/profile/ProfilePage.tsx` | View/edit personal data DEMO, avatar/function | `GET /auth/me` (identity reading); `POST /auth/register`, `POST /auth/login`, `POST /auth/logout` (new IU) | No real profile/avatar PATCH; job function is managed by membership if supported | B1 |
| **Personal Home**, `features/dashboard/Dashboards.tsx` | Partner companies, navigation | `GET /businesses` | Do not use fixes as real businesses; empty and authentic loading | B1 |
| **Create company**, `features/businesses/BusinessPages.tsx` | High DEMO and initial membership | `POST /businesses` | Mapeo `kind` UI a `activity_kind`; not send description that API does not accept | B1 |
| **Company data**, `features/businesses/BusinessDetailsPage.tsx` | File, edit fields, local details | `GET /businesses/{b}`, `PATCH /businesses/{b}` | API only `name,category,activity_kind`; slogan/CUIT/avatar/description without equivalent persistence | B1 |
| **Selector company**, `app/shell/TopBar.tsx` | Change tenant and context | `GET /businesses`, `GET /businesses/{b}` | Clear status/abortion when changing; do not pollute business B with response A | B1 |
| **Locations**, `features/locations/LocationsPage.tsx` | High, edit, pause, primary, maps | `GET/POST /businesses/{b}/locations`; `GET/PATCH /.../locations/{l}`; `PATCH /.../{l}/status`; `PUT /.../{l}/primary` | URL map exists; local/demo photos not remote | B2 |
| **Equipment**, `features/team/TeamPage.tsx` | Members, roles, simulated invitations | `GET/PATCH /businesses/{b}/memberships`; `POST /businesses/{b}/invitations`; `POST /invitations/accept` | Do not simulate approval/rejection of invitation within a REAL company; nominative acceptance is made with token/account | B2 |
| **Allocation by headquarters** | Partial IU mapping view or control | `GET /businesses/{b}/locations/{l}/assignments`; `PUT /.../assignments/{membership_id}` | Attach role and assignment; permission source always API | B2 |
| **Catalog**, `features/catalog/CatalogPage.tsx` | CRUD, status, tab, filter, SKU | `GET/POST /businesses/{b}/catalog`; `GET/PATCH /.../catalog/{i}`; `PATCH /.../{i}/status` | `kind` (REVENT/ELABORATE/INSUMO/SERVICE) and `item_type` GOOD/SERVICE not equivalent; local only images | B3 |
| **Catalogue version**, `features/catalog/CatalogDetailDialog.tsx` | Details and photo | `GET /businesses/{b}/catalog/{i}` | Do not invent backend or hosted image fields | B3 |
| **Suppliers**, `features/suppliers/SuppliersPage.tsx` | Sheets, contacts, editing, status | `GET/POST /businesses/{b}/suppliers`; `GET/PATCH /.../suppliers/{id}`; `PATCH /.../{id}/status` | DTO lists `payment_methods/promotions`, fields and backend standardization | C1 |
| **Purchases**, `features/purchases/PurchasesPage.tsx` | Register, list, detail and status | `GET/POST /businesses/{b}/purchases`; `GET /.../purchases/{p}` | Separate purchase vs. receipt; do not calculate stock when creating purchase | C1 |
| **New purchase**, `features/purchases/PurchaseForm.tsx` | Sheet, good/service/concept, prices, quantities | `POST /businesses/{b}/purchases` | Fields `purchased_on,supplier_id,reference,notes,lines` y `line.unit` CONCEPT where applicable; idempotency | C1 |
| **Receipt**, `features/purchases/PurchaseDetailDialog.tsx` | Confirm reception location | `POST /businesses/{b}/purchases/{p}/receive`; `GET /.../{p}/receipt` | STORE location, unique complete reception and replay; do not treat it as new purchase | C1 |
| **Inventory**, `features/inventory/InventoryPage.tsx` | Balance by location, ledger, controls | `GET /businesses/{b}/inventory/balances`, `GET /.../inventory/movements` | API balance authority; not add demo events to produce REAL stock | C2 |
| **Transfer**, `features/inventory/InventoryActionForm.tsx` | Transfer between two locations | `POST /businesses/{b}/inventory/transfers`, `GET /.../transfers/{id}` | STORE rules in both and sufficient stock, conflict report; same key in replay | C2 |
| **Adjustment/initial**, `features/inventory/InventoryActionForm.tsx` | Alta stock, ajuste positivo/negativo | `POST /businesses/{b}/inventory/adjustments`, `GET /.../adjustments/{id}` | `kind`, `expected_version`, motive and STORE; new command if version has already changed | C2 |
| **Multiple count**, `features/inventory/InventoryBatchCount.tsx` | DEMO multi-purpose adjustment | Settings API Only **by article**, without equivalent atomic batch | Adapt to individual operations with confirmation and risk of partiality, or maintain DEMO; not promise transactional lot | C2 |
| **POS**, `features/sales/SalesPage.tsx` | Quick sale physical/service, discount and payments | `POST /businesses/{b}/sales`, `GET /.../sales/{s}` | DTO exacto; `Idempotency-Key`; SELL/STORE permissions, account/box field does not exist | C3 |
| **Sales history**, `features/sales/SalesPage.tsx` | List and selection vouchers | `GET /.../sales/{s}` only | Missing `GET /sales`. Define minimum paged list or UI to known vouchers | C3 decision |
| **Visual QR**, `features/sales/QrDemoPanel.tsx` | Create intent and simulate approval | **None** contrato QR equivalente en backend | DEMO isolated; cannot shoot REAL stock or appear accreditation | Deferred |
| **Expenses**, `features/cash/ExpensesPage.tsx` | Registering expenditure/mediums | **Sin backend RF-08** | Only DEMO, visible separation and not added to actual figures | Deferred |
| **Cashier days**, `features/cash/CashSessionsPage.tsx` | Opening/arqueo/closing | **Sin backend RF-08** | Do not associate `cashSessionId` to actual sales | Deferred |
| **Accounts and payment methods**, `features/accounts/FinancialAccountsPage.tsx` | CRUD and association to payments | **Sin backend RF-09** | Do not send `financialAccountId` en `POST /sales` No actual purchases | Deferred |
| **Dashboard company**, `features/dashboard/Dashboards.tsx` | Counts, KPI and accesses | `GET /catalog`, `GET /inventory/movements`, `GET /purchases`, etc. | Metrics only from really accessible sources; not counting QR/demo box as real income | B1/C |

## 3. Real APIs per domain (read inventory of main routers)

**Authentication (E2-1):**
```text
POST /auth/register
POST /auth/login
GET  /auth/me
POST /auth/logout
```

**Companies and equipment (E2-1):**
```text
POST  /businesses
GET   /businesses
GET   /businesses/{b}
PATCH /businesses/{b}
POST  /businesses/{b}/invitations
GET   /businesses/{b}/memberships
PATCH /businesses/{b}/memberships/{membership_id}
POST  /invitations/accept
```

**Locations (E2-2):**
```text
GET   /businesses/{b}/locations
GET   /businesses/{b}/locations/{l}
POST  /businesses/{b}/locations
PATCH /businesses/{b}/locations/{l}
PATCH /businesses/{b}/locations/{l}/status
PUT   /businesses/{b}/locations/{l}/primary
GET   /businesses/{b}/locations/{l}/assignments
PUT   /businesses/{b}/locations/{l}/assignments/{membership_id}
```

**Catalogue and suppliers (E2-3/4):**
```text
GET   /businesses/{b}/catalog
GET   /businesses/{b}/catalog/{i}
POST  /businesses/{b}/catalog
PATCH /businesses/{b}/catalog/{i}
PATCH /businesses/{b}/catalog/{i}/status
GET   /businesses/{b}/suppliers
GET   /businesses/{b}/suppliers/{id}
POST  /businesses/{b}/suppliers
PATCH /businesses/{b}/suppliers/{id}
PATCH /businesses/{b}/suppliers/{id}/status
```

**Purchases/reception and inventory (E2-4/5):**
```text
POST /businesses/{b}/purchases
GET  /businesses/{b}/purchases
GET  /businesses/{b}/purchases/{p}
POST /businesses/{b}/purchases/{p}/receive
GET  /businesses/{b}/purchases/{p}/receipt
GET  /businesses/{b}/inventory/balances
GET  /businesses/{b}/inventory/movements
POST /businesses/{b}/inventory/transfers
GET  /businesses/{b}/inventory/transfers/{id}
POST /businesses/{b}/inventory/adjustments
GET  /businesses/{b}/inventory/adjustments/{id}
```

**Sales (E2-6):**
```text
POST /businesses/{b}/sales
GET  /businesses/{b}/sales/{s}
```

Mandatory route prefix: `/api/v1`. Do not claim existence of a `GET /sales`, `POST /expenses`, `POST /cash` o endpoints de QR.

## 4. Critical model data and differences

### 4.1 Identity, company and location

| UI E1 | Real API | Rule |
|---|---|---|
| `DemoProfile` with avatar/telephone | `GET /auth/me` with public identity according to schema | Data without API field should be kept local **labelling**, or exit the REAL form |
| `DemoBusiness.kind` | `CreateBusinessRequest.activity_kind` `PRODUCTOS/SERVICIOS/MIXTO` | Explicit adapter, not guess enum |
| `DemoBusiness.description/slogan/taxId` | `CreateBusinessRequest`: `name,category,activity_kind` | Do not send extra fields (422); do not promise persistence |
| Location `LOCAL/FERIA/DEPOSITO/OFICINA/CASA/OTRO` | `LocationKind` supports the same values | Mapear `name,address,map_url,can_sell,can_store`; primary/status in separate commands |

### 4.2 Catalogue and purchases

| UI E1 | Real API | Rule |
|---|---|---|
| Commercial rates E1 | `CatalogItemView.kind` with ELABORATE/REVENT/INSUMO/SERVICE `item_type` GOOD/SERVICE | Physical type is derived from `item_type`; not to confuse `kind` commercial |
| Formatted ARS price | `price_cents`, `unit_price_cents`, `unit_cost_cents` whole | Never send `$5.000`, coma decimal o float JSON |
| Buying items with free concept | `PurchaseLineInput` allows `catalog_item_id=null` y `unit=CONCEPTO` | Do not send concept as fictitious CatalogItem |
| Purchase State | API records separate purchase and receipt | Avoid adding stock per purchase fee; `POST /receive` single |

### 4.3 Stock y venta

| UI E1 | Real API | Rule |
|---|---|---|
| `quantityMilli` | `quantity_milli` positive and discreet when appropriate | 1000 = complete unit of product unit |
| DEMO Counting Adjustment | `AdjustStockRequest` requires `expected_version`, `reason`, `kind` | Do not create adjustment from visual balance without reread version |
| Sale `SaleInput.financialAccountId` and day | `CreateSaleRequest` lacks such fields | Skip from REAL API; do not declare integrated box |
| Sale `locationId` | `location_id` nullable for service only per holder/admin, mandatory for goods | Well requires SELL+STORE; a service does not alter stock |
| Payment declared E1 | `SalePaymentInput` accepts `method,amount_cents,reference` | Up to 6 allowed; exact total; no external accreditation |
| `DemoSale` con stock derivado local | `SaleView` con `balances_after` history | Refresh `inventory/balances` after confirmation; do not duplicate movement |
| IU history sales | Sin `GET /sales` | Decide actual listing range before developing C3 |

## 5. UI status contract

| Context | Required behavior |
|---|---|
| No session | Login/registration, inaccessible trade routes in REAL mode |
| Token defeated/revocated | Clean token in memory, 401, reautentic; not deleted from other DEMO data |
| Non-company user | Real company personal Dashboard and High |
| Membership without access | Do not render resources of another tenant; 403/404 without escape |
| Pause Company | Write-in controls disabled or respond 409 according to API |
| API offline | Non-destructive technical message; do not quietly fall to DEMO |
| Pending request | Spinner/disabled; evitar doble submit |
| Timeout tras POST | Unknown result, save key+payload and try idempotent if applicable |
| Insufficient stock 409 | Explain, refresh balance; not invent proof |
| Stock version obsolete | Explain, reread balance and request new confirmation |
| Change company A→B during fetch | Cancel/ignore reply A, clean business cache |
| Enter /b/{id} manually | Really authorize against API before displaying data |
| Function RF-08–RF-10 | Explicit DEMO in independent context; never mixed with REAL figures |

## 6. Units by task and implementation block

**B0 (infrastructure) blocks B1–C3:** HTTP client, URL/proxy environment, contracts, errors, token injection, tests.  
**B1 (auth/tenant) blocks B2/B3/C1/C2/C3:** not operate business data without identity and real tenant.  
**B2 + B3 block C1/C2:** location STORY and valid item required for reception/stock.  
**C1 blocks the E2E case of purchase income:** reception produces verifiable stock.  
**C2 blocks C3 for goods:** Real POS must show authoritative availability, without DEMO self-decrement.  
**C3 requires decision on history:** a checkable ID voucher does exist; complete history requires deliberation.

## 7. Gaps whose resolution is to be adopted by Astra + team

| Decision | Alternatives | Initial recommendation |
|---|---|---|
| Sales history | endpoint GET paginado con tenant/RBAC **o** IU limited to newly created/ID | Prefer minimum endpoint only if it is closure requirement; implement in isolated PR |
| Two modes | Separate navigable DEMO + REAL, or replace DEMO completely | Separate explicitly, without data migration |
| Routes | Keep navigation `pushState` o migrar a router | Keep while no bug has been proven; evaluate session saves |
| Remote status | Hooks y repos simples o React Query/Zustand | Start simple, testable and scoped; add dependency if justified |
| CORS/proxy | Vite proxy local / CORS con allowlist | Local proxy and preferred single origin |
| Image | local IndexedDB tagged, hide in REAL, new backend | Keep local and tagged, avoid endpoint out of reach |
| Account/box for sale | ocultar en REAL o backend RF-08/09 | Hide and leave DEMO; do not expand |
| Multiple count | Separate actions or atomic batch API | Do not present separate actions as an atomic batch; mark gap |
| Invitations | only actual token vs simulated flow | Use actual emission/nominative acceptance; remove REAL simulation |
| Refresh after F5 | explicit re-login or refresh backend new | Re-login documented MVP, without persisting Bearer insecurely |

## 8. Review of compatibility with academic TP

- Documents `entrega-programacion-2/01..05` still contain historical RF-05/06/07 states; update **only when closing E2-7**distinguishing original intent and integrated state.
- UML 03A/03B/03C should reflect effectively integrated backend entities and relationships; not promise RF-08–RF-10 as persistence.
- TP3, RF/CU and existing architecture remain work restrictions, not license to arbitrarily expand modules.
- Markets and payments: QR of the article **no es** QR de cobro; `MERCADO_PAGO_DECLARADO` does not amount to webhook or actual accreditation.

## 9. Criteria for use

This matrix is **the entry of E2-7 A**. Astra must evaluate whether the route map, adapters and boundaries is correct, prioritize contractual differences and propose changes without editing code. An approved version is then published and B0 starts. No REAL operation is enabled by the existence of a DEMO page alone.

## 10. T00 complements after revision

- The session token is **Opaque Bearer**The strategy of re-entry after F5 and its possible improvement are recorded in T00.
- Backend listings have pagination; catalog and selector POS should represent state of completeness and not treat the first page as the universe.
- The recovery of mutations whose result is unknown after a browser crash needs to be kept in a narrow way identity, UUID4 and identical body. Retention/privacy and candidate endpoints for history and key search will be defined before T06/T09.
- The price/discount policy per role and the replay for changes in permissions/headquarters are pending decisions, not authorized corrections.
