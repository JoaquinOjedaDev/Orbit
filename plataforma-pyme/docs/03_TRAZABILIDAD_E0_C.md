# E0-C — Requirements tracing, HTML references and testing

**Date:** 2026-11-06  
**Status:** Documentary proposal of E0-C; **are not executed tests or capacities already implemented**.  
**Path:** `plataforma-pyme/docs/03_TRAZABILIDAD_E0_C.md`.  
**Sources:** E0-A `00_MATRIZ_INTEGRACION_HTML.md` (IDs Zxxx, Hxx and Dxx), E0-B `01_ARQUITECTURA_FRONTEND.md`, plan v4 (DEMO-01..09, API-01..06, TP3-01.02), previous audit.

## 1. Conventions and scope

- **Rxx:** functional references used by the E0-A matrix; this document **does not create new approved requirements**.
- **Zxxx:** HTML source ID of the ZIP v3. **Not copied** el script global. `F` = missing HTML in full, designing new view.
- **Hxx:** existing audit finding. **Dxx** in E0-A means a historic decision pending; **ADR-xxx** refers to the technical decision proposed in E0-C. They are not equivalent.
- **Operation:** command conceptual name/consultation of `AppGateway`, no endpoint implementado ni contrato OpenAPI definitivo.
- **Test:** if the acceptance is planned. **NOT EXECUTED** in all ranks.
- **Cut:** E1-A shell/tenence, E1-B catalog/stock, E1-C trade/box, E1-D QR/E2E, E2/E3 backend.

## 2. Matrix requirements → HTML/find → path → operation → test

| Req / corte | Main sources and risk | Destination path or component | Conceptual operation (`AppGateway`) | Proof of acceptance pending |
|---|---|---|---|---|
| R01 · E1-A | F, Z014; H01 | `/acceso`, `/inicio` | `startDemoSession`, `endDemoSession` | DEMO-TEN-01: non-company user starts and sees creation |
| R02 · E1-A | Z014, Z001; H01 | `/empresas/nueva` | `createBusiness` | QA-ONB-01: creates member and sole holder initial admin |
| R03 · E1-A | F, Z003/Z014; H01/H14 | `BusinessSelector`, `/b/:businessId/inicio` | `selectActiveBusiness`, `getBusinessContext` | QA-TEN-01/02; A→B without leaks |
| R04 · E1-B | Z002, Z014; H12; D02 | `/b/:businessId/equipo` and invitations | `inviteByEmail`, `requestMembership`, `approveRequest` | QA-INV-01; request does not automatically authorize |
| R05 · E1-A | Z003/Z014; H17 | `AppShell`, `/inicio`, `/b/:businessId/inicio` | `getNavigation`, `getDashboard` | DEMO-NAV-01: menu and card same destination |
| R06 · E1-A | Z014 (profile) | `/perfil` | `getProfile`, `updateProfile` | Personal identity is not duplicated by company |
| R07 · E1-B | Z004, Z014; H02 | `/b/:businessId/ubicaciones` | `createLocation`, `pauseLocation` | No deposit service; location B not visible in A |
| R08 · E1-B | Z069/Z050; H16/H22; D04 | `/b/:businessId/catalogo` | `createCatalogItem`, `updateCatalogItem` | QA-CAT-01: good/service, SKU en tenant |
| R09 · E1-B | Z050/Z072; H09/H19 | `/b/:businessId/inventario` | `getStockProjection` | Same figure in inventory, POS and tab |
| R10 · E1-B | Z050; H18/H25 | `/b/:businessId/movimientos` | `transferStock` | DEMO-STK-02: 10→7/3, overtransfer rejected |
| R11 · E1-B | Z072; H07/H19/H26 | `/b/:businessId/inventario/conteo` | `reconcileStockCount` | Layout adjustment; invalid formatting not truncated |
| R12 · E1-B | Z073; H11 | `/b/:businessId/proveedores` | `createSupplier`, `updateSupplier` | Optional provider, linked to active business |
| R13 · E1-B | Z070/Z050; H11 | `/b/:businessId/compras` | `registerPurchase` | Purchase does NOT increase stock before reception |
| R14 · E1-B | Z070/Z050; H09/H19 | `/b/:businessId/compras` detalle | `receivePurchase` | DEMO-STK-01 / QA-STK-01: a reception +10 |
| R15 · E1-C | Z074/Z075; H09/H10 | `/b/:businessId/ventas` | `createSale`, `getSale`future `refundSale` | DEMO-MON-01: exact payments, single output; return does not exceed original |
| R16 · E1-C | Z070/Z075/Z014; H09 | `/b/:businessId/gastos` | `recordExpense` | An exit by actual expense, explicit fund |
| R17 · E1-B/C | Z042/Z014; H09/H14 | `/b/:businessId/cuentas` | `createFinancialAccount`, `listAccounts` | Cash balance of wallet |
| R18 · E1-C | Z092/Z093/Z075; H06/H07/H13/H25 | `/b/:businessId/jornadas` and closure | `openCashSession`, `closeCashSession` | DEMO-JOR-01 / QA-JOR-01: full snapshot |
| R20 · E1-C | Z050/Z075 | `/b/:businessId/historial` | `getBusinessHistory` | Same event correlates sale, payment, stock and closing |
| R21 · Future | Z069/Z050; H19 | Well-crafted sheet | `registerProduction` future | Optional development, pending atomic consumption |
| R22 · Future | Partial Z075; D14 | `/b/:businessId/pedidos` | `createOrder` future | ‘Next’, no actual ghost reserve |
| R23 · Future | F; D14 | `/b/:businessId/analisis` | `getAnalytics` future | ‘Next’, without figures presented as actual profit |
| R24 · E1-D | Z074 + MP v4; H10 | `QrPaymentDemo` from checkout | `createQrDemoIntent`, `simulateQrOutcome` | DEMO-MP-01: pending |
| TP3 · E2/E3 | Appropriation TP3 + ADR-008 | FastAPI and subsequent technical documents | `ApiGateway` + endpoints a definir | TP3-01/02, ≥5 requirements and ≥10 unit tests executed |

**Note on R24:** local QR tag entered in v4. Used as **planning trail**; it is not claimed to be a pre-existing Rxx in historical documentation.

## 3. Critical findings matrix → ADR → control

| Finding / cause | ADR and provisional decision | Pending control |
|---|---|---|
| H01/H02/H14: tenant singleton, global role and forced location | ADR-001/002; global user and scoped membership, no deposit services | DEMO-TEN-01 / QA-TEN-01/02 / QA-ONB-01 |
| H12: Nominated invitation vs QR/link application | ADR-003; maintain two flows | QA-INV-01 |
| H16/H22: SKU/names/types | ADR-004; SKU per tenant, good/service | QA-CAT-01 |
| H07/H26: parseInt and quantity/mached amounts | ADR-004/005/006; strict parseo, pennies, climbing unit | DEMO-MON-01, DEMO-STK-02 |
| H09/H19: divergent stocks, false contributence | ADR-001/004/007; leadger and single gateway | QA-STK-01/02/03 |
| H25: return disappearing units | ADR-004/005; independent movement and explicit difference | Return test pending for P2 cut |
| H10: single-media checkout despite multiple rules | ADR-006; 1..n exact applications | DEMO-MON-01 |
| H06/H13: deleted unverified draft / closure | ADR-005; snapshot before CLOSED, without arching disabled | DEMO-JOR-01 / QA-JOR-01/02 |
| H08/H15/H17: fragmented storage and rendering | ADR-007; UI single, router/gateway | DEMO-NAV-01, DEMO-TEN-01 |
| QR of chip confused with payment QR | ADR-006; QR collection DEMO and seller per company in future API | DEMO-MP-01 / QA-MP-01/02/03 |

## 4. Minimum tests for first implementation E1-A

| Test | Preparation | Action | Expected outcome |
|---|---|---|---|
| E1A-BOOT-01 | `frontend` created, installed dependencies | `npm run dev` | UI loads without console errors or critical exception |
| E1A-NAV-01 | Dashboard with cards, menu | Click on each card/item | Real view or explicit placeholder; valid path |
| E1A-NAV-02 | Width 1440 and 390/430 px | Open/Close Drawer, Navigate Keyboard | Works and controlled focus; not inaccessible content |
| E1A-TEN-01 | User without companies | Enter `/inicio` and create a company A | Visible company and an initial DEMO administrative holder |
| E1A-TEN-02 | User with A and B, different roles | Alternate A→B→A | Data, roles, location and drafts are not mixed |
| E1A-TEN-03 | User without membership A | Paste route `/b/A/catalogo` | No attributes or A data |
| E1A-DRAFT-01 | Cart/DEMO form linked to A | Elegir B | No A content appears; visible conservation policy |
| E1A-PLACEHOLDER-01 | Unimplemented path | Enter from Menu | ‘Next’, without buttons that appear to be stored |

**Limits:** a UI DEMO test does not test real isolation, cross-process atomity, credentials, payments or backend. It did not declare "passed" until it was executed and recorded command/environment/results.

## 5. From E1 to TP3 and API (without changing the backend today)

| Stage | Requisitos backend de v4 | Central tests |
|---|---|---|
| API-01/02 | FastAPI/SQLAlchemy/Alembic/PostgreSQL/Docker/CI; auth, User/Business/Membership, scoping | QA-TEN-01/02, QA-ONB-01, QA-INV-01 |
| API-03 | Catalog BIEN/SERVICE, SKU by tenant, suppliers, locations | QA-CAT-01 |
| API-04 | Purchase, idempotent reception, stock, transfer, actual attendance | QA-STK-01/02/03 |
| API-05 | Sales, discount, payments, expense, refund, audit | QA-MON-01/02 |
| API-06 | Day, arching, closing, snapshot, race cut/sale | QA-JOR-01/02 |
| MP-01/03 | OAuth seller by company, Orders QR, verified webhooks, reconciliation | QA-MP-01/02/03 |
| TP3-01/02 | Matrix of the five unitary requirements and evidence/CI/defensive | ≥10 unit tests **Actual**, saved results |

## 6. Status of evidence and maintenance

- **E0-A:** static inspection and reused audit. Validated E2E No.
- **E0-B:** design proposal. No backend or frontend created.
- **E0-C:** ADRs + Prioritisation + Traceability. All the evidence in this document is **PENDING/NOT EXECUTED**.
- When implementing each feature: add real component path, test name and result to this matrix; if you change a rule, update ADR first.
- Responsible for implementing/testing/approve: assign on the team task table (not inventing people or dates).

**Output criterion for E1-A:** proposed revised architecture, P0 convertible issues in commits, identified E0-A design source, defined observable tests and no actual API requirements incorporated by accident.