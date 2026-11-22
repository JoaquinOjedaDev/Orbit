# E0-B — Frontend architecture and integrated navigation

**Project:** Generalistic management platform for SMEs (multi-, multi-rub).  
**Repository:** `JoaquinOjedaDev/Orbit`.  
**Canonical location:** `plataforma-pyme/docs/01_ARQUITECTURA_FRONTEND.md`.  
**Date:** 2026-11-06.  
**Status:** **Technical proposal E0-B, documentation prepared; implementation not initiated; review of pending equipment**.  
**Scope:** React + TypeScript prototype architecture, shell, navigation, company-shared status, internal DEMO/API contracts, directory structure and gateway to E1. **No** change the existing TP, create components, run tests or integrate real payments.

> **Working rule:** this folder coexists with `Proyecto-3-AppAdmin-Mascotas/` y `Proyecto-3-Extendido-Generico/`. Both current trees remain **intact**. We work within the same repository Git and about `main` by decision of the team; changes in each cut should be limited to `plataforma-pyme/` except for explicit agreement.

## 1. Sources and criteria of precedence

1. **E0-A (immediate source):** `docs/00_MATRIZ_INTEGRACION_HTML.md`; 19 HTML paths, 17 different content, Z001–Z093 candidates and Hxx/Dxx findings. E0-A is a static selection, not an E2E validation.
2. **Integration plan v4:** `01_PLAN_RECTOR_Y_SECUENCIA(1).md`, `02_BACKLOG_VERTICAL_Y_PRUEBAS(1).md` y `03_MERCADO_PAGO_QR(1).md`received as planning sources.
3. **Prior audit:** `Auditoria_PyME_Integracion_2026-11-06(1).zip`, particularly diagnosis H01–H26, UX, invariants, traceability and D01–D15 decisions.
4. **Multi-business product decisions v3:** global person, optional companies, WALOS like fixture, membership permissions, dashboard and integrated menu.

**Conflict precedence:** explicit product decision v3/v4 → provisional rule documented in E0-A/E0-B → legacy design from HTML → inherited code. No architecture proposal is implicitly raised to approved ADR.

**Product facts already established:** multiple businesses and items; personal user with zero or more memberships; separate data per company; role per company; goods and services; access to functions by Start and side menu; optional box/deposit depending on operation. **Technical decisions proposed here:** Vite/React/TypeScript, specific routes, Zustand, data ports and folder layout.

## 2. Architectural decision and alternatives

### 2.1 Proposed election

- **SPA React + TypeScript + Vite**: a tree of components, common route system and type. Vite simplifies the first start, does not impose restrictions on academic backend.
- **React Router** for declarative routes, parameters `businessId`, access views and "Next". A single navigation definition feeds menu and cards.
- **Zustand** (proposed) for DEMO session status, drafts and snapshots of DEMO data by company. **One single state of business authority**, without separate stores for M1/M2/M3.
- **Services/cases of typical use + persistence adapter:** UI does not alter arrays/counters directly; it emits commands to a `DemoGateway` y, posteriormente, a un `ApiGateway`.
- **CSS modular + design tokens** (proposed; CSS Modules or lightweight equivalent): keep the visual patterns chosen in E0-A without copying incompatible global style sheets.
- **Future tests:** Vitest + Testing Library for units/components, Playwright for browser and viewport tours. No suite was executed in this cut.

### 2.2 Alternatives that we do not adopt for E1

| Alternativa | Why not? |
|---|---|
| A giant HTML, `iframe` or 19 inherited scripts joined together | Collisions of global functions, non-coherent navigation, `localStorage` Insulated by module, H08/H09/H15/H17. |
| Three mini-products M1/M2/M3 | Duplicate catalog, stock, sales, menu and permissions; contradict the unique Business Start and Menu. |
| FastAPI backend required before displaying shell | The v4 plan requires first verifiable prototype; replaceable interfaces are designed to avoid discarding the frontend afterwards. |
| Microservices, Redux/Query/SSE/WebSocket from day one | Premature cost and complexity for a functional prototype of an academic team. |
| Tratar Zustand, memoria o `localStorage` as real transactional security | There is no process isolation, server authorization or multi-user atomization. |

**Review criterion in E1-A:** Rethink libraries only if a reproducible limitation appears, not for aesthetic preferences.

## 3. Logical architecture

```text
[Navegador / React Router]
    |
    +-- AppShell (barra, selector de empresa, menú izquierdo, tarjetas)
    +-- Vistas / features (Empresa, Catálogo, Inventario, Compras, Ventas...)
    +-- Guards UX (acceso DEMO / empresa activa / rol visual)
    |      |
    |      v
    +-- Hooks de feature y casos de uso tipados
           |
           v
       AppGateway (puerto común de operaciones)
           +-- DemoGateway --> DemoState único --> proyecciones/ledger por business_id
           +-- ApiGateway  --> FastAPI futuro --> PostgreSQL [NO IMPLEMENTADO EN E0-B]
                                      |
                               Mercado Pago por vendedor [FASE POSTERIOR]
```

**Essential limit:** change adapter **no** must alter visual behavior or produce a second source of balance. In DEMO validations help to show rules; in production the server **repeat and enforce**.

### 3.1 Layers

| Layer | Liability | Prohibitions |
|---|---|---|
| `app` | Provider, router, layout, configuration, paths and failback | Do not generate stock, balances or accept payments. |
| `features` | Displays and components by capacity; forms and messages | Do not read/write `localStorage` or know `fetch` directly. |
| `domain` | Types, Pure Rules, Status Transition, Validators, Declarative Permits | Do not rely on DOM, JSX, React or server infrastructure. |
| `application` | Commands and queries, coordination of operations, typified results | Do not use `alert()` as the only channel of errors or mutate an isolated module. |
| `data/demo` | DEMO unique source, fixtures, clock/IDs and simulated transactions | Do not fake atomism between devices or actual charge. |
| `data/api` | Future REST Client, Serialization, Authentication, Errors | Not to be a real stock or box source once you activate the API. |
| `shared/ui` | Reusable components, accessibility and styles | Do not hide critical business rules in visual components. |

## 4. Proposed folder structure (not yet created)

Everything that follows is located in `plataforma-pyme/`. Code creation corresponds to **E1-A**, no a E0-B.

```text
plataforma-pyme/
├── README.md                        # arranque y alcance DEMO (E1)
├── CHANGELOG.md                     # avances verificables por corte (E1)
├── docs/
│   ├── 00_MATRIZ_INTEGRACION_HTML.md # E0-A, existente
│   ├── 01_ARQUITECTURA_FRONTEND.md   # E0-B, este archivo
│   ├── 02_DECISIONES_Y_BACKLOG.md    # E0-C, próximo
│   ├── QA.md                         # casos/ejecuciones, cuando se creen
│   └── ADR/                          # ADRs versionados E0-C
├── frontend/                         # crear en E1-A con Vite
│   ├── package.json
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx
│   │   ├── app/
│   │   │   ├── App.tsx
│   │   │   ├── router.tsx
│   │   │   ├── navigation.ts
│   │   │   ├── guards/
│   │   │   └── shell/
│   │   │       ├── AppShell.tsx
│   │   │       ├── SideMenu.tsx
│   │   │       ├── TopBar.tsx
│   │   │       └── BusinessSelector.tsx
│   │   ├── features/
│   │   │   ├── auth-demo/
│   │   │   ├── profile/
│   │   │   ├── businesses/
│   │   │   ├── locations/
│   │   │   ├── team/
│   │   │   ├── accounts/
│   │   │   ├── catalog/
│   │   │   ├── suppliers/
│   │   │   ├── purchases/
│   │   │   ├── inventory/
│   │   │   ├── movements/
│   │   │   ├── sales/
│   │   │   ├── expenses/
│   │   │   ├── cash-sessions/
│   │   │   ├── history/
│   │   │   └── payment-qr-demo/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   ├── money/
│   │   │   ├── quantity/
│   │   │   ├── permissions/
│   │   │   └── rules/
│   │   ├── application/
│   │   │   ├── gateway.ts
│   │   │   ├── commands/
│   │   │   └── queries/
│   │   ├── data/
│   │   │   ├── demo/
│   │   │   │   ├── demoStore.ts
│   │   │   │   ├── demoGateway.ts
│   │   │   │   ├── fixtures.ts
│   │   │   │   └── clockAndIds.ts
│   │   │   └── api/                  # stub/adaptador para E2-E3
│   │   ├── shared/
│   │   │   ├── ui/
│   │   │   ├── forms/
│   │   │   ├── errors/
│   │   │   └── hooks/
│   │   └── styles/
│   │       ├── tokens.css
│   │       └── globals.css
│   ├── public/
│   └── tests/
│       ├── unit/
│       └── e2e/
└── backend/                          # SOLO si E2/E3 lo justifican; no crearlo hoy
```

**Do not duplicate:** `Proyecto-3-Extendido-Generico/backend/` already exists as local work outside this cut on the team; will analyze its relationship with future backend **before** copy, connect, replace or move files. It is also not modified `Proyecto-3-AppAdmin-Mascotas/`. Do not open or merge other Git stories by effect of this document.

## 5. A single navigation map

The registry `navigation.ts` will be a source of truth **id, title, icon, path, group, company requirement, visible permission and status (ACTIVE / PROXIMATELY)**. The menu and Start cards use the same record; no button has a hidden or inert path.

### 5.1 Public and personal routes

| Path | View | Condition | Initial status E1 |
|---|---|---|---|
| `/acceso` | Identification and income **DEMO** | No demo session | E1-A |
| `/inicio` | Home personal without company + selector | Demo user | E1-A |
| `/perfil` | Global personal profile | Demo user | E1-A |
| `/empresas/nueva` | Create company | Demo user | E1-A |
| `/invitacion/:token` | Nominated invitation/application link (differentiated flows) | According to token DEMO | E1-B / placeholder hasta implementar |
| `/` | Redirect controlled | Session + choice of company | E1-A |
| `*` | Not found with visible return | All | E1-A |

### 5.2 Proposed business routes

They all use prefix. `/b/:businessId`; the route never grants access by itself.

| Low path `/b/:businessId` | Menu Title / View | E0-A main screen | Cut |
|---|---|---|---|
| `/inicio` | Start of business | Z003 + Z014 | E1-A |
| `/empresa` | Company Data | Z001 | E1-B |
| `/ubicaciones` | Locations | Z004 | E1-B |
| `/equipo` | Team | Z002 + Z014 | E1-B |
| `/cuentas` | Accounts and payment methods | Z042 | E1-B |
| `/catalogo` | Catalog | Z069 + Z050 | E1-B |
| `/catalogo/nuevo` | New article/service | Z069 | E1-B |
| `/catalogo/:itemId` | Article/service sheet | Z069 | E1-B |
| `/proveedores` | Suppliers | Z073 | E1-B |
| `/compras` | Purchases | Z070 + Z050 | E1-B |
| `/inventario` | Inventory | Z050 + Z072 | E1-B |
| `/inventario/conteo` | Stock count | Z072 | E1-B (after movements) |
| `/movimientos` | Stock movements | Z050 | E1-B |
| `/ventas` | Sales | Z074 design + Z075 behavior | E1-C |
| `/ventas/nueva` | Load sale | Z074 + Z075 | E1-C |
| `/ventas/:saleId` | Sales details | Z075 | E1-C |
| `/gastos` | Expenses | Z070 + Z075 | E1-C |
| `/jornadas` | Opening/closing | Z092/Z093/Z075 | E1-C |
| `/jornadas/:sessionId` | Active day | Z075 + Z093 | E1-C |
| `/jornadas/:sessionId/cierre` | Arching and revision | Visual Z093 + Z092 | E1-C |
| `/jornadas/:sessionId/informe` | Historical Snapshot | Z075 + Z092 | E1-C |
| `/historial` | Unified history | Z075 + Z050 | E1-C |
| `/guias` | Help guides | Z071 | ‘Next’ |
| `/pedidos` | Orders/Reserves | Partial references Z075 | ‘Next’ |
| `/analisis` | Business analysis | No full screen | ‘Next’ |

**Rule UX:** the routes daughters of creation, detail and closure may be left off the main menu, but are achievable from their parent screen. `QR DEMO` is a checkout dialog/flow and **no** a separate tab from the menu. QR catalog tab is a different, postponed flow.

### 5.3 Shell and responsible behaviour

- **Desktop:** top bar with active company, collapsed left side menu, main content, profile/access.
- **Mobile:** Drawer menu accessible from the left edge; contained in a column, tables that are transformed into cards or allow announced horizontal scrolling, not inaccessible buttons.
- **Home:** ‘M1/M2/M3’ means a capacity card showing ‘nextly’ status or sailing on a real route.
- **Without companies:** Personal start-up allows you to create a company and join by invitation; without an empty screen pretending that WALOS belongs to every user.
- **Permissions:** visible/disabled or hidden actions according to UX rule, but all DEMO results are labeled as such and future backend repeats validation. Explanatory message when the role does not authorize.
- **Minimum accessibility E1:** visible focus, input tags, drawer/modal keyboard, field associated errors, simulated success distinguishable confirmations.

## 6. Global state, active company and data isolation

### 6.1 Separate four areas (without duplication)

| Scope | Content | Identity key | Conservation |
|---|---|---|---|
| **Personal identity DEMO** | `activeUserId`User, Global preferences, list of memberships available | `user_id` | Demo session; no password or tokens. |
| **Business context** | `activeBusinessId`, `activeMembershipId`, effective role, optional location/box | `business_id` | It resolves when entering each route. |
| **Business data** | Company, equipment, locations, catalog, movements, purchases, sales, cashier, accounts, expenses and demo audit | `business_id` **Compulsory** | One single `byBusinessId` with operations repository; no parallel M1/M2/M3 slice. |
| **IU/drafts** | Filters, open modal, form, cart, closing count | `user_id + business_id + feature (+ location_id)` | They are destroyed or rehydrated only for the same company when changing context. |

Conceptual form of the state (NO implementation):

```ts
type DemoState = {
  usersById: Record<UserId, User>;
  membershipsById: Record<MembershipId, Membership>;
  session: { activeUserId: UserId | null; activeBusinessId: BusinessId | null };
  businessesById: Record<BusinessId, BusinessData>;
  draftsByScopedKey: Record<string, Draft>;
  processedCommandsByBusiness: Record<BusinessId, Record<string, CommandResult>>;
};

type BusinessData = {
  business: Business;
  locations: Record<string, Location>;
  catalog: Record<string, CatalogItem>;
  suppliers: Record<string, Supplier>;
  purchases: Record<string, Purchase>;
  receipts: Record<string, Receipt>;
  stockMovements: StockMovement[];  // fuente de verdad de saldos
  sales: Record<string, Sale>;
  paymentApplications: PaymentApplication[];
  cashSessions: Record<string, CashSession>;
  closureSnapshots: Record<string, ClosureSnapshot>;
  accounts: Record<string, FinancialAccount>;
  expenses: Record<string, Expense>;
  auditEvents: AuditEvent[];
};
```

Los `Record` are a shape proposal for DEMO, not frozen SQL entities or OpenAPI contracts. Arbitrary browser IDs do not grant access. Each business entity that requires it will explicitly include `businessId` (or it will be unequivocally contained in a validated aggregate), and each command will check context, referred aggregates and membership.

### 6.2 Change A → B: visible algorithm and preconditions

1. User chooses business B from selector; verify DEMO membership enabled for B.
2. Close dialogs, cancel A-dependent queries, unlink A location/box selection and disable A data on screen.
3. Save or discard draft A according to visible and specific policy; **Never** move cart or totals to B.
4. Update `activeBusinessId`, solve role/membership B and navigate to `/b/B/inicio`.
5. Consult only `businessesById[B]`; show empty if no data, even if A has records.
6. If user types directly URL `/b/A/catalogo` without permission, showing denied or not found access **unfiltered A attributes**.
7. Also prove that user belongs to A and B with different roles; change effective role when changing company.

**Case limit:** a tab or refresh cannot claim that there is multi-user security; data protection is **UX simulation**. The real backend will require context authorized by each resource and operation.

### 6.3 DEMO Persistence

- **Stage one:** store DEMO status **en memoria** (Zustand) and deterministic fixtures; show "Test data restarted when reloading" if that is the behavior chosen for E1-A.
- **Optional extension, if necessary to keep demos:** enter a `DemoPersistenceAdapter` versioning, schema validation, export/import of fixes and passwords with user/company scope. `localStorage` would be just a detail of infrastructure **not sure**never the legal/financial source or a real login medium.
- Do not copy `walos_demo_m1_v12`, `walos_demo_mod2_v5` no legacy M3 keys. Do not store passwords, OAuth, tokens or actual collections on frontend.
- Do not affirm synchronization between browsers/devices: with future API, the source of truth will be PostgreSQL server.

## 7. Internal contract of operations (DEMO/API ports)

The UI consumes operations through a common port. Conceptual specifications, **no already created .ts files**:

```ts
type BusinessContext = {
  actorUserId: UserId;
  businessId: BusinessId;
  locationId?: LocationId;
  commandId: string;       // idempotencia de operación demo/API
};

type Result<T> =
  | { ok: true; data: T; revision?: number }
  | { ok: false; error: {
      code: "NOT_FOUND" | "FORBIDDEN" | "VALIDATION" |
            "CONFLICT" | "INSUFFICIENT_STOCK" |
            "INVALID_PAYMENT_TOTAL" | "CLOSED_SESSION";
      message: string;
      fieldErrors?: Record<string, string>;
    } };

// El gateway admite consultas scoped y comandos de negocio.
// Métodos previstos (firmas definitivas en E1, contratos REST recién E2):
// listBusinesses(actorUserId)
// createBusiness(ctx, input)
// updateBusiness(ctx, input)
// createCatalogItem(ctx, input)
// registerPurchase(ctx, input)
// receivePurchase(ctx, purchaseId, lines)
// transferStock(ctx, fromLocationId, toLocationId, lines)
// reconcileStockCount(ctx, input)
// createSale(ctx, lines, discount, payments)
// recordExpense(ctx, input)
// openCashSession(ctx, input)
// closeCashSession(ctx, sessionId, countedCash, reason)
// createQrDemoIntent(ctx, saleId)
```

**Proposed implementation rules:**

- A command knows `businessId`actor and `commandId`; Idepotent actions query context log, and repeat with same key and different payload returns `CONFLICT`.
- Errors are typed, displayed with useful actions; no "Saved" is reported when a validation failed.
- Every logical command takes **una** DEMO snapshot, validates all preconditions and confirms **all or nothing in the same store**. This simulates the consistency of a tab, **no** Concurrent transactions between devices.
- All readings (dashboard, history, stock, box) are derived from the same state; they do not keep rewritten copies of balances on each screen.
- `ApiGateway` will retain semantics and domain types; backend will verify permissions, money, stock, version and transaction. REST routes will be defined in E2, not here.

## 8. Business invariants to rebuild in E1

### 8.1 Person, company and permits (H01/H02/H12/H14)

- `User` There are no global companies; `Business` belongs to the context of `Membership`, no a un singleton.
- Founder is a data **history**; initial administrative holder is unique and active; not to infer legal owner or allow zero responsible. Its final policy requires ADR E0-C.
- Minimum role matrix proposed: `TITULAR_ADMIN`, `ADMINISTRADOR`, `ENCARGADO`, `COLABORADOR`. There is no implicit permission to render a button.
- Email invitation to person and link/QR for **request access** are different machines; request does not automatically create membership.
- `Location` differentiate `vende`, `almacena` and other attributes; storage location **no** is mandatory in services.
- Any action that requires business validates context and membership before reading or modifying.

### 8.2 Catalogue and measurements (H07/H16/H22/H26)

- `CatalogItem` = `GOOD` o `SERVICE`. Resale, input and elaborate are good capabilities, not global ones; WALOS lives in fixtures.
- Unique SKU within business (same names and generation of SKU pending ADR); a service does not have `StockBalance` No deposit.
- Prices in **whole cents** for ARS and business defined monetary unit; not to use `number` floating for monetary sum.
- Numbers support scales per unit. **No** use `parseInt` or truncate 1.5 kg to 1; parse text strictly and normalize to smaller whole units or exact decimal representation according to unit policy (ADR E0-C).
- Price "to be quoted" does not amount to $0. Commands reject invalid formats and explain the field.

### 8.3 Purchases, receptions, stock and shipments (H09/H18/H19/H25)

- Register purchase **no** automatically receives and pays. `Purchase`, `Receipt` y `Expense/Payment` They're separate facts.
- 10 reception creates a single +10 reception and movement log once, with idempotency key; a second click does not duplicate.
- Any stock balance is obtained from `StockMovement` (or a reproducible projection, never of a parallel editable variable).
- Transfer of 3 of origin 10 to destination 0 confirms departure -3 and entry +3 in **una** operation: 7/3. Refuse 11 without partial movement; not negative.
- Inventory count records difference and adjustment with motive; does not step on new sale. Operation date is obtained from the clock, not literal inherited.
- Return of fair requires explicit movement, not generated when closing box; the expected/received difference is pending or documented, **never disappears** (H25).
- Versioned DEMO and simulated locks are used for UX; the backend must prove actual attendance in PostgreSQL.

### 8.4 Sales, payments, expenses and closure (H06/H09/H10/H13)

- The sale may include goods (with valid stock location) and services (without stock); discount applied before setting final amount.
- Payment applications of 1..n means; **exact sum** not close if money exceeds or is missing, except pending/credit approved later.
- Confirmed sale causes stock out **once only**; do not create another output when printing or re-opening ticket. Disable concurrent duplicate actions with idempotence.
- ‘declared payment’ means registered on sale, **no** bank/MP verified accreditation.
- Operating expenditure paid identifies account or fund of origin; purchases, scheduled fixed expenses and actual payments are made differently.
- `CashSession` (when applicable) belongs to company, location and cash; day cash is not a global balance of CVU/CBU/MP shared.
- Default count: collect movements until cut, arching, differences, actor, date, motive and snapshot **immutable** Retry not to create second closure or reopen day.
- Unverified closure remains **DESHABILITADO** until explicit decision. `commitFinalClosure` de Z093.
- History correlates sales, payment, movements, expenditure and closure by IDs; does not combine three divergent local logs.

### 8.5 Market Payment: QR card

- **Article QR:** access to tab/add for sale, future functionality.
- **QR of collection:** starts from checkout, associated with a sale and to the sales account of **that company**.
- **En E1:** only mock collection **DEMO**, showing amount, company, state `PENDIENTE/SIMULADO_APROBADO/CANCELADO`, without transferring money. Do not affirm payment confirmed by a button "I already paid".
- **En backend posterior:** `BusinessPaymentConnection` by seller with OAuth; branch/POS per seller; Orders API with idempotence; signed webhook, vendor consultation, reconciliation, temporary stock reserves and late payments. Token never goes to frontend or repository. Compatibility with modalities and integrative account will be verified before implementing real MP.
- Attempted QR and `PaymentApplication` creating QR does not reduce definitive stock or credit collection. pending state does not add to cash as paid.

## 9. Inventory of reusable components: from HTML to React (without copying JS inherited)

| Feature/componente futuro | Source E0-A | Reuse | Redesign/Discard |
|---|---|---|---|
| `AppShell` y `BusinessDashboard` | Z003/Z014 | Panel, cards, style, drawer | M1/M2/M3 and WALOS global menus. |
| `BusinessForm` | Z001, Z014 | Fields, hierarchy, image | Personal identity mixed with company, singleton. |
| `LocationsList` y `LocationForm` | Z004 | High, editing, pause, main | Mandatory deposit; visual permissions only. |
| `TeamList`, `MemberSheet`, `InviteFlow` | Z002/Z014 | Profile, review and applications | Nominated invitation fusion with open application. |
| `AccountsList` | Z042 | Information alias/CBU/CVU | QR data as credited collection. |
| `CatalogList` y `CatalogForm` | Z069/Z050 | Gallery, types, editing and states | Global canine catalogue and service stock. |
| `SuppliersList` | Z073 | Rich and high contextual profile | Mandatory dummy supplier. |
| `PurchasesList`, `ReceivePurchase` | Z070/Z050 | Lines, draft, receive | Purchase=reception=payment. |
| `InventoryList`, `StockCountWizard` | Z050/Z072 | Filters, revision, differences | Ledger own M2 and false blocking of continuance. |
| `TransferStockForm` | Z050 | Origin/destiny and summary | Partial exits and return with H25 loss. |
| `PosCheckout` y `PaymentSplit` | Z074/Z075 | POS two steps and split payments | Unique visual medium, float price and local stock of M3. |
| `ExpenseForm` | Z070/Z075 | Form and classification | Adding out non-associated in depth. |
| `CashClosureWizard` | Z093/Z092/Z075 | Checklist, arching, differences, report | Discard `commitFinalClosure` and closing without evidence. |
| `BusinessHistory` | Z075/Z050 | History and filters | Fragmented logs without correlation. |
| `QrPaymentDemo` | Z074 + plan MP v4 | Wait, status and visual | Real QR/OAuth/payment simulated as confirmed. |
| `GuidesEditor` (posterior) | Z071 | Steps and drafts | Simplified M2 editor losing structure. |

## 10. Fixtures and verification scenarios

**Minimum Fixtures, invented as synthetic DEMO data:**

1. **WALOS:** example company with processed goods, stock by location and box. Never brand/rub by default for other companies.
2. **Re-selling trade:** physical items, supplier, reception and transfers.
3. **Service company:** services without deposit, without lot and without compulsory physical box.
4. **Two A/B companies and one user:** different permissions to check scoping; another user without A membership to test denied access.

**Integrated E1 test script (not yet executed):**

1. User without companies enters `/inicio`, creates a company, remains with sole initial responsibility.
2. Create well A (SKU) and one service; two locations and one provider.
3. Register purchase, receive 10 once; double click does not duplicate; balance 10.
4. Move 3 → balances origin 7, destination 3; try to move 11 → error and balances intact.
5. Opens day where it corresponds; sells 2 goods from destination + one service with discount and two exact payments → balance destination 1.
6. Register an explicit fund expense; the shared digital account money is not confused with day cash.
7. Arch and close; snapshot and history, actor and differences query; not allowed to reopen by repeated click.
8. Change from A to B → no list, draft, permission or figure of A visible in B.
9. In business services without full local sale without asking for deposit; enter QR demo and verify pending
10. Test desktop and mobile screens, menu, focus, validations and "Next".

### 10.1 Minimum tests to be implemented by cut

| ID | Test | Future type | Acceptance |
|---|---|---|---|
| `DEMO-TEN-01` | Company A→B and URL direct to A without membership | Unit + E2E | No data leaks, roles, or drafts. |
| `DEMO-NAV-01` | Menu/cards share routes | Component + E2E | No inert operating button. |
| `DEMO-CAT-01` | Stockless/deposit service | Unit + E2E | High/sale independent physical location. |
| `DEMO-STK-01` | Receive 10 twice | Unit | Only one entry applies. |
| `DEMO-STK-02` | Move 3 out of 10 and reject 11 | Unit | 7/3 and atomic rejection. |
| `DEMO-MON-01` | Discount + mixed payments | Unit | It reconciles to the penny; invalid format rejected. |
| `DEMO-JOR-01` | Cierre, snapshot y reintento | Unit + E2E | Unchangeable snapshot with count, actor and differences. |
| `DEMO-MP-01` | QR pending/cancelled/simulated approval | Component | DEMO label and no real accreditation. |
| `DEMO-UX-01` | Desktop/mobile/keyboard | E2E | Accessible navigation, readable errors. |

**Correspondence with future backend:** QA-TEN-01/02, QA-STK-01/02/03, QA-MON-01, QA-JOR-01/02, QA-MP-01/02/03 del backlog v4 son **specifications**The attendance of two sales, OAuth and webhooks are only verified when there is a backend and appropriate environment. **TP3 requires ≥10 actual unit tests**; the DEMO cases listed do not replace this requirement.

## 11. A probable implementation cuts after E0-C

| Orden | Cut | Specific delivery in E1 | Observable exit door |
|---|---|---|---|
| 1 | **E1-A1 / DEMO-01** | Vite/React TS, shell, menu, router, Start, placeholders and responsive | Each card is screen-navigated or ‘Next’; `npm run dev` It works. |
| 2 | **E1-A2 / DEMO-02** | User/demo, profile, new company, selector and scoping + tests | A→B does not mix data or drafts; user without a valid company. |
| 3 | **E1-B1 / DEMO-03** | Company, optional locations, equipment, accounts; DEMO permissions | Company of services without deposit and members with different permits. |
| 4 | **E1-B2 / DEMO-04** | Catalogue (good/service), suppliers, purchase/reception | Registration 10 units once; SKU only per company. |
| 5 | **E1-B3 / DEMO-05** | Inventory, movements, counting and leadger | Transfer 3 leaves 7/3; does not allow overtransfer. |
| 6 | **E1-C1 / DEMO-06** | Sales, discounts, multiple payments and expenses | Exact collections, once impacted stock and explicit funds. |
| 7 | **E1-C2 / DEMO-07** | Days, arching, closing, snapshots and history | Close consults immutable data and differences, without double closing. |
| 8 | **E1-D1 / DEMO-08** | UI QR of clearly collection DEMO | Pending is not presented as paid; company sales visible. |
| 9 | **E1-D2 / DEMO-09** | Desktop/mobile travel tests; accessibility and errors | Reproducible evidence; documented failures and limitations. |

**Non-blocking criterion:** maintain Guides, advanced processing, Ordering/Reservations, Analysis and QR of visible tab like "Next" when applicable. Do not create business repositories for modules that have not yet been implemented.

## 12. Decisions to formalize in E0-C (NOT adopted by this document)

| Proposed ADR | Status | Safe variant to build |
|---|---|---|
| ADR-001 Tenant and membership | **PROPOSAL** | Global person + companies + scoped membership, UX authorization in demo and mandatory in API. |
| ADR-002 Administrative holder | **PROPOSAL** | Historical Founder; exactly an initial active administrative holder; later formal transfer. |
| ADR-003 Invitations | **PENDING** | Two separate flows; first nominated, request per link/QR deferred without mixing states. |
| ADR-004 Stock, quantities and SKU | **PROPOSAL** | Unique Ledger, not negative, exact unit; SKU unique in tenant; no truncation. |
| ADR-005 Meeting and closing | **PROPOSAL** | Count + snapshot immutable; disabled "unverified"; separate physical return. |
| ADR-006 Payments / QR | **PROPOSAL** | 1..n exact payments; QR sale DEMO, QR future tab, OAuth by actual seller after. |
| ADR-007 IU/state and persistence | **PROPOSAL** | React TS/Router/Zustand; estado en memoria y gateway sustituible; sin `localStorage` Directly in view. |
| ADR-008 Integration with academic TP | **PENDING** | Do not touch historical backends; contract and model in E2 before adapting. |

The ADR file will have date, responsible, source, alternatives, impact, evidence and decision **APPROVED/PROPOSED/DIFFERED**. No ADR is approved just because it is in this table.

## 13. Terms of completion and transfer E0-B → E0-C / E1

### Delivered in E0-B

- [x] Proposed framework/architecture and justified discards.
- [x] Future folder tree and boundaries with existing academic repository.
- [x] Full navigation map, shell and next states.
- [x] Business state scoped, drafts and transition A→B.
- [x] Conceptual DEMO/API gateway contract and shared commands.
- [x] Invariants of purchases, stock, sales, cash and QR; scenarios and acceptance criteria.
- [x] Order of E1 cuts and ADR list pending for E0-C.

### Not performed (deliberately)

- [ ] Establishment of `frontend/`, React code, dependencies and real components.
- [ ] Unit tests, browser, E2E, IC, multi-user captures or verifications.
- [ ] Backend/REST/OpenAPI/UML final, PostgreSQL or real integration Market Payment.
- [ ] Changes in `Proyecto-3-AppAdmin-Mascotas/`, `Proyecto-3-Extendido-Generico/` or branches of the TP.
- [ ] Approval of the team to all proposed alternatives/ADRs.

### Next exact cut — E0-C

Create `plataforma-pyme/docs/02_DECISIONES_Y_BACKLOG.md` and minimum ADRs with their explicit states, matrix traceability `requisito → HTML Zxxx / Hxx → pantalla → comando → prueba` and start checklist E1-A. **Do not re-audiate the 19 HTMLs or discuss all future cases.**

**Verification Act E0-B:** documentary processing and comparison with E0-A/v4; **no implemented flow or test executed in this cut**. The team shall approve or modify technical proposals when opening E1.