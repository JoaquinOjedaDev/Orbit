# E3-1A / E3-1B — Visual specification, HTML→REAL matrix and acceptance criteria

**Project:** Orbit, multi-company and multi-rub platform. **WALOS is just an example company.**  
**Date:** 11/11/2026. **Base:** `main fd46c8d586c4a44a4dca06e853780d2aa9b9eee1`, E3-0 and T12 integrated.  
**Origin:** 14 HTML provided by the user; and `frontend/src` de React REAL y DEMO.  
**Status:** E3-1A conceptually approved, first change of E3-1B in branch **DRAFT** For review before merge.

> **Rule of precedence:** React REAL and FastAPI contracts are the source of behavior; HTMLs are aesthetic references/UX. Original documentation E3-1 (14 HTML audit) contains full evaluation. This file records executable decisions and the specific scope of the first increment. No global JavaScript, Tailwind CDN, mocks or `demoStore`.

## 1. Final matrix of references and destination

| HTML provided | REAL / Current React display | What to reuse now or later | Scope decision |
|---|---|---|---|
| `Menu_Principal(3).html` | `RealAuthApp` + `RealBusinessesPage` | Side navigation, business header, access hierarchy | **E3-1B: shell**; dashboard con KPI en **E3-1H** |
| `Boton_Editar_Perfil_Empresa(2).html` | `RealBusinessesPage` | Data blocks, context editing, avatar placeholder | **E3-1C**; REAL image later on E3-2 |
| `Lista de Empleados(2).html` | `RealTeamPage` | Employee directory, filters and visible permissions | **E3-1C**; roles exclusively of backend |
| `Ubicaciones(2).html` | `RealLocationsPage` | Headquarters sheets, indicators SELL/STORE, principal/state | **E3-1C**without physical deletion or policy change |
| `catalogo_modulo2(4).html` | `RealCatalogPage` | Cards, filters, prices, supplies/services, detailed sheet | **E3-1D**; fotos con placeholder, sin upload real |
| `walos_proveedores(2).html` | `RealSuppliersPage` | Contact tabs, promotions, accepted payments if API returns them | **E3-1D** |
| `walos_compras_y_gastos_separados.html` | `RealPurchasesPage` | High by line, supplier, dates and identifiable reception | Purchases **E3-1E**; out-of-scope expenditure |
| `walos_m_dulo_2_inventario_y_control_de_stock(3)(3).html` | `RealInventoryPage` | Balance by headquarters, movement, counting, transfers | **E3-1F**, respect leadger, versioning and atomic operations |
| `WALOS_M3_Cargar_Venta_POS_vNext(1).html` | `RealPosPage` + `RealPosCheckout` | Cart, separation amount/unit price, payments declared | **E3-1G**, no optimistic confirmation or QR accredited |
| `WALOS_Modulo_Ventas_UX_v4_0(3).html` | `RealSalesPage` | Listing, receipts, filters, statuses and navigation | **E3-1G**; orders/reserves after |
| `walos_guias_apoyo(1).html` | No REAL module | Styles, instructional, step organization | **Backlog E3-3**, not REAL operational link |
| `walos_m3_apertura_y_cierre_v3(2).html` | `CashSessionsPage` **only DEMO** | Opening and arching flow | **Backlog E3-4**; no REAL box |
| `walos_m3_apertura_y_cierre_v8(1).html` | `CashSessionsPage` **only DEMO** | Mobile variant and closure confirmation | **Backlog E3-4**, compare later with v3 |
| `cuentas_bancarias_asociadas(1).html` | `FinancialAccountsPage` **only DEMO** | Associated Accounts and Media Viewing | **Backlog E3-4**; no REAL financial backend |

**Screens without specific HTML prototype:** registration/login, personal profile, acceptance of invitation, reception detail, adjustments/transfers, Real Home without sales, reports/analytical, REAL images. They will be designed from the common system, without inventing endpoints.

## 2. Approved Style: Design tokens minima

- **Product name:** Orbit, never `WALOS` fixed. Real company business name from FastAPI.
- **Palette:** navigation `#162A47`, primary `#2563EB`, background `#F4F6FA`, surface `#FFFFFF`, border `#DCE5EF`, text `#172943`, secondary `#64748B`.
- **Typography:** Inter with system alternatives; never mandatory CDN dependence on Tailwind/Google.
- **Radios:** base `14px`soft cards and large buttons, without copying 14 variants of global CSS. Soft Shadow `0 5px 22px rgba(23,41,67,.055)`.
- **CSS:** new tokens `--pyme-ui-*` and prefixed rules `rw-*`; to retain existing DEMO and auth CSS. Do not incorporate Tailwind unless a justified future decision is made.
- **Responsive:** persistent sidebar desktop; mobile `≤900px` with drawer and background; compact topbar to `≤600px`; 360, 390, 768, 1280 px wide test.
- **Accessibility:** semantic buttons, `aria-current`, visible focus, Escape/Tab menu and focus return, real tags and error messages. Do not use color as the only signal.

## 3. REAL E3-1B Navigation and Isolation

**Profile/identity:** My companies, My profile, Accept invitation and Create company (via existing screens).  
**Company:** My company, Locations, Equipment, Catalog, Suppliers, Purchases and Receptions, Inventory and Movements, Point of sale, Sales History.  
**Hidden in REAL:** Expenses, Cashier, Accounts, Guides, Reports, Orders/Reserves and QR of collection. DEMO can keep them with clear label. **Do not show "Next" by occupying operating menu space.**

**Change of company:**

1. Selector only contains memberships verified by `GET /api/v1/businesses` authenticated actor. No DEMO logos/names/balances are used.
2. The route includes the UUID of the tenant. `RealAuthApp` takes the screen by route; the shell goes back `usuario + empresa activa` and abort pending readings. **No forms, headquarters or carts of the previous tenant in memory**; existing idempotency records continue to be segregated by tenant, user and operation.
3. The frontend currently **no tiene TanStack Query ni RTK Query**; therefore it is not appropriate to introduce `queryClient.clear()` ni `resetApiState()` If a cache library is installed in the future, any query key must include `businessId` and the tenant transition must expressly invalidate it.
4. If the company does not appear in the list or query fails, the shell does not display operations links for that tenant. **no** replaces backend permissions; the API continues to protect each GET/POST.
5. Do not persist token REAL in `localStorage`/`demoStore`The session is still exclusively in memory, with re-entry after F5.

**Important:** el shell **no** introduces a global headquarters selector. Each operation maintains its selection and validation of SELL/STORE locations; a change of location does not imply authorization.

## 4. Functional risks to prevent in subsequent increments

- **E3-1C:** visible role as per `Membership.role`; do not simulate Owner/Worker, or grant access by concealment or display a card.
- **E3-1D:** cost/price and type of article come from backend; the visual presence of photography does not imply real media loading functionality.
- **E3-1E:** Register purchase does not move stock; full and unique reception requires STORE headquarters and idempotence. Preserve safe recovery after timeout.
- **E3-1F:** not calculate end-of-sales balances in IU or issue adjustments/transfers ignoring `version`, 409 or headquarters permits.
- **E3-1G:** do not use **Optimistic IU** to confirm sales that alter inventory. Keep CTA confirmation inactive during shipping, review of original attempt and same `Idempotency-Key` in recovery; never generate new key after uncertain timeout. Show single-read/candade unit price for operational roles, editable quantity and total per line; discounts only to authorized roles. `MERCADO_PAGO_DECLARADO` **no** process funds.
- **E3-1H:** **onboarding with actual empty states**: (1) create first headquarters, (2) create article, (3) start stock at STORE headquarters, (4) supplier/buyer, (5) POS. Show "no data" instead of fake KPI or example WALOS records. When starting E3-1H check permissions: `STOCK_INICIAL` only holder/admin.

## 5. Exact scope of the first PR E3-1B

**It does include:** CSS tokens isolated, REAL side shell, header, API-based enterprise selector, navigation to existing REAL paths, loading/mistake states, mobile drawer with Escape/Tab, route tests and scope limits. You can contain this definition document without modifying the governing documents 01–05/T12.

**Does not include:** rewrite forms/business, migrations, APIs, permission changes, REAL images, KPI dashboard, interactive onboarding, productive accounts/box/QR, modification of `demoStore`, global refactor of `App.css`, new routes or changes in POS operations.

### Criteria for reviewing and approving E3-1B

1. REAL Login → My companies → select A → view your menu; switch to B and confirm absence of data/cart/forms from A.
2. User with only one company, user with several companies, suspended company, company without headquarters and API response 401/403/404.
3. Desktop 1280 px and mobile 390 px: sidebar, topbar, drawer, Escape, Tab, button close and selection with keyboard.
4. Verify URL navigation and Back button; there are no links to Box/Counts/Guides/QR falsely REAL.
5. CI: `npm run build`, `npm run lint`, Node frontend tests, Playwright REAL and DEMO tests; if only the shell is modified, backend must remain unchanged. Compare visual captures before Merge is authorized.
6. Human review of aesthetics and navigation; **DRAFT until express approval of merge**.

**Expected result:** REAL logic remains intact, but the user sees an integrated structure similar to Main Menu HTML; the rest of the modules will gradually be redesigned in E3-1C..H.