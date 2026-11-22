# E1-A1 — First shell React and DEMO navigation

**Date:** 2026-11-06  
**Status:** Code **published in GitHub**; compilation and navigation on computer equipment **VERIFICATION PENDINGS**.  
**Repository/branch:** JoaquinOjedaDev/Orbit, main.  
**Scope:** first visual increase following E0-A/E0-B/E0-C; **no** the approved whole E1-A1 and the complete integrated prototype are declared.

## 1. Code implemented (without ensuring execution)

| Piece | Path | Reference and limit |
|---|---|---|
| Shell / layout | frontend/src/App.tsx, frontend/src/App.css | E0-A Z003/Z014; implementation framework |
| Menu and Fixtures Record | frontend/src/app/navigation.ts | Common map for sidebar and cards; test business |
| Typized iconography | frontend/src/app/Icon.tsx | Own SVG, no icon dependencies |
| Enlaces con History API | frontend/src/app/AppLink.tsx | Temporary; **React Router pending according to ADR-007** |
| Top bar and selector | frontend/src/app/shell/TopBar.tsx | Fixtures selector; no authentication or authorization |
| Sidebar responsive | frontend/src/app/shell/SideMenu.tsx | Side menu, mobile navigation, DEMO badge |
| Home personal/business | frontend/src/features/dashboard/Dashboards.tsx | Panel, tool cards, intentional empty values |
| Views without implementation | frontend/src/features/common/Feedback.tsx | ‘Next’, 404, not found |
| Reset and finish | frontend/src/index.css, frontend/index.html | Visual identity based on Z003/Z014 |
| Instructions | frontend/README.md | Local start and boundaries |

**No change** Project-3-AppAdmin-Pascotas/ nor Project-3-Extended-Generic/. No HTML 19 scripts were imported or merged, no accounts or databases were created, credentials were not touched.

## 2. What to verify locally (NOT executed here)

At the root of the repository, after saving any other local changes:

~~~powershell
git status --short
git pull --ff-only origin main
cd plataforma-pyme/frontend
npm.cmd install
npm.cmd run build
npm.cmd run lint
npm.cmd run dev
~~~

Open the Vite URL. **Not to say “passed” until you got the actual outputs**.

| ID | Manual test / command | Expected outcome | Status |
|---|---|---|---|
| E1A-BOOT-01 | npm.cmd run build | TS + Vite complete without errors | NOT EXECUTED |
| E1A-LINT-01 | npm.cmd run lint | No Lint Errors | NOT EXECUTED |
| E1A-NAV-01 | /start → WALOS → Catalog → Back | Navigation without blank screens; Catalogue says "Next" | NOT EXECUTED |
| E1A-NAV-02 | Probar back/forward del navegador | Routes change and sidebar indicates destination | NOT EXECUTED |
| E1A-UX-01 | Mobile size 390 px and desktop | Drawer opens/closing, visible cards, no horizontal scroll accidental | NOT EXECUTED |
| E1A-TEN-UI-01 | Change WALOS ↔ Services Example | Header and page reflect selected company | NOT EXECUTED |
| E1A-ROUTE-01 | /b/other business/start | ‘Company not available’, without data from other fixes | NOT EXECUTED |
| E1A-DEMO-01 | Review dashboard and forms | No false figures or actions they supposedly keep | NOT EXECUTED |

**Clarification:** E1A-TEN-UI-01 verifica UX de fixtures, **no** real isolation of tenants; that work starts at E1-A2 and is truly assured in backend E3.

## 3. Work pending to close E1-A1 and continue E1-A2

1. Ejecutar y corregir **build**, **lint** and browser tests. Register bugs or observed results.
2. Incorporate React Router by means of normal npm installation, synchronized package.json update and lockfile and controlled navigation refactor. Avoid posting packages.json desync from package-lock.
3. Crear shells de componentes/guards de rol **DEMO** and accessible focus when changing route.
4. E1-A2: global profile, company creation, businessId membership and single demo status; add A/25070B change tests and drafts.
5. Later: E1-B catalog/stock/purchase; E1-C sales/box; E1-D QR demo. None is implemented now.

## 4. Delivery result

**Verifiable status:** files present in GitHub, not tests executed in this response.  
**Next team action:** git pull → npm.cmd run build → npm.cmd run lint → npm.cmd run dev, report exits to close E1-A1 without confusing documentation with tests.

**Main source of design:** 00_MATRIZ_INTEGRATION_HTML.md (Z003/Z014); architecture: 01_ARQUITECTURA_FRONTEND.md; backlog: 02_DECISIONS_Y_BACKLOG.md; ADRs: ADR-001/007/008.
