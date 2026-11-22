# Orbit frontend

The React frontend runs in two modes. The browser demo uses sample data stored locally. The connected workspace uses FastAPI and PostgreSQL.

## Run locally

Follow the [setup guide](../../docs/getting-started.md). Use `/inicio` for the demo and `/real/login` for the connected workspace.

## Checks

From this directory, run `npm run build` and `npm run lint`. See the [browser test guide](e2e/README.md) for end-to-end checks.

The connected workspace covers accounts, companies, locations, team access, catalog, suppliers, purchasing, stock movements, and sales. Display QR codes are for demonstration and cannot accept payments.

---

## Historical archive E1 — Initial DEMO (preserved)

# Orbit — Frontend (DEMO)

Generalistic management platform for multiple companies and sectors, developed within the Programming TP 2. WALOS is just an example business, **no** the product or its compulsory category.

**Status:** E1-A1 (shell/navegación) verificado por el equipo con build, lint y revisión visual. E1-A2.1 (perfil personal y creación de empresas DEMO) validado visualmente por el equipo. E1-B1 (Datos de la Empresa editables) validado visualmente y con persistencia por el equipo; compilación/lint de ese corte no confirmadas. E1-B2 (avatar, contacto y función por empresa) validado funcionalmente por el equipo. E1-B3 de Ubicaciones validado funcionalmente en el navegador por el equipo. E1-B3.1 (Google Maps y compartir) validado manualmente por el equipo. E1-B4 (Equipo e invitaciones DEMO) validado funcionalmente por el equipo. E1-B5 (Catálogo DEMO) validado funcionalmente por el equipo; su ficha ampliada y el bug de modal fueron corregidos y el último build/lint informó cero errores y cero advertencias. E1-B6 (Proveedores DEMO) validado funcionalmente por el equipo. E1-B7 (Compras y recepción DEMO) validado funcionalmente por el usuario. E1-B8 (Inventario y Movimientos DEMO) validado manualmente por el usuario. E1-B9 (Control de stock multiartículo DEMO) validado funcionalmente por el usuario. E1-B10 (imágenes de fichas en IndexedDB) validado en el equipo: build, lint, 6 tests y funcionamiento visual. E1-C1 (Ventas DEMO conectadas a Inventario) ya probado funcionalmente por el usuario; E1-C1.1 (selector visual POS con fotos, filtros y stock por ubicación) publicado y pendiente de build/lint/QA local. E1-C2 (Gastos y Apertura/Cierre DEMO) probado visual y funcionalmente por el usuario, incluido cierre con diferencia y snapshot persistido. E1-C3 (Cuentas y medios DEMO) y E1-C3.1 (asociación opcional de cuentas en Ventas/Gastos) validados en build, lint y QA manual por el usuario. E1-D1 (QR visual DEMO y completar el último medio) validado manualmente por el usuario, incluida la aprobación rechazada si se desactiva el artículo antes de confirmar. E1-D2 agrega recorridos automatizados de navegador escritorio/móvil, QA de integración y documentación de cierre; sin seguridad backend todavía. No hay autenticación, autorización real, backend ni pagos externos verificados.

## Ejecutar en VS Code

From the **repository root**:

~~~powershell
cd plataforma-pyme/frontend
npm.cmd install
npm.cmd run build
npm.cmd run lint
npm.cmd run dev
~~~

Si **You're already located.** inside platform-pyme/frontend, **Don't ever do cd again.**: runs directly git pull, npm.cmd run build, npm.cmd run lint and npm.cmd run dev.

Open http://localhost:5173/inicio. No PostgreSQL, FastAPI or Market Payment is needed for this DEMO. I stopped Vite with Ctrl+C or q and Enter.

## What works in DEMO

- **Personal Home:** three fixes and companies you create in this browser.
- **My profile:** Visible name, DEMO mail, optional avatar initials and DEMO phone. The profile is global. The job function is edited by company, about the DEMO membership, without confusing it with role or permissions.
- **Create a company:** name, activity Products / Services / Mixed, optional heading and description. Creates an active DEMO membership and registers initial administrative founder/owner.
- **Top selector:** all companies in this local environment, including new ones.
- **Business start:** summary and access to modules (operations still pending).
- **Company details:** commercial card with immediate editing by field name, heading, slogan, presentation and optional fictitious CUIT. Keeps changes for each company after F5 if localStorage is available.
- **Locations:** High, edition, list, main, pause and reactivation. Local/Ferial/deposit/office/other types; separate sale and storage, no mandatory location for services or stock/box creation. Optional Google Maps links: search address, paste a point link and copy it voluntarily to share; no API maps or pin selected within the platform.
- **Google Maps and share:** optional field for pasting map sharing link, address search and button to copy name/address/link. It is not integrated map or auto geocoding.
- **Work equipment:** initial administrative holder, fictitious collaborators and invitations per company. Invite does not send emails or create users: only "Simulate acceptance" adds a fictitious member. Cancellation and rejection available, without effective permissions.
- **Catalogue:** own elaboration, resale, input and service; high, edition, SKU optional unique by company, unit, category, search, filters, disable/reactivate, ARS prices in whole cents. **Ver ficha** opens a modal with commercial data, dates and internal observations separated from the description. Do not create stock.
- **Suppliers:** list and company files with contact, offers, validated URLs, WhatsApp international, accepted payment means, informative promotions, search and low logic. There are no automatic discounts or real supplier history; the tokens start empty in DEMO.
- **Purchases:** multi-line, optional supplier, catalog article or free concept, proof reference, ARS prices and exact quantities, history, filters and snapshots tab. **Register does not receive or pay**; a later and explicit reception generates tickets by physical item and suitable location, only once per purchase.
- **Inventory and Movements:** stock by physical item and location derived from receptions, transfers, counting and sales outlets. The inventory list reuses the photo of the same company's Catalog tab (or an icon if there is no photo). Transfers record atomic output and input; counts record difference with reason. No negatives or automatic unit changes. A company without physical items can have empty stock.
- **Stock control by location (E1-B9):** Multi-article session with progress, "Not counted" other than "Mark 0", difference review and atomic confirmation. History shows a drop down row per session; "Quick adjustment" is retained by product.
- **Optional images (E1-B10):** Select/replace/remove JPG, PNG or WebP photos of Company Data (logo), Catalog, Suppliers, Locations and Personal Profile. They are saved optimized in IndexedDB browser, isolated by company and tab. They are associated from Edit after creating each tab and do not alter the inventory.
- **DEMO sales (E1-C1):** POS, cart with goods and services, ARS discount, multiple declared payments with exact reconciliation to the penny, history and internal voucher. Complete balance now use the **last payment medium** without changing the previous ones. A good seller generates a way out in the inventory ledger and the retry with the same requestId does not duplicate the sale. There is no real bank charge.
- **Visual QR DEMO (E1-D1) charge:** from a sale with **a single medium Market Declared payment**, creates PENDING intention with illustrative image **not scanable**. Pending or cancelled does not create sale or stock account. "Simulate approval" records a DEMO sale for the same Sales gateway; does not move money or credit external payments. History per company, idempotency and recovery when reloading.
- **Accounts and means (E1-C3/C3.1):** bank and wallet by company, alias or CBU/CVU example, editing, main, disable/reactivate, filters and copy. In Sales and Expenses a compatible active account can be optionally associated; **Transfer** allows you to choose a virtual bank or wallet, while specific wallet media retain your filter. Inactive ones are not offered for new operations and historical reference is retained. Without moving money or verifying transfers or bank balances; never use real data.
- **DEMO expenditure (E1-C2):** operational revenues by category, location and half declared. Only a cash expense from an OPEN box is projected to the expected cash of that day. Registering purchase does not constitute paying it.
- **Opening and closing of the Box (E1-C2):** Days by location or general box with initial background, sales and cash outflows explicitly linked, counted archaeology, explained difference and snapshot of persistent and immutable closure. It does not represent bank balances nor moves inventory. Sales without prior day continue to work but do not enter retroactively archeos.
- **Three-line menu:** drawer modal; locks the background and closes from the bottom, Escape, X or when choosing a section.
- **Optional fixed menu:** expanded, compact or hidden on desktop, with local preference.
- **Volver:** context within the same company or at its Home.
- **Modules not yet developed:** ‘Next’ clear screen.

## Routes

- /start
- /profile
- /enterprises/new
- /b/walos-demo/start
- /b/trade-demo/start
- /b/services-demo/start
- /b/walos-demo/company
- /b/walos-demo/locations
- /b/walos-demo/equipment
- /b/walos-demo/catalogue
- /b/walos-demo/suppliers
- /b/walos-demo/purchase
- /b/walos-demo/sales
- /b/walos-demo/expenses
- /b/walos-demo/days
- /b/walos-demo/accounts
- /b/walos-demo/inventory
- /b/walos-demo/movements


For created companies, the identifier is incorporated in /b/:businessId/start.

The routing temporarily uses History API; **React Router is not yet integrated**.

## Organization

~~~text
src/
├── App.tsx
├── app/
│   ├── navigation.ts, Icon.tsx, AppLink.tsx, types.ts
│   └── shell/
│       ├── SideMenu.tsx
│       ├── TopBar.tsx
│       └── sidebarPreference.ts
├── data/demo/
│   ├── demoStore.ts        # perfil/empresas/ubicaciones y miembros DEMO
│   ├── teamPolicy.ts        # roles, email y vencimiento de invitaciones
│   ├── catalogPolicy.ts     # tipos de catálogo, SKU, unidades y centavos
│   ├── supplierPolicy.ts    # proveedores, canales seguros y promociones
│   ├── purchasePolicy.ts    # compras, cantidades y totales enteros
│   ├── inventoryPolicy.ts   # movimientos, traslados, conteos y saldos
│   └── mapsLinks.ts        # validación de enlaces Google Maps
└── features/
    ├── dashboard/Dashboards.tsx
    ├── profile/ProfilePage.tsx
    ├── locations/LocationsPage.tsx
    ├── team/TeamPage.tsx
    ├── catalog/CatalogPage.tsx
    │   └── CatalogDetailDialog.tsx
    ├── suppliers/
    │   ├── SuppliersPage.tsx
    │   ├── SupplierForm.tsx
    │   └── SupplierDetailDialog.tsx
    ├── purchases/
    │   ├── PurchasesPage.tsx
    │   ├── PurchaseForm.tsx
    │   └── PurchaseDetailDialog.tsx
    ├── inventory/
    │   ├── InventoryPage.tsx
    │   └── InventoryActionForm.tsx
    ├── businesses/BusinessPages.tsx
    └── common/Feedback.tsx
~~~

## Security and data limits

- The information is stored in **browser localStorage** with a versioned key. E1-B1, E1-B2, Locations, Google Maps and Team retain the previous key/format of E1-A2 to keep track of profiles and companies created; file overrides, job functions, locations (including optional map), invitations, members, catalog, suppliers, purchases/receptions inventory operations and sales, expenses and days DEMO by businessId. It is DEMO and does not synchronize with other devices.
- Do not use real names, emails or business data; anyone who has access to the browser can read or modify this data.
- The IU does not constitute authentication, permit control, secure multitenant isolation, backup or persistence assurance.
- The founder and initial administrative holder are different fields but both point to the global DEMO identity in this increase; transfers and invitations **Actual** There is only simulated invitation and acceptance on Team, without mail, token or access.
- The purchase receptions, transfers and counting adjustments are now the local leader of DEMO Inventory. No reservations, batch costs, real financial integration or QR of item/coal are implemented. Sales and payments are local declarations without external accreditation. A purchase without receipt does not create stocks. Documents and scheduled changes remain pending. Uploading images to a server is also pending. Company, Catalog, Suppliers, Locations and Profile images are local and can already be uploaded to DEMO.
- React Router, automated interface testing, integration of original HTML remaining, API contracts, TP3 and backend remain pending. Pure unitary tests are available for Maps, Equipment, Catalog, Suppliers, Purchases, Inventory, images, sales/payment rules, cash/expenditure policies and DEMO accounts validation.

## QA y decisiones

- ../docs/04_E1_A1_PRIMER_SHELL.md — shell inicial
- ../docs/05_E1_A1_MENU_ADAPTABLE.md — sidebar adaptable
- ../docs/06_E1_A1_DRAWER_Y_ BACK.md — burger and sailing
- ../docs/07_E1_A2_PERFIL_EMPRESES_DEMO.md — profile, creation and acceptance tests
- ../docs/08_E1_B1_DATES_EMPRESA.md — Z001 integration, context editing and testing
- ../docs/09_E1_B2_PERFIL_GLOBAL_Y_FUNCION_EMPRESA.md — global avatar, contact and job function per company
- ../docs/10_E1_B3_UBICATIONS_DEMO.md — locations by company and tests
- ../docs/11_E1_B3_MAPS_Y_COMPARTIR.md — map by link, opening and voluntary copy
- ../docs/11_E1_B3_1_GOOGLE_MAPS_Y_COMPARTIR.md — map link and copy by location; run also `npm.cmd run test:maps`
- ../docs/12_E1_B4_EQUIPMENT_INVITIONS_DEMO.md — equipment, simulated invitations and tests; execute also `npm.cmd run test:team`
- ../docs/13_E1_B5_CATALOGO_DEMO.md — multi-rub and test catalogue; execute also `npm.cmd run test:catalog`
- ../docs/14_E1_B5_1_FICHA_CATALOGO.md — modal tab and internal observations, compatible with previous tabs
- ../docs/15_E1_B6_PROVEEDORS_DEMO.md — suppliers, contacts, informational conditions and tests; also execute `npm.cmd run test:suppliers`
- ../docs/16_E1_B7_COMPRAS_RECEPTION_DEMO.md — purchases by company, snapshots, single reception and QA; execute also `npm.cmd run test:purchases`
- ../docs/17_E1_B8_INVENTORY_MOVALS_DEMO.md — ledger, stock, transfers, counting and QA; execute `npm.cmd run test:inventory`
- ../docs/18_E1_B9_CONTROL_STOCK_MULTIPLE.md — multi-article inventory control by location and QA; use `npm.cmd run test:inventory`
- ../docs/19_E1_B10_IMAGENES_DEMO.md — local images for Catalog, Suppliers, Locations and Profile; run `npm.cmd run test:images`
- ../docs/20_E1_C1_VENTAS_DEMO.md — POS, discounts, declared payments and sales leader; execute `npm.cmd run test:sales`
- ../docs/21_E1_C1_1_SELECTOR_VISUAL_VENTAS.md — cards with photos, stock and filter to add to Sales without altering payments; run build/lint and visual QA
- ../docs/22_E1_B7_1_COMPRA_LOCATION_RECEPTION.md — Saved Purchase flow and pending reception location
- ../docs/23_E1_C2_GASTS_Y_CAJA_DEMO.md — Expenditure, days, archaeic, cash rules and QA; execute `npm.cmd run test:cash`
- ../docs/24_E1_C3_FINDINGS_Y_MEDIUM_DEMO.md — Reference accounts, wallets, data protection, isolation and QA; execute `npm.cmd run test:accounts`

Architecture E0-B and ADR-001/002/007 remain as **Proposed**, subject to validation of the equipment. Your adoption DEMO does not imply definitive approval.

## Browser integration tests E1-D2

In addition to `npm.cmd run build`, `npm.cmd run lint` y los tests `npm.cmd run test:...`There are real routes of **Playwright / Chromium** in two formats: desktop and mobile. Playwright dependencies are isolated in `e2e/`; the frontend's package-lock was not altered.

```powershell
# Desde plataforma-pyme/frontend
npm.cmd ci
cd e2e
npm.cmd install
npx.cmd playwright install chromium
npm.cmd test
```

Tests create their own browser context and fictitious data. Validate valid and foreign routes, placeholder, focus/ESC of the drawer, absence of horizontal scroll, catalog isolation, QR intention, F5, cancellation and unique approval. CI executes this suite along with unitary tests and retains evidence of failure. **They don't replace** the actual user QA on local images, box, physical sales or permissions of future server.

The matrix and limits of this stage are at `../docs/27_E1_D2_INTEGRACION_Y_CIERRE_FRONTEND.md`.
