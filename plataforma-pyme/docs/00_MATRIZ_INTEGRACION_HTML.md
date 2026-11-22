# E0-A — HTML screen integration matrix

**Product:** generalist management platform for SMEs, multi-company and multi-rubre. **WALOS:** demonstration company, not name or required product item.  
**Date of source cut:** 2026-11-06.  
**Status of deliverable:** **COMPLETED AS A DOCUMENTARY MATRIZ**; design choices are **candidates/proposals**, no interactive validations or production authorisations.  
**Proposed canonical destination:** `/docs/00_MATRIZ_INTEGRACION_HTML.md`.  
**Scope E0-A:** inventory and select HTML references, preserve useful features, identify dependencies/rules and sort the first circuit. **No** develop components, re-do the comprehensive audit, execute real operations, generate UML or fix REST contracts.

## 1. Sources and method

- **Z:** `Plataforma_PyME_Astra_Integracion_Completa_v3(1).zip`under the internal folder `material_fuente/`; 93 originals, including **19 HTML**.
- **A:** `Auditoria_PyME_Integracion_2026-11-06(1).zip`especially `01_DIAGNOSTICO.md` (H01–H26), `02_INVENTARIO_Y_COBERTURA.md`, `03_COMPARATIVA_UX.md`, `05_TRAZABILIDAD.md`, `06_MENU_Y_FLUJOS.md`, `12_INVARIANTES_Y_QA.md` y `14_DECISIONES_PENDIENTES.md` (D01–D15).
- **V3:** `DECISIONES_CONFIRMADAS_MULTINEGOCIO_v3.md` inside the source ZIP; it has priority over menus or models of old prototypes.
- **V4:** `01_PLAN_RECTOR_Y_SECUENCIA(1).md`, `02_BACKLOG_VERTICAL_Y_PRUEBAS(1).md`, `03_MERCADO_PAGO_QR(1).md`, `04_PROMPT_DE_EJECUCION_PARA_ASTRA(1).md`.
- **Plugin:** `Revision_Critica_Auditoria_Astra_Plataforma_PyME.md`which specifies the unapproved decisions on ownership, invitations, closure and return.

**Specific verification for E0-A:** extraction of both ZIPs without modification; reading existing matrices and findings; static inspection of 19 HTML (titles, visible hierarchy, identifiers, functions, navigation surfaces and storage); SHA-256 duplicate check; selective review of original M1, M2 and Sales catches. **A browser flow was not opened or tested in this delivery.** The previous audit also identifies its own test limitations. The following acceptance criteria are **outstanding**Not approved tests.

### Conventions

- **P0:** necessary to start the shell/isolation of the first demo. **P1:** necessary for vertical commercial travel. **P2:** The priority is aligned with backlog v4, not the historical number ‘M1/M2/M3’.
- **BASE:** main design/flow reference, no copy code. **SUPPORT:** to preserve punctual behaviour. **LEGITLE:** historical consultation. **DUP:** identical copy, not second implementation.
- **E:** static evidence inspected in E0-A. **A:** conduct/limitation documented by the audit or source specification. **NV:** integrated interaction **unverified**. **F:** there is no complete HTML capacity; it has to be designed in E1.
- **Hxx:** audit finding. **Dxx:** decision pending/proposal for document `14_DECISIONES_PENDIENTES.md` audit (**no** is confused with the `D-xx` The states `PROPUESTO` y `PENDIENTE` **not equivalent to approved**.
- On destination routes `/b/:businessId/...`, `businessId` represents the **active and authorised company**, not an arbitrary choice of the browser. They are suggested routes, not already implemented routes.

## 2. Full registration of the 19 HTML

**Prefix all routes in this table:** `material_fuente/` inside the source ZIP v3. IDs `Zxxx` match the audit inventory, so that each choice is traceable.

| ID | Accurate HTML path within `material_fuente/` | Role for integration | Recoverable capacity/most important limit | Status |
|---|---|---|---|---|
| **Z001** | `Modulo 1/Boton_Editar_Perfil_Empresa.html` | **BASE** Form Company | General data, image, contacts/networks, field editing; generic file manager does not belong to the P0 circuit | E/A/NV |
| **Z002** | `Modulo 1/Lista de Empleados.html` | **BASE** and visual permits | Directory, requests, tabs, review, association by location and role view; real security absent | E/A/NV |
| **Z003** | `Modulo 1/Menu_Principal.html` | **SUPPORT** to the panel and frame | Cards, company and accesses, profile and menu; do not retain partial navigation as a final menu | E/A/NV |
| **Z004** | `Modulo 1/Ubicaciones.html` | **BASE** Locations | Listing, high/editing, main, pause/reactivation, detail; adapting to services without deposit | E/A/NV |
| **Z014** | `Modulo 1/WALOS_Modulo1_v1_2/WALOS_Modulo1_Prototipo.html` | **BASE** de estructura organizativa y **SUPPORT** at fixed costs, profile, high | My company panel, setup, locations, equipment, requests, accounts, recurring expenses and profile; `walos_demo_m1_v12` is isolated warehouse | E/A/NV |
| **Z042** | `Modulo 1/cuentas_bancarias_asociadas.html` | **BASE** of Accounts and Information Methods | High/fiche/alias/CBU-CVU/state, share/copy; QR bank data **not accredited** collection | E/A/NV |
| **Z050** | `Modulo 2/WALOS_Modulo2_Kit_Final_UX_v5_1/WALOS_Modulo2_Prototipo_UX_v5_1.html` | **BASE** M2, catalog/stock/purchases and movements | Coverage of 8 areas, forms, purchase, transfer, return, guides/history; `walos_demo_mod2_v5` does not share status with M1/M3 | E/A/NV |
| **Z067** | `Modulo 2/WALOS_Modulo2_Kit_Final_UX_v5_1/referencia/WALOS_Modulo2_v5_original.html` | **LEGISLATION/ SUPPORT** before adjustments | It is useful to compare altered functions between original v5 and subsequent kit; do not choose as final version by name | E/A/NV |
| **Z068** | `Modulo 2/WALOS_Modulo2_Prototipo_viejo.html` | **DUP de Z050** | identical SHA-256; **no** is a different variant even if it is called "old" | E, hash confirmed |
| **Z069** | `Modulo 2/catalogo_modulo2.html` | **BASE** Catalogue and tab | Main gallery/photo, category/type, high/editing, pause, contextual elaboration, guides; normalizing headings | E/A/NV |
| **Z070** | `Modulo 2/walos_compras_y_gastos_separados.html` | **BASE** of UX Purchases + Operating expenses | Lists, filters, drafts, lines, details, attachments and high context; purchase, receipt and payment are made different | E/A/NV |
| **Z071** | `Modulo 2/walos_guias_apoyo.html` | **BASE** of Guide Editor | Independent steps, step images, drafts/publication/file; complementary phase | E/A/NV |
| **Z072** | `Modulo 2/walos_m_dulo_2_inventario_y_control_de_stock(3).html` | **BASE** count/stock control | Counting, Differences and Simulated Conflict Wizard; Real Attendance Doesn't Exist | E/A/NV |
| **Z073** | `Modulo 2/walos_proveedores.html` | **BASE** of Suppliers | Rich sheet, contacts, conditions, media, related purchases and high/edit; do not force to complete all fields | E/A/NV |
| **Z074** | `Modulo 3/WALOS_M3_Cargar_Venta_POS_vNext.html` | **BASE** del **POS design in two steps** | Product selection, review/collect, cart and visual status; does not amount to real QR integration | E/A/NV |
| **Z075** | `Modulo 3/WALOS_Modulo_Ventas_UX_v4_0.html` | **BASE** Sales, Expenses, History and Commercial Closure | Checkout, discount, sales, returns, payments, closing and report; your status is not synchronized with M2 | E/A/NV |
| **Z081** | `Modulo 3/WALOS_Ventas_v4_0/WALOS_Modulo_Ventas_UX_v4_0.html` | **DUP de Z075** | identical SHA-256; used as documentary/capture reference in your folder, **no** as a second implementation | E, hash confirmed |
| **Z092** | `Modulo 3/walos_m3_apertura_y_cierre_v3(2).html` | **SUPPORT** a surrender, reporting and day-flow | Opening/closing steps, counting, mapping, reporting; separate demo storage | E/A/NV |
| **Z093** | `Modulo 3/walos_m3_apertura_y_cierre_v8.html` | **BASE visual** from the Close/Return Assistant, **NO** de su commit | Checklist, quantities, destinations and panel; `commitFinalClosure` lose draft without snapshot (H06); problematic numerical parsing (H07/H26) | E/A/NV |

**Verification of duplicates:** `SHA256(Z050) = SHA256(Z068) = 43141140eac1…` y `SHA256(Z075) = SHA256(Z081) = 50439a1f7d1…`. Therefore, **19 HTML paths = 17 different HTML contents**. `Z067` is an older version **different**, not duplicated. In Z050 the internal title says "v5.0" even if the directory is `v5_1`: use ID/path/hash as source identity, not title.

## 3. Full functional matrix — target screen → source → behavior → risk

This section decides **what to reuse as a design or functional rule**. It does not involve copying scripts, `window.*`, `innerHTML` files `localStorage` From one source to another. **All rows are NV with respect to integrated application**even when the original HTML contains a partial demo.

### 3.1 Global framework, person and organization (first cut E1-A / E1-B)

| Display or destination view | Selected source (main; support) | Preserve design and functionality | Critical rule/what to correct or NOT copy | Priority · Dependencies · references |
|---|---|---|---|---|
| **DEMO access and registration** `/acceso` | **F**; Z014 only as a setup inspiration | Simple form and explicit state "DEMO" | No reusable real log/login of 19 HTML; no simulated password storage or fake effective auth | **P0** · User demo · R01, QA-01 |
| **Uncompanyed personal start-up** `/inicio` | Z014 (setup); Z003 (cards) | Welcome, start up company, join by invitation, profile | Person can exist with 0 companies; without commercial dashboard or catalog WALOS | **P0** · identity/company · R01/R02, D01 |
| **Create/configurate start-up** `/empresas/nueva` | Z014 (`setup`, `submitCompany`); Z001 | Progressive form: name, category/capacity, visual identity; complete configuration later | Historical Founder • Legal holder; single initial responsible; not creating mandatory location/box; not dragging demo WALOS | **P0** · User, Business, Membership · R02, H01; title: specific pending ADR (see §5) |
| **Active company selector** en shell | **F**; Z003/Z014 only as header reference | Show active logo/name and controlled business change | No full multi-company selector in HTML. Change A→B should reset visible data, permissions, queries and associate drafts to correct company | **P0** · scoping por `business_id` · R03/R05, H01/H09/H14; QA-02/20 |
| **Business Home / Dashboard** `/b/:businessId/inicio` | Z003 + Z014; Z050/Z075 as reference to specialized summaries | Compact panel, contextual summary, alerts, big cards and shortcuts | One General Start, **no** three M1/M2/M3 dashboards. Cards lead to actual route or ‘Next’; figures from the same state | **P0** · shell + company · R05, H09; DEMO-01/02 |
| **Top bar and left menu** global | Z003 and catches Z014; support Z050/Z075 | Hamburger left, active company, profile right, drawr responsive; routes without visible modules | A unique path log feeds cards and menu; do not reuse `nav`, `render`, `goto` Global and duplicate submenus | **P0** · router/demo permits · R05, H17/H21; DEMO-01 |
| **My personal profile** `/perfil` | Z014 (`profile`); Z002 modal profile as support | Own data, avatar and separate edition of Enterprise | Global independent business profile; personal data are not cloned or edited from the commercial profile | **P0** · User · R06 |
| **Company details** `/b/:businessId/empresa` | Z001; support Z002/Z014 | Groups of fields, image, contacts, networks, Edit/Save actions | Only active company and permission; actual validations; visible handling of save error; general document manager may differ | **P1** · shell + permissions · R02, H08/H14 |
| **Locations: list and detail** `/b/:businessId/ubicaciones` | Z004; support Z014 and catches `22`–`25` M1 | Cards/filers, status, detail, main, access COMMERCIAL/RESTRINGIDA | Capacity `vender` other than `almacenar`; pause • closing; no local required for services; no erasing history | **P1** · Business + permissions · R07, H02; DEMO-03 |
| **Locations: high/editing/pause** same section | Z004 (`saveNewLocation`, `saveEditedLocation`); Z014 (`submitLocation`) | Short form, pause confirmation, main location | Do not create fictitious deposits; range by location; before pause display earrings and stock | **P1** · locations/manage · R07, H02, QA-21 |
| **Equipment: members/fiche/permits** `/b/:businessId/equipo` | Z002; Z014 as a model of applications/access | List, tab, location, activity and status allocation | Visual role does not grant permission; different founder and administrative holder; preventing leaving business without responsibility | **P1** · Membership + roles · R03/R04, H01/H12/H14; D03, QA-16 |
| **Team: Nominated invitation** Subsistence | Z002 (UI invitation); documentation v4 | Modal/target, role allowed, invitation status | Nominative email with recipient/token/expiration/revocation; not to convert acceptance into general request | **P1** · Membership · R04, H12, D02, QA-17 |
| **Team: link/QR to request admission** Subsistence | Z014 (`copyInvite`, `requestJoin`, `approve`); Z002 (`openReviewRequestModal`) | Share link, pending request, review/approval | Flow **different** Nominated invitation; demo can display it without automatic authorization. First implementation under explicit ADR | **P1** · team/requests · R04, H12, D02 |
| **Accounts and means of collection** `/b/:businessId/cuentas` | Z042; Z014 and M1 catches `18`–`19` | Profile, alias, CBU/CVU, status, copy/share, configurable media | Financial account • payment method • cash fund • day balance; QR information bank does not credit money. Do not place sensitive data in public context | **P1** · BusinessAccount + permisos · R17, H09/H14, D08 |
| **Fixed/recurring costs** subvista Expenses or Company | Z014 (`expenses`, `expenseForm`); M1 spec | Periodic forecast, validity, details; access from expenses with reference in Company | Recurrent plan - expenditure already paid; not generate double output, respect history when changing validity | **P2** · Expenses · R16, QA-23/24 |

**Existing visual reference captures (paths relating to `material_fuente/`):** `Modulo 1/WALOS_Modulo1_v1_2/assets/01_panel_mi_empresa_desktop.png`, `03_datos_empresa.png`, `04_ubicaciones.png`, `06_equipo.png`, `13_mi_perfil.png`, `14_panel_mi_empresa_mobile.png`, `18_datos_empresa_cobros_v11.png`, `22_form_ubicacion_acceso_v12.png`, `24_ficha_colaborador_v12.png`. Key screens were selectively inspected; the image library **does not replace E2E**.

### 3.2 Catalogue, stock, suppliers, purchases and history (first E1-B circuit)

| Display or destination view | Selected source (main; support) | Preserve design and functionality | Critical rule/what to correct or NOT copy | Priority · Dependencies · references |
|---|---|---|---|---|
| **Catalogue: list, search/filters** `/b/:businessId/catalogo` | Z069; Z050 | Cards with photo/icon, type, category, price/state, filters and contextual actions | A catalogue **GOOD/SERVICE** generic: resale, input and processing are capacities of a good; SKU stable by company, homonymous to decide. Remove global canine categories | **P1** · Business, catalogue · R08, H16/H22, D04; DEMO-04 |
| **Catalogue: high/good edition** `/b/:businessId/catalogo/nuevo` y ficha | Z069 (`openItemModal`, `saveItemForm`, gallery); Z050 (`itemForm`) | Progressive form, main photo, gallery, explicit unity, detail | Avoid double catalog between Sales and M2; price "to be quoted" other than zero price; disable does not destroy historical sale | **P1** · units/location optional · R08, H16/H22, QA-35 |
| **Catalogue: service** tab/high | Z069/Z050, extended according to v3/v4 (**no specialized screen complete verified**) | Same basic file and commercial availability, no stock | Do not require lot, location, recipe or balance; fixed price quotation should be differentiated | **P1** · GOOD/SERVICE · R08, H02/H22, QA-09 |
| **Catalogue: context-based elaboration** detail of good | Z069 (`openElaborateModal`); Z050 (`submitElaboration`) | ‘Develop’ action only in goods configured for production and summary of inputs | Do not impose manufacturing on trade or treat transfer as consumption; atomic production/consumption. Not essential to the first route | **P2** · inventory + optional recipe · R21, H19, D13 |
| **Inventory: Listing and stock** `/b/:businessId/inventario` | Z050; Z072 as support | Desktop table + mobile cards, filters by location, physical/reserved/available and separate pending orders | Never negative availability per outstanding order; service has no StockBalance; figures derive from movements, not isolated counters | **P1** · catalogue + locations + leader · R09, H09/H19/H21; DEMO-05 |
| **Inventory: detail and history per article** survey Inventory | Z072 (`openFichaModal`, `openHistorialModal`); Z050 | Statement, movements and balances by location; starting information when applying | Stories belong to the same source of truth record; not "own stock" in Sales | **P1** · ledger and catalogue · R09/R20, H09 |
| **Inventory: counting/reconciliation** `/b/:businessId/inventario/conteo` | Z072 (`initAuditStep1`, `confirmAuditAndApply`, `executeAuditCommit`) | Count Wizard, legible differences, pre-application review and conflict status | Su `concurrencySimulated` is demonstration: a count does not step on sale after; fractional quantities without truncation; adjustment with motive | **P1** (after reception/transfers) · leadger + versions · R11, H07/H19/H26; QA-08/31 |
| **Movements: Listing and new transfer** `/b/:businessId/movimientos` | Z050 (`movementsPage`, `submitMovement`) | Multiple selection, origin/destiny, units, movement cart and summary | Origin/destiny **same company**; retains lump sum; all or nothing; forbids moving more than available; does not copy fixed date 2026-10-30 nor `confirm()` native | **P1** · catalog + inventory + locations · R10, H18/H19; DEMO-05 |
| **Movements: return of fair** subvista Movements/Days | Z050 (`openFairReturn`, `confirmFairReturn`); Z093 destination interface | Expected/counted comparison, choice of destinations, note, departure/day reference | **Do not copy the operation** that it does not count `expected` and returns only `returned`: H25 causes disappearance of difference. Physical return explicit, not automatic to the closure | **P2** · ledger + CashSession + cierre · R10/R18, H25/H06, D06 |
| **Suppliers: Listing/ticket** `/b/:businessId/proveedores` | Z073; Z050 (`suppliersPage`) | Detailed sheet, contact, discounts/promotions, observations, related purchases | Optional advanced fields, secure links, active company supplier | **P1** · Business · R12, H11; DEMO-04 |
| **Suppliers: high/edited** same section | Z073 (`handleFormSubmit`); Z070 high contextual | Progressive form; high fast without leaving Purchase | Optional supplier in purchase according to M2, do not force a fictitious one upon receiving; do not copy incompatible academic validation | **P1** · suppliers + purchases · R12/R13, H11, D10 |
| **Shopping: list/delete/detail** `/b/:businessId/compras` | Z070; Z050 (`purchaseFormOriginalV4`, `submitPurchase`) | Listing, filters, lines, totals, voucher, detail, create provider/article in context | **Register purchase** A line of information does not enter merchandise; supplier may be optional | **P1** · optional supplier + catalog · R13, H11, D10; DEMO-04 |
| **Purchases: receipt of goods** `/b/:businessId/compras/:id/recepcion` | Z050 (purchase/movement model); Z070 (detail); **F** for final Receipt separation | Review of quantities/units/location and clear confirmation | Each reception credits stock **once**, with an idempotent operation; the amount received may differ from the purchased one, without doubling payment or recording bank transfer | **P1** · compras + ledger · R09/R13, H09/H19; QA-STK-01 |
| **Guides: list/reader** `/b/:businessId/guias` | Z050; Z071 | List, search, context read from tab | Does not produce or modify stock by consulting a guide | **P2** · optional catalogue · R19, H24 |
| **Guides: Editor by steps** `/b/:businessId/guias/nueva` | **Z071**; Z050 only as aesthetic guide | Ordered steps, photos/notes by step, draft, publish/archive | The simple global gallery of Z050 **does not replace** images per step; verify focus and save draft | **P2** · permissions + guides · R19, H24 |
| **Cross-sectional history: list/detail** `/b/:businessId/historial` | Z050 (`historyPageOriginalV4`); Z075 (`historyView`, `saleDetail`); Z073 audit visual | Filters by date/location/type, detail, actor, sign +/−, link to purchase/sale/movement | A single line of events per business; demo records are not immutable auditing; permits limit finances and other data | **P1** · all operations · R20, H14/H09; DEMO-07 |

**Reference M2 captures:** `Modulo 2/WALOS_Modulo2_Kit_Final_UX_v5_1/capturas/02_catalogo_escritorio.png`, `02_catalogo_movil.png`, `03_inventario_escritorio.png`, `03_inventario_movil.png`, `04_movimientos_escritorio.png`, `05_proveedores_escritorio.png`, `06_compras_escritorio.png`, `06_compras_movil.png`, `07_guias_escritorio.png`, `08_historial_escritorio.png`. The audit records possible density/cutting of mobile tables (H21): adapt to E1, **no** declare it solved.

### 3.3 Sales, money, days and extensions (first circuit E1-C/E1-D)

| Display or destination view | Selected source (main; support) | Preserve design and functionality | Critical rule/what to correct or NOT copy | Priority · Dependencies · references |
|---|---|---|---|---|
| **Sales: list/summary** `/b/:businessId/ventas` | Z075; catches in folder Z081 | Commercial history, location, operator, status and access to New Sales | Do not duplicate M2 cart/product status; filter data and permissions per business | **P1** · catalog + stock + optional box · R14, H09 |
| **POS: selection of products/services** `/b/:businessId/ventas/nueva` | **Z074 design**; **Z075 logic and variants** | Full wide catalog, unticked search, selection, visible cart and "Review and collect" access | For goods: stock available by origin; for services: **sin** stock or compulsory physical box; do not copy fixed list WALOS | **P1** · catalogue/stock · R14, H02/H09/H22; DEMO-06 |
| **POS: Review, discounts and split payments** subview checkout | Z074 (screen separation); Z075 (`payRows`, `addPay`, `paymentDraftFromDOM`) | Summary by line, discounts, multiple payment means and check before confirming | Main checkout v4 ended with simple selector (**H10**), although it retains functions `payRows/addPay`; rebuilding multi-application IU; total = sum **exact** of payments declared; do not use floats for money | **P1** · accounts + sale + money rules · R14, H10/H26, D07/08; QA-MON-01 |
| **POS: confirmation and internal ticket** sale/detail | Z075 (`completeSale`, `showTicket`, `printTicket`) | Express confirmation, non-tax ticket referenceable/printable in History | A physical sale deducts stock once; ticket | **P1** · venta + ledger + historial · R14/R20, H09/H19; DEMO-06 |
| **Sales: refund/annulment** sub-view detail | Z075 (`returnsLog`, `voidSale`, return functions according to source) | Original sale consultation, detail and controlled return actions | Do not return more units/amount than applied; damaged goods do not automatically return to available; reimbursement | **P2** · Sale + refund + stock · R15, QA-07/30 |
| **Operational expenditure: list/new/detail** `/b/:businessId/gastos` | **Z070** design and form; **Z075** cash flow; Z014 for fixed costs | Full width list, side form, classification, date, amount, background/medium, voucher | Operational expenditure • purchases/receptions • recurring plans; paid expenditure creates exit **once** and only in the indicated background; shared wallet is not working balance | **P1** · accounts + optional day · R16/R17, H09; DEMO-06 |
| **Opening of the day** `/b/:businessId/jornadas` | Z092; Z093; Z075 | Select location/box, cash fund counted, responsible, visible status | The day is **optional** for services operations without cash; do not add up digital balance as initial cash; an open box is not duplicated | **P1** · Location/Account/Register · R18, D05, QA-JOR-01 |
| **Active day: summary** `/b/:businessId/jornadas/:id` | Z075 (commercial summary); Z093 (panel) | Expected cash, digital collections **declared**movements and expenses per day | MP/Bank Account can be shared between days: do not display or restart your global balance as a cash balance; do not invent accreditation | **P1** · sales/expenditures/accounts · R17/R18, H09/H13, QA-25 |
| **Arching and pre-closure review** `/b/:businessId/jornadas/:id/cierre` | **Z093 visual** (checklist/location/destinations); **Z092** surrender; **Z075** count and differences | Wizard with count, differences, observations, review and final confirmation | Default normal count; ‘without arching’ only if approved by ADR/permission; return goods is operation **Other**; Invalid entry `12abc`/`1,2,3` to be rejected | **P1** · box ledger + count · R18, H06/H07/H13/H26, D06 |
| **Snapshot, informe e historial de cierre** `/b/:businessId/jornadas/:id/informe` | **Z075** (`v4SnapshotFor` referred to in audit, report); Z092 (`viewClosureReport`); Z093 **visual only** | Report with actor, date, cut, arching, differences and justifications; print/consult history | **Forbidden to carry `commitFinalClosure()` de Z093:** marca CLOSED y borra `closureDraft` no snapshot. A closure must retain immutable evidence and never reopen by double click | **P1** · ClosureSnapshot + historial · R18/R20, H06/H13, QA-12; DEMO-07 |
| **QR DEMO collection from checkout** in Sales | Z074 (screen ‘waiting confirmation’), Z075 (prevented MP medium); **V4 QR** conceptual guide | Show amount, QR/state of **simulation**, pending/cancelled/approved as **test states** | **QR of sales collection**; Ya Págué button does not credit real payment; never use global vendor/platform as receiver of different companies; no OAuth or actual demo keys | **P1** · checkout + isolated mock · MP v4 ~1–6, QA-MP-01/02; DEMO-08 |
| **Article/fiche QR** from Catalogue | **F**; Z069 as source tab | Eventually link by company/article to sheet and add for sale | It is not QR of collection or payment demonstrated; do not integrate the POS as fixed charge; design for self service only if prioritized | **P2** · catalogue + future public access · MP v4 §1/§5 |
| **Orders/reservations/signs** `/b/:businessId/pedidos` | Z075 contains order mock **only as reference** | Next card, without stating that there is a real order | Version v3/v4 defers module; does not reactivate previous reserved stock logic as if it were validated flow | **P2 FUTURE** · sales/payments/stock · R22, D14 |
| **Business analysis** `/b/:businessId/analisis` | **F**; summaries Z050/Z075 only inspiration | Next card and place reserved for navigation | Do not show "real gain" without costs/commissions/taxes and reconciliation; do not derive global cash balances | **P2 FUTURE** · consolidated transactions · R23, D14 |

**Reference M3 captures:** `Modulo 3/WALOS_Ventas_v4_0/capturas/02_cargar_venta_checkout.png`, `04_gastos_lista.png`, `05_historial.png`, `06_cierre.png`, `07_cierre_asistente.png`, `08_informe.png`, `09_venta_movil.png`. v4 declares partial evidence of its own `02_RIESGOS_Y_QA.md`; **are not interpreted as new tests or as validation of integration**.

## 4. Consolidated selection: which image/UX is adopted and what logic does not

| Area | Initial election E0-A | Specific functional rescue | Discard/change before E1 |
|---|---|---|---|
| **Shell/Start** | Z003 + catches M1 v1.2 | Cards, profile, side menu and summary | Global WALOS markup, segmented menus M1/M2/M3, non-contextualized data |
| **Company/Locations/Team** | Z001, Z004, Z002 | Modals, states, tokens, fields by location; Z014 requests | Visual-only roles, singleton SQL, demand local/deposit |
| **Accounts** | Z042 | Bank card and data sharing | CBU/CVU as confirmation of payment; digital balance inferred |
| **Catalog** | Z069 with integrated style Z050 | Main photo, variants, types, context processing | Veterinary types/global canines, double catalog source |
| **Inventory and transfer** | Z050 + Z072 count | Physical/reserved/available, multiple transfers, count wizard | Stock isolated by HTML, simulated blocking as concurring, fixed date H18, return with loss H25 |
| **Purchases and Suppliers** | Z070/Z073, support Z050 | Listed and forms, fast supplier, token, receipt | Purchase fee, automatic entry of all lines, fictitious mandatory supplier |
| **Guides** | Z071 | Sorting steps, notes and images by step, draft/publication | Replace it with simple Z050 gallery |
| **Sales** | Z074 **UX** + Z075 **rules** | Separate checkout, split payments recovered from inherited functions, ticket | Single payment selector, unsynchronised stock, loose prices/roundings |
| **Days/closure** | Z093 **aspecto visual** + Z075 **report** + Z092 **surrender** | Checklist, arching, differences, historical report | `commitFinalClosure` de v8, `parseInt`/`parseARSStrict`, return/pause/closing confused |
| **Expenditure/History** | Z070 + Z075 + Z050 | Forms, classification, filters and signs | Separate, recurring records as a consummate payment, local logs as a secure audit |
| **QR** | Sales flow Z074 + rules of MP v4 document | IU ‘DEMO’, States by attempt | Submit QR product as collection or manual approval as confirmed payment |

## 5. Units and decisions enabling the first circuit

**Functional dependency (does not involve current implementations):**

`Persona/Empresa/Membresía → Shell/empresa activa → (Ubicaciones opcionales + Catálogo + Cuentas/Proveedores) → Compra → Recepción → Inventario/Movimientos → Venta + pagos declarados → Gasto → Jornada/Cierre → Historial`.

For a **Service without deposit or physical box**: `Persona/Empresa → Catálogo(Servicio) → Venta → Historial`. Do not force to pass through Stock, Shopping or Day.

### Necessary decisions, without silently approving them

| Decision (audit) | Status at close E0-A | Provisional option for prototype; point to be formalized in E0-C |
|---|---|---|
| **Administrative authority** (cross-cutting theme, not identical to audit D01) | **Proposal pending by ADR** | `founder_user_id` history and **an active administrative officer**; transfer/revocation never leaves the company unaccounted for. It does not imply legal property or irrevocable role |
| **D01 — Creating multiple companies** | **Model proposal without trade policy** | Model many companies per person from the start, without commercial limit in demo |
| **D02 — Invitations** | **PENDING** | Keep **dos** different documented flows: nominated by email and link/QR→request→approval. The order of the MVP does not delete the second |
| **D03 — Permits** | **PENDING** | Demo roles and clearly simulated action/location permissions; API must authorize server-by-server |
| **D04 — SKU/names** | **PROPOSAL** | SKU stable single per business, generated if missing; admit homonyms with warning, validate fixed price mode |
| **D05 — Boxes** | **PROPOSAL** | One box per location **use box**, not for every company; model Register for future expansion |
| **D06 — Closure and return** | **PENDING** | Locking with snapshot; without arching **disabled by default**; separate and explicit physical return |
| **D07 — Sale/collection** | **PROPOSAL** | Immediate sale with 1.n declared payments whose sum exactly matches total; future credits/signs |
| **D08 — Currency** | **PROPOSAL** | Currency per company; ARS for fixtures; exact money (centavos/Decimal); no implicit tax billing |
| **D09 — Stock negative** | **PROPOSAL** | Do not allow negative. Separate pending claim; explicit reservations where appropriate |
| **D10 — Provider/reception** | **Keep documented M2 requirement; pending implementation** | Optional supplier; non-receiving, single and idempotent purchase document |
| **D11 — Framework** | **Outside E0-A; proposed for E0-B** | React + TypeScript with screens recreated as components, **no** iframes ni scripts globales |
| **QR collection and sales account** (new V4) | **Confirmed conceptual separation; future real API** | DEMO of related intention to sale; then OAuth by **Each company**, Orders QR, webhooks and reconciliation without sharing tokens |

**Invariants to be carried from E0-A to E0-B/E1:**

1. Any business operation and resource identifies `business_id`with permission and possible `location_id`; personal identity lives outside any company.
2. A reception increases stock **once** and a transfer subtract/credit in **one command only**; balances are derived from the movement register.
3. The sale of physical good uses its stock available; the service sale does not require StockBalance.
4. Discounts and payments are reconciled to the penny; stated collection **no** amounts to bank accreditation.
5. Close saves snapshots and differences before going into closed; never erases evidence, invents decrease or returns stock by itself.
6. Draft forms/carts must belong to the company and, when applied, location of origin; change tenant does not transfer them.
7. A display without implementation displays "Next", a demo operation shows "DEMO" and does not report actual security/concurrence/payment.

## 6. Implementation order arising from the matrix (entry for E0-B/E1)

| Cut | Starting screens | Observable result | Reference tests **outstanding** |
|---|---|---|---|
| **DEMO-01 / E1-A1** | Shell, Personal and business starter, drawer, profile | Menu and cards point to views or "Next", usable on mobile | R05, QA-18 |
| **DEMO-02 / E1-A2** | Create/select company, personal demo account and visual permissions | Company A→B does not leave catalog/sales/displays visible of A; user without valid company | QA-01/02/20, QA-TEN-01/02 |
| **DEMO-03 / E1-B1** | Company, Locations, Equipment, Accounts | Services company without premises; differentiated simulated roles, invitations by modality | QA-09, QA-16/17 |
| **DEMO-04 / E1-B2** | Catalog, Suppliers, Shopping, Reception | 1 or + 1 service; purchase of 10 receive **exactly 10** once | QA-10, QA-STK-01, QA-CAT-01 |
| **DEMO-05 / E1-B3** | Inventory, Movements, Counting | Transfer 3 of origin 10 leaves **7/3** and a single history | QA-06/08, QA-STK-02 |
| **DEMO-06 / E1-C1** | Sales, checkout, expenses | In destination location sell 2 goods + service with discount and **two exact payments**; stock destination passes 3→1 | QA-05/09, QA-MON-01 |
| **DEMO-07 / E1-C2** | Day, arching, closing, report, history | Snapshot with actor, cash count and difference; closure does not reopen or rewrite | QA-11/12, QA-JOR-01/02 |
| **DEMO-08 / E1-D1** | QR **simulated** from Sales | DEMO marked display; pending does not equal to cash; company sales visible | QA-MP-01/02 as future specification |
| **DEMO-09 / E1-D2** | All tours | Keyboard navigation, mobile phones, errors, empty states; no inert control disguised as action | QA-18/19/20, QA-E2E-01 |

**Fixture E2E minimum v4:** create company → create article + service + provider + two locations → purchase and reception of 10 → transfer of 3 → open box at destination location → sell 2 and service with discount and split payments → expense from explicit background → arching and closing → history → change business and check isolation → register service in business without local. **Not executed in E0-A.**

## 7. Specific inherited risks that should NOT be copied

| Finding | Source and problem | Compulsory action in E1/E2 |
|---|---|---|
| **H01/H02/H14** | SQL M1 singleton, global unique membership, misselling dependency–storage and FKs/events without tenant | New model per company; no deposit service business; restrictions and permissions in future backend |
| **H06** | Z093 `commitFinalClosure` mark close and delete draft without snapshot | Rewrite use case; persist unchangeable before closing and displaying errors |
| **H07/H26** | Z093 count `parseInt` and parser supposedly strict accepts malformed amounts | Quantity typed per unit, complete validation, explicit rounding |
| **H08/H09** | Z014/M2/M3 save in separate demo keys and can mute error | Single demo source per company, observable save result, no false success |
| **H10** | Visual checkout v4 uses a medium although it retains functions of several | Rebuild application list and validate accurate total |
| **H11/H12** | Optional provider M2 vs. academic obligation; M1 application link vs nominated TP | Maintain product rules; maintain two separate invitation machines |
| **H13** | Closing without arching v4 vs verification v8 | Default counted closure; explicit ADR and permission if exception enabled |
| **H15/H17** | Duplicate HTML and Overlay Global Functions | Use IDs/hash; new components and services without overwriting `render/nav` |
| **H16/H22** | Optional single name and SKU in repo vs automatic SKU M2; "to quote" service | Generic capacity model; product contracts and restrictions |
| **H18/H19** | A simulated literal date in transfer and ‘concurrence’ | Correct date and version/cut; locks and matching **only** backend |
| **H21/H24** | Tables dense mobile shopping; basic M2 editor loses guides per step | Tables→ mobile cards; keep rich editor separate |
| **H25** | Returns count 10 of origin and credits 8 to destination, losing 2 without explicit adjustment | Keep difference by slope/traceable adjustment, do not delete balance automatically |

## 8. Pending validation to avoid transforming preference into fact

**Uniform status of selections:** candidate **E/A/NV** until running E1 in browser. The best was chosen **initial reference** by function using the audit and static inspection. It is not claimed to be visually the best final version in each width/state; catches only represent point states.

Before **consolidate the implemented screen**, check in browser (minimum desktop 1440 and mobile 430; expand 320/390/768 and zoom 200%):

- Z003/Z014: menu/start without WALOS dependency, enterprise-free user profile and designed A/B selector.
- Z001/Z004/Z002/Z042: forms, keyboard, pause confirmations, location access, actions without permission.
- Z069/Z050/Z072/Z073/Z070: search, tiles, optional fields, multiple lines, fractional units, counting and transfer.
- Z074/Z075: cart, discount, 1..n payments, sale service without deposit, history and ticket.
- Z092/Z093/Z075: count, differences, closure and report without loss of evidence; separate physical return.
- Load/empty/error status, focus/reading, save drafts when changing screen, indicators **DEMO** and not fictitious confirmation.

**Proof that this document does NOT state:** React, backend, security, real payments, tenant or IC switching. These functions do not yet exist as integration.

## 9. Act E0-A and transfer to E0-B

### Delivered

- [x] 19/19 HTML paths identified and classified; 17 different contents by SHA-256.
- [x] Target matrix with main source/support, design, features to be preserved, rules and conflicts Hxx/Dxx.
- [x] Priority of the first circuit and dependencies, including service without stock or physical box.
- [x] Explicit separation between QR of tab and QR of collection; QR of collection **DEMO** by sale, MP OAuth/Orders/posterior webhooks.
- [x] Registration of proposed/pending decisions, without silent approval.
- [x] Known risks and accepted controls inherited from audit/v4.

### Not realized, deliberately

- [ ] Interactive browser tests and definitive visual measurements.
- [ ] Frontend/backend programming and integration testing.
- [ ] Approved ADRs, final UML or OpenAPI contracts.
- [ ] Modification of the TP or external repositories.

### Accurate input for E0-B

With this matrix, prepare `docs/01_NAVEGACION_Y_ARQUITECTURA.md` with: single application router, menu/cards from a single route definition, person hierarchy→companies→locations, separation status `session`/`business`/`draft`, internal DEMO repository contracts, inventory and money operations, React+TypeScript structure and minimum ADRs **marked by status**. **No** merge old HTML; rebuild components with evidence from this matrix. Start implementation E1 only with the explicit provisional rules and P0 cases approved for that increase.

---

**Responsible for the device:** E0-A integration assistance; **Final functional approval:** project manager, still outstanding.  
**Sources preserved without alteration:** ZIP v3, ZIP audit and plan v4.  
**Related documentation:** audit `03_COMPARATIVA_UX.md`, `01_DIAGNOSTICO.md`, `02_INVENTARIO_Y_COBERTURA.md` y plan v4 `02_BACKLOG_VERTICAL_Y_PRUEBAS.md`.