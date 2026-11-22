# E1-A1.1 — Adaptable side menu

**Status:** Implemented in code and published in main; compilation/lint and visual behavior of this revision pending to be executed on the computer.

**Objective:** improve the validated shell with captures, without altering the board or initiating functional modules.

## Behavior

| Environment | Initial State | Action | Outcome |
|---|---|---|---|
| Desktop (>900 px) | Expanded | Panel button on the top bar | Compact: icons only |
| Desktop (>900 px) | Compacto | Panel button | Expanded: icons and texts |
| Desktop (>900 px) | Expanded or compact | Hide Side Menu button on the top bar | Hidden: Central panel uses free space |
| Desktop (>900 px) | Hidden | Show side menu button | Expanded |
| Mobile (≤900 px) | Closed | Burger button | Overlay Drawer |
| Mobile (≤900 px) | Open | Button, background, Escape or navigation | Cierra el drawer |

Preference **desktop** is saved in localStorage with key assistant-pyme.sidebar-mode.v1. It is a global preference **visual only**; it does not depend on the chosen company. If localStorage is blocked, expanded mode is used during the session. The mobile menu does not change that preference: it is a temporary drawer.

In compact mode the links remain real, accessible with keyboard, aria-label, aria-current for active route and title to display names when passing cursor.

## Modified Files

- frontend/src/App.tsx: Status controller, persistence and Escape.
- frontend/src/app/shell/sidebarPreference.ts: local mode validation and storage.
- frontend/src/app/shell/TopBar.tsx: desktop mode controls and mobile drawer.
- frontend/src/app/shell/SideMenu.tsx: clases y etiquetas accesibles.
- frontend/src/app/AppLink.tsx: optional title and aria-current.
- frontend/src/app/navigation.ts and frontend/src/app/Icon.tsx: two panel icons.
- frontend/src/App.css: rules of compact/hidden and mobile visibility.

The dashboard and its cards remain functionally unchanged. "All sections" had been removed previously by duplicating the side menu.

## Pending validation

Run from platform-pyme/frontend:

~~~powershell
git pull --ff-only origin main
npm.cmd run build
npm.cmd run lint
npm.cmd run dev
~~~

**Test matrix to be recorded:**

| ID | Verification | Expected outcome | Status |
|---|---|---|---|
| MENU-01 | Desktop, panel button twice | Expanded → compact → expanded | Not executed |
| MENU-02 | Desktop, Hide and Show | Work area expands and menu returns | Not executed |
| MENU-03 | Save compact/hidden and upgrade F5 | Keeps desktop mode | Not executed |
| MENU-04 | Change WALOS ↔ another demo | Visual preference equal; active menu changes | Not executed |
| MENU-05 | 390 px: open, close with background, Escape and links | Temporary Drawer and Without Persistent Overlay | Not executed |
| MENU-06 | Switch from 390 px to desktop with open drawer | Drawer closes; respects desktop preference | Not executed |
| MENU-07 | Tab keyboard on compact links | Visible focus and accessible destination | Not executed |
| MENU-08 | npm.cmd run build | TypeScript and Vite without errors | Not executed |
| MENU-09 | npm.cmd run lint | Zero warnings/errors | Not executed |

**Limit:** Local visibility status is NOT user management or multitenant isolation; React Router, profile, company creation and real state by tenant are still provided for in E1-A2/E2-E3.

**Source:** E0-A Z003/Z014; 01_ARQUITECTURA_FRONTEND.md y 02_DECISIONES_Y_BACKLOG.md.
