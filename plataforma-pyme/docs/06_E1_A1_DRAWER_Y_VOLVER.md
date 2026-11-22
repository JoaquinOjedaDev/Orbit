# E1-A1.2 — Drawer global y retorno contextual

**Status:** Implemented in GitHub main; compilation, lint and pending local manual tests for validation.
**Date:** 2026-11-06.
**Scope:** menu behavior and back between screens in shell E1-A. It does not implement authentication, permissions, React Router or real business features.

## Decisions implemented

1. **Global burger:** button with three stripes up to the left; open the overlay menu on desktop or mobile.
2. **Blocked background:** The backdrop darkens and captures clicks outside. The central container receives the HTML inert attribute; it should not be able to interact with background content or keyboard. Scrolling is blocked while the menu is open.
3. **Closure:** X, click on background, Escape or section selection; focus is directed to the closing button when opening and returns to burger when closing; Tab is kept inside the open menu.
4. **Optional fixed menu preference:** additional controls are available on the desktop to fix the panel (expanded/compact/hidden). The burger works as a modal drawer always. The default mode of the new design is **Hidden**. The local key is assistant-pyme.sidebar-mode.v2 to not inherit the previous design.
5. **Volver contextual:** In internal screens, Back appears. If the previous navigation path of the prototype belongs to the same company, the history is used; if it does not exist or corresponds to another company/other site, it goes to the start of the active company. In profile/create company and unknown routes, the backup destination is /start.
6. **Business navigation:** /b/businessId/section. WALOS/Trade/Services are fixed, not real tenants.

## Main Files

- frontend/src/App.tsx: open menu handling, scrolling, internal history and Back button.
- frontend/src/app/shell/TopBar.tsx: Global burger, Return button and fixed menu controls.
- frontend/src/app/shell/SideMenu.tsx: role dialog, aria-modal, focus management, backdrop closure.
- frontend/src/App.css: modal layer on desktop and mobile; z-index and visual.
- frontend/src/app/shell/sidebarPreference.ts: hidden initial mode, local persistence v2.
- frontend/src/app/navigation.ts and frontend/src/app/Icon.tsx: icon back.

## Validation required (not executed on this delivery)

From the platform-pyme/frontend folder:

~~~powershell
git pull --ff-only origin main
npm.cmd run build
npm.cmd run lint
npm.cmd run dev
~~~

| Test | Procedure | Expected |
|---|---|---|
| E1-DRAWER-01 | On desktop, open from three lines | Panel on the page and dark background |
| E1-DRAWER-02 | Tap button or empty area outside the menu | Close without activating background content |
| E1-DRAWER-03 | Open and press Escape or X | Close and return focus to the three lines |
| E1-DRAWER-04 | Open and navigate with Tab and Shift+Tab | Focus remains inside the menu |
| E1-DRAWER-05 | Open and choose Catalog in WALOS | Browse to Catalog and Close Menu |
| E1-DRAWER-06 | In /b/walos-demo/catalog, use Back | Return to the previous section in WALOS or your Home |
| E1-DRAWER-07 | Open internal path directly into new tab and use Back | Return to the start of that company; it does not go externally |
| E1-DRAWER-08 | Switch between companies and use Back | It does not mix company contexts |
| E1-DRAWER-09 | Repeat on screen 390 px | Drawer accesible, capa oscura y cierre |
| E1-DRAWER-10 | Compact fix, hide and open burger | Drawer presents all labels; closing respects preference |
| E1-DRAWER-11 | Refresh page with saved preference | Holds fixed mode, but does not open the drawer automatically |

## Pending

- Build, Lint and team browser testing results.
- React Router integration and shared state by company in E1-A2.
- Actual authorization guards and multitenant isolation in backend (E3).
- Profile/Company Creation and other functional sections.

No global scripts or simulated permissions were copied from the reference HTML; only interaction patterns were retained.
